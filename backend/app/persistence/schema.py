"""Relational identity/membership plus immutable, validated contract payloads.

Core tables are deliberately private to the repository. No mapped domain models,
lazy loading, runtime DDL, or application startup database connection.
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from .config import SCHEMA

metadata = sa.MetaData(schema=SCHEMA)


def col(name, primary=False):
    return sa.Column(name, sa.Text, primary_key=primary, nullable=False)


def fk(local, remote, table):
    return sa.ForeignKeyConstraint(
        local, [f"{SCHEMA}.{table}.{name}" for name in remote]
    )


def payload():
    return [
        sa.Column("payload", JSONB, nullable=False),
        col("digest"),
        sa.CheckConstraint("length(digest) = 64"),
    ]


campus = sa.Table("campus", metadata, col("campus_id", True))
program = sa.Table(
    "program",
    metadata,
    col("campus_id", True),
    col("program_id", True),
    fk(["campus_id"], ["campus_id"], "campus"),
)
edition = sa.Table(
    "catalog_edition",
    metadata,
    col("campus_id", True),
    col("catalog_year", True),
    fk(["campus_id"], ["campus_id"], "campus"),
)
revision = sa.Table(
    "catalog_revision",
    metadata,
    col("campus_id", True),
    col("revision_id", True),
    col("catalog_year"),
    sa.UniqueConstraint("campus_id", "revision_id", "catalog_year"),
    fk(["campus_id", "catalog_year"], ["campus_id", "catalog_year"], "catalog_edition"),
)
binding = sa.Table(
    "program_release_binding",
    metadata,
    col("campus_id", True),
    col("release_id", True),
    col("program_id"),
    col("catalog_year"),
    col("revision_id"),
    col("credential"),
    *payload(),
    sa.CheckConstraint("credential IN ('AA', 'AS', 'AAS')"),
    sa.CheckConstraint("payload->>'state' = 'draft'"),
    sa.CheckConstraint("payload->>'id' = release_id"),
    sa.CheckConstraint("payload->>'campus_id' = campus_id"),
    sa.CheckConstraint("payload->'program'->>'id' = program_id"),
    sa.CheckConstraint("payload->'program'->>'campus_id' = campus_id"),
    sa.CheckConstraint("payload->>'catalog_year' = catalog_year"),
    sa.CheckConstraint("payload->>'credential' = credential"),
    sa.UniqueConstraint("campus_id", "program_id", "release_id", "digest"),
    sa.UniqueConstraint("campus_id", "program_id", "release_id"),
    fk(["campus_id", "program_id"], ["campus_id", "program_id"], "program"),
    fk(
        ["campus_id", "revision_id", "catalog_year"],
        ["campus_id", "revision_id", "catalog_year"],
        "catalog_revision",
    ),
)
course = sa.Table(
    "course_identity",
    metadata,
    col("campus_id", True),
    col("course_id", True),
    fk(["campus_id"], ["campus_id"], "campus"),
)
version = sa.Table(
    "course_version",
    metadata,
    col("campus_id", True),
    col("version_id", True),
    col("course_id"),
    *payload(),
    sa.UniqueConstraint("campus_id", "course_id", "version_id"),
    sa.CheckConstraint("payload->>'version_id' = version_id"),
    sa.CheckConstraint("payload->'identity'->>'id' = course_id"),
    sa.CheckConstraint("payload->'identity'->>'campus_id' = campus_id"),
    fk(["campus_id", "course_id"], ["campus_id", "course_id"], "course_identity"),
)


def scoped(name, *columns, key="item_id", constraints=()):
    return sa.Table(
        name,
        metadata,
        col("campus_id", True),
        col("program_id", True),
        col("release_id", True),
        col(key, True),
        *columns,
        fk(
            ["campus_id", "program_id", "release_id"],
            ["campus_id", "program_id", "release_id"],
            "program_release_binding",
        ),
        *constraints,
    )


membership = scoped(
    "release_course_version",
    col("version_id"),
    sa.Column("position", sa.Integer, nullable=False),
    key="course_id",
    constraints=(
        fk(
            ["campus_id", "course_id", "version_id"],
            ["campus_id", "course_id", "version_id"],
            "course_version",
        ),
        sa.UniqueConstraint("campus_id", "release_id", "position"),
    ),
)
category = sa.Table(
    "category_definition",
    metadata,
    col("digest", True),
    sa.Column("payload", JSONB, nullable=False),
)
release_category = scoped(
    "release_category",
    col("category_digest"),
    key="category_id",
    constraints=(fk(["category_digest"], ["digest"], "category_definition"),),
)
source = scoped(
    "source_evidence",
    *payload(),
    key="source_id",
    constraints=(
        sa.CheckConstraint("payload->>'id' = source_id"),
        sa.CheckConstraint(
            "payload->>'campus_id' IS NULL OR payload->>'campus_id' = campus_id"
        ),
        sa.CheckConstraint(
            "payload->>'program_id' IS NULL OR payload->>'program_id' = program_id"
        ),
    ),
)
conflict = scoped(
    "evidence_conflict",
    col("other_source_id", True),
    key="source_id",
    constraints=tuple(
        fk(
            ["campus_id", "program_id", "release_id", name],
            ["campus_id", "program_id", "release_id", "source_id"],
            "source_evidence",
        )
        for name in ("source_id", "other_source_id")
    ),
)
rule = scoped("rule_version", *payload(), key="rule_id")
rule_source = scoped(
    "rule_source",
    col("source_id", True),
    key="rule_id",
    constraints=(
        fk(
            ["campus_id", "program_id", "release_id", "rule_id"],
            ["campus_id", "program_id", "release_id", "rule_id"],
            "rule_version",
        ),
        fk(
            ["campus_id", "program_id", "release_id", "source_id"],
            ["campus_id", "program_id", "release_id", "source_id"],
            "source_evidence",
        ),
    ),
)
requirement = scoped(
    "program_requirement",
    col("rule_id"),
    sa.Column("category_id", sa.Text, nullable=True),
    *payload(),
    key="requirement_id",
    constraints=(
        fk(
            ["campus_id", "program_id", "release_id", "rule_id"],
            ["campus_id", "program_id", "release_id", "rule_id"],
            "rule_version",
        ),
    ),
)
snapshot = scoped(
    "synthetic_evaluation_snapshot",
    col("engine_version"),
    col("release_digest"),
    *payload(),
    key="snapshot_id",
    constraints=(
        fk(
            ["campus_id", "program_id", "release_id", "release_digest"],
            ["campus_id", "program_id", "release_id", "digest"],
            "program_release_binding",
        ),
        sa.CheckConstraint("payload->'release'->>'id' = release_id"),
        sa.CheckConstraint("payload->'release'->>'campus_id' = campus_id"),
        sa.CheckConstraint("payload->'release'->'program'->>'id' = program_id"),
        sa.CheckConstraint("engine_version IN ('02a.1', '02b.1')"),
        sa.CheckConstraint("payload->>'engine_version' = engine_version"),
    ),
)

requirement.append_constraint(
    fk(
        ["campus_id", "program_id", "release_id", "category_id"],
        ["campus_id", "program_id", "release_id", "category_id"],
        "release_category",
    )
)
