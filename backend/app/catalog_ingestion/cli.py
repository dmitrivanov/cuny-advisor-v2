"""Explicit collection/staging/report/import; public sources only, no startup work."""

import argparse
import os
import time
from urllib.request import urlopen
from urllib.parse import urlparse
from app.persistence.config import local_engine
from .pipeline import DATA, read, write, stage, source_extract
from .repository import BrowseRepository, reviewed_snapshot


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["collect", "stage", "report", "import"])
    parser.add_argument("--directory", default=str(DATA / "source_extracts"))
    parser.add_argument("--output", default="../var/bmcc-staged-snapshot.json")
    args = parser.parse_args()
    if args.action == "collect":
        # Refresh public Bulletin extracts only; never overwrite reviewed committed data.
        from pathlib import Path

        directory = Path(args.directory)
        if directory.resolve() == (DATA / "source_extracts").resolve():
            parser.error("Collect into a separate staging directory")
        directory.mkdir(parents=True, exist_ok=True)
        if any(directory.iterdir()):
            parser.error("Collection requires a fresh empty staging directory")
        from datetime import date
        from urllib.robotparser import RobotFileParser

        robots = RobotFileParser("https://bmcc.catalog.cuny.edu/robots.txt")
        robots.read()
        captured = date.today().isoformat()
        capture = read(DATA / "source_extracts/capture.json")
        capture.update(
            retrieved_on=captured,
            snapshot_id="bmcc-bulletin-"
            + capture["catalog_year"]
            + "-"
            + captured.replace("-", "")
            + "-review-pending",
        )
        write(directory / "capture.json", capture)
        write(
            directory / "inventory.json", read(DATA / "source_extracts/inventory.json")
        )
        for unit in read(DATA / "source_extracts/inventory.json"):
            url = unit["url"]
            parsed = urlparse(url)
            if parsed.scheme != "https" or parsed.netloc != "bmcc.catalog.cuny.edu":
                raise ValueError("Official public Bulletin origin required")
            if not robots.can_fetch("CunyAdvisorV2SourceReview", url):
                raise ValueError("Source access policy disallows collection")
            with urlopen(url, timeout=30) as response:
                if urlparse(response.url).netloc != "bmcc.catalog.cuny.edu":
                    raise ValueError("Unexpected source redirect")
                html = response.read(8_000_001)
            if len(html) > 8_000_000:
                raise ValueError("Source too large")
            write(
                directory / (unit["id"] + ".json"),
                source_extract(html.decode(), unit["id"]),
            )
            time.sleep(0.5)
        print(
            "Bulletin extracts collected. Re-capture and review dated website indexes/support separately; see docs."
        )
    elif args.action in ("stage", "report"):
        value, report = stage(args.directory)
        if args.action == "stage":
            from pathlib import Path

            output = Path(args.output)
            output.parent.mkdir(parents=True, exist_ok=True)
            write(output, value.model_dump(mode="json"))
        print(__import__("json").dumps(report, indent=2))
    else:
        engine = None
        try:
            value = reviewed_snapshot()
            engine = local_engine(
                os.environ["V2_MIGRATION_DATABASE_URL"], "v2_migrator"
            )
            BrowseRepository(engine).import_reviewed(value)
            print(
                f"Imported reviewed browsing snapshot {value.id}: {len(value.courses)} credit courses"
            )
        except Exception:
            raise SystemExit(
                "Browse import failed; privately check review artifacts and disposable V2 migrations/configuration"
            ) from None
        finally:
            if engine is not None:
                engine.dispose()


if __name__ == "__main__":
    main()
