from decimal import Decimal

import pytest
from pydantic import ValidationError

from academic_factory import rule, synthetic_release
from app.academic.contracts import (
    Allocation,
    AllOf,
    AnyOf,
    Column,
    Completed,
    Completion,
    EvaluationInput,
    Outcome,
    Release,
    Requirement,
    Unknown,
)
from app.academic.evaluation import eligibility, evaluate
from app.academic.fixtures import bmcc_cs_reference
from app.academic.projections import condition_projection, selector_columns


def history(release, *ids, grade=3, allocations=(), verified=True, status="passed"):
    versions = {c.identity.id: c for c in release.courses}
    return EvaluationInput(
        campus_id=release.campus_id,
        release_id=release.id,
        record_revision="synthetic-record-1",
        allocations=allocations,
        completions=tuple(
            Completion(
                id="attempt-" + id,
                course_id=id,
                credits=versions[id].credits or Decimal("3"),
                verified=verified,
                status=status,
                grade_rank=grade,
            )
            for id in ids
        ),
    )


def allocate(requirement, course, credits):
    return Allocation(
        requirement_id=requirement, completion_id="attempt-" + course, credits=credits
    )


def result(snapshot, id):
    return next(r.result for r in snapshot.results if r.requirement_id == id)


def test_mat206_degree_math_does_not_bypass_prerequisite_grade_or_mat301():
    release = synthetic_release()
    inputs = history(
        release, "m206", grade=None, allocations=(allocate("math", "m206", "3"),)
    )
    snapshot = evaluate(release, inputs)
    assert result(snapshot, "math").status == Outcome.MET
    assert eligibility(release, inputs, "m301").status == Outcome.UNRESOLVED
    assert eligibility(release, inputs, "m302").status == Outcome.UNMET
    assert result(snapshot, "major-calculus").status == Outcome.UNMET


def test_path_a_mat206_then_mat301_then_mat302():
    release = synthetic_release()
    assert eligibility(release, history(release, "m206"), "m301").status == Outcome.MET
    assert (
        eligibility(release, history(release, "m206", "m301"), "m302").status
        == Outcome.MET
    )
    snapshot = evaluate(
        release,
        history(
            release,
            "m206",
            "m301",
            "m302",
            allocations=(
                allocate("math", "m206", "3"),
                allocate("major-calculus", "m302", "4"),
            ),
        ),
    )
    assert (
        result(snapshot, "math").status
        == result(snapshot, "major-calculus").status
        == Outcome.MET
    )
    assert snapshot.earned_credits == 12
    assert (
        snapshot.allocated_credits == 7
    )  # MAT 301 is not an extra degree requirement.
    assert snapshot.degree_status == "unresolved"


def test_path_b_mat301_then_mat302_without_mat206():
    release = synthetic_release()
    inputs = history(release, "m301", allocations=(allocate("math", "m301", "3"),))
    assert result(evaluate(release, inputs), "math").status == Outcome.MET
    progression = eligibility(release, inputs, "m302")
    assert progression.status == Outcome.MET
    assert progression.rule_id == "progression-302"
    assert progression.source_ids == ("synthetic",)
    assert result(evaluate(release, inputs), "major-calculus").status == Outcome.UNMET
    # Historical earned MAT 301 does not require inventing a historical MAT 206 attempt.
    finished = history(
        release,
        "m301",
        "m302",
        allocations=(
            allocate("math", "m301", "3"),
            allocate("major-calculus", "m302", "4"),
        ),
    )
    assert result(evaluate(release, finished), "major-calculus").status == Outcome.MET


@pytest.mark.parametrize(
    "grade,state", [(None, Outcome.UNRESOLVED), (2, Outcome.UNMET), (3, Outcome.MET)]
)
def test_progression_grade_conditions(grade, state):
    release = synthetic_release()
    assert (
        eligibility(release, history(release, "m301", grade=grade), "m302").status
        == state
    )


