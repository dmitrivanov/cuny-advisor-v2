"""Real PostgreSQL only. Missing URL skips; configured connection errors fail."""

from decimal import Decimal
import os
from pathlib import Path

from alembic import command
from alembic.config import Config
import pytest
import sqlalchemy as sa
from sqlalchemy.exc import DBAPIError, IntegrityError

from app.academic.contracts import EvaluationInput, NonCreditEvidence, Release, Snapshot
from app.academic.evaluation import evaluate, eligibility
from app.academic.fixtures import (
    bmcc_cis_reference,
    bmcc_cs_evidence_reference,
    bmcc_cs_reference,
)
from app.persistence import schema as db
from app.persistence.config import local_engine
from app.persistence.repository import CatalogRepository, PersistenceConflict, canonical
from academic_factory import synthetic_release
from test_academic import history, allocate

pytestmark = pytest.mark.postgres


@pytest.fixture(scope="module")
def engine():
    url = os.environ.get("V2_DATABASE_URL")
    if not url:
        pytest.skip(
            "V2_DATABASE_URL absent: disposable PostgreSQL integration not executed"
        )
    value = local_engine(url)
    yield value
    value.dispose()


@pytest.fixture
def repo(engine):
    return CatalogRepository(engine)


def test_00_migration_and_empty_downgrade(engine):
    config = Config("alembic.ini")
    command.upgrade(config, "head")
    with engine.connect() as connection:
        assert (
            connection.scalar(
                sa.text("SELECT version_num FROM cuny_advisor_v2.alembic_version")
            )
            == "02c_001"
        )
        if connection.scalar(sa.select(sa.func.count()).select_from(db.binding)):
            pytest.skip("empty-only downgrade requires a fresh disposable database")
    command.downgrade(config, "base")
    command.upgrade(config, "head")
    command.upgrade(config, "head")
    with engine.connect() as connection:
        names = set(sa.inspect(connection).get_table_names(schema="cuny_advisor_v2"))
        assert names == {table.name for table in db.metadata.tables.values()} | {
            "alembic_version"
        }
        assert not sa.inspect(connection).get_table_names(schema="public")


@pytest.mark.parametrize(
    "factory", [bmcc_cs_reference, bmcc_cs_evidence_reference, bmcc_cis_reference]
)
def test_release_roundtrip_parity_and_idempotency(repo, factory):
    release = factory()
    repo.save_release(release, revision_id="bmcc-2026-27-reviewed-fixture-r1")
    repo.save_release(release, revision_id="bmcc-2026-27-reviewed-fixture-r1")
    loaded = repo.load_release(release.campus_id, release.program.id, release.id)
    assert canonical(loaded) == canonical(release)
    inputs = EvaluationInput(
        campus_id=release.campus_id,
        release_id=release.id,
        record_revision="synthetic-empty",
    )
    assert canonical(
        repo.evaluate(release.campus_id, release.program.id, inputs)
    ) == canonical(evaluate(release, inputs))
    with pytest.raises(KeyError):
        repo.load_release("other-campus", release.program.id, release.id)
    with pytest.raises(KeyError):
        repo.load_release(release.campus_id, "other-program", release.id)
    changed = release.model_copy(
        update={"issues": (*release.issues, "conflicting content")}
    )
    with pytest.raises(PersistenceConflict):
        repo.save_release(changed, revision_id="bmcc-2026-27-reviewed-fixture-r1")
    assert canonical(
        repo.load_release(release.campus_id, release.program.id, release.id)
    ) == canonical(release)


@pytest.mark.parametrize(
    "path", [("m206",), ("m301",), ("m301", "m302"), ("m206", "m301", "m302")]
)
def test_math_paths_and_ledger_parity(repo, path):
    release = synthetic_release()
    repo.save_release(release, revision_id="synthetic-r1")
    loaded = repo.load_release(release.campus_id, release.program.id, release.id)
    allocations = [allocate("math", path[0], "3")]
    if "m302" in path:
        allocations.append(allocate("major-calculus", "m302", "4"))
    inputs = history(release, *path, allocations=tuple(allocations))
    assert canonical(evaluate(loaded, inputs)) == canonical(evaluate(release, inputs))
    assert eligibility(loaded, inputs, "m302") == eligibility(release, inputs, "m302")
    # All existing allocation protections execute on DB-loaded models unchanged.
    invalid = history(release, "m206", allocations=(allocate("math", "m206", "9"),))
    assert canonical(evaluate(loaded, invalid)) == canonical(evaluate(release, invalid))


