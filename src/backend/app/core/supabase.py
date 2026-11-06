"""Supabase clients for the backend.

Rule of thumb: when a request is made on behalf of a student, use
get_user_client(user.access_token). That client sends the student's own JWT,
so the Row Level Security policies in supabase/migrations still decide what
they can read and write, exactly like they do for the frontend.

The service-role client skips RLS entirely. Only use it for trusted server jobs
that are not tied to one user, and never to "just make a query work".
"""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


def _require(value: str, name: str) -> str:
    if not value:
        raise RuntimeError(f"{name} is not set. Copy .env.example to .env and fill it in.")
    return value


@lru_cache
def get_anon_client() -> Client:
    """Shared client with the public anon key. Used to verify access tokens."""
    settings = get_settings()
    return create_client(
        _require(settings.supabase_url, "SUPABASE_URL"),
        _require(settings.supabase_anon_key, "SUPABASE_ANON_KEY"),
    )


def get_user_client(access_token: str) -> Client:
    """A client that acts as the signed-in student, so RLS applies to every query."""
    settings = get_settings()
    client = create_client(
        _require(settings.supabase_url, "SUPABASE_URL"),
        _require(settings.supabase_anon_key, "SUPABASE_ANON_KEY"),
    )
    client.postgrest.auth(access_token)
    return client


@lru_cache
def get_service_client() -> Client:
    """Admin client. Bypasses RLS. Read the module docstring before using this."""
    settings = get_settings()
    return create_client(
        _require(settings.supabase_url, "SUPABASE_URL"),
        _require(settings.supabase_service_role_key, "SUPABASE_SERVICE_ROLE_KEY"),
    )
