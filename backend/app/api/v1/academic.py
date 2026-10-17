"""Explicitly scoped, read-only academic workspace API. No startup DB work."""

import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.persistence.config import local_engine
from app.persistence.repository import CatalogRepository, PersistenceConflict
from app.persistence import schema as db
from app.workspace.service import (
    CatalogView,
    HypotheticalRequest,
    ProgressView,
    ReleaseSummary,
    catalog_view,
    preview,
)

router = APIRouter(prefix="/academic", tags=["academic workspace"])
ScopedID = Annotated[
    str, Path(min_length=1, max_length=160, pattern=r"^[A-Za-z0-9_:.-]+$")
]
SETUP = "Catalog unavailable. Start disposable V2 PostgreSQL, export V2_DATABASE_URL, run explicit migrations and import reviewed fixtures. See README."


def repository():
    engine = None
    try:
        engine = local_engine(os.environ["V2_DATABASE_URL"])
        yield CatalogRepository(engine)
    except (KeyError, ValueError, SQLAlchemyError) as error:
        # Never return URLs, SQL, raw driver messages or credentials.
        if isinstance(error, PersistenceConflict):
            raise HTTPException(
                503, "Catalog integrity check failed; review the local import."
            ) from None
        raise HTTPException(503, SETUP) from None
    finally:
        if engine is not None:
            engine.dispose()


Repository = Annotated[CatalogRepository, Depends(repository)]


@router.get("/releases", response_model=list[ReleaseSummary])
def releases(
    repo: Repository,
    campus_id: str | None = Query(
        default=None, min_length=1, max_length=160, pattern=r"^[A-Za-z0-9_:.-]+$"
    ),
    program_id: str | None = Query(
        default=None, min_length=1, max_length=160, pattern=r"^[A-Za-z0-9_:.-]+$"
    ),
):
    query = select(
        db.binding.c.campus_id,
        db.binding.c.program_id,
        db.binding.c.release_id,
        db.binding.c.catalog_year,
        db.binding.c.credential,
        db.binding.c.revision_id,
    )
    if campus_id is not None:
        query = query.where(db.binding.c.campus_id == campus_id)
    if program_id is not None:
        query = query.where(db.binding.c.program_id == program_id)
    with repo.engine.connect() as connection:
        return list(
            connection.execute(
                query.order_by(
                    db.binding.c.campus_id,
                    db.binding.c.program_id,
                    db.binding.c.catalog_year,
                    db.binding.c.release_id,
                )
            ).mappings()
        )


def load(repo, campus_id, program_id, release_id):
    try:
        return repo.load_release(campus_id, program_id, release_id)
    except KeyError:
        raise HTTPException(
            404, "Release not found in the requested campus/program context"
        ) from None
    except PersistenceConflict:
        raise HTTPException(
            503, "Catalog integrity check failed; review the local import."
        ) from None


@router.get(
    "/campuses/{campus_id}/programs/{program_id}/releases/{release_id}",
    response_model=CatalogView,
)
def catalog(
    campus_id: ScopedID, program_id: ScopedID, release_id: ScopedID, repo: Repository
):
    return catalog_view(load(repo, campus_id, program_id, release_id))


@router.post(
    "/campuses/{campus_id}/programs/{program_id}/releases/{release_id}/preview",
    response_model=ProgressView,
)
def progress(
    campus_id: ScopedID,
    program_id: ScopedID,
    release_id: ScopedID,
    request: HypotheticalRequest,
    repo: Repository,
):
    release = load(repo, campus_id, program_id, release_id)
    try:
        return preview(release, request)
    except ValueError as error:
        raise HTTPException(422, str(error)) from None
