"""Explicit migration-role import. Never contacts websites, AI or startup hooks."""

import os
from app.persistence.config import local_engine
from .repository import InstitutionRepository, reviewed_dataset, reviewed_support


def main():
    engine = None
    try:
        dataset = reviewed_dataset()
        engine = local_engine(os.environ["V2_MIGRATION_DATABASE_URL"], "v2_migrator")
        InstitutionRepository(engine).import_dataset(dataset, reviewed_support(dataset))
        print(
            f"Imported {len(dataset.institutions)} institutions: {dataset.snapshot_id}"
        )
    except Exception:
        raise SystemExit(
            "Institution import failed; verify disposable V2 configuration and migrations privately."
        ) from None
    finally:
        if engine is not None:
            engine.dispose()


if __name__ == "__main__":
    main()
