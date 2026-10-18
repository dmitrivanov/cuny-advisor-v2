"""Real PostgreSQL institutional imports, constraints and HTTP reads. No real records."""

import os
from uuid import uuid4
import pytest
import sqlalchemy as sa
from sqlalchemy.exc import DBAPIError, IntegrityError
from fastapi.testclient import TestClient
from app.institutions.repository import (
    InstitutionRepository,
    reviewed_dataset,
    reviewed_support,
)
from app.persistence import schema as db
from app.persistence.config import local_engine
from app.persistence.repository import PersistenceConflict
from app.main import create_app

pytestmark = pytest.mark.postgres


@pytest.fixture
def engines():
    if not os.getenv("V2_DATABASE_URL") or not os.getenv("V2_MIGRATION_DATABASE_URL"):
        pytest.skip("Disposable migrated V2 PostgreSQL required")
    runtime = local_engine(os.environ["V2_DATABASE_URL"])
    migration = local_engine(os.environ["V2_MIGRATION_DATABASE_URL"], "v2_migrator")
    yield runtime, migration
    runtime.dispose()
    migration.dispose()


def unique_dataset():
    data = reviewed_dataset().model_dump(mode="json")
    data["snapshot_id"] = "test-registry-" + uuid4().hex
    data["retrieved_on"] = (
        "2000-01-01"  # never supersedes the reviewed current snapshot
    )
    return type(reviewed_dataset()).model_validate(data)


def test_import_idempotency_registry_retrieval_and_catalog_isolation(engines):
    runtime, migration = engines
    data = reviewed_dataset()
    support = reviewed_support(data)
    with runtime.connect() as c:
        before = list(
            c.execute(
                sa.select(
                    db.binding.c.campus_id, db.binding.c.release_id, db.binding.c.digest
                ).order_by(db.binding.c.campus_id, db.binding.c.release_id)
            )
        )
    writer = InstitutionRepository(migration)
    reader = InstitutionRepository(runtime)
    writer.import_dataset(data, support)
    writer.import_dataset(data, support)
    actual = reader.list()
    assert {i.id for i in actual.institutions} == {i.id for i in data.institutions}
    assert [i.display_name.lower() for i in actual.institutions] == sorted(
        i.display_name.lower() for i in actual.institutions
    )
    assert sum(i.support_status == "pilot" for i in actual.institutions) == 1
    assert (
        next(i for i in actual.institutions if i.id == "bmcc").support_status == "pilot"
    )
    with runtime.connect() as c:
        after = list(
            c.execute(
                sa.select(
                    db.binding.c.campus_id, db.binding.c.release_id, db.binding.c.digest
                ).order_by(db.binding.c.campus_id, db.binding.c.release_id)
            )
        )
        assert after == before
        assert c.scalar(
            sa.select(sa.func.count())
            .select_from(db.institution_revision)
            .where(db.institution_revision.c.snapshot_id == data.snapshot_id)
        ) == len(data.institutions)
    client = TestClient(create_app())
    assert client.get("/api/v1/institutions").json() == actual.model_dump(mode="json")
    assert (
        client.get("/api/v1/institutions/medicine").json()["category"]
        == "graduate_professional"
    )
    assert client.get("/api/v1/institutions/ccny").json()["support_status"] == "planned"


def test_runtime_cannot_write_or_alter_registry(engines):
    runtime, migration = engines
    for table in (
        db.registry_snapshot,
        db.institution,
        db.registry_source,
        db.institution_revision,
        db.institution_source,
    ):
        with pytest.raises(DBAPIError) as denied, runtime.begin() as c:
            c.execute(
                sa.insert(table).values(
                    {
                        column.name: "untrusted"
                        for column in table.columns
                        if isinstance(column.type, sa.Text)
                    }
                )
            )
        assert denied.value.orig.sqlstate == "42501"
    with pytest.raises(DBAPIError), migration.begin() as c:
        c.execute(
            sa.update(db.institution)
            .where(db.institution.c.institution_id == "bmcc")
            .values(support_status="planned")
        )


