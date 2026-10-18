# Implementation roadmap

Status: proposed sequence with bounded implementation, 2026-10-17.
Phases 03A/03B and 04A are merged. Phase 04B is merged through PR #12. Phase 04C-1 BMCC source browsing/ingestion is implemented for owner PR review; Phase 04C-2 remains gated.
No schedule, staffing, institutional participation, or infrastructure is committed.
Later phases require explicit user authorization and the gates below.

## Phase 04C-1 — BMCC catalog ingestion (implemented for owner review)

Source-backed 2025–2026 Bulletin browsing snapshot, separate from existing 2026–2027
CS/CIS audit drafts. Explicit source collection, offline staging, source-fact review,
coverage/discrepancy reporting and immutable migration/import. 18 academic departments
plus one offering unit, 67 program-list identities, 1,263 credit courses. Two ambiguous
Italian codes remain quarantined; all new structured eligibility interpretations remain
unresolved. Supporting website texts have unconfirmed year applicability.

Read-only source catalog API and an on-demand BMCC course browser preserve chat-first
UX, exact credits, four-column selector/progress and existing releases. No requirement
publication, evaluator change, other-campus activation, Gemini, student records,
registration or deployment. [Design, sources and coverage](BMCC_CATALOG_INGESTION.md),
[actual verification](PHASE_04C1_VERIFICATION.md). Dedicated PR requires owner review.
Full program-specific requirements and validation belong to separately authorized 04C-2.

## Phase 04B — Institutional registry (implemented for owner review)

Reviewed 2026-10-17 CUNY scope: 26 institutions, 11 senior / 7 community /
7 graduate-professional / 1 consortial honors. Append-only normalized tables,
explicit migration/import, typed read-only API and API-driven constellation replace
the static subset. BMCC alone retains academic tools. No new curriculum, academic
rules, records, provider changes, production deployment or institutional approval.

Acceptance evidence: [registry design/source mapping](INSTITUTIONAL_REGISTRY.md),
[executed verification](PHASE_04B_VERIFICATION.md), full PostgreSQL regressions,
responsive browser checks and actual local PostgreSQL → FastAPI → Next.js workflow.
Gemini live verification remains pending/unavailable, not an exit dependency here.
Historical Phase 04B delivery required owner review; it is now merged through PR #12.

## Phase 03B — Multi-campus profile foundation (implemented, historical slice)

Typed campus registry and premium constellation entry; BMCC-scoped shared chat;
campus-neutral profile/session evidence and deterministic goal-dependent readiness/
questions. Future campus routes remain unavailable. No new academic rules, catalogs,
backend/schema changes, student persistence, AI, planner or handoff implementation.

Acceptance: names/types source-mapped; campus selection does not enroll a student;
legacy links migrate safely; profiles distinguish institutions, stages, provenance
and uncertainty; corrections invalidate dependent assumptions; missing applicability
stays explicit; no fixed wizard/percentage; keyboard/touch/reduced-motion and
375/768/1440px screenshots reviewed. Run unit/browser/backend regressions plus
lint/typecheck/build and scoped diff checks. [Actual verification](PHASE_03B_VERIFICATION.md)
is separate from planned tests. Owner reviews PR before merge; no deployment/next phase.

## Phase 03A — Minimalist chat-first UX (implemented, merged PR #9)

Refine the implemented workspace into a sole chat default and focused contextual
tools. Preserve all academic/backend/persistence behavior, session-only state and
exact allocation strings. Compact V1-inspired four-column cards hide technical
identities by default and disclose captured details and unresolved evidence.
No live AI, academic logic changes, records, planner, schema changes or deployment.

Acceptance: conversation actions/deep links open tools; return restores focus and
state; no persistent dashboard/menu or catalog selector on home; 375/768/1440px
readability and overflow checks; expandable details, unresolved empty pools,
release clearing/history/refresh behavior; screenshot self-review; frontend unit,
Playwright, lint/typecheck/build and backend unit regressions. PostgreSQL integration
rerun is conditional on backend changes (none planned). Actual results live in
[Phase 03A verification](PHASE_03A_VERIFICATION.md). Owner reviews the scoped PR;
this does not complete broader student-record, AI, academic governance or pilot gates.

## Phase 00 — Planning

Deliver AGENTS.md and ten linked planning documents: product requirements,
architecture, scenarios, data model, AI strategy, this roadmap, security, CMS design,
access control, and decisions. Separate facts
and assumptions, record V1 reference scope, identify future owners and blockers.

