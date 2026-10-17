"""Pure bounded evaluation; no optimizer, registration or graduation certification.

Allocation is an explicit proposed ledger, validated globally before use. This
avoids a display-order-dependent greedy allocator while leaving search to a later
phase. Synthetic evidence is evaluated only in an explicitly synthetic release.
"""

from collections import Counter, defaultdict
from decimal import Context, Decimal, MAX_EMAX, MIN_EMIN, localcontext

from .contracts import (
    AllOf,
    AnyOf,
    Completed,
    Column,
    Completion,
    CreditMinimum,
    DisciplineCap,
    EvaluationInput,
    Expression,
    NoConditions,
    Outcome,
    Release,
    RequirementResult,
    Result,
    Rule,
    Snapshot,
    Unknown,
)
from .evidence import source_problem

ZERO = Decimal("0")


def _arithmetic_context(inputs: EvaluationInput) -> Context:
    """Size exact addition for the supplied values, independent of caller context."""
    values = [c.credits for c in inputs.completions] + [
        a.credits for a in inputs.allocations
    ]
    integer_places = max((value.adjusted() + 1 for value in values), default=1)
    fraction_places = max((-value.as_tuple().exponent for value in values), default=0)
    carry_places = len(str(len(values) + 1))
    return Context(
        prec=max(28, integer_places + fraction_places + carry_places),
        Emax=MAX_EMAX,
        Emin=MIN_EMIN,
    )


def _course_problem(
    course_ids: tuple[str, ...], release: Release, *, require_credits: bool = False
) -> Result | None:
    courses = {c.identity.id: c for c in release.courses}
    for course_id in course_ids:
        course = courses[course_id]
        problem = source_problem(course.source_ids, release)
        if problem:
            return problem
        if require_credits and course.credits is None:
            return Result(
                status=Outcome.UNRESOLVED,
                reason=f"missing_catalog_credit:{course_id}",
                source_ids=course.source_ids,
            )
    return None


def combine(results: tuple[Result, ...], *, any_of: bool = False) -> Result:
    states = {r.status for r in results}
    if any_of:
        status = (
            Outcome.MET
            if Outcome.MET in states
            else Outcome.UNRESOLVED if Outcome.UNRESOLVED in states else Outcome.UNMET
        )
    else:
        # Keep uncertainty visible even when another obligation is definitively unmet.
        status = (
            Outcome.UNRESOLVED
            if Outcome.UNRESOLVED in states
            else Outcome.UNMET if Outcome.UNMET in states else Outcome.MET
        )
    return Result(
        status=status, reason="any_of" if any_of else "all_of", children=results
    )


def _expression(
    expression: Expression,
    release: Release,
    records: tuple[Completion, ...],
    amounts: dict[str, Decimal],
) -> Result:
    if isinstance(expression, Unknown):
        return Result(status=Outcome.UNRESOLVED, reason=expression.reason)
    if isinstance(expression, NoConditions):
        return Result(status=Outcome.MET, reason="explicit_no_conditions")
    if isinstance(expression, (AllOf, AnyOf)):
        return combine(
            tuple(
                _expression(c, release, records, amounts) for c in expression.children
            ),
            any_of=isinstance(expression, AnyOf),
        )
    if isinstance(expression, Completed):
        candidates = [c for c in records if c.course_id == expression.course_id]
        if not candidates:
            return Result(
                status=Outcome.UNMET, reason=f"missing_course:{expression.course_id}"
            )
        # Duplicate course histories are rejected at the boundary.
        record = candidates[0]
        if not record.verified:
            return Result(status=Outcome.UNRESOLVED, reason="unverified_completion")
        if record.status != "passed":
            return Result(status=Outcome.UNMET, reason="not_earned_pass")
        if expression.minimum_grade_rank is not None:
            if record.grade_rank is None:
                return Result(status=Outcome.UNRESOLVED, reason="missing_grade")
            if record.grade_rank < expression.minimum_grade_rank:
                return Result(status=Outcome.UNMET, reason="grade_below_minimum")
        return _course_problem((record.course_id,), release) or Result(
            status=Outcome.MET, reason=f"completed:{record.id}"
        )
    if isinstance(expression, CreditMinimum):
        eligible = [c for c in records if c.course_id in expression.eligible]
        if any(not c.verified for c in eligible):
            return Result(status=Outcome.UNRESOLVED, reason="unverified_credit")
        problem = _course_problem(
            tuple(c.course_id for c in eligible), release, require_credits=True
        )
        if problem:
            return problem
        credits = sum(
            (amounts.get(c.id, ZERO) for c in eligible if c.status == "passed"), ZERO
        )
        return Result(
            status=Outcome.MET if credits >= expression.minimum else Outcome.UNMET,
            reason=f"eligible_credits:{credits};minimum:{expression.minimum}",
        )
    if isinstance(expression, DisciplineCap):
        courses = {c.identity.id: c for c in release.courses}
        problem = _course_problem(tuple(c.course_id for c in records), release)
        if problem:
            return problem
        selected = [courses[c.course_id] for c in records]
        if any(c.discipline is None for c in selected):
            return Result(
                status=Outcome.UNRESOLVED, reason="missing_discipline_classification"
            )
        counts = Counter(c.discipline for c in selected)
        exceeded = sorted(k for k, v in counts.items() if v > expression.maximum)
        return Result(
            status=Outcome.UNMET if exceeded else Outcome.MET,
            reason=(
                "discipline_cap_exceeded:" + ",".join(exceeded)
                if exceeded
                else "discipline_cap_met"
            ),
        )
    raise AssertionError("validated expression union must be exhaustively evaluated")


