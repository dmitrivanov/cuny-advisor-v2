"""Explicit local dotenv loader. Never discovers or prints configuration."""

import argparse
import os
from pathlib import Path
import shlex

ALLOWED = {"GEMINI_API_KEY", "GEMINI_MODEL", "GEMINI_ENABLED"}


def load_local(path: Path):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, sep, value = line.partition("=")
        if not sep or key.strip() not in ALLOWED:
            raise ValueError("Local AI configuration contains an unsupported entry")
        parsed = shlex.split(value, comments=True)
        if len(parsed) > 1:
            raise ValueError("Local AI configuration must use a quoted single value")
        os.environ.setdefault(key.strip(), parsed[0] if parsed else "")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file", type=Path, default=Path(".env.local"))
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    try:
        load_local(args.env_file)
    except Exception:
        raise SystemExit(
            "Could not load local AI configuration; check syntax without sharing secrets."
        ) from None
    os.environ["V2_LOCAL_CONVERSATION"] = "1"
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=args.port,
        log_level="warning",
        access_log=False,
    )


if __name__ == "__main__":
    main()
