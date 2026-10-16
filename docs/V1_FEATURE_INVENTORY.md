# V1 feature and architecture inventory

Phase 01C — documentation/read-only analysis. Source snapshot: V1 commit
`ba499bc078a4889ed7ed4ad2f381a5c6950753d3` (default-branch commit obtained through
read-only GitHub access). Review date: 2026-10-16. V2 branch:
`docs/phase01c-v1-audit`. This audit does not certify any academic policy or deployed behavior.

## Evidence, scope and limitations

- **S — source verified:** a route, data structure or code path exists in this pinned
  snapshot. This is not a passing execution test or proof of academic correctness.
- **D — documentation claimed:** README/guides describe a capability; code takes
  precedence when those descriptions differ.
- **U — UI observed:** none of the authenticated V1 academic screens was observed
  during this phase. The anonymous public reference fetch failed in the web tool;
  no login, production API probe or student-data submission followed. HTML/JS views
  below are **source-defined UI**, not live UI observations.
- **O — owner reported:** the 46-planned/4-unplaced example and favorable professor
  feedback come from the task. They are useful requirements, not independent verification.
- **T — additional testing needed:** every calculation, access-control behavior,
  browser workflow, export and performance claim needs isolated synthetic validation.

No verified local V1 checkout was available at the expected sibling path. Source
files were read through GitHub and placed in a temporary analysis cache outside both
repositories; V1 was never executed, imported, seeded, reformatted or changed.
Only version-controlled source and catalog samples were inspected. Committed chat
logs were deliberately not opened; no database, credentials, real student data,
PDF student documents or live AI services were used. Deployment revision, database
contents, flags, provider availability and institutional authority remain **unverified**.
The read-only recursive Git tree was inspected for file coverage; selected tests
were read, not executed. There is no claim that every repository line was reviewed.

This source is materially richer than the earlier V1 README-only planning reference.
In particular it includes active transcript-extraction code, governance drafts and
course-identity compatibility logic; describing them all as absent would be incorrect.
V1 `ARCHITECTURE.md` still calls transcript upload planned, whereas the current
entrypoint exposes extraction and the structured UI calls it: a documentation/code
disagreement, not evidence of deployment. [DOC] [EXTRACT] [CHAT]

## Source evidence register

Read-only cache coverage: 49 selected source/config/data/documentation/test files,
plus the complete recursive Git tree listing. This register identifies the main
review anchors; subsequent sections link finer ranges. The pinned commit is not
asserted to equal the running production deployment.

