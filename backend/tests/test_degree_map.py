"""Projection is evidence-filtered, read-only and distinct from evaluation."""

import json
from pathlib import Path

from academic_factory import synthetic_release
from app.academic.contracts import Release, Rule, Completed, AnyOf, AllOf
from app.workspace.degree_map import degree_map_view


def reference(name):
    return Release.model_validate(
        json.loads(
            (
                Path(__file__).parents[2]
                / f"frontend/tests/fixtures/catalog-{name}.json"
            ).read_text()
        )["release"]
    )


def test_real_drafts_keep_scope_membership_and_no_unverified_prerequisites():
    for name in ("cs", "cis"):
        release = reference(name)
        before = release.model_dump_json()
        graph = degree_map_view(release)
        fixture = json.loads(
            (
                Path(__file__).parents[2]
                / f"frontend/tests/fixtures/catalog-{name}.json"
            ).read_text()
        )
        assert fixture["degree_map"] == json.loads(graph.model_dump_json())
        assert graph.release_id == release.id
        assert graph.catalog_year == release.catalog_year
        assert graph.complete is False
        assert all(e.relation == "membership" for e in graph.edges)
        assert all(e.verification == "source_verified" for e in graph.edges)
        assert {n.id for n in graph.nodes} >= {
            f"course:{c.identity.id}" for c in release.courses
        }
        assert len({n.id for n in graph.nodes}) == len(graph.nodes)
        assert len({e.id for e in graph.edges}) == len(graph.edges)
        assert release.model_dump_json() == before
    cs = degree_map_view(reference("cs"))
    assert any(
        e.source == "requirement:csc-211" and e.target == "course:bmcc-course-csc-211"
        for e in cs.edges
    )
    assert any(
        n.id == "requirement:english" and n.verification == "unresolved"
        for n in cs.nodes
    )


def test_synthetic_and_or_prerequisites_are_explicit_and_never_membership():
    release = synthetic_release()
    rule = Rule(
        id="synthetic-path",
        source_ids=("synthetic",),
        expression=AllOf(
            children=(
                Completed(course_id="m206"),
                AnyOf(
                    children=(Completed(course_id="c101"), Completed(course_id="c111"))
                ),
            )
        ),
    )
    courses = tuple(
        c.model_copy(update={"prerequisite": rule}) if c.identity.id == "m301" else c
        for c in release.courses
    )
    graph = degree_map_view(release.model_copy(update={"courses": courses}))
    edges = [e for e in graph.edges if e.relation == "prerequisite"]
    assert edges and all(e.verification == "synthetic" for e in edges)
    assert any(n.kind == "all" for n in graph.nodes)
    assert any(n.kind == "any" for n in graph.nodes)
    assert any(e.source == "course:m206" for e in edges)
    assert any(e.target == "course:m301" for e in edges)


def test_conflicts_unconfirmed_year_and_absent_evidence_never_form_edges():
    original = reference("cs")
    for change in (
        {"state": "provisional"},
        {"year_confirmed": False},
        {"conflicts_with": ("program-f1",)},
    ):
        sources = tuple(
            s.model_copy(update=change) if s.id == "program-major" else s
            for s in original.sources
        )
        graph = degree_map_view(original.model_copy(update={"sources": sources}))
        assert not any(e.source == "requirement:csc-211" for e in graph.edges)
    requirements = tuple(
        r.model_copy(update={"rule": r.rule.model_copy(update={"source_ids": ()})})
        for r in original.requirements
    )
    graph = degree_map_view(original.model_copy(update={"requirements": requirements}))
    assert not any(e.relation == "membership" for e in graph.edges)


def test_grade_constraints_are_not_silently_simplified_and_decimal_strings_survive():
    graph = degree_map_view(synthetic_release(math_minimum="3.000"))
    assert not any(e.relation == "prerequisite" for e in graph.edges)
    assert any(n.credits == "3.000" for n in graph.nodes)


def test_incoming_conflict_blocks_otherwise_verified_membership():
    release = reference("cs")
    sources = tuple(
        (
            s.model_copy(update={"conflicts_with": ("program-major",)})
            if s.id == "program-f1"
            else s
        )
        for s in release.sources
    )
    graph = degree_map_view(release.model_copy(update={"sources": sources}))
    assert not any(e.source == "requirement:csc-211" for e in graph.edges)


def test_unknown_or_branch_is_not_simplified_into_an_authoritative_option():
    from app.academic.contracts import Unknown

    release = synthetic_release()
    requirements = tuple(
        (
            r.model_copy(
                update={
                    "rule": r.rule.model_copy(
                        update={
                            "expression": AnyOf(
                                children=(
                                    Completed(course_id="m301"),
                                    Unknown(reason="Policy unconfirmed"),
                                )
                            )
                        }
                    )
                }
            )
            if r.id == "math"
            else r
        )
        for r in release.requirements
    )
    graph = degree_map_view(release.model_copy(update={"requirements": requirements}))
    assert not any(e.source == "requirement:math" for e in graph.edges)
    assert any(
        n.id == "requirement:math" and n.verification == "unresolved"
        for n in graph.nodes
    )


def test_condition_ids_do_not_collide_when_requirement_ids_contain_separators():
    release = synthetic_release()
    first = release.requirements[0]
    option = AnyOf(children=(Completed(course_id="m206"), Completed(course_id="m301")))
    a = first.model_copy(
        update={
            "id": "a",
            "rule": first.rule.model_copy(
                update={"expression": AllOf(children=(option,))}
            ),
        }
    )
    b = first.model_copy(
        update={
            "id": "a:0",
            "rule": first.rule.model_copy(update={"expression": option}),
        }
    )
    graph = degree_map_view(release.model_copy(update={"requirements": (a, b)}))
    assert len([n for n in graph.nodes if n.kind in ("all", "any")]) == 3
    assert len({e.id for e in graph.edges}) == len(graph.edges)
