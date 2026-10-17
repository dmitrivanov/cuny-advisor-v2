"""ONE fresh disposable V2 DB only. Admin is used for role/schema bootstrap only.

Set V2_BOOTSTRAP_DATABASE_URL (postgres role), V2_MIGRATION_PASSWORD and
V2_RUNTIME_PASSWORD in your shell. No credentials are printed or written.
"""

import os

import psycopg
from psycopg import sql

from app.persistence.config import local_url

url = local_url(os.environ["V2_BOOTSTRAP_DATABASE_URL"], "postgres")
with psycopg.connect(
    host=url.host,
    port=url.port or 5432,
    dbname=url.database,
    user=url.username,
    password=url.password,
) as connection:
    if connection.execute(
        "SELECT 1 FROM pg_roles WHERE rolname IN ('v2_migrator', 'v2_runtime')"
    ).fetchone():
        raise RuntimeError("roles already exist: use a fresh disposable V2 instance")
    for role, variable in (
        ("v2_migrator", "V2_MIGRATION_PASSWORD"),
        ("v2_runtime", "V2_RUNTIME_PASSWORD"),
    ):
        password = os.environ[variable]
        if not password:
            raise ValueError("nonempty local passwords required")
        connection.execute(
            sql.SQL(
                "CREATE ROLE {} LOGIN PASSWORD {} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT"
            ).format(sql.Identifier(role), sql.Literal(password))
        )
    connection.execute(
        sql.SQL("REVOKE ALL ON DATABASE {} FROM PUBLIC").format(
            sql.Identifier(url.database)
        )
    )
    connection.execute(
        sql.SQL("GRANT CONNECT ON DATABASE {} TO v2_migrator, v2_runtime").format(
            sql.Identifier(url.database)
        )
    )
    connection.execute("REVOKE ALL ON SCHEMA public FROM PUBLIC")
    connection.execute("CREATE SCHEMA cuny_advisor_v2 AUTHORIZATION v2_migrator")
    for role in ("v2_migrator", "v2_runtime"):
        connection.execute(
            sql.SQL(
                "ALTER ROLE {} IN DATABASE {} SET search_path TO cuny_advisor_v2, pg_catalog"
            ).format(sql.Identifier(role), sql.Identifier(url.database))
        )
