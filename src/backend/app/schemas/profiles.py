from pydantic import BaseModel


class MeResponse(BaseModel):
    """Placeholder until the profile fields for #20 are finalized."""

    id: str
    email: str | None = None
