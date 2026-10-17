"""Real PostgreSQL integrity and independent-transaction contention regressions."""

from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import copy
import os
from threading import Barrier
from uuid import uuid4

import pytest
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError

from academic_factory import synthetic_release
from app.academic.contracts import Release
from app.persistence import schema as db
from app.persistence.config import local_engine
from app.persistence.repository import (
    CatalogRepository,
    PersistenceConflict,
    canonical,
    digest,
    ensure,
    key_filter,
    rows_for,
)

pytestmark = pytest.mark.postgres


@pytest.fixture
def engine():
    if not os.environ.get("V2_DATABASE_URL"):
        pytest.skip("disposable PostgreSQL unavailable; no SQLite substitute")
    value = local_engine(os.environ["V2_DATABASE_URL"])
    yield value
    value.dispose()


def release_for(campus, release_id="release-a", program="program-a"):
    data = canonical(synthetic_release())
    data.update(id=release_id, campus_id=campus)
    data["program"].update(id=program, campus_id=campus)
    for course in data["courses"]:
        course["identity"]["campus_id"] = campus
    data["categories"][0]["label"] = campus  # Unique shared definition per cohort.
    data["sources"][0]["conflicts_with"] = ["synthetic-peer"]
    peer = copy.deepcopy(data["sources"][0])
    peer.update(id="synthetic-peer", conflicts_with=["synthetic"])
    data["sources"].append(peer)
    return Release.model_validate(data)


def scope(release):
    return dict(
        campus_id=release.campus_id,
        program_id=release.program.id,
        release_id=release.id,
    )


def load(repo, release):
    return repo.load_release(release.campus_id, release.program.id, release.id)


@contextmanager
def corruption_transaction():
    """Owner-only fault injection, rolled back including trigger changes.

    Disable only our mutation triggers; real PostgreSQL FK/check constraints stay
    enabled. Reads use this same connection to observe uncommitted injected faults.
    No superuser, persisted corruption, or runtime permission relaxation.
    """
    owner = local_engine(os.environ["V2_MIGRATION_DATABASE_URL"], "v2_migrator")
    try:
        with owner.connect() as connection:
            transaction = connection.begin()
            try:
                for table in db.metadata.sorted_tables:
                    connection.execute(
                        sa.text(
                            f"ALTER TABLE cuny_advisor_v2.{table.name} DISABLE TRIGGER immutable_rows"
                        )
                    )
                yield connection
            finally:
                transaction.rollback()
    finally:
        owner.dispose()


SCOPED = [
    db.membership,
    db.release_category,
    db.source,
    db.conflict,
    db.rule,
    db.rule_source,
    db.requirement,
]


@pytest.mark.parametrize("table", SCOPED, ids=lambda table: table.name)
@pytest.mark.parametrize("fault", ["missing", "modified", "extra"])
def test_scoped_projection_integrity(engine, table, fault):
    repo = CatalogRepository(engine)
    release = release_for("integrity-" + uuid4().hex)
    peer = release.model_copy(update={"id": "release-b"})
    repo.save_release(release, revision_id="revision-a")
    repo.save_release(peer, revision_id="revision-b")
    values = next(
        value
        for candidate, value in rows_for(release, "revision-a")
        if candidate is table
    )
    with corruption_transaction() as connection:
        if fault == "missing":
            children = {
                db.source: [db.conflict, db.rule_source],
                db.rule: [db.requirement, db.rule_source],
                db.release_category: [db.requirement],
            }
            for child in children.get(table, []):
                connection.execute(child.delete().filter_by(**scope(release)))
            connection.execute(table.delete().where(key_filter(table, values)))
        else:
            changed = copy.deepcopy(values)
            if table in (db.source, db.rule, db.requirement):
                if fault == "extra":
                    name = {
                        db.source: "source_id",
                        db.rule: "rule_id",
                        db.requirement: "requirement_id",
                    }[table]
                    changed[name] = changed["payload"]["id"] = "extra-identity"
                else:
                    field = {
                        db.source: "note",
                        db.rule: "expression",
                        db.requirement: "label",
                    }[table]
                    changed["payload"][field] = (
                        {"op": "unknown", "reason": "injected fault"}
                        if table is db.rule
                        else "injected fault"
                    )
                changed["digest"] = digest(changed["payload"])
            elif table is db.membership:
                changed["position"] = 999
                if fault == "extra":
                    course = canonical(release.courses[0])
                    course["identity"]["id"] = changed["course_id"] = "extra-course"
                    course["version_id"] = changed["version_id"] = "extra-version"
                    connection.execute(
                        db.course.insert().values(
                            campus_id=release.campus_id, course_id="extra-course"
                        )
                    )
                    connection.execute(
                        db.version.insert().values(
                            campus_id=release.campus_id,
                            course_id="extra-course",
                            version_id="extra-version",
                            payload=course,
                            digest=digest(course),
                        )
                    )
            elif table is db.release_category:
                if fault == "extra":
                    changed["category_id"] = "extra-category"
                else:
                    category = {
                        "id": release.categories[0].id,
                        "label": release.campus_id + " different shared definition",
                    }
                    connection.execute(
                        db.category.insert().values(
                            payload=category, digest=digest(category)
                        )
                    )
                    changed["category_digest"] = digest(category)
            elif table is db.conflict:
                changed["other_source_id"] = changed[
                    "source_id"
                ]  # FK-valid extra/self edge.
            elif table is db.rule_source:
                changed["source_id"] = "synthetic-peer"
            if fault == "extra":
                connection.execute(table.insert().values(**changed))
            else:
                connection.execute(
                    table.update().where(key_filter(table, values)).values(**changed)
                )
        with pytest.raises(PersistenceConflict, match="projection"):
            repo._load(connection, release.campus_id, release.program.id, release.id)
        # Same IDs in another revision/release are not contaminated by scoped faults.
        assert canonical(
            repo._load(connection, peer.campus_id, peer.program.id, peer.id)
        ) == canonical(peer)
    assert canonical(load(repo, release)) == canonical(release)