def test_recommendations_do_not_consume_degree_credit():
    release = synthetic_release()
    snapshot = evaluate(release, history(release))
    advice = next(r for r in snapshot.results if r.requirement_id == "speech-advice")
    assert advice.kind == "recommended"
    assert advice.result.status == Outcome.UNMET
    assert snapshot.allocated_credits == 0
    bad = evaluate(
        release,
        history(
            release, "speech1", allocations=(allocate("speech-advice", "speech1", "3"),)
        ),
    )
    assert "recommendation_cannot_consume_credit" in bad.issues


def test_scientific_world_requires_both_courses():
    release = synthetic_release()
    only_one = history(
        release, "c101", allocations=(allocate("scientific", "c101", "3"),)
    )
    assert result(evaluate(release, only_one), "scientific").status == Outcome.UNMET
    both = history(
        release,
        "c101",
        "c111",
        allocations=(
            allocate("scientific", "c101", "3"),
            allocate("scientific", "c111", "3"),
        ),
    )
    snapshot = evaluate(release, both)
    assert result(snapshot, "scientific").status == Outcome.MET
    assert snapshot.earned_credits == 7 and snapshot.allocated_credits == 6


def test_major_electives_six_credits_and_membership():
    release = synthetic_release()
    partial = history(release, "e1", allocations=(allocate("electives", "e1", "3"),))
    assert result(evaluate(release, partial), "electives").status == Outcome.UNMET
    complete = history(
        release,
        "e1",
        "e2",
        allocations=(
            allocate("electives", "e1", "3"),
            allocate("electives", "e2", "3"),
        ),
    )
    assert result(evaluate(release, complete), "electives").status == Outcome.MET
    invalid = history(
        release, "m301", allocations=(allocate("electives", "m301", "3"),)
    )
    assert "ineligible_allocation" in evaluate(release, invalid).issues


def test_flexible_core_cap_counts_courses_globally_across_groups():
    release = synthetic_release()
    extra = Requirement(
        id="extra-flex",
        label="Synthetic additional category",
        column=Column.FLEXIBLE,
        target_credits="3",
        rule=rule("extra-flex-rule", Completed(course_id="e1")),
    )
    release = Release.model_validate(
        {**release.model_dump(), "requirements": (*release.requirements, extra)}
    )
    two = history(
        release,
        "c101",
        "c111",
        allocations=(
            allocate("scientific", "c101", "3"),
            allocate("scientific", "c111", "3"),
        ),
    )
    assert evaluate(release, two).constraints[0].status == Outcome.MET
    three = history(
        release,
        "c101",
        "c111",
        "e1",
        allocations=(*two.allocations, allocate("extra-flex", "e1", "3")),
    )
    assert evaluate(release, three).constraints[0].status == Outcome.UNMET


def test_multiple_category_eligibility_never_duplicates_earned_credit():
    release = synthetic_release()
    another = Requirement(
        id="another",
        label="Synthetic overlap",
        column=Column.FLEXIBLE,
        target_credits="3",
        rule=rule("another-rule", Completed(course_id="m301")),
    )
    release = Release.model_validate(
        {**release.model_dump(), "requirements": (*release.requirements, another)}
    )
    inputs = history(
        release,
        "m301",
        allocations=(allocate("math", "m301", "3"), allocate("another", "m301", "3")),
    )
    snapshot = evaluate(release, inputs)
    assert snapshot.earned_credits == 4
    assert snapshot.allocated_credits == 0
    assert "allocation_exceeds_earned_credit" in snapshot.issues
    assert all(r.result.status == Outcome.UNRESOLVED for r in snapshot.results)


def test_catalog_versions_and_frozen_historical_replay():
    old, new = synthetic_release("2025-2026"), synthetic_release("2026-2027", "4")
    inputs = history(old, "m301", allocations=(allocate("math", "m301", "3"),))
    historical = evaluate(old, inputs)
    frozen_json = historical.model_dump_json()
    new_inputs = history(new, "m301", allocations=(allocate("math", "m301", "3"),))
    assert result(evaluate(new, new_inputs), "math").status == Outcome.UNMET
    assert result(historical, "math").status == Outcome.MET
    assert historical.model_dump_json() == frozen_json
    assert evaluate(historical.release, historical.inputs) == historical
    assert old.courses[0].version_id != new.courses[0].version_id
    assert (
        old.categories == new.categories
    )  # shared identity, different applicability/targets
    with pytest.raises(ValidationError):
        historical.release.catalog_year = "changed"


