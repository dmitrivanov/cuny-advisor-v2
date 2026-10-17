import type { Assignment, Catalog, ModuleId, WorkspaceState } from "./types.ts";
export const initialState: WorkspaceState = {
  active: "chat",
  catalog: null,
  selected: [],
  assignments: {},
};
export type Action =
  | { type: "navigate"; module: ModuleId }
  | { type: "reset" }
  | { type: "catalog"; catalog: Catalog }
  | { type: "toggle"; course: string }
  | { type: "assign"; course: string; value: Assignment };
export function workspaceReducer(
  state: WorkspaceState,
  action: Action,
): WorkspaceState {
  if (action.type === "navigate") return { ...state, active: action.module };
  if (action.type === "reset")
    return { ...state, catalog: null, selected: [], assignments: {} };
  if (action.type === "catalog") {
    const previous = state.catalog?.release;
    const next = action.catalog.release;
    if (
      previous &&
      previous.id === next.id &&
      previous.campus_id === next.campus_id &&
      previous.program.id === next.program.id &&
      previous.catalog_year === next.catalog_year
    )
      return { ...state, catalog: action.catalog };
    return { ...state, catalog: action.catalog, selected: [], assignments: {} };
  }
  if (
    !state.catalog?.release.courses.some(
      (course) => course.identity.id === action.course,
    )
  )
    return state;
  if (action.type === "assign")
    return state.selected.includes(action.course)
      ? {
          ...state,
          assignments: { ...state.assignments, [action.course]: action.value },
        }
      : state;
  const selected = state.selected.includes(action.course)
    ? state.selected.filter((id) => id !== action.course)
    : [...state.selected, action.course];
  const assignments = { ...state.assignments };
  delete assignments[action.course];
  return { ...state, selected, assignments };
}
export function previewBody(state: WorkspaceState) {
  return {
    hypothetical: true as const,
    selected_course_ids: state.selected,
    allocations: Object.entries(state.assignments)
      .filter(
        ([course, value]) =>
          state.selected.includes(course) && value.requirement_id,
      )
      .map(([course, value]) => ({
        requirement_id: value.requirement_id,
        completion_id: `hypothetical:${course}`,
        credits: value.credits,
      })),
  };
}
