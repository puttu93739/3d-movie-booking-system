
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import Base, engine
from app import models
from app.routers import movies,theaters,shows
from app.routers import bookings,auth


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
app.include_router(bookings.router)
app.include_router(auth.router)

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


from fastapi.middleware.cors import CORSMiddleware

# Keep your existing FastAPI app, routers and configuration.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)
