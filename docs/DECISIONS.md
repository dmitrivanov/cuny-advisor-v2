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
