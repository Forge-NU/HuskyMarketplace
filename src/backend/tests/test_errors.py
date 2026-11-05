def test_unknown_route_uses_standard_error_shape(client):
    response = client.get("/does-not-exist")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
    assert "message" in response.json()["error"]


def test_listings_placeholder_is_not_implemented(client):
    response = client.get("/listings")

    assert response.status_code == 501
    assert response.json()["error"]["code"] == "not_implemented"