Exit: requested files exist, links and requirements align, no application code or
deployment is introduced, and unrelated local changes are preserved. Summarize
the documents and stop. Planning completion does not resolve academic or legal
questions and does not grant permission to start Phase 01.

## Phase 01A — Local application skeleton (authorized subset)

Third-prompt scope: Next.js App Router, TypeScript and Tailwind; FastAPI with
`GET /api/v1/health`; English landing page and local connectivity status; pytest;
frontend lint/typecheck/build; safe environment examples, README and basic CI.
The frontend's `/api/health` is a fixed local proxy with timeout, contract validation
and safe unavailable response. The backend health check is process liveness only.

Acceptance: backend tests pass; frontend lint, typecheck and build pass; local
health/proxy success and backend-unavailable behavior are checked. CI defines the
same checks but is not claimed to have run on GitHub. No authentication, accounts,
database models/migrations, CMS, Gemini, academic engine or transcript handling.
No deployment, production access, real student data, commit or push. This subset
does not satisfy the broader Phase 01 checklist below. Stop after reporting results.

## Phase 01B — Light Frosted Glass design system (authorized subset)

Frontend-only tokens, semantic glass primitives, accessible navigation, English
landing-page visuals, explicitly static feature previews and ConnectivityStatus
styling. Preserve its fetching/status behavior, noindex, institutional disclosure
and the health proxy. No backend/endpoints/schema/test changes or new product
workflows. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for usage and verification.

Acceptance: readable palette; native keyboard controls and skip navigation;
375/768/1440px browser checks where available; solid backdrop-filter fallback and
reduced-motion support; frontend lint/typecheck/build, lightweight token contrast
checks and git diff --check. Existing npm advisories remain documented debt; no
package/security remediation scope is implied. No auth, accounts, persistence,
AI, academic tools, uploads, CMS, deployment, commit, push or PR. Stop for owner
review of the local UI; this does not complete the broader Phase 01 below.

## Phase 01C — V1 feature, architecture and data audit (historical scope)

Read V1 source at a pinned revision without executing/importing it or connecting
to its database. Document source-verified, UI-observed, documentation-claimed,
owner-reported and runtime-unverified evidence separately. Preserve uncommitted
Phase 01B work. Deliver [feature inventory](V1_FEATURE_INVENTORY.md),
[data audit](V1_DATA_AUDIT.md), [modernization strategy](V1_TO_V2_MIGRATION.md),
[UX workflows](UX_WORKFLOWS.md), and [engine boundaries](ACADEMIC_ENGINE_BOUNDARIES.md).

The owner-directed baseline is evolutionary modernization: preserve the rich
Completed Course Selector and Degree Map Tree concepts, keep deterministic planning
usable without AI, and redesign state, rules, privacy and academic governance.
Acceptance: cite source revision/files/functions/lines; inspect declared ORM and
safe catalog samples; cover all requested workflows and the partial-plan case;
label unavailable runtime/UI evidence; validate document links and git diff --check.
No application code/refactor, database changes, dependencies, production database
connections, credentials, real data, live AI, V1 writes, commit, push, PR or deployment.
Stop for owner review; none of the recommendations below authorizes implementation.

### Recommended dependency ordering after review

Within later separately authorized phases: reconcile a narrow source-backed BMCC
catalog and synthetic academic fixtures → canonical evidence/identity/rule contracts
and deterministic audit → reusable selector/progress vertical slice → read-only
map/list projection → deterministic partial-plan validation → canonical destination
comparison and report parity → optional Gemini explanation → security-gated
transcripts/CPL/CMS/integrations. Identity/access/retention gates apply whenever
private state is introduced. This is not a replacement of roadmap safety gates.

The map merits early development alongside selector/progress, rather than being
an optional late visualization. Benchmark React Flow/XYFlow and ELK before choosing
them. A partial 50-required/46-placed synthetic plan must preserve residuals and
reasons in every view/export even with AI disabled. No legacy production migration
is presumed; reviewed source staging is the preferred future data path.

## Phase 01 — Foundation and synthetic boundaries

After authorization, select supported dependency versions and define monorepo
layout, Next.js/TypeScript/Tailwind frontend, FastAPI API, PostgreSQL, SQLAlchemy, Alembic,
typed contracts, synthetic fixtures, email/password and guest-session foundations,
and CI. Use an isolated `cuny_advisor_v2` schema in disposable V2-only resources. Establish
campus scope, role/action model, secret handling, redacted logs, and job contracts.
No real data or institutional account integration is needed.

