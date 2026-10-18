/** Public registry contract. No institutional dataset or availability fallback here. */
export type Category =
  | "community_college"
  | "senior_college"
  | "graduate_professional"
  | "honors_college";
export type Campus = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  type: Category;
  assistantAvailability: "pilot" | "planned";
  active: boolean;
  website: string;
  classificationNote: string;
  visualPosition: { x: number; y: number };
};
export const categoryLabels: Record<Category, string> = {
  community_college: "Community college",
  senior_college: "Senior college",
  graduate_professional: "Graduate / professional",
  honors_college: "Honors college",
};
/** Defense-in-depth operational allowlist, never a registry source or an academic approval. */
export const hasAcademicTools = (id: string | null) => id === "bmcc";
export function institutionId(
  value: string,
  campuses: readonly Campus[] = [],
): string {
  const normalized = value.trim().toLowerCase();
  return (
    campuses.find((c) =>
      [c.id, c.shortName.toLowerCase(), c.name.toLowerCase()].includes(
        normalized,
      ),
    )?.id ?? value.trim()
  );
}
export function campusById(id: string, campuses: readonly Campus[]) {
  return campuses.find((c) => c.id === id);
}
/** Layout is illustrative frontend metadata, never geographic/transfer semantics. */
export function visualPosition(
  index: number,
  total: number,
): { x: number; y: number } {
  const inner = Math.min(9, total);
  const isInner = index < inner;
  const count = isInner ? inner : total - inner;
  const n = isInner ? index : index - inner;
  const angle =
    ((-90 + (n * 360) / Math.max(1, count) + (isInner ? 12 : 0)) * Math.PI) /
    180;
  const radius = isInner ? 24 : 44;
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
}
export function decodeRegistry(input: unknown): Campus[] {
  if (input === null) return [];
  if (
    !input ||
    typeof input !== "object" ||
    !("institutions" in input) ||
    !Array.isArray(input.institutions)
  )
    throw new Error("Invalid institution registry");
  const ids = new Set<string>(),
    slugs = new Set<string>();
  let position = 0;
  const otherCount = input.institutions.filter(
    (v: unknown) => v && typeof v === "object" && "id" in v && v.id !== "bmcc",
  ).length;
  return input.institutions.map((v: unknown) => {
    if (!v || typeof v !== "object") throw new Error("Invalid institution");
    const r = v as Record<string, unknown>;
    for (const field of [
      "id",
      "slug",
      "official_name",
      "display_name",
      "website",
      "category",
      "classification_note",
      "support_status",
    ])
      if (typeof r[field] !== "string") throw new Error("Invalid institution");
    if (
      !/^[a-z][a-z0-9-]{0,79}$/.test(r.id as string) ||
      !/^[a-z][a-z0-9-]{0,79}$/.test(r.slug as string) ||
      !Object.hasOwn(categoryLabels, r.category as string) ||
      typeof r.active !== "boolean" ||
      !["pilot", "planned"].includes(r.support_status as string) ||
      ids.has(r.id as string) ||
      slugs.has(r.slug as string)
    )
      throw new Error("Invalid registry identity");
    if (r.support_status === "pilot" && !hasAcademicTools(r.id as string))
      throw new Error("Unsupported pilot");
    const website = new URL(r.website as string);
    if (
      !["http:", "https:"].includes(website.protocol) ||
      website.username ||
      website.password
    )
      throw new Error("Invalid website");
    ids.add(r.id as string);
    slugs.add(r.slug as string);
    return {
      id: r.id as string,
      slug: r.slug as string,
      name: r.official_name as string,
      shortName: r.display_name as string,
      type: r.category as Category,
      active: r.active,
      website: r.website as string,
      classificationNote: r.classification_note as string,
      assistantAvailability: r.support_status as "pilot" | "planned",
      visualPosition:
        r.id === "bmcc"
          ? { x: 50, y: 50 }
          : visualPosition(position++, otherCount),
    };
  });
}
