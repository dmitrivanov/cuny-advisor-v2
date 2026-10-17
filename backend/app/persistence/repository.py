"""Atomic append-only adapters. Callers supply explicit campus/program/release IDs."""

import hashlib
import json

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert

from app.academic.contracts import EvaluationInput, Release, Snapshot
from app.academic.evaluation import evaluate

from . import schema as db


class PersistenceConflict(ValueError):
    """An immutable identity already has different content, or storage drifted."""


def canonical(model):
    """Contract v1 JSON: Decimal strings, ISO dates, ordered arrays, sorted keys."""
    return json.loads(model.model_dump_json())


def json_content(payload):
    """Preserve JSON types: Python dict equality conflates false/0 and 3/3.0."""
    return json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )


def digest(payload):
    return hashlib.sha256(json_content(payload).encode("utf-8")).hexdigest()


def envelope(model):
    value = canonical(model)
    return {"payload": value, "digest": digest(value)}


def rows_for(release, revision_id):
    """One deterministic relational projection; verified again on every load."""
    campus = release.campus_id
    scope = dict(campus_id=campus, program_id=release.program.id, release_id=release.id)
    rows = [
        (db.campus, dict(campus_id=campus)),
        (db.program, dict(campus_id=campus, program_id=release.program.id)),
        (db.edition, dict(campus_id=campus, catalog_year=release.catalog_year)),
        (
            db.revision,
            dict(
                campus_id=campus,
                catalog_year=release.catalog_year,
                revision_id=revision_id,
            ),
        ),
        (
            db.binding,
            dict(
                **scope,
                catalog_year=release.catalog_year,
                revision_id=revision_id,
                credential=release.credential,
                **envelope(release),
            ),
        ),
    ]
    for position, course in enumerate(release.courses):
        rows.extend(
            [
                (db.course, dict(campus_id=campus, course_id=course.identity.id)),
                (
                    db.version,
                    dict(
                        campus_id=campus,
                        course_id=course.identity.id,
                        version_id=course.version_id,
                        **envelope(course),
                    ),
                ),
                (
                    db.membership,
                    dict(
                        **scope,
                        course_id=course.identity.id,
                        version_id=course.version_id,
                        position=position,
                    ),
                ),
            ]
        )
    for category in release.categories:
        value = canonical(category)
        rows.extend(
            [
                (db.category, dict(digest=digest(value), payload=value)),
                (
                    db.release_category,
                    dict(
                        **scope, category_id=category.id, category_digest=digest(value)
                    ),
                ),
            ]
        )
    for source in release.sources:
        rows.append((db.source, dict(**scope, source_id=source.id, **envelope(source))))
    for source in release.sources:
        for other in source.conflicts_with:
            rows.append(
                (db.conflict, dict(**scope, source_id=source.id, other_source_id=other))
            )
    rules = [*release.constraints, *(item.rule for item in release.requirements)]
    for course in release.courses:
        rules.extend(item for item in (course.prerequisite, course.corequisite) if item)
    for rule in rules:
        rows.append((db.rule, dict(**scope, rule_id=rule.id, **envelope(rule))))
        # Repeated source references retain ordering in JSON, not duplicate edges.
        for source_id in dict.fromkeys(rule.source_ids):
            rows.append(
                (db.rule_source, dict(**scope, rule_id=rule.id, source_id=source_id))
            )
    for requirement in release.requirements:
        rows.append(
            (
                db.requirement,
                dict(
                    **scope,
                    requirement_id=requirement.id,
                    rule_id=requirement.rule.id,
                    category_id=requirement.category_id,
                    **envelope(requirement),
                ),
            )
        )
    return rows


def key_filter(table, values):
    return sa.and_(*(column == values[column.name] for column in table.primary_key))


def ensure(connection, table, values):
    # Cover all unique indexes: a PK-only arbiter can still race against another
    # unique index on the same row. DO NOTHING is not proof of idempotency: only
    # an exact primary-key/content read below can establish that. A secondary-key
    # collision with no matching PK is an explicit conflict, not a missing-row error.
    connection.execute(insert(table).values(**values).on_conflict_do_nothing())
    actual = (
        connection.execute(sa.select(table).where(key_filter(table, values)))
        .mappings()
        .one_or_none()
    )
    if actual is None or json_content(dict(actual)) != json_content(values):
        raise PersistenceConflict(f"immutable {table.name} identity conflict")


