# Phase 00 decision register

Second Codex prompt baseline, 2026-10-16. “Required” identifies user direction;
“Selected design” is a Phase 00 architectural choice for review. Neither means
implemented, institutionally approved, or authorized for Phase 01 execution.
Historical source facts remain in the [PRD](PRD.md); no new external verification
or CUNY approval is claimed in this documentation update.

| ID | Status | Decision and consequence |
| --- | --- | --- |
| D01 | Required | Planning only; documentation edits, no application code, deployment, database connections, secrets or V1 modifications. Stop for review. |
| D02 | Required | Next.js + TypeScript + Tailwind; FastAPI modular monolith; PostgreSQL + SQLAlchemy + Alembic; server-side Gemini Gateway. |
| D03 | Required | Isolated V2 PostgreSQL schema; never reuse V1 schema, credentials, migrations or runtime data. |
| D04 | Selected design | Name the future schema `cuny_advisor_v2`; use a dedicated V2 database and database roles where provisioned. Schema separation alone is not a security boundary. No database is provisioned now. |
| D05 | Required | Guests and registered students; initial email/password authentication with future SSO. English-only initial UI, advising responses and reports. |
| D06 | Required | Guest workspaces expire 24 hours after creation; registered accounts save/resume profiles, plans, progress and reports. Guest transcript upload is supported only with privacy controls. |
| D07 | Selected design | Fixed guest TTL; synchronous denial at expiry; asynchronous comprehensive purge with a 1h target. Backup/provider lifecycle must meet the advertised guest promise. |
| D08 | Required | Guest summary and explicit-consent advisor handoff; secure conversion to a registered account. |
| D09 | Selected design | Handoff retains no independent payload until an authorized recipient accepts before guest expiry. Only an explicitly consented case snapshot may then outlive the guest workspace under a disclosed retention policy. |
| D10 | Selected design | Conversion needs active guest possession, verified account authentication, explicit selected-data save/merge and atomic ownership claim. No implicit linking by email or name. |
| D11 | Required | Scoped platform, college, department/program, faculty, editor/publisher, academic approver, advisor, registered-student and guest roles; delegated approval authority. |
| D12 | Required | Super Admin does not automatically have academic authority. Admins propose academic changes; verified authorized academic reviewers approve them. Faculty identity and contributions require verification/review. |
| D13 | Selected design | Explicit expiring delegation chains, no self-approval, immutable revision-bound approval and revalidation at publication. Administrative role grants cannot establish academic legitimacy on their own. |
| D14 | Required | Official catalog data stays separate from faculty contributions; deterministic rules and versioned provenance control academic outcomes. |
| D15 | Required | Approved configurable CMS blocks, drag-and-drop ordering, campus overrides, draft/preview/publish, revisions/rollback/audit; no arbitrary code or unsafe HTML. |
| D16 | Selected design | Typed block trees, protected notices, pinned effective campus compositions, independent editorial review and additional academic review for academic assertions. |
| D17 | Required | Multi-campus from the first data boundaries, BMCC first; no invented CUNY approvals. |
| D18 | Selected design | Minimal student-data access independent of administrative roles; assignment/consent grants for advisors; private authorization-proxied downloads. |

## Superseded assumptions

- Initial OIDC-only identity is replaced by email/password; OIDC/SSO remains future
  capability and is not a prerequisite for synthetic Phase 01 development.
- Generic “admin/steward” shorthand now resolves to the specific scoped roles in
  [access control](ACCESS_CONTROL.md); it never grants blanket academic authority.
- Unspecified guest retention is replaced by fixed 24-hour workspace expiry.
  Registered and accepted-handoff retention durations are still open.
- Phase 00 now contains eleven Markdown planning files, including AGENTS.md.

## Open decisions and owners to assign

| Item | Proposed owner | Gate |
| --- | --- | --- |
| Institutional process for reviewer authority, faculty identity and academic delegation | College academic authority + security | Real academic approval or faculty publication |
| Registered-data and accepted-case retention, consent language and contact verification | Product + institutional privacy reviewers | Real student processing/handoff |
| Storage/backup/provider ability to delete guest payloads on schedule | Technical + privacy/security owners | Guest transcript enablement |
| Password/session library, MFA and abuse parameters; future SSO account linking | Technical + security owners | Authentication release |
| CMS template catalog, protected blocks and override scope | Product + content governance | CMS pilot |
| Dedicated DB hosting/roles, migration privileges and recovery procedures | Technical/service owner | Any database provisioning proposal |
| Staffing, BMCC program sources, pilot consent and hosting approval | Product + institutional sponsor | Real-user pilot |

