"""Real PostgreSQL-backed FastAPI journeys; never substitute SQLite."""

import json
import os

from fastapi.testclient import TestClient
import pytest

from academic_factory import synthetic_release
from app.academic.contracts import Completion, EvaluationInput
from app.academic.evaluation import evaluate
from app.academic.fixtures import bmcc_cs_evidence_reference, bmcc_cis_reference
from app.main import create_app
from app.persistence.config import local_engine
from app.persistence.repository import CatalogRepository
from test_workspace_api import path

pytestmark = pytest.mark.postgres


@pytest.fixture
def persisted_client():
    if not os.environ.get("V2_DATABASE_URL"):
        pytest.skip("requires disposable PostgreSQL")
    engine = local_engine(os.environ["V2_DATABASE_URL"])
    repo = CatalogRepository(engine)
    releases = [bmcc_cs_evidence_reference(), bmcc_cis_reference(), synthetic_release()]
    for index, release in enumerate(releases):
        # Existing test fixtures retain their immutable original revision bindings.
        revision = (
            "synthetic-r1"
            if release.campus_id == "test-campus"
            else "bmcc-2026-27-reviewed-fixture-r1"
        )
        repo.save_release(release, revision_id=revision)
    with TestClient(create_app()) as client:
        yield client, releases
    engine.dispose()


def test_discovery_and_exact_scope_from_postgres(persisted_client):
    client, releases = persisted_client
    result = client.get("/api/v1/academic/releases?campus_id=bmcc")
    assert result.status_code == 200
    ids = {item["release_id"] for item in result.json()}
    assert {release.id for release in releases[:2]} <= ids
    for release in releases[:2]:
        response = client.get(path(release))
        assert response.status_code == 200
        assert response.json()["release"] == json.loads(release.model_dump_json())
        assert len(response.json()["columns"]) == 4
        assert (
            client.get(
                path(release).replace(release.program.id, "other-program")
            ).status_code
            == 404
        )
    assert client.get("/api/v1/academic/releases?campus_id=missing-campus").json() == []


@pytest.mark.parametrize("ids", [("m206", "m301", "m302"), ("m301", "m302")])
def test_persisted_http_math_preview_parity(persisted_client, ids):
    client, releases = persisted_client
    release = releases[2]
    allocations = [
        {
            "requirement_id": "math",
            "completion_id": f"hypothetical:{ids[0]}",
            "credits": "3",
        },
        {
            "requirement_id": "major-calculus",
            "completion_id": "hypothetical:m302",
            "credits": "4",
        },
    ]
    response = client.post(
        path(release) + "/preview",
        json={
            "hypothetical": True,
            "selected_course_ids": ids,
            "allocations": allocations,
        },
    )
    assert response.status_code == 200
    inputs = EvaluationInput(
        campus_id=release.campus_id,
        release_id=release.id,
        record_revision="session-hypothetical",
        completions=tuple(
            Completion(
                id=f"hypothetical:{id}", course_id=id, credits="4", verified=True
            )
            for id in ids
        ),
        allocations=allocations,
    )
    assert response.json()["snapshot"] == json.loads(
        evaluate(release, inputs).model_dump_json()
    )
    assert response.json()["snapshot"]["allocated_credits"] == "7"
    assert response.json()["snapshot"]["degree_status"] == "unresolved"
    assert (
        client.post(
            path(release) + "/preview",
            json={"hypothetical": True, "selected_course_ids": ["missing-course"]},
        ).status_code
        == 422
    )


def test_real_partial_evidence_is_not_promoted(persisted_client):
    client, releases = persisted_client
    for release in releases[:2]:
        response = client.post(
            path(release) + "/preview",
            json={"hypothetical": True, "selected_course_ids": []},
        )
        assert response.status_code == 200
        assert response.json()["snapshot"]["degree_status"] == "unresolved"
        assert any(
            item["result"]["status"] == "unresolved"
            for item in response.json()["snapshot"]["results"]
        ) or any(
            item["status"] == "unresolved"
            for item in response.json()["snapshot"]["constraints"]
        )
