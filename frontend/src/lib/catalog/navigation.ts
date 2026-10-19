export const explorerViews = [
  "departments",
  "programs",
  "courses",
  "pathways",
] as const;
export type ExplorerView = (typeof explorerViews)[number];
export type ExplorerTarget = {
  view: ExplorerView;
  department?: string;
  program?: string;
  course?: string;
  edition?: string;
  demo?: boolean;
  q?: string;
  offset?: number;
};
const id = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_.:-]{1,160}$/.test(value);
export function validTarget(value: unknown): value is ExplorerTarget {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).every((k) =>
      [
        "view",
        "department",
        "program",
        "course",
        "edition",
        "demo",
        "q",
        "offset",
      ].includes(k),
    ) &&
    explorerViews.includes(v.view as ExplorerView) &&
    ["department", "program", "course", "edition"].every(
      (k) => v[k] === undefined || id(v[k]),
    ) &&
    (v.demo === undefined || typeof v.demo === "boolean") &&
    (v.q === undefined || (typeof v.q === "string" && v.q.length <= 120)) &&
    (v.offset === undefined ||
      (Number.isSafeInteger(v.offset) && Number(v.offset) >= 0))
  );
}
export function readExplorer(search: string): ExplorerTarget {
  const p = new URLSearchParams(search);
  const target: ExplorerTarget = {
    view: (p.get("explore") ?? "departments") as ExplorerView,
  };
  for (const key of ["department", "course", "edition"] as const)
    if (p.has(key)) target[key] = p.get(key)!;
  if (p.has("academic_program")) target.program = p.get("academic_program")!;
  if (p.has("search")) target.q = p.get("search")!;
  if (p.has("offset")) target.offset = Number(p.get("offset"));
  if (p.get("demo") === "pathway") target.demo = true;
  return validTarget(target) ? target : { view: "departments" };
}
export function explorerURL(current: string, target: ExplorerTarget) {
  if (!validTarget(target)) throw new Error("Unsupported explorer destination");
  const url = new URL(current, "http://localhost");
  for (const key of [
    "explore",
    "department",
    "academic_program",
    "course",
    "edition",
    "demo",
    "search",
    "offset",
  ])
    url.searchParams.delete(key);
  url.searchParams.set("explore", target.view);
  for (const key of ["department", "course", "edition"] as const)
    if (target[key]) url.searchParams.set(key, target[key]!);
  if (target.program) url.searchParams.set("academic_program", target.program);
  if (target.q) url.searchParams.set("search", target.q);
  if (target.offset) url.searchParams.set("offset", String(target.offset));
  if (target.demo) url.searchParams.set("demo", "pathway");
  url.hash = "catalog";
  return `${url.pathname}${url.search}${url.hash}`;
}
/** Exact local navigation commands, never academic interpretation or model output. */
export function explorerIntent(text: string): ExplorerTarget | null {
  const value = text.trim().replace(/[.!?]+$/, "");
  const simple: Record<string, ExplorerView> = {
    "open academic explorer": "departments",
    "explore departments": "departments",
    "explore programs": "programs",
    "browse courses": "courses",
    "show course pathways": "pathways",
  };
  const courseCode = value.match(
    /^open (?:course )?([A-Z]{2,4})\s*(\d{2,4}[A-Z]?)$/i,
  );
  if (courseCode)
    return {
      view: "courses",
      q: `${courseCode[1].toUpperCase()} ${courseCode[2].toUpperCase()}`,
    };
  if (simple[value.toLowerCase()]) return { view: simple[value.toLowerCase()] };
  for (const [pattern, view, field] of [
    [/^open department ([A-Za-z0-9_.:-]+)$/i, "departments", "department"],
    [/^open program ([A-Za-z0-9_.:-]+)$/i, "programs", "program"],
    [/^open course ([A-Za-z0-9_.:-]+)$/i, "courses", "course"],
    [/^open pathway ([A-Za-z0-9_.:-]+)$/i, "pathways", "course"],
  ] as const) {
    const m = value.match(pattern);
    if (m) {
      const target = { view, [field]: m[1] };
      return validTarget(target) ? target : null;
    }
  }
  return null;
}
