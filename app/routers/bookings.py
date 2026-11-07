
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import or_, select, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BookingHold, BookingHoldSeat, Seat, Show
from app.schemas import (
    AvailabilityResponse,
    BookingResponse,
    HoldCreate,
    HoldResponse,
    ReleaseResponse,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

HOLD_DURATION = timedelta(minutes=5)


def now_utc():
    return datetime.now(timezone.utc)


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def lock_show(db: Session, show_id: int):
    """
    Serialize all booking writes for one show.

    This requires PostgreSQL and must run inside
    the same transaction as the availability check
    and the subsequent write.
    """
    db.execute(
        text("SELECT pg_advisory_xact_lock(:namespace, :show_id)"),
        {"namespace": 2606, "show_id": show_id},
    )


def blocked_seats(db: Session, show_id: int, now: datetime):
    query = (
        select(BookingHoldSeat.seat_id)
        .join(
            BookingHold,
            BookingHoldSeat.hold_id == BookingHold.id,
        )
        .where(
            BookingHold.show_id == show_id,
            or_(
                BookingHold.status == "CONFIRMED",
                (
                    (BookingHold.status == "HELD")
                    & (BookingHold.expires_at > now)
                ),
            ),
        )
    )
    return set(db.scalars(query).all())


def find_hold(db: Session, hold_id: UUID, token: str):
    hold = db.scalar(
        select(BookingHold).where(
            BookingHold.id == hold_id,
            BookingHold.token_hash == token_digest(token),
        )
    )
    if hold is None:
        raise HTTPException(404, "Hold not found")
    return hold


def expire_old_holds(db: Session, show_id: int, now: datetime):
    holds = db.scalars(
        select(BookingHold).where(
            BookingHold.show_id == show_id,
            BookingHold.status == "HELD",
            BookingHold.expires_at <= now,
        )
    ).all()

    for hold in holds:
        hold.status = "EXPIRED"


@router.get(
    "/shows/{show_id}/availability",
    response_model=AvailabilityResponse,
)
def availability(
    show_id: int,
    db: Session = Depends(get_db),
):
    if db.get(Show, show_id) is None:
        raise HTTPException(404, "Show not found")

    now = now_utc()
    unavailable = blocked_seats(db, show_id, now)

    return AvailabilityResponse(
        show_id=show_id,
        unavailable_seat_ids=sorted(unavailable),
        server_time=now,
    )


@router.post(
    "/holds",
    response_model=HoldResponse,
    status_code=201,
)
def create_hold(
    payload: HoldCreate,
    db: Session = Depends(get_db),
):
    try:
        lock_show(db, payload.show_id)

        show = db.get(Show, payload.show_id)
        if show is None:
            raise HTTPException(404, "Show not found")

        now = now_utc()

        if show.start_time <= now:
            raise HTTPException(
                409, "Show has already started"
            )

        valid_ids = set(
            db.scalars(
                select(Seat.id).where(
                    Seat.screen_id == show.screen_id,
                    Seat.id.in_(payload.seat_ids),
                )
            ).all()
        )

        if valid_ids != set(payload.seat_ids):
            raise HTTPException(
                422,
                "One or more seats do not belong to this screen",
            )

        expire_old_holds(db, payload.show_id, now)

        conflicts = sorted(
            set(payload.seat_ids)
            & blocked_seats(db, payload.show_id, now)
        )

        if conflicts:
            raise HTTPException(
                409,
                detail={
                    "message": "Seats unavailable",
                    "seat_ids": conflicts,
                },
            )

        token = secrets.token_urlsafe(32)

        hold = BookingHold(
            show_id=payload.show_id,
            token_hash=token_digest(token),
            status="HELD",
            expires_at=now + HOLD_DURATION,
        )

        db.add(hold)
        db.flush()

        for seat_id in payload.seat_ids:
            db.add(
                BookingHoldSeat(
                    hold_id=hold.id,
                    seat_id=seat_id,
                )
            )

        db.commit()

        return HoldResponse(
            hold_id=hold.id,
            show_id=hold.show_id,
            seat_ids=payload.seat_ids,
            status="HELD",
            expires_at=hold.expires_at,
            hold_token=token,
        )

    except Exception:
        db.rollback()
        raise


@router.post(
    "/holds/{hold_id}/confirm",
    response_model=BookingResponse,
)
def confirm_hold(
    hold_id: UUID,
    x_hold_token: str = Header(...),
    db: Session = Depends(get_db),
):
    try:
        hold = find_hold(db, hold_id, x_hold_token)
        show_id = hold.show_id

        lock_show(db, show_id)
        db.refresh(hold)

        now = now_utc()

        if hold.status == "CONFIRMED":
            return BookingResponse(
                booking_id=hold.id,
                show_id=show_id,
                seat_ids=[s.seat_id for s in hold.seats],
                status="CONFIRMED",
                confirmed_at=hold.confirmed_at,
            )

        if hold.status != "HELD":
            raise HTTPException(
                409, f"Hold is {hold.status}"
            )

        if hold.expires_at <= now:
            hold.status = "EXPIRED"
            db.commit()
            raise HTTPException(
                409, "Hold has expired"
            )

        # Confirming a reservation must not be allowed
        # after the show begins.
        show = db.get(Show, show_id)
        if show is None or show.start_time <= now:
            raise HTTPException(
                409, "Show is no longer bookable"
            )

        hold.status = "CONFIRMED"
        hold.confirmed_at = now

        seat_ids = [s.seat_id for s in hold.seats]

        db.commit()

        return BookingResponse(
            booking_id=hold.id,
            show_id=show_id,
            seat_ids=seat_ids,
            status="CONFIRMED",
            confirmed_at=hold.confirmed_at,
        )

    except Exception:
        db.rollback()
        raise


@router.post(
    "/holds/{hold_id}/release",
    response_model=ReleaseResponse,
)
def release_hold(
    hold_id: UUID,
    x_hold_token: str = Header(...),
    db: Session = Depends(get_db),
):
    try:
        hold = find_hold(db, hold_id, x_hold_token)

        lock_show(db, hold.show_id)
        db.refresh(hold)

        if hold.status == "CONFIRMED":
            raise HTTPException(
                409,
                "Confirmed booking cannot be released",
            )

        if hold.status == "HELD":
            hold.status = (
                "EXPIRED"
                if hold.expires_at <= now_utc()
                else "CANCELLED"
            )

        status = hold.status
        db.commit()

        return ReleaseResponse(
            hold_id=hold.id,
            status=status,
        )

    except Exception:
        db.rollback()
        raise