No role holder, college policy, contract, provider retention guarantee, or CUNY
integration is established by this register. Phase 01 acceptance is specified in
the [roadmap](IMPLEMENTATION_ROADMAP.md); implementation still needs authorization.

## Third-prompt authorization: Phase 01A

D19 — Required: local application skeleton only, as scoped in the roadmap. This
supersedes D01's planning-only restriction for this subset. Authentication, student
accounts, database models/migrations, CMS, Gemini, audits/planners and transcripts
remain excluded. No production connections, real student data, V1 changes, commit,
push or deployment. Broader Phase 01 approval is not implied.

D20 — Selected implementation: separate `frontend/` and `backend/` applications;
fixed same-origin Next.js health proxy to a loopback-only FastAPI origin; no CORS
or persistence required. Health indicates process reachability, not readiness of
future integrations. CI checks only, with no deployment jobs or secrets.

## Phase 01B — Frontend design-system authorization

D21 — Required: local design-system work only on the existing
`feature/phase01b-design-system` branch. This supersedes Phase 01A-only authorization
without expanding into any product workflow or backend work. Preserve health
contracts, noindex, academic integrity, V1 isolation and institutional disclosures.
No commit, push, PR or deployment; stop for UI review.

D22 — Selected design: semantic CSS custom properties mapped into Tailwind 4,
solid-first glass surfaces with bounded progressive blur, native typed controls,
system fonts, inline original vector icons and static labeled feature previews.
No new dependencies or design library. Add a Node built-in test for palette contrast
rather than a cosmetic-component testing framework. Existing npm advisories and
ESLint compatibility debt from Phase 01A remain unchanged and unsuppressed.

## Phase 01C — Read-only V1 audit and evolutionary modernization

D23 — Required: documentation and read-only analysis only on
`docs/phase01c-v1-audit`; no application changes, database access/changes,
dependencies, live AI, real student data, V1 modifications, commit, push, PR or
deployment. Preserve unrelated Phase 01B work and stop for owner review.

D24 — Owner direction: V2 is a modular, secure, maintainable evolution of useful V1
concepts. Preserve Completed Course Selector and Degree Map Tree concepts as
high-priority reusable workspace modules. Improve architecture and UX rather than
replacing every established workflow. Professor feedback is product input, not
institutional academic approval.

D25 — Recommended refinement, pending review: one approved versioned academic model
and deterministic evaluator; selector/progress/plan/transfer/report consume canonical
results, while the map uses a semantic graph projection. Keep typed requirements
and evidence richer than visual edges. Model placeholders separately from courses,
offerings and awards. Make residual requirements and incomplete plans first-class
across exports; preserve structured planning without AI.

D26 — Evidence baseline: audited V1 commit
`ba499bc078a4889ed7ed4ad2f381a5c6950753d3` via read-only GitHub access. Deployed
revision, authenticated UI, production content and academic correctness are
unverified. React Flow/XYFlow plus worker ELK is a candidate for a future measured
spike, not an installed or final library choice. No migrations or source corrections
are authorized. See [inventory](V1_FEATURE_INVENTORY.md), [data audit](V1_DATA_AUDIT.md),
[migration strategy](V1_TO_V2_MIGRATION.md), [workflows](UX_WORKFLOWS.md), and
[academic boundaries](ACADEMIC_ENGINE_BOUNDARIES.md).

## Phase 02A — Official BMCC catalog and academic rules foundation

D27 — Required: official BMCC program and linked course/Pathways webpages are the
agreed primary academic sources for this project. Target reference is Computer
Science A.S., 2026–2027. Source verification is distinct from institutional academic
approval; V1 CSVs, professor product feedback and administrator overrides cannot
publish academic truth. Evidence and open questions: [source mapping](BMCC_CATALOG_SOURCE_MAPPING.md).

