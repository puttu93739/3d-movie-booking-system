
import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

TEST_URL = os.getenv("BOOKING_TEST_DATABASE_URL")

if not TEST_URL:
    pytest.skip(
        "Set BOOKING_TEST_DATABASE_URL",
        allow_module_level=True,
    )

parsed = make_url(TEST_URL)

if (
    parsed.get_backend_name() != "postgresql"
    or parsed.database != "movie_booking_test"
):
    pytest.exit("Refusing non-test PostgreSQL database")

os.environ["DATABASE_URL"] = TEST_URL
os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-only-secret-key-at-least-32-characters",
)
os.environ["FRONTEND_ORIGIN"] = "http://localhost:5173"

from app.database import Base, get_db
from app.main import app
from app.models import User, RefreshSession

engine = create_engine(TEST_URL, pool_pre_ping=True)
SessionTesting = sessionmaker(bind=engine)


def override_db():
    with SessionTesting() as db:
        yield db


@pytest.fixture
def client():
    # Use a migrated, disposable test database.
    # Do not create or drop tables in production.
    app.dependency_overrides[get_db] = override_db

    with TestClient(
        app,
        base_url="http://localhost:8000",
    ) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_db, None)


def test_registration_login_refresh_logout(client):
    email = f"test-{uuid4().hex}@example.com"
    password = "SecureTestPassword123!"
    headers = {"Origin": "http://localhost:5173"}

    registration = client.post(
        "/auth/register",
        json={
            "email": email,
            "full_name": "Test Customer",
            "password": password,
        },
        headers=headers,
    )

    assert registration.status_code == 201, registration.text
    assert registration.json()["user"]["email"] == email

    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == email

    logout = client.post(
        "/auth/logout",
        headers=headers,
    )
    assert logout.status_code == 200

    assert client.get("/auth/me").status_code == 401

    wrong = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "WrongPassword123!",
        },
        headers=headers,
    )
    assert wrong.status_code == 401

    login = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
        headers=headers,
    )
    assert login.status_code == 200

    old_refresh = client.cookies.get("cineverse_refresh")

    refreshed = client.post(
        "/auth/refresh",
        headers=headers,
    )
    assert refreshed.status_code == 200

    new_refresh = client.cookies.get("cineverse_refresh")
    assert old_refresh != new_refresh

    # A rotated token cannot be used again.
    client.cookies.set(
        "cineverse_refresh",
        old_refresh,
        path="/auth",
    )
    reused = client.post(
        "/auth/refresh",
        headers=headers,
    )
    assert reused.status_code == 401

    # Restore the valid refresh token and log out.
    client.cookies.set(
        "cineverse_refresh",
        new_refresh,
        path="/auth",
    )
    assert client.post(
        "/auth/logout",
        headers=headers,
    ).status_code == 200
