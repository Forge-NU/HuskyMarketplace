"""Every error the API returns has the same shape:

    {"error": {"code": "not_found", "message": "...", "details": ...}}

`details` is only present when there is something useful to add (e.g. which
fields failed validation). Raise APIError from routes for expected failures.
"""

import logging
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import ASGIApp, Message, Receive, Scope, Send

logger = logging.getLogger(__name__)


class APIError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details
        self.headers = headers


def error_response(
    status_code: int,
    code: str,
    message: str,
    details: Any = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        body["details"] = jsonable_encoder(details)
    return JSONResponse(status_code=status_code, content={"error": body}, headers=headers)


def _code_for_status(status_code: int) -> str:
    try:
        return HTTPStatus(status_code).phrase.lower().replace(" ", "_").replace("-", "_")
    except ValueError:
        return "error"


async def _api_error_handler(_: Request, exc: APIError) -> JSONResponse:
    return error_response(exc.status_code, exc.code, exc.message, exc.details, exc.headers)


async def _http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    # Covers FastAPI's own errors too, like 404 for unknown routes and 405 for wrong methods.
    if isinstance(exc.detail, str):
        message, details = exc.detail, None
    else:
        message, details = _code_for_status(exc.status_code).replace("_", " ").capitalize(), exc.detail
    return error_response(
        exc.status_code, _code_for_status(exc.status_code), message, details, getattr(exc, "headers", None)
    )


async def _validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return error_response(422, "validation_error", "Some fields are missing or invalid.", exc.errors())


class UnhandledErrorMiddleware:
    """Turns unexpected exceptions into the standard JSON 500 response.

    Starlette runs its built-in handler for plain exceptions outside every other
    middleware, so those 500s would skip CORS and the browser couldn't read them.
    This middleware is added inside CORSMiddleware instead (see app/main.py).
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        response_started = False

        async def send_wrapper(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception:
            logger.exception("Unhandled error on %s %s", scope.get("method"), scope.get("path"))
            if response_started:
                # Part of a response already went out, so a clean 500 is impossible.
                raise
            # Don't leak internals (stack traces, SQL, keys) to the client.
            response = error_response(500, "internal_error", "Something went wrong on our end.")
            await response(scope, receive, send)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(APIError, _api_error_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