def _checked_rule(
    rule: Rule,
    release: Release,
    records: tuple[Completion, ...],
    amounts: dict[str, Decimal],
) -> Result:
    problem = source_problem(rule.source_ids, release)
    if problem:
        return problem
    return _expression(rule.expression, release, records, amounts)


def _rule(
    rule: Rule,
    release: Release,
    records: tuple[Completion, ...],
    amounts: dict[str, Decimal],
) -> Result:
    result = _checked_rule(rule, release, records, amounts)
    return result.model_copy(
        update={
            "rule_id": rule.id,
            "source_ids": tuple(dict.fromkeys((*rule.source_ids, *result.source_ids))),
        }
    )


def _input_issues(release: Release, inputs: EvaluationInput) -> tuple[str, ...]:
    issues = []
    if inputs.campus_id != release.campus_id or inputs.release_id != release.id:
        issues.append("catalog_context_mismatch")
    if release.state == "withdrawn":
        issues.append("withdrawn_release")
    if len({c.id for c in inputs.completions}) != len(inputs.completions):
        issues.append("duplicate_completion_id")
    if len({c.course_id for c in inputs.completions}) != len(inputs.completions):
        issues.append("repeat_policy_not_implemented")
    courses = {c.identity.id: c for c in release.courses}
    requirement_ids = {r.id for r in release.requirements}
    if len({e.id for e in inputs.non_credit_evidence}) != len(
        inputs.non_credit_evidence
    ):
        issues.append("duplicate_non_credit_evidence")
    for evidence in inputs.non_credit_evidence:
        if evidence.course_id not in courses or (
            evidence.requirement_id is not None
            and evidence.requirement_id not in requirement_ids
        ):
            issues.append("invalid_non_credit_reference")
    for record in inputs.completions:
        course = courses.get(record.course_id)
        if course is None:
            issues.append("unknown_course_identity")
        elif course.credits is not None and course.credits != record.credits:
            issues.append("credit_variation_needs_review")
    return tuple(sorted(set(issues)))


def _ledger_issues(release: Release, inputs: EvaluationInput) -> tuple[str, ...]:
    issues = []
    completions = {c.id: c for c in inputs.completions}
    requirements = {r.id: r for r in release.requirements}
    used = defaultdict(lambda: ZERO)
    per_requirement = defaultdict(lambda: ZERO)
    destinations = defaultdict(set)
    pairs = set()
    for allocation in inputs.allocations:
        record = completions.get(allocation.completion_id)
        requirement = requirements.get(allocation.requirement_id)
        pair = (allocation.requirement_id, allocation.completion_id)
        if pair in pairs:
            issues.append("duplicate_allocation")
        pairs.add(pair)
        if record is None or requirement is None:
            issues.append("unknown_allocation_reference")
            continue
        if requirement.kind != "required":
            issues.append("recommendation_cannot_consume_credit")
        if not record.verified or record.status != "passed":
            issues.append("allocation_requires_verified_earned_credit")
        # An allocation must belong to the requirement's explicit eligible pool.
        if record.course_id not in eligible_courses(requirement.rule.expression):
            issues.append("ineligible_allocation")
        used[record.id] += allocation.credits
        per_requirement[requirement.id] += allocation.credits
        destinations[record.id].add(requirement.id)
    if any(credits > completions[key].credits for key, credits in used.items()):
        issues.append("allocation_exceeds_earned_credit")
    if any(len(ids) > 1 for ids in destinations.values()):
        issues.append("overlap_policy_not_implemented")
    if any(
        requirements[key].target_credits is not None
        and credits > requirements[key].target_credits
        for key, credits in per_requirement.items()
    ):
        issues.append("allocation_exceeds_requirement_target")
    return tuple(sorted(set(issues)))


def eligible_courses(expression: Expression) -> frozenset[str]:
    if isinstance(expression, Completed):
        return frozenset((expression.course_id,))
    if isinstance(expression, CreditMinimum):
        return frozenset(expression.eligible)
    if isinstance(expression, (AllOf, AnyOf)):
        return frozenset().union(*(eligible_courses(c) for c in expression.children))
    return frozenset()


