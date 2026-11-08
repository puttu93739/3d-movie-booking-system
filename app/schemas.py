
# from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator,ConfigDict

class MovieBase(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    genre: str = Field(min_length=1, max_length=100)
    language: str = Field(min_length=1, max_length=50)
    duration_minutes: int = Field(gt=0)
    description: str = Field(default="", max_length=1000)


class MovieCreate(MovieBase):
    pass


class MovieUpdate(MovieBase):
    pass


class MovieResponse(MovieBase):
    id: int

    model_config = ConfigDict(from_attributes=True)



from pydantic import field_validator


class TheaterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    city: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=255)

    @field_validator("name", "city", "address")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Value cannot be blank")

        return value


class TheaterResponse(TheaterCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ScreenCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    total_rows: int = Field(ge=1, le=26)
    seats_per_row: int = Field(ge=1, le=30)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Screen name cannot be blank")

        return value


class ScreenResponse(ScreenCreate):
    id: int
    theater_id: int

    model_config = ConfigDict(from_attributes=True)


class SeatResponse(BaseModel):
    id: int
    screen_id: int
    row_label: str
    seat_number: int
    seat_type: str

    model_config = ConfigDict(from_attributes=True)


class SeatLayoutResponse(BaseModel):
    screen_id: int
    screen_name: str
    total_rows: int
    seats_per_row: int
    total_seats: int
    seats: list[SeatResponse]


from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ShowCreate(BaseModel):
    movie_id: int = Field(gt=0)
    screen_id: int = Field(gt=0)
    start_time: datetime
    ticket_price: int = Field(gt=0)

    @field_validator("start_time")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError(
                "start_time must include a timezone offset"
            )
        return value


class ShowUpdate(ShowCreate):
    pass


class ShowResponse(BaseModel):
    id: int
    movie_id: int
    screen_id: int
    start_time: datetime
    end_time: datetime
    ticket_price: int

    model_config = ConfigDict(from_attributes=True)


from uuid import UUID


class HoldCreate(BaseModel):
    show_id: int = Field(gt=0)

    seat_ids: list[int] = Field(
        min_length=1,
        max_length=8,
    )

    @field_validator("seat_ids")
    @classmethod
    def validate_seats(cls, values: list[int]):
        if any(seat_id <= 0 for seat_id in values):
            raise ValueError("Seat IDs must be positive")

        if len(values) != len(set(values)):
            raise ValueError("Duplicate seat IDs are not allowed")

        return values


class HoldResponse(BaseModel):
    hold_id: UUID
    show_id: int
    seat_ids: list[int]
    status: str
    expires_at: datetime
    hold_token: str


class AvailabilityResponse(BaseModel):
    show_id: int
    unavailable_seat_ids: list[int]
    server_time: datetime


class BookingResponse(BaseModel):
    booking_id: UUID
    show_id: int
    seat_ids: list[int]
    status: str
    confirmed_at: datetime | None = None


class ReleaseResponse(BaseModel):
    hold_id: UUID
    status: str

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if not value.strip():
            raise ValueError("Password cannot be blank")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    message: str
