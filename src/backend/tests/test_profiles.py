"""Auth tests. Supabase is replaced with a fake, so these never hit the network."""

from types import SimpleNamespace


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


def test_me_rejects_an_invalid_token(client, monkeypatch):
    use_fake_supabase(monkeypatch, error=Exception("invalid JWT"))

    response = client.get("/profiles/me", headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


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