def test_conflict_is_atomic_and_historical_snapshots_retained(engines):
    runtime, migration = engines
    writer = InstitutionRepository(migration)
    data = reviewed_dataset()
    writer.import_dataset(data, reviewed_support(data))
    old = unique_dataset()
    writer.import_dataset(old, reviewed_support(old))
    altered = data.model_copy(
        update={
            "institutions": (
                data.institutions[0].model_copy(update={"display_name": "Conflicting"}),
                *data.institutions[1:],
            )
        }
    )
    with pytest.raises(PersistenceConflict):
        writer.import_dataset(altered, reviewed_support(altered))
    assert InstitutionRepository(runtime).list().snapshot_id == data.snapshot_id
    with runtime.connect() as c:
        assert c.scalar(
            sa.select(sa.func.count())
            .select_from(db.institution_revision)
            .where(db.institution_revision.c.snapshot_id == old.snapshot_id)
        ) == len(old.institutions)
    bad = unique_dataset().model_dump(mode="json")
    bad["institutions"][0]["slug"] = "bmcc"
    # Slug collision against another stable identity rolls back the new snapshot.
    bad["institutions"][1]["slug"] = "new-bmcc-slug"
    bad = type(data).model_validate(bad)
    with pytest.raises(PersistenceConflict):
        writer.import_dataset(bad, reviewed_support(bad))
    with runtime.connect() as c:
        assert (
            c.scalar(
                sa.select(sa.func.count())
                .select_from(db.registry_snapshot)
                .where(db.registry_snapshot.c.snapshot_id == bad.snapshot_id)
            )
            == 0
        )


@pytest.mark.parametrize("kind", ["missing", "extra", "modified", "shared_source"])
def test_registry_projection_integrity_fails_closed(engines, kind):
    _, migration = engines
    data = unique_dataset()
    repo = InstitutionRepository(migration)
    repo.import_dataset(data, reviewed_support(data))
    with migration.connect() as c:
        transaction = c.begin()
        c.execute(
            sa.text(
                "ALTER TABLE cuny_advisor_v2.institution_registry_source DISABLE TRIGGER immutable_rows"
            )
        )
        c.execute(
            sa.text(
                "ALTER TABLE cuny_advisor_v2.institution_revision DISABLE TRIGGER immutable_rows"
            )
        )
        c.execute(
            sa.text(
                "ALTER TABLE cuny_advisor_v2.institution_source_reference DISABLE TRIGGER immutable_rows"
            )
        )
        if kind == "missing":
            c.execute(
                sa.delete(db.institution_source).where(
                    db.institution_source.c.snapshot_id == data.snapshot_id,
                    db.institution_source.c.institution_id == "bmcc",
                )
            )
            c.execute(
                sa.delete(db.institution_revision).where(
                    db.institution_revision.c.snapshot_id == data.snapshot_id,
                    db.institution_revision.c.institution_id == "bmcc",
                )
            )
        elif kind == "modified":
            c.execute(
                sa.update(db.institution_revision)
                .where(
                    db.institution_revision.c.snapshot_id == data.snapshot_id,
                    db.institution_revision.c.institution_id == "bmcc",
                )
                .values(display_name="Wrong")
            )
        elif kind == "extra":
            c.execute(
                sa.insert(db.registry_source).values(
                    snapshot_id=data.snapshot_id,
                    source_id="extra",
                    url="https://www.cuny.edu/extra",
                    title="Extra",
                    retrieved_on=data.retrieved_on,
                )
            )
        else:
            c.execute(
                sa.update(db.institution_source)
                .where(
                    db.institution_source.c.snapshot_id == data.snapshot_id,
                    db.institution_source.c.institution_id == "bmcc",
                    db.institution_source.c.source_id == "colleges",
                )
                .values(locator="Wrong shared reference")
            )
        with pytest.raises((PersistenceConflict, ValueError)):
            repo._load(c, data.snapshot_id)
        transaction.rollback()  # restore every row and trigger, including failed assertions


def test_cross_snapshot_foreign_keys_and_capability_constraint(engines):
    _, migration = engines
    for statement in [
        sa.insert(db.institution_source).values(
            snapshot_id="nonexistent",
            institution_id="bmcc",
            source_id="colleges",
            locator="Invalid",
        ),
        sa.insert(db.institution).values(
            institution_id="ccny", slug="cannot-operate", support_status="pilot"
        ),
    ]:
        with pytest.raises(IntegrityError), migration.begin() as c:
            c.execute(statement)