Exit: the Phase 01 acceptance checklist below passes using synthetic data;
no production database, real student data, external SSO or institutional system
is needed. Produce a reviewable implementation before proposing
any external deployment. Owner: technical lead, to be assigned.

### Phase 01 acceptance criteria — future implementation, not tests run now

Use synthetic identities, academic data, files and approval evidence. An explicit
Phase 01 authorization permits its agreed local implementation only; deployment,
real-data processing and production connections remain excluded.

- **Stack and isolation:** Next.js/TypeScript/Tailwind and FastAPI modular-monolith
  boundaries documented and runnable locally; SQLAlchemy metadata, Alembic version
  table and migrations explicitly use `cuny_advisor_v2`. Disposable V2 database roles
  deny access to a synthetic foreign/V1-like schema and runtime DDL. No V1 connection.
- **Authentication:** synthetic email/password registration, verified-email gate,
  login/logout/reset, secure session and CSRF behavior demonstrated. Use a local
  verification-message sink, not external email. Expired/reset token replay and
  account enumeration tests pass. Future SSO is a contract, not a live integration.
- **Guest lifecycle:** guest cookie authorizes only its workspace; deterministic
  fake-clock tests deny access exactly at 24h across API, downloads, streams and
  queued jobs. Lifecycle worker removes synthetic files/derivatives within the 1h
  purge target and reports failure. Expiry does not depend on worker availability.
- **Registered persistence and conversion:** a minimal synthetic profile and draft
  plan resume after a new session; progress/report ownership contracts are defined.
  Selected-data conversion requires active guest possession plus verified account
  authentication. Concurrent claims have one winner; failure preserves expiry;
  guest tokens fail after success; no implicit merge by email.
- **Role matrix and delegation:** positive/negative tests cover all nine role rows
  in [access control](ACCESS_CONTROL.md), department/program scope, revoked/expired
  parent grants, self-escalation, self-approval and cross-campus IDs. Super Admin
  without independent academic authority cannot approve academic content or read
  student records. Synthetic faculty verification is clearly distinct from real proof.
- **Approval foundation:** revision-bound proposal/review/publication state contracts
  reject stale approvals, unverified faculty and unauthorized academic reviewers.
  Official catalog and faculty contribution types remain separate. Full academic
  engine/editor delivery belongs to later phases.
- **Consent boundary:** synthetic summary preview and handoff consent/state contracts
  show recipient, payload, purpose, retention deadline and attachment choice. Deny
  unconsented, revoked or expired handoff and default transcript disclosure. No
  external delivery; full advisor case UI follows in Phase 06.
- **CMS foundation:** typed approved-block and campus-override contracts reject
  arbitrary HTML/code and cross-campus publication; preview and publish permissions
  are separate. Specify revision/rollback events and keyboard ordering. Full editor
  and rendering acceptance is required in Phase 06.
- **Security and reliability:** private storage adapter, scoped authorization proxy,
  redacted logs, idempotent jobs, late-write tombstones and bounded budget contracts
  are tested with synthetic inputs. Upload parsing and live Gemini remain disabled
  until their respective phase gates. Privileged account MFA gate is modeled and
  tested before privileged real access is enabled.
- **Review evidence:** CI reports contract, migration, isolation and lifecycle results;
  English-only labels and limitations are visible in initial UI. Record unimplemented
  later-phase features rather than claiming production readiness.

## Phase 02 — Catalog governance and academic engine

### Phase 02A — Implemented subset, merged through PR #5

Typed immutable campus/course/program/release/provenance/requirement contracts,
constrained nested expressions, a pure in-memory evaluator, global validation of
explicit allocation proposals and read-only selector/condition projections.
The small BMCC CS A.S. 2026–2027 draft fixture separates source-verified and
provisional assertions; fictional policies/histories live in separate test fixtures.
Four columns and both mathematics paths are regression contracts. Source mapping,
model limitations and preserved behavior are documented in
[BMCC_CATALOG_SOURCE_MAPPING.md](BMCC_CATALOG_SOURCE_MAPPING.md),
[ACADEMIC_RULES_MODEL.md](ACADEMIC_RULES_MODEL.md), and
[V1_SELECTOR_PARITY.md](V1_SELECTOR_PARITY.md).

