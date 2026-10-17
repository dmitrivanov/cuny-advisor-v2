"""Fail closed before creating a connection to disposable V2 resources."""

from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url

SCHEMA = "cuny_advisor_v2"


def local_url(value: str, role: str) -> URL:
    url = make_url(value)
    if (
        url.drivername != "postgresql+psycopg"
        or url.host not in {"127.0.0.1", "localhost", "::1"}
        or url.database not in {"cuny_advisor_v2_dev", "cuny_advisor_v2_test"}
        or url.username != role
        or url.query
    ):
        raise ValueError("requires a loopback disposable V2 URL and expected role")
    return url


def local_engine(value: str, role: str = "v2_runtime"):
    return create_engine(
        local_url(value, role),
        connect_args={
            "options": "-csearch_path=cuny_advisor_v2,pg_catalog",
            "connect_timeout": 5,
        },
        hide_parameters=True,
    )