| File and lines | Functions / objects reviewed |
| --- | --- |
| [faq_fallback_api.py:37–61, 471–516](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L37-L61) | startup/create_all, session/CORS; primary/alternate/referral entry routes |
| [frontend/cuny_beyond.js:4–77, 398–476, 550–846](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/cuny_beyond.js#L398-L476) | draft state/TTL, nextStepFrom/showStep, program/course/AP/import/referral transitions |
| [frontend/db_progress_graph.html:2453–3032](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2453-L3032) | loadProgramRequirements, import/choice hydration, allPrereqsSatisfied, allocation/status helpers |
| [frontend/db_progress_graph.html:3098–3615](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L3098-L3615) | renderCompletedCourseGrid, choice modal, selection updates and postMessage |
| [frontend/db_progress_graph.html:4035–4445](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4035-L4445) | remainingRequiredCredits, buildDegreePlan, renderDegreePlan, generateAIStudyPlan and snapshots |
| [frontend/db_progress_graph.html:2034–2230, 4697–4804](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2034-L2230) | prospectus metrics/render/print and separate progress widget calculations |
| [curriculum_graph_service.py:47–283](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/curriculum_graph_service.py#L47-L282) | _layers, build_curriculum_graph, clusters/logic/overrides/layout |
| [frontend/curriculum_graph.js:1–308](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/curriculum_graph.js#L1-L307) | modal, nodeCard, layeredSubset, downstreamPath, render/drawEdges and printGraph |
| [frontend/transfer_analysis.html:636–840](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/transfer_analysis.html#L636-L840) | loadApprovedEquivalencies, analyzeTargetCourse, runTransferAnalysis, estimateTargetCredits |
| [models.py:8–570](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/models.py#L8-L570) | 29 ORM classes, columns, declared FKs/unique constraints |
| [api_db_routes.py:733–1407](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L733-L1407) | curriculum_validation, draft preview/status/versions/restore/publish |
| [api_db_routes.py:199–359, 1423–1451](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L199-L359) | governance publication/versioning and separately filtered equivalency lookup |
| [api_db_routes.py:1775–2206](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1775-L2206) | pools, build_course_payload, graph overrides/layout and requirements projection |
| [seed_database.py:218–315, 624–770, 1069–1125, 1388–1530](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/seed_database.py#L624-L770) | procedural DDL, parsing, source-to-model mapping, canonical prerequisite seeding, curriculum replacement |
| [faq_fallback_api.py:376–445, 526–684, 901–1015](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L901-L1015) | transcript/course recognition, consented SMTP/manual fallback, contextual AI and log handler |
| [auth.py:1–48](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/auth.py#L1-L47) | two environment-backed prototype roles and require_admin |
| [render.yaml](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/render.yaml) | primary build installs/seeds and starts faq_fallback_api; separate legacy app service is declared; deployment not contacted |

Referenced test files were inspected as text; no tests were imported or run. The
public reference URL could not be inspected through the web tool, so all academic
UI interactions in this inventory remain source-defined rather than live-observed.

## Architecture and entrypoints

The documented primary server is `faq_fallback_api.py`: FastAPI page routes,
SQLAlchemy database router, optional Gemini calls, session login and static assets.
It imports `models`, calls `Base.metadata.create_all` at module scope, and starts
an O*NET cache warmup at application lifespan. It is therefore unsafe to import as
an audit shortcut. `api_db_routes.py` has a `/api/db` router; `database.py` creates
an engine from environment configuration with a local SQLite fallback and PostgreSQL
URL normalization. Large HTML pages contain both rendering and academic algorithms.
[APP] [DB] [README]

At this commit `/advising-app_v1` serves `frontend/cuny_beyond.html` behind a session
check. `/advising-chatbot` is a separate narrative prototype; `/cuny-beyond` redirects
to the structured primary route. The current-student workspace and referral pages
have different entry guards. `app.py` is another FastAPI prototype using Chroma and
local Ollama embeddings/generation; it is not the documented main Gemini server.
Do not merge these experiences/providers into one claimed production architecture.
[ENTRY] [LEGACY]

| Layer | Principal files | Coupling / dependency |
| --- | --- | --- |
| Structured onboarding | `frontend/cuny_beyond.html`, `.js` | DOM wizard, localStorage draft, sessionStorage transfer/referral state, iframe planner |
| Selector / progress / planner | `frontend/db_progress_graph.html` (~4,800 lines) | Shared global sets and helper functions, direct DOM rendering, DB APIs, optional AI explanation |
| Degree map tree | `curriculum_graph_service.py`, `frontend/curriculum_graph.js` | Relational canonical rows plus visual overrides; custom DOM/SVG layout |
| Comparison | `frontend/transfer_analysis.html` | Browser snapshots, target requirements, approved equivalency API, separate credit calculations |
| Academic/admin data | `api_db_routes.py`, `models.py`, `seed_database.py` | ORM tables, CSV/JSON sources, JSON drafts, in-place publication and schema repair |
| AI / delivery | `faq_fallback_api.py`, `career_routes.py` | Gemini SDK, file settings/logs, optional SMTP, optional O*NET HTTP calls |

## A. Chat onboarding

**Status: S; runtime T.** `state` tracks profile, goal, employment, skills, prior-learning
selections, free answers, AP exams, transcript courses, current program, semester
standing and draft expiry. Current BMCC/CUNY status switches the program/career,
semester/skills, prior-learning/completed-course panels. Prospective working adults
receive an employment step; other prospective profiles skip it. Current first-semester
students see prior-learning review rather than the usual completed-course panel.
`nextStepFrom`, `previousStepFrom`, `showStep`, and `selectCurrentProgram` drive the
branches. Selected program supplies the closed course catalog for text recognition.
[CHAT] [BRANCH]

Structured choice paths are deterministic. Free-text interpretation can call
`/api/cuny-beyond/interpret` when AI assistance is enabled; returned values are
restricted to allowed UI values except skill text. The alternate narrative app
has its own `stage`, merge rules and `narrativeAdvisingDraftV1`; its backend interpreter
uses a deterministic fallback. These are distinct state machines, not one universal
chat flow. [FREE] [INTAKE]

`loadDraft` checks browser expiry, but `saveDraft` resets it on every save. This is
sliding client-side retention, not V2's fixed server-enforced 24h guest lifecycle.
Program context, imported coursework, transfer snapshot and referral summary are
copied into several storage keys. No durable student/account record is created by
these flows in the inspected ORM. Keep conversational branching, replace duplicated
state/persistence and avoid AI for known-choice navigation. [CHAT] [STATE] [MODELS]

## B. Completed Course Selector — preserve concept, redesign implementation

**Status: S; high-priority V2 module; runtime T.** The rich selector is part of the
standalone `/db-progress` page and is also embedded from chat in an iframe. It is
already more than a chatbot-only widget conceptually. [CHAT] [SELECT]

| Concern | Source behavior | V2 improvement |
| --- | --- | --- |
| Loading | `loadProgramRequirements` gets grouped requirements; `hydrateSingleChoiceGroups` loads each placeholder pool through choice-group API | One versioned context and explicit paginated/searchable course-pool contracts |
| Categories | `DISPLAY_AREAS`, `getGroupsByTypes`, `renderCompletedCourseGrid` group common/flexible core, major requirements/electives and support | Preserve progressive category selection with a non-graph accessible list |
| Completion | `DIRECT_COMPLETED_COURSES`, `CHOICE_SELECTIONS`, `COMPLETED_COURSES`; `rebuildCompletedCourses` synchronizes local selections | Store course-attempt evidence separately from requirement allocation; revisions server-owned |
| Prerequisites | Array entries are AND; nested arrays OR; group requirements use names | Typed rule expressions, stable IDs and canonical eligibility results |
| Status | `getCourseStatus`: completed / not_needed / available / locked | Separate completion, modeled eligibility, evidence uncertainty and offering availability; “available” is not a seat check |
| Electives | Choice modal, subject/sequence grouping, course details, credit/count limits, requirement-satisfied feedback | Preserve browse/search/detail; show remaining credits and exact rule evidence |
| Double use | Explicit requirements reserve courses from elective allocations; electives allocate sequentially using a `used` set | Global deterministic credit allocation with approved overlap policy, not group-order-dependent heuristics |
| Cross-tool updates | PostMessage carries codes to parent; snapshots copied into chat and transfer storage | Shared workspace module and revision-bound API invalidation, no iframe-owned truth |
| Uncertain inputs | Imported same-campus/blank-institution course codes and AP mappings can mark completion; recognition labels remain UI hints | Keep reported/verified/awarded evidence states and explicit confirmation rules |

Source: course payload and pool APIs [LOAD] [REQ], selector/choice rendering [SELECT],
allocation/status functions [ALLOC], import filtering [IMPORT], snapshot writes [STATE].

A course can appear in several requirement groups. V1 does attempt to prevent
required/elective reuse; this is not an entirely naïve sum. However non-elective
groups can still independently count the same completion, while electives allocate
by display order rather than optimizing all requirements. `allCoursesFromGroups`
collapses identities to course code and prefers a non-elective group. There is no
per-attempt grade, term, verification, transfer award or substitution object in these
sets. Complex overlap must therefore be treated as a correctness risk. [ALLOC] [PLAN]

AP has a CSV-backed estimate endpoint and UI selection; IB and broader CPL appear
as guidance rather than a verified award engine. Transfer courses remain snapshots,
not independently adjudicated credit records. No general approved student-specific
substitution workflow was found in the inspected selector/model. Do not substitute
“course alternative in catalog” for a personal exception. [AP] [EQ] [MODELS]

## C. Degree audit and progress

**Status: S heuristic modeled progress, not an official audit.** `groupCreditsCompleted`
handles alternative components, completion options, selected placeholders and a greedy
elective allocation. `groupRequirementSatisfied` also checks course-set counts.
`remainingRequiredCredits`, `prospectusMetrics`, `calculateGroupProgress` and
`updateProgressWidget` use related but non-identical aggregations. A count-only group
is checked using raw completed codes; the progress denominator may instead sum all
candidate credits. There is no complete grade/GPA/repeat/residency audit engine here.
[ALLOC] [PROGRESS] [REPORT] [PLAN]

Hardcoded rules include BMCC-only writing-intensive confirmation, a 99% display cap
when it is not confirmed, latest/specific degree-map filenames selected by program
code, default credit loads and grouping names. Writing intensive is browser boolean
state, not verified section evidence. Source samples also conflict: `cs_courses.csv`
labels catalog 2025–2026 while the hardcoded map selects 2026–2027; required common-core
rows sum differently from the declared group target. These are reconciliation issues,
not corrections this audit is authorized to make. [HARD] [PROGRESS] [CSCSV] [MAP]

The selector and planner share several local helpers, which is a strength, but the
transfer page recalculates applicability with different logic. The degree tree has
its own overrides and rendering semantics. V2 must produce one audit result with
explicit allocations and unresolved rules for all views. [TRANSFER] [GRAPH]

## D. Degree planner and incomplete timelines

**Status: S deterministic heuristic; AI commentary optional; academic feasibility T.**
`buildDegreePlan` works in the browser. It constructs required courses and synthetic
3-credit elective slots (last slot can be smaller), excludes preparation-support
courses, filters against a separately loaded degree map when present, and simulates
completion semester by semester. It admits courses using prerequisites satisfied
at semester start; it does not unlock ordinary prerequisites within that same term.
Within each term it greedily prioritizes official-map placement, unlock counts and
group diversity, permits at most six courses and 18 credits, and stops around the
target load minus one credit. Fall/spring sequence and workload weights are local
heuristics. This is not a constraint solver or proof that a requested timeline works.
[PLAN]

Corequisite relations visible in the graph are not consumed by `allPrereqsSatisfied`
or `buildDegreePlan`; no same-term corequisite-bundle validation occurs there.
Course-offering/section data is not part of planning. The optional schedule-provider
service currently returns not-ready states, including adapter-pending even after
configuration/approval checks; it supplies a search fallback rather than a live
section adapter. [SCHEDULE] Degree-map notes mention a
co-requisite, but text in JSON is not executable enforcement. Missing preparation,
map-excluded courses, conflicting group totals, horizon limits and greedy selection
can leave work unplaced. [ALLOC] [GRAPH] [PLAN] [MAP]

### Owner-reported “46 planned, 4 required unplaced”

`renderDegreePlan` computes `max(0, remainingRequiredCredits(currentCompleted) −
sum(planned semester credits))` and displays a warning when nonzero. Thus a modeled
remaining total of 50 and placed total of 46 yields the reported four-credit warning.
This arithmetic is verified from source; the actual student's inputs/program and
exact root cause are **unverified**. No transcript or production replay was attempted.
The value is an aggregate difference, not a list of four specific unmet credits or
a validated residual audit. Placeholder credit and overlap can distort it. [PLAN]

Representation is inconsistent across surfaces:

- Main planner displays explicit unplaced-credit warning and suggests a longer
  timeline/review of prerequisites. Plan objects contain semesters/courses/credits,
  not a structured `unplacedRequirements` collection or reason codes.
- Prospectus says remaining versus planned totals but does not reuse the explicit
  incomplete-plan warning; saved chatbot artifacts copy UI text plus semesters.
- Chat summary counts terms/credits; referral HTML lists saved terms; plain-text
  download omits the saved degree-plan detail included by the HTML and SMTP path.
- `generateAIStudyPlan` renders first, catches explanation failures, retains the
  structured plan, and opens the prospectus in `finally`. Preserve this strength.

Evidence: [PLAN] [REPORT] [STATE] [CHAT] [REFUI] [REFERRAL]. V2 acceptance must retain
unplaced items and reason codes in every plan/report/handoff without AI. Require a
synthetic 50-required/46-placed fixture and inspect the residual audit, not just sums.

## E. Degree Map Tree — preserve concept, redesign implementation

**Status: S custom graph service/DOM-SVG renderer; runtime/performance T.** The graph
payload includes numeric-ID course nodes, requirement/elective clusters, prerequisite
edges with OR group IDs, overrides for prerequisite/corequisite/recommended edges,
layers, cycle candidates, layout offsets and a program-specific preferred root.
Category cards are visual clusters, not an executable general requirement AST. [GRAPH]

`_layers` topologically sorts prerequisite edges and places unresolved nodes in a
last layer. Its `cycle_node_ids` can include downstream blocked nodes, not just the
strongly connected cycle members. OR alternatives are counted as independent inbound
edges for layout; layout does not decide eligibility. The graph service does not
carry all requirement completion options/group-threshold semantics used by the audit.
[GRAPH] [REQ]

`curriculum_graph.js` creates course buttons and collapsed `<details>` branches,
expands details, highlights downstream dependencies, and marks completed course codes.
It measures DOM boxes and draws cubic SVG paths, scheduling redraws through
requestAnimationFrame, a delayed redraw and ResizeObserver. Main-node edges are
queried repeatedly; collapsed/secondary nodes are not all rendered as global
connections. `relationshipSummary` joins incoming relation groups using generic
“Needs” prose, which can conflate recommended/corequisite semantics. No graph library,
viewport virtualization or measured large-graph guarantee is established. [RENDER]

The admin constructor supports selecting/connecting nodes, dragging main cards,
CSV relationship import, reversible edge overrides and saved offsets. API rejects
self-loops and cross-campus endpoints, but does not reject multi-node prerequisite
cycles or require academic review before saved overrides reach the tree. Those
overrides do not feed `build_course_payload`, so a changed graph can disagree with
selector/planner eligibility. Layout and academic relationship edits need different
permissions and publication pipelines. [GRAPHUI] [GRAPHADMIN] [LOAD]

PDF is browser `window.print`, not a server-generated degree-map document. The
current graph print function does not itself expand every collapsed branch; export
coverage and print pagination need browser testing. [RENDER]

### Renderer/layout options for V2 (recommendation, not installed)

| Approach | Value | Cost / limitation |
| --- | --- | --- |
| V1 DOM + SVG | Small, inspectable; native category disclosure worth preserving | Manual measurement/routing, global state, duplicated layout, fragile large exports |
| React Flow / XYFlow | React interaction/rendering substrate for typed custom nodes and edges | New bundle/integration; still needs academic validation and accessibility testing |
| ELK.js | Separate automatic layered placement/routing candidate | Layout only, not an academic engine or UI; must encode alternatives/corequisite groups correctly |
| React Flow + worker ELK | Promising separation of view, layout and canonical academic data | Benchmark and approve before adoption; keep list view and printable projection independent |

React Flow documents keyboard/screen-reader support and performance practices such
as memoization, collapsed subtrees and simpler styling. These support a candidate
implementation, not automatic accessibility/performance certification.
[Accessibility](https://reactflow.dev/learn/advanced-use/accessibility),
[performance](https://reactflow.dev/learn/advanced-use/performance).
ELK.js documents layered algorithms and Web Worker support for costly layout;
it does not render the UI. [ELK.js](https://github.com/kieler/elkjs).
References checked 2026-10-16; no packages installed. The recommendation is a future
measured spike with list/print fallbacks, not an irreversible library decision.

## F. Major change and transfer

**Status: S browser comparison; runtime academic validity T.** Source snapshot and
destination intent drive institution/program selection. Approved cross-campus
rules support `A + B` source combinations. The schema already has direction,
minimum grade, catalog start/end, status and source-reference fields; it is incorrect
to say these are all absent. [EQ] [EQCSV] [TRANSFER]

Enforcement is weaker than representation: the matches API filters source, target
and approved status, not academic year or grade. The browser checks combination
presence and unused source codes for approved rules, then falls back to direct code,
alternative code and choice-pool membership. These fallbacks do not apply the same
used-source guard; same code across campuses is not proof of equivalence. Aggregation
iterates every target candidate instead of reusing audit allocations; it can overcount
alternatives/elective pools. A semester estimate divides residual credits by 15.
[EQAPI] [TRANSFER]

Reuse side-by-side comparison and explicit uncertainty. Replace the computation
with scoped transfer evaluation followed by the canonical destination audit; never
copy “satisfied” browser flags into official transfer awards.

## G. AI advisor

**Status: S optional Gemini in main app; local Ollama/Chroma in separate prototype;
live providers T.** Main routes include FAQ fallback, contextual progress/generic
agent, current-student agent, structured/narrative intake interpretation, transcript
extraction and closed-catalog manual course recognition. `run_contextual_agent`
passes client-supplied question/context and configurable prompt to Gemini, returning
free-form text and token/latency metadata. There is no server-verified audit snapshot,
typed tool loop, budget reservation, output academic-claim validator or bounded
context contract in that method. Prompt instructions are safeguards, not enforcement.
[APP] [AI] [FREE] [EXTRACT] [LEGACY]

No inspected route directly writes academic catalog rules based on AI prose.
However recognition/extraction results can become student completion codes after
UI confirmation, and free-form prose is rendered as advice without deterministic
claim validation. This can influence downstream eligibility despite not being an
institutional award. Transcript endpoint checks MIME and 8MB limit, sends bytes to
Gemini and returns bounded draft rows; no quarantine/scan/isolated parser workflow
was found there. Do not copy it as a privacy-safe V2 upload implementation. [EXTRACT] [IMPORT]

Narrative intake catches failures and uses deterministic extraction. Structured
free-text interpretation can fail and require a retry/manual choice. The planner's
AI failure preserves its structured plan; transfer explanation has a separate
90-second/two-attempt request helper. The contextual backend method does not provide
that same fallback. Preserve the optional explanation concept, replace the gateway,
state grounding, metering, privacy and error contract. [FREE] [PLAN] [AI] [TRANSFER]

File settings can include an API key (public settings hide it). Logging defaults on
and stores question, answer, IP and selected course context. The `/api/db/advisor-logs`
handler has no authentication dependency in inspected source. No production log
was requested. This is an urgent source-level access/privacy concern, not a tested
claim of live exposure. [APP] [LOG]

## H. Reports and human advisor handoff

**Status: S browser print/text and conditional SMTP; delivery T.** Planner prospectus
includes program/catalog, metrics, terms, commentary and disclaimer, with browser
print/save PDF. Saved artifacts are browser-local JSON; no server plan/report/student
ORM tables were found. Referral HTML renders the local summary, prints it, downloads
text and requests consent plus contact fields. The API validates consent, sanitizes
bounded fields and conditionally sends SMTP to an environment-configured recipient,
copying the submitted student email; otherwise it returns a prepared manual message.
No live email was sent. [REPORT] [STATE] [REFUI] [REFERRAL] [MODELS]

This is more than suggested UI, but it is not V2's authenticated advisor inbox,
recipient acceptance, independently retained consented case, revocation or verified
account conversion. Consent and expiry are not tied to a server-owned immutable
payload/version. The plain-text/HTML/SMTP report variants differ in included plan
information. Preserve the review-and-share intention; redesign a single report model
with explicit incomplete-plan warnings and scoped consent.

## I. Administration and content

**Status: S several admin tools, not a full scoped CMS.** Catalog/program data views,
institution CRUD, equivalency CRUD, major-constructor drafts, preview, validation,
version snapshots, review/approval/status transitions, publishing and version restore
exist. Separate governance drafts cover career/skill/program-career/CPL/transfer
resources; schedule-provider settings record approval/configuration metadata. [DRAFT]
[GOV] [GRAPHADMIN] [MODELS]

All those workflow labels do not establish academic reviewer identity or authority.
`require_admin` checks one global admin role, and a single admin can propose, approve
and publish. Some institution-mutating routes lack that dependency, and main app
route protection is inconsistent; no global authorization dependency is declared
on the DB router. Institution mutations are visible at [api_db_routes.py:1515–1604](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1515-L1604); the unguarded advisor-log handler is [LOG].
Shared environment accounts are not scoped college/department/
faculty roles. Treat this as a redesign requirement, not a request to patch V1.
[AUTH] [APP] [GOV] [DRAFT]

UI labels/templates are embedded across JS and HTML; academic draft JSON is not an
approved-block CMS. No verified faculty identity/submission layer was found in these
models/routes. Preserve draft-preview-version concepts, but keep CMS text/layout,
academic approval and faculty contributions separate in V2.

## Audit conclusions and testing backlog

Highest-value concepts: reusable completed-course workspace, interactive degree map,
structured planning that survives AI failure, destination comparison, and reviewable
advisor summaries. Largest risks: divergent rules/state, mutable catalog history,
incomplete-plan loss across exports, weak source/authority enforcement, and private
input/log handling. Details and target mapping: [data audit](V1_DATA_AUDIT.md),
[migration strategy](V1_TO_V2_MIGRATION.md), [workflows](UX_WORKFLOWS.md),
[engine boundaries](ACADEMIC_ENGINE_BOUNDARIES.md).

Before implementation acceptance: isolate synthetic catalog fixtures; compare all
views for overlaps, co-requisites, repeats and expired transfer rules; reproduce
partial plans and AI outage; test permission denial, consent revocation, fixed guest
expiry, graph alternative/cycle rendering and multi-page print. Existing source tests
include both behavioral helper tests and many source-string assertions. Reading them
is not executing them and their presence does not prove correctness. [TESTSELECT]
[TESTGRAPH] [TESTREPORT]

[DOC]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/ARCHITECTURE.md#L1-L176

[EXTRACT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L376-L445

[CHAT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/cuny_beyond.js#L1-L845

[APP]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L1-L171

[DB]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/database.py#L1-L44

[README]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/README.md#L1-L249

[ENTRY]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L471-L516

[LEGACY]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/app.py#L1-L180

[BRANCH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/cuny_beyond.js#L398-L476

[FREE]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L255-L374

[INTAKE]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/advising_chatbot.js#L1-L160

[STATE]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4313-L4445

[MODELS]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/models.py#L1-L570

[SELECT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L3098-L3615

[LOAD]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1775-L1931

[REQ]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L2112-L2206

[ALLOC]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2727-L3032

[IMPORT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2488-L2558

[PLAN]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4035-L4310

[AP]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L471-L505

[EQ]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/models.py#L33-L83

[PROGRESS]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4697-L4804

[REPORT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2034-L2230

[HARD]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L1874-L2033

[CSCSV]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/cs_courses.csv#L1-L31

[MAP]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/bmcc_cs_degree_map_2026_2027.json#L1-L46

[TRANSFER]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/transfer_analysis.html#L636-L840

[GRAPH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/curriculum_graph_service.py#L47-L282

[REFUI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/cuny_beyond_referral.html#L1-L15

[REFERRAL]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L526-L684

[RENDER]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/curriculum_graph.js#L1-L307

[GRAPHUI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/curriculum_graph_admin.html#L90-L188

[GRAPHADMIN]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1984-L2103

[EQCSV]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/course_equivalencies.csv#L1-L10

[EQAPI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1423-L1451

[AI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L901-L980

[LOG]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L982-L1015

[DRAFT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L733-L1407

[GOV]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L199-L359

[AUTH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/auth.py#L1-L47

[TESTSELECT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/tests/test_complete_course_selectors.py#L1-L64

[TESTGRAPH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/tests/test_curriculum_graph_module.py#L1-L129

[TESTREPORT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/tests/test_progress_prospectus.py#L1-L120

[SCHEDULE]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/schedule_provider_service.py#L74-L99
