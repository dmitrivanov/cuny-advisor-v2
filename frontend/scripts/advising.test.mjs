import { test } from "node:test";
import assert from "node:assert/strict";
import fixture from "../tests/fixtures/institutions.json" with { type: "json" };
import { decodeRegistry } from "../src/lib/advising/campuses.ts";
const campuses = decodeRegistry(fixture);
import { hasAcademicTools } from "../src/lib/advising/campuses.ts";
import {
  initialAdvising,
  applyUpdate,
  reported,
  switchCampus,
  setGoal,
  setSecondaryGoals,
  validateUpdate,
} from "../src/lib/advising/profile.ts";
import { readiness } from "../src/lib/advising/readiness.ts";
import {
  interpretBounded,
  validateProposal,
} from "../src/lib/advising/orchestration.ts";
const put = (state, key, value) =>
  applyUpdate(state, { key, fact: reported(value) }, campuses);
test("database registry projection; only BMCC pilot; choosing assistant never enrolls", () => {
  assert.equal(campuses.length, fixture.institutions.length);
  assert.deepEqual(
    campuses.filter((c) => hasAcademicTools(c.id)).map((c) => c.id),
    ["bmcc"],
  );
  const state = initialAdvising("bmcc");
  assert.equal(state.profile.currentInstitution.state, "unknown");
  assert.deepEqual(state.profile.relationships, {});
});
for (const relationship of [
  "enrolled",
  "prospective",
  "transfer",
  "returning",
  "alumnus",
  "exploring",
])
  test(`campus-neutral relationship ${relationship} never infers institution`, () => {
    let s = applyUpdate(initialAdvising("ccny"), {
      key: "relationship",
      fact: reported(relationship),
    });
    assert.equal(s.profile.relationships.ccny.value, relationship);
    assert.equal(s.profile.currentInstitution.state, "unknown");
    s = put(s, "currentInstitution", "laguardia");
    assert.equal(s.profile.currentInstitution.value, "laguardia");
    assert.equal(s.session.assistantCampusId, "ccny");
  });
