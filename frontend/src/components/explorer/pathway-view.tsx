"use client";
import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Position,
  type ReactFlowInstance,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { demonstration, trace } from "@/lib/catalog/pathways";
export function PathwayView() {
  const graph = demonstration;
  const [selected, setSelected] = useState("methods"),
    [hovered, setHovered] = useState<string | null>(null),
    [list, setList] = useState(false),
    [api, setApi] = useState<ReactFlowInstance | null>(null);
  const active = hovered ?? selected,
    related = trace(graph, active);
  function choose(id: string) {
    setSelected(id);
    const branch = trace(graph, id);
    void api?.fitView({
      nodes: [id, ...branch.upstream, ...branch.downstream].map((id) => ({
        id,
      })),
      padding: 0.25,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 320,
      maxZoom: 1,
    });
  }
  const nodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    position: { x: n.x, y: n.y },
    type: "default",
    className: `pathway-node ${selected === n.id ? "is-selected" : related.upstream.has(n.id) ? "is-upstream" : related.downstream.has(n.id) ? "is-downstream" : ""}`,
    data: {
      label: (
        <button
          type="button"
          className="pathway-node-button"
          aria-pressed={selected === n.id}
          aria-label={`Select ${n.code}: ${n.title}`}
          onClick={() => choose(n.id)}
          onFocus={() => setHovered(n.id)}
          onBlur={() => setHovered(null)}
        >
          <strong>{n.code}</strong>
          <span>{n.title}</span>
          {selected === n.id && <small>Selected</small>}
        </button>
      ),
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: false,
    connectable: false,
    focusable: false,
  }));
  // No node positions or highlighted edges are written back to academic data.
  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => ({
        ...e,
        type: "smoothstep",
        className:
          (related.upstream.has(e.source) || e.source === active) &&
          (related.upstream.has(e.target) || e.target === active)
            ? "pathway-edge is-upstream"
            : (related.downstream.has(e.source) || e.source === active) &&
                (related.downstream.has(e.target) || e.target === active)
              ? "pathway-edge is-downstream"
              : "pathway-edge",
      })),
    [graph, related.upstream, related.downstream, active],
  );
  const name = (id: string) => graph.nodes.find((n) => n.id === id)!.code;
  return (
    <section className="pathway-view" aria-label="Fictional course pathway">
      <div className="explorer-note">
        <span className="explorer-badge">Fictional demonstration</span>
        <p>
          These invented courses show how pathways work. They are not BMCC
          courses or requirements.
        </p>
      </div>
      <div className="pathway-toolbar">
        <div className="pathway-legend">
          <span>Earlier steps</span>
          <span>Selected</span>
          <span>Later steps</span>
        </div>
        <button
          className="explorer-text-button"
          aria-pressed={list}
          onClick={() => setList((v) => !v)}
        >
          {list ? "Show graph" : "Show accessible list"}
        </button>
      </div>
      {!list ? (
        <div className="pathway-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={setApi}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={1.5}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
            elementsSelectable={false}
            onNodeMouseEnter={(_, n) => setHovered(n.id)}
            onNodeMouseLeave={() => setHovered(null)}
            preventScrolling={false}
            proOptions={{ hideAttribution: false }}
            aria-label="Fictional prerequisite graph"
          >
            <Background gap={24} color="#d5ddec" />
            <Controls showInteractive={false} />
          </ReactFlow>
          <button
            className="pathway-fit explorer-text-button"
            onClick={() => choose(selected)}
          >
            Fit selected pathway
          </button>
        </div>
      ) : (
        <ul className="pathway-list">
          {graph.nodes.map((n) => (
            <li key={n.id}>
              <button
                aria-pressed={selected === n.id}
                onClick={() => choose(n.id)}
              >
                {n.code} · {n.title}
              </button>
              <p>
                {graph.edges.filter((e) => e.target === n.id).length
                  ? `${n.kind === "any" ? "One of: " : n.kind === "all" ? "All of: " : "After: "}${graph.edges
                      .filter((e) => e.target === n.id)
                      .map((e) => name(e.source))
                      .join(", ")}`
                  : "Starting point in this demonstration"}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="pathway-summary" role="status">
        <strong>{name(selected)} selected</strong>
        <p>
          Earlier steps:{" "}
          {Array.from(trace(graph, selected).upstream).map(name).join(", ") ||
            "None shown"}
        </p>
        <p>
          Later steps:{" "}
          {Array.from(trace(graph, selected).downstream).map(name).join(", ") ||
            "None shown"}
        </p>
      </div>
    </section>
  );
}
