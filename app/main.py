
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import Base, engine
from app import models
from app.routers import movies,theaters,shows


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="3D Movie Booking System",
    description="Movie booking backend using FastAPI",
    version="1.0.0",
    lifespan=lifespan
)


app.include_router(movies.router)
app.include_router(theaters.router)
app.include_router(shows.router)

@app.get("/")
def home():
    return {
        "message": "Welcome to 3D Movie Booking System"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "movie-booking-api"
    }
