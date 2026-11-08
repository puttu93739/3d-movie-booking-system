from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Index, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base

from sqlalchemy import CheckConstraint
import uuid
from sqlalchemy.dialects.postgresql import UUID

from datetime import datetime


from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID, uuid4

class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    genre: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    language: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        String(1000),
        default=""
    )

    # Define the unique index AFTER the title column
    __table_args__ = (
        Index(
            "uq_movies_title_normalized",
            func.lower(func.trim(title)),
            unique=True
        ),
    )

    shows: Mapped[list["Show"]] = relationship(
        back_populates="movie"
    )


class Theater(Base):
    __tablename__ = "theaters"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    address: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    screens: Mapped[list["Screen"]] = relationship(
        back_populates="theater",
        cascade="all, delete-orphan"
    )
    __table_args__ = (
        Index(
            "uq_theater_identity_normalized",
            func.lower(func.trim(name)),
            func.lower(func.trim(city)),
            func.lower(func.trim(address)),
            unique=True
        ),
    )


class Screen(Base):
    __tablename__ = "screens"



    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    theater_id: Mapped[int] = mapped_column(
        ForeignKey("theaters.id"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    total_rows: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    seats_per_row: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    theater: Mapped["Theater"] = relationship(
        back_populates="screens"
    )

    seats: Mapped[list["Seat"]] = relationship(
        back_populates="screen",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index(
            "uq_screen_name_normalized",
            "theater_id",
            func.lower(func.trim(name)),
            unique=True
        ),
    )

    shows: Mapped[list["Show"]] = relationship(
        back_populates="screen"
    )


class Seat(Base):
    __tablename__ = "seats"

    __table_args__ = (
        UniqueConstraint(
            "screen_id",
            "row_label",
            "seat_number",
            name="uq_seat_per_screen"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    screen_id: Mapped[int] = mapped_column(
        ForeignKey("screens.id"),
        nullable=False
    )

    row_label: Mapped[str] = mapped_column(
        String(5),
        nullable=False
    )

    seat_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    seat_type: Mapped[str] = mapped_column(
        String(20),
        default="REGULAR",
        nullable=False
    )

    screen: Mapped["Screen"] = relationship(
        back_populates="seats"
    )


class Show(Base):
    __tablename__ = "shows"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    movie_id: Mapped[int] = mapped_column(
        ForeignKey("movies.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    screen_id: Mapped[int] = mapped_column(
        ForeignKey("screens.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    ticket_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    movie: Mapped["Movie"] = relationship(
        back_populates="shows"
    )

    screen: Mapped["Screen"] = relationship(
        back_populates="shows"
    )



    __table_args__ = (
        Index(
            "ix_shows_screen_start",
            "screen_id",
            "start_time"
        ),
        CheckConstraint(
            "end_time > start_time",
            name="ck_shows_valid_interval"
        ),
    )


class BookingHold(Base):
    __tablename__ = "booking_holds"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    show_id: Mapped[int] = mapped_column(
        ForeignKey("shows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="HELD",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    seats: Mapped[list["BookingHoldSeat"]] = relationship(
        back_populates="hold",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('HELD', 'CONFIRMED', "
            "'CANCELLED', 'EXPIRED')",
            name="ck_booking_hold_status",
        ),
    )


class BookingHoldSeat(Base):
    __tablename__ = "booking_hold_seats"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    hold_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            "booking_holds.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    seat_id: Mapped[int] = mapped_column(
        ForeignKey("seats.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    hold: Mapped["BookingHold"] = relationship(
        back_populates="seats",
    )

    __table_args__ = (
        UniqueConstraint(
            "hold_id",
            "seat_id",
            name="uq_booking_hold_seat",
        ),
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    refresh_sessions: Mapped[list["RefreshSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped["User"] = relationship(
        back_populates="refresh_sessions",
    )
