import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import UnhandledErrorMiddleware, register_exception_handlers
from app.routers import health, listings, profiles

logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Husky Marketplace API", version="0.1.0")

    # Middleware added later wraps middleware added earlier. UnhandledErrorMiddleware
    # has to sit inside CORS so that 500 responses still get CORS headers.
    app.add_middleware(UnhandledErrorMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=settings.cors_origin_regex or None,
        # Auth uses Bearer tokens, not cookies, so credentialed CORS isn't needed.
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(health.router)
    app.include_router(profiles.router)
    app.include_router(listings.router)

    return app


app = create_app()
