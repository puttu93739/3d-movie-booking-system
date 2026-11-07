
import os
from concurrent.futures import ThreadPoolExecutor

import pytest
import requests


BASE_URL = os.getenv(
    "BOOKING_TEST_API_URL",
    "http://127.0.0.1:8001",
)

SHOW_ID = os.getenv("BOOKING_TEST_SHOW_ID")
SEAT_IDS = os.getenv("BOOKING_TEST_SEAT_IDS", "")


@pytest.fixture(scope="module")
def test_data():
    if not SHOW_ID or not SEAT_IDS:
        pytest.skip(
            "Set BOOKING_TEST_SHOW_ID and "
            "BOOKING_TEST_SEAT_IDS"
        )

    ids = [int(value) for value in SEAT_IDS.split(",")]

    if len(ids) < 4:
        pytest.skip("Provide at least four test seat IDs")

    return int(SHOW_ID), ids


def create_hold(show_id, seat_ids):
    return requests.post(
        f"{BASE_URL}/bookings/holds",
        json={
            "show_id": show_id,
            "seat_ids": seat_ids,
        },
        timeout=15,
    )


def release_hold(hold):
    return requests.post(
        f"{BASE_URL}/bookings/holds/"
        f"{hold['hold_id']}/release",
        headers={
            "X-Hold-Token": hold["hold_token"]
        },
        timeout=15,
    )


def test_create_and_release_hold(test_data):
    show_id, ids = test_data

    response = create_hold(show_id, [ids[0]])

    assert response.status_code == 201, response.text

    hold = response.json()

    assert hold["status"] == "HELD"
    assert hold["seat_ids"] == [ids[0]]
    assert hold["hold_token"]

    release = release_hold(hold)

    assert release.status_code == 200
    assert release.json()["status"] == "CANCELLED"


def test_same_seat_cannot_be_held_twice(test_data):
    show_id, ids = test_data

    first = create_hold(show_id, [ids[1]])
    assert first.status_code == 201, first.text

    hold = first.json()

    try:
        second = create_hold(show_id, [ids[1]])
        assert second.status_code == 409
    finally:
        release_hold(hold)


def test_confirmed_seat_remains_unavailable(test_data):
    show_id, ids = test_data

    response = create_hold(show_id, [ids[2]])
    assert response.status_code == 201, response.text

    hold = response.json()

    confirmed = requests.post(
        f"{BASE_URL}/bookings/holds/"
        f"{hold['hold_id']}/confirm",
        headers={
            "X-Hold-Token": hold["hold_token"]
        },
        timeout=15,
    )

    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["status"] == "CONFIRMED"

    duplicate = create_hold(show_id, [ids[2]])
    assert duplicate.status_code == 409


def test_concurrent_requests_only_one_wins(test_data):
    show_id, ids = test_data
    seat_id = ids[3]

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [
            pool.submit(create_hold, show_id, [seat_id])
            for _ in range(2)
        ]

        responses = [future.result() for future in futures]

    codes = sorted(response.status_code for response in responses)

    assert codes == [201, 409], [
        response.text for response in responses
    ]

    winner = next(
        response.json()
        for response in responses
        if response.status_code == 201
    )

    release = release_hold(winner)
    assert release.status_code == 200
