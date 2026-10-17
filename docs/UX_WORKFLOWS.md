# V2 user journeys and synchronized academic workspace

Phase 01C journey baseline with implemented Phase 02D slice below. V1 behavior evidence lives in
[V1_FEATURE_INVENTORY.md](V1_FEATURE_INVENTORY.md); canonical contracts are in
[ACADEMIC_ENGINE_BOUNDARIES.md](ACADEMIC_ENGINE_BOUNDARIES.md). These are future
workflows, not implemented features or institutional process approvals.

## Implemented Phase 03A: chat is the home

The campus conversation (`/campus/bmcc` since Phase 03B, formerly `/`) contains
one frosted conversation surface, compact branding,
a short welcome, input, four supported prompt suggestions and a small independent
prototype/no-live-AI notice. No persistent module navigation, dashboard, catalog
selector, future-tool list or catalog error panel is rendered on chat. Catalog
listing is requested when opening a contextual tool. The full protected disclosure
is available under “About this prototype”: no endorsement, fictional inputs only,
no real student information, tab-only state and no complete degree audit.

The existing exact deterministic router is unchanged (case and terminal punctuation
normalized). It supports “Show me the academic programs”, “Open completed courses”,
“I want to review my degree requirements” and “Show the Computer Science catalog”.
Unsupported questions explicitly disclose that live AI is unavailable; no unrestricted
understanding or academic advice is simulated. Structured assistant actions reference
the existing typed module registry. A future governed Gateway may supply validated
actions through that boundary; no provider, prompt service or AI SDK is implemented.

An explicit conversation action or supported hash deep link opens a focused module
view. Chat remains mounted but hidden, with its draft and conversation retained.
Modules provide a clear title, compact campus/program/year, a disclosed exact-release
selector and “Return to chatbot”. Opening moves focus to the module heading;
returning restores the initiating action when available, otherwise the chat heading.
There is no modal focus trap because this is a dedicated view, not a modal overlay.
Future-tool deep links show only an unavailable explanation and return action.

Selections/explicit allocation strings remain in the same session reducer. Returning
to chat shows a compact retained-selection count, never a progress dashboard.
Context changes clear incompatible selections/allocations and previous previews.
Same-release retry preserves selections. Refresh resets conversation and selections;
`?campus=...&program=...&release=...#completed` restores only the exact context/tool.
Back/forward preserves same-context inputs and clears them for context changes.
No cookies, localStorage, sessionStorage, accounts or 24-hour workspace storage.

The selector visually orders **Major Requirements, Major Electives, Required Common
Core, Flexible Core**, following the pinned V1 display hierarchy. The backend enum,
projection order, group membership and academic interpretation are unchanged. The
presentation helper sorts a copy, preserving group references and identities.
Cards use a checkbox, prominent code, title and native “Class details” disclosure.
Unselected/selected cards share borders, spacing and typography; selected cards add
an explicit text label as well as a subtle color change. Native disclosures are
outside checkbox labels. Missing titles say “Title not available”; no titles or
eligible pools are invented. Empty pools have compact unresolved requirement cards.
Descriptions are not rendered because no validated description field exists.

Class details show captured credits, applicability/condition metadata, structural
prerequisite/corequisite conditions and evidence state. Rule rendering labels AND/OR
conditions but performs no academic evaluation. Missing prerequisite data remains
unresolved; course selection never locks truthful hypothetical history based on
current eligibility. Source verification never implies institutional approval.
No raw course/version IDs appear in default course cards. Exact release IDs remain
available on demand for reproducibility. Full catalog evidence remains inspectable.

Progress still requires an explicit fictional passed-course assumption. Allocation
proposals go to the unchanged backend evaluator; no credit allocation/totals are
calculated in TypeScript. Unknown grades, evidence conflicts and STEM policy remain
unresolved; missing catalog credits block preview without inventing values.
See [API contracts](WORKSPACE_API.md), [design system](DESIGN_SYSTEM.md) and
[Phase 03A verification](PHASE_03A_VERIFICATION.md).

Broader journeys below are future targets for accounts, 24-hour storage, approved
records, planning, transfer, uploads, reports and governance. They do not describe
implemented Phase 03A functionality.

## Shared interaction model

Preserve V1's strongest ideas: completed-course selection, collapsible degree map,
structured semester plan, comparison and reviewable advising summary. Redesign them
as reusable workspace modules, not separate pages/iframes passing copied JSON.
Chat is the default entry; explicit structured actions and supported deep links open contextual modules. Keep academic calculations independent of model availability.
[CHAT] [SELECT] [GRAPH] [PLAN] [STATE]