@pytest.mark.parametrize(
    "table", [db.version, db.category], ids=lambda table: table.name
)
@pytest.mark.parametrize("fault", ["missing", "modified"])
def test_shared_projection_integrity_across_contexts(engine, table, fault):
    repo = CatalogRepository(engine)
    campus = "shared-" + uuid4().hex
    first = release_for(campus)
    second = first.model_copy(update={"id": "release-b"})
    third = Release.model_validate(
        {
            **canonical(first),
            "id": "release-c",
            "program": {"id": "program-b", "campus_id": campus},
        }
    )
    fourth = release_for(campus + "-other")
    # Category definitions are global exact-content vocabulary; course versions
    # are campus scoped. Deliberately share only the category across both campuses.
    fourth = fourth.model_copy(update={"categories": first.categories})
    releases = [first, second, third, fourth]
    for index, release in enumerate(releases):
        repo.save_release(release, revision_id=f"revision-{index}")
    values = next(
        value
        for candidate, value in rows_for(first, "revision-0")
        if candidate is table
    )
    with corruption_transaction() as connection:
        if fault == "missing":
            if table is db.version:
                connection.execute(
                    db.membership.delete().where(
                        db.membership.c.campus_id == campus,
                        db.membership.c.version_id == values["version_id"],
                    )
                )
            else:
                for release in releases:
                    connection.execute(
                        db.requirement.delete().filter_by(**scope(release))
                    )
                    connection.execute(
                        db.release_category.delete().filter_by(**scope(release))
                    )
            connection.execute(table.delete().where(key_filter(table, values)))
        else:
            changed = copy.deepcopy(values)
            changed["payload"][
                "title" if table is db.version else "label"
            ] = "corrupt shared content"
            if table is db.version:
                changed["digest"] = digest(changed["payload"])
            connection.execute(
                table.update().where(key_filter(table, values)).values(**changed)
            )
        for release in releases:
            if table is db.version and release is fourth:
                assert canonical(
                    repo._load(
                        connection, release.campus_id, release.program.id, release.id
                    )
                ) == canonical(release)
            else:
                with pytest.raises(PersistenceConflict, match="projection"):
                    repo._load(
                        connection, release.campus_id, release.program.id, release.id
                    )
    for release in releases:
        assert canonical(load(repo, release)) == canonical(release)


def test_unreferenced_shared_rows_and_wrong_sharing(engine):
    repo = CatalogRepository(engine)
    release = release_for("unreferenced-" + uuid4().hex)
    other = release.model_copy(update={"id": "other-release"})
    altered = canonical(other)
    altered["courses"][0]["version_id"] = "other-version"
    altered["courses"][0]["title"] = "Legitimate alternative historical version"
    other = Release.model_validate(altered)
    repo.save_release(release, revision_id="r1")
    repo.save_release(other, revision_id="r2")
    assert canonical(load(repo, release)) == canonical(
        release
    )  # Extra global versions are valid.
    with corruption_transaction() as connection:
        # Both FKs resolve in this campus, but this release never selected that version.
        connection.execute(
            db.membership.update()
            .filter_by(**scope(release), course_id=release.courses[0].identity.id)
            .values(version_id="other-version")
        )
        with pytest.raises(PersistenceConflict, match="projection"):
            repo._load(connection, release.campus_id, release.program.id, release.id)
        assert canonical(
            repo._load(connection, other.campus_id, other.program.id, other.id)
        ) == canonical(other)


