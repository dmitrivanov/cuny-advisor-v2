"""Process liveness only; no database or external service checks."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel
from starlette.responses import Response

router = APIRouter()


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: Literal["cuny-advisor-v2-api"] = "cuny-advisor-v2-api"


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health(response: Response) -> HealthResponse:
    response.headers["Cache-Control"] = "no-store"
    return HealthResponse()
