
def test_create_movie(client):
    response = client.post(
        "/movies/",
        json={
            "title": "Pytest Movie One",
            "genre": "Sci-Fi",
            "language": "English",
            "duration_minutes": 120,
            "description": "Movie created by pytest"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == "Pytest Movie One"
    assert data["duration_minutes"] == 120
    assert "id" in data


def test_get_movies(client):
    response = client.get("/movies/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_invalid_movie(client):
    response = client.get("/movies/999999")

    assert response.status_code == 404


def test_invalid_movie_duration(client):
    response = client.post(
        "/movies/",
        json={
            "title": "Invalid Duration Movie",
            "genre": "Action",
            "language": "English",
            "duration_minutes": -10,
            "description": "Invalid movie"
        }
    )

    assert response.status_code == 422


def test_duplicate_movie(client):
    payload = {
        "title": "Pytest Duplicate Movie",
        "genre": "Action",
        "language": "English",
        "duration_minutes": 100,
        "description": "Duplicate test"
    }

    first = client.post("/movies/", json=payload)
    second = client.post("/movies/", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409
