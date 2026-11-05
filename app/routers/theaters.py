
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas


router = APIRouter(
    tags=["Theaters and Screens"]
)


def get_row_label(index: int) -> str:
    return chr(ord("A") + index)


@router.post(
    "/theaters/",
    response_model=schemas.TheaterResponse,
    status_code=status.HTTP_201_CREATED
)
def create_theater(
    theater_data: schemas.TheaterCreate,
    db: Session = Depends(get_db)
):
    existing_theater = db.scalar(
        select(models.Theater).where(
            func.lower(models.Theater.name)
            == theater_data.name.lower(),
            func.lower(models.Theater.city)
            == theater_data.city.lower(),
            func.lower(models.Theater.address)
            == theater_data.address.lower()
        )
    )

    if existing_theater:
        raise HTTPException(
            status_code=409,
            detail="Theater already exists at this address"
        )

    theater = models.Theater(
        **theater_data.model_dump()
    )

    db.add(theater)
    db.commit()
    db.refresh(theater)

    return theater


@router.get(
    "/theaters/",
    response_model=list[schemas.TheaterResponse]
)
def list_theaters(
    db: Session = Depends(get_db)
):
    statement = select(models.Theater).order_by(
        models.Theater.id
    )

    return db.scalars(statement).all()


@router.get(
    "/theaters/{theater_id}",
    response_model=schemas.TheaterResponse
)
def get_theater(
    theater_id: int,
    db: Session = Depends(get_db)
):
    theater = db.get(models.Theater, theater_id)

    if theater is None:
        raise HTTPException(
            status_code=404,
            detail="Theater not found"
        )

    return theater


@router.post(
    "/theaters/{theater_id}/screens",
    response_model=schemas.ScreenResponse,
    status_code=status.HTTP_201_CREATED
)
def create_screen(
    theater_id: int,
    screen_data: schemas.ScreenCreate,
    db: Session = Depends(get_db)
):
    theater = db.get(models.Theater, theater_id)

    if theater is None:
        raise HTTPException(
            status_code=404,
            detail="Theater not found"
        )

    existing_screen = db.scalar(
        select(models.Screen).where(
            models.Screen.theater_id == theater_id,
            func.lower(models.Screen.name)
            == screen_data.name.lower()
        )
    )

    if existing_screen:
        raise HTTPException(
            status_code=409,
            detail="Screen already exists in this theater"
        )

    screen = models.Screen(
        theater_id=theater_id,
        **screen_data.model_dump()
    )

    for row_index in range(screen_data.total_rows):
        row_label = get_row_label(row_index)

        for seat_number in range(
            1, screen_data.seats_per_row + 1
        ):
            seat = models.Seat(
                row_label=row_label,
                seat_number=seat_number,
                seat_type="REGULAR"
            )

            screen.seats.append(seat)

    try:
        db.add(screen)
        db.commit()
        db.refresh(screen)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Screen could not be created due to a conflict"
        )

    return screen


@router.get(
    "/theaters/{theater_id}/screens",
    response_model=list[schemas.ScreenResponse]
)
def list_screens(
    theater_id: int,
    db: Session = Depends(get_db)
):
    theater = db.get(models.Theater, theater_id)

    if theater is None:
        raise HTTPException(
            status_code=404,
            detail="Theater not found"
        )

    statement = select(models.Screen).where(
        models.Screen.theater_id == theater_id
    ).order_by(models.Screen.id)

    return db.scalars(statement).all()


@router.get(
    "/screens/{screen_id}/seats",
    response_model=schemas.SeatLayoutResponse
)
def get_screen_seats(
    screen_id: int,
    db: Session = Depends(get_db)
):
    screen = db.get(models.Screen, screen_id)

    if screen is None:
        raise HTTPException(
            status_code=404,
            detail="Screen not found"
        )

    statement = select(models.Seat).where(
        models.Seat.screen_id == screen_id
    ).order_by(
        models.Seat.row_label,
        models.Seat.seat_number
    )

    seats = db.scalars(statement).all()

    return {
        "screen_id": screen.id,
        "screen_name": screen.name,
        "total_rows": screen.total_rows,
        "seats_per_row": screen.seats_per_row,
        "total_seats": len(seats),
        "seats": seats
    }
