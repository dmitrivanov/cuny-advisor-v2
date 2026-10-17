"""HTTP boundary tests use explicit DI doubles; no implicit fixture fallback."""

import json

from fastapi.testclient import TestClient
import pytest

from academic_factory import synthetic_release
from app.api.v1.academic import repository
from app.main import create_app
from app.workspace.service import HypotheticalRequest, catalog_view, preview
from app.academic.contracts import Completion, EvaluationInput
from app.academic.evaluation import evaluate


def path(release):
    return f"/api/v1/academic/campuses/{release.campus_id}/programs/{release.program.id}/releases/{release.id}"


class MemoryRepository:
    """Test-only scoped release read, not used by the application."""

    def __init__(self, release):
        self.release = release
        self.loads = 0

    def load_release(self, campus, program, release_id):
        self.loads += 1
        if (campus, program, release_id) != (
            self.release.campus_id,
            self.release.program.id,
            self.release.id,
        ):
            raise KeyError("missing")
        return self.release


@pytest.fixture
def workspace_client():
    release = synthetic_release()
    repo = MemoryRepository(release)
    app = create_app()
    app.dependency_overrides[repository] = lambda: repo
    with TestClient(app) as client:
        yield client, release, repo


def test_catalog_scope_projection_and_no_writes(workspace_client):
    client, release, repo = workspace_client
    response = client.get(path(release))
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == json.loads(catalog_view(release).model_dump_json())
    assert [column["title"] for column in response.json()["columns"]] == [
        "Required Common Core",
        "Flexible Core",
        "Major Requirements",
        "Major Electives",
    ]
    assert repo.loads == 1
    assert (
        client.get(
            path(release).replace("synthetic-program", "wrong-program")
        ).status_code
        == 404
    )
    assert client.put(path(release), json={}).status_code == 405
    assert client.delete(path(release)).status_code == 405


@pytest.mark.parametrize("ids", [("m206", "m301", "m302"), ("m301", "m302")])
def test_http_preview_parity_and_unknown_grade(workspace_client, ids):
    client, release, repo = workspace_client
    body = {"hypothetical": True, "selected_course_ids": ids}
    response = client.post(path(release) + "/preview", json=body)
    assert response.status_code == 200
    direct = evaluate(
        release,
        EvaluationInput(
            campus_id=release.campus_id,
            release_id=release.id,
            record_revision="session-hypothetical",
            completions=tuple(
                Completion(
                    id=f"hypothetical:{id}", course_id=id, credits="4", verified=True
                )
                for id in ids
            ),
        ),
    )
    assert response.json()["snapshot"] == json.loads(direct.model_dump_json())
    result = next(
        item for item in response.json()["prerequisites"] if item["course_id"] == "m302"
    )
    assert result["prerequisite"]["status"] == "unresolved"
    assert result["prerequisite"]["reason"] == "missing_grade"
    assert repo.loads == 1


@pytest.mark.parametrize(
    "body",
    [
        {"hypothetical": False},
        {"selected_course_ids": ["m301"]},
        {"hypothetical": True, "selected_course_ids": ["m301", "m301"]},
        {"hypothetical": True, "selected_course_ids": ["unknown"]},
        {"hypothetical": True, "student_name": "not accepted"},
        {
            "hypothetical": True,
            "allocations": [
                {
                    "requirement_id": "math",
                    "completion_id": "hypothetical:m301",
                    "credits": "3",
                }
            ],
        },
    ],
)
def test_invalid_hypothetical_requests(workspace_client, body):
    client, release, _ = workspace_client
    response = client.post(path(release) + "/preview", json=body)
    assert response.status_code == 422
    assert response.headers["cache-control"] == "no-store"


def test_missing_credits_remain_unresolved():
    release = synthetic_release()
    changed = release.model_copy(
        update={
            "courses": (
                release.courses[0].model_copy(update={"credits": None}),
                *release.courses[1:],
            )
        }
    )
    result = preview(
        changed, HypotheticalRequest(hypothetical=True, selected_course_ids=("m206",))
    )
    assert result.state == "unresolved"
    assert result.snapshot is None
    assert result.issues == ("missing_catalog_credit:m206",)


def test_database_unconfigured_and_unreachable_fail_safely(monkeypatch):
    app = create_app()
    monkeypatch.delenv("V2_DATABASE_URL", raising=False)
    with TestClient(app) as client:
        response = client.get("/api/v1/academic/releases")
        assert response.status_code == 503
        assert "README" in response.json()["detail"]
        assert client.get("/api/v1/health").status_code == 200
        monkeypatch.setenv(
            "V2_DATABASE_URL",
            "postgresql+psycopg://v2_runtime:DO_NOT_DISCLOSE@127.0.0.1:65431/cuny_advisor_v2_test",
        )
        response = client.get("/api/v1/academic/releases")
        assert response.status_code == 503
        assert "DO_NOT_DISCLOSE" not in response.text


def test_malformed_context_path_and_json(workspace_client):
    client, release, _ = workspace_client
    assert (
        client.get(path(release).replace("test-campus", "bad%20campus")).status_code
        == 422
    )
    assert (
        client.post(
            path(release) + "/preview",
            content="not-json",
            headers={"Content-Type": "application/json"},
        ).status_code
        == 422
    )


@pytest.mark.parametrize("credits", [3.0, "1e999999999", "NaN", "-1"])
def test_preview_rejects_float_and_unbounded_credit_inputs(workspace_client, credits):
    client, release, _ = workspace_client
    response = client.post(
        path(release) + "/preview",
        json={
            "hypothetical": True,
            "selected_course_ids": ["m301"],
            "allocations": [
                {
                    "requirement_id": "math",
                    "completion_id": "hypothetical:m301",
                    "credits": credits,
                }
            ],
        },
    )
    assert response.status_code == 422


def test_placement_or_waiver_is_not_a_completion_input(workspace_client):
    client, release, _ = workspace_client
    assert (
        client.post(
            path(release) + "/preview",
            json={
                "hypothetical": True,
                "non_credit_evidence": [{"kind": "waiver", "course_id": "m301"}],
            },
        ).status_code
        == 422
    )


@pytest.mark.parametrize("allocations", [None, 5, "invalid"])
def test_malformed_allocation_container_is_422(workspace_client, allocations):
    client, release, _ = workspace_client
    assert (
        client.post(
            path(release) + "/preview",
            json={"hypothetical": True, "allocations": allocations},
        ).status_code
        == 422
    )
