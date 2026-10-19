import type { Catalog, WorkspaceState } from "./types.ts";
export type MapNode = {
  id: string;
  kind: "course" | "requirement" | "all" | "any" | "credits" | "unknown";
  label: string;
  course_id: string | null;
  requirement_id: string | null;
  credits: string | null;
  verification: "source_verified" | "unresolved" | "synthetic";
};
export type MapEdge = {
  id: string;
  source: string;
  target: string;
  relation: "membership" | "prerequisite";
  source_ids: string[];
  verification: "source_verified" | "synthetic";
};
export type DegreeMap = {
  release_id: string;
  campus_id: string;
  program_id: string;
  catalog_year: string;
  complete: false;
  nodes: MapNode[];
  edges: MapEdge[];
  groups: {
    id: string;
    label: string;
    column: string;
    kind: string;
    target_credits: string | null;
  }[];
};
export function validMap(value: unknown, catalog: Catalog): value is DegreeMap {
  if (!value || typeof value !== "object") return false;
  const map = value as DegreeMap,
    r = catalog.release;
  if (
    !Array.isArray(map.nodes) ||
    !Array.isArray(map.edges) ||
    !Array.isArray(map.groups) ||
    map.nodes.length > 200 ||
    map.edges.length > 400
  )
    return false;
  const ids = new Set(map.nodes.map((n) => n?.id));
  const exact = (v: unknown) =>
    v === null || (typeof v === "string" && /^\d+(?:\.\d+)?$/.test(v));
  return (
    map.complete === false &&
    map.release_id === r.id &&
    map.campus_id === r.campus_id &&
    map.program_id === r.program.id &&
    map.catalog_year === r.catalog_year &&
    ids.size === map.nodes.length &&
    map.nodes.every(
      (n) =>
        n &&
        typeof n.id === "string" &&
        typeof n.label === "string" &&
        ["course", "requirement", "all", "any", "credits", "unknown"].includes(
          n.kind,
        ) &&
        ["source_verified", "unresolved", "synthetic"].includes(
          n.verification,
        ) &&
        exact(n.credits) &&
        (!n.course_id || r.courses.some((c) => c.identity.id === n.course_id)),
    ) &&
    new Set(map.edges.map((e) => e?.id)).size === map.edges.length &&
    map.edges.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        ids.has(e.source) &&
        ids.has(e.target) &&
        ["membership", "prerequisite"].includes(e.relation) &&
        ["source_verified", "synthetic"].includes(e.verification) &&
        Array.isArray(e.source_ids) &&
        e.source_ids.length > 0 &&
        e.source_ids.every((id) => r.sources.some((s) => s.id === id)),
    ) &&
    map.groups.every(
      (g) =>
        g &&
        typeof g.id === "string" &&
        typeof g.label === "string" &&
        typeof g.column === "string" &&
        ["required", "recommended"].includes(g.kind) &&
        exact(g.target_credits),
    )
  );
}
/** Layout only. Residual/cyclic nodes get a display column, never an academic verdict. */
export function layoutMap(nodes: MapNode[], edges: MapEdge[]) {
  if (nodes.length > 200 || edges.length > 400)
    throw new Error("Choose a smaller map");
  if (!edges.length) {
    const columns = Math.ceil(Math.sqrt(nodes.length));
    return new Map(
      nodes.map((n, i) => [
        n.id,
        { x: (i % columns) * 270, y: Math.floor(i / columns) * 155 },
      ]),
    );
  }
  const positions = new Map<string, { x: number; y: number }>(),
    ids = new Set(nodes.map((n) => n.id));
  const pending = new Map(
    nodes.map((n) => [
      n.id,
      new Set(
        edges
          .filter((e) => e.target === n.id && ids.has(e.source))
          .map((e) => e.source),
      ),
    ]),
  );
  let column = 0;
  while (pending.size) {
    const ready = [...pending]
      .filter(([, incoming]) => incoming.size === 0)
      .map(([id]) => id)
      .sort();
    const layer = ready.length ? ready : [...pending.keys()].sort();
    layer.forEach((id, row) => {
      positions.set(id, {
        x: row * 270,
        y: column * 220,
      });
      pending.delete(id);
    });
    for (const incoming of pending.values())
      for (const id of layer) incoming.delete(id);
    column++;
  }
  return positions;
}
export function prerequisiteTrace(map: DegreeMap, id: string) {
  const edges = map.edges.filter((e) => e.relation === "prerequisite");
  function walk(reverse: boolean) {
    const found = new Set<string>(),
      queue = [id];
    while (queue.length) {
      const current = queue.shift()!;
      for (const e of edges) {
        if ((reverse ? e.target : e.source) !== current) continue;
        const next = reverse ? e.source : e.target;
        if (next !== id && !found.has(next)) {
          found.add(next);
          queue.push(next);
        }
      }
    }
    return found;
  }
  return { upstream: walk(true), downstream: walk(false) };
}
export function visibleMap(
  map: DegreeMap,
  collapsed: ReadonlySet<string>,
  focus?: string,
) {
  const roots = map.nodes
    .filter(
      (n) => n.kind === "requirement" && !collapsed.has(n.requirement_id!),
    )
    .map((n) => n.id);
  const included = new Set(
    map.nodes.filter((n) => n.kind === "requirement").map((n) => n.id),
  );
  const queue = [...roots];
  if (focus) {
    included.add(focus);
    queue.push(focus);
    const branch = prerequisiteTrace(map, focus);
    for (const id of [...branch.upstream, ...branch.downstream]) {
      included.add(id);
      queue.push(id);
    }
  }
  const visited = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const e of map.edges) {
      if (e.source === id) {
        included.add(e.target);
        queue.push(e.target);
      }
    }
  }
  const nodes = map.nodes.filter((n) => included.has(n.id)),
    edges = map.edges.filter(
      (e) =>
        included.has(e.source) &&
        included.has(e.target) &&
        !(
          e.source.startsWith("requirement:") &&
          collapsed.has(e.source.slice(12))
        ),
    );
  return { nodes, edges };
}
export function courseStatus(node: MapNode, state: WorkspaceState) {
  return node.course_id && state.selected.includes(node.course_id)
    ? "Reported complete"
    : node.verification === "unresolved"
      ? "Unresolved"
      : "Not selected";
}

/** Display compression only: an unambiguous single-course requirement can share its card. */
export function compactMap(view: { nodes: MapNode[]; edges: MapEdge[] }) {
  const attach = new Map<string, MapNode>(),
    hidden = new Set<string>();
  for (const root of view.nodes.filter((n) => n.kind === "requirement")) {
    const outgoing = view.edges.filter((e) => e.source === root.id);
    if (outgoing.length !== 1 || outgoing[0].relation !== "membership")
      continue;
    const target = view.nodes.find((n) => n.id === outgoing[0].target);
    if (
      !target ||
      target.kind !== "course" ||
      root.label !== target.label ||
      root.credits !== target.credits ||
      view.edges.filter(
        (e) => e.target === target.id && e.relation === "membership",
      ).length !== 1
    )
      continue;
    attach.set(target.id, root);
    hidden.add(root.id);
  }
  return {
    nodes: view.nodes
      .filter((n) => !hidden.has(n.id))
      .map((n) =>
        attach.has(n.id)
          ? { ...n, requirement_id: attach.get(n.id)!.requirement_id }
          : n,
      ),
    edges: view.edges.filter(
      (e) => !hidden.has(e.source) && !hidden.has(e.target),
    ),
  };
}