Acceptance: tests cover all twelve requested cases, plus invalid references,
campus/release context, immutable replay, missing grades/classifications, invalid
allocation and unsupported overlap. The full-degree result stays unresolved.
No new dependency, endpoint, frontend behavior, database, publication workflow,
student storage, graph UI, planner, AI, production access or real records.
Existing health contract and route-scope tests remain unchanged. No V1 writes,
production access or deployment. The later final-review instruction authorizes one
reviewed commit, feature-branch push and PR to `main`; never merge or begin Phase 02B.
Stop for owner review of the PR.

Verification on 2026-10-16: `cd backend && .venv/bin/python -m pytest -q`:
**35 passed in 0.17s**, including four unchanged health tests. `.venv/bin/python -m
pip check`: no broken requirements (only an unwritable pip-cache warning).
`ruff check backend/app backend/tests`: passed; `black --check backend/app/academic
backend/tests/academic_factory.py backend/tests/test_academic.py`: seven files
unchanged. Locally available Ruff 0.12.0 and Black 25.9.0 were not added as dependencies.
`node --test frontend/scripts/design-contrast.test.mjs`: nine passed;
`npm --prefix frontend run lint`, `npm --prefix frontend run typecheck`, and
`NEXT_TELEMETRY_DISABLED=1 npm --prefix frontend run build`: exit 0. No frontend
source changed; the generated `next-env.d.ts` build artifact was restored to HEAD.
`git diff --check` and changed/new-file whitespace/relative Markdown link checks
passed. Scope review found only authorized academic prototype/tests and documents.
Existing CI discovers all pytest cases but no GitHub Actions execution is claimed.
No browser academic smoke test: no academic UI was built. Existing npm advisories
remain unchanged technical debt.

Final review: fetched `origin/main` matches the feature branch's pre-commit base
`c0e14eadbd19b375d992a3cb0436cbe103d39338`; no rebase/reset is needed. The owner
independently ran the initial suite on macOS: 35 passed in 0.15s. Review adds
course-metadata evidence gating, unresolved missing catalog credit, and a second
fictional program reuse/empty-column regression. Credit sums now use an isolated
Decimal context with sufficient precision for exact addition and caller-independent
replay. Source authority, full allocation,
governance, production readiness and later-phase gates remain unchanged.

Final-review verification on 2026-10-16: backend pytest **48 passed in 0.22s**
(44 academic cases and four unchanged health tests); Ruff and Black passed;
pip check found no broken requirements. Frontend contrast tests: **9 passed**;
lint, typecheck and build: exit 0. Generated Next type references were restored;
no frontend source changes are included. Relative documentation links, changed/new
file whitespace, targeted sensitive-content inspection and `git diff --check`
passed. No unrelated files, dependencies, endpoint changes or student data were
found in the reviewed scope. CI execution/status belongs in the PR report.

Suggested Phase 02B, not authorized: reconcile STEM/overlap, grade/placement and
discipline policies; capture reviewable immutable sources; exercise another
program/year; propose a narrow read-only selector/list integration. Review any
schema/API commitments before implementing them. Phase 02A does not satisfy the
full governance/engine exit criteria below or the broader Phase 01 security gates.

The preceding recommendation records the Phase 02A gate at that time. The owner's
subsequent Phase 02B authorization permits only the bounded subset below.

### Phase 02B — Academic evidence and policy reconciliation

Implemented in-memory Source scope/date/conflict/unresolved contracts, pure evidence
validation, synthetic non-credit placement/exemption/waiver claims with no awards,
shared category vocabulary, a new CS evidence revision and a partial CIS A.A.S.
2026–2027 fixture. Original Phase 02A fixtures are unchanged. A golden fictional
historical snapshot retains `02a.1`; new-engine recomputation is labeled `02b.1`.

Manual official-source review and unanswered questions are in
[ACADEMIC_POLICY_EVIDENCE.md](ACADEMIC_POLICY_EVIDENCE.md), with updated
[source mapping](BMCC_CATALOG_SOURCE_MAPPING.md), [rules model](ACADEMIC_RULES_MODEL.md)
and [second-program validation](SECOND_PROGRAM_VALIDATION.md). Broader CUNY STEM
guidance is not a complete BMCC allocation policy. Missing grades, credits,
classifications, grouping, year applicability and CR/TR source disagreement remain
explicit. No full-degree audit, rule publication or institutional approval.

