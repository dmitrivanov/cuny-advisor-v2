# Interactive degree maps and compact course history

Phase 04D, 2026-10-19. PRs #13 and #14 were confirmed merged before advancing
`feature/phase04d-degree-maps` to main at `7db961a`. This phase adds read-only
visual projection and session-local presentation; the academic evaluator, source
releases, persisted data and schema are unchanged.

## One academic model, distinct visual relationships

The existing scoped catalog endpoint now includes `degree_map`. The immutable
`release` and four-column `columns` fields are retained. The new backend projection
in `app/workspace/degree_map.py` uses the canonical AST and existing `source_problem`
evidence checks. It does not run an audit, change a rule or allocate credit.

Nodes are namespaced course identities, requirement groups and explicit All-of,
One-of or credit-pool conditions. Membership and prerequisite edges are different
types. Each edge retains its source IDs and verification classification in the API;
student UI shows readable labels and useful official links. Only rules whose source
applicability is usable become edges. Empty evidence, conflicts (including incoming
conflicts), provisional sources, unconfirmed years and unsupported expressions do
not become authoritative connections. Condition/edge identities use structured path
encoding, avoiding separator collisions between distinct requirement branches. An expression containing unsupported branches
is not simplified into a confident partial AND/OR claim. Minimum-grade prerequisite
conditions and credit-based prerequisite expressions are conservatively omitted
rather than flattened. Missing prerequisites never establish verified absence.

Source-backed requirement membership does not assert that every option is required,
that credits are earned, or that a degree is complete. Recommendations remain
recommendations. Unknown English/elective pools remain unresolved requirement nodes.
A group's credit target is displayed as an exact string; it is never calculated from
selected cards. The map's `complete` field is always false for this bounded slice.

The CS 2026–2027 draft and partial CIS 2026–2027 draft remain separate from the
2025–2026 browse catalog. Their requirement memberships have some year-confirmed
program evidence. Neither draft currently has a verified prerequisite edge under
these checks. Provisional MAT 206/301/302 interpretations still feed the unchanged
engine's explicit uncertainty; they do not silently become authoritative map edges.
No degree requirements, course descriptions or transcript details are borrowed from
the 2025–2026 browsing snapshot to fill a different year.

All existing release data is retained. The frontend fixture additions are HTTP
projection snapshots, not new academic releases or database imports. A separate
synthetic fixture tests nested prerequisite AND/OR and downstream interaction. It
is never imported at runtime and is prominently labeled whenever rendered in tests.

## Program journey and course details

Chat remains primary. “Tell me about Computer Science” and “Show Computer Information
Systems degree map” produce a compact preview with an Open Degree Map action. The
student chooses an available catalog edition explicitly. No year is inferred from
a program name. Academic Explorer's Programs destination also offers separate,
year-labeled draft-map cards obtained from release discovery; choosing one is an
explicit version selection. Browse-only programs retain official links and the
limited-data view rather than fabricated map membership.

Unambiguous direct single-course requirements whose labels and exact credits match
the course share one visual card; the requirement ID and backend outcome remain
attached. Shared/alternative/unknown relations are not compressed. This is display
compression, not satisfaction or allocation. Independent cards use a compact grid;
connected conditions use layered placement.

The map opens with Major Requirements as a visual scope. The four canonical academic
categories and an all-requirements scope remain available. Collapsing groups changes
only the visible projection; shared courses are deduplicated, and explicit course
focus keeps the selected prerequisite subgraph available. Requirement membership is
dashed; prerequisite paths are solid. Earlier/later highlighting can be scoped to
prerequisites, dependents or both. Unresolved groups and reported completions have
separate text/borders. “Remaining” / “Met in preview” come only from backend results.
An unselected course is not itself proof of an unmet degree requirement.

Course selection opens a native focus-contained dialog with Escape/close and trigger
focus restoration. Mobile uses a full-screen sheet. Captured title, exact credits,
edition, reported-selection control and source link are shown. The old draft DTO
has no course description/hours; their absence is stated instead of importing text
from another catalog year. Preparation notes and pathways remain conditional.

## Automatic layout and accessibility