class CatalogRepository:
    def __init__(self, engine):
        self.engine = engine

    def save_release(self, release: Release, *, revision_id: str):
        # Revalidate even an unsafe model_construct/model_copy supplied by a caller.
        release = Release.model_validate_json(release.model_dump_json())
        if release.state != "draft":
            raise ValueError(
                "only immutable drafts are authorized; publication is deferred"
            )
        if not revision_id or len(revision_id) > 160:
            raise ValueError("explicit catalog revision identity required")
        # Shared rows must be encountered in the same order by every importer,
        # even when payload arrays differ. Preserve their original order in JSON
        # and membership.position, not in database lock acquisition order.
        table_order = {
            table: index for index, table in enumerate(db.metadata.sorted_tables)
        }
        rows = sorted(
            rows_for(release, revision_id),
            key=lambda item: (
                table_order[item[0]],
                tuple(item[1][column.name] for column in item[0].primary_key),
            ),
        )
        with self.engine.begin() as connection:
            for table, values in rows:
                ensure(connection, table, values)

    def _load(self, connection, campus_id, program_id, release_id):
        scope = dict(campus_id=campus_id, program_id=program_id, release_id=release_id)
        row = (
            connection.execute(sa.select(db.binding).filter_by(**scope))
            .mappings()
            .one_or_none()
        )
        if row is None:
            raise KeyError("release not found in requested campus/program context")
        if digest(row["payload"]) != row["digest"]:
            raise PersistenceConflict("release integrity hash mismatch")
        release = Release.model_validate(row["payload"])
        if (release.campus_id, release.program.id, release.id) != (
            campus_id,
            program_id,
            release_id,
        ):
            raise PersistenceConflict("release payload context mismatch")
        expected = rows_for(release, row["revision_id"])
        # Fetch each relation once, rather than lazily loading individual AST nodes.
        grouped = {}
        for table, values in expected:
            grouped.setdefault(table, []).append(values)
        scoped_tables = (
            db.membership,
            db.release_category,
            db.source,
            db.conflict,
            db.rule,
            db.rule_source,
            db.requirement,
        )
        for table in (
            *grouped,
            *(item for item in scoped_tables if item not in grouped),
        ):
            wanted = grouped.get(table, [])
            query = sa.select(table)
            if table in scoped_tables:
                query = query.filter_by(**scope)
            else:
                query = query.where(
                    sa.or_(*(key_filter(table, values) for values in wanted))
                )
            actual = [dict(item) for item in connection.execute(query).mappings()]

            def key(values):
                return tuple(values[column.name] for column in table.primary_key)

            if {key(item): json_content(item) for item in actual} != {
                key(item): json_content(item) for item in wanted
            }:
                raise PersistenceConflict(f"{table.name} projection integrity mismatch")
        return release

    def load_release(self, campus_id: str, program_id: str, release_id: str) -> Release:
        with self.engine.connect() as connection:
            return self._load(connection, campus_id, program_id, release_id)

    def evaluate(
        self, campus_id: str, program_id: str, inputs: EvaluationInput
    ) -> Snapshot:
        # Fully materialized Pydantic model; connection closed before evaluation.
        release = self.load_release(campus_id, program_id, inputs.release_id)
        return evaluate(release, inputs)

    def save_synthetic_snapshot(
        self, snapshot_id: str, snapshot: Snapshot, *, synthetic: bool
    ):
        if synthetic is not True:
            raise ValueError("only explicitly synthetic snapshots are authorized")
        if not snapshot_id or len(snapshot_id) > 160:
            raise ValueError("snapshot identity required")
        snapshot = Snapshot.model_validate_json(snapshot.model_dump_json())
        release = snapshot.release
        if (
            snapshot.inputs.release_id != release.id
            or snapshot.inputs.campus_id != release.campus_id
        ):
            raise ValueError("snapshot input/release context mismatch")
        with self.engine.begin() as connection:
            retained = self._load(
                connection, release.campus_id, release.program.id, release.id
            )
            if canonical(retained) != canonical(release):
                raise PersistenceConflict(
                    "snapshot release differs from persisted release"
                )
            ensure(
                connection,
                db.snapshot,
                dict(
                    campus_id=release.campus_id,
                    program_id=release.program.id,
                    release_id=release.id,
                    snapshot_id=snapshot_id,
                    engine_version=snapshot.engine_version,
                    release_digest=digest(canonical(release)),
                    **envelope(snapshot),
                ),
            )

    def load_synthetic_snapshot(
        self, campus_id, program_id, release_id, snapshot_id
    ) -> Snapshot:
        with self.engine.connect() as connection:
            row = (
                connection.execute(
                    sa.select(db.snapshot).filter_by(
                        campus_id=campus_id,
                        program_id=program_id,
                        release_id=release_id,
                        snapshot_id=snapshot_id,
                    )
                )
                .mappings()
                .one_or_none()
            )
            if row is None:
                raise KeyError("synthetic snapshot not found in requested context")
            if digest(row["payload"]) != row["digest"]:
                raise PersistenceConflict("snapshot integrity hash mismatch")
            result = Snapshot.model_validate(row["payload"])
            release = self._load(connection, campus_id, program_id, release_id)
            if (
                canonical(result.release) != canonical(release)
                or row["release_digest"] != digest(canonical(release))
                or result.engine_version != row["engine_version"]
                or result.inputs.campus_id != campus_id
                or result.inputs.release_id != release_id
            ):
                raise PersistenceConflict("snapshot context mismatch")
            return result
