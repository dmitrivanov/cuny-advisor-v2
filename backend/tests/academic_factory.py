"""Fictional policy, grades and histories. No official BMCC policy approval."""

from datetime import date

from app.academic.contracts import (
    AllOf,
    AnyOf,
    Category,
    Column,
    Completed,
    CourseIdentity,
    CourseVersion,
    CreditMinimum,
    DisciplineCap,
    ProgramIdentity,
    Release,
    Requirement,
    Rule,
    Source,
)


def rule(id, expression):
    return Rule(id=id, expression=expression, source_ids=("synthetic",))


def synthetic_release(year="2026-2027", math_minimum="3"):
    courses = []
    for id, credits, discipline in (
        ("m206", "4", "math"),
        ("m301", "4", "math"),
        ("m302", "4", "math"),
        ("c101", "3", "computing"),
        ("c111", "4", "computing"),
        ("e1", "3", "computing"),
        ("e2", "3", "computing"),
        ("speech1", "3", "speech"),
        ("speech2", "3", "speech"),
    ):
        prerequisite = None
        if id == "m301":
            # Deliberately synthetic B-or-higher condition, not BMCC's grade policy.
            prerequisite = rule(
                "progression-301", Completed(course_id="m206", minimum_grade_rank=3)
            )
        elif id == "m302":
            prerequisite = rule(
                "progression-302", Completed(course_id="m301", minimum_grade_rank=3)
            )
        courses.append(
            CourseVersion(
                identity=CourseIdentity(id=id, campus_id="test-campus"),
                version_id=f"{id}:{year}",
                code=id.upper(),
                title=f"Synthetic {id}",
                credits=credits,
                discipline=discipline,
                source_ids=("synthetic",),
                prerequisite=prerequisite,
            )
        )

    def req(id, column, expression, credits=None, kind="required"):
        return Requirement(
            id=id,
            label=id,
            column=column,
            kind=kind,
            target_credits=credits,
            category_id="shared-math" if id == "math" else None,
            rule=rule(id + "-rule", expression),
        )

    return Release(
        id=f"synthetic:{year}",
        campus_id="test-campus",
        catalog_year=year,
        program=ProgramIdentity(id="synthetic-program", campus_id="test-campus"),
        credential="AS",
        sources=(
            Source(
                id="synthetic",
                retrieved_on=date(2026, 10, 16),
                catalog_year=year,
                section="Synthetic tests",
                state="synthetic",
                note="Fictional rules only",
            ),
        ),
        categories=(
            Category(id="shared-math", label="Shared mathematical vocabulary"),
        ),
        courses=tuple(courses),
        requirements=(
            req(
                "math",
                Column.REQUIRED,
                AnyOf(
                    children=(Completed(course_id="m206"), Completed(course_id="m301"))
                ),
                math_minimum,
            ),
            req("major-calculus", Column.MAJOR, Completed(course_id="m302"), "4"),
            req(
                "scientific",
                Column.FLEXIBLE,
                AllOf(
                    children=(Completed(course_id="c101"), Completed(course_id="c111"))
                ),
                "6",
            ),
            req(
                "speech-advice",
                Column.FLEXIBLE,
                AnyOf(
                    children=(
                        Completed(course_id="speech1"),
                        Completed(course_id="speech2"),
                    )
                ),
                kind="recommended",
            ),
            req(
                "electives",
                Column.ELECTIVES,
                CreditMinimum(eligible=("e1", "e2"), minimum="6"),
                "6",
            ),
        ),
        constraints=(rule("discipline-cap", DisciplineCap(maximum=2)),),
    )