Reuse the already pinned React Flow 12.12.0 from merged PR #14. No new dependency.
ELK was reconsidered against these small scoped graphs and its documented layered
layout/worker model; defer its additional engine/bundle until measured graph
complexity requires it. Use a deterministic automatic layered layout over the
read-only node/edge projection. Nodes within a layer occupy one row, keeping edges
between layers from visually traversing intervening node columns. Cyclic residuals
receive a display layer; layout handling does not diagnose academic cycles or
approve a rule. Bounds are 200 nodes / 400 edges; no campus-wide catalog graph.
No large-graph performance target is claimed or benchmarked.

Graph UI is loaded on demand. Controlled node measurement state is retained so
hover, focus and modal transitions do not temporarily hide focus targets. These
dimensions are visual metadata only, not a second academic/history state. Native node buttons, section/course/path controls,
pan/zoom/fit and an accessible list are available. Mobile initially uses the list
for legibility, with an explicit interactive-map toggle. Graph and list consume the
same visible projection, including collapsed groups and explicit AND/OR relations.
Reduced motion disables path animation and uses instant focus/fit. Focus rings,
text labels, solid surfaces and forced-color borders supplement color.

V1 source was inspected read-only at commit
`ba499bc078a4889ed7ed4ad2f381a5c6950753d3`:
[renderer](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/curriculum_graph.js)
and [service](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/curriculum_graph_service.py).
Verified behaviors: expandable course buttons, collapsed category branches,
program/choice-group clusters, layered placement, completed-code marking,
downstream highlighting and DOM/SVG edge redraw. Shortcomings: graph overrides can
diverge from selector rules; generic relationship prose conflates relation types;
residual layering is not true cycle diagnosis; completion codes and visual clusters
do not implement a general audit. No V1 runtime, data or credentials were used.
This phase improves separation, exact identities, bidirectional paths, accessible
list/mobile details and canonical result synchronization rather than copying its
academic-looking overrides.

## Compact history and shared progress

The default selector is a searchable combobox with bounded suggestions and removable
course chips. Native keyboard Enter/arrows/Escape and pointer selection use exact
release-bound identities; free text cannot add unverified catalog entries. Removing
or re-adding a course uses the original reducer and clears incompatible allocations.
The established four-column selector remains available as an optional disclosure,
with its presentation order and academic membership untouched.

Grade/term/attendance are not captured in this slice. Their absence is visible in
optional details; the UI does not add cosmetic fields that the engine would ignore.
Optional exact-string credit proposals remain available in a secondary disclosure
and use the existing validation/preview payload. No automatic allocation is added.

`WorkspaceState.selected` and `assignments` remain the only canonical history/proposal
state. Graph state contains only focus, viewport, expansion and display preferences.
The parent workspace owns one `usePreview` controller, shared by map and progress.
The student explicitly acknowledges fictional passed-course assumptions for the
current release and requests the first preview. Thereafter selection/allocation
changes invalidate the visible result and request a fresh backend preview. Old
requests are aborted and late responses discarded. Inputs/results are keyed by exact
release summary, selections, allocations and request attempt. Catalog changes reset
the assumption gate; stale totals are hidden. No calculation or new engine semantics
are introduced in TypeScript. No records are persisted.

## Local chat destinations and future ingestion

Allowlisted `map`, `completed`, and `progress` modules use the existing navigation
registry. `MapTarget` validates program hint, course code and direction. Exact local
commands include “Open degree map”, “Focus MAT 301”, “Show prerequisites for MAT 301”,
“Show downstream dependencies for MAT 301”, “Open completed courses”, and “Show
remaining requirements”. Codes resolve only inside the explicitly selected release;
unknown courses do not create nodes or transfer equivalences. Gemini contracts and
permissions are unchanged; local map actions need no provider call. No Gemini call
was made for development or verification.

Full program ingestion can later supply more reviewed requirements and usable
prerequisites through the same immutable contracts. That requires separate source
reconciliation and authorization. This phase does not publish a catalog, establish
institutional approval, activate another campus, implement registration/planning or
certify graduation. See [actual verification](PHASE_04D_VERIFICATION.md).