@pytest.mark.parametrize("state", ["provisional", "conflicting"])
def test_uncertain_sources_are_unresolved(state):
    release = synthetic_release()
    data = release.model_dump()
    data["sources"] = [
        {
            **release.sources[0].model_dump(),
            "state": state,
            "url": "https://example.org/synthetic-policy",
        }
    ]
    release = Release.model_validate(data)
    inputs = history(release, "m301", allocations=(allocate("math", "m301", "3"),))
    assert result(evaluate(release, inputs), "math").status == Outcome.UNRESOLVED


def test_unknown_and_unsupported_operators_fail_safely():
    release = synthetic_release()
    data = release.model_dump()
    data["requirements"] = [
        {
            **release.requirements[0].model_dump(),
            "rule": rule(
                "missing-policy", Unknown(reason="unsupported residency policy")
            ),
        }
    ]
    release = Release.model_validate(data)
    assert (
        result(evaluate(release, history(release)), "math").status == Outcome.UNRESOLVED
    )
    data["requirements"][0]["rule"] = {
        "id": "unsafe",
        "source_ids": ["synthetic"],
        "expression": {"op": "execute", "code": "print('unsafe')"},
    }
    with pytest.raises(ValidationError):
        Release.model_validate(data)


def test_graph_conditions_and_degree_groups_remain_separate():
    release = synthetic_release()
    projection = condition_projection(release)
    m302 = next(
        p for p in projection if p.course_id == "m302" and p.relation == "prerequisite"
    )
    assert m302.rule.expression == Completed(course_id="m301", minimum_grade_rank=3)
    assert release.requirements[0].rule.expression == AnyOf(
        children=(Completed(course_id="m206"), Completed(course_id="m301"))
    )
    assert m302.rule.id != release.requirements[0].rule.id


def test_selector_four_columns_reference_provenance_and_no_ui_rewrite():
    release = bmcc_cs_reference()
    assert [c.title.value for c in selector_columns(release)] == [
        "Required Common Core",
        "Flexible Core",
        "Major Requirements",
        "Major Electives",
    ]
    assert all(c.requirements for c in selector_columns(release))
    assert release.state == "draft"
    assert {s.state.value for s in release.sources} == {
        "source_verified",
        "provisional",
    }
    assert {t.label: t.credits for t in release.declared_totals}["Degree"] == 60
    assert (
        len(
            next(
                r for r in release.requirements if r.id == "major-electives"
            ).rule.expression.eligible
        )
        == 14
    )
    assert evaluate(release, history(release)).degree_status == "unresolved"
    assert (
        eligibility(
            release, history(release, "bmcc-course-mat-301"), "bmcc-course-mat-302"
        ).status
        == Outcome.UNRESOLVED
    )


@pytest.mark.parametrize(
    "change", ["campus", "source", "course", "duplicate", "category"]
)
def test_catalog_invalid_references_rejected(change):
    data = synthetic_release().model_dump(mode="json")
    if change == "campus":
        data["courses"][0]["identity"]["campus_id"] = "different-campus"
    elif change == "source":
        data["requirements"][0]["rule"]["source_ids"] = ["missing"]
    elif change == "course":
        data["requirements"][0]["rule"]["expression"] = {
            "op": "completed",
            "course_id": "missing",
        }
    elif change == "duplicate":
        data["courses"].append(data["courses"][0])
    else:
        data["requirements"][0]["category_id"] = "missing"
    with pytest.raises(ValidationError):
        Release.model_validate(data)


