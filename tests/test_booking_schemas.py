
import pytest
from pydantic import ValidationError

from app.schemas import HoldCreate


def test_valid_hold():
    payload = HoldCreate(
        show_id=1,
        seat_ids=[10, 11],
    )
    assert payload.seat_ids == [10, 11]


def test_empty_seat_list():
    with pytest.raises(ValidationError):
        HoldCreate(show_id=1, seat_ids=[])


def test_duplicate_seats():
    with pytest.raises(ValidationError):
        HoldCreate(show_id=1, seat_ids=[10, 10])


def test_more_than_eight_seats():
    with pytest.raises(ValidationError):
        HoldCreate(
            show_id=1,
            seat_ids=list(range(1, 10)),
        )


def test_negative_seat_id():
    with pytest.raises(ValidationError):
        HoldCreate(show_id=1, seat_ids=[-1])


def test_invalid_show_id():
    with pytest.raises(ValidationError):
        HoldCreate(show_id=0, seat_ids=[1])
