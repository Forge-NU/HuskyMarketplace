"""Authentication dependency.

The frontend signs students in with Supabase and sends the session's access
token as `Authorization: Bearer <token>`. Any route that needs a signed-in
student adds `user: CurrentUser = Depends(get_current_user)`.

Responses:
- 401 when there's no token, or Supabase rejects it (bad, expired, unknown user)
- 503 when Supabase Auth is unreachable or erroring, so we can't tell either way
- 500 when the backend itself is misconfigured (e.g. SUPABASE_URL is missing)
"""

import logging
from dataclasses import dataclass

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.errors import APIError
from app.core.supabase import get_anon_client

try:
    from supabase_auth.errors import AuthError
except ImportError:  # older supabase-py releases shipped this as the gotrue package
    from gotrue.errors import AuthError

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)

_WWW_AUTH = {"WWW-Authenticate": "Bearer"}


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    # Pass this to get_user_client() so database queries run under RLS as this user.
    access_token: str


def _invalid_token() -> APIError:
    return APIError(401, "invalid_token", "Your session is invalid or expired. Sign in again.", headers=_WWW_AUTH)


def _auth_unavailable() -> APIError:
    return APIError(503, "auth_unavailable", "We couldn't verify your session right now. Try again in a moment.")


def _is_rejected_token(exc: AuthError) -> bool:
    """True when Supabase checked the token and said no, as opposed to failing to check it."""
    status = getattr(exc, "status", None)
    return isinstance(status, int) and 400 <= status < 500 and status != 429


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise APIError(401, "unauthorized", "Sign in to continue.", headers=_WWW_AUTH)

    token = credentials.credentials

    # Missing Supabase settings raise RuntimeError here. That's our misconfiguration,
    # not the student's session, so it's left to become a 500.
    client = get_anon_client()

    try:
        # Asks Supabase Auth to validate the token, so this works whichever JWT
        # signing keys the project uses. One extra network call per request.
        response = client.auth.get_user(token)
    except AuthError as exc:
        if _is_rejected_token(exc):
            raise _invalid_token() from None
        logger.warning("Supabase Auth failed while verifying a token", exc_info=True)
        raise _auth_unavailable() from None
    except Exception:
        # Anything else coming out of the Supabase call (e.g. a response we can't parse)
        # is Supabase misbehaving, not a bad session.
        logger.exception("Unexpected error while verifying a token with Supabase Auth")
        raise _auth_unavailable() from None

    user = getattr(response, "user", None)
    if user is None:
        raise _invalid_token()

    user_id = getattr(user, "id", None)
    if not user_id:
        logger.error("Supabase Auth returned a user without an id")
        raise _auth_unavailable()

    return CurrentUser(id=str(user_id), email=getattr(user, "email", None), access_token=token)