def test_precision_noncredit_snapshot_and_conflicts(repo):
    release = synthetic_release()
    data = canonical(release)
    data["id"] = "synthetic-exact-decimal"
    data["courses"][0]["version_id"] = "exact-decimal-course-version"
    data["courses"][0]["credits"] = "3.00000000000000000000000000000100"
    release = Release.model_validate(data)
    repo.save_release(release, revision_id="synthetic-r1")
    loaded = repo.load_release(release.campus_id, release.program.id, release.id)
    assert str(loaded.courses[0].credits) == "3.00000000000000000000000000000100"
    inputs = EvaluationInput(
        campus_id=release.campus_id,
        release_id=release.id,
        record_revision="synthetic-waiver",
        non_credit_evidence=(
            NonCreditEvidence(
                id="waiver",
                course_id="m206",
                kind="waiver",
                note="Synthetic unapproved claim",
            ),
        ),
    )
    snapshot = evaluate(release, inputs)
    repo.save_synthetic_snapshot("synthetic-waiver", snapshot, synthetic=True)
    repo.save_synthetic_snapshot("synthetic-waiver", snapshot, synthetic=True)
    assert canonical(
        repo.load_synthetic_snapshot(
            release.campus_id, release.program.id, release.id, "synthetic-waiver"
        )
    ) == canonical(snapshot)
    assert canonical(evaluate(loaded, inputs)) == canonical(snapshot)
    assert snapshot.earned_credits == Decimal(0)
    with pytest.raises(PersistenceConflict):
        repo.save_synthetic_snapshot(
            "synthetic-waiver",
            snapshot.model_copy(update={"issues": ("changed",)}),
            synthetic=True,
        )
    with pytest.raises(ValueError):
        repo.save_synthetic_snapshot("not-synthetic", snapshot, synthetic=False)


def test_two_years_and_historical_engine(repo):
    historical = Snapshot.model_validate_json(
        (Path(__file__).parents[1] / "fixtures/phase02a_snapshot.json").read_text()
    )
    repo.save_release(historical.release, revision_id="synthetic-history-r1")
    repo.save_synthetic_snapshot("retained-02a", historical, synthetic=True)
    loaded = repo.load_synthetic_snapshot(
        historical.release.campus_id,
        historical.release.program.id,
        historical.release.id,
        "retained-02a",
    )
    assert canonical(loaded) == canonical(historical)
    assert loaded.engine_version == "02a.1"
    # A new result retains the current engine ID and never relabels old results.
    current = evaluate(historical.release, historical.inputs)
    repo.save_synthetic_snapshot("recomputed-02b", current, synthetic=True)
    assert current.engine_version == "02b.1"
    newer = synthetic_release()
    repo.save_release(newer, revision_id="synthetic-r1")
    assert newer.catalog_year != historical.release.catalog_year


def test_atomic_rollback_version_conflict(repo, engine):
    release = synthetic_release()
    repo.save_release(release, revision_id="synthetic-r1")
    data = canonical(release)
    data["id"] = "must-rollback-release"
    data["courses"][-1]["title"] = "Conflicts with existing immutable course version"
    with pytest.raises(PersistenceConflict):
        repo.save_release(
            Release.model_validate(data), revision_id="must-rollback-revision"
        )
    with engine.connect() as connection:
        assert not connection.scalar(
            sa.select(sa.func.count())
            .select_from(db.binding)
            .where(db.binding.c.release_id == data["id"])
        )
        assert not connection.scalar(
            sa.select(sa.func.count())
            .select_from(db.revision)
            .where(db.revision.c.revision_id == "must-rollback-revision")
        )


