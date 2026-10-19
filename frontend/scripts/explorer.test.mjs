import test from "node:test";
import assert from "node:assert/strict";
import {
  explorerIntent,
  explorerURL,
  readExplorer,
  validTarget,
} from "../src/lib/catalog/navigation.ts";
import {
  demonstration,
  trace,
  realCourseGraph,
} from "../src/lib/catalog/pathways.ts";
test("explorer deep links preserve independent audit context and round trip bounded destinations", () => {
  for (const target of [
    { view: "departments", department: "MATH-BMC" },
    { view: "programs", program: "cs-as" },
    { view: "courses", course: "MAT301", q: "math & science", offset: 20 },
    { view: "pathways", course: "MAT301" },
    { view: "pathways", demo: true },
  ]) {
    const url = new URL(
      explorerURL(
        "https://local/campus/bmcc?campus=bmcc&program=audit-cs&release=r2#chat",
        target,
      ),
      "https://local",
    );
    assert.equal(url.searchParams.get("program"), "audit-cs");
    assert.equal(url.searchParams.get("release"), "r2");
    assert.equal(url.hash, "#catalog");
    assert.deepEqual(readExplorer(url.search), target);
  }
});
test("navigation rejects arbitrary actions, unsafe IDs, invalid offsets and unbounded text", () => {
  for (const v of [
    { view: "admin" },
    { view: "courses", course: "../secrets" },
    { view: "courses", offset: -1 },
    { view: "courses", offset: Infinity },
    { view: "courses", q: "a".repeat(121) },
    { view: "courses", url: "https://evil.test" },
  ])
    assert.equal(validTarget(v), false);
  assert.deepEqual(readExplorer("?explore=courses&course=../../secret"), {
    view: "departments",
  });
  assert.throws(() => explorerURL("/", { view: "evil" }));
});
test("local chat actions only navigate and do not interpret eligibility or arbitrary model prose", () => {
  assert.deepEqual(explorerIntent("Open course MAT 301."), {
    view: "courses",
    q: "MAT 301",
  });
  assert.deepEqual(explorerIntent("Open department MATH-BMC"), {
    view: "departments",
    department: "MATH-BMC",
  });
  assert.deepEqual(explorerIntent("Open program cs-as"), {
    view: "programs",
    program: "cs-as",
  });
  assert.deepEqual(explorerIntent("Open pathway mat301"), {
    view: "pathways",
    course: "mat301",
  });
  assert.equal(explorerIntent("Am I eligible for MAT 301?"), null);
  assert.equal(explorerIntent("open course ../../secrets"), null);
});
test("pathway highlights both directions through explicit AND and OR groups without allocating credit", () => {
  const before = JSON.stringify(demonstration);
  const branch = trace(demonstration, "methods");
  assert.deepEqual([...branch.upstream].sort(), [
    "both",
    "choice",
    "foundation",
    "lab",
    "studio",
  ]);
  assert.deepEqual([...branch.downstream], ["project"]);
  assert.equal(demonstration.nodes.find((n) => n.id === "choice").kind, "any");
  assert.equal(demonstration.nodes.find((n) => n.id === "both").kind, "all");
  assert.equal(JSON.stringify(demonstration), before);
});
test("display traversal terminates on cycles and rejects oversized or dangling graphs", () => {
  const graph = structuredClone(demonstration);
  graph.edges.push({ id: "cycle", source: "project", target: "methods" });
  assert.equal(trace(graph, "methods").downstream.has("methods"), false);
  assert.throws(() =>
    trace({ ...graph, nodes: Array(31).fill(graph.nodes[0]) }, "methods"),
  );
  assert.throws(() =>
    trace(
      {
        ...graph,
        edges: [{ id: "bad", source: "missing", target: "methods" }],
      },
      "methods",
    ),
  );
  assert.throws(() => trace(graph, "missing"));
});
test("unverified prose and course-code mentions never create real academic edges", () => {
  const g = realCourseGraph({
    id: "mat301",
    code: "MAT 301",
    title: "Calculus",
    prerequisite: { text: "MAT 206 or MAT 206.5", status: "provisional" },
  });
  assert.equal(g.kind, "catalog");
  assert.equal(g.edges.length, 0);
  assert.equal(trace(g, "mat301").upstream.size, 0);
});
