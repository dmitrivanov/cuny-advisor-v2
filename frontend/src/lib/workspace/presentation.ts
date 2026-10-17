import type { Catalog, Course } from "./types.ts";

// Presentation order only. Canonical backend columns and rules remain untouched.
export const selectorOrder = [
  "Major Requirements",
  "Major Electives",
  "Required Common Core",
  "Flexible Core",
] as const;
export function selectorColumns(
  columns: Catalog["columns"],
): Catalog["columns"] {
  return [...columns].sort((a, b) => {
    const rank = (title: string) => {
      const index = selectorOrder.findIndex((value) => value === title);
      return index < 0 ? selectorOrder.length : index;
    };
    return rank(a.title) - rank(b.title);
  });
}
export function courseTitle(course: Pick<Course, "title">): string {
  return !course.title.trim() ||
    /^Title not captured in this (bounded|partial) fixture$/.test(course.title)
    ? "Title not available"
    : course.title;
}