D28 — Owner-approved product contract: preserve four selector columns, ordered
Required Common Core, Flexible Core, Major Requirements, Major Electives. Retain
the V1 mathematics progression behavior as correct: 206 → 301 → 302 and the
301 → 302 path. Degree math alternatives and prerequisite conditions are distinct;
extra preparation creates no automatic extra degree credit. Exact source labels,
synthetic grade assumptions and regressions: [parity](V1_SELECTOR_PARITY.md).

D29 — Selected bounded implementation: frozen typed Pydantic contracts, declarative
nested JSON AST, pure in-memory evaluator and explicit proposed allocation ledger.
No persistence is established; do not introduce a schema or irreversible API.
Validate allocations globally without claiming an optimizing allocator or full
graduation audit. Unsupported conditions and overlap remain unresolved. No new
packages, endpoints, UI, live AI, production access, real records or deployment.

D30 — Required: reuse shared Pathways category definitions with explicit credential,
campus, program and catalog-year configuration/overrides. Course identities and
release versions are separate; no program code or course-code matching in engine
rules. AA/AS/AAS do not inherit identical requirements. The local snapshot contract
demonstrates reuse; normalized persistence/multi-program service remains future.

D31 — Required: academic rules remain separate from visualization overrides.
Selector and condition projections retain canonical rule/source identities and
grouped logic. Layout must never approve prerequisites, degree credit or exceptions.

D32 — Scope: owner authorizes Phase 02A on `feature/phase02a-academic-foundation`,
superseding D23 only for this local bounded implementation, synthetic tests and
documentation. Release states/exception proposals are contracts, not implemented
governance or verified authority. Stop for review; no commit, push, merge, PR,
deployment or automatic Phase 02B work. Details: [rules model](ACADEMIC_RULES_MODEL.md).

D33 — Final-review authorization: the owner independently confirmed the initial
35-test suite on macOS (`35 passed in 0.15s`) and authorizes critical review,
necessary Phase 02A corrections/regressions, one commit, a normal feature-branch
push and a PR targeting `main`. This supersedes D32's commit/push/PR prohibition
only. No merge, deployment, Phase 02B, dependency, database or endpoint work.
Final review strengthens course-metadata provenance checks, keeps missing elective
credits unresolved, and demonstrates course reuse in a second fictional program.
Credit arithmetic also isolates caller Decimal precision to preserve exact replay.

## Phase 02B — Evidence and policy reconciliation

D34 — Required: bounded evidence/provenance validation, manually curated partial
catalog fixtures, deterministic synthetic regressions and documentation on
`feature/phase02b-catalog-evidence`, based on merged PR #5. Owner authorizes review,
commit, normal push and PR to `main`; no merge, deployment, Phase 02C implementation,
new dependencies, endpoints, UI, database, institutional API or real records.
This supersedes earlier phase-specific restrictions only for this scope.

D35 — Reconciliation: CUNY STEM frameworks support separating requirement
satisfaction from unique earned-credit counting. They do not settle BMCC CS's exact
general-elective allocation. Keep unsupported cross-group allocations unresolved;
the restriction is an implementation limit, not a claimed institutional prohibition.
No universal grade/repeat/placement/transfer rule is invented. Explicit CR/TR
source disagreement remains a notation conflict, not proof credit is invalid.

D36 — Selected second reference: BMCC Computer Information Systems A.A.S.,
2026–2027, explicitly stated by its official program Notes. Shared categories and
course identities, distinct program/version/evidence bindings; incomplete scientific
grouping and elective credits remain unresolved. Fictional historical 2025–2026
inputs do not claim an official historical curriculum. See
[second-program validation](SECOND_PROGRAM_VALIDATION.md).

D37 — Selected incremental implementation: evidence state/scope/date/conflict
contracts and pure source checks; non-credit claims cannot become completions or
awards. New engine outputs use `02b.1`; old snapshots are retained with `02a.1`.
No source state implies academic approval. The [policy matrix](ACADEMIC_POLICY_EVIDENCE.md)
and [proposed Phase 02C design](PERSISTENCE_DESIGN_PHASE_02C.md) distinguish current
code from future authority/persistence requirements.


## Phase 02C — Local PostgreSQL persistence foundation (2026-10-17)

The owner authorized this bounded implementation on `feature/phase02c-persistence`
after Phase 02B PR #6 merged at `8d10a00830f704c016817480b4452085f011601c`.
Its authorization supersedes the historical Phase 02B database prohibition only
within this scope. Commit, normal push and PR to main are authorized; no merge,
deployment or next phase.