Use the [Light Frosted Glass design system](DESIGN_SYSTEM.md) for the shell and
calm navigation; use opaque evidence panels for dense courses, grades and sources.
The design draws on general premium-application principles, not a copy of any brand.
Keep visible actions concise: “Add coursework”, “Review progress”, “Explore map”,
“Build a draft plan”, “Compare programs”, “Prepare summary”. Each action must be
available only when implemented; current static previews remain labeled planned.

On mobile, one primary view at a time with preserved context and a details sheet;
on desktop, main workspace plus optional side explanation/source panel. Announce
updates without moving focus unexpectedly. Use native controls, keyboard equivalents
for all graph actions, persistent focus outlines, plain status text and reduced-motion
transitions. Never require hovering, dragging, transparency or animation to understand
academic meaning. No autoplay layouts or graph-wide animated edges.

## Journey 1 — New prospective student

| Stage | Proposed experience |
| --- | --- |
| Entry | “Explore my options” from guest or saved account workspace; show guest deadline and no official-advice claim |
| Required information | Intended campus; prospective/current status; goal; optional program and desired starting term; explicit prior-credit question |
| Screens | Brief choices/conversation → program exploration → confirmed academic context → progress/list/map → optional draft plan |
| Tool transitions | Deterministic choices route to program search; unsure goal can use source-backed exploration; no AI required for navigation |
| Expected output | Confirmed or provisional program/catalog context, zero earned courses only if student confirms none, next questions and advisory plan |
| Failure states | Program/catalog unknown: show unresolved context, not default latest year; AI unavailable: choices and search remain; no supported program: explain scope and advisor next step |

Unlike V1 first-semester locking, ask about AP/IB/previous study explicitly. A first-term
student can still report evidence; never infer no prior credit from semester standing.
[V1 branching][BRANCH] and its first-semester UI lock [HARD] motivate this improvement.

## Journey 2 — Current BMCC student

| Stage | Proposed experience |
| --- | --- |
| Entry | “Review my progress” or confirmed chat intent, same workspace |
| Required information | Campus/program/track, applicable catalog assignment or unresolved status, coursework/terms/grades and verification state |
| Screens | Context confirmation → Completed Course Selector → audit summary → requirement detail / Degree Map Tree |
| Tool transitions | Confirm course edits once; canonical audit refresh updates list, tree overlays and future plan staleness together |
| Expected output | Earned versus reported/projected progress, exact requirement allocations, unmet/unresolved items and next eligible candidates |
| Failure states | Unknown course/grade/catalog: retain reported record and show what cannot be decided; conflicting edits: compare revisions; refresh failure: retain last result marked stale |

Do not label a code-only checkbox as registrar-verified completion. Display compact
provenance badges and expandable evidence; preserve V1's category/choice interaction
without forcing a large modal or marking historical courses locked by current rules.

## Journey 3 — Student with previous college or exam credits

| Stage | Proposed experience |
| --- | --- |
| Entry | Prior-credit question, “Add coursework”, or transfer-in exploration |
| Required information | Original institution, course/exam identity, term/date, credits/grade or score, original document evidence when separately authorized |
| Screens | Manual evidence form first → review candidates → destination evaluation → applicability audit; future transcript import enters the same review queue |
| Tool transitions | Original record remains distinct from tentative match and authorized transfer/exam award; confirm corrections before recalculation |
| Expected output | Reported/verified history, reviewed/pending equivalencies, accepted award scope and degree application shown separately |
| Failure states | Ambiguous same-code match, missing grade/year, incomplete A+B mapping, unsupported IB/AP policy: pending academic review, no credit guarantee; extraction fails: manual entry |

V1 has useful AP estimate and transcript-review UI but collapses evidence into code
sets. V2 must not repeat that authority shortcut. [AP] [EXTRACT] [IMPORT] [TRANSFER]
Guest uploads remain future security-gated work, not an implementation in this audit.

## Journey 4 — Prepare a semester plan

| Stage | Proposed experience |
| --- | --- |
| Entry | “Build a draft plan” from a current audit; chat may open the same module |
| Required information | Academic context/version, record revision, desired terms, workload cap, availability/modality preferences; separate hard and soft constraints |
| Screens | Constraint review → deterministic draft terms → course/slot detail + reasons → validate → save/export |
| Tool transitions | Planner consumes audit residuals and canonical rules; selecting an actual elective replaces a slot and revalidates; viewing the tree keeps selected term/context |
| Expected output | Complete or partial advisory plan, term loads, unmet conditions, offering certainty and unplaced requirements with reasons |
| Failure states | Impossible timeline: keep feasible terms and list residuals; unknown offerings: tentative label; invalid manual move: explain rule; stale inputs: require revalidation; AI failure: structured plan stays available |

