export type ModuleId =
  | "chat"
  | "completed"
  | "catalog"
  | "progress"
  | "planner"
  | "transcripts"
  | "advisors";
export type Summary = {
  campus_id: string;
  program_id: string;
  release_id: string;
  catalog_year: string;
  credential: string;
  revision_id: string;
};
export type Source = {
  id: string;
  url: string | null;
  section: string;
  state: string;
  note: string;
  year_confirmed: boolean;
  retrieved_on: string;
  conflicts_with: string[];
  academic_review: string;
};
export type RuleExpression =
  | { op: "completed"; course_id: string; minimum_grade_rank: number | null }
  | { op: "all" | "any"; children: RuleExpression[] }
  | { op: "credits"; eligible: string[]; minimum: string }
  | { op: "discipline_cap"; maximum: number }
  | { op: "unknown"; reason: string }
  | { op: "no_conditions" };
export type Course = {
  identity: { id: string; campus_id: string };
  version_id: string;
  prerequisite?: { expression: RuleExpression } | null;
  corequisite?: { expression: RuleExpression } | null;
  code: string;
  title: string;
  credits: string | null;
  source_ids: string[];
};
export type Group = {
  requirement_id: string;
  label: string;
  kind: string;
  target_credits: string | null;
  condition_label: string;
  course_ids: string[];
};
export type Catalog = {
  release: {
    id: string;
    campus_id: string;
    catalog_year: string;
    program: { id: string };
    credential: string;
    state: string;
    courses: Course[];
    requirements: { id: string; label: string }[];
    sources: Source[];
    issues: string[];
  };
  columns: { title: string; groups: Group[] }[];
  limitation: string;
};
export type Result = {
  status: "met" | "unmet" | "unresolved";
  reason: string;
  children: Result[];
  source_ids?: string[];
};
export type Progress = {
  state: "preview" | "unresolved";
  limitation: string;
  issues: string[];
  prerequisites: { course_id: string; prerequisite: Result }[];
  snapshot: null | {
    engine_version: string;
    release: { id: string };
    degree_status: "unresolved";
    earned_credits: string;
    allocated_credits: string;
    issues: string[];
    results: { requirement_id: string; kind: string; result: Result }[];
    constraints: Result[];
  };
};
export type Assignment = { requirement_id: string; credits: string };
export type WorkspaceState = {
  active: ModuleId;
  catalog: Catalog | null;
  selected: string[];
  assignments: Record<string, Assignment>;
};
