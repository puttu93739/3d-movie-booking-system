
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_is_not_plaintext():
    password = "MyVeryStrongPassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert hashed.startswith("$argon2")
    assert verify_password(password, hashed)


def test_wrong_password_fails():
    hashed = hash_password("CorrectPassword123!")

    assert not verify_password(
        "WrongPassword123!",
        hashed,
    )


def test_access_token_round_trip():
    user_id = uuid4()
    token = create_access_token(user_id)

    assert decode_access_token(token) == user_id


def test_invalid_access_token_rejected():
    with pytest.raises(HTTPException) as error:
        decode_access_token("invalid.jwt.token")

    assert error.value.status_code == 401
