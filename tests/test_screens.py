
def test_create_theater(client):
    response = client.post(
        "/theaters/",
        json={
            "name": "PVR Test Cinema",
            "city": "Bengaluru",
            "address": "Rajajinagar"
        }
    )

    assert response.status_code == 201

    data = response.json()
    assert data["name"] == "PVR Test Cinema"
    assert data["city"] == "Bengaluru"
    assert "id" in data


def test_get_all_theaters(client):
    response = client.get("/theaters/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_theater_by_id(client):
    created = client.post(
        "/theaters/",
        json={
            "name": "INOX Test Cinema",
            "city": "Bengaluru",
            "address": "Whitefield"
        }
    )

    assert created.status_code == 201
    theater_id = created.json()["id"]

    response = client.get(f"/theaters/{theater_id}")

    assert response.status_code == 200
    assert response.json()["id"] == theater_id


def test_invalid_theater(client):
    response = client.post(
        "/theaters/",
        json={
            "name": "",
            "city": "Bengaluru",
            "address": "Test Address"
        }
    )

    assert response.status_code == 422


def test_theater_not_found(client):
    response = client.get("/theaters/999999")

    assert response.status_code == 404


def test_duplicate_theater(client):
    payload = {
        "name": "Duplicate Cinema",
        "city": "Bengaluru",
        "address": "MG Road"
    }

    first = client.post("/theaters/", json=payload)
    second = client.post("/theaters/", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409