def test_cross_context_edges_are_rejected_by_foreign_keys(engine):
    repo = CatalogRepository(engine)
    first = release_for("foreign-keys-" + uuid4().hex)
    second = Release.model_validate(
        {
            **canonical(first),
            "id": "other-release",
            "program": {"id": "other-program", "campus_id": first.campus_id},
        }
    )
    data = canonical(second)
    data["sources"].append(
        {**data["sources"][0], "id": "foreign-source", "conflicts_with": []}
    )
    data["constraints"].append(
        {
            "id": "foreign-rule",
            "expression": {"op": "unknown", "reason": "Synthetic foreign program rule"},
            "source_ids": ["foreign-source"],
        }
    )
    second = Release.model_validate(data)
    repo.save_release(first, revision_id="r1")
    repo.save_release(second, revision_id="r2")
    for table in SCOPED:
        values = next(
            value for candidate, value in rows_for(first, "r1") if candidate is table
        )
        # Both parents exist, but the crossed program/release combination does not.
        values = {**values, "program_id": second.program.id}
        with pytest.raises(IntegrityError), engine.begin() as connection:
            connection.execute(table.insert().values(**values))
    # The current binding itself is valid; only the referenced source/rule lives
    # exclusively in another release/program. Composite child FKs must reject it.
    for table, field, foreign_id in (
        (db.rule_source, "source_id", "foreign-source"),
        (db.conflict, "other_source_id", "foreign-source"),
        (db.requirement, "rule_id", "foreign-rule"),
    ):
        values = next(
            value for candidate, value in rows_for(first, "r1") if candidate is table
        )
        with pytest.raises(IntegrityError), engine.begin() as connection:
            connection.execute(
                table.insert().values(
                    **{
                        **values,
                        field: foreign_id,
                        **(
                            {"requirement_id": "foreign-reference"}
                            if table is db.requirement
                            else {}
                        ),
                    }
                )
            )


def contend(releases, revision_id, barrier_table):
    """Separate engines/backends, synchronized BEFORE the contested INSERT.

    PostgreSQL statement timeouts bound a broken test; barriers have timeouts too.
    Exceptions are returned for exact assertions, never retried or suppressed.
    """
    barrier = Barrier(2, timeout=8)
    inserted = Barrier(2, timeout=8)
    first_keys = [None, None]

    def worker(index, release):
        engine = local_engine(os.environ["V2_DATABASE_URL"])
        reached = False
        first_context = None
        backend_ids = []

        @sa.event.listens_for(engine, "begin")
        def timeout(connection):
            connection.exec_driver_sql("SET LOCAL statement_timeout = '10s'")
            assert (
                connection.scalar(sa.text("SHOW transaction_isolation"))
                == "read committed"
            )
            backend_ids.append(connection.scalar(sa.text("SELECT pg_backend_pid()")))

        @sa.event.listens_for(engine, "before_cursor_execute")
        def synchronize(
            connection, cursor, statement, parameters, context, executemany
        ):
            nonlocal reached, first_context
            if (
                not reached
                and context.compiled is not None
                and context.isinsert
                and context.compiled.statement.table is barrier_table
            ):
                reached = True
                first_context = context
                first_keys[index] = tuple(
                    context.compiled_parameters[0][column.name]
                    for column in barrier_table.primary_key
                )
                barrier.wait()

        @sa.event.listens_for(engine, "after_cursor_execute")
        def hold_opposite_first_keys(
            connection, cursor, statement, parameters, context, executemany
        ):
            # Old payload-order writes take different first keys. Force both to
            # hold those keys before continuing, exposing their cycle reliably.
            # Correct ordering takes the SAME first key: never wait after that
            # INSERT, since the other transaction must wait for its commit.
            if context is first_context and first_keys[0] != first_keys[1]:
                inserted.wait()

        try:
            CatalogRepository(engine).save_release(release, revision_id=revision_id)
            return release, None, backend_ids[0], reached
        except Exception as error:
            return release, error, backend_ids[0] if backend_ids else None, reached
        finally:
            engine.dispose()

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [
            executor.submit(worker, index, release)
            for index, release in enumerate(releases)
        ]
        results = [future.result(timeout=25) for future in futures]
    assert all(item[3] for item in results), results
    assert (
        len({item[2] for item in results}) == 2
    )  # Independent real PostgreSQL backends.
    return results


