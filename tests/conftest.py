
import os

from dotenv import dotenv_values

test_settings = dotenv_values(".env.test")
test_url = test_settings.get("DATABASE_URL")

if not test_url:
    raise RuntimeError("DATABASE_URL missing in .env.test")

# Prevent accidentally using the main database.
from sqlalchemy.engine import make_url

database_name = make_url(test_url).database

if database_name != "movie_booking_test":
    raise RuntimeError("Tests must use movie_booking_test")

os.environ["DATABASE_URL"] = test_url

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine, SessionLocal, get_db
from app import models
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    # Creates missing tables in the test database.
    Base.metadata.create_all(bind=engine)


@pytest.fixture
def db_session(create_test_tables):
    connection = engine.connect()
    transaction = connection.begin()

    session = SessionLocal(
        bind=connection,
        join_transaction_mode="create_savepoint"
    )

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
