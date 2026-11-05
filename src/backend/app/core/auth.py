"""Authentication dependency.

The frontend signs students in with Supabase and sends the session's access
token as `Authorization: Bearer <token>`. Any route that needs a signed-in
student adds `user: CurrentUser = Depends(get_current_user)`.
"""

import logging
from dataclasses import dataclass

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.errors import APIError
from app.core.supabase import get_anon_client

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)

_WWW_AUTH = {"WWW-Authenticate": "Bearer"}


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    # Pass this to get_user_client() so database queries run under RLS as this user.
    access_token: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise APIError(401, "unauthorized", "Sign in to continue.", headers=_WWW_AUTH)

    token = credentials.credentials
    try:
        # Asks Supabase Auth to validate the token, so this works whichever JWT
        # signing keys the project uses. One extra network call per request.
        response = get_anon_client().auth.get_user(token)
    except Exception:
        logger.info("Rejected access token", exc_info=True)
        raise APIError(401, "invalid_token", "Your session is invalid or expired. Sign in again.", headers=_WWW_AUTH)

    user = getattr(response, "user", None)
    if user is None:
        raise APIError(401, "invalid_token", "Your session is invalid or expired. Sign in again.", headers=_WWW_AUTH)

    return CurrentUser(id=str(user.id), email=user.email, access_token=token)
