# Repository instructions

## Current authorization: Phase 04C-UX — Academic Explorer and pathways

Work on `feature/phase04c-ux-academic-explorer` from updated main with merged PR #13.
Authorized: premium student-facing Departments/Programs/Courses explorer, accessible
course detail panel/sheet, contextual chat/deep-link navigation, bounded interactive
pathway visualization, read-only pinned V1 graph inspection, dependency evaluation,
regression tests/screenshots/docs, scoped commit/push and dedicated owner-review PR.
Preserve frontend/AGENTS.md; read installed Next.js documentation before frontend edits.

Preserve source facts, catalog years, existing releases/data, selector, progress,
pure evaluator, exact credits and institutional isolation. No fabricated real graph
edges or program ownership from page-host links. Only verified structured relations
may create authoritative edges; otherwise use an explicit real-data empty state and
separate synthetic demonstration. Visualization/traversal is never eligibility.
Remove technical clutter from student views without hiding uncertainty or errors.

No new academic rules, catalog ingestion/rewrites, degree requirements, student data,
production resources, other-campus activation, accounts, registration, Gemini calls,
merge, deploy or later phase. Do not inspect/change backend/.env.local. Respect local
services; no migration or seed required for this UX phase. Stop at the review PR;
no history rewrite.

V1 is strictly read-only at reference commit
`ba499bc078a4889ed7ed4ad2f381a5c6950753d3`: never edit, format, install there,
import/execute its application, seed, migrate, refactor or access its database,
credentials or deployment configuration. Existing pinned audit evidence may be used
as behavioral reference, never as academic authority.

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
original documents. Their broader features remain planned; only the disposable
V2 workspace and persistence slice above is authorized.

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

Current persistence uses isolated V2 schema `cuny_advisor_v2`, SQLAlchemy and Alembic,
with dedicated V2 privileges and no V1 reuse. Connections are limited to the
disposable V2 resources authorized above.

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
The Phase 00 deliverable was documentation only. Current Phase 04C-UX authorization
is defined above and supersedes the previous phase restrictions within
that limited scope; later phases remain unauthorized.