def test_cross_context_repeats_missing_prerequisites_and_unverified_history():
    release = synthetic_release()
    inputs = history(release, "m301")
    assert eligibility(release, inputs, "m206").status == Outcome.UNRESOLVED
    assert (
        eligibility(release, history(release, "m301", verified=False), "m302").status
        == Outcome.UNRESOLVED
    )
    assert (
        eligibility(
            release, history(release, "m301", status="in_progress"), "m302"
        ).status
        == Outcome.UNMET
    )
    wrong = EvaluationInput(**{**inputs.model_dump(), "campus_id": "another"})
    assert eligibility(release, wrong, "m302").status == Outcome.UNRESOLVED
    repeated = EvaluationInput(
        **{**inputs.model_dump(), "completions": inputs.completions * 2}
    )
    assert "repeat_policy_not_implemented" in evaluate(release, repeated).issues


def test_nested_and_or_json_round_trip_and_empty_logic_rejection():
    expression = AllOf(
        children=(
            Completed(course_id="m301"),
            AnyOf(children=(Completed(course_id="m206"), Completed(course_id="m302"))),
        )
    )
    parsed = type(rule("nested", expression)).model_validate_json(
        rule("nested", expression).model_dump_json()
    )
    assert parsed.expression == expression
    with pytest.raises(ValidationError):
        AllOf(children=())


@pytest.mark.parametrize(
    "invalid", ["duplicate", "unknown", "over_target", "fractional_overlap"]
)
def test_invalid_ledgers_never_return_a_met_requirement(invalid):
    release = synthetic_release()
    entry = allocate("math", "m301", "3")
    if invalid == "duplicate":
        entries = (entry, entry)
    elif invalid == "unknown":
        entries = (allocate("missing", "m301", "3"),)
    elif invalid == "over_target":
        entries = (allocate("math", "m301", "4"),)
    else:
        another = Requirement(
            id="extra",
            label="Synthetic overlap",
            column=Column.MAJOR,
            target_credits="1",
            rule=rule("extra-rule", Completed(course_id="m301")),
        )
        release = Release.model_validate(
            {**release.model_dump(), "requirements": (*release.requirements, another)}
        )
        entries = (entry, allocate("extra", "m301", "1"))
    snapshot = evaluate(release, history(release, "m301", allocations=entries))
    assert all(r.result.status == Outcome.UNRESOLVED for r in snapshot.results)
    assert snapshot.earned_credits == 4
    assert snapshot.allocated_credits == 0


def test_unconfirmed_year_and_corequisite_timing_are_unresolved():
    release = synthetic_release()
    data = release.model_dump()
    data["sources"] = [
        {
            **release.sources[0].model_dump(),
            "state": "source_verified",
            "url": "https://example.org/synthetic-policy",
            "year_confirmed": False,
        }
    ]
    unconfirmed = Release.model_validate(data)
    assert (
        eligibility(unconfirmed, history(unconfirmed, "m301"), "m302").status
        == Outcome.UNRESOLVED
    )
    reference = bmcc_cs_reference()
    assert (
        eligibility(
            reference, history(reference), "bmcc-course-phy-215", relation="corequisite"
        ).status
        == Outcome.UNRESOLVED
    )


def test_unknown_discipline_does_not_infer_a_subject_prefix():
    release = synthetic_release()
    data = release.model_dump()
    data["courses"] = [{**c.model_dump(), "discipline": None} for c in release.courses]
    release = Release.model_validate(data)
    inputs = history(
        release, "c101", allocations=(allocate("scientific", "c101", "3"),)
    )
    assert evaluate(release, inputs).constraints[0].status == Outcome.UNRESOLVED


def test_reference_and_snapshot_json_preserve_exact_inputs():
    release = bmcc_cs_reference()
    assert Release.model_validate_json(release.model_dump_json()) == release
    snapshot = evaluate(release, history(release))
    assert type(snapshot).model_validate_json(snapshot.model_dump_json()) == snapshot
    assert (
        next(r for r in release.requirements if r.id == "creative-advice").kind
        == "recommended"
    )
    with pytest.raises(ValidationError):
        allocate("math", "m301", "NaN")


