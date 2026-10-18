import { institutionId } from "./campuses.ts";
import type { Campus } from "./campuses.ts";
export type Provenance =
  | "student_reported"
  | "student_confirmed"
  | "extracted_unverified"
  | "institution_verified";
export type Fact<T> =
  | { state: "known"; value: T; provenance: Provenance }
  | {
      state: "unknown" | "not_applicable";
      reason: string;
      acknowledged?: boolean;
    }
  | {
      state: "conflicting";
      reason: string;
      candidates: { value: T; provenance: Provenance }[];
    };
export const unknown = <T>(reason = "Not provided"): Fact<T> => ({
  state: "unknown",
  reason,
});
export const reported = <T>(value: T): Fact<T> => ({
  state: "known",
  value,
  provenance: "student_reported",
});
export type Relationship =
  | "enrolled"
  | "prospective"
  | "transfer"
  | "returning"
  | "alumnus"
  | "exploring";
export type Goal =
  | "explore_programs"
  | "next_semester"
  | "degree_pathway"
  | "prerequisites"
  | "transfer"
  | "change_program"
  | "return_college"
  | "advisor_meeting";
export type CourseHistory = {
  code: string;
  institutionId: string;
  context?: {
    campusId: string;
    programId: string;
    releaseId: string;
    courseId: string;
  };
};
export type Program = { name: string; institutionId: string };
export type Education = { institutionId: string; description: string };
export type AcademicContext = {
  campusId: string;
  programId: string;
  releaseId: string;
  applicability: "unresolved" | "hypothetical_confirmed";
};
export type StudentProfile = {
  relationships: Record<string, Fact<Relationship>>;
  currentInstitution: Fact<string>;
  previousInstitutions: Fact<Education[]>;
  currentProgram: Fact<Program>;
  intendedProgram: Fact<Program>;
  completedCourses: Fact<CourseHistory[]>;
  inProgressCourses: Fact<CourseHistory[]>;
  plannedCourses: Fact<CourseHistory[]>;
  otherCredits: Fact<string>;
  placement: Fact<string>;
  programStart: Fact<string>;
  academicContext: Fact<AcademicContext>;
};
export type AdvisingSession = {
  assistantCampusId: string | null;
  primaryGoal: Goal | null;
  secondaryGoals: Goal[];
  targetTerm: Fact<string>;
  courseLoad: Fact<string>;
  studyIntensity: Fact<string>;
  schedule: Fact<string>;
  modality: Fact<string>;
  pace: Fact<string>;
  destination: Fact<string>;
  targetCourse: Fact<string>;
  interest: Fact<string>;
};
export type AdvisingState = {
  profile: StudentProfile;
  session: AdvisingSession;
};
export function initialAdvising(campusId: string | null = null): AdvisingState {
  return {
    profile: {
      relationships: {},
      currentInstitution: unknown(),
      previousInstitutions: unknown(),
      currentProgram: unknown(),
      intendedProgram: unknown(),
      completedCourses: unknown(),
      inProgressCourses: unknown(),
      plannedCourses: unknown(),
      otherCredits: unknown(),
      placement: unknown(),
      programStart: unknown(),
      academicContext: unknown("No applicable catalog established"),
    },
    session: {
      assistantCampusId: campusId,
      primaryGoal: null,
      secondaryGoals: [],
      targetTerm: unknown(),
      courseLoad: unknown(),
      studyIntensity: unknown(),
      schedule: unknown(),
      modality: unknown(),
      pace: unknown(),
      destination: unknown(),
      targetCourse: unknown(),
      interest: unknown(),
    },
  };
}
export type ProfileField = Exclude<keyof StudentProfile, "relationships">;
export type SessionField = Exclude<
  keyof AdvisingSession,
  "assistantCampusId" | "primaryGoal" | "secondaryGoals"
