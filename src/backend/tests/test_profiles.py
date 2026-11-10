"""Auth tests. Supabase is replaced with a fake, so these never hit the network."""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.auth import AuthError
from app.main import app


class FakeAuthError(AuthError):
    def __init__(self, status):
        Exception.__init__(self, f"fake Supabase auth error ({status})")
        self.status = status


class FakeAuth:
    def __init__(self, user=None, error=None):
        self._user = user
        self._error = error

    def get_user(self, token):
        if self._error:
            raise self._error
        return SimpleNamespace(user=self._user)


def use_fake_supabase(monkeypatch, **kwargs):
    fake_client = SimpleNamespace(auth=FakeAuth(**kwargs))
    monkeypatch.setattr("app.core.auth.get_anon_client", lambda: fake_client)


def test_me_requires_a_token(client):
    response = client.get("/profiles/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("status", [400, 401, 403])
def test_me_rejects_an_invalid_or_expired_token(client, monkeypatch, status):
    use_fake_supabase(monkeypatch, error=FakeAuthError(status))

    response = client.get("/profiles/me", headers={"Authorization": "Bearer bad-token"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


@pytest.mark.parametrize("status", [0, 429, 500, 503])
def test_me_returns_503_when_supabase_auth_fails(client, monkeypatch, status):
    use_fake_supabase(monkeypatch, error=FakeAuthError(status))

    response = client.get("/profiles/me", headers={"Authorization": "Bearer valid-token"})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "auth_unavailable"


@pytest.mark.parametrize(
    "error, user",
    [
        (ValueError("could not parse Supabase response"), None),
        (None, SimpleNamespace(email="husky@northeastern.edu")),  # user without an id
    ],
)
def test_me_returns_503_when_supabase_response_is_malformed(client, monkeypatch, error, user):
    use_fake_supabase(monkeypatch, user=user, error=error)

    response = client.get("/profiles/me", headers={"Authorization": "Bearer valid-token"})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "auth_unavailable"


def test_me_returns_500_when_supabase_is_not_configured(monkeypatch):
    def missing_config():
        raise RuntimeError("SUPABASE_URL is not set.")

    monkeypatch.setattr("app.core.auth.get_anon_client", missing_config)

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/profiles/me", headers={"Authorization": "Bearer valid-token"})

    assert response.status_code == 500
    assert response.json()["error"]["code"] == "internal_error"
    assert "SUPABASE_URL" not in response.text


def test_me_returns_the_signed_in_student(client, monkeypatch):
    use_fake_supabase(
        monkeypatch,
        user=SimpleNamespace(id="11111111-1111-1111-1111-111111111111", email="husky@northeastern.edu"),
    )

    response = client.get("/profiles/me", headers={"Authorization": "Bearer valid-token"})

    assert response.status_code == 200
    assert response.json() == {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "husky@northeastern.edu",
    }