Acceptance: preserve all Phase 02A regressions, test unsupported overlap, non-credit
claims, missing/provisional/conflicting sources, grades/prerequisites, discipline
and elective metadata, scoped campus/program/year isolation, second-program reuse,
historical retention and JSON round-trip. Run existing backend/frontend checks and
review every changed/untracked file. No new dependencies, endpoints, frontend work,
database/ORM/migrations, real records, AI, transcripts or production connections.

The owner authorizes a scoped commit, normal push of
`feature/phase02b-catalog-evidence` and PR targeting `main` after verification. Stop
for owner review; no merge or deployment. [Phase 02C persistence](PERSISTENCE_DESIGN_PHASE_02C.md)
is a proposal only, covering normalization, immutable releases/evidence, isolated
`cuny_advisor_v2` SQLAlchemy/Alembic boundaries, staged imports and future integrity
tests. It is not permission to implement or provision any database.

Actual Phase 02B verification, 2026-10-16:

| Check | Result |
| --- | --- |
| `cd backend && .venv/bin/python -m pytest -q` | 70 passed in 0.20s; all original 48 regressions preserved |
| `ruff check backend/app backend/tests` | Passed |
| `black --check backend/app/academic backend/tests/academic_factory.py backend/tests/test_academic.py backend/tests/test_catalog_evidence.py` | Nine files unchanged |
| Backend `.venv/bin/python -m pip check` | No broken requirements; only unwritable cache warning |
| `node --test frontend/scripts/design-contrast.test.mjs` | Nine passed |
| `npm --prefix frontend run lint` / `typecheck` | Exit 0 |
| `NEXT_TELEMETRY_DISABLED=1 npm --prefix frontend run build` | Exit 0; generated Next type references restored, no frontend source changes |
| Changed/new Markdown links, whitespace and `git diff --check` | Passed |

Fetched `origin/main` matches the pre-commit feature base
`c09bf59bf12f15693e1e613ffbd7996338c16091`; no rebase/reset needed. Read-only
critical review covered changed and untracked code, fixtures and documents.
No dependencies, endpoints, real records, secrets or unrelated work are included.
Existing CI discovers the additional pytest cases; GitHub results belong in the
PR completion report. No academic browser workflow exists to smoke-test; no
browser testing or production readiness is claimed. Existing npm debt is unchanged.

### Remaining Phase 02 — future, separately authorized

Choose a small BMCC program scope with an academic stakeholder. Curate official
sources and catalog-assignment rules; define declarative requirements, grades,
repeats, credit allocation, prerequisites, co-requisites, and reviewed exceptions.
Build release review/publication and deterministic audits using synthetic records.
V1 CSVs may inform questions but cannot bypass source verification.

Exit: an academic reviewer approves every implemented rule and source mapping;
all golden fixtures pass without AI; reruns reproduce results; unknown rules,
source conflicts, release withdrawal, and invalid allocation fail safely.
Owner: catalog steward/registrar delegate plus technical lead, unconfirmed.

### Phase 02C — PostgreSQL persistence foundation

Implemented 2026-10-17 on `feature/phase02c-persistence`, following merged Phase 02B
PR #6. This explicit authorization supersedes Phase 02B's proposal-only database
restriction for the slice described here.

Delivered: 16 schema-qualified SQLAlchemy Core tables; frozen Alembic migration;
explicit disposable database bootstrap with distinct roles; immutable transactional
and repeatable draft imports; exact release/synthetic snapshot round trips with
projection/hash validation; explicit program/campus/year context; adapter calling
the unchanged evaluator; real PostgreSQL CI integration job and local workflow.
No frontend/API changes, accounts, real records, academic publication, CMS, AI,
full audit/planner, V1 access or deployment.

Acceptance checks cover fresh/empty migration behavior, scoped FK rejection,
two programs/years, same code with distinct campus identities, unchanged math paths,
precision/scale, non-credit claims, evidence conflicts, historical/current engine
IDs, corrupt storage, immutable conflicts, rollback and runtime DDL denial.
Database-independent tests run locally; PostgreSQL tests skip locally when the URL
is absent because Docker/PostgreSQL were unavailable. Actual final local checks
and real CI results are reported in the PR, separately; not all production or
academic correctness gates are complete.

Remaining: independently verified academic authority, policy reconciliation,
raw source capture, sealed campus manifest/publication lifecycle, product access
control/RLS, backup/restore and operational validation. These are not delivered by
schema isolation or source provenance. See [design/checklist](PERSISTENCE_DESIGN_PHASE_02C.md).

