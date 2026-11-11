from typing import Any

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    environment: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ErrorResponse(BaseModel):
    """Shape of every error response. Use in `responses=` to document routes."""

    error: ErrorBody
