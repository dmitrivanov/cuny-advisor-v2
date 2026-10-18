"""Local V2 API entry point. No startup database connection, migrations or imports."""

from fastapi import FastAPI

from app.api.v1.health import router as health_router
from app.api.v1.academic import router as academic_router
from app.api.v1.conversation import router as conversation_router
from app.api.v1.institutions import router as institutions_router


def create_app() -> FastAPI:
    app = FastAPI(title="CUNY Advisor V2 API", version="0.1.0", redoc_url=None)
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(academic_router, prefix="/api/v1")
    app.include_router(conversation_router, prefix="/api/v1")
    app.include_router(institutions_router, prefix="/api/v1")

    @app.middleware("http")
    async def no_academic_cache(request, call_next):
        response = await call_next(request)
        if request.url.path.startswith(
            ("/api/v1/academic", "/api/v1/conversation", "/api/v1/institutions")
        ):
            response.headers["Cache-Control"] = "no-store"
        return response

    return app


app = create_app()
