export type Snapshot = {
  snapshot_id: string;
  catalog_year: string;
  campus_id: string;
};
export type Evidence = {
  source_id: string;
  locator: string;
  catalog_year: string | null;
};
export type Source = {
  id: string;
  url: string;
  retrieved_on: string;
  catalog_year: string | null;
};
export type Department = {
  id: string;
  name: string;
  kind: string;
  prefixes: string[];
};
export type Program = {
  id: string;
  name: string;
  credential: string;
  url: string;
  catalog_year: string | null;
  relationship: string;
};
export type Rule = {
  text: string | null;
  status: string;
  raw_reference: string | null;
  expression: { op: string };
  evidence: Evidence[];
  academic_review: string;
};
export type Course = {
  id: string;
  code: string;
  source_code: string;
  title: string;
  description: string;
  credits_min: string;
  credits_max: string;
  contact_hours: string | null;
  lecture_hours: string | null;
  lab_hours: string | null;
  catalog_year: string;
  designations: string[];
  prerequisite: Rule;
  corequisite: Rule;
  minimum_grade: Rule;
  placement_permission: Rule;
  enrollment_restrictions: Rule;
  cross_listing: Rule;
  evidence: Evidence[];
};
export type CoursePage = {
  snapshot_id: string;
  catalog_year: string;
  total: number;
  offset: number;
  limit: number;
  items: Course[];
};
export async function browseGet<T>(
  path: string,
  signal: AbortSignal,
): Promise<T> {
  const r = await fetch(`/api/bmcc-catalog/${path}`, {
    cache: "no-store",
    signal,
  });
  if (!r.ok)
    throw new Error(
      "BMCC source catalog unavailable. Check the explicit local import, then retry.",
    );
  return r.json() as Promise<T>;
}
export function coursePage(input: unknown, snapshot: string): CoursePage {
  if (!input || typeof input !== "object")
    throw new Error("Invalid catalog response");
  const p = input as CoursePage;
  if (
    p.snapshot_id !== snapshot ||
    !Array.isArray(p.items) ||
    !Number.isSafeInteger(p.total) ||
    p.total < 0 ||
    typeof p.catalog_year !== "string" ||
    !Number.isSafeInteger(p.offset) ||
    !Number.isSafeInteger(p.limit)
  )
    throw new Error("Mismatched catalog response");
  for (const c of p.items) {
    if (
      typeof c.id !== "string" ||
      typeof c.code !== "string" ||
      typeof c.title !== "string" ||
      typeof c.description !== "string" ||
      c.catalog_year !== p.catalog_year ||
      ![c.credits_min, c.credits_max].every(
        (v) => typeof v === "string" && /^\d+(\.\d+)?$/.test(v),
      ) ||
      !Array.isArray(c.evidence) ||
      !Array.isArray(c.designations)
    )
      throw new Error("Invalid course response");
    for (const rule of [
      c.prerequisite,
      c.corequisite,
      c.minimum_grade,
      c.placement_permission,
      c.enrollment_restrictions,
      c.cross_listing,
    ])
      if (
        !rule ||
        !rule.expression ||
        typeof rule.expression.op !== "string" ||
        typeof rule.status !== "string" ||
        !Array.isArray(rule.evidence) ||
        !(rule.text === null || typeof rule.text === "string")
      )
        throw new Error("Invalid rule evidence");
  }
  return p;
}