The 46/4 example must read as “Partial draft: 46 credits placed; 4 required credits
unplaced”, with inspectable requirement IDs and blockers. These are a synthetic
regression scenario, not official BMCC totals. The plan view, summary, PDF/text and
advisor handoff must preserve the same incomplete status and warnings. Explain
possible actions—extend timeline, review preparation, resolve an elective—without
inventing a feasible graduation date. V1's retained-plan AI failure behavior is worth
preserving; its warning/report asymmetry is not. [PLAN] [REPORT] [STATE]

## Journey 5 — Explore a change of major

| Stage | Proposed experience |
| --- | --- |
| Entry | “Compare programs” → “Change major” from existing context |
| Required information | Source program/release, confirmed history, destination program/track/release and unresolved catalog assumptions |
| Screens | Destination search → side-by-side requirement applicability → affected plan → questions for advisor |
| Tool transitions | Create a hypothetical context using the same immutable history; run the same canonical audit with destination rules |
| Expected output | Applied/unapplied credits, destination unmet/unresolved requirements, source differences and draft next steps |
| Failure states | Destination unpublished, catalog entitlement unknown, overlap unsupported: unresolved; no automatic major change, no guarantee of program admission |

Preserve source context and saved plan until a separate confirmed context change.
Do not silently apply a comparison's assumptions to the student's active profile.
The same-campus comparison must not be a special independent credit calculator.

## Journey 6 — Consider transfer

| Stage | Proposed experience |
| --- | --- |
| Entry | “Compare programs” → “Transfer”, or explicit destination intent |
| Required information | Source institution/history, destination campus/program/release, grade/date evidence and relevant approved equivalency versions |
| Screens | Destination selection → directional evaluation → destination degree audit → unresolved evaluation list → optional hypothetical plan |
| Tool transitions | Transfer service produces tentative or authorized award inputs; audit determines applicability; map only explains destination rules |
| Expected output | Transferability distinct from degree applicability, combination mappings, residual requirements and reviewed source links |
| Failure states | No approved mapping, wrong direction/year/grade, same code only, incomplete combination: no inferred award; service/source unavailable: retain comparison with stale/unresolved state |

V1's destination selectors and source/destination framing are valuable. Replace its
cross-campus direct-code fallback and rough remaining/15-semester estimate with
validated context-specific results and honest unknowns. [TRANSFER] [EQAPI]

## Journey 7 — Prepare a report for a human advisor

| Stage | Proposed experience |
| --- | --- |
| Entry | “Prepare summary” from any validated or explicitly partial workspace |
| Required information | Exact profile/record/catalog/audit/plan revisions; unresolved issues; optional verified recipient and explicit selected-payload consent |
| Screens | Summary preview → choose fields/attachments → print/download OR consented handoff → status/revocation controls |
| Tool transitions | Report renders a frozen canonical snapshot; no recalculation or AI requirement on print/export; sharing is separate from downloading |
| Expected output | Same academic facts/warnings across HTML/text/PDF; minimal consented case for authorized advisor if handoff enabled |
| Failure states | Unvalidated/stale plan: visible warning; recipient/retention policy unconfirmed: handoff unavailable; guest expired: deny; delivery fails: keep local report while authorized; no claim of successful delivery |

V1 has actual conditional SMTP and manual fallback, not merely a decorative referral
button. Preserve the preview/consent intention while replacing broad unversioned
summary submission. Guest payload acceptance/retention/revocation must follow
[SECURITY.md](SECURITY.md), never extend all guest data beyond 24h. [REFUI] [REFERRAL]

## Completed Course Selector interaction contract

Make it a reusable workspace module with full-page and compact embedded layouts.
Show searchable catalog/evidence lists grouped by requirement; expanding a group
reveals course details, credit/count target, alternatives and accepted evidence.
Separate “record this past attempt” from “select this future course” so prerequisite
eligibility cannot prevent truthful historical entry. A student report can be missing
terms/grades and remain unresolved rather than being discarded.

Selection commits a record revision once; requirement allocation is returned by the
engine, not hand-edited by checkboxes. Show “reported complete”, “verified earned”,
“applicability pending”, “eligible under modeled rules”, and “offering unknown” as
independent dimensions. Never use one green dot to imply all are true. Removing a
selection creates a new revision with audit/plan invalidation and an undo path where
supported. Preserve requirement evidence and overlap explanations across categories.

## Degree Map Tree and planner transitions

The map is a projection of the canonical graph/rule model with current audit overlay,
not a second academic source. Fold category branches, expand course detail, highlight
ancestors/unlocks and show readable relation labels (prerequisite / co-requisite /
recommended). Alternative conditions need explicit AND/OR group nodes or equally
clear labels; a set of arrows is insufficient. Completion overlays reflect evidence
status and audit allocation without mutating graph definitions. Layout/pan state
stays local or separately saved; no academic writes on drag.