test("multiple affiliations, current/intended programs and course stages remain independent", () => {
  let s = put(initialAdvising("bmcc"), "currentInstitution", "bmcc");
  s = put(s, "previousInstitutions", [
    { institutionId: "laguardia", description: "Fictional prior study" },
    { institutionId: "queensborough", description: "Fictional summer study" },
  ]);
  s = put(s, "currentProgram", {
    name: "Computer Science",
    institutionId: "bmcc",
  });
  s = put(s, "intendedProgram", {
    name: "Fictional destination program",
    institutionId: "ccny",
  });
  s = put(s, "inProgressCourses", [{ code: "MAT 301", institutionId: "bmcc" }]);
  s = put(s, "plannedCourses", [{ code: "MAT 302", institutionId: "bmcc" }]);
  assert.equal(s.profile.completedCourses.state, "unknown");
  assert.equal(s.profile.previousInstitutions.value.length, 2);
  assert.equal(s.profile.currentProgram.value.institutionId, "bmcc");
  assert.equal(s.profile.intendedProgram.value.institutionId, "ccny");
});
test("prospective student with no college history explores without scheduling or grades", () => {
  let s = put(initialAdvising("bmcc"), "currentInstitution", "not used");
  s = applyUpdate(s, {
    key: "currentInstitution",
    fact: {
      state: "not_applicable",
      reason: "Prospective, no college history",
    },
  });
  s = setGoal(s, "explore_programs");
  const r = readiness(s);
  assert.equal(r.level, "module_ready");
  assert.deepEqual(r.requiredFacts, []);
  assert.equal(r.nextQuestion, null);
  assert.ok(!r.optionalFacts.includes("schedule"));
});
test("unknown differs from explicit none and not applicable; provenance preserved", () => {
  const s = initialAdvising("bmcc");
  assert.equal(s.profile.completedCourses.state, "unknown");
  const none = put(s, "completedCourses", []);
  assert.equal(none.profile.completedCourses.state, "known");
  assert.deepEqual(none.profile.completedCourses.value, []);
  const na = applyUpdate(none, {
    key: "placement",
    fact: { state: "not_applicable", reason: "Explicit fictional response" },
  });
  assert.equal(na.profile.placement.state, "not_applicable");
  const confirmed = applyUpdate(na, {
    key: "targetTerm",
    fact: {
      state: "known",
      value: "Spring 2027",
      provenance: "student_confirmed",
    },
  });
  assert.equal(confirmed.session.targetTerm.provenance, "student_confirmed");
  assert.equal(
    confirmed.profile.completedCourses.provenance,
    "student_reported",
  );
});
test("unsafe evidence promotions, malformed facts and arbitrary keys are rejected", () => {
  const s = initialAdvising("bmcc");
  assert.equal(
    validateUpdate({
      key: "schedule",
      fact: {
        state: "conflicting",
        reason: "Malformed candidates",
        candidates: [null, null],
      },
    }),
    false,
  );
  for (const provenance of ["institution_verified", "extracted_unverified"])
    assert.equal(
      applyUpdate(s, {
        key: "currentInstitution",
        fact: { state: "known", value: "bmcc", provenance },
      }),
      s,
    );
  for (const input of [
    null,
    { key: "__proto__", fact: reported("x") },
    { key: "completedCourses", fact: reported(["MAT 301"]) },
    {
      key: "academicContext",
      fact: reported({
        campusId: "ccny",
        programId: "p",
        releaseId: "r",
        applicability: "hypothetical_confirmed",
      }),
    },
  ])
    assert.equal(applyUpdate(s, input), s);
  assert.equal(
    validateUpdate({
      key: "schedule",
      fact: {
        state: "conflicting",
        reason: "Two reports",
        candidates: [
          { value: "Morning", provenance: "student_reported" },
          { value: "Evening", provenance: "student_reported" },
        ],
      },
    }),
    true,
  );
});
test("semester readiness asks relevant facts once and never assigns catalog from program start", () => {
  let s = setGoal(initialAdvising("bmcc"), "next_semester");
  assert.equal(readiness(s).nextQuestion.key, "currentInstitution");
  s = put(s, "currentInstitution", "bmcc");
  assert.equal(readiness(s).nextQuestion.key, "currentProgram");
  s = put(s, "currentProgram", { name: "CS", institutionId: "bmcc" });
  assert.equal(readiness(s).nextQuestion.key, "completedCourses");
  s = put(s, "completedCourses", []);
  s = put(s, "inProgressCourses", []);
  s = put(s, "targetTerm", "Spring 2027");
  s = put(s, "courseLoad", "3 courses");
  assert.equal(readiness(s).nextQuestion.key, "programStart");
  s = put(s, "programStart", "Fall 2026");
  assert.equal(s.profile.academicContext.state, "unknown");
  assert.equal(readiness(s).nextQuestion.key, "academicContext");
  assert.match(
    readiness(s).blockingUncertainties.join(" "),
    /applicability remains unresolved/,
  );
  s = put(s, "academicContext", {
    campusId: "bmcc",
    programId: "p",
    releaseId: "r",
    applicability: "hypothetical_confirmed",
  });
  assert.equal(readiness(s).level, "planning_ready");
  assert.equal(readiness(s).goalImplemented, false);
  assert.equal("grade" in s.profile, false);
});
test("transfer requires destination; no equivalence or unavailable planner action", () => {
  let s = setGoal(initialAdvising("bmcc"), "transfer");
  s = put(s, "currentInstitution", "laguardia");
  assert.equal(readiness(s).nextQuestion.key, "destination");
  s = put(s, "destination", "ccny");
  s = put(s, "completedCourses", []);
  assert.equal(readiness(s).goalImplemented, false);
  assert.ok(
    readiness(s).safeActions.every((id) =>
      ["catalog", "completed", "progress"].includes(id),
    ),
  );
});
test("prerequisite information remains conditional without globally required grades", () => {
  let s = setGoal(initialAdvising("bmcc"), "prerequisites");
  s = put(s, "targetCourse", "MAT 301");
  s = put(s, "completedCourses", [{ code: "MAT 206", institutionId: "bmcc" }]);
  s = put(s, "inProgressCourses", []);
  assert.equal(readiness(s).level, "module_ready");
  assert.match(
    readiness(s).humanReview.join(" "),
    /Minimum-grade.*conditional or unresolved/,
  );
  assert.ok(!readiness(s).requiredFacts.some((key) => /grade/i.test(key)));
});
test("goal change recomputes questions and optional secondary goals are independent", () => {
  let s = setGoal(initialAdvising("bmcc"), "next_semester");
  s = setSecondaryGoals(s, ["transfer", "transfer", "next_semester"]);
  assert.deepEqual(s.session.secondaryGoals, ["transfer"]);
  s = setGoal(s, "explore_programs");
  assert.equal(readiness(s).nextQuestion, null);
  s = setGoal(s, "transfer");
  assert.deepEqual(s.session.secondaryGoals, []);
  assert.equal(readiness(s).nextQuestion.key, "currentInstitution");
});
test("known correction invalidates dependent program/catalog; never changes assistant identity", () => {
  let s = put(initialAdvising("bmcc"), "currentInstitution", "bmcc");
  s = put(s, "currentProgram", { name: "CS", institutionId: "bmcc" });
  s = put(s, "academicContext", {
    campusId: "bmcc",
    programId: "p",
    releaseId: "r",
    applicability: "hypothetical_confirmed",
  });
  const proposal = interpretBounded(
    "Actually, I'm studying at LaGuardia, not BMCC.",
    campuses,
  );
  assert.ok(validateProposal(proposal, s));
  s = applyUpdate(s, proposal.updates[0]);
  assert.equal(s.profile.currentInstitution.value, "laguardia");
  assert.equal(s.profile.currentProgram.state, "unknown");
  assert.equal(s.profile.academicContext.state, "unknown");
  assert.equal(s.session.assistantCampusId, "bmcc");
});
test("campus switching preserves educational facts but clears scoped rule/task assumptions", () => {
  let s = put(initialAdvising("bmcc"), "currentInstitution", "bmcc");
  s = applyUpdate(s, { key: "relationship", fact: reported("enrolled") });
  s = put(s, "completedCourses", [
    {
      code: "MAT 301",
      institutionId: "bmcc",
      context: {
        campusId: "bmcc",
        programId: "p",
        releaseId: "r",
        courseId: "id",
      },
    },
  ]);
  s = setGoal(s, "next_semester");
  const next = switchCampus(s, "ccny");
  assert.equal(next.profile.currentInstitution.value, "bmcc");
  assert.equal(next.profile.completedCourses.value[0].context.campusId, "bmcc");
  assert.equal(next.profile.relationships.ccny, undefined);
  assert.equal(next.profile.relationships.bmcc.value, "enrolled");
  assert.equal(next.profile.academicContext.state, "unknown");
  assert.equal(next.session.primaryGoal, null);
  assert.deepEqual(readiness(next).safeActions, []);
});
test("conflicts block readiness; a different current campus cannot inherit assistant requirements", () => {
  let s = setGoal(initialAdvising("bmcc"), "next_semester");
  s = put(s, "currentInstitution", "laguardia");
  assert.match(
    readiness(s).blockingUncertainties.join(" "),
    /differs from this assistant/,
  );
  s = applyUpdate(s, {
    key: "currentProgram",
    fact: {
      state: "conflicting",
      reason: "Two possible programs",
      candidates: [
        {
          value: { name: "A", institutionId: "laguardia" },
          provenance: "student_reported",
        },
        {
          value: { name: "B", institutionId: "laguardia" },
          provenance: "student_reported",
        },
      ],
    },
  });
  assert.ok(
    readiness(s).blockingUncertainties.some((s) => s.startsWith("Conflicting")),
  );
  assert.ok(!readiness(s).missingFacts.includes("currentProgram"));
});
test("future provider contract cannot execute tools, promote evidence or pick catalogs", () => {
  const s = initialAdvising("bmcc");
  for (const proposal of [
    null,
    {},
    { message: "x", updates: [], actions: ["planner"] },
    {
      message: "x",
      updates: [
        {
          key: "currentInstitution",
          fact: {
            state: "known",
            value: "bmcc",
            provenance: "institution_verified",
          },
        },
      ],
      actions: [],
    },
    {
      message: "x",
      updates: [
        {
          key: "academicContext",
          fact: reported({
            campusId: "bmcc",
            programId: "p",
            releaseId: "r",
            applicability: "hypothetical_confirmed",
          }),
        },
      ],
      actions: [],
    },
  ])
    assert.equal(validateProposal(proposal, s), false);
  assert.equal(interpretBounded("Can I graduate?"), null);
  assert.equal(interpretBounded("Plan next semester.").goal, "next_semester");
});

