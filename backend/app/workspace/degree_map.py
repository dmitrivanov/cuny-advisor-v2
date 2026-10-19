"""Read-only, release-bound visual projection. Never evaluates academic completion."""

import json
from typing import Literal

from app.academic.contracts import Contract, EvidenceState, Release
from app.academic.evidence import source_problem


class MapNode(Contract):
    id: str
    kind: Literal["course", "requirement", "all", "any", "credits", "unknown"]
    label: str
    course_id: str | None = None
    requirement_id: str | None = None
    credits: str | None = None
    verification: Literal["source_verified", "unresolved", "synthetic"]


class MapEdge(Contract):
    id: str
    source: str
    target: str
    relation: Literal["membership", "prerequisite"]
    source_ids: tuple[str, ...]
    verification: Literal["source_verified", "synthetic"]


class MapGroup(Contract):
    id: str
    label: str
    column: str
    kind: str
    target_credits: str | None


class DegreeMapView(Contract):
    release_id: str
    campus_id: str
    program_id: str
    catalog_year: str
    complete: Literal[False] = False
    nodes: tuple[MapNode, ...]
    edges: tuple[MapEdge, ...]
    groups: tuple[MapGroup, ...]


def degree_map_view(release: Release) -> DegreeMapView:
    """Only supported AST relations with usable evidence become display edges.

    Membership and prerequisites have different edge types. Grade/credit conditions
    remain explicit condition nodes; no layout simplification changes the rule AST.
    Provisional rules expose no inferred edges, including a partly known OR branch.
    """
    nodes: dict[str, MapNode] = {}
    edges: list[MapEdge] = []
    sources = {s.id: s for s in release.sources}

    def verification(ids):
        if not ids or source_problem(ids, release):
            return "unresolved"
        if all(s.state == EvidenceState.SYNTHETIC for s in release.sources):
            return "synthetic"
        if all(sources[i].state == EvidenceState.VERIFIED for i in ids):
            return "source_verified"
        return "unresolved"

    for course in release.courses:
        nodes[f"course:{course.identity.id}"] = MapNode(
            id=f"course:{course.identity.id}",
            course_id=course.identity.id,
            kind="course",
            label=course.code,
            credits=str(course.credits) if course.credits is not None else None,
            verification=verification(course.source_ids),
        )

    def supported(expression):
        if expression.op == "completed":
            return expression.minimum_grade_rank is None
        if expression.op in ("all", "any"):
            return all(supported(child) for child in expression.children)
        return expression.op in ("credits", "no_conditions")

    def edge(source, target, relation, ids, status):
        edges.append(
            MapEdge(
                id=f"{relation}:{json.dumps([source, target], separators=(',', ':'))}",
                source=source,
                target=target,
                relation=relation,
                source_ids=ids,
                verification=status,
            )
        )

    def project(expression, root, relation, rule, status, path):
        if expression.op == "completed":
            if relation == "membership":
                edge(
                    root,
                    f"course:{expression.course_id}",
                    relation,
                    rule.source_ids,
                    status,
                )
            else:
                edge(
                    f"course:{expression.course_id}",
                    root,
                    relation,
                    rule.source_ids,
                    status,
                )
            return
        if expression.op == "no_conditions":
            return
        condition = f"condition:{json.dumps(path, separators=(',', ':'))}"
        nodes[condition] = MapNode(
            id=condition,
            kind=expression.op,
            label=(
                f"At least {expression.minimum} credits"
                if expression.op == "credits"
                else "All of" if expression.op == "all" else "One of"
            ),
            verification=status,
        )
        if relation == "membership":
            edge(root, condition, relation, rule.source_ids, status)
        else:
            edge(condition, root, relation, rule.source_ids, status)
        if expression.op == "credits":
            # Credit-pool membership is not itself prerequisite completion.
            for course_id in expression.eligible:
                edge(
                    condition,
                    f"course:{course_id}",
                    "membership",
                    rule.source_ids,
                    status,
                )
        else:
            for i, child in enumerate(expression.children):
                project(child, condition, relation, rule, status, (*path, i))

    for requirement in release.requirements:
        rule = requirement.rule
        status = verification(rule.source_ids)
        usable = status != "unresolved" and supported(rule.expression)
        root = f"requirement:{requirement.id}"
        nodes[root] = MapNode(
            id=root,
            requirement_id=requirement.id,
            kind="requirement",
            label=requirement.label,
            credits=(
                str(requirement.target_credits)
                if requirement.target_credits is not None
                else None
            ),
            verification=status if usable else "unresolved",
        )
        if usable:
            project(rule.expression, root, "membership", rule, status, (root,))
    for course in release.courses:
        rule = course.prerequisite
        if rule is None:
            continue
        status = verification(rule.source_ids)

        # Credit pools/other unsupported prerequisite semantics are not simplified.
        def prerequisite_supported(expression):
            if expression.op in ("all", "any"):
                return all(prerequisite_supported(c) for c in expression.children)
            return expression.op in ("completed", "no_conditions") and supported(
                expression
            )

        if status != "unresolved" and prerequisite_supported(rule.expression):
            project(
                rule.expression,
                f"course:{course.identity.id}",
                "prerequisite",
                rule,
                status,
                (f"prerequisite:{course.identity.id}",),
            )
    return DegreeMapView(
        release_id=release.id,
        campus_id=release.campus_id,
        program_id=release.program.id,
        catalog_year=release.catalog_year,
        nodes=tuple(nodes.values()),
        edges=tuple(edges),
        groups=tuple(
            MapGroup(
                id=r.id,
                label=r.label,
                column=r.column.value,
                kind=r.kind,
                target_credits=(
                    str(r.target_credits) if r.target_credits is not None else None
                ),
            )
            for r in release.requirements
        ),
    )
