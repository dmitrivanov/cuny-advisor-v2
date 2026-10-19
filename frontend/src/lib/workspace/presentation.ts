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

/** Display API explanations without exposing internal identities or changing outcomes. */
export function studentReason(reason: string): string {
  if (reason === "all_of") return "Combined conditions.";
  if (reason === "any_of") return "Alternative conditions.";
  if (reason.startsWith("completed:"))
    return "Selected course meets this condition under the hypothetical assumptions.";
  if (reason.startsWith("missing_course:"))
    return "A course in this condition has not been selected.";
  if (reason.startsWith("eligible_credits:")) {
    const m = reason.match(/^eligible_credits:([\d.]+);minimum:([\d.]+)$/);
    if (m) return `${m[1]} allocated credits toward a ${m[2]} credit minimum.`;
  }
  if (
    /source_|unconfirmed_catalog_year|conflicting_evidence|missing_source/.test(
      reason,
    )
  )
    return "Source or catalog-year applicability needs confirmation.";
  if (/missing_catalog_credit/.test(reason))
    return "Course credits have not been confirmed for this edition.";
  if (/bmcc-|hypothetical:|synthetic:/.test(reason))
    return "This academic condition needs further confirmation.";
  return reason.replaceAll("_", " ");
}
