def test_health_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_cors_allows_local_frontend(client):
    response = client.options(
        "/health",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
    )

    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_blocks_unknown_origin(client):
    response = client.options(
        "/health",
        headers={"Origin": "https://not-our-site.com", "Access-Control-Request-Method": "GET"},
    )

    assert "access-control-allow-origin" not in response.headers
