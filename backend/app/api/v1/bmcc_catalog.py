"""Read-only BMCC browsing snapshots, never audit-release substitution."""

import os
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.exc import SQLAlchemyError
from app.persistence.config import local_engine
from app.catalog_ingestion.repository import BrowseRepository
from app.catalog_ingestion.contracts import (
    Course,
    Department,
    Program,
    Contract,
    Source,
)

router = APIRouter(prefix="/bmcc-catalog", tags=["BMCC source catalog"])
ID = Annotated[str, Path(pattern=r"^[A-Za-z0-9_.:-]{1,160}$")]


class CoursePage(Contract):
    snapshot_id: str
    catalog_year: str
    total: int
    offset: int
    limit: int
    items: tuple[Course, ...]


def repository():
    engine = None
    try:
        engine = local_engine(os.environ["V2_DATABASE_URL"])
        yield BrowseRepository(engine)
    except (KeyError, ValueError, SQLAlchemyError):
        raise HTTPException(
            503,
            "BMCC browsing catalog unavailable. Check explicit V2 migrations and reviewed import.",
        ) from None
    finally:
        if engine is not None:
            engine.dispose()


Repo = Annotated[BrowseRepository, Depends(repository)]


def load(repo, id):
    try:
        return repo.load(id)
    except KeyError:
        raise HTTPException(404, "Browsing snapshot not found") from None


@router.get("/snapshots")
def snapshots(repo: Repo) -> list[dict[str, str]]:
    return repo.snapshots()


@router.get("/{snapshot}/departments", response_model=tuple[Department, ...])
def departments(snapshot: ID, repo: Repo):
    return load(repo, snapshot).departments


@router.get("/{snapshot}/programs", response_model=tuple[Program, ...])
def programs(snapshot: ID, repo: Repo):
    return load(repo, snapshot).programs


@router.get("/{snapshot}/courses", response_model=CoursePage)
def courses(
    snapshot: ID,
    repo: Repo,
    q: str = Query("", max_length=120),
    department: str | None = Query(None, max_length=160),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
):
    data = load(repo, snapshot)
    items = [
        c
        for c in data.courses
        if (not department or department in c.department_ids)
        and q.casefold() in (c.code + " " + c.title + " " + c.description).casefold()
    ]
    return CoursePage(
        snapshot_id=data.id,
        catalog_year=data.catalog_year,
        total=len(items),
        offset=offset,
        limit=limit,
        items=tuple(items[offset : offset + limit]),
    )


@router.get("/{snapshot}/courses/{course_id}", response_model=Course)
def course(snapshot: ID, course_id: ID, repo: Repo):
    found = next((c for c in load(repo, snapshot).courses if c.id == course_id), None)
    if found is None:
        raise HTTPException(404, "Course not found in this browsing snapshot")
    return found


@router.get("/{snapshot}/sources", response_model=tuple[Source, ...])
def sources(snapshot: ID, repo: Repo):
    return load(repo, snapshot).sources