def test_scope_fk_and_no_code_equivalence(repo, engine):
    release = synthetic_release()
    repo.save_release(release, revision_id="synthetic-r1")
    data = canonical(release)
    data["campus_id"] = data["program"]["campus_id"] = "second-synthetic-campus"
    data["id"] = "second-campus-release"
    for course in data["courses"]:
        course["identity"]["campus_id"] = data["campus_id"]
    second = Release.model_validate(data)
    repo.save_release(second, revision_id="second-campus-r1")
    assert (
        repo.load_release(second.campus_id, second.program.id, second.id)
        .courses[0]
        .code
        == release.courses[0].code
    )
    with pytest.raises(IntegrityError), engine.begin() as connection:
        connection.execute(
            db.membership.insert().values(
                campus_id=release.campus_id,
                program_id="wrong-program",
                release_id=release.id,
                course_id=release.courses[0].identity.id,
                version_id=release.courses[0].version_id,
                position=999,
            )
        )
    with pytest.raises(IntegrityError), engine.begin() as connection:
        connection.execute(
            db.version.insert().values(
                campus_id="nonexistent-campus",
                course_id=release.courses[0].identity.id,
                version_id="bad-cross-campus",
                payload=canonical(release.courses[0]),
                digest="a" * 64,
            )
        )
    crossed = canonical(release)
    crossed["sources"][0]["campus_id"] = release.campus_id
    crossed["sources"][0]["program_id"] = "other-program"
    with pytest.raises(ValueError, match="cross-program"):
        repo.save_release(Release.model_validate(crossed), revision_id="invalid")


def test_runtime_permissions_and_immutable_rows(engine, repo):
    release = synthetic_release()
    repo.save_release(release, revision_id="synthetic-r1")
    for statement in (
        "CREATE TABLE cuny_advisor_v2.forbidden (id integer)",
        "CREATE TABLE public.forbidden (id integer)",
        "CREATE SCHEMA forbidden",
        "CREATE TEMP TABLE forbidden (id integer)",
        "UPDATE cuny_advisor_v2.campus SET campus_id=campus_id",
        "DELETE FROM cuny_advisor_v2.campus",
        "TRUNCATE cuny_advisor_v2.campus CASCADE",
    ):
        with pytest.raises(DBAPIError), engine.begin() as connection:
            connection.execute(sa.text(statement))
    # Owner-side trigger blocks accidental mutation as well as runtime grants.
    migration = local_engine(os.environ["V2_MIGRATION_DATABASE_URL"], "v2_migrator")
    try:
        with pytest.raises(DBAPIError), migration.begin() as connection:
            connection.execute(
                sa.text("UPDATE cuny_advisor_v2.campus SET campus_id=campus_id")
            )
        with pytest.raises(RuntimeError, match="history"):
            command.downgrade(Config("alembic.ini"), "base")
    finally:
        migration.dispose()


def test_corruption_is_detected(repo, engine):
    from app.persistence.repository import digest

    release = synthetic_release().model_copy(
        update={"id": "synthetic-corruption-check"}
    )
    repo.save_release(release, revision_id="synthetic-r1")
    inputs = history(release, "m301")
    snapshot = evaluate(release, inputs)
    scope = dict(
        campus_id=release.campus_id,
        program_id=release.program.id,
        release_id=release.id,
    )
    # Runtime cannot alter old rows, but forged new payloads must still fail closed.
    with engine.begin() as connection:
        connection.execute(
            db.snapshot.insert().values(
                **scope,
                snapshot_id="bad-hash",
                engine_version=snapshot.engine_version,
                release_digest=digest(canonical(release)),
                payload=canonical(snapshot),
                digest="0" * 64
            )
        )
    with pytest.raises(PersistenceConflict, match="snapshot integrity"):
        repo.load_synthetic_snapshot(
            release.campus_id, release.program.id, release.id, "bad-hash"
        )
    with engine.begin() as connection:
        changed = release.courses[0].model_copy(
            update={
                "identity": release.courses[0].identity.model_copy(
                    update={"id": "extra-member"}
                ),
                "version_id": "extra-member-version",
            }
        )
        connection.execute(
            db.course.insert().values(
                campus_id=release.campus_id, course_id="extra-member"
            )
        )
        connection.execute(
            db.version.insert().values(
                campus_id=release.campus_id,
                course_id="extra-member",
                version_id="extra-member-version",
                payload=canonical(changed),
                digest=digest(canonical(changed)),
            )
        )
        connection.execute(
            db.membership.insert().values(
                **scope,
                course_id="extra-member",
                version_id="extra-member-version",
                position=999
            )
        )
    with pytest.raises(PersistenceConflict, match="projection"):
        repo.load_release(release.campus_id, release.program.id, release.id)


def test_publication_and_revision_rebinding_rejected(repo):
    release = synthetic_release()
    with pytest.raises(ValueError, match="draft"):
        repo.save_release(
            release.model_copy(update={"state": "published"}),
            revision_id="unauthorized-publication",
        )
    repo.save_release(release, revision_id="synthetic-r1")
    with pytest.raises(PersistenceConflict):
        repo.save_release(release, revision_id="different-revision")