test("changing institution preserves compatible prospective transfer relationship", () => {
  let state = applyUpdate(initialAdvising("ccny"), {
    key: "relationship",
    fact: reported("transfer"),
  });
  state = put(state, "currentInstitution", "bmcc");
  assert.equal(state.profile.relationships.ccny.value, "transfer");
  state = put(state, "currentInstitution", "laguardia");
  assert.equal(state.profile.relationships.ccny.value, "transfer");
});

test("unselected landing state has no assistant or academic capabilities", () => {
  const state = initialAdvising();
  assert.equal(state.session.assistantCampusId, null);
  assert.deepEqual(readiness(state).safeActions, []);
});

test("acknowledged uncertainty stays missing but does not repeat its question", () => {
  let state = setGoal(initialAdvising("bmcc"), "next_semester");
  state = applyUpdate(state, {
    key: "currentInstitution",
    fact: {
      state: "unknown",
      reason: "Student does not know yet",
      acknowledged: true,
    },
  });
  const result = readiness(state);
  assert.ok(result.missingFacts.includes("currentInstitution"));
  assert.equal(result.nextQuestion.key, "currentProgram");
  assert.ok(
    result.blockingUncertainties.some((message) =>
      message.startsWith("Explicitly unknown"),
    ),
  );
  assert.equal(setGoal(state, null).session.primaryGoal, null);
  assert.equal(
    validateProposal(
      { message: "x", goal: null, updates: [], actions: [] },
      state,
    ),
    false,
  );
});

test("reported campus names normalize without false cross-institution readiness blockers", () => {
  let state = setGoal(initialAdvising("bmcc"), "next_semester");
  state = put(state, "currentInstitution", "BMCC");
  state = put(state, "currentProgram", {
    name: "Fictional CS",
    institutionId: "Borough of Manhattan Community College",
  });
  assert.equal(state.profile.currentInstitution.value, "bmcc");
  assert.equal(state.profile.currentProgram.value.institutionId, "bmcc");
  assert.ok(
    !readiness(state).blockingUncertainties.some((text) =>
      /differs from this assistant|program and institution disagree/.test(text),
    ),
  );
});