Proposed next user-visible slice, **not authorized**: a read-only explorer of one
explicit retained catalog draft with evidence/uncertainty explanations and the
approved four-column projection. No planner or academic approval is implied.

The owner authorizes a scoped commit, push and PR to main after verification.
Stop for review; never merge, deploy or start the next phase automatically.

### Phase 02D — Chat-first workspace and module integration

Implemented bounded slice on `feature/phase02d-course-selector`, from merged PR #7.
Default chat-first workspace, exact local navigation prompts, typed module registry,
session-local context/selections/allocations; persisted catalog explorer, four-column
selector, limited hypothetical progress preview; scoped API/typed client/proxy;
loading, empty, unavailable/invalid and future-module states. Pure academic engine
and all academic uncertainty remain authoritative. No student/chat persistence.

Acceptance A–C: mocked-API Chromium chat→catalog→selector→chat→progress flows;
backend real PostgreSQL discovery/content/preview parity. D–E: existing mathematics,
non-credit, evidence/grade uncertainty regressions retained; new HTTP preview parity
and missing-credit handling. F: reducer/browser context changes, refresh/deep links
and unique identities. G: missing release, malformed/invalid selection and DB failure
fail safely. Responsive/keyboard/reduced-motion checks at 375/768/1440px. Final
actual counts, screenshots and PostgreSQL CI execution are reported in the PR.

Implemented modules are limited, not complete product milestones. No LLM, accounts,
real records, transcript upload, full planner/audit, approvals/CMS or reporting.
Broader Phase 03/04 remain unauthorized. No institutional endorsement is claimed.
After scoped tests and review, commit/push and create a PR; do not merge or deploy.

## Phase 03 — Student workspace and semester planning

Deliver profile revisions, structured forms, chat shell, audit panels, deterministic
plan candidates, constraint explanations, and saved comparisons. Differentiate
earned/in-progress/planned records and known/unknown offerings. Validate stale
plans, optimistic conflicts, accessibility, and synthetic usability scenarios.

Exit: S1–S4 and planning portions of S12 pass; hard academic constraints cannot
be bypassed in chat or direct API requests; draft plans have no registration side
effects. Measure proposed audit performance under representative synthetic load.
Owner: product/UX and engineering, to be assigned.

## Phase 04 — Gemini AI Gateway

Evaluate supported models, implement scoped retrieval, schema-constrained intent
and explanations, server-side tools, citations, budget reservations, rate limits,
bounded retries, minimized telemetry, and deterministic fallback. Use synthetic
inputs only. Compare prompt/model versions against a fixed adversarial benchmark.

Exit: AI safety, usefulness, citation, outage, and cost gates in
[AI strategy](AI_STRATEGY.md) pass; no model path can mutate rules or award credit;
concurrent requests cannot bypass spend caps. Owner: AI/technical lead, unassigned.

## Phase 05 — Transcript and transfer workflows

Add guest and registered private quarantine storage, safe extraction, field review, deduplication,
manual entry fallback, and explicit evidence states. Add directional dated
equivalencies, pending transfer cases, authorized awards, and hypothetical
destination comparisons. Confirm ingestion and reuse permissions for any source.

Exit: S5–S7 pass, unsafe uploads fail safely, duplicate imports cannot create
duplicate credit, and unapproved equivalencies never become earned awards.
Academic reviewers approve transfer semantics. Owner: transfer/registrar delegate
and security/engineering, unconfirmed.

## Phase 06 — Advisor reporting and operational readiness

Add advisor assignments, scoped report snapshots, review state, revocation,
controlled exports, guest summary and consented advisor handoff, catalog impact
views, approved-block CMS authoring/publication/overrides/rollback, retention/deletion jobs, observability,
backup/restore procedures, incident response, and accessibility review. Exercise
a second synthetic campus with overlapping course codes and independent releases.

Exit: S8–S12 pass, authorization negative tests pass across all surfaces, a restore
drill meets approved recovery objectives, and load/cost measurements support the
proposed service targets. No unresolved critical security or academic correctness
defects. Owner: service owner and security/product leads, unassigned.

## Phase 07 — Separately approved BMCC pilot

