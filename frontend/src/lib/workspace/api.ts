import type { Catalog, Progress, Summary, WorkspaceState } from "./types.ts";
import { previewBody } from "./state.ts";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/academic/${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    signal: init?.signal ?? AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    const message =
      response.status === 404
        ? "This release was not found in the requested campus/program. Choose an available release."
        : response.status === 422
          ? "Invalid selection or allocation. Check course identities and exact positive credit amounts."
          : "Academic information is temporarily unavailable. Please try again.";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
export const listReleases = (signal?: AbortSignal) =>
  request<Summary[]>("releases", { signal }).then((items) => {
    if (
      !Array.isArray(items) ||
      items.some(
        (item) => !item.release_id || !item.campus_id || !item.program_id,
      )
    )
      throw new Error("Invalid release-list response");
    return items;
  });
export function releasePath(
  item: Pick<Summary, "campus_id" | "program_id" | "release_id">,
) {
  return `campuses/${encodeURIComponent(item.campus_id)}/programs/${encodeURIComponent(item.program_id)}/releases/${encodeURIComponent(item.release_id)}`;
}
export const getCatalog = (item: Summary, signal?: AbortSignal) =>
  request<Catalog>(releasePath(item), { signal }).then((value) => {
    if (
      !value.release?.id ||
      !Array.isArray(value.release.courses) ||
      !Array.isArray(value.release.sources) ||
      !Array.isArray(value.columns)
    )
      throw new Error("Invalid catalog response");
    return value;
  });
export const getProgressBody = (
  item: Summary,
  body: ReturnType<typeof previewBody>,
  signal?: AbortSignal,
) =>
  request<Progress>(`${releasePath(item)}/preview`, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
export const getProgress = (item: Summary, state: WorkspaceState) =>
  getProgressBody(item, previewBody(state));
