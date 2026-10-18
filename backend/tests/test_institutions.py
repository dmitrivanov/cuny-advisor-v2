"""Verified source membership and read boundary tests; no AI, network or DB needed."""

from collections import Counter
import importlib.util
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects.postgresql import dialect
from app.institutions.contracts import Dataset
from app.institutions.repository import (
    DATA,
    TABLES,
    reviewed_dataset,
    reviewed_support,
    fingerprint,
)
from app.api.v1.institutions import repository
from app.main import create_app
from app.institutions.contracts import RegistryView, InstitutionView


def view():
    value = reviewed_dataset()
    support = reviewed_support(value)
    return RegistryView(
        snapshot_id=value.snapshot_id,
        retrieved_on=value.retrieved_on,
        scope_source=value.scope_source,
        sources=value.sources,
        institutions=tuple(
            InstitutionView(**i.model_dump(), support_status=support[i.id])
            for i in value.institutions
        ),
    )


def test_complete_verified_listing_without_assumed_total():
    dataset = reviewed_dataset()
    captured = json.loads((DATA / "source_membership_2026_10_17.json").read_text())
    assert len(dataset.institutions) == len(captured["entries"])
    expected = {(row["listing_name"], row["website"]) for row in captured["entries"]}
    actual = {
        (
            next(
                r.locator.removesuffix("; Website link")
                for r in i.sources
                if r.source_id == "colleges"
            ),
            str(i.website),
        )
        for i in dataset.institutions
    }
    assert actual == {
        (name, url if url.endswith("/") or "/" in url.split("://")[1] else url + "/")
        for name, url in expected
    }
    counts = Counter(i.category for i in dataset.institutions)
    assert counts == {
        "senior_college": 11,
        "community_college": 7,
        "graduate_professional": 7,
        "honors_college": 1,
    }
    assert reviewed_support(dataset) == {
        i.id: "pilot" if i.id == "bmcc" else "planned" for i in dataset.institutions
    }
    assert (
        next(i for i in dataset.institutions if i.id == "medicine").category
        == "graduate_professional"
    )
    assert (
        "Consortial"
        in next(
            i for i in dataset.institutions if i.id == "macaulay"
        ).classification_note
    )
    assert all("cuny.edu" in str(s.url) for s in dataset.sources)
    assert len(captured["html_sha256"]) == 64


@pytest.mark.parametrize("field", ["id", "slug", "official_name"])
def test_duplicate_identities_rejected(field):
    data = reviewed_dataset().model_dump(mode="json")
    data["institutions"][1][field] = data["institutions"][0][field]
    with pytest.raises(ValueError):
        Dataset.model_validate(data)


def test_source_and_category_validation_and_stable_digest():
    value = reviewed_dataset()
    support = reviewed_support(value)
    reverse = value.model_copy(
        update={"institutions": tuple(reversed(value.institutions))}
    )
    assert fingerprint(value, support) == fingerprint(reverse, support)
    data = value.model_dump(mode="json")
    data["institutions"][0]["sources"][0]["source_id"] = "absent"
    with pytest.raises(ValueError):
        Dataset.model_validate(data)
    data = value.model_dump(mode="json")
    data["institutions"][0]["category"] = "admin_office"
    with pytest.raises(ValueError):
        Dataset.model_validate(data)


def test_frozen_registry_migration_matches_new_metadata():
    path = (
        Path(__file__).parents[1]
        / "migrations/versions/04b_001_institutional_registry.py"
    )
    spec = importlib.util.spec_from_file_location("registry_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.down_revision == "02c_001"
    generated = [
        str(CreateTable(table).compile(dialect=dialect())).strip() for table in TABLES
    ]
    statements = [
        s.strip() for s in module.STATEMENTS if s.lstrip().startswith("CREATE TABLE")
    ]
    assert statements == generated
    assert all("GRANT SELECT, INSERT" not in s for s in module.STATEMENTS)


class FakeRepository:
    def __init__(self, value):
        self.value = value

    def list(self):
        return self.value


def client(value):
    app = create_app()
    app.dependency_overrides[repository] = lambda: FakeRepository(value)
    return TestClient(app)


def test_registry_contract_support_and_missing_slug():
    c = client(view())
    response = c.get("/api/v1/institutions")
    assert (
        response.status_code == 200 and response.headers["cache-control"] == "no-store"
    )
    value = response.json()
    assert len(value["institutions"]) == len(reviewed_dataset().institutions)
    assert c.get("/api/v1/institutions/bmcc").json()["support_status"] == "pilot"
    assert c.get("/api/v1/institutions/medicine").json()["support_status"] == "planned"
    assert c.get("/api/v1/institutions/missing").status_code == 404
    assert c.post("/api/v1/institutions").status_code == 405
    assert c.get("/api/v1/institutions/INVALID").status_code == 422


def test_empty_and_database_failure_do_not_return_fixtures(monkeypatch):
    assert client(None).get("/api/v1/institutions").json() is None
    monkeypatch.delenv("V2_DATABASE_URL", raising=False)
    response = TestClient(create_app()).get("/api/v1/institutions")
    assert (
        response.status_code == 503
        and "Institution registry unavailable" in response.text
    )
    assert "postgresql" not in response.text
