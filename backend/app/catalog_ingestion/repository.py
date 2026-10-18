"""Atomic, append-only reviewed imports. Read integrity includes every projection row."""

import sqlalchemy as sa
from app.institutions.repository import ensure
from app.persistence.repository import PersistenceConflict, canonical, digest, envelope
from app.persistence import schema as academic_db
from . import schema as db
from .contracts import Snapshot
from .pipeline import DATA, read, stage


def reviewed_snapshot():
    snapshot = Snapshot.model_validate_json(
        (DATA / "reviewed_snapshot.json").read_text()
    )
    rebuilt, report = stage(DATA / "source_extracts")
    review = read(DATA / "review.json")
    if (
        canonical(snapshot) != canonical(rebuilt)
        or digest(canonical(snapshot)) != review["snapshot_digest"]
        or report != read(DATA / "coverage.json")
    ):
        raise PersistenceConflict(
            "Staging/review artifact mismatch; explicit source review required"
        )
    return snapshot


def rows_for(value):
    rows = [
        (
            db.snapshot,
            dict(
                snapshot_id=value.id,
                campus_id=value.campus_id,
                catalog_year=value.catalog_year,
                **envelope(value)
            ),
        )
    ]
    for table, items in [
        (db.source, value.sources),
        (db.department, value.departments),
        (db.program, value.programs),
        (db.course, value.courses),
    ]:
        for item in sorted(items, key=lambda x: x.id):
            fields = dict(snapshot_id=value.id, entity_id=item.id, **envelope(item))
            if table is db.course:
                fields["code"] = item.code
            rows.append((table, fields))
    for table, items in [
        (db.course_department, value.courses),
        (db.program_department, value.programs),
    ]:
        rows.extend(
            (
                table,
                dict(snapshot_id=value.id, entity_id=item.id, department_id=department),
            )
            for item in sorted(items, key=lambda x: x.id)
            for department in sorted(item.department_ids)
        )
    return rows


class BrowseRepository:
    def __init__(self, engine):
        self.engine = engine

    def import_reviewed(self, value):
        value = Snapshot.model_validate_json(value.model_dump_json())
        with self.engine.begin() as c:
            ensure(c, academic_db.campus, dict(campus_id=value.campus_id))
            for table, fields in rows_for(value):
                ensure(c, table, fields)
            self.load(value.id, c)

    def snapshots(self):
        with self.engine.connect() as c:
            return [
                dict(r)
                for r in c.execute(
                    sa.select(
                        db.snapshot.c.snapshot_id,
                        db.snapshot.c.campus_id,
                        db.snapshot.c.catalog_year,
                    ).order_by(db.snapshot.c.snapshot_id)
                ).mappings()
            ]

    def load(self, id, connection=None):
        if connection is None:
            with self.engine.connect().execution_options(
                isolation_level="REPEATABLE READ"
            ) as c:
                return self.load(id, c)
        c = connection
        header = (
            c.execute(sa.select(db.snapshot).where(db.snapshot.c.snapshot_id == id))
            .mappings()
            .one_or_none()
        )
        if header is None:
            raise KeyError(id)
        value = Snapshot.model_validate(header["payload"])
        expected = rows_for(value)
        for table in db.TABLES:
            actual = [
                dict(r)
                for r in c.execute(
                    sa.select(table).where(table.c.snapshot_id == id)
                ).mappings()
            ]
            desired = [fields for t, fields in expected if t is table]

            def key(row):
                return tuple(row[k.name] for k in table.primary_key)

            if digest(sorted(actual, key=key)) != digest(sorted(desired, key=key)):
                raise PersistenceConflict("Browse projection integrity mismatch")
        return value
