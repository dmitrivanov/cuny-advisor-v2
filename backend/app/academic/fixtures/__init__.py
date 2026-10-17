"""Small manually curated draft; no importer and no runtime network access."""

from importlib.resources import files
import json

from ..contracts import Category, Release, Rule, Source, Unknown


def shared_pathways_categories() -> tuple[Category, ...]:
    return tuple(
        Category.model_validate(item)
        for item in json.loads(
            files(__package__)
            .joinpath("pathways_categories.json")
            .read_text(encoding="utf-8")
        )
    )


def policy_evidence() -> tuple[Source, ...]:
    return tuple(
        Source.model_validate(item)
        for item in json.loads(
            files(__package__)
            .joinpath("policy_evidence_2026_2027.json")
            .read_text(encoding="utf-8")
        )
    )


def bmcc_cs_reference() -> Release:
    """Retained Phase 02A draft; never enrich it in place."""
    return Release.model_validate_json(
        files(__package__)
        .joinpath("bmcc_cs_2026_2027.json")
        .read_text(encoding="utf-8")
    )


def bmcc_cs_evidence_reference() -> Release:
    """New evidence revision, preserving original values and unresolved policies."""
    base = bmcc_cs_reference()
    data = base.model_dump()
    data.update(
        id="bmcc-cs-as-2026-2027-draft-2", categories=shared_pathways_categories()
    )
    data["sources"] = [
        {
            **source.model_dump(),
            "publisher": "BMCC",
            "campus_id": base.campus_id,
            "program_id": base.program.id,
            "claim_scope": f"{base.program.id}: {source.section}. {source.note}",
        }
        for source in base.sources
    ] + list(policy_evidence())
    data["constraints"] = (
        *base.constraints,
        Rule(
            id="stem-allocation-review",
            expression=Unknown(reason="stem_general_elective_allocation_unresolved"),
            source_ids=("program-f7", "cuny-stem-glossary", "cuny-guidelines"),
        ),
        Rule(
            id="grade-repeat-review",
            expression=Unknown(reason="grade_repeat_applicability_unresolved"),
            source_ids=("bmcc-grades",),
        ),
        Rule(
            id="transfer-notation-review",
            expression=Unknown(reason="transfer_grade_notation_conflict"),
            source_ids=("bmcc-transfer-notation", "bmcc-registrar-notation"),
        ),
    )
    return Release.model_validate(data)


def bmcc_cis_reference() -> Release:
    """Partial second program assembled with shared category vocabulary."""
    data = json.loads(
        files(__package__)
        .joinpath("bmcc_cis_2026_2027.json")
        .read_text(encoding="utf-8")
    )
    data["categories"] = shared_pathways_categories()
    return Release.model_validate(data)
