import type { ModuleId } from "./types.ts";
export type ContextInput = "campus" | "program" | "year" | "release" | "selections" | "allocations";
export type ModuleAction = "navigate" | "select" | "allocate" | "browse" | "evaluate-hypothetical";
export type ModuleDefinition = {
  id: ModuleId;
  name: string;
  description: string;
  target: string;
  availability: "active" | "limited" | "future";
  context: readonly ContextInput[];
  actions: readonly ModuleAction[];
};
export const modules: readonly ModuleDefinition[] = [
  {
    id: "chat",
    name: "Chat Workspace",
    description: "Start here. Find a module with supported local prompts.",
    target: "#chat",
    availability: "active",
    context: [],
    actions: ["navigate"],
  },
  {
    id: "completed",
    name: "Completed Courses",
    description:
      "Explore hypothetical completed courses in four academic columns.",
    target: "#completed",
    availability: "active",
    context: ["release", "selections"],
    actions: ["select", "allocate"],
  },
  {
    id: "catalog",
    name: "Academic Catalog",
    description:
      "Browse persisted draft courses, requirements and source evidence.",
    target: "#catalog",
    availability: "active",
    context: ["campus", "program", "year", "release"],
    actions: ["browse"],
  },
  {
    id: "progress",
    name: "Degree Progress",
    description:
      "Limited deterministic preview. A complete audit is not available.",
    target: "#progress",
    availability: "limited",
    context: ["release", "selections", "allocations"],
    actions: ["evaluate-hypothetical"],
  },
  {
    id: "planner",
    name: "Semester Planner",
    description: "Future module. No planning or registration available.",
    target: "#planner",
    availability: "future",
    context: [],
    actions: [],
  },
  {
    id: "transcripts",
    name: "Transcript Review",
    description: "Future module. Do not upload or enter real student records.",
    target: "#transcripts",
    availability: "future",
    context: [],
    actions: [],
  },
  {
    id: "advisors",
    name: "Advisor Tools",
    description: "Future module. No reports or advisor handoff available.",
    target: "#advisors",
    availability: "future",
    context: [],
    actions: [],
  },
];
export function moduleFromHash(hash: string): ModuleId {
  return modules.find((item) => item.target === hash)?.id ?? "chat";
}
export function programName(id: string): string {
  return (
    {
      "bmcc-program-cs-as": "Computer Science A.S.",
      "bmcc-program-cis-aas": "Computer Information Systems A.A.S. (partial)",
    }[id] ?? id
  );
}
export type Guidance = { text: string; actions: ModuleId[] };
const intents: Record<string, Guidance> = {
  "show me the academic programs": {
    text: "Open the catalog to choose from the persisted program releases. No catalog year is selected automatically.",
    actions: ["catalog"],
  },
  "open completed courses": {
    text: "Use Completed Courses to explore a hypothetical selection. A checkbox is not an official completion record.",
    actions: ["completed"],
  },
  "i want to review my degree requirements": {
    text: "Browse requirements or run the limited progress preview with explicit hypothetical allocations.",
    actions: ["catalog", "progress"],
  },
  "show the computer science catalog": {
    text: "Open Academic Catalog and explicitly choose Computer Science A.S. and a release. Context will not change without your selection.",
    actions: ["catalog"],
  },
};
export const suggestedPrompts = Object.keys(intents);
export function guidance(input: string): Guidance {
  return (
    intents[
      input
        .trim()
        .toLowerCase()
        .replace(/[.!?]+$/, "")
    ] ?? {
      text: "Live AI advising is not available yet. This local prompt router only supports the listed navigation prompts; it cannot answer academic questions or interpret personal information. Try a supported module.",
      actions: ["catalog", "completed", "progress"],
    }
  );
}
