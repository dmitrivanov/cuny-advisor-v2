"""Real disposable PostgreSQL browsing isolation and append-only integrity."""

import os
from uuid import uuid4
import pytest
import sqlalchemy as sa
from sqlalchemy.exc import DBAPIError, IntegrityError
from app.persistence.config import local_engine
from app.persistence.repository import PersistenceConflict
from app.persistence import schema as academic
from app.catalog_ingestion import schema as db
from app.catalog_ingestion.repository import BrowseRepository, reviewed_snapshot

pytestmark = pytest.mark.postgres


@pytest.fixture(scope="module")
def engines():
    if not os.getenv("V2_DATABASE_URL") or not os.getenv("V2_MIGRATION_DATABASE_URL"):
        pytest.skip("Disposable V2 PostgreSQL required")
    runtime = local_engine(os.environ["V2_DATABASE_URL"])
    owner = local_engine(os.environ["V2_MIGRATION_DATABASE_URL"], "v2_migrator")
    yield runtime, owner
    runtime.dispose()
    owner.dispose()


def test_full_import_idempotency_and_academic_isolation(engines):
    runtime, owner = engines
    value = reviewed_snapshot()
    with runtime.connect() as c:
        before = list(
            c.execute(
                sa.select(
                    academic.binding.c.release_id, academic.binding.c.digest
                ).order_by(academic.binding.c.release_id)
            )
        )
    writer = BrowseRepository(owner)
    writer.import_reviewed(value)
    writer.import_reviewed(value)
    assert BrowseRepository(runtime).load(value.id) == value
    with runtime.connect() as c:
        assert (
            list(
                c.execute(
                    sa.select(
                        academic.binding.c.release_id, academic.binding.c.digest
                    ).order_by(academic.binding.c.release_id)
                )
            )
            == before
        )
        assert c.scalar(
            sa.select(sa.func.count())
            .select_from(db.course)
            .where(db.course.c.snapshot_id == value.id)
        ) == len(value.courses)


def test_conflict_atomicity_history_and_year_separation(engines):
    runtime, owner = engines
    repo = BrowseRepository(owner)
    value = reviewed_snapshot()
    other = value.model_copy(
        update={"id": "synthetic-history-" + uuid4().hex, "courses": value.courses[:2]}
    )
    repo.import_reviewed(other)
    assert BrowseRepository(runtime).load(value.id) == value
    changed = other.model_copy(
        update={
            "courses": (
                other.courses[0].model_copy(
                    update={"title": "Conflicting fictional title"}
                ),
                *other.courses[1:],
            )
        }
    )
    with pytest.raises(PersistenceConflict):
        repo.import_reviewed(changed)
    assert BrowseRepository(runtime).load(other.id) == other
    invalid = value.model_copy(
        update={"id": "synthetic-invalid-" + uuid4().hex, "catalog_year": "2099-2100"}
    )
    with pytest.raises(ValueError):
        repo.import_reviewed(invalid)
    assert not any(r["snapshot_id"] == invalid.id for r in repo.snapshots())


@pytest.mark.parametrize("kind", ["missing", "modified", "extra"])
def test_projection_drift_fails_closed(engines, kind):
    _, owner = engines
    repo = BrowseRepository(owner)
    value = reviewed_snapshot()
    with owner.connect() as c:
        tx = c.begin()
        try:
            c.execute(
                sa.text(
                    "ALTER TABLE cuny_advisor_v2.browse_catalog_source DISABLE TRIGGER immutable_rows"
                )
            )
            predicate = db.source.c.snapshot_id == value.id
            if kind == "missing":
                c.execute(
                    sa.delete(db.source).where(
                        predicate, db.source.c.entity_id == value.sources[0].id
                    )
                )
            elif kind == "modified":
                c.execute(sa.update(db.source).where(predicate).values(digest="0" * 64))
            else:
                c.execute(
                    sa.insert(db.source).values(
                        snapshot_id=value.id,
                        entity_id="extra",
                        payload={},
                        digest="0" * 64,
                    )
                )
            with pytest.raises(PersistenceConflict):
                repo.load(value.id, c)
        finally:
            tx.rollback()


def test_permissions_immutability_and_scoped_foreign_keys(engines):
    runtime, owner = engines
    value = reviewed_snapshot()
    for table in db.TABLES:
        with pytest.raises(DBAPIError) as error, runtime.begin() as c:
            c.execute(
                sa.insert(table).values(
                    {k.name: "untrusted" for k in table.primary_key}
                )
            )
        assert error.value.orig.sqlstate == "42501"
    with pytest.raises(DBAPIError), owner.begin() as c:
        c.execute(sa.delete(db.snapshot).where(db.snapshot.c.snapshot_id == value.id))
    with pytest.raises(IntegrityError), owner.begin() as c:
        c.execute(
            sa.insert(db.course_department).values(
                snapshot_id="unrelated",
                entity_id=value.courses[0].id,
                department_id=value.departments[0].id,
            )
        )
