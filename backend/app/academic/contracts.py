"""Version 1 constrained domain contracts; published policy authority is external.

IDs are opaque within campus/release scope. Display codes are never matching keys.
Frozen models and tuple collections make retained evaluation inputs immutable.
"""

from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Identifier = Annotated[str, Field(min_length=1, max_length=160)]
Credits = Annotated[Decimal, Field(ge=0, allow_inf_nan=False)]
PositiveCredits = Annotated[Decimal, Field(gt=0, allow_inf_nan=False)]


class Contract(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")


class EvidenceState(StrEnum):
    VERIFIED = "source_verified"
    PROVISIONAL = "provisional"
    CONFLICTING = "conflicting"
    SYNTHETIC = "synthetic"
    UNRESOLVED = "unresolved"


class Source(Contract):
    id: Identifier
    url: str | None = None
    retrieved_on: date
    catalog_year: Identifier
    section: Identifier
    state: EvidenceState
    year_confirmed: bool = False
    note: str
    publisher: str | None = None
    campus_id: Identifier | None = None
    program_id: Identifier | None = None
    claim_scope: str | None = None
    published_on: date | None = None
    revised_on: date | None = None
    effective_on: date | None = None
    conflicts_with: tuple[Identifier, ...] = ()
    academic_review: Literal["required"] = "required"

    @model_validator(mode="after")
    def official_evidence_has_locator(self):
        if self.state not in (EvidenceState.SYNTHETIC, EvidenceState.UNRESOLVED) and (
            not self.url or not self.url.startswith("https://")
        ):
            raise ValueError("non-synthetic evidence requires an HTTPS source URL")
        if self.program_id is not None and self.campus_id is None:
            raise ValueError("program evidence requires explicit campus scope")
        if self.published_on and self.published_on > self.retrieved_on:
            raise ValueError("publication cannot follow retrieval")
        if self.revised_on and self.revised_on > self.retrieved_on:
            raise ValueError("revision cannot follow retrieval")
        return self


class CourseIdentity(Contract):
    id: Identifier
    campus_id: Identifier


class ProgramIdentity(Contract):
    id: Identifier
    campus_id: Identifier


class Category(Contract):
    """Shared vocabulary; applicability/targets belong to release requirements."""

    id: Identifier
    label: str


class Completed(Contract):
    op: Literal["completed"] = "completed"
    course_id: Identifier
    minimum_grade_rank: int | None = Field(default=None, ge=0)


class AllOf(Contract):
    op: Literal["all"] = "all"
    children: tuple["Expression", ...] = Field(min_length=1)


class AnyOf(Contract):
    op: Literal["any"] = "any"
    children: tuple["Expression", ...] = Field(min_length=1)


class CreditMinimum(Contract):
    op: Literal["credits"] = "credits"
    eligible: tuple[Identifier, ...] = Field(min_length=1)
    minimum: PositiveCredits


class DisciplineCap(Contract):
    op: Literal["discipline_cap"] = "discipline_cap"
    maximum: int = Field(ge=1)


class Unknown(Contract):
    op: Literal["unknown"] = "unknown"
    reason: str = Field(min_length=1)


class NoConditions(Contract):
    """An explicit assertion, never inferred from a missing prerequisite."""

    op: Literal["no_conditions"] = "no_conditions"


Expression = Annotated[
    Completed | AllOf | AnyOf | CreditMinimum | DisciplineCap | Unknown | NoConditions,
    Field(discriminator="op"),
]
AllOf.model_rebuild()
AnyOf.model_rebuild()


class Rule(Contract):
    id: Identifier
    expression: Expression
    source_ids: tuple[Identifier, ...] = Field(min_length=1)


class CourseVersion(Contract):
    identity: CourseIdentity
    version_id: Identifier
    code: Identifier
    title: str
    credits: Credits | None = None
    discipline: Identifier | None = None
    source_ids: tuple[Identifier, ...] = Field(min_length=1)
    prerequisite: Rule | None = None
    corequisite: Rule | None = None
    # Absence of offering evidence never establishes a seat or section.
    offering_status: Literal["unknown"] = "unknown"


class Column(StrEnum):
    REQUIRED = "Required Common Core"
    FLEXIBLE = "Flexible Core"
    MAJOR = "Major Requirements"
    ELECTIVES = "Major Electives"


class Requirement(Contract):
    id: Identifier
    label: str
    column: Column
    category_id: Identifier | None = None
    kind: Literal["required", "recommended"] = "required"
    target_credits: Credits | None = None
    rule: Rule


class DeclaredTotal(Contract):
    label: Identifier
    credits: Credits
    source_ids: tuple[Identifier, ...] = Field(min_length=1)


class Release(Contract):
    schema_version: Literal["1"] = "1"
    id: Identifier
    campus_id: Identifier
    catalog_year: Identifier
    program: ProgramIdentity
    credential: Literal["AA", "AS", "AAS"]
    state: Literal["draft", "in_review", "published", "withdrawn"] = "draft"
    # Phase 02A never publishes; future publication needs independently verified
    # scoped authority and exact-revision approval, not a role string on this model.
    sources: tuple[Source, ...]
    categories: tuple[Category, ...]
    courses: tuple[CourseVersion, ...]
    requirements: tuple[Requirement, ...]
    constraints: tuple[Rule, ...] = ()
    declared_totals: tuple[DeclaredTotal, ...] = ()
    issues: tuple[str, ...] = ()

    @model_validator(mode="after")
    def validate_references(self):
        def unique(items, key):
            values = [key(item) for item in items]
            if len(values) != len(set(values)):
                raise ValueError("duplicate identity in release")

        for items, key in (
            (self.sources, lambda x: x.id),
            (self.categories, lambda x: x.id),
            (self.courses, lambda x: x.identity.id),
            (self.courses, lambda x: x.version_id),
            (self.requirements, lambda x: x.id),
        ):
            unique(items, key)
        if self.program.campus_id != self.campus_id or any(
            c.identity.campus_id != self.campus_id for c in self.courses
        ):
            raise ValueError("cross-campus catalog reference")
        source_ids = {s.id for s in self.sources}
        for source in self.sources:
            if source.campus_id is not None and source.campus_id != self.campus_id:
                raise ValueError("cross-campus source evidence")
            if source.program_id is not None and source.program_id != self.program.id:
                raise ValueError("cross-program source evidence")
            if (
                not set(source.conflicts_with) <= source_ids
                or source.id in source.conflicts_with
            ):
                raise ValueError("invalid evidence conflict reference")
        if any(not set(t.source_ids) <= source_ids for t in self.declared_totals):
            raise ValueError("unknown declared-total source")
        course_ids = {c.identity.id for c in self.courses}
        categories = {c.id for c in self.categories}

        def check_expression(expression):
            if (
                isinstance(expression, Completed)
                and expression.course_id not in course_ids
            ):
                raise ValueError("unknown course reference")
            if (
                isinstance(expression, CreditMinimum)
                and not set(expression.eligible) <= course_ids
            ):
                raise ValueError("unknown eligible course reference")
            if isinstance(expression, (AllOf, AnyOf)):
                for child in expression.children:
                    check_expression(child)

        rules = list(self.constraints) + [r.rule for r in self.requirements]
        for course in self.courses:
            if not set(course.source_ids) <= source_ids:
                raise ValueError("unknown course source")
            rules.extend(r for r in (course.prerequisite, course.corequisite) if r)
        unique(rules, lambda x: x.id)
        for rule in rules:
            if not set(rule.source_ids) <= source_ids:
                raise ValueError("unknown rule source")
            check_expression(rule.expression)
        if any(
            r.category_id and r.category_id not in categories for r in self.requirements
        ):
            raise ValueError("unknown shared category")
        if any(s.catalog_year != self.catalog_year for s in self.sources):
            raise ValueError("source applicability must name this catalog year")
        return self


class Completion(Contract):
    """Synthetic evaluation input, not an institutional award or stored student."""

    id: Identifier
    course_id: Identifier
    credits: Credits
    verified: bool = False
    status: Literal["passed", "failed", "in_progress"] = "passed"
    grade_rank: int | None = Field(default=None, ge=0)


class Allocation(Contract):
    requirement_id: Identifier
    completion_id: Identifier
    credits: PositiveCredits


class NonCreditEvidence(Contract):
    """Synthetic placement/exemption/waiver claim; never an award or approval."""

    id: Identifier
    course_id: Identifier
    kind: Literal["placement", "exemption", "waiver"]
    requirement_id: Identifier | None = None
    note: str


class EvaluationInput(Contract):
    campus_id: Identifier
    release_id: Identifier
    record_revision: Identifier
    completions: tuple[Completion, ...] = ()
    allocations: tuple[Allocation, ...] = ()
    non_credit_evidence: tuple[NonCreditEvidence, ...] = ()


class Outcome(StrEnum):
    MET = "met"
    UNMET = "unmet"
    UNRESOLVED = "unresolved"


class Result(Contract):
    status: Outcome
    reason: str
    children: tuple["Result", ...] = ()
    rule_id: Identifier | None = None
    source_ids: tuple[Identifier, ...] = ()


class RequirementResult(Contract):
    requirement_id: Identifier
    rule_id: Identifier
    source_ids: tuple[Identifier, ...]
    kind: Literal["required", "recommended"]
    result: Result


class Snapshot(Contract):
    engine_version: Literal["02a.1", "02b.1"] = "02b.1"
    release: Release
    inputs: EvaluationInput
    results: tuple[RequirementResult, ...]
    constraints: tuple[Result, ...]
    earned_credits: Credits
    allocated_credits: Credits
    issues: tuple[str, ...]
    degree_status: Literal["unresolved"] = "unresolved"


class ExceptionProposal(Contract):
    """Representation only: evaluator cannot grant or apply personal exceptions."""

    id: Identifier
    campus_id: Identifier
    release_id: Identifier
    synthetic_subject_id: Identifier
    requirement_id: Identifier
    substitute_course_id: Identifier
    source_ids: tuple[Identifier, ...] = Field(min_length=1)
    state: Literal["proposed", "needs_authorized_review"] = "proposed"
