"use client";
import { useState, type Dispatch } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  Position,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./degree-map.css";
import "./explorer.css";
import { courseTitle } from "@/lib/workspace/presentation";
import { programName } from "@/lib/workspace/registry";
import {
  layoutMap,
  compactMap,
  prerequisiteTrace,
  visibleMap,
  validMap,
  courseStatus,
} from "@/lib/workspace/degree-map";
import type { Action } from "@/lib/workspace/state";
import type { WorkspaceState } from "@/lib/workspace/types";
import type { PreviewController } from "@/components/workspace/use-preview";
import { DegreeCourseDetail } from "./degree-course-detail";
export function DegreeMap({
  state,
  dispatch,
  preview,
  openHistory,
  openProgress,
  initialFocus,
  initialDirection,
}: {
  state: WorkspaceState;
  dispatch: Dispatch<Action>;
  preview: PreviewController;
  openHistory: () => void;
  openProgress: () => void;
  initialFocus?: string;
  initialDirection?: "both" | "upstream" | "downstream";
}) {
  const catalog = state.catalog!,
    candidate = catalog.degree_map;
  const available = validMap(candidate, catalog) ? candidate : null;
  const [measurements, setMeasurements] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [selected, setSelected] = useState(
      available?.nodes.find((n) => n.course_id === initialFocus)?.id ?? "",
    ),
    [detail, setDetail] = useState<string | null>(null),
    [list, setList] = useState(
      () => window.matchMedia("(max-width: 640px)").matches,
    ),
    [collapsed, setCollapsed] = useState<Set<string>>(new Set()),
    [api, setApi] = useState<ReactFlowInstance | null>(null),
    [hover, setHover] = useState<string | null>(null),
    [section, setSection] = useState(
      initialFocus ? "all" : "Major Requirements",
    ),
    [direction, setDirection] = useState(initialDirection ?? "both");
  if (!available)
    return (
      <div className="explorer-empty">
        <h2>This program map is not available yet.</h2>
        <p>
          Its requirements have not been confirmed for this edition. Course
          history and limited progress tools remain available.
        </p>
        <button className="explorer-primary" onClick={openHistory}>
          Open course history
        </button>
      </div>
    );
  const map = available;
  const scoped = {
    ...map,
    nodes: map.nodes.filter(
      (n) =>
        n.kind !== "requirement" ||
        section === "all" ||
        map.groups.find((g) => g.id === n.requirement_id)?.column === section,
    ),
  };
  scoped.edges = scoped.edges.filter(
    (e) =>
      scoped.nodes.some((n) => n.id === e.source) &&
      scoped.nodes.some((n) => n.id === e.target),
  );
  const visible = compactMap(visibleMap(scoped, collapsed, selected)),
    positions = layoutMap(visible.nodes, visible.edges),
    traced = prerequisiteTrace(map, hover ?? selected),
    branch = {
      upstream:
        direction === "downstream" ? new Set<string>() : traced.upstream,
      downstream:
        direction === "upstream" ? new Set<string>() : traced.downstream,
    };
  function focus(id: string) {
    setSection("all");
    setSelected(id);
    const b = prerequisiteTrace(map!, id);
    requestAnimationFrame(() => {
      void api?.fitView({
        nodes: [id, ...b.upstream, ...b.downstream].map((id) => ({ id })),
        padding: 0.5,
        maxZoom: 1,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 250,
      });
    });
  }
  function collapse(id: string) {
    setCollapsed((old) => {
      const n = new Set(old);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  const result = (id: string) =>
    preview.value?.snapshot?.results.find((r) => r.requirement_id === id)
      ?.result.status;
  const nodes: Node[] = visible.nodes.map((n) => {
    const c = n.course_id
      ? catalog.release.courses.find((c) => c.identity.id === n.course_id)
      : null;
    const outcome = n.requirement_id ? result(n.requirement_id) : null;
    const recommended =
      map.groups.find((g) => g.id === n.requirement_id)?.kind === "recommended";
    const status = c
      ? courseStatus(n, state)
      : outcome === "met"
        ? "Met in preview"
        : outcome === "unmet"
          ? recommended
            ? "Not selected in preview"
            : "Remaining in preview"
          : n.verification === "unresolved"
            ? "Unresolved"
            : n.kind === "requirement"
              ? "Source-backed group"
              : n.label;
    return {
      id: n.id,
      initialWidth: 230,
      initialHeight: 120,
      measured: measurements[n.id],
      position: positions.get(n.id)!,
      data: {
        label: (
          <button
            className="degree-node-button"
            data-degree-course={c?.identity.id}
            aria-label={
              c
                ? `View ${c.code}: ${courseTitle(c)}`
                : n.kind === "requirement"
                  ? `${collapsed.has(n.requirement_id!) ? "Expand" : "Collapse"} ${n.label}`
                  : n.label
            }
            aria-current={c && selected === n.id ? "true" : undefined}
            aria-haspopup={c ? "dialog" : undefined}
            disabled={!c && !n.requirement_id}
            aria-expanded={
              n.kind === "requirement"
                ? !collapsed.has(n.requirement_id!)
                : undefined
            }
            onClick={() => {
              if (c) {
                setSelected(n.id);
                setDetail(c.identity.id);
              } else if (n.requirement_id) collapse(n.requirement_id);
            }}
            onFocus={() => setHover(n.id)}
            onBlur={() => setHover(null)}
          >
            <strong>{c ? c.code : n.label}</strong>
            {c && <span>{courseTitle(c)}</span>}
            <small>
              {n.credits ? `${n.credits} cr. · ` : ""}
              {status}
              {c && outcome && (
                <>
                  {" "}
                  · Requirement{" "}
                  {outcome === "met"
                    ? "met"
                    : outcome === "unmet"
                      ? "remaining"
                      : "unresolved"}{" "}
                  in preview
                </>
              )}
            </small>
            {n.kind === "requirement" && n.requirement_id && (
              <span className="degree-collapse" aria-hidden="true">
                {collapsed.has(n.requirement_id) ? "+" : "−"}
              </span>
            )}
          </button>
        ),
      },
      className: `degree-node degree-node--${n.kind} ${c && state.selected.includes(c.identity.id) ? "is-reported" : ""} ${selected === n.id ? "is-selected" : ""} ${branch.upstream.has(n.id) ? "is-upstream" : ""} ${branch.downstream.has(n.id) ? "is-downstream" : ""} ${n.verification === "unresolved" ? "is-unresolved" : ""}`,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      draggable: false,
      connectable: false,
      focusable: false,
    };
  });
  const edges: Edge[] = visible.edges.map((e) => ({
    ...e,
    type: "smoothstep",
    ariaLabel: `${e.relation === "membership" ? "Requirement membership" : "Prerequisite"}: ${map.nodes.find((n) => n.id === e.source)?.label} to ${map.nodes.find((n) => n.id === e.target)?.label}`,
    className: `degree-edge degree-edge--${e.relation} ${e.relation === "prerequisite" && (branch.upstream.has(e.source) || branch.downstream.has(e.target) || e.source === selected || e.target === selected) ? "is-emphasized" : ""}`,
  }));
  const course = detail
    ? catalog.release.courses.find((c) => c.identity.id === detail)
    : null;
  return (
    <section className="degree-map" aria-label="Program degree map">
      {map.nodes.some((n) => n.verification === "synthetic") && (
        <p className="explorer-note">
          Synthetic demonstration · not BMCC academic requirements.
        </p>
      )}
      <div className="degree-map-hero">
        <p className="explorer-kicker">Your program, at a glance</p>
        <h2>{programName(catalog.release.program.id)}</h2>
        <p>
          {catalog.release.credential} · {catalog.release.catalog_year} · Draft
          degree map
        </p>
      </div>
      <p className="degree-limitation">
        Explore the requirements captured for this edition, not a complete
        degree plan. Some information still needs confirmation.
      </p>
      <div className="degree-map-actions">
        <button className="explorer-primary" onClick={openHistory}>
          Edit completed courses <span>{state.selected.length}</span>
        </button>
        <button className="explorer-secondary" onClick={openProgress}>
          View deterministic progress
        </button>
      </div>
      <div className="degree-map-controls">
        <label>
          Highlight paths
          <select
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value as "both" | "upstream" | "downstream")
            }
          >
            <option value="both">Earlier & later steps</option>
            <option value="upstream">Prerequisites only</option>
            <option value="downstream">Dependents only</option>
          </select>
        </label>
        <label>
          Map section
          <select
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              setSelected("");
            }}
          >
            <option value="all">All captured requirements</option>
            {[...new Set(map.groups.map((g) => g.column))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Focus a course
          <select
            aria-label="Focus a course"
            value={selected}
            onChange={(e) => focus(e.target.value)}
          >
            <option value="">Choose a course</option>
            {catalog.release.courses.map((c) => (
              <option
                key={c.identity.id}
                value={
                  map.nodes.find((n) => n.course_id === c.identity.id)?.id ?? ""
                }
              >
                {c.code} · {courseTitle(c)}
              </option>
            ))}
          </select>
        </label>
        <button
          className="explorer-text-button"
          onClick={() => setList((v) => !v)}
        >
          {list ? "Show interactive map" : "Show accessible list"}
        </button>
        <button
          className="explorer-text-button"
          onClick={() =>
            setCollapsed((old) =>
              old.size ? new Set() : new Set(map.groups.map((g) => g.id)),
            )
          }
        >
          {collapsed.size ? "Expand all groups" : "Collapse all groups"}
        </button>
      </div>
      <div className="degree-legend">
        <span>Solid: prerequisite</span>
        <span>Dashed: requirement membership</span>
        <span>Reported complete ≠ verified credit</span>
        <span>Unresolved: confirmation needed</span>
      </div>
      {!list ? (
        <div className="degree-map-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={setApi}
            onNodesChange={(changes) => {
              const sizes = changes.filter(
                (c) => c.type === "dimensions" && c.dimensions,
              );
              if (!sizes.length) return;
              setMeasurements((current) => {
                const next = { ...current };
                let changed = false;
                for (const c of sizes) {
                  if (c.type !== "dimensions" || !c.dimensions) continue;
                  const prior = current[c.id];
                  if (
                    prior?.width !== c.dimensions.width ||
                    prior?.height !== c.dimensions.height
                  ) {
                    next[c.id] = c.dimensions;
                    changed = true;
                  }
                }
                return changed ? next : current;
              });
            }}
            fitView
            fitViewOptions={{
              nodes: selected ? [{ id: selected }] : undefined,
              padding: 0.25,
              maxZoom: 1,
            }}
            minZoom={0.1}
            maxZoom={1.6}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
            elementsSelectable={false}
            preventScrolling={false}
            onNodeMouseEnter={(_, n) => setHover(n.id)}
            onNodeMouseLeave={() => setHover(null)}
            aria-label="Limited program requirements map"
          >
            <Controls showInteractive={false} />
            <Background gap={24} />
          </ReactFlow>
          <button
            className="degree-fit explorer-secondary"
            onClick={() =>
              selected ? focus(selected) : void api?.fitView({ padding: 0.2 })
            }
          >
            Fit {selected ? "selected pathway" : "program map"}
          </button>
        </div>
      ) : (
        <ul className="degree-map-list">
          {visible.nodes.map((n) => (
            <li key={n.id}>
              <strong>{n.label}</strong>
              {n.course_id && (
                <p>
                  {courseTitle(
                    catalog.release.courses.find(
                      (c) => c.identity.id === n.course_id,
                    )!,
                  )}
                </p>
              )}
              {n.kind === "requirement" && n.requirement_id && (
                <button
                  className="explorer-text-button"
                  onClick={() => collapse(n.requirement_id!)}
                >
                  {collapsed.has(n.requirement_id)
                    ? "Expand group"
                    : "Collapse group"}
                </button>
              )}
              {(n.kind === "any" || n.kind === "all") && (
                <p>
                  {n.kind === "any" ? "One of" : "All of"}:{" "}
                  {visible.edges
                    .filter(
                      (e) =>
                        (e.relation === "prerequisite" && e.target === n.id) ||
                        (e.relation === "membership" && e.source === n.id),
                    )
                    .map(
                      (e) =>
                        map.nodes.find(
                          (item) =>
                            item.id ===
                            (e.relation === "prerequisite"
                              ? e.source
                              : e.target),
                        )?.label,
                    )
                    .join(", ")}
                </p>
              )}
              {n.course_id && (
                <button
                  className="explorer-text-button"
                  data-degree-course={n.course_id}
                  onClick={() => {
                    setSelected(n.id);
                    setDetail(n.course_id);
                  }}
                >
                  View course details
                </button>
              )}
              <p>
                {n.course_id
                  ? courseStatus(n, state)
                  : n.credits
                    ? `${n.credits} credits · ${n.verification === "unresolved" ? "Unresolved" : "Source-backed group"}`
                    : n.verification === "unresolved"
                      ? "Unresolved"
                      : n.kind === "all"
                        ? "All of"
                        : n.kind === "any"
                          ? "One of"
                          : ""}
              </p>
              {n.requirement_id && result(n.requirement_id) && (
                <p>
                  Requirement{" "}
                  {result(n.requirement_id) === "met"
                    ? "met"
                    : result(n.requirement_id) === "unmet"
                      ? "remaining"
                      : "unresolved"}{" "}
                  in preview
                </p>
              )}
              <p>
                {visible.edges
                  .filter((e) => e.source === n.id)
                  .map(
                    (e) =>
                      `${e.relation === "membership" ? "Requirement option" : "Prerequisite for"}: ${map.nodes.find((n) => n.id === e.target)?.label}`,
                  )
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <div className="degree-path-summary" role="status">
          <strong>
            {map.nodes.find((n) => n.id === selected)?.label ?? "Course"}{" "}
            pathway
          </strong>
          <p>
            Verified earlier steps:{" "}
            {[...prerequisiteTrace(map, selected).upstream]
              .map((id) => map.nodes.find((n) => n.id === id)?.label)
              .join(", ") || "Not established for this edition"}
          </p>
          <p>
            Verified later steps:{" "}
            {[...prerequisiteTrace(map, selected).downstream]
              .map((id) => map.nodes.find((n) => n.id === id)?.label)
              .join(", ") || "Not established for this edition"}
          </p>
          <p>Unverified prerequisite notes do not create map connections.</p>
        </div>
      )}
      <div className="degree-progress-summary" aria-live="polite">
        <h3>Progress stays connected</h3>
        <p>
          {state.selected.length} courses reported complete.{" "}
          {preview.busy
            ? "Updating the deterministic preview…"
            : preview.value?.snapshot
              ? `${preview.value.snapshot.earned_credits} hypothetical unique credits; degree status remains unresolved.`
              : "Run the limited preview to inspect requirement outcomes."}
        </p>
        {preview.error && (
          <p role="alert">
            The progress preview is unavailable. Please try again in Degree
            Progress.
          </p>
        )}
      </div>
      {course && (
        <DegreeCourseDetail
          key={course.identity.id}
          course={course}
          catalog={catalog}
          selected={state.selected.includes(course.identity.id)}
          toggle={() =>
            dispatch({ type: "toggle", course: course.identity.id })
          }
          close={() => {
            const id = course.identity.id;
            setDetail(null);
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLButtonElement>(
                  `[data-degree-course="${CSS.escape(id)}"]`,
                )
                ?.focus(),
            );
          }}
          focusPath={() => {
            setDetail(null);
            focus(
              map.nodes.find((n) => n.course_id === course.identity.id)!.id,
            );
          }}
        />
      )}
    </section>
  );
}
