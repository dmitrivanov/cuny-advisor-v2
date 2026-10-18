import test from "node:test";
import assert from "node:assert/strict";
import {
  initialAdvising,
  applyUpdate,
  reported,
} from "../src/lib/advising/profile.ts";
import { readiness } from "../src/lib/advising/readiness.ts";
import {
  decodeConversation,
  confirmConversation,
  conversationFacts,
} from "../src/lib/advising/conversation.ts";
const response = {
  mode: "gemini",
  message: "We can explore together.",
  updates: [
    { key: "currentInstitution", value: "bmcc" },
    {
      key: "currentProgram",
      value: { name: "Computer Science", institutionId: "bmcc" },
    },
  ],
  goal: "next_semester",
  action: "completed",
};
test("proposals stay pending; confirmation reuses readiness without default grades", () => {
  const state = initialAdvising("bmcc");
  const p = decodeConversation(response, state);
  assert.ok(p);
  assert.equal(state.profile.currentInstitution.state, "unknown");
  const next = confirmConversation(state, p, JSON.stringify(state));
  assert.equal(next.profile.currentProgram.value.name, "Computer Science");
  assert.equal(readiness(next).nextQuestion.key, "completedCourses");
  assert.equal(next.profile.academicContext.state, "unknown");
  assert.ok(!JSON.stringify(readiness(next).requiredFacts).includes("grade"));
});
test("correction cannot overwrite confirmed facts or apply against stale context", () => {
  let state = initialAdvising("bmcc");
  state = applyUpdate(state, {
    key: "currentInstitution",
    fact: { ...reported("laguardia"), provenance: "student_confirmed" },
  });
  const p = decodeConversation(response, state);
  assert.ok(p);
  assert.equal(state.profile.currentInstitution.value, "laguardia");
  assert.equal(confirmConversation(state, p, "stale"), state);
  const next = confirmConversation(state, p, JSON.stringify(state));
  assert.equal(next.profile.currentInstitution.value, "bmcc");
  assert.equal(next.session.assistantCampusId, "bmcc");
});
test("rejects provider academic authority, future action and institution verification", () => {
  const state = initialAdvising("bmcc");
  for (const bad of [
    { ...response, action: "planner" },
    { ...response, updates: [{ key: "academicContext", value: "approved" }] },
    {
      ...response,
      updates: [
        {
          key: "currentInstitution",
          value: "bmcc",
          provenance: "institution_verified",
        },
      ],
    },
  ])
    assert.equal(decodeConversation(bad, state), null);
});
test("history transport omits exact catalog entitlement and course context; stages remain independent", () => {
  let state = initialAdvising("bmcc");
  state = applyUpdate(state, {
    key: "inProgressCourses",
    fact: reported([
      {
        code: "MAT 301",
        institutionId: "bmcc",
        context: {
          campusId: "bmcc",
          programId: "p",
          releaseId: "r",
          courseId: "c",
        },
      },
    ]),
  });
  const facts = conversationFacts(state);
  assert.equal(facts.inProgressCourses.value[0].context, undefined);
  assert.equal(facts.completedCourses.state, "unknown");
  assert.equal(facts.academicContext, undefined);
});
