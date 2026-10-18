import test from "node:test";
import assert from "node:assert/strict";
import fixture from "../tests/fixtures/institutions.json" with { type: "json" };
import {
  decodeRegistry,
  institutionId,
  categoryLabels,
} from "../src/lib/advising/campuses.ts";
test("API projection is complete and categories, URLs and pilot status originate in response", () => {
  const campuses = decodeRegistry(fixture);
  assert.equal(campuses.length, fixture.institutions.length);
  assert.equal(
    new Set(campuses.map((c) => c.type)).size,
    Object.keys(categoryLabels).length,
  );
  assert.equal(
    campuses.find((c) => c.id === "medicine").type,
    "graduate_professional",
  );
  assert.equal(
    campuses.find((c) => c.id === "macaulay").type,
    "honors_college",
  );
  assert.deepEqual(
    campuses
      .filter((c) => c.assistantAvailability === "pilot")
      .map((c) => c.id),
    ["bmcc"],
  );
  assert.equal(institutionId("LaGuardia", campuses), "laguardia");
  assert.equal(institutionId("City Tech", campuses), "city-tech");
});
test("empty registry is empty, bad payload fails closed without fabricated campuses", () => {
  assert.deepEqual(decodeRegistry(null), []);
  assert.deepEqual(decodeRegistry({ ...fixture, institutions: [] }), []);
  for (const value of [
    { error: "unavailable" },
    {
      ...fixture,
      institutions: [{ ...fixture.institutions[0], category: "admin_office" }],
    },
    {
      ...fixture,
      institutions: [fixture.institutions[0], fixture.institutions[0]],
    },
    {
      ...fixture,
      institutions: [{ ...fixture.institutions[0], support_status: "pilot" }],
    },
    {
      ...fixture,
      institutions: [
        { ...fixture.institutions[0], website: "javascript:alert(1)" },
      ],
    },
  ])
    assert.throws(() => decodeRegistry(value));
});
