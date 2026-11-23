from fastapi.testclient import TestClient

from app.main import create_app


def test_unknown_route_uses_standard_error_shape(client):
    response = client.get("/does-not-exist")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
    assert "message" in response.json()["error"]


def test_listings_placeholder_is_not_implemented(client):
    response = client.get("/listings")

    assert response.status_code == 501
    assert response.json()["error"]["code"] == "not_implemented"


def test_unexpected_error_returns_json_500_with_cors_headers():
    app = create_app()

    @app.get("/boom")
    def boom():
        raise RuntimeError("secret internal detail")

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/boom", headers={"Origin": "http://localhost:3000"})

    assert response.status_code == 500
    assert response.json() == {
        "error": {"code": "internal_error", "message": "Something went wrong on our end."}
    }
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "secret internal detail" not in response.text