Only after explicit approval: identify institutional sponsor, confirm pilot
programs and users, approve identity/hosting/provider processing arrangements,
validate academic authority, resolve retention and applicable privacy obligations,
and establish support/incident ownership. Institutional systems remain out of
scope unless separately authorized with documented read/write boundaries.

Propose a small opt-in pilot, for example 10–25 students and 2–3 advisors, with
human review of academic outputs. Numbers are planning assumptions. Present the
deployment and data-processing proposal for explicit approval before execution.

Exit: academic and institutional owners accept the results, failure/rollback
procedures are exercised, measured task usefulness and cost meet approved goals,
and users understand the system's advisory scope. Disable AI or withdraw invalid
catalog releases when needed; preserve student access to supported deterministic
workflows. Do not promote a pilot automatically to general availability.

## Phase 08 — Additional campuses and approved integrations

Repeat source, policy, identity, privacy, and academic review for each campus;
validate transfer mappings and campus-specific rules. Add a connector only with
an approved contract, sandbox, least-privilege access, reconciliation ownership,
freshness guarantees, and failure fallback. No campus inherits BMCC rules by default.

Exit: second-campus academic review, tenant-isolation tests, operational ownership,
and explicit rollout approval. Scale infrastructure only after profiling identifies
a concrete bottleneck. A V1 data migration would require its own proposal and audit.

## Dependencies and risk register

| Risk / unknown | Mitigation | Blocks |
| --- | --- | --- |
| No confirmed BMCC policy reviewer | Assign authority, narrow scope, use source-backed golden fixtures | Real academic claims and pilot |
| Wrong catalog applicability or incomplete requirements | Explicit reviewed assignments; unresolved outcomes | Affected audit conclusions |
| No approved provider/data arrangement | Synthetic data only; institutional review of endpoint/terms | Real student AI processing |
| No identity/advisor roster integration | Email/password and synthetic grants; approve real roster and lifecycle | Real-user access |
| Transcript ambiguity or malicious content | Quarantine, isolated parsing, review, deduplication | Automatic incorporation |
| Transfer mappings unavailable or stale | Pending cases and source dates; no inferred awards | Definitive transfer claims |
| Missing course offerings or seats | Label unknown; no registration guarantees | Schedule certainty |
| Cost/latency exceeds assumptions | Measure, cap, reduce context, use deterministic fallback | Pilot budget approval |
| Cross-campus/private-data leakage | Composite scope constraints, RLS, negative tests, revocation | Every rollout |
| Staffing, hosting, budget unassigned | Name accountable owners and approve operating model | Pilot deployment |

## Decision and review discipline

Before each authorized phase, confirm its scope, owners, dependencies, expected
review evidence, and exit criteria. Record decisions and changed assumptions in
these documents; add focused architecture decision records later if needed.
Never describe planned checks as executed tests. Any changed academic semantics
require new fixtures and source review; any model change requires AI evaluation.
Progress through the roadmap is evidence-based, not an instruction to deploy.

## Complete initial-release gate after the second prompt

The complete initial product requires both guest and registered workflows, 24-hour
expiry/cleanup, email/password, saved profiles/plans/progress/reports, secure guest
conversion, private guest transcript support, summary and explicit-consent handoff,
scoped academic governance, and safe CMS capabilities. These accumulate across
Phases 01–06; none can be omitted by calling an earlier milestone the initial release.
SSO and multilingual support are future scope. All real-user operation still requires
Phase 07 approval. Phase 00 finalization stops for review and starts none of this work.

Phase 03B owner review (PR #10): graph-first layout, direct accessible campus entry,
dismissible unavailable notices, fixed-target ambient scenery, shared branding and
browser-test synchronization hardening are included in this same bounded phase.
No Phase 03C, Gemini, additional campus catalog, profile persistence or planner is
implemented or authorized by these refinements.

## Phase 04A — Gemini conversational gateway (bounded implementation)

This phase adds the local opt-in backend provider/proxy, strict pending profile/session proposals, bounded multi-turn context, safe fallback, fake-provider tests, optional live smoke and setup documentation. It does not complete the broader Phase 04 institutional privacy, academic grounding, model quality, monthly spend, authentication or production safety gates. Model quality must be evaluated with explicit owner opt-in before any broader use. PostgreSQL/evaluator/catalog behavior is unchanged; no scraping or database population is authorized.

See [Gemini gateway](GEMINI_GATEWAY.md), [orchestration](CONVERSATION_ORCHESTRATION.md) and [verification](PHASE_04A_VERIFICATION.md).
