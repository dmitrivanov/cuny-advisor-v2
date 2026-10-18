"""Public source facts and synthetic rule representations; no student records or AI."""

from decimal import Decimal
from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path
import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects.postgresql import dialect
from app.academic.contracts import Unknown
from app.catalog_ingestion.contracts import Snapshot, RuleText
from app.catalog_ingestion.repository import reviewed_snapshot
from app.catalog_ingestion.pipeline import stage, DATA, read
from app.catalog_ingestion import schema as db
from app.api.v1.bmcc_catalog import repository
from app.main import create_app


@pytest.fixture(scope="module")
def data():
    return reviewed_snapshot()


def test_offline_reconstruction_and_coverage(data):
    rebuilt, report = stage(DATA / "source_extracts")
    assert rebuilt == data and report == read(DATA / "coverage.json")
    assert len(data.programs) == len(read(DATA / "source_extracts/programs.json"))
    assert sum(d.kind == "academic_department" for d in data.departments) == len(
        read(DATA / "source_extracts/departments.json")
    )
    assert len(data.courses) == report["unique_listed_codes"] - len(
        {r["code"] for r in report["excluded"]}
    ) - len(report["conflicting_codes"])
    assert all(
        c.description and c.description_original and c.credits_max > 0
        for c in data.courses
    )
    assert all(isinstance(c.credits_min, Decimal) for c in data.courses)
    assert {"ITL 180E", "ITL 190E"} == set(report["conflicting_codes"])
    assert all(c.prerequisite.status != "source_verified" for c in data.courses)


def test_years_provenance_and_relationships_are_not_guessed(data):
    assert data.catalog_year == "2025-2026"
    assert all(c.catalog_year == data.catalog_year for c in data.courses)
    assert all(
        p.catalog_year is None and not p.requirement_sources for p in data.programs
    )
    assert all(
        p.relationship in ("page_host_only", "unresolved") for p in data.programs
    )
    math = next(d for d in data.departments if d.id == "MATH-BMC")
    cis = next(d for d in data.departments if d.id == "CIS-BMC")
    assert math.prefixes == ("MAT",) and {"CIS", "CSC"} <= set(cis.prefixes)
    course = next(c for c in data.courses if c.code == "MAT 301")
    assert course.credits_min == Decimal("4")
    assert course.prerequisite.status == "provisional"
    assert "MAT 206 or MAT 206.5" in course.prerequisite.text
    assert isinstance(course.prerequisite.expression, Unknown)
    assert all(e.catalog_year is None for e in course.prerequisite.evidence)
    assert any(c.prerequisite.text is None for c in data.courses)
    assert all(isinstance(c.prerequisite.expression, Unknown) for c in data.courses)


@pytest.mark.parametrize("mutation", ["duplicate", "year", "relationship", "source"])
def test_invalid_staging_rejected(data, mutation):
    value = data.model_dump(mode="json")
    if mutation == "duplicate":
        value["courses"].append(value["courses"][0])
    elif mutation == "year":
        value["courses"][0]["catalog_year"] = "2026-2027"
    elif mutation == "relationship":
        value["courses"][0]["department_ids"] = ["other-campus"]
    else:
        value["courses"][0]["evidence"][0]["source_id"] = "unknown"
    with pytest.raises(ValidationError):
        Snapshot.model_validate(value)


def test_nested_rule_representation_exact_credits_and_unverified_rejection(data):
    evidence = [
        dict(
            source_id="synthetic",
            locator="fictional rule",
            catalog_year="synthetic-year",
        )
    ]
    rule = RuleText(
        text="Fictional: A AND (B OR placement), with permission concurrently in program",
        status="source_verified",
        evidence=evidence,
        expression={
            "op": "all",
            "children": [
                {"op": "completed", "course_id": "A", "minimum_grade_rank": 3},
                {
                    "op": "any",
                    "children": [
                        {"op": "completed", "course_id": "B"},
                        {"op": "placement", "value": "fictional-test"},
                    ],
                },
                {"op": "permission", "value": "fictional department"},
                {"op": "concurrent", "value": "fictional C"},
                {"op": "program", "value": "fictional program"},
            ],
        },
    )
    assert RuleText.model_validate_json(rule.model_dump_json()) == rule
    bad = rule.model_dump()
    bad["status"] = "provisional"
    with pytest.raises(ValueError):
        RuleText.model_validate(bad)
    bad = rule.model_dump()
    bad["evidence"][0]["catalog_year"] = None
    with pytest.raises(ValueError):
        RuleText.model_validate(bad)
    c = data.courses[0].model_copy(
        update={
            "credits_min": Decimal("1.0000000000000000000000000001"),
            "credits_max": Decimal("4.000"),
        }
    )
    assert "1.0000000000000000000000000001" in c.model_dump_json()


def test_frozen_migration():
    path = Path(__file__).parents[1] / "migrations/versions/04c1_001_bmcc_catalog.py"
    spec = spec_from_file_location("browse_migration", path)
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.down_revision == "04b_001"
    assert [
        s.strip() for s in module.STATEMENTS if s.lstrip().startswith("CREATE TABLE")
    ] == [str(CreateTable(t).compile(dialect=dialect())).strip() for t in db.TABLES]


class Fake:
    def __init__(self, data):
        self.data = data

    def load(self, id):
        if id != self.data.id:
            raise KeyError(id)
        return self.data

    def snapshots(self):
        return [
            {
                "snapshot_id": self.data.id,
                "campus_id": "bmcc",
                "catalog_year": self.data.catalog_year,
            }
        ]


def test_api_contract_search_detail_and_errors(data):
    app = create_app()
    app.dependency_overrides[repository] = lambda: Fake(data)
    client = TestClient(app)
    root = "/api/v1/bmcc-catalog/"
    assert client.get(root + "snapshots").json()[0]["catalog_year"] == "2025-2026"
    value = client.get(root + data.id + "/courses?q=MAT%20301").json()
    assert value["total"] >= 1 and value["items"][0]["credits_min"] == "4"
    course = next(c for c in data.courses if c.code == "MAT 301")
    assert (
        client.get(root + data.id + "/courses/" + course.id).json()["prerequisite"][
            "status"
        ]
        == "provisional"
    )
    assert client.get(root + data.id + "/departments").status_code == 200
    assert client.get(root + data.id + "/programs").status_code == 200
    assert client.get(root + "missing/courses").status_code == 404
    assert client.get(root + data.id + "/courses/missing").status_code == 404
    assert client.get(root + data.id + "/courses?limit=999").status_code == 422
    assert client.post(root + "snapshots").status_code == 405
    assert (
        client.get(root + data.id + "/courses").headers["cache-control"] == "no-store"
    )


def test_missing_configuration_has_no_fallback(monkeypatch):
    monkeypatch.delenv("V2_DATABASE_URL", raising=False)
    response = TestClient(create_app()).get("/api/v1/bmcc-catalog/snapshots")
    assert response.status_code == 503


def test_source_decoder_refuses_missing_and_cyclic_format():
    from app.catalog_ingestion.source import nuxt_document

    with pytest.raises(ValueError):
        nuxt_document("<html>unrecognized layout</html>")
    with pytest.raises(ValueError):
        nuxt_document('<script id="__NUXT_DATA__">[{"cycle":0}]</script>')
    assert nuxt_document(
        '<script id="__NUXT_DATA__">[{"label":1},"public fact"]</script>'
    ) == {"label": "public fact"}
