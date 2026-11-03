import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "BookIN"


def test_graphql_movies_query():
    query = """
    query {
        movies {
            id
            title
            slug
            language
            durationMinutes
            genres {
                name
            }
        }
    }
    """
    response = client.post("/graphql", json={"query": query})
    assert response.status_code == 200
    res_data = response.json()
    assert "data" in res_data
    movies = res_data["data"]["movies"]
    assert len(movies) > 0
    assert any(m["slug"] == "dune-part-two" for m in movies)


def test_graphql_theatres_and_shows_query():
    query = """
    query {
        theatres(city: "Mumbai") {
            id
            name
            city
            screens {
                name
                totalSeats
            }
        }
        shows(city: "Mumbai") {
            id
            startTime
            theatreName
            movie {
                title
            }
        }
    }
    """
    response = client.post("/graphql", json={"query": query})
    assert response.status_code == 200
    res_data = response.json()
    assert "data" in res_data
    assert len(res_data["data"]["theatres"]) > 0
    assert len(res_data["data"]["shows"]) > 0


def test_graphql_user_registration_and_login():
    import uuid
    test_email = f"cine_{uuid.uuid4().hex[:6]}@example.com"

    reg_mutation = f"""
    mutation {{
        register(input: {{
            email: "{test_email}",
            password: "Password123!",
            fullName: "Test User"
        }}) {{
            user {{
                email
                fullName
            }}
            accessToken
        }}
    }}
    """
    res = client.post("/graphql", json={"query": reg_mutation})
    assert res.status_code == 200
    data = res.json()["data"]["register"]
    assert data["user"]["email"] == test_email
    assert data["accessToken"] != ""

    # Login
    login_mutation = f"""
    mutation {{
        login(input: {{
            email: "{test_email}",
            password: "Password123!"
        }}) {{
            user {{
                email
            }}
            accessToken
        }}
    }}
    """
    res2 = client.post("/graphql", json={"query": login_mutation})
    assert res2.status_code == 200
    data2 = res2.json()["data"]["login"]
    assert data2["user"]["email"] == test_email
    assert data2["accessToken"] != ""
