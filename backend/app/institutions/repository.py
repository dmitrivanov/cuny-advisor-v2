"""Explicit immutable import and database-only reads of public institution facts."""

import json
from pathlib import Path
import sqlalchemy as sa
from app.persistence import schema as db
from app.persistence.repository import digest, PersistenceConflict
from sqlalchemy.dialects.postgresql import insert
from .contracts import Dataset, Institution, InstitutionView, RegistryView, Source

DATA = Path(__file__).parent / "data"
TABLES = (
    db.registry_snapshot,
    db.institution,
    db.registry_source,
    db.institution_revision,
    db.institution_source,
)


def ensure(connection, table, values):
    connection.execute(insert(table).values(**values).on_conflict_do_nothing())
    condition = sa.and_(
        *(column == values[column.name] for column in table.primary_key)
    )
    actual = (
        connection.execute(sa.select(table).where(condition)).mappings().one_or_none()
    )

    def normalize(value):
        return json.loads(json.dumps(value, default=str))

    if actual is None or digest(normalize(dict(actual))) != digest(normalize(values)):
        raise PersistenceConflict("Immutable institution identity conflict")


def reviewed_dataset():
    return Dataset.model_validate_json((DATA / "cuny_2026_10_17.json").read_text())


def reviewed_support(dataset):
    explicit = json.loads((DATA / "support.json").read_text())
    if set(explicit) - {i.id for i in dataset.institutions} or any(
        value != "pilot" or key != "bmcc" for key, value in explicit.items()
    ):
        raise ValueError("Unsupported operational campus")
    return {i.id: explicit.get(i.id, "planned") for i in dataset.institutions}


def fingerprint(dataset, support):
    value = dataset.model_dump(mode="json")
    value["sources"] = sorted(value["sources"], key=lambda s: s["id"])
    value["institutions"] = sorted(value["institutions"], key=lambda i: i["id"])
    for item in value["institutions"]:
        item["sources"] = sorted(item["sources"], key=lambda r: r["source_id"])
    return digest({"dataset": value, "support": support})


class InstitutionRepository:
    def __init__(self, engine):
        self.engine = engine

    def import_dataset(self, dataset: Dataset, support: dict[str, str]):
        dataset = Dataset.model_validate_json(dataset.model_dump_json())
        if set(support) != {i.id for i in dataset.institutions} or any(
            status not in ("planned", "pilot") or status == "pilot" and id != "bmcc"
            for id, status in support.items()
        ):
            raise ValueError("Registry capability mismatch")
        snapshot = dataset.snapshot_id
        with self.engine.begin() as connection:
            ensure(
                connection,
                db.registry_snapshot,
                {
                    "snapshot_id": snapshot,
                    "retrieved_on": dataset.retrieved_on,
                    "scope_source": dataset.scope_source,
                    "digest": fingerprint(dataset, support),
                    "institution_count": len(dataset.institutions),
                },
            )
            for source in sorted(dataset.sources, key=lambda s: s.id):
                ensure(
                    connection,
                    db.registry_source,
                    {
                        "snapshot_id": snapshot,
                        "source_id": source.id,
                        "url": str(source.url),
                        "title": source.title,
                        "retrieved_on": source.retrieved_on,
                    },
                )
            for item in sorted(dataset.institutions, key=lambda i: i.id):
                ensure(connection, db.campus, {"campus_id": item.id})
                ensure(
                    connection,
                    db.institution,
                    {
                        "institution_id": item.id,
                        "slug": item.slug,
                        "support_status": support[item.id],
                    },
                )
                row = item.model_dump(exclude={"id", "slug", "sources"}, mode="python")
                row["website"] = str(item.website)
                ensure(
                    connection,
                    db.institution_revision,
                    {"snapshot_id": snapshot, "institution_id": item.id, **row},
                )
                for reference in item.sources:
                    ensure(
                        connection,
                        db.institution_source,
                        {
                            "snapshot_id": snapshot,
                            "institution_id": item.id,
                            "source_id": reference.source_id,
                            "locator": reference.locator,
                        },
                    )
            # Verify complete relational projection before committing, including repeat imports.
            self._load(connection, snapshot)

    def list(self):
        with self.engine.connect().execution_options(
            isolation_level="REPEATABLE READ"
        ) as connection:
            snapshot = connection.scalar(
                sa.select(db.registry_snapshot.c.snapshot_id)
                .order_by(
                    db.registry_snapshot.c.retrieved_on.desc(),
                    db.registry_snapshot.c.snapshot_id.desc(),
                )
                .limit(1)
            )
            if snapshot is None:
                return None
            return self._load(connection, snapshot)

    def _load(self, connection, snapshot):
        header = (
            connection.execute(
                sa.select(db.registry_snapshot).where(
                    db.registry_snapshot.c.snapshot_id == snapshot
                )
            )
            .mappings()
            .one()
        )

        def rows(table):
            return list(
                connection.execute(
                    sa.select(table).where(table.c.snapshot_id == snapshot)
                ).mappings()
            )

        sources = [
            Source(
                id=row["source_id"],
                url=row["url"],
                title=row["title"],
                retrieved_on=row["retrieved_on"],
            )
            for row in rows(db.registry_source)
        ]
        refs = rows(db.institution_source)
        details = rows(db.institution_revision)
        identities = {
            row["institution_id"]: row
            for row in connection.execute(
                sa.select(db.institution).where(
                    db.institution.c.institution_id.in_(
                        [r["institution_id"] for r in details]
                    )
                )
            ).mappings()
        }
        items = []
        for row in details:
            identity = identities[row["institution_id"]]
            values = {
                key: value
                for key, value in row.items()
                if key not in ("snapshot_id", "institution_id")
            }
            items.append(
                Institution(
                    id=identity["institution_id"],
                    slug=identity["slug"],
                    sources=tuple(
                        {"source_id": r["source_id"], "locator": r["locator"]}
                        for r in sorted(refs, key=lambda ref: ref["source_id"])
                        if r["institution_id"] == identity["institution_id"]
                    ),
                    **values
                )
            )
        dataset = Dataset(
            snapshot_id=snapshot,
            retrieved_on=header["retrieved_on"],
            scope_source=header["scope_source"],
            sources=tuple(sources),
            institutions=tuple(items),
        )
        support = {id: row["support_status"] for id, row in identities.items()}
        if (
            len(items) != header["institution_count"]
            or fingerprint(dataset, support) != header["digest"]
        ):
            raise PersistenceConflict("Institution registry integrity mismatch")
        return RegistryView(
            snapshot_id=snapshot,
            retrieved_on=dataset.retrieved_on,
            scope_source=dataset.scope_source,
            sources=tuple(sorted(sources, key=lambda s: s.id)),
            institutions=tuple(
                InstitutionView(**item.model_dump(), support_status=support[item.id])
                for item in sorted(items, key=lambda i: (i.display_name.lower(), i.id))
            ),
        )
