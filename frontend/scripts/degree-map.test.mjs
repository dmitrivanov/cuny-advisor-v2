import test from "node:test";
import { studentReason } from "../src/lib/workspace/presentation.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validMap,
  layoutMap,
  prerequisiteTrace,
  visibleMap,
  courseStatus,
  compactMap,
} from "../src/lib/workspace/degree-map.ts";
import {
  mapIntent,
  mapURL,
  readMapTarget,
  validMapTarget,
} from "../src/lib/workspace/map-navigation.ts";
import {
  workspaceReducer,
  initialState,
  previewBody,
} from "../src/lib/workspace/state.ts";
const catalog = JSON.parse(
  readFileSync(new URL("../tests/fixtures/catalog-cs.json", import.meta.url)),
);
const graph = catalog.degree_map;
test("map context is exact, bounded and never mixes browse years or programs", () => {
  assert.equal(validMap(graph, catalog), true);
  for (const change of [
    { catalog_year: "2025-2026" },
    { program_id: "other" },
    { release_id: "other" },
    {
      edges: [
        {
          source: "missing",
          target: graph.nodes[0].id,
          relation: "prerequisite",
          verification: "source_verified",
        },
      ],
    },
  ])
    assert.equal(validMap({ ...graph, ...change }, catalog), false);
});
test("layout is deterministic, cycle-safe and cannot mutate graph or course state", () => {
  const before = JSON.stringify(graph);
  assert.deepEqual(
    layoutMap(graph.nodes, graph.edges),
    layoutMap(graph.nodes, graph.edges),
  );
  assert.equal(JSON.stringify(graph), before);
  assert.throws(() => layoutMap(Array(201).fill(graph.nodes[0]), []));
  const ns = graph.nodes.slice(0, 2);
  assert.equal(
    layoutMap(ns, [
      { source: ns[0].id, target: ns[1].id },
      { source: ns[1].id, target: ns[0].id },
    ]).size,
    2,
  );
});
test("only prerequisite edges influence bidirectional traversal, preserving AND/OR nodes", () => {
  const nodes = ["a", "or", "b", "and", "c", "requirement"].map((id) => ({
    id,
  }));
  const edges = [
    ["a", "or"],
    ["b", "or"],
    ["or", "and"],
    ["and", "c"],
  ].map(([source, target]) => ({ source, target, relation: "prerequisite" }));
  edges.push({ source: "requirement", target: "a", relation: "membership" });
  const b = prerequisiteTrace({ nodes, edges }, "and");
  assert.deepEqual([...b.upstream].sort(), ["a", "b", "or"]);
  assert.deepEqual([...b.downstream], ["c"]);
  assert.equal(b.upstream.has("requirement"), false);
});
test("collapse and list share a visible projection; selected reports are never academic credit", () => {
  let state = workspaceReducer(initialState, { type: "catalog", catalog });
  const id = "bmcc-course-csc-211";
  const n = graph.nodes.find((n) => n.course_id === id);
  assert.equal(courseStatus(n, state), "Not selected");
  state = workspaceReducer(state, { type: "toggle", course: id });
  assert.equal(courseStatus(n, state), "Reported complete");
  const before = JSON.stringify(previewBody(state));
  const hidden = visibleMap(graph, new Set(graph.groups.map((g) => g.id)));
  assert.equal(
    hidden.nodes.every((n) => n.kind === "requirement"),
    true,
  );
  assert.equal(hidden.edges.length, 0);
  assert.equal(JSON.stringify(previewBody(state)), before);
  assert.equal(
    graph.edges.some((e) => e.relation === "prerequisite"),
    false,
  );
});
test("chat maps route only supported names/courses and preserve canonical context", () => {
  const target = mapIntent("Show Computer Science degree map");
  assert.deepEqual(target, { program: "bmcc-program-cs-as" });
  assert.deepEqual(mapIntent("Show prerequisites for MAT 301"), {
    courseCode: "MAT 301",
    direction: "upstream",
  });
  assert.equal(mapIntent("Am I eligible to graduate?"), null);
  assert.equal(validMapTarget({ program: "../secret" }), false);
  const url = new URL(
    mapURL(
      "http://localhost/campus/bmcc?campus=bmcc&program=cs&release=draft",
      target,
    ),
    "http://localhost",
  );
  assert.equal(url.searchParams.get("release"), "draft");
  assert.equal(url.searchParams.get("program"), "cs");
  assert.deepEqual(readMapTarget(url.search), target);
});

test("malformed graph payloads fail closed without crashing", () => {
  for (const v of [
    null,
    {},
    { nodes: "oops", edges: [], groups: [] },
    { ...graph, edges: [null] },
    { ...graph, nodes: [null] },
  ])
    assert.equal(validMap(v, catalog), false);
});

test("student explanations preserve exact API amounts without leaking identifiers", () => {
  assert.equal(
    studentReason("eligible_credits:3.00000000000000000000100;minimum:3"),
    "3.00000000000000000000100 allocated credits toward a 3 credit minimum.",
  );
  assert.doesNotMatch(
    studentReason("missing_course:bmcc-course-mat-301"),
    /bmcc-course/,
  );
});

test("single-course display compression preserves source data and requirement identity", () => {
  const before = JSON.stringify(graph);
  const compact = compactMap(visibleMap(graph, new Set()));
  assert.ok(compact.nodes.length < graph.nodes.length);
  assert.equal(
    compact.nodes.find((n) => n.course_id === "bmcc-course-csc-211")
      .requirement_id,
    "csc-211",
  );
  assert.equal(JSON.stringify(graph), before);
});
