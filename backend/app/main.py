"""Local V2 API entry point. Phase 01A has no persistence or integrations."""

from fastapi import FastAPI

from app.api.v1.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(title="CUNY Advisor V2 API", version="0.1.0", redoc_url=None)
    app.include_router(health_router, prefix="/api/v1")
    return app


app = create_app()