Use accessible list mode on small screens and as a full keyboard/screen-reader
alternative. “View in map” focuses the selected course without losing the audit
context; “Add to draft plan” creates a candidate and calls validation. Progress,
selector, graph and planner show the same revision badge and stale/error state.
Never silently change degree applicability because a category was collapsed.
Print/PDF exports include a legend, scope/catalog/version, visible uncertainties
and an accompanying requirement list; define all-branches versus current-view export.

## CMS-ready content and performance

Centralize editorial copy into message keys, templates and approved section/block
composition, with campus overrides and safe fallbacks. Leave academic rule evaluation,
source facts, requirement thresholds, consent payloads and permission enforcement in
their domain services. The CMS may reference approved facts; it cannot decide that a
course is eligible or remove protected warnings. This follows [CMS_DESIGN.md](CMS_DESIGN.md).

Lazy-load the interactive graph, memoize visible-node projections, avoid nested blur
in graphs, coalesce layout work and cap the initially visible subtree. Preserve
selection/focus across background refreshes; use brief optional transitions, never
animate the entire graph continuously. Benchmark before choosing a renderer or
layout engine; see the comparison in the inventory. No library is installed here.

## Future journey acceptance

Run all seven flows with synthetic evidence and AI disabled, slow/offline responses,
keyboard-only input, 375/768/1440px widths and reduced-motion preference. Confirm
one record change updates every projection consistently, no report loses residuals,
private data never appears in CMS, and unsupported rules remain explicit. These are
future tests: no authenticated V1 or new V2 academic browser workflows were tested
in Phase 01C. Exact source/UI/runtime distinctions remain part of every finding.

[CHAT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/cuny_beyond.js#L1-L845

[SELECT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L3098-L3615

[GRAPH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/curriculum_graph_service.py#L47-L282

[PLAN]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4035-L4310

[STATE]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4313-L4445

[BRANCH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/cuny_beyond.js#L398-L476

[HARD]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L1874-L2033

[AP]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L471-L505

[EXTRACT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L376-L445

[IMPORT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2488-L2558

[TRANSFER]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/transfer_analysis.html#L636-L840

[REPORT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2034-L2230

[EQAPI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1423-L1451

[REFUI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/cuny_beyond_referral.html#L1-L15

[REFERRAL]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L526-L684


## Phase 03B: campus entry and adaptive fictional context

The current journey is graph-first landing → direct BMCC node activation →
`/campus/bmcc` conversation →
one useful goal-dependent question → explicit supported academic action. Earlier
Phase 03A statements about a conversation-only default now refer to the campus
route; `/` contains the network landing. Known future campus routes contain only
an unavailable notice, never BMCC tools or fake chats. Bare historical BMCC hashes
and exact root context links deliberately migrate to the BMCC route.

The selected assistant supplies a perspective, not student enrollment. Current,
previous and intended institutions/programs remain distinct evidence-aware facts.
A student can report studying at LaGuardia while exploring BMCC or a future campus.
Only BMCC is currently operational. An exact bounded correction updates enrollment
without changing assistant identity; unsupported free text still discloses no AI.

Goals drive questions rather than a fixed survey. Exploration needs no coursework,
term or schedule information. Planning preparation asks relevant history/term/load
and keeps catalog uncertainty explicit; it does not produce a plan. Optional profile
review handles corrections/secondary goals. Details are in [profile](STUDENT_PROFILE_MODEL.md)
and [readiness](ADAPTIVE_ADVISING_READINESS.md). All facts are fictional/in-memory.

Client navigation to landing retains the independent profile but unmounts chat and
selector state; returning to the same assistant starts a new workspace conversation.
Full refresh clears profile/session too. Within a workspace, tool return preserves
conversation and selection. Explicit copy/confirm controls transfer fictional
selector history or selected draft context to profile, never credits or approval.

Owner review refinement: mouse click, tap and native Enter/Space on BMCC open its
assistant immediately. Hover/focus provides transient context; other campuses show
only an unavailable notice with a Dismiss button. Chat offers “Back to campuses.”
The graph stays spatial on mobile; only decorative arcs move, paused during
interaction and absent under reduced motion. No dashboard or module menu was added.

## Phase 04A — optional fictional natural conversation

BMCC chat shows a concise Google Gemini privacy notice only when the local backend is configured. Without consent, existing supported prompts remain. After consent, natural messages show user/AI-labelled responses, loading, safe fallback and allowlisted action buttons. Proposed profile/goal changes appear in a compact Apply/Discard review; stale context disables Apply. Confirmation recomputes the existing one-question readiness flow. No wizard, dashboard or default grades. Catalog/selector/progress retain exact context and unresolved outcomes.

See [Gemini gateway](GEMINI_GATEWAY.md), [orchestration](CONVERSATION_ORCHESTRATION.md) and [verification](PHASE_04A_VERIFICATION.md).
