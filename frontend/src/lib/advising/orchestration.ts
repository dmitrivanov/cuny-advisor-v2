import { campuses, hasAcademicTools } from "./campuses.ts";
import { reported, validateUpdate } from "./profile.ts";
import { goalLabels } from "./readiness.ts";
import type { AdvisingState, Goal, ProfileUpdate } from "./profile.ts";
import type { ModuleId } from "../workspace/types.ts";
/** Future provider proposal, not an executor. Every update/capability is revalidated. */
export type ConversationProposal = {
  message: string;
  goal?: Goal;
  updates: ProfileUpdate[];
  actions: ModuleId[];
};
export interface FutureAdvisingInterpreter {
  propose(input: {
    text: string;
    assistantCampusId: string;
  }): Promise<ConversationProposal>;
}
export function validateProposal(
  input: unknown,
  state: AdvisingState,
): input is ConversationProposal {
  if (!input || typeof input !== "object") return false;
  const value = input as ConversationProposal;
  return (
    typeof value.message === "string" &&
    value.message.length <= 1200 &&
    (value.goal === undefined ||
      (typeof value.goal === "string" &&
        Object.hasOwn(goalLabels, value.goal))) &&
    Array.isArray(value.updates) &&
    value.updates.length <= 8 &&
    value.updates.every(
      (update) => validateUpdate(update) && update.key !== "academicContext",
    ) &&
    Array.isArray(value.actions) &&
    value.actions.length <= 3 &&
    value.actions.every(
      (id) =>
        hasAcademicTools(state.session.assistantCampusId) &&
        ["catalog", "completed", "progress"].includes(id),
    )
  );
}
export function interpretBounded(text: string): ConversationProposal | null {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/, "");
  const goal = (Object.keys(goalLabels) as Goal[]).find(
    (goal) => goalLabels[goal].toLowerCase() === normalized,
  );
  if (goal)
    return {
      message: `Let's prepare for: ${goalLabels[goal].toLowerCase()}. I'll ask only for relevant fictional information. This prototype does not create plans, transfer equivalencies or reports.`,
      goal,
      updates: [],
      actions: goal === "explore_programs" ? ["catalog"] : [],
    };
  const correction = normalized.match(
    /^actually,? i['’]m studying at (.+), not (.+)$/,
  );
  if (correction) {
    const campus = campuses.find((c) =>
      [c.shortName.toLowerCase(), c.name.toLowerCase(), c.id].includes(
        correction[1],
      ),
    );
    if (campus)
      return {
        message: `Updated your reported current institution to ${campus.shortName}. Your selected assistant is unchanged. Program and catalog assumptions need reconfirmation.`,
        updates: [{ key: "currentInstitution", fact: reported(campus.id) }],
        actions: [],
      };
  }
  return null;
}
