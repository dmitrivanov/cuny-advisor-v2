"""Phase 02B: all histories and approval scenarios here are fictional."""

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from academic_factory import synthetic_release
from test_academic import allocate, history, result
from app.academic.contracts import (
    EvaluationInput,
    NonCreditEvidence,
    Outcome,
    Release,
    Snapshot,
    Source,
)
from app.academic.evaluation import eligibility, evaluate
from app.academic.evidence import source_problem
from app.academic.fixtures import (
    bmcc_cis_reference,
    bmcc_cs_reference,
    bmcc_cs_evidence_reference,
    policy_evidence,
    shared_pathways_categories,
)
from app.academic.projections import selector_columns


@pytest.mark.parametrize("kind", ["placement", "exemption", "waiver"])
def test_non_credit_evidence_does_not_award_credit_or_waive_a_prerequisite(kind):
    release = synthetic_release()
    evidence = NonCreditEvidence(
        id="fictional-claim",
        course_id="m301",
        kind=kind,
        requirement_id="math",
        note="Unapplied fictional claim",
    )
    inputs = EvaluationInput(
        campus_id=release.campus_id,
        release_id=release.id,
        record_revision="fictional",
        non_credit_evidence=(evidence,),
    )
    snapshot = evaluate(release, inputs)
    assert snapshot.earned_credits == snapshot.allocated_credits == 0
    assert result(snapshot, "math").status == Outcome.UNRESOLVED
    progression = eligibility(release, inputs, "m302")
    assert progression.status == Outcome.UNRESOLVED
    assert progression.reason == "non_credit_evidence_requires_academic_review"
    assert snapshot.degree_status == "unresolved"
    with pytest.raises(ValidationError):
        NonCreditEvidence(**{**evidence.model_dump(), "credits": "4"})


def test_non_credit_claim_cannot_be_used_as_an_allocation():
    release = synthetic_release()
    data = history(release).model_dump()
    data.update(
        non_credit_evidence=[
            dict(id="claim", course_id="m301", kind="placement", note="fictional")
        ],
        allocations=[dict(requirement_id="math", completion_id="claim", credits="3")],
    )
    snapshot = evaluate(release, EvaluationInput.model_validate(data))
    assert "unknown_allocation_reference" in snapshot.issues
    assert snapshot.allocated_credits == 0


@pytest.mark.parametrize(
    "field,value", [("course_id", "missing"), ("requirement_id", "missing")]
)
def test_non_credit_reference_validation(field, value):
    release = synthetic_release()
    evidence = dict(id="claim", course_id="m301", kind="exemption", note="fictional")
    evidence[field] = value
    inputs = EvaluationInput(
        **{**history(release).model_dump(), "non_credit_evidence": [evidence]}
    )
    assert "invalid_non_credit_reference" in evaluate(release, inputs).issues


@pytest.mark.parametrize(
    "field,value",
    [
        ("campus_id", "another-campus"),
        ("program_id", "another-program"),
        ("catalog_year", "2025-2026"),
    ],
)
def test_source_scope_cannot_cross_catalog_context(field, value):
    data = bmcc_cis_reference().model_dump()
    data["sources"][0][field] = value
    with pytest.raises(ValidationError):
        Release.model_validate(data)


def test_explicit_conflicting_official_evidence_remains_unresolved():
    release = bmcc_cs_evidence_reference()
    problem = source_problem(("bmcc-transfer-notation",), release)
    assert problem.status == Outcome.UNRESOLVED
    assert set(problem.source_ids) == {
        "bmcc-transfer-notation",
        "bmcc-registrar-notation",
    }
    # Even changing a label to verified cannot dismiss a linked unresolved conflict.
    data = release.model_dump()
    data["sources"] = [
        (
            {**s.model_dump(), "state": "source_verified", "year_confirmed": True}
            if s.id == "bmcc-transfer-notation"
            else s
        )
        for s in release.sources
    ]
    still_conflicting = Release.model_validate(data)
    assert (
        source_problem(("bmcc-transfer-notation",), still_conflicting).status
        == Outcome.UNRESOLVED
    )


def test_missing_source_and_unresolved_locator_never_assume_a_pass():
    release = synthetic_release()
    assert source_problem(("missing",), release).reason == "missing_source:missing"
    source = Source(
        id="missing-policy",
        retrieved_on="2026-10-16",
        catalog_year=release.catalog_year,
        section="Not located",
        state="unresolved",
        note="Fictional missing-evidence scenario",
    )
    data = release.model_dump()
    data["sources"] = [source]
    data["courses"] = [
        {**c.model_dump(), "source_ids": [source.id], "prerequisite": None}
        for c in release.courses
    ]
    data["requirements"] = [
        {**r.model_dump(), "rule": {**r.rule.model_dump(), "source_ids": [source.id]}}
        for r in release.requirements
    ]
    data["constraints"] = []
    release = Release.model_validate(data)
    inputs = history(release, "m301", allocations=(allocate("math", "m301", "3"),))
    assert result(evaluate(release, inputs), "math").status == Outcome.UNRESOLVED


def test_source_dates_do_not_establish_catalog_applicability_or_approval():
    release = bmcc_cs_evidence_reference()
    dated = next(s for s in policy_evidence() if s.id == "cuny-guidelines")
    assert str(dated.revised_on) == "2018-03-15"
    assert not dated.year_confirmed
    assert source_problem((dated.id,), release).status == Outcome.UNRESOLVED
    assert all(s.academic_review == "required" for s in release.sources)
    with pytest.raises(ValidationError):
        Source(**{**dated.model_dump(), "academic_review": "approved"})
    with pytest.raises(ValidationError):
        Source(**{**dated.model_dump(), "published_on": "2027-01-01"})


