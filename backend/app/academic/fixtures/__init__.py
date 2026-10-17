"""Small manually curated draft; no importer and no runtime network access."""

from importlib.resources import files

from ..contracts import Release


def bmcc_cs_reference() -> Release:
    return Release.model_validate_json(
        files(__package__)
        .joinpath("bmcc_cs_2026_2027.json")
        .read_text(encoding="utf-8")
    )
