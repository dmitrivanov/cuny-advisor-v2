import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  modules,
  guidance,
  moduleFromHash,
} from "../src/lib/workspace/registry.ts";
import {
  initialState,
  workspaceReducer,
  previewBody,
} from "../src/lib/workspace/state.ts";
import {
  listReleases,
  getCatalog,
  getProgress,
} from "../src/lib/workspace/api.ts";
afterEach(() => mock.restoreAll());
const summary = {
  campus_id: "test",
  program_id: "cs",
  release_id: "draft",
  catalog_year: "fictional",
  credential: "AS",
  revision_id: "r1",
};
const catalog = {
  release: {
    id: "draft",
    campus_id: "test",
    program: { id: "cs" },
    courses: [{ identity: { id: "mat301" } }, { identity: { id: "csc101" } }],
    sources: [],
  },
  columns: [],
};
test("default navigation is chat; future modules expose no functional actions", () => {
  assert.equal(initialState.active, "chat");
  assert.equal(moduleFromHash("#nope"), "chat");
  for (const entry of modules.filter(
    (entry) => entry.availability === "future",
  ))
    assert.equal(entry.actions.length, 0);
});
test("router supports exact documented prompts; academic questions never get fabricated advice", () => {
  assert.deepEqual(guidance(" Show me the academic programs. ").actions, [
    "catalog",
  ]);
  assert.deepEqual(guidance("Open completed courses").actions, ["completed"]);
  assert.match(
    guidance("Can I graduate with MAT 301?").text,
    /Live AI advising is not available/,
  );
});
test("chat → catalog → selector → chat → progress keeps stable unique identities", () => {
  let state = workspaceReducer(initialState, { type: "catalog", catalog });
  state = workspaceReducer(state, { type: "navigate", module: "completed" });
  for (const course of ["mat301", "csc101"])
    state = workspaceReducer(state, { type: "toggle", course });
  state = workspaceReducer(state, { type: "navigate", module: "chat" });
  state = workspaceReducer(state, { type: "navigate", module: "progress" });
  assert.deepEqual(previewBody(state).selected_course_ids, [
    "mat301",
    "csc101",
  ]);
  assert.equal(previewBody(state).allocations.length, 0);
  assert.equal(
    workspaceReducer(state, { type: "toggle", course: "invalid" }),
    state,
  );
  assert.deepEqual(
    workspaceReducer(state, { type: "toggle", course: "mat301" }).selected,
    ["csc101"],
  );
});
test("explicit allocations retain exact decimal strings; deselection and context changes invalidate them", () => {
  let state = workspaceReducer(initialState, { type: "catalog", catalog });
  state = workspaceReducer(state, { type: "toggle", course: "mat301" });
  state = workspaceReducer(state, {
    type: "assign",
    course: "mat301",
    value: { requirement_id: "math", credits: "3.00000000000000000000100" },
  });
  assert.equal(
    previewBody(state).allocations[0].credits,
    "3.00000000000000000000100",
  );
  assert.equal(
    Object.keys(
      workspaceReducer(state, { type: "toggle", course: "mat301" }).assignments,
    ).length,
    0,
  );
  assert.deepEqual(workspaceReducer(state, { type: "reset" }).selected, []);
  assert.deepEqual(
    workspaceReducer(state, {
      type: "catalog",
      catalog: {
        ...catalog,
        release: { ...catalog.release, id: "other-year" },
      },
    }).assignments,
    {},
  );
});
test("mocked API discovery/catalog/preview preserve explicit context and hypothetical request", async () => {
  const requests = [];
  mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url, init });
    return new Response(
      JSON.stringify(
        url.endsWith("releases")
          ? [summary]
          : url.endsWith("preview")
            ? { state: "unresolved", snapshot: null }
            : catalog,
      ),
      { status: 200 },
    );
  });
  assert.deepEqual(await listReleases(), [summary]);
  assert.equal((await getCatalog(summary)).release.id, "draft");
  const state = workspaceReducer(initialState, { type: "catalog", catalog });
  await getProgress(summary, state);
  assert.match(
    requests[1].url,
    /campuses\/test\/programs\/cs\/releases\/draft/,
  );
  assert.equal(JSON.parse(requests[2].init.body).hypothetical, true);
  assert.equal(requests[2].init.cache, "no-store");
});
for (const [status, phrase] of [
  [404, /not found/],
  [422, /Invalid selection/],
  [503, /temporarily unavailable/],
])
  test(`HTTP ${status} has safe actionable error`, async () => {
    mock.method(
      globalThis,
      "fetch",
      async () =>
        new Response(JSON.stringify({ detail: "private driver message" }), {
          status,
        }),
    );
    await assert.rejects(() => getCatalog(summary), phrase);
  });
test("malformed success payload is rejected", async () => {
  mock.method(globalThis, "fetch", async () => new Response("{}"));
  await assert.rejects(() => getCatalog(summary), /Invalid catalog response/);
});
test("retrying the exact immutable context preserves existing selections", () => {
  let state = workspaceReducer(initialState, { type: "catalog", catalog });
  state = workspaceReducer(state, { type: "toggle", course: "mat301" });
  assert.deepEqual(
    workspaceReducer(state, { type: "catalog", catalog }).selected,
    ["mat301"],
  );
});

test("selector presentation reorders copies without changing canonical semantics or identities", async () => {
  const { selectorColumns, selectorOrder, courseTitle } =
    await import("../src/lib/workspace/presentation.ts");
  const columns = [
    "Required Common Core",
    "Flexible Core",
    "Major Requirements",
    "Major Electives",
  ].map((title) => ({ title, groups: [{ requirement_id: title }] }));
  const before = JSON.stringify(columns);
  const displayed = selectorColumns(columns);
  assert.deepEqual(
    displayed.map((column) => column.title),
    selectorOrder,
  );
  assert.equal(JSON.stringify(columns), before);
  for (const column of displayed)
    assert.equal(
      column,
      columns.find((item) => item.title === column.title),
    );
  assert.equal(
    courseTitle({ title: "Title not captured in this bounded fixture" }),
    "Title not available",
  );
  assert.equal(
    courseTitle({ title: "Title not captured in this partial fixture" }),
    "Title not available",
  );
  assert.equal(
    courseTitle({ title: "Analytic Geometry and Calculus I" }),
    "Analytic Geometry and Calculus I",
  );
});
