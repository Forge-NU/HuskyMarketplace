from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness check for local dev and the deployed backend. Does not touch Supabase."""
    return HealthResponse(status="ok", environment=get_settings().environment)