def _non_credit_result(
    result: Result,
    rule: Rule,
    inputs: EvaluationInput,
    requirement_id: str | None = None,
) -> Result:
    if result.status == Outcome.UNMET and any(
        e.course_id in eligible_courses(rule.expression)
        or (requirement_id is not None and e.requirement_id == requirement_id)
        for e in inputs.non_credit_evidence
    ):
        return Result(
            status=Outcome.UNRESOLVED,
            reason="non_credit_evidence_requires_academic_review",
            rule_id=rule.id,
            source_ids=rule.source_ids,
            children=(result,),
        )
    return result


def evaluate(release: Release, inputs: EvaluationInput) -> Snapshot:
    """Evaluate a synthetic snapshot with isolated exact credit arithmetic."""
    with localcontext(_arithmetic_context(inputs)):
        return _evaluate(release, inputs)


def _evaluate(release: Release, inputs: EvaluationInput) -> Snapshot:
    """Retain full immutable inputs/results; never infer degree completion."""
    input_issues = _input_issues(release, inputs)
    ledger_issues = _ledger_issues(release, inputs)
    issues = tuple(sorted(set(input_issues + ledger_issues + release.issues)))
    results = []
    for requirement in release.requirements:
        allocations = [
            a for a in inputs.allocations if a.requirement_id == requirement.id
        ]
        amounts = {a.completion_id: a.credits for a in allocations}
        records = (
            inputs.completions
            if requirement.kind == "recommended"
            else tuple(c for c in inputs.completions if c.id in amounts)
        )
        if input_issues or ledger_issues:
            result = Result(
                status=Outcome.UNRESOLVED, reason="invalid_evaluation_input_or_ledger"
            )
        else:
            result = _rule(requirement.rule, release, records, amounts)
            if (
                requirement.kind == "required"
                and requirement.target_credits is not None
            ):
                allocated = sum(amounts.values(), ZERO)
                result = combine(
                    (
                        result,
                        Result(
                            status=(
                                Outcome.MET
                                if allocated >= requirement.target_credits
                                else Outcome.UNMET
                            ),
                            reason=f"allocated_credits:{allocated};target:{requirement.target_credits}",
                        ),
                    )
                )
            result = _non_credit_result(
                result, requirement.rule, inputs, requirement.id
            )
        results.append(
            RequirementResult(
                requirement_id=requirement.id,
                rule_id=requirement.rule.id,
                source_ids=requirement.rule.source_ids,
                kind=requirement.kind,
                result=result,
            )
        )
    flexible_ids = {r.id for r in release.requirements if r.column == Column.FLEXIBLE}
    flexible_records = {
        a.completion_id for a in inputs.allocations if a.requirement_id in flexible_ids
    }
    selected = tuple(c for c in inputs.completions if c.id in flexible_records)
    constraints = tuple(
        (
            Result(
                status=Outcome.UNRESOLVED, reason="invalid_evaluation_input_or_ledger"
            )
            if input_issues or ledger_issues
            else _rule(rule, release, selected, {})
        )
        for rule in release.constraints
    )
    earned = (
        ZERO
        if input_issues
        else sum(
            (
                c.credits
                for c in inputs.completions
                if c.verified and c.status == "passed"
            ),
            ZERO,
        )
    )
    return Snapshot(
        release=release,
        inputs=inputs,
        results=tuple(results),
        constraints=constraints,
        earned_credits=earned,
        allocated_credits=(
            ZERO
            if input_issues or ledger_issues
            else sum((a.credits for a in inputs.allocations), ZERO)
        ),
        issues=issues,
    )


def eligibility(
    release: Release,
    inputs: EvaluationInput,
    course_id: str,
    *,
    relation: str = "prerequisite",
) -> Result:
    """Evaluate modeled prerequisites independently of degree allocation or seats."""
    with localcontext(_arithmetic_context(inputs)):
        return _eligibility(release, inputs, course_id, relation=relation)


def _eligibility(
    release: Release,
    inputs: EvaluationInput,
    course_id: str,
    *,
    relation: str,
) -> Result:
    """Modeled condition only, never offering/seat availability or placement clearance."""
    if relation not in ("prerequisite", "corequisite"):
        raise ValueError("unsupported eligibility relation")
    if _input_issues(release, inputs):
        return Result(status=Outcome.UNRESOLVED, reason="invalid_evaluation_context")
    course = next((c for c in release.courses if c.identity.id == course_id), None)
    if course is None:
        return Result(status=Outcome.UNRESOLVED, reason="unknown_course_identity")
    rule = getattr(course, relation)
    if rule is None:
        return Result(status=Outcome.UNRESOLVED, reason="missing_condition_definition")
    if relation == "corequisite":
        # Same-term enrollment semantics are deliberately outside this earned-only prototype.
        return Result(
            status=Outcome.UNRESOLVED, reason="corequisite_timing_not_implemented"
        )
    result = _rule(
        rule, release, inputs.completions, {c.id: c.credits for c in inputs.completions}
    )
    return _non_credit_result(result, rule, inputs)
