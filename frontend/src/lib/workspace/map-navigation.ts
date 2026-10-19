export type MapTarget = {
  program?: string;
  courseCode?: string;
  direction?: "both" | "upstream" | "downstream";
};
export function validMapTarget(t: MapTarget) {
  return (
    Object.keys(t).every((k) =>
      ["program", "courseCode", "direction"].includes(k),
    ) &&
    (!t.program || /^[a-zA-Z0-9_.:-]{1,160}$/.test(t.program)) &&
    (!t.courseCode ||
      /^[A-Z]{2,5} \d{2,4}(?:\.\d)?[A-Z]?$/.test(t.courseCode)) &&
    (!t.direction || ["both", "upstream", "downstream"].includes(t.direction))
  );
}
export function readMapTarget(search: string): MapTarget {
  const p = new URLSearchParams(search),
    t: MapTarget = {};
  if (p.has("map_program")) t.program = p.get("map_program")!;
  if (p.has("focus_code")) t.courseCode = p.get("focus_code")!;
  if (p.has("path_direction"))
    t.direction = p.get("path_direction") as MapTarget["direction"];
  return validMapTarget(t) ? t : {};
}
export function mapURL(current: string, target: MapTarget) {
  if (!validMapTarget(target)) throw new Error("Invalid map destination");
  const u = new URL(current);
  for (const k of ["map_program", "focus_code", "path_direction"])
    u.searchParams.delete(k);
  if (target.program) u.searchParams.set("map_program", target.program);
  if (target.courseCode) u.searchParams.set("focus_code", target.courseCode);
  if (target.direction) u.searchParams.set("path_direction", target.direction);
  u.hash = "map";
  return `${u.pathname}${u.search}${u.hash}`;
}
export function mapIntent(text: string): MapTarget | null {
  const v = text.trim().replace(/[.!?]+$/, "");
  if (/^(?:open|show)(?: my| the)? degree map$/i.test(v)) return {};
  const m = v.match(
    /^(?:tell me about|show|open|explore) (?:the )?(computer science|computer information systems|CS|CIS)(?: (?:program|degree map))?$/i,
  );
  if (m)
    return {
      program: /^(?:computer science|CS)$/i.test(m[1])
        ? "bmcc-program-cs-as"
        : "bmcc-program-cis-aas",
    };
  const course = v.match(
    /^(focus(?: on)?|show prerequisites for|show downstream dependencies for) ([a-z]{2,5})\s*(\d{2,4}(?:\.\d)?[a-z]?)$/i,
  );
  if (course)
    return {
      courseCode: `${course[2].toUpperCase()} ${course[3].toUpperCase()}`,
      direction: course[1].toLowerCase().includes("prerequisites")
        ? "upstream"
        : course[1].toLowerCase().includes("downstream")
          ? "downstream"
          : "both",
    };
  return null;
}
