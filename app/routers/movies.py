
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app import models, schemas


router = APIRouter(
    prefix="/movies",
    tags=["Movies"]
)


@router.post(
    "/",
    response_model=schemas.MovieResponse,
    status_code=status.HTTP_201_CREATED
)
def create_movie(
    movie: schemas.MovieCreate,
    db: Session = Depends(get_db)
):
    title = movie.title.strip()

    if not title:
        raise HTTPException(
            status_code=422,
            detail="Movie title cannot be empty"
        )

    existing_movie = db.scalar(
        select(models.Movie).where(
            func.lower(models.Movie.title) == title.lower()
        )
    )

    if existing_movie:
        raise HTTPException(
            status_code=409,
            detail="Movie already exists"
        )

    new_movie = models.Movie(
        **{**movie.model_dump(), "title": title}
    )

    try:
        db.add(new_movie)
        db.commit()
        db.refresh(new_movie)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Movie already exists"
        )

    return new_movie


@router.get(
    "/",
    response_model=list[schemas.MovieResponse]
)
def get_all_movies(
    db: Session = Depends(get_db)
):
    statement = select(models.Movie).order_by(
        models.Movie.id
    )

    movies = db.scalars(statement).all()

    return movies


@router.get(
    "/{movie_id}",
    response_model=schemas.MovieResponse
)
def get_movie(
    movie_id: int,
    db: Session = Depends(get_db)
):
    movie = db.get(models.Movie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Movie not found"
        )

    return movie


@router.put(
    "/{movie_id}",
    response_model=schemas.MovieResponse
)
def update_movie(
    movie_id: int,
    movie_data: schemas.MovieUpdate,
    db: Session = Depends(get_db)
):
    movie = db.get(models.Movie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Movie not found"
        )

    for field, value in movie_data.model_dump().items():
        setattr(movie, field, value)

    db.commit()
    db.refresh(movie)

    return movie


@router.delete(
    "/{movie_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db)
):
    movie = db.get(models.Movie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Movie not found"
        )

    db.delete(movie)
    db.commit()
