"""Explicit manual import of reviewed local fixtures; no URLs, scraping or startup hook."""

import argparse
import os

from app.academic.fixtures import bmcc_cis_reference, bmcc_cs_evidence_reference
from .config import local_engine
from .repository import CatalogRepository


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--revision-id", required=True)
    args = parser.parse_args()
    engine = local_engine(os.environ["V2_DATABASE_URL"])
    try:
        repository = CatalogRepository(engine)
        # Each program import is its own atomic transaction, never publication.
        for release in (bmcc_cs_evidence_reference(), bmcc_cis_reference()):
            repository.save_release(release, revision_id=args.revision_id)
            print(f"Retained draft {release.id}")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