- Use PostgreSQL 17, SQLAlchemy Core 2.1.5, Alembic 1.20.0, psycopg/binary 3.3.6;
  pin Python dependencies and transitive additions in requirements. Core avoids
  duplicate ORM/domain definitions and lazy loading. No evaluator/DTO changes.
- Retain exact canonical DTO JSONB/hash plus 16 normalized identity, membership,
  evidence/rule and snapshot tables. Decimal strings preserve precision and scale;
  load verifies every normalized projection, not just the envelope hash.
- Separate campus edition/revision from the program binding (`Release.id`). All
  contexts are explicit composite keys/FKs. Course code equality is not equivalence.
  Credential is a program-release attribute; category sharing requires exact content.
- All writes are immutable **drafts**, transactional and idempotent for identical
  identities. Same-ID changes reject. Corrections append new identities. A campus
  revision is an append-only draft collection, not a sealed official manifest.
- Explicit schema `cuny_advisor_v2`, dedicated disposable loopback resources,
  bootstrap/migration/runtime role separation, no runtime DDL, no public fallback,
  and no startup database work. Empty-only downgrade; retained history blocks it.
- Runtime SELECT/INSERT is for trusted development adapters, not public users or
  implemented product authorization. Triggers/grants do not make storage tamper-proof
  against owners/superusers. Academic approvals, RLS and production security need
  separately reviewed implementation.
- Retain old engine results separately from new computation; no invented replay
  of an unavailable old engine. Synthetic snapshots require an explicit caller
  assertion. No real student data is permitted.
- Raw source artifacts, governance/publication/CMS, student identity, arbitrary
  ingestion, backup/restore drills and deployment are deliberately deferred.
  Policy uncertainty remains unchanged. Source verification is not institutional
  approval. See [design and reviewer checklist](PERSISTENCE_DESIGN_PHASE_02C.md).

Local Docker/PostgreSQL were unavailable: local integration is not claimed. A
separate CI PostgreSQL service executes database tests; the PR reports actual
results separately from local unit/frontend checks. Existing frontend advisories
remain pre-existing technical debt and are not changed by this phase.


## Phase 02D — Chat-first workspace and academic modules (2026-10-17)

Owner authorization on `feature/phase02d-course-selector`, baseline Phase 02C PR #7
merge `315c1c8`. The chat-first requirement supersedes earlier prototype-only UI/API
restrictions within this bounded slice; later phases remain gated.

- `/` starts in Chat Workspace. The selector is one module, not the product home.
  Typed registry/hash routes and structured action cards share one persistent shell.
- Exact deterministic local navigation only, four supported prompts. Unsupported
  questions explicitly disclose no live AI. Gemini remains separately governed Phase 04.
- Session-local reducer/context; no chat, hypothetical inputs or student persistence.
  Release changes clear selections; refresh/deep links restore context only.
- Read-only discovery/content and fictional preview use the hardened PostgreSQL
  repository through explicit DI. No fixture fallback or auto migration/import.
- Four-column membership comes from backend AST projections; stable course IDs
  avoid duplicate selections. No TypeScript academic calculations. Optional explicit
  allocation proposals go to the unchanged evaluator, never auto allocated.
- Hypothetical inputs assume passed only as fictional scenario facts; no record is
  verified. Grade ranks remain unknown. Missing catalog credits return unresolved
  without invented zero credit; all existing policy/evidence uncertainty remains.
- Browser regression coverage justifies Playwright 1.64.1 as the sole new direct
  development dependency. It adds playwright/playwright-core transitively. No new
  runtime packages/UI framework or backend dependencies. Native Node tests cover
  reducer/router/client; Chromium tests use explicit mocked academic APIs. Real
  PostgreSQL integration is separately tested in backend CI, never SQLite.
- Pinned public fixture copies under frontend tests are test responses only; no
  application import uses them. Friendly CS/CIS names are presentation aliases for
  existing reviewed BMCC program IDs, not invented persisted academic facts.

No accounts, transcripts, real records, approval/CMS, planner, advisor reports,
AI or deployment. Source verification is not institutional approval. Commit/push
this branch and PR to main are authorized; never merge or start Phase 03/04.


