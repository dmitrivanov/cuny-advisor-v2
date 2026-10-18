"""Loopback-only opt-in synthetic conversation API; never echoes validation input."""

import json
from urllib.parse import urlsplit
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import ValidationError
from app.conversation.config import Settings
from app.conversation.contracts import ConversationRequest, ConversationResponse
from app.conversation.provider import GeminiProvider
from app.conversation.service import ConversationOrchestrator

router = APIRouter(prefix="/conversation", tags=["local conversation"])


async def gateway(request: Request) -> ConversationOrchestrator:
    if request.client is None or request.client.host not in ("127.0.0.1", "::1"):
        raise HTTPException(403, "Local prototype only")
    origin = request.headers.get("origin")
    try:
        valid_origin = not origin or urlsplit(origin).hostname in (
            "localhost",
            "127.0.0.1",
            "::1",
        )
    except ValueError:
        valid_origin = False
    if not valid_origin:
        raise HTTPException(403, "Local prototype only")
    if not hasattr(request.app.state, "conversation"):
        settings = Settings.environment()
        request.app.state.conversation = ConversationOrchestrator(
            GeminiProvider(settings) if settings.available else None
        )
    return request.app.state.conversation


@router.get("/status")
def status(service: ConversationOrchestrator = Depends(gateway)):
    return {"enabled": service.provider is not None}


@router.post("/session")
async def session(service: ConversationOrchestrator = Depends(gateway)):
    token = service.new_session()
    if not token:
        raise HTTPException(429, "Local session limit reached")
    return {"session_id": token}


@router.post("", response_model=ConversationResponse)
async def converse(
    request: Request, service: ConversationOrchestrator = Depends(gateway)
):
    # Stream bounded input before parsing: default FastAPI validation echoes bad input.
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 24000:
            raise HTTPException(413, "Conversation input too large")
    try:
        value = ConversationRequest.model_validate(json.loads(body))
    except (ValidationError, ValueError, TypeError):
        raise HTTPException(422, "Invalid conversation input") from None
    return await service.converse(value)
