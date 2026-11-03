
from fastapi import FastAPI

app = FastAPI(
    title="3D Movie Booking System",
    description="Backend API for 3D cinema ticket booking",
    version="1.0.0"
)


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
