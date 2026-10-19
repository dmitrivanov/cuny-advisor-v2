/** Display-only graph traversal. No credits, completion or eligibility calculation. */
export type PathNode = {
  id: string;
  code: string;
  title: string;
  kind: "course" | "all" | "any";
  x: number;
  y: number;
};
export type PathEdge = { id: string; source: string; target: string };
export type PathGraph = {
  kind: "synthetic" | "catalog";
  nodes: PathNode[];
  edges: PathEdge[];
};
export const demonstration: PathGraph = {
  kind: "synthetic",
  nodes: [
    {
      id: "foundation",
      code: "DEMO 101",
      title: "Foundations",
      kind: "course",
      x: 0,
      y: 100,
    },
    {
      id: "studio",
      code: "DEMO 110",
      title: "Creative studio",
      kind: "course",
      x: 0,
      y: 300,
    },
    {
      id: "lab",
      code: "DEMO 120",
      title: "Exploration lab",
      kind: "course",
      x: 0,
      y: 500,
    },
    {
      id: "choice",
      code: "OR",
      title: "One of these",
      kind: "any",
      x: 280,
      y: 400,
    },
    {
      id: "both",
      code: "AND",
      title: "Both branches",
      kind: "all",
      x: 560,
      y: 200,
    },
    {
      id: "methods",
      code: "DEMO 201",
      title: "Methods & practice",
      kind: "course",
      x: 840,
      y: 200,
    },
    {
      id: "project",
      code: "DEMO 301",
      title: "Independent project",
      kind: "course",
      x: 1120,
      y: 200,
    },
  ],
  edges: [
    ["studio", "choice"],
    ["lab", "choice"],
    ["choice", "both"],
    ["foundation", "both"],
    ["both", "methods"],
    ["methods", "project"],
  ].map(([source, target]) => ({ id: `${source}-${target}`, source, target })),
};
export function realCourseGraph(course: {
  id: string;
  code: string;
  title: string;
}): PathGraph {
  // Current browsing release has zero verified structured rules. Never parse prose into edges.
  return {
    kind: "catalog",
    nodes: [{ ...course, kind: "course", x: 0, y: 0 }],
    edges: [],
  };
}
export function trace(graph: PathGraph, selected: string) {
  if (graph.nodes.length > 30 || graph.edges.length > 60)
    throw new Error("Choose a smaller pathway");
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (
    !ids.has(selected) ||
    graph.edges.some((e) => !ids.has(e.source) || !ids.has(e.target))
  )
    throw new Error("Invalid pathway reference");
  function walk(reverse: boolean) {
    const reached = new Set<string>(),
      queue = [selected];
    while (queue.length) {
      const id = queue.shift()!;
      for (const edge of graph.edges) {
        if ((reverse ? edge.target : edge.source) !== id) continue;
        const next = reverse ? edge.source : edge.target;
        if (next !== selected && !reached.has(next)) {
          reached.add(next);
          queue.push(next);
        }
      }
    }
    return reached;
  }
  return { upstream: walk(true), downstream: walk(false) };
}
