import { hasAcademicTools } from "./campuses.ts";
import { factAt } from "./profile.ts";
import type { AdvisingState, FactKey, Goal } from "./profile.ts";
import type { ModuleId } from "../workspace/types.ts";
export const goalLabels: Record<Goal, string> = {
  explore_programs: "Explore academic programs",
  next_semester: "Plan next semester",
  degree_pathway: "Plan a degree pathway",
  prerequisites: "Understand course prerequisites",
  transfer: "Transfer to another college",
  change_program: "Change major or program",
  return_college: "Return to college",
  advisor_meeting: "Prepare for an advisor meeting",
};
export const questions: Record<FactKey, string> = {
  relationship: "How would you describe your connection to this campus?",
  currentInstitution: "Where are you currently studying?",
  previousInstitutions: "Where have you studied before?",
  currentProgram: "What program are you studying now?",
  intendedProgram: "What program are you considering?",
  completedCourses: "Which classes have you already finished?",
  inProgressCourses: "Which classes are you taking now?",
  plannedCourses: "Which classes are you considering for later?",
  otherCredits: "Do you have other reported credits to discuss?",
  placement: "Is there placement or exemption information to discuss?",
  programStart: "About when did you start this program?",
  academicContext:
    "Which program requirements should we explore for this fictional scenario?",
  targetTerm: "Which semester are you thinking about?",
  courseLoad: "About how many courses would you like to take?",
  studyIntensity: "Would full-time or part-time study suit you?",
  schedule: "Are there times you need to keep free?",
  modality: "How would you prefer to take classes?",
  pace: "Would you prefer a faster or more balanced pace?",
  destination: "Which college are you considering transferring to?",
  targetCourse: "Which course would you like to understand?",
  interest: "What subjects would you like to explore?",
};
const requirements: Record<Goal, FactKey[]> = {
  explore_programs: [],
  next_semester: [
    "currentInstitution",
    "currentProgram",
    "completedCourses",
    "inProgressCourses",
    "targetTerm",
    "courseLoad",
    "academicContext",
  ],
  degree_pathway: [
    "currentInstitution",
    "currentProgram",
    "completedCourses",
    "inProgressCourses",
    "academicContext",
  ],
  prerequisites: ["targetCourse", "completedCourses", "inProgressCourses"],
  transfer: ["currentInstitution", "destination", "completedCourses"],
  change_program: [
    "currentInstitution",
    "currentProgram",
    "intendedProgram",
    "completedCourses",
  ],
  return_college: ["previousInstitutions", "intendedProgram"],
  advisor_meeting: ["currentInstitution", "currentProgram"],
};
const optional: Record<Goal, FactKey[]> = {
  explore_programs: ["interest"],
  next_semester: [
    "studyIntensity",
    "schedule",
    "modality",
    "pace",
    "placement",
  ],
  degree_pathway: ["targetTerm", "courseLoad", "pace"],
  prerequisites: ["academicContext", "placement"],
  transfer: ["intendedProgram", "inProgressCourses", "otherCredits"],
  change_program: ["academicContext", "inProgressCourses"],
  return_college: ["completedCourses", "targetTerm"],
  advisor_meeting: ["completedCourses", "otherCredits"],
};
export type Readiness = {
  level:
    "conversation_ready" | "module_ready" | "planning_ready" | "handoff_ready";
  requiredFacts: FactKey[];
  optionalFacts: FactKey[];
  missingFacts: FactKey[];
  blockingUncertainties: string[];
  nextQuestion: { key: FactKey; text: string } | null;
  safeActions: ModuleId[];
  humanReview: string[];
  goalImplemented: boolean;
};
/** Information readiness, never academic eligibility, institutional approval or a planner. */
export function readiness(state: AdvisingState): Readiness {
  const goal = state.session.primaryGoal;
  const required = goal ? requirements[goal] : [];
  const missing = required.filter(
    (key) => factAt(state, key).state === "unknown",
  );
  const blocks: string[] = [];
  for (const key of required) {
    const fact = factAt(state, key);
    if (fact.state === "conflicting")
      blocks.push(`Conflicting information: ${questions[key]}`);
    if (
      fact.state === "not_applicable" &&
      !["completedCourses", "inProgressCourses"].includes(key)
    )
      blocks.push(
        `Not applicable answer needs human review: ${questions[key]}`,
      );
  }
  const context = state.profile.academicContext;
  if (
    required.includes("academicContext") &&
    (context.state !== "known" ||
      context.value.applicability === "unresolved" ||
      context.value.campusId !== state.session.assistantCampusId)
  )
    blocks.push(
      "Catalog applicability remains unresolved; a start date never assigns a catalog automatically.",
    );
  if (
    ["next_semester", "degree_pathway"].includes(goal ?? "") &&
    state.profile.currentInstitution.state === "known" &&
    state.profile.currentInstitution.value !== state.session.assistantCampusId
  )
    blocks.push(
      "Current institution differs from this assistant. Its catalog cannot establish requirements for your current institution.",
    );
  if (
    state.profile.currentProgram.state === "known" &&
    state.profile.currentInstitution.state === "known" &&
    state.profile.currentProgram.value.institutionId !==
      state.profile.currentInstitution.value
  )
    blocks.push(
      "Current program and institution disagree; clarify before using academic context.",
    );
  const pilot = hasAcademicTools(state.session.assistantCampusId);
  if (!pilot)
    blocks.push(
      "This campus assistant is unavailable; no campus academic tools are enabled.",
    );
  const implemented = goal === "explore_programs"; // catalog exploration only; no planners or actual handoff.
  const handoff = goal === "advisor_meeting";
  const complete = !!goal && missing.length === 0 && blocks.length === 0;
  const unanswered = missing.filter((key) => {
    const fact = factAt(state, key);
    return fact.state !== "unknown" || !fact.acknowledged;
  });
  for (const key of missing) {
    const fact = factAt(state, key);
    if (fact.state === "unknown" && fact.acknowledged)
      blocks.push(`Explicitly unknown: ${questions[key]}`);
  }
  let next = unanswered[0];
  if (
    next === "academicContext" &&
    state.profile.programStart.state === "unknown" &&
    !state.profile.programStart.acknowledged
  )
    next = "programStart";
  const unresolvedContext =
    required.includes("academicContext") &&
    context.state === "known" &&
    context.value.applicability === "unresolved";
  if (
    !next &&
    unresolvedContext &&
    state.profile.programStart.state === "unknown" &&
    !state.profile.programStart.acknowledged
  )
    next = "programStart";
  return {
    level:
      !pilot || !goal
        ? "conversation_ready"
        : !complete
          ? "conversation_ready"
          : implemented || goal === "prerequisites"
            ? "module_ready"
            : handoff
              ? "handoff_ready"
              : "planning_ready",
    requiredFacts: required,
    optionalFacts: goal ? optional[goal] : [],
    missingFacts: missing,
    blockingUncertainties: blocks,
    nextQuestion: next ? { key: next, text: questions[next] } : null,
    safeActions: pilot ? ["catalog", "completed", "progress"] : [],
    humanReview: [
      "Prototype facts are fictional and student-reported, not institution-verified.",
      ...(goal === "prerequisites"
        ? [
            "Minimum-grade, placement and other unsupported prerequisite conditions remain conditional or unresolved. Grades are not globally required.",
          ]
        : []),
      ...(!implemented && goal
        ? [
            "This goal's full service is not implemented. Readiness describes information only, not a plan, equivalence or report.",
          ]
        : []),
    ],
    goalImplemented: implemented && pilot,
  };
}