@pytest.mark.parametrize("conflicting", [False, True])
def test_concurrent_same_release_identity(engine, conflicting):
    repo = CatalogRepository(engine)
    release = release_for("same-identity-" + uuid4().hex)
    # Seed shared definitions too: only the new binding should contend here.
    repo.save_release(
        release.model_copy(update={"id": "parent-seed"}), revision_id="r1"
    )
    competitor = (
        release.model_copy(update={"issues": ("conflicting content",)})
        if conflicting
        else release
    )
    results = contend([release, competitor], "r1", db.binding)
    errors = [item[1] for item in results if item[1] is not None]
    assert len(errors) == int(conflicting), results
    assert all(isinstance(error, PersistenceConflict) for error in errors), results
    winner = next(item[0] for item in results if item[1] is None)
    assert canonical(load(repo, release)) == canonical(winner)
    with engine.connect() as connection:
        assert (
            connection.scalar(
                sa.select(sa.func.count())
                .select_from(db.binding)
                .where(db.binding.c.campus_id == release.campus_id)
            )
            == 2
        )


@pytest.mark.parametrize("conflicting", [False, True])
def test_concurrent_shared_identities_reversed_payload_order(engine, conflicting):
    repo = CatalogRepository(engine)
    first = release_for("opposite-order-" + uuid4().hex)
    empty = first.model_copy(
        update={
            "id": "parent-seed",
            "courses": (),
            "requirements": (),
            "constraints": (),
            "sources": (),
            "categories": first.categories,
        }
    )
    repo.save_release(empty, revision_id="r1")
    data = canonical(first)
    data["id"] = "competing-release"
    if conflicting:
        data["courses"][0]["title"] = "Conflicts on shared immutable version"
    data["courses"].reverse()
    second = Release.model_validate(data)
    results = contend([first, second], "r1", db.course)
    errors = [item[1] for item in results if item[1] is not None]
    assert len(errors) == int(conflicting), results
    assert all(isinstance(error, PersistenceConflict) for error in errors), results
    for release, error, _, _ in results:
        if error is None:
            assert canonical(load(repo, release)) == canonical(release)
        else:
            with pytest.raises(KeyError):
                load(repo, release)
            # Losing program binding and all of its scoped projections roll back.
            with engine.connect() as connection:
                for table in [db.binding, *SCOPED]:
                    assert not connection.scalar(
                        sa.select(sa.func.count())
                        .select_from(table)
                        .filter_by(**scope(release))
                    )
    with engine.connect() as connection:
        # No duplicate or partial shared course rows regardless of the winner.
        for table in (db.course, db.version):
            assert connection.scalar(
                sa.select(sa.func.count())
                .select_from(table)
                .where(table.c.campus_id == first.campus_id)
            ) == len(first.courses)


def test_ensure_does_not_swallow_secondary_unique_conflicts(engine):
    repo = CatalogRepository(engine)
    release = release_for("secondary-unique-" + uuid4().hex)
    repo.save_release(release, revision_id="r1")
    row = next(
        value for table, value in rows_for(release, "r1") if table is db.membership
    )
    with pytest.raises(IntegrityError), engine.begin() as connection:
        course = canonical(release.courses[0])
        course["identity"]["id"] = "rolled-back-course"
        course["version_id"] = "rolled-back-version"
        ensure(
            connection,
            db.course,
            dict(campus_id=release.campus_id, course_id="rolled-back-course"),
        )
        ensure(
            connection,
            db.version,
            dict(
                campus_id=release.campus_id,
                course_id="rolled-back-course",
                version_id="rolled-back-version",
                payload=course,
                digest=digest(course),
            ),
        )
        ensure(
            connection,
            db.membership,
            {
                **row,
                "course_id": "rolled-back-course",
                "version_id": "rolled-back-version",
            },
        )
    with engine.connect() as connection:
        assert not connection.scalar(
            sa.select(sa.func.count())
            .select_from(db.course)
            .filter_by(campus_id=release.campus_id, course_id="rolled-back-course")
        )
    assert canonical(load(repo, release)) == canonical(release)


@pytest.mark.parametrize("table", [db.source, db.version], ids=lambda table: table.name)
def test_json_type_corruption_not_hidden_by_python_equality(engine, table):
    repo = CatalogRepository(engine)
    release = release_for("json-types-" + uuid4().hex)
    repo.save_release(release, revision_id="r1")
    values = next(
        value
        for candidate, value in rows_for(release, "r1")
        if candidate is table
        and (table is db.source or value["payload"]["prerequisite"] is not None)
    )
    changed = copy.deepcopy(values)
    if table is db.source:
        assert changed["payload"]["year_confirmed"] is False
        changed["payload"]["year_confirmed"] = 0
    else:
        original = changed["payload"]["prerequisite"]["expression"][
            "minimum_grade_rank"
        ]
        changed["payload"]["prerequisite"]["expression"]["minimum_grade_rank"] = float(
            original
        )
    assert changed == values  # Python equality would silently accept this corruption.
    assert digest(changed["payload"]) != values["digest"]
    with corruption_transaction() as connection:
        connection.execute(
            table.update().where(key_filter(table, values)).values(**changed)
        )
        with pytest.raises(PersistenceConflict, match="projection"):
            repo._load(connection, release.campus_id, release.program.id, release.id)
