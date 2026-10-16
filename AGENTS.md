# Repository instructions

## Current authorization: Phase 01C — documentation and read-only V1 audit

Work exclusively in `cuny-advisor-v2` on the existing `docs/phase01c-v1-audit`
branch. The owner authorizes comprehensive source-based read-only analysis of V1,
five audit/modernization/UX/boundary documents, and necessary roadmap/decision
updates. Preserve unrelated uncommitted Phase 01B work. V2 is a secure, modular
modernization of useful V1 concepts, not a complete functional reinvention.

V1 is strictly read-only: do not edit, format, install dependencies, run seeders,
migrate, refactor, commit or push there. Use authorized read-only GitHub source
access if no verified local checkout is available. Never connect to V1 or other
production databases, use production credentials, call live AI, or load real
student data. The production reference may be inspected as a public UI only;
never authenticate, submit student data, or trigger AI/academic mutations there.

No application implementation, frontend/backend refactoring, database changes,
dependency installation, deployment, PR, commit or push. No academic source or
institutional approval is inferred from V1 code or professor feedback. Distinguish
source-verified, UI-observed, documentation-claimed and runtime-unverified findings;
cite pinned source revisions, file paths, functions and line ranges when available.
Document inaccessible evidence without guessing. Stop after the audit documents
and final report, and wait for owner review before any implementation.

Work only in `cuny-advisor-v2`. The previous repository,
[academic-advisement-system](https://github.com/dmitrivanov/academic-advisement-system),
is reference-only: do not edit it, run its seeders, reuse its credentials, or trigger
its deployment. Preserve unrelated user changes.

## Planning authority

- Read [PRD](docs/PRD.md) for scope, evidence, requirements, and open decisions.
- Read [architecture](docs/ARCHITECTURE.md), [data model](docs/DATA_MODEL.md), and
  [AI strategy](docs/AI_STRATEGY.md) before proposing technical changes.
- Use [scenarios](docs/USER_SCENARIOS.md) as future acceptance-test specifications.
- Follow phase gates in the [roadmap](docs/IMPLEMENTATION_ROADMAP.md). A described
  future phase is not authorization to execute it.
- Distinguish verified facts, user requirements, proposed decisions, assumptions,
  and unresolved questions. Cite official policy sources with access date, campus,
  effective period, and section before encoding academic rules.
- Never infer that a V1 feature or CSV is correct or approved because it exists.

## Second-prompt baseline

Read [security](docs/SECURITY.md), [access control](docs/ACCESS_CONTROL.md),
[CMS design](docs/CMS_DESIGN.md), and [decisions](docs/DECISIONS.md) alongside the
original documents. Their broader features remain planned; no database connections or secrets.

Guests have fixed 24-hour private workspaces, including transcript safeguards,
summary preview and optional explicit-consent advisor handoff. Registered users
use email/password initially and save/resume; SSO is future work. Conversion must
verify active guest possession and authenticated account ownership. Initial release
is English-only. Expiry must block access even if cleanup is delayed.

Enforce scoped roles and bounded delegation. Super Admin is not automatically
academic authority. College/department admins propose academic edits; distinct
verified Academic Approvers review them. Verified faculty contributions remain
separate from official catalogs. CMS uses approved blocks only, with reviewed
publication, campus overrides, version history and safe rollback.

Future persistence uses isolated V2 schema `cuny_advisor_v2`, SQLAlchemy and Alembic,
with dedicated V2 privileges and no V1 reuse. Do not create or connect to it now.

## Future implementation constraints

Once authorized, use Next.js, TypeScript, Tailwind, FastAPI, PostgreSQL, SQLAlchemy, Alembic,
and a server-side Gemini AI Gateway. Prefer a modular monolith with explicit
domain boundaries. Select and pin supported versions at implementation time.

Academic eligibility, credit allocation, prerequisites, degree audits, and plan
validation must be deterministic and independently testable without AI. Gemini
may interpret intent and explain validated results; it must not approve academic
exceptions, invent equivalencies, or mutate records without validated user intent.

All college-scoped records and retrieval must enforce campus and user access.
Published catalog releases are immutable; preserve provenance and reproducible
audit inputs. Distinguish earned, in-progress, planned, and unverified credit.
Unknown rules produce unresolved results, never an assumed pass.

Do not commit secrets, real transcripts, personal data, or raw sensitive prompts.
Use synthetic fixtures until a separately authorized institutional data process
exists. Authorization belongs in the API/domain boundary, not the model or UI.

Future verification must cover rules, catalog changes, negative authorization,
cross-campus isolation, transcript review, AI fallback, accessibility, and cost
limits. Document evidence and limitations; never claim policy validation,
compliance, performance, or institutional endorsement without supporting review.

## Historical Phase 00 completion

The eleven Phase 00 Markdown files established the planning baseline.
The Phase 00 deliverable was documentation only. Current Phase 01C authorization
is defined above and supersedes the previous planning-only restriction within
that limited scope; later phases remain unauthorized.
