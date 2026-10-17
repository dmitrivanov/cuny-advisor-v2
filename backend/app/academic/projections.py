"""Read-only consumers of canonical definitions; no independent academic formulas."""

from .contracts import Column, Contract, Release, Requirement, Rule


class SelectorColumn(Contract):
    title: Column
    requirements: tuple[Requirement, ...]


def selector_columns(release: Release) -> tuple[SelectorColumn, ...]:
    return tuple(
        SelectorColumn(
            title=column,
            requirements=tuple(r for r in release.requirements if r.column == column),
        )
        for column in Column
    )


class ConditionProjection(Contract):
    course_id: str
    relation: str
    rule: Rule | None


def condition_projection(release: Release) -> tuple[ConditionProjection, ...]:
    """Retain grouped AST, provenance and missing definitions, not flattened arrows.

    This is the semantic input for a later graph/list/planner. Layout and course
    eligibility remain separate; same-term corequisite support is not implied.
    """
    return tuple(
        ConditionProjection(
            course_id=c.identity.id, relation=relation, rule=getattr(c, relation)
        )
        for c in release.courses
        for relation in ("prerequisite", "corequisite")
    )
