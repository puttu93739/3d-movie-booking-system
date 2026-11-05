
def create_screen(client, rows=3, seats_per_row=5):
    theater = client.post(
        "/theaters/",
        json={
            "name": "Seat Test Cinema",
            "city": "Bengaluru",
            "address": "Seat Test Address"
        }
    )

    assert theater.status_code == 201
    theater_id = theater.json()["id"]

    screen = client.post(
        f"/theaters/{theater_id}/screens",
        json={
            "name": "Screen 1",
            "total_rows": rows,
            "seats_per_row": seats_per_row
        }
    )

    assert screen.status_code == 201
    return screen.json()["id"]


def test_automatic_seat_generation(client):
    screen_id = create_screen(
        client,
        rows=3,
        seats_per_row=5
    )

    response = client.get(
        f"/screens/{screen_id}/seats"
    )

    assert response.status_code == 200

    data = response.json()
    assert data["total_seats"] == 15
    assert len(data["seats"]) == 15


def test_seat_row_labels(client):
    screen_id = create_screen(
        client,
        rows=3,
        seats_per_row=5
    )

    response = client.get(
        f"/screens/{screen_id}/seats"
    )

    seats = response.json()["seats"]

    rows = {seat["row_label"] for seat in seats}

    assert rows == {"A", "B", "C"}


def test_seat_numbers(client):
    screen_id = create_screen(
        client,
        rows=2,
        seats_per_row=4
    )

    response = client.get(
        f"/screens/{screen_id}/seats"
    )

    seats = response.json()["seats"]

    row_a = [
        seat["seat_number"]
        for seat in seats
        if seat["row_label"] == "A"
    ]

    assert row_a == [1, 2, 3, 4]


def test_no_duplicate_seats(client):
    screen_id = create_screen(
        client,
        rows=3,
        seats_per_row=5
    )

    response = client.get(
        f"/screens/{screen_id}/seats"
    )

    seats = response.json()["seats"]

    seat_keys = [
        (seat["row_label"], seat["seat_number"])
        for seat in seats
    ]

    assert len(seat_keys) == len(set(seat_keys))


def test_default_seat_type(client):
    screen_id = create_screen(client)

    response = client.get(
        f"/screens/{screen_id}/seats"
    )

    seats = response.json()["seats"]

    assert all(
        seat["seat_type"] == "REGULAR"
        for seat in seats
    )


def test_seats_screen_not_found(client):
    response = client.get(
        "/screens/999999/seats"
    )

    assert response.status_code == 404
