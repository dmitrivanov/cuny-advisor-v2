"""Manual local migrations only; URL never stored in Alembic configuration."""

import os

from alembic import context
from sqlalchemy import text

from app.persistence.config import SCHEMA, local_engine
from app.persistence.schema import metadata
from app.catalog_ingestion import schema as browse_schema  # noqa: F401

if context.is_offline_mode():
    raise RuntimeError(
        "use the reviewed frozen migration SQL; offline connections disabled"
    )

engine = local_engine(os.environ["V2_MIGRATION_DATABASE_URL"], "v2_migrator")
with engine.connect() as connection:
    # The explicit bootstrap command creates this owned schema, before Alembic
    # creates its version table. No fallback or opportunistic schema repair.
    if (
        connection.scalar(
            text(
                "SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname = 'cuny_advisor_v2'"
            )
        )
        != "v2_migrator"
    ):
        raise RuntimeError("run disposable V2 bootstrap first; schema owner mismatch")
    connection.commit()
    context.configure(
        connection=connection,
        target_metadata=metadata,
        version_table_schema=SCHEMA,
        include_schemas=True,
        transactional_ddl=True,
    )
    with context.begin_transaction():
        context.run_migrations()
        connection.execute(
            text("GRANT SELECT ON cuny_advisor_v2.alembic_version TO v2_runtime")
        )
engine.dispose()