@pytest.mark.parametrize(
    "state,year",
    [("provisional", True), ("conflicting", True), ("source_verified", False)],
)
@pytest.mark.parametrize("case", ["completion", "credits", "discipline"])
def test_course_metadata_uncertainty_cannot_become_a_met_rule(state, year, case):
    # Fictional evidence states exercise the boundary, not real academic approval.
    release = synthetic_release()
    data = release.model_dump()
    data["sources"] = [
        {
            **release.sources[0].model_dump(),
            "state": "source_verified",
            "year_confirmed": True,
            "url": "https://example.org/fictional-policy",
        },
        {
            **release.sources[0].model_dump(),
            "id": "metadata",
            "state": state,
            "year_confirmed": year,
            "url": "https://example.org/fictional-metadata",
        },
    ]
    course_id = {"completion": "m301", "credits": "e1", "discipline": "c101"}[case]
    for course in data["courses"]:
        if course["identity"]["id"] == course_id:
            course["source_ids"] = ["metadata"]
    release = Release.model_validate(data)
    if case == "completion":
        value = eligibility(release, history(release, "m301"), "m302")
    elif case == "credits":
        inputs = history(
            release,
            "e1",
            "e2",
            allocations=(
                allocate("electives", "e1", "3"),
                allocate("electives", "e2", "3"),
            ),
        )
        value = result(evaluate(release, inputs), "electives")
    else:
        inputs = history(
            release, "c101", allocations=(allocate("scientific", "c101", "3"),)
        )
        value = evaluate(release, inputs).constraints[0]
    assert value.status == Outcome.UNRESOLVED
    assert "metadata" in value.source_ids or any(
        "metadata" in c.source_ids for c in value.children
    )


def test_missing_catalog_credit_does_not_accept_invented_elective_credit():
    release = synthetic_release()
    data = release.model_dump()
    data["courses"] = [
        {**c.model_dump(), "credits": None if c.identity.id == "e1" else c.credits}
        for c in release.courses
    ]
    release = Release.model_validate(data)
    inputs = history(
        release,
        "e1",
        "e2",
        allocations=(
            allocate("electives", "e1", "3"),
            allocate("electives", "e2", "3"),
        ),
    )
    assert result(evaluate(release, inputs), "electives").status == Outcome.UNRESOLVED


def test_second_program_reuses_course_identities_without_engine_changes():
    first = synthetic_release()
    data = first.model_dump()
    data.update(
        id="fictional-second-program",
        program={"id": "other-program", "campus_id": first.campus_id},
        credential="AA",
        requirements=[first.requirements[1].model_dump()],
        constraints=[],
    )
    second = Release.model_validate(data)
    inputs = history(
        second, "m302", allocations=(allocate("major-calculus", "m302", "4"),)
    )
    assert result(evaluate(second, inputs), "major-calculus").status == Outcome.MET
    assert second.courses == first.courses
    assert [len(c.requirements) for c in selector_columns(second)] == [0, 0, 1, 0]


def test_replay_ignores_callers_decimal_precision_and_preserves_it():
    from decimal import localcontext

    release = synthetic_release()
    inputs = history(
        release,
        "m206",
        "m301",
        "m302",
        allocations=(
            allocate("math", "m206", "3"),
            allocate("major-calculus", "m302", "4"),
        ),
    )
    expected = evaluate(release, inputs)
    with localcontext() as caller:
        caller.prec = 1
        assert evaluate(release, inputs) == expected
        assert eligibility(release, inputs, "m302").status == Outcome.MET
        assert caller.prec == 1


def test_credit_sums_remain_exact_beyond_default_decimal_precision():
    release = synthetic_release()
    precise = Decimal("3.000000000000000000000000000001")
    data = release.model_dump()
    data["courses"] = [
        {
            **c.model_dump(),
            "credits": precise if c.identity.id in ("e1", "e2") else c.credits,
        }
        for c in release.courses
    ]
    release = Release.model_validate(data)
    inputs = history(
        release,
        "e1",
        "e2",
        allocations=(
            allocate("electives", "e1", "3"),
            allocate("electives", "e2", "3"),
        ),
    )
    snapshot = evaluate(release, inputs)
    assert snapshot.earned_credits == Decimal("6.000000000000000000000000000002")
    assert snapshot.allocated_credits == 6
    assert result(snapshot, "electives").status == Outcome.MET
