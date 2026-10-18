import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { coursePage } from "../src/lib/catalog/api.ts";
const fixture = JSON.parse(
  readFileSync(new URL("../tests/fixtures/bmcc-browse.json", import.meta.url)),
);
test("browse projection retains exact credit strings and provisional raw prerequisites", () => {
  const p = coursePage(fixture.page, fixture.page.snapshot_id);
  const mat = p.items.find((c) => c.code === "MAT 301");
  assert.equal(mat.credits_min, "4");
  assert.equal(mat.prerequisite.status, "provisional");
  assert.equal(mat.prerequisite.expression.op, "unknown");
});
test("mixed snapshot/year, numeric credit and malformed rule responses fail closed", () => {
  for (const change of [
    (p) => (p.snapshot_id = "other"),
    (p) => (p.items[0].catalog_year = "other"),
    (p) => (p.items[0].credits_min = 4),
    (p) => (p.items[0].prerequisite = null),
  ]) {
    const p = structuredClone(fixture.page);
    change(p);
    assert.throws(() => coursePage(p, fixture.page.snapshot_id));
  }
});
