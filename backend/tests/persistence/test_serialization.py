"""No database required: fail-closed configuration, contract and frozen DDL checks."""

from decimal import Decimal
import importlib.util
from pathlib import Path

import pytest
from sqlalchemy.dialects.postgresql import dialect
from sqlalchemy.schema import CreateTable

from app.academic.fixtures import bmcc_cs_evidence_reference
from app.persistence.config import local_url
from app.persistence.repository import canonical, digest, rows_for
from app.persistence.schema import metadata


@pytest.mark.parametrize(
    "url",
    [
        "sqlite://",
        "postgresql+psycopg://v2_runtime@production/cuny_advisor_v2_dev",
        "postgresql+psycopg://v2_runtime@localhost/v1",
        "postgresql+psycopg://postgres@localhost/cuny_advisor_v2_test",
        "postgresql+psycopg://v2_runtime@localhost/cuny_advisor_v2_test?options=bad",
    ],
)
def test_connection_guard(url):
    with pytest.raises(ValueError):
        local_url(url, "v2_runtime")


def test_valid_loopback_url():
    assert (
        local_url(
            "postgresql+psycopg://v2_runtime@127.0.0.1/cuny_advisor_v2_test",
            "v2_runtime",
        ).database
        == "cuny_advisor_v2_test"
    )


def test_canonical_decimal_scale_and_order():
    release = bmcc_cs_evidence_reference()
    course = release.courses[0].model_copy(
        update={"credits": Decimal("3.00000000000000000000000000000100")}
    )
    release = release.model_copy(update={"courses": (course, *release.courses[1:])})
    value = canonical(release)
    assert value["courses"][0]["credits"] == "3.00000000000000000000000000000100"
    assert digest(value) == digest(dict(reversed(list(value.items()))))
    other = canonical(
        release.model_copy(update={"courses": tuple(reversed(release.courses))})
    )
    assert digest(value) != digest(other)


def test_frozen_migration_matches_metadata():
    path = Path(__file__).parents[2] / "migrations/versions/02c_001_foundation.py"
    spec = importlib.util.spec_from_file_location("initial_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    generated = [
        str(CreateTable(table).compile(dialect=dialect()))
        for table in metadata.sorted_tables
    ]

    def strip_line_endings(value):
        return "\n".join(line.rstrip() for line in value.splitlines())

    assert [strip_line_endings(sql) for sql in module.STATEMENTS[: len(generated)]] == [
        strip_line_endings(sql) for sql in generated
    ]
    assert all(table.schema == "cuny_advisor_v2" for table in metadata.tables.values())
    assert all("public." not in sql for sql in module.STATEMENTS)


def test_projection_has_unique_keys():
    from app.persistence.repository import key_filter

    rows = rows_for(bmcc_cs_evidence_reference(), "reviewed-local-r1")
    keys = [
        (table.name, tuple(value[c.name] for c in table.primary_key))
        for table, value in rows
    ]
    assert len(keys) == len(set(keys))
    assert all(key_filter(table, value) is not None for table, value in rows)


def test_publication_rejected_before_connection():
    from app.persistence.repository import CatalogRepository

    release = bmcc_cs_evidence_reference().model_copy(update={"state": "published"})
    with pytest.raises(ValueError, match="draft"):
        CatalogRepository(None).save_release(release, revision_id="not-authorized")
