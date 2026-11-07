
from app.database import Base, engine
from app.models import BookingHold, BookingHoldSeat


def main():
    Base.metadata.create_all(
        bind=engine,
        tables=[
            BookingHold.__table__,
            BookingHoldSeat.__table__,
        ],
        checkfirst=True,
    )
    print("Booking tables created successfully.")


if __name__ == "__main__":
    main()
