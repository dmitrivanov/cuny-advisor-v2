# Product requirements

Status: second-prompt planning baseline, Phase 00; finalized for review. Date: 2026-10-16.
Owner and institutional sponsor: unassigned. No production authorization.

## Purpose

Help CUNY students understand their academic standing and choose realistic next
steps through a chat-first advising workspace, starting with Borough of Manhattan
Community College (BMCC). Give advisors an inspectable account of the evidence,
constraints, and unresolved questions behind each recommendation.

The system provides advisory simulations. It does not certify graduation, register
students, award transfer credit, or replace institutional records and decisions.

## Evidence and certainty

This register is shared by all planning documents. External sources were accessed
on 2026-10-16. Verified existence does not verify individual academic policies.

| ID | Classification | Statement and evidence |
| --- | --- | --- |
| U1 | User requirement | New V2 repository; V1 reference-only; Phase 00 documentation only; no application code, deployment, or production data. |
| U2 | User requirement | Next.js, TypeScript, Tailwind; FastAPI, PostgreSQL, SQLAlchemy, Alembic; Gemini AI Gateway; all capabilities listed in this PRD. |
| U3 | User requirement, second prompt | Guests with 24-hour private workspaces and transcript upload; registered email/password accounts and save/resume; future SSO; summary, explicit-consent advisor handoff and secure conversion; English-only initial release. |
| U4 | User requirement, second prompt | Scoped roles and delegated academic approvals; separate official catalogs/faculty contributions; approved-block CMS; isolated V2 PostgreSQL schema. |
| F1 | Verified local fact | V2 initially contains a minimal README and Git metadata, with a pre-existing modified `.gitignore`; no application implementation was inspected here. |
| F2 | Verified source description | [V1 README](https://github.com/dmitrivanov/academic-advisement-system/blob/main/README.md), blob SHA `b3319c4513323e38a26727bbdd20fcc346fe6530`, describes a research prototype using FastAPI, SQLAlchemy, CSV curriculum data, and optional Gemini. This is a README review, not a code or security audit. |
| F3 | Verified public resource | [BMCC catalog](https://bmcc.catalog.cuny.edu/) and [program listing](https://bmcc.catalog.cuny.edu/programs?page=1) exist. Specific program requirements and applicable catalog years have not been validated. |
| F4 | Verified public resource | CUNY describes [DegreeWorks](https://www.cuny.edu/about/administration/offices/cis/degreeworks/) as its degree audit and advisement tool. No integration access is established. |
| F5 | Verified public resource | Google publishes [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) and [service terms](https://ai.google.dev/gemini-api/terms). No model, rate, retention commitment, or institutional approval is assumed. |
| D1 | Proposed design | Deterministic academic core; AI explanation layer; immutable evidence and catalog versions; modular monolith. |
| A1 | Assumption | A limited set of BMCC programs can be curated and reviewed with qualified college stakeholders before a pilot. |
| A2 | Assumption | Initial users can enter coursework manually and review synthetic transcript imports before authorized integrations exist. |
| A3 | Assumption | Verified academic authority, advisor recipient roster, approved hosting, and suitable Gemini processing terms can eventually be obtained; future SSO is optional initially. |

All numeric service goals, pilot sizes, rule examples, and release stages below are
proposals, not measured results or verified BMCC policy. V1 data is not a verified
source. No actual course prerequisite, credit minimum, GPA threshold, catalog-year
assignment policy, or transfer equivalency is established by this phase.

## Second-prompt scope and authority

Both guests and registered students use the advising experience. Guests receive
private temporary workspaces with fixed 24-hour expiry, transcript review, progress,
draft plans/reports and summary preview. Registered students use email/password
and save/resume profiles, plans, progress and reports; future SSO must preserve
verified ownership. The initial release is English-only, including CMS, chat and
reports. Non-English requests receive a clear English-language limitation message;
no silent translation of academic evidence is assumed.

Guest upload requires the same private processing safeguards as registered upload.
Conversion requires active guest possession, verified-account authentication and
explicit selected-data save/merge. Handoff requires a preview, named authorized
recipient, exact payload, purpose, retention deadline and affirmative consent.
Detailed expiry, cleanup and accepted-case rules are in [security](SECURITY.md).

Governance roles and the permission matrix are defined in
[access control](ACCESS_CONTROL.md). College/department admins propose changes;
authorized academic reviewers approve. Super Admin is not academic authority by
default. Faculty identity and affiliation must be verified; reviewed syllabus/section
contributions remain visibly separate from official catalog data.

CMS requirements and safe campus overrides are specified in
[CMS design](CMS_DESIGN.md); decisions and unresolved dependencies are tracked in
[DECISIONS.md](DECISIONS.md). These are product requirements and proposed designs,
not verified CUNY approvals.

## Users and experience

- Students: new, continuing, returning, part-time, transfer-in, transfer-out, and
  exploring majors; retain control over profile corrections and plan changes.
- Advisors: review assigned students, investigate disagreements, prepare reports,
  and record scoped recommendations or authorized exceptions.
- Catalog stewards: curate source material, review rule changes, and publish releases.
- Administrators: manage campus access and configuration without automatic access
  to all student records. Support and audit roles have separately limited access.

The main screen combines conversation with accessible profile, evidence, audit,
and plan panels. Chat messages can open structured forms and preview proposed
changes. A student must be able to complete core workflows without free-text chat
or an available model. Label source, date, verification state, and missing inputs
at the point of use. Do not communicate academic status through color alone.

## Functional scope and acceptance

| ID | Requirement | Acceptance condition |
| --- | --- | --- |
| R1 | Chat-first advising | A question produces a cited answer, a structured next action, or a specific request for missing evidence; unsupported claims are withheld. |
| R2 | Multi-dimensional profile | Academic history, goals, work/care constraints, availability, modality, course load, transfer intent, and optional support preferences are versioned with provenance and confirmation state. No sensitive attribute is inferred. |
| R3 | Catalog governance | A steward previews a source-backed release; a distinct authorized reviewer approves publication; existing audits retain their original release. |
| R4 | Deterministic audit | Given the same profile, academic record, catalog, exceptions, and engine version, results and credit allocations match without Gemini. Explain met, unmet, conditional, and unresolved requirements. |
| R5 | Semester planning | Generate and edit drafts constrained by prerequisites, co-requisites, credit limits, availability, and student preferences. Unknown offerings remain explicitly unverified; plans never imply registration. |
| R6 | Transcript workflow | Quarantine upload, extract candidates, show field-level provenance, deduplicate, and require review before incorporation. Unsupported or ambiguous records stay pending. |
| R7 | Transfer workflow | Compare source and destination contexts using directional, dated, reviewed equivalencies. Separate transferable credit from degree applicability and unresolved evaluations. |
| R8 | Advisor reports | Generate an access-controlled snapshot containing scope, catalog, evidence, audit, plan, outstanding issues, and review status. Never silently rewrite a historical report. |
| R9 | Multi-campus | BMCC is enabled first; a second synthetic campus demonstrates isolation, overlapping course codes, independent catalogs, and explicitly authorized transfer comparisons. |
| R10 | Security and economy | Enforce authorization and spend budgets server-side; a denied action or model outage leaves deterministic features usable. |
| R11 | Guest lifecycle and conversion | Guest access ends exactly at creation + 24h; cleanup covers derived data; verified explicit conversion has one owner and preserves evidence status. |
| R12 | Registered authentication and persistence | Email/password with verification/reset and private sessions; saved profiles, progress, plans and reports resume across sessions; future SSO cannot link by email alone. |
| R13 | Consented advisor handoff | Guest summary is previewable; no advisor receives data without payload-specific consent and recipient authorization; pending payload expires with workspace. |
| R14 | Scoped governance | Delegation cannot expand scope; self-approval is denied; Super Admin cannot approve academics without independent verified authority. |
| R15 | Safe CMS | Approved blocks and accessible ordering, campus overrides, authenticated preview, reviewed publication, revision history and audited rollback; unsafe content is rejected. |
| R16 | Language | Initial UI, CMS, advising and reports are English-only; unsupported-language limitations are explicit. |

## Release scope

First functional pilot: stakeholder-selected BMCC programs, manual profile/course
entry, curated catalogs, degree audits, draft semester plans, chat explanations,
and advisor report previews for guests and registered users, with email/password,
24-hour lifecycle, secure conversion, summaries and consented handoff. Guest and
registered transcript support requires Phase 05 security gates; a release without
those gates is an internal milestone, not the complete initial product. Transfer
workflows follow only after
the academic core is validated; they are required roadmap capabilities, not implied
day-one integrations. Multi-campus boundaries apply from the first schema.

Out of scope: automatic registration, financial-aid eligibility decisions,
admissions decisions, graduation certification, predictive student risk scoring,
autonomous exceptions, payment processing, and unrestricted internet agents.
Live CUNYfirst, DegreeWorks, or transfer-service connectors require a separate
agreement and phase authorization. No V1 production migration is planned.

## Proposed quality gates

- Academic safety: 100% agreement on the approved deterministic golden dataset;
  no unsupported definitive eligibility claim in the release evaluation suite.
- Isolation: all cross-student/campus negative tests pass, including reports,
  retrieval, background jobs, and streaming responses.
- UX: WCAG 2.2 AA is the proposed target; keyboard and screen-reader review plus
  representative student usability sessions are required before pilot approval.
- Performance: at a proposed 50 concurrent synthetic sessions, p95 audit response
  under 2 seconds for up to 200 attempts; chat first meaningful content under
  5 seconds when the provider is healthy. Measure before adopting an SLA.
- Reliability: proposed pilot service objective 99.5% monthly availability;
  provider failure cannot block saved audits or manual planning.
- Cost: provisional AI ceiling $0.05 per completed advising turn and $100 per
  month for the pilot, subject to owner approval and measured token economics.
  Transcript processing has a separate capped budget; see AI strategy.

Measure task completion, advisor agreement, unresolved-case rates, stale-data
warnings, latency, and cost using minimized telemetry. Do not optimize for longer
conversations or assume improved graduation outcomes without a study.

## Open decisions and validation owners

| Decision | Proposed accountable role | Required before |
| --- | --- | --- |
| Pilot programs, audience, and success thresholds | Product owner + BMCC advising lead | Catalog scope and pilot selection |
| Authoritative rules, catalog assignment, and conflict resolution | Registrar/catalog steward | Academic rule publication |
| Identity, advisor assignments, and inter-campus access | Institutional IT/security | Any real-user pilot |
| Provider processing terms, retention, data permissions, and legal obligations | Institutional privacy/security/legal reviewers | Any real student data processing |
| Hosting, budget, backup recovery, and incident ownership | Technical/service owner | Deployment proposal |
| Transcript formats and transfer-source permissions | Registrar/transfer office | Transcript/transfer rollout |

These roles are proposed responsibilities, not confirmed participants. Unresolved
academic conflicts block affected conclusions; unresolved privacy or institutional
authority blocks real-data rollout. See the [roadmap](IMPLEMENTATION_ROADMAP.md).
