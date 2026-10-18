import { factAt, reported, applyUpdate, setGoal } from "./profile.ts";
import { validateProposal } from "./orchestration.ts";
import type { AdvisingState, FactKey } from "./profile.ts";
import type { ConversationProposal } from "./orchestration.ts";
const fields = [
  "currentInstitution",
  "currentProgram",
  "intendedProgram",
  "completedCourses",
  "inProgressCourses",
  "plannedCourses",
  "targetTerm",
  "courseLoad",
  "studyIntensity",
  "schedule",
  "modality",
  "pace",
  "destination",
  "targetCourse",
  "interest",
] as const satisfies readonly FactKey[];
export function conversationFacts(state: AdvisingState) {
  return Object.fromEntries(
    fields.map((key) => {
      const fact = factAt(state, key);
      if (fact.state !== "known") return [key, { state: fact.state }];
      const value = Array.isArray(fact.value)
        ? fact.value.slice(0, 30).map((item) => ({
            code: item.code,
            institutionId: item.institutionId,
          }))
        : fact.value;
      return [key, { state: fact.state, value, provenance: fact.provenance }];
    }),
  );
}
export function decodeConversation(
  input: unknown,
  state: AdvisingState,
): ConversationProposal | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, unknown>;
  if (
    r.mode !== "gemini" ||
    !Array.isArray(r.updates) ||
    (r.action !== null &&
      !["catalog", "completed", "progress"].includes(r.action as string))
  )
    return null;
  const updates = [];
  for (const item of r.updates) {
    if (
      !item ||
      typeof item !== "object" ||
      !fields.includes(item.key) ||
      Object.keys(item).some((k) => !["key", "value"].includes(k))
    )
      return null;
    updates.push({ key: item.key, fact: reported(item.value) });
  }
  const proposal = {
    message: r.message,
    goal: r.goal ?? undefined,
    updates,
    actions: r.action ? [r.action] : [],
  };
  return validateProposal(proposal, state) ? proposal : null;
}
export function confirmConversation(
  state: AdvisingState,
  proposal: ConversationProposal,
  snapshot: string,
): AdvisingState {
  if (JSON.stringify(state) !== snapshot || !validateProposal(proposal, state))
    return state;
  let next = proposal.goal ? setGoal(state, proposal.goal) : state;
  const updates = [...proposal.updates].sort(
    (a, b) =>
      Number(b.key === "currentInstitution") -
      Number(a.key === "currentInstitution"),
  );
  for (const update of updates) next = applyUpdate(next, update);
  return next;
}

export function describeReported(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value))
    return (
      value.map((item) => `${item.code} (${item.institutionId})`).join(", ") ||
      "None reported"
    );
  if (
    value &&
    typeof value === "object" &&
    "name" in value &&
    "institutionId" in value
  )
    return `${value.name} (${value.institutionId})`;
  return "Unresolved";
}
export function fieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}
