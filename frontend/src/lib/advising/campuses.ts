/** Names/types: CUNY Telephone & Email Directories, accessed 2026-10-17.
 * Availability is project capability, never institutional approval.
 */
export type Campus = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  type: "community_college" | "senior_college" | "other";
  assistantAvailability: "pilot" | "planned";
  visualPosition: { x: number; y: number };
};
export const campuses: readonly Campus[] = [
  {
    id: "bmcc",
    slug: "bmcc",
    name: "Borough of Manhattan Community College",
    shortName: "BMCC",
    type: "community_college",
    assistantAvailability: "pilot",
    visualPosition: { x: 39, y: 49 },
  },
  {
    id: "ccny",
    slug: "ccny",
    name: "The City College of New York",
    shortName: "CCNY",
    type: "senior_college",
    assistantAvailability: "planned",
    visualPosition: { x: 24, y: 20 },
  },
  {
    id: "laguardia",
    slug: "laguardia",
    name: "LaGuardia Community College",
    shortName: "LaGuardia",
    type: "community_college",
    assistantAvailability: "planned",
    visualPosition: { x: 60, y: 17 },
  },
  {
    id: "queensborough",
    slug: "queensborough",
    name: "Queensborough Community College",
    shortName: "Queensborough",
    type: "community_college",
    assistantAvailability: "planned",
    visualPosition: { x: 83, y: 37 },
  },
  {
    id: "hunter",
    slug: "hunter",
    name: "Hunter College",
    shortName: "Hunter",
    type: "senior_college",
    assistantAvailability: "planned",
    visualPosition: { x: 12, y: 53 },
  },
  {
    id: "baruch",
    slug: "baruch",
    name: "Baruch College",
    shortName: "Baruch",
    type: "senior_college",
    assistantAvailability: "planned",
    visualPosition: { x: 22, y: 82 },
  },
  {
    id: "brooklyn",
    slug: "brooklyn",
    name: "Brooklyn College",
    shortName: "Brooklyn",
    type: "senior_college",
    assistantAvailability: "planned",
    visualPosition: { x: 59, y: 81 },
  },
  {
    id: "queens",
    slug: "queens",
    name: "Queens College",
    shortName: "Queens",
    type: "senior_college",
    assistantAvailability: "planned",
    visualPosition: { x: 78, y: 65 },
  },
];
export const campusById = (id: string) =>
  campuses.find((campus) => campus.id === id);
export const campusBySlug = (slug: string) =>
  campuses.find((campus) => campus.slug === slug);
export const hasAcademicTools = (id: string | null) =>
  !!id && campusById(id)?.assistantAvailability === "pilot";