## Phase 03A — Minimalist chat-first UX (2026-10-17)

Owner authorization is confined to frontend UX on `feature/phase03a-chat-first-ux`,
based on merged Phase 02D PR #8 (`d550232`). Chat is the sole default interface;
context selectors and academic tools appear only after structured conversation
actions or supported deep links. Dedicated module views replace the dashboard/split
shell. Return restores originating focus and tab-local conversation and selections.
Native disclosure exposes the full institutional/privacy/academic limitations.

Use the pinned read-only V1 source hierarchy for compact course cards and visual
column order: Major Requirements, Major Electives, Required Common Core, Flexible
Core. This is a presentation-only override of earlier frontend order, not a change
to canonical projections, requirements or prerequisites. Empty pools remain
unresolved; absent titles have a short fallback. No AI-recognized state, automatic
allocation or fabricated description. Captured rules can be displayed structurally;
all academic calculations remain in the unchanged evaluator.

No new packages, backend endpoints, fixtures, migrations, database schema or AI
integration. The existing typed registry/Guidance action boundary remains suitable
for a future separately governed Gateway. Commit/push/PR are authorized; merge,
deployment and later phases are not. See [verification](PHASE_03A_VERIFICATION.md).


## Phase 03B — Multi-campus foundation (2026-10-17)

Owner-authorized branch `feature/phase03b-multicampus-profile` starts from merged
PR #9 (`cb548e4`). The new campus-selection `/` supersedes the Phase 03A root route
only; the minimal conversation and its academic modules remain at `/campus/bmcc`.
BMCC is the sole local pilot. Registry entries describe names, project capabilities
and visual positions, never academic catalogs or transfer relationships. Decorative
network edges explicitly have no transfer-equivalence or agreement semantics.

Use native HTML buttons and lightweight SVG/CSS, no graph/AI dependencies, motion
loops, external logos or WebGL. Keyboard/touch and an accessible list match availability.
Campus-neutral profile facts are evidence-aware; assistant identity is separate from
current/previous/destination institutions. Profile/session remain in memory only.
Goal-dependent readiness controls question selection, not academic rules or capability
activation. Full planning/transfer/handoff stays unavailable even when information
is ready. Grades are not globally required; unknown academic conditions remain so.

Proposals from a future provider require runtime validation and cannot upgrade evidence,
select applicable catalogs or execute arbitrary tools. Program dates never assign a
release. Explicit fictional scenario/course copying actions do not verify records.
No backend/schema/fixture changes, AI, real data, institutional integration or deployment.
Commit/push/PR are scoped authorizations, not merge or later-phase approval.

## Phase 03B owner review — PR #10

Owner-authorized refinement: graph-first campus entry replaces the large hero and
persistent information panel. BMCC nodes navigate directly on click/tap/Enter/Space;
planned nodes only display dismissible unavailable notices. Focus/hover details are
transient descriptions. An accessible list remains available. Selecting an assistant
never establishes enrollment or academic authority.

Slow CSS transform/opacity animation is allowed only on decorative orbital layers;
interactive nodes/labels remain fixed. Interaction pauses motion, reduced-motion
removes it. Shared compass wordmark, typography and existing glass/radius/accent
language link dark entry to light minimal chat. No additional dependencies, backend,
catalog, schema, evaluator or provider changes are authorized by this refinement.
CI failure traces are retained for seven days for synthetic browser tests; previous
run 39073305717 did not upload its trace, limiting retrospective root-cause evidence.

## Phase 04A — bounded local Gemini gateway

Owner authorized this branch from merged PR #10 (ab940ac). Use maintained google-genai, configurable stable gemini-3.8-flash (official docs checked 2026-10-17), explicit local dotenv entry point with environment precedence, disabled-by-default provider and per-message external-AI consent. Keep profiles transient, all model changes pending, and deterministic readiness/action/academic authority intact. Conservatively defer academic answers to existing sourced modules; provider text is unverified. Rate limits are process-local, not production authentication or a dollar budget. No automatic live calls, real records, deployment or next-phase work.

See [Gemini gateway](GEMINI_GATEWAY.md), [orchestration](CONVERSATION_ORCHESTRATION.md) and [verification](PHASE_04A_VERIFICATION.md).
