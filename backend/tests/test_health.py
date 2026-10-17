import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client():
    with TestClient(create_app()) as client:
        yield client


def test_health_contract(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "cuny-advisor-v2-api"}
    assert response.headers["content-type"] == "application/json"
    assert response.headers["cache-control"] == "no-store"


def test_health_disallows_mutation(client):
    assert client.post("/api/v1/health").status_code == 405


def test_unversioned_health_is_not_exposed(client):
    assert client.get("/health").status_code == 404


def test_only_authorized_workspace_and_conversation_routes_are_registered(client):
    schema = client.get("/openapi.json").json()
    prefix = "/api/v1/academic/campuses/{campus_id}/programs/{program_id}/releases/{release_id}"
    assert {path: set(methods) for path, methods in schema["paths"].items()} == {
        "/api/v1/health": {"get"},
        "/api/v1/conversation/status": {"get"},
        "/api/v1/conversation/session": {"post"},
        "/api/v1/conversation": {"post"},
        "/api/v1/academic/releases": {"get"},
        prefix: {"get"},
        prefix + "/preview": {"post"},
    }