def test_second_program_uses_shared_categories_but_distinct_math_and_pools():
    cs, cis = bmcc_cs_evidence_reference(), bmcc_cis_reference()
    assert cs.categories == cis.categories == shared_pathways_categories()
    assert cs.program.id != cis.program.id and cs.credential != cis.credential
    math = next(r for r in cis.requirements if r.id == "cis-math")
    assert {c.course_id for c in math.rule.expression.children} == {
        "bmcc-course-mat-157",
        "bmcc-course-mat-206",
        "bmcc-course-mat-301",
    }
    inputs = history(
        cis,
        "bmcc-course-mat-157",
        allocations=(allocate("cis-math", "bmcc-course-mat-157", "4"),),
    )
    assert result(evaluate(cis, inputs), "cis-math").status == Outcome.MET
    assert evaluate(cs, inputs).degree_status == "unresolved"
    assert "catalog_context_mismatch" in evaluate(cs, inputs).issues
    assert [c.title.value for c in selector_columns(cis)] == [
        "Required Common Core",
        "Flexible Core",
        "Major Requirements",
        "Major Electives",
    ]
    cs_pool = next(
        r for r in cs.requirements if r.id == "major-electives"
    ).rule.expression.eligible
    cis_pool = next(
        r for r in cis.requirements if r.id == "cis-program-electives"
    ).rule.expression.eligible
    assert "bmcc-course-cis-345" in cs_pool and "bmcc-course-cis-345" not in cis_pool
    assert "bmcc-course-cis-459" in cis_pool and "bmcc-course-cis-459" not in cs_pool


def test_cis_missing_elective_credit_and_scientific_interpretation_stay_unresolved():
    release = bmcc_cis_reference()
    inputs = history(
        release,
        "bmcc-course-gis-101",
        "bmcc-course-gis-201",
        allocations=(
            allocate("cis-program-electives", "bmcc-course-gis-101", "3"),
            allocate("cis-program-electives", "bmcc-course-gis-201", "3"),
        ),
    )
    assert (
        result(evaluate(release, inputs), "cis-program-electives").status
        == Outcome.UNRESOLVED
    )
    scientific = history(
        release,
        "bmcc-course-csc-101",
        "bmcc-course-csc-111",
        allocations=(
            allocate("cis-scientific", "bmcc-course-csc-101", "3"),
            allocate("cis-scientific", "bmcc-course-csc-111", "4"),
        ),
    )
    assert (
        result(evaluate(release, scientific), "cis-scientific").status
        == Outcome.UNRESOLVED
    )


def test_cs_stem_overlap_is_not_enabled_by_framework_evidence():
    release = bmcc_cs_evidence_reference()
    inputs = history(
        release,
        "bmcc-course-mat-301",
        allocations=(
            allocate("math", "bmcc-course-mat-301", "3"),
            allocate("general-elective", "bmcc-course-mat-301", "1"),
        ),
    )
    snapshot = evaluate(release, inputs)
    assert "overlap_policy_not_implemented" in snapshot.issues
    assert snapshot.earned_credits == 4 and snapshot.allocated_credits == 0
    assert snapshot.degree_status == "unresolved"


def test_missing_grade_and_prerequisite_stay_unresolved_with_evidence_changes():
    release = synthetic_release()
    assert (
        eligibility(release, history(release, "m301", grade=None), "m302").status
        == Outcome.UNRESOLVED
    )
    assert (
        eligibility(release, history(release), "m206").reason
        == "missing_condition_definition"
    )
    assert evaluate(release, history(release, "m301", "m301")).earned_credits == 0


def test_phase02a_snapshot_is_retained_and_recomputation_has_new_engine_version():
    payload = (
        Path(__file__)
        .with_name("fixtures")
        .joinpath("phase02a_snapshot.json")
        .read_text()
    )
    historical = Snapshot.model_validate_json(payload)
    before = historical.model_dump_json()
    assert historical.engine_version == "02a.1"
    assert historical.release.catalog_year == "2025-2026"  # fictional historical year
    recomputed = evaluate(historical.release, historical.inputs)
    assert recomputed.engine_version == "02b.1"
    assert recomputed.results == historical.results
    assert recomputed.earned_credits == historical.earned_credits
    assert historical.model_dump_json() == before
    assert json.loads(payload)["engine_version"] == "02a.1"


@pytest.mark.parametrize(
    "loader", [bmcc_cs_reference, bmcc_cs_evidence_reference, bmcc_cis_reference]
)
def test_all_catalog_contracts_round_trip_without_live_resources(loader):
    release = loader()
    assert Release.model_validate_json(release.model_dump_json()) == release
    snapshot = evaluate(release, history(release))
    assert Snapshot.model_validate_json(snapshot.model_dump_json()) == snapshot


def test_dangling_conflicts_and_unscoped_program_sources_are_rejected():
    data = bmcc_cis_reference().model_dump()
    data["sources"][0]["conflicts_with"] = ["missing-source"]
    with pytest.raises(ValidationError):
        Release.model_validate(data)
    with pytest.raises(ValidationError):
        Source(**{**data["sources"][0], "campus_id": None})


def test_one_sided_conflict_link_cannot_leave_other_source_verified():
    release = bmcc_cs_evidence_reference()
    data = release.model_dump()
    data["sources"] = [
        (
            {
                **s.model_dump(),
                "state": "source_verified",
                "year_confirmed": True,
                "conflicts_with": [],
            }
            if s.id == "bmcc-transfer-notation"
            else s
        )
        for s in release.sources
    ]
    release = Release.model_validate(data)
    assert (
        source_problem(("bmcc-transfer-notation",), release).status
        == Outcome.UNRESOLVED
    )
