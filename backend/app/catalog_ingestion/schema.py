"""Scoped browse projections; audit persistence remains unchanged."""

import sqlalchemy as sa
from app.persistence.schema import metadata, col, fk, payload

snapshot = sa.Table(
    "browse_catalog_snapshot",
    metadata,
    col("snapshot_id", True),
    col("campus_id"),
    col("catalog_year"),
    *payload(),
    fk(["campus_id"], ["campus_id"], "campus"),
    sa.UniqueConstraint("snapshot_id", "campus_id", "catalog_year"),
    sa.CheckConstraint("campus_id='bmcc'")
)


def entity(name, extra=()):
    return sa.Table(
        name,
        metadata,
        col("snapshot_id", True),
        col("entity_id", True),
        *extra,
        *payload(),
        fk(["snapshot_id"], ["snapshot_id"], "browse_catalog_snapshot")
    )


source = entity("browse_catalog_source")
department = entity("browse_catalog_department")
program = entity("browse_catalog_program")
course = entity(
    "browse_catalog_course", (col("code"), sa.UniqueConstraint("snapshot_id", "code"))
)


def relationship(name, parent):
    return sa.Table(
        name,
        metadata,
        col("snapshot_id", True),
        col("entity_id", True),
        col("department_id", True),
        fk(["snapshot_id", "entity_id"], ["snapshot_id", "entity_id"], parent.name),
        fk(
            ["snapshot_id", "department_id"],
            ["snapshot_id", "entity_id"],
            department.name,
        ),
    )


course_department = relationship("browse_course_department", course)
program_department = relationship("browse_program_department", program)
TABLES = (
    snapshot,
    source,
    department,
    program,
    course,
    course_department,
    program_department,
)
