from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend configuration, read from environment variables or src/backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"

    supabase_url: str = ""
    supabase_anon_key: str = ""
    # Bypasses Row Level Security. Server-side only, and never used to read or
    # write rows on behalf of a user (see app/core/supabase.py).
    supabase_service_role_key: str = ""

    # Comma-separated list of exact origins, e.g. "http://localhost:3000,https://huskymarketplace.vercel.app"
    cors_origins: str = "http://localhost:3000"
    # Optional regex for origins that change per deploy, such as Vercel preview URLs.
    cors_origin_regex: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
