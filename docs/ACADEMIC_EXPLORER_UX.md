# Academic Explorer and course pathways

Phase 04C-UX, 2026-10-18. Frontend presentation and navigation only. PR #13 was
confirmed merged at `5078883530f72d06e50ca4c131abd5bfce23fa31` before branching.
Catalog persistence, source facts, evaluator and audit releases are unchanged.

## Student journey

Before: a disclosure-based source browser shared a screen with draft audit release
selection, raw snapshot identities, provenance locators and rule review enums.
After: Academic Explorer opens from chat, with independent Departments, Programs,
Courses and Pathways destinations. `#catalog` remains the module routing contract.
Search, breadcrumbs, back/history and deep links preserve the separate explicit
advising `campus/program/release` context and hypothetical course selections.

Department pages show their source-associated courses and official department link.
Program pages show credential, title and official program link. Page-host links do
not establish department ownership; neither program courses nor degree requirements
are inferred from those links. Courses remain independently searchable. The latest
retained browsing edition is initially displayed with its year; this does not assign
an audit year. Changing browsing edition clears incompatible explorer destinations.

Course cards contain only code, official title and compact credits. The native dialog
is a side panel on desktop and bottom sheet on mobile. It provides focus containment,
Escape/close/backdrop dismissal and restores the triggering control where present.
Description, credits, prerequisite notes and official source link are primary;
hours and other conditions use secondary disclosure. Raw rule blocks remain in the
API/storage. Display removes only a leading description before a literal
“Prerequisite:” marker and a trailing syllabus label; it does not interpret rules.
Unknown prerequisites remain unknown. Provisional text carries a brief BMCC
confirmation qualification. Source verification is not institutional endorsement.

## Graph evidence and boundaries

The real browsing snapshot has **zero verified structured prerequisite rules**.
A real course pathway therefore shows an empty state. The separate, permanently
labeled fictional demonstration contains seven nodes (five invented courses and
explicit AND/OR groups) and six edges. It is not BMCC academic data. Neither raw
text, opaque requisite identifiers nor course-code mentions are converted to edges.

Traversal highlights earlier and later steps; it does not evaluate an OR choice,
academic eligibility, credits, completion or degree satisfaction. Bounds are 30 nodes
and 60 edges; iterative traversal terminates on cycles and rejects dangling references.
The current demo is much smaller. No campus-wide 1,263-node graph is rendered.
Future real graphs require reviewed, year-bound structured relationships and explicit
scope; the demo is not evidence that those rules are available.

React Flow `@xyflow/react` **12.12.0** was evaluated and pinned (20 packages added, including React Flow). It supports the existing React stack, pan/zoom controls,
fit-to-selection and accessible interactions. The graph chunk loads only on demand.
[Official accessibility guidance](https://reactflow.dev/learn/advanced-use/accessibility)
and [controls](https://reactflow.dev/api-reference/components/controls) informed usage.
ELK `elkjs` 0.12.0 was evaluated from its
[official options](https://eclipse.dev/elk/reference/options.html) and package metadata.
Its approximately 8 MB unpacked package is deferred: this small explicit grouping
uses deterministic positions and does not need an automatic layout engine. React
Flow's package was approximately 1.2 MB unpacked; these are package sizes, not browser
bundle measurements or performance benchmarks. Large graph layout remains future work.

Selecting a course fits and highlights both directions, hover previews connections,
and edge emphasis runs once. Pan, zoom and fit controls remain available. Native
buttons expose selected state; a non-graph list expresses “All of” and “One of”.
Reduced motion disables transitions/edge animation and uses instant fit. Labels,
borders and line patterns supplement color. Solid surfaces/backdrop fallbacks and
forced-color borders preserve legibility.

## V1 source verification versus proposed improvements

Read-only source inspected at V1 commit
`ba499bc078a4889ed7ed4ad2f381a5c6950753d3`:
[`curriculum_graph.js`](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/curriculum_graph.js)
and the graph service (see the pinned paths in the Phase 01C audit). Source-verified
behaviors: custom DOM/SVG modal, compact expandable course buttons, collapsible
categories, topological layers, downstream highlighting excluding corequisites,
resize/requestAnimationFrame edge redraw, browser printing and separate visual
position/graph overrides. This was source inspection, not V1 runtime testing.
Graph/selector divergence and permissive residual layering do not establish academic
correctness or robust cycle diagnosis.

V2 improvements proposed and implemented in this bounded slice: bidirectional
highlighting, explicit AND/OR demo groups, pan/zoom/fit, keyboard button interaction,
accessible list, mobile sheet and reduced motion. V1 category collapse/printing and
editable layout overrides are not copied. No V1 code, service, database or credentials
were executed or modified. V1 is behavioral reference, not academic authority.

## Chat navigation contract

Existing allowlisted `catalog` module actions are retained. Optional frontend-local
`ExplorerTarget` values are validated before URL generation. Gemini output does not
acquire arbitrary URL or academic authority. Exact local commands can open the
explorer, department/program identities, specific course identity or course pathway.
“Open MAT 301” searches that course code without inventing an identity. Generic
“Explore departments”, “Explore programs”, “Browse courses”, and “Show course pathways”
are supported. Existing program navigation prompts route into the appropriate view.
The same typed destinations are available to contextual UI buttons.

Deep links use `explore`, `department`, `academic_program`, `course`, `edition`,
`search`, `offset`, and an explicit `demo=pathway`; the audit `program` key is separate.
Invalid destinations fail closed. Browsing is BMCC-only, read-only and session-local.
No model calls, prerequisite calculations or persistence writes occur here.

## Verification and review

See [verification results](PHASE_04C_UX_VERIFICATION.md) for actual commands/results
and responsive screenshots. Review real data locally at
`http://127.0.0.1:3000/campus/bmcc#catalog`. Test Departments → a department,
Programs → a program → independent Courses, search MAT 301, keyboard-open/close its
details, source link, real pathway empty state and fictional graph/list/fit controls.
Return to chat, then Completed Courses / Degree Progress to confirm the independent
explicit audit selections persist. No Gemini key or real student records are needed.