>;
export type FactKey = ProfileField | SessionField | "relationship";
export type ProfileUpdate = { key: FactKey; fact: Fact<unknown> };
const profileKeys: readonly string[] = [
  "currentInstitution",
  "previousInstitutions",
  "currentProgram",
  "intendedProgram",
  "completedCourses",
  "inProgressCourses",
  "plannedCourses",
  "otherCredits",
  "placement",
  "programStart",
  "academicContext",
];
const sessionKeys: readonly string[] = [
  "targetTerm",
  "courseLoad",
  "studyIntensity",
  "schedule",
  "modality",
  "pace",
  "destination",
  "targetCourse",
  "interest",
];
export const relationships: readonly Relationship[] = [
  "enrolled",
  "prospective",
  "transfer",
  "returning",
  "alumnus",
  "exploring",
];
export const goals: readonly Goal[] = [
  "explore_programs",
  "next_semester",
  "degree_pathway",
  "prerequisites",
  "transfer",
  "change_program",
  "return_college",
  "advisor_meeting",
];
export function factAt(state: AdvisingState, key: FactKey): Fact<unknown> {
  if (key === "relationship")
    return (
      state.profile.relationships[state.session.assistantCampusId ?? ""] ??
      unknown("No campus-relative relationship provided")
    );
  return key in state.profile
    ? state.profile[key as ProfileField]
    : state.session[key as SessionField];
}
const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 240;
function validValue(key: FactKey, value: unknown): boolean {
  if (key === "relationship")
    return relationships.includes(value as Relationship);
  if (["completedCourses", "inProgressCourses", "plannedCourses"].includes(key))
    return (
      Array.isArray(value) &&
      value.length <= 100 &&
      value.every(
        (item) =>
          item &&
          text(item.code) &&
          text(item.institutionId) &&
          (!item.context ||
            [
              item.context.campusId,
              item.context.programId,
              item.context.releaseId,
              item.context.courseId,
            ].every(text)),
      )
    );
  if (key === "previousInstitutions")
    return (
      Array.isArray(value) &&
      value.length <= 20 &&
      value.every(
        (item) => item && text(item.institutionId) && text(item.description),
      )
    );
  if (key === "currentProgram" || key === "intendedProgram")
    return (
      !!value &&
      typeof value === "object" &&
      text((value as Program).name) &&
      text((value as Program).institutionId)
    );
  if (key === "academicContext") {
    const c = value as AcademicContext;
    return (
      !!c &&
      [c.campusId, c.programId, c.releaseId].every(text) &&
      ["unresolved", "hypothetical_confirmed"].includes(c.applicability)
    );
  }
  return text(value);
}
/** The UI/future proposal boundary never accepts verified/extracted evidence promotions. */
export function validateUpdate(input: unknown): input is ProfileUpdate {
  if (!input || typeof input !== "object") return false;
  const { key, fact } = input as ProfileUpdate;
  if (
    ![...profileKeys, ...sessionKeys, "relationship"].includes(key) ||
    !fact ||
    typeof fact !== "object"
  )
    return false;
  if (fact.state === "known")
    return (
      ["student_reported", "student_confirmed"].includes(fact.provenance) &&
      validValue(key, fact.value)
    );
  if (fact.state === "unknown" || fact.state === "not_applicable")
    return (
      text(fact.reason) &&
      (fact.acknowledged === undefined ||
        typeof fact.acknowledged === "boolean")
    );
  return (
    fact.state === "conflicting" &&
    text(fact.reason) &&
    Array.isArray(fact.candidates) &&
    fact.candidates.length >= 2 &&
    fact.candidates.length <= 10 &&
    fact.candidates.every(
      (c) =>
        !!c &&
        typeof c === "object" &&
        ["student_reported", "student_confirmed"].includes(c.provenance) &&
        validValue(key, c.value),
    )
  );
}
export function applyUpdate(
  state: AdvisingState,
  input: unknown,
  campuses: readonly Campus[] = [],
): AdvisingState {
  if (!validateUpdate(input)) return state;
  const { key } = input;
  let fact = input.fact;
  const institution = (value: string) => institutionId(value, campuses);
  if (fact.state === "known") {
    if (key === "currentInstitution" || key === "destination")
      fact = { ...fact, value: institution(fact.value as string) };
    if (key === "currentProgram" || key === "intendedProgram")
      fact = {
        ...fact,
        value: {
          ...(fact.value as Program),
          institutionId: institution((fact.value as Program).institutionId),
        },
      };
  }
  if (
    key === "academicContext" &&
    fact.state === "known" &&
    (fact.value as AcademicContext).campusId !== state.session.assistantCampusId
  )
    return state;
  if (key === "relationship") {
    if (!state.session.assistantCampusId) return state;
    return {
      ...state,
      profile: {
        ...state.profile,
        relationships: {
          ...state.profile.relationships,
          [state.session.assistantCampusId]: fact as Fact<Relationship>,
        },
      },
    };
  }
  if (profileKeys.includes(key)) {
    const profile = { ...state.profile, [key]: fact };
    if (["currentInstitution", "currentProgram", "programStart"].includes(key))
      profile.academicContext = unknown(
        "Enrollment/program correction requires catalog review",
      );
    if (key === "currentInstitution") {
      profile.currentProgram = unknown(
        "Institution changed; program needs reconfirmation",
      );
      const relation =
        profile.relationships[state.session.assistantCampusId ?? ""];
      if (
        state.session.assistantCampusId &&
        relation?.state === "known" &&
        relation.value === "enrolled" &&
        fact.state === "known" &&
        fact.value !== state.session.assistantCampusId
      )
        profile.relationships = {
          ...profile.relationships,
          [state.session.assistantCampusId]: unknown(
            "Reported enrollment changed; relationship needs reconfirmation",
          ),
        };
    }
    return { ...state, profile };
  }
  return { ...state, session: { ...state.session, [key]: fact } };
}
export function switchCampus(
  state: AdvisingState,
  campusId: string,
): AdvisingState {
  if (state.session.assistantCampusId === campusId) return state;
  // Retain educational history, not the old assistant's rules or task assumptions.
  const next = initialAdvising(campusId);
  return {
    profile: {
      ...state.profile,
      academicContext: unknown(
        "Assistant campus changed; catalog context cleared",
      ),
    },
    session: next.session,
  };
}
export function setGoal(
  state: AdvisingState,
  goal: Goal | null,
): AdvisingState {
  return goal === null || goals.includes(goal)
    ? {
        ...state,
        session: {
          ...state.session,
          primaryGoal: goal,
          secondaryGoals: state.session.secondaryGoals.filter(
            (item) => item !== goal,
          ),
        },
      }
    : state;
}

export function setSecondaryGoals(
  state: AdvisingState,
  values: Goal[],
): AdvisingState {
  if (!Array.isArray(values) || values.some((goal) => !goals.includes(goal)))
    return state;
  return {
    ...state,
    session: {
      ...state.session,
      secondaryGoals: [...new Set(values)].filter(
        (goal) => goal !== state.session.primaryGoal,
      ),
    },
  };
}
