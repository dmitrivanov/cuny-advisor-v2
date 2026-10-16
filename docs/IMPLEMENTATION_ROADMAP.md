# Implementation roadmap

Status: proposed sequence, 2026-10-16. Phase 00 is the only authorized phase.
No schedule, staffing, institutional participation, or infrastructure is committed.
Later phases require explicit user authorization and the gates below.

## Phase 00 — Planning

Deliver AGENTS.md and ten linked planning documents: product requirements,
architecture, scenarios, data model, AI strategy, this roadmap, security, CMS design,
access control, and decisions. Separate facts
and assumptions, record V1 reference scope, identify future owners and blockers.

Exit: requested files exist, links and requirements align, no application code or
deployment is introduced, and unrelated local changes are preserved. Summarize
the documents and stop. Planning completion does not resolve academic or legal
questions and does not grant permission to start Phase 01.

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

Choose a small BMCC program scope with an academic stakeholder. Curate official
sources and catalog-assignment rules; define declarative requirements, grades,
repeats, credit allocation, prerequisites, co-requisites, and reviewed exceptions.
Build release review/publication and deterministic audits using synthetic records.
V1 CSVs may inform questions but cannot bypass source verification.

Exit: an academic reviewer approves every implemented rule and source mapping;
all golden fixtures pass without AI; reruns reproduce results; unknown rules,
source conflicts, release withdrawal, and invalid allocation fail safely.
Owner: catalog steward/registrar delegate plus technical lead, unconfirmed.

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
