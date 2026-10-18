"""Read-only database-backed institution registry; no seed or static fallback."""

import os
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.persistence.config import local_engine
from app.persistence.repository import PersistenceConflict
from app.institutions.contracts import RegistryView, InstitutionView
from app.institutions.repository import InstitutionRepository

router = APIRouter(prefix="/institutions", tags=["institution registry"])


def repository():
    engine = None
    try:
        engine = local_engine(os.environ["V2_DATABASE_URL"])
        yield InstitutionRepository(engine)
    except (
        KeyError,
        ValueError,
        ValidationError,
        SQLAlchemyError,
        PersistenceConflict,
    ):
        raise HTTPException(
            503,
            "Institution registry unavailable. Check local V2 migrations and explicit registry import.",
        ) from None
    finally:
        if engine is not None:
            engine.dispose()


Repo = Annotated[InstitutionRepository, Depends(repository)]


@router.get("", response_model=RegistryView | None)
def registry(repo: Repo):
    return repo.list()


@router.get("/{slug}", response_model=InstitutionView)
def institution(
    slug: Annotated[str, Path(pattern=r"^[a-z][a-z0-9-]{0,79}$")], repo: Repo
):
    data = repo.list()
    found = (
        next((i for i in data.institutions if i.slug == slug), None) if data else None
    )
    if found is None:
        raise HTTPException(404, "Institution not found")
    return found
