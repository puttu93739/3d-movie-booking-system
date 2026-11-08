
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, status
from pwdlib import PasswordHash

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "")

if len(JWT_SECRET) < 32:
    raise RuntimeError(
        "JWT_SECRET_KEY must be at least 32 characters"
    )

JWT_ALGORITHM = "HS256"
JWT_ISSUER = "cineverse-booking"
JWT_AUDIENCE = "cineverse-web"

ACCESS_MINUTES = int(
    os.getenv("ACCESS_TOKEN_MINUTES", "15")
)

REFRESH_DAYS = int(
    os.getenv("REFRESH_TOKEN_DAYS", "7")
)

password_hasher = PasswordHash.recommended()


def utc_now():
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hasher.verify(password, hashed)


def create_access_token(user_id: UUID) -> str:
    now = utc_now()

    payload = {
        "sub": str(user_id),
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "type": "access",
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(minutes=ACCESS_MINUTES),
        "jti": secrets.token_hex(16),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> UUID:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
            options={"require": [
                "sub", "iss", "aud", "type",
                "iat", "nbf", "exp", "jti",
            ]},
        )

        if payload.get("type") != "access":
            raise ValueError("Wrong token type")

        return UUID(payload["sub"])

    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def digest_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()
