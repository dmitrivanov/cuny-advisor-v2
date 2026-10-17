"""Projection and hypothetical input adaptation; domain evaluator is unchanged."""

from typing import Literal
import re

from pydantic import Field, model_validator

from app.academic.contracts import (
    Allocation,
    Completion,
    Contract,
    EvaluationInput,
    Identifier,
    Release,
    Result,
    Snapshot,
)
from app.academic.evaluation import eligibility, evaluate
from app.academic.projections import selector_columns


class ReleaseSummary(Contract):
    campus_id: Identifier
    program_id: Identifier
    release_id: Identifier
    catalog_year: Identifier
    credential: str
    revision_id: Identifier


class SelectorGroup(Contract):
    requirement_id: Identifier
    label: str
    kind: str
    target_credits: str | None
    course_ids: tuple[str, ...]
    condition_label: str


class WorkspaceColumn(Contract):
    title: str
    groups: tuple[SelectorGroup, ...]


class CatalogView(Contract):
    release: Release
    columns: tuple[WorkspaceColumn, ...]
    limitation: str = (
        "Draft catalog. Source verification is not institutional approval. Partial data is not a complete audit."
    )


def referenced_courses(expression):
    """Read-only AST membership projection, never satisfaction or allocation."""
    if expression.op == "completed":
        return (expression.course_id,)
    if expression.op == "credits":
        return expression.eligible
    if expression.op in ("all", "any"):
        return tuple(
            dict.fromkeys(
                course
                for child in expression.children
                for course in referenced_courses(child)
            )
        )
    return ()


def catalog_view(release):
    return CatalogView(
        release=release,
        columns=tuple(
            WorkspaceColumn(
                title=column.title,
                groups=tuple(
                    SelectorGroup(
                        requirement_id=item.id,
                        label=item.label,
                        kind=item.kind,
                        target_credits=(
                            str(item.target_credits)
                            if item.target_credits is not None
                            else None
                        ),
                        course_ids=referenced_courses(item.rule.expression),
                        condition_label={
                            "all": "All modeled conditions apply",
                            "any": "Alternative modeled conditions",
                            "credits": "Explicit credit allocation required",
                            "completed": "Specified course condition",
                            "unknown": "Unresolved policy",
                            "discipline_cap": "Modeled discipline limit",
                            "no_conditions": "Explicit no-condition assertion",
                        }[item.rule.expression.op],
                    )
                    for item in column.requirements
                ),
            )
            for column in selector_columns(release)
        ),
    )


class HypotheticalRequest(Contract):
    hypothetical: Literal[True]
    selected_course_ids: tuple[Identifier, ...] = Field(default=(), max_length=200)
    allocations: tuple[Allocation, ...] = Field(default=(), max_length=200)

    @model_validator(mode="before")
    @classmethod
    def exact_bounded_credit_input(cls, value):
        # Public HTTP input must not introduce floats or unbounded exponents.
        if isinstance(value, dict):
            allocations = value.get("allocations", ())
            if not isinstance(allocations, (list, tuple)):
                return value
            for allocation in allocations:
                if isinstance(allocation, dict):
                    credits = allocation.get("credits")
                    if not isinstance(credits, str) or not re.fullmatch(
                        r"[0-9]{1,128}(?:\.[0-9]{1,128})?", credits
                    ):
                        raise ValueError(
                            "allocation credits require a bounded exact decimal string"
                        )
        return value

    @model_validator(mode="after")
    def unique_selection(self):
        if len(set(self.selected_course_ids)) != len(self.selected_course_ids):
            raise ValueError("duplicate course selection")
        return self


class EligibilityView(Contract):
    course_id: str
    prerequisite: Result


class ProgressView(Contract):
    state: Literal["preview", "unresolved"]
    snapshot: Snapshot | None = None
    prerequisites: tuple[EligibilityView, ...] = ()
    issues: tuple[str, ...] = ()
    limitation: str = (
        "Hypothetical passed-course assumptions only. Grades remain unknown. No verified student record, automatic allocation, or graduation decision."
    )


def preview(release: Release, request: HypotheticalRequest):
    courses = {course.identity.id: course for course in release.courses}
    if not set(request.selected_course_ids) <= courses.keys():
        raise ValueError("Unknown course identity for this release")
    requirements = {item.id for item in release.requirements}
    attempt_ids = {
        f"hypothetical:{course_id}" for course_id in request.selected_course_ids
    }
    if any(
        item.requirement_id not in requirements or item.completion_id not in attempt_ids
        for item in request.allocations
    ):
        raise ValueError(
            "Allocation must reference this release and selected hypothetical attempts"
        )
    missing = tuple(
        f"missing_catalog_credit:{course_id}"
        for course_id in request.selected_course_ids
        if courses[course_id].credits is None
    )
    if missing:
        return ProgressView(state="unresolved", issues=missing)
    inputs = EvaluationInput(
        campus_id=release.campus_id,
        release_id=release.id,
        record_revision="session-hypothetical",
        allocations=request.allocations,
        completions=tuple(
            Completion(
                id=f"hypothetical:{course_id}",
                course_id=course_id,
                credits=courses[course_id].credits,
                verified=True,
                grade_rank=None,
            )
            for course_id in request.selected_course_ids
        ),
    )
    # verified=True is an explicit fictional assumption in this preview only,
    # never institutional verification; no write or retained snapshot operation.
    return ProgressView(
        state="preview",
        snapshot=evaluate(release, inputs),
        prerequisites=tuple(
            EligibilityView(
                course_id=course.identity.id,
                prerequisite=eligibility(release, inputs, course.identity.id),
            )
            for course in release.courses
        ),
    )
