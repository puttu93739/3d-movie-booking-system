
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

from sqlalchemy.exc import IntegrityError


router = APIRouter(
    prefix="/shows",
    tags=["Shows"]
)

CLEANING_MINUTES = 15


def validate_schedule(
    db: Session,
    data: schemas.ShowCreate,
    exclude_show_id: int | None = None
):
    movie = db.get(models.Movie, data.movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Movie not found"
        )

    screen = db.get(models.Screen, data.screen_id)

    if screen is None:
        raise HTTPException(
            status_code=404,
            detail="Screen not found"
        )

    start = data.start_time.astimezone(timezone.utc)

    if start <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=422,
            detail="Show start time must be in the future"
        )

    end = start + timedelta(
        minutes=movie.duration_minutes
    )

    occupied_end = end + timedelta(
        minutes=CLEANING_MINUTES
    )

    statement = select(models.Show).where(
        models.Show.screen_id == data.screen_id,
        models.Show.start_time < occupied_end,
        models.Show.end_time
        + timedelta(minutes=CLEANING_MINUTES) > start
    )

    if exclude_show_id is not None:
        statement = statement.where(
            models.Show.id != exclude_show_id
        )

    conflict = db.scalar(statement.limit(1))

    if conflict is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Screen already occupied by show "
                f"{conflict.id}"
            )
        )

    return start, end


def commit_show_changes(db: Session):
    try:
        db.commit()

    except IntegrityError as error:
        db.rollback()

        constraint_name = getattr(
            getattr(error.orig, "diag", None),
            "constraint_name",
            None
        )

        if constraint_name == "ex_shows_no_overlap":
            raise HTTPException(
                status_code=409,
                detail="Screen is already occupied during this time"
            ) from error

        if constraint_name == "ck_shows_valid_interval":
            raise HTTPException(
                status_code=422,
                detail="Show end time must be after start time"
            ) from error

        raise

@router.post(
    "/",
    response_model=schemas.ShowResponse,
    status_code=status.HTTP_201_CREATED
)
def create_show(
    data: schemas.ShowCreate,
    db: Session = Depends(get_db)
):


    start, end = validate_schedule(db, data)

    show = models.Show(
        movie_id=data.movie_id,
        screen_id=data.screen_id,
        start_time=start,
        end_time=end,
        ticket_price=data.ticket_price
    )

    db.add(show)
    commit_show_changes(db)
    db.refresh(show)

    return show


@router.get(
    "/",
    response_model=list[schemas.ShowResponse]
)
def list_shows(
    movie_id: int | None = None,
    screen_id: int | None = None,
    db: Session = Depends(get_db)
):
    statement = select(models.Show)

    if movie_id is not None:
        statement = statement.where(
            models.Show.movie_id == movie_id
        )

    if screen_id is not None:
        statement = statement.where(
            models.Show.screen_id == screen_id
        )

    statement = statement.order_by(
        models.Show.start_time,
        models.Show.id
    )

    return db.scalars(statement).all()


@router.get(
    "/{show_id}",
    response_model=schemas.ShowResponse
)
def get_show(
    show_id: int,
    db: Session = Depends(get_db)
):
    show = db.get(models.Show, show_id)

    if show is None:
        raise HTTPException(
            status_code=404,
            detail="Show not found"
        )

    return show


@router.put(
    "/{show_id}",
    response_model=schemas.ShowResponse
)
def update_show(
    show_id: int,
    data: schemas.ShowUpdate,
    db: Session = Depends(get_db)
):
    show = db.get(models.Show, show_id)

    if show is None:
        raise HTTPException(
            status_code=404,
            detail="Show not found"
        )

    start, end = validate_schedule(
        db,
        data,
        exclude_show_id=show_id
    )

    show.movie_id = data.movie_id
    show.screen_id = data.screen_id
    show.start_time = start
    show.end_time = end
    show.ticket_price = data.ticket_price

    commit_show_changes(db)
    db.refresh(show)

    return show


@router.delete(
    "/{show_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_show(
    show_id: int,
    db: Session = Depends(get_db)
):
    show = db.get(models.Show, show_id)

    if show is None:
        raise HTTPException(
            status_code=404,
            detail="Show not found"
        )

    db.delete(show)
    db.commit()
