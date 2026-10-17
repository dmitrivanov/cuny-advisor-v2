# Repository instructions

## Current authorization: Phase 02C — PostgreSQL persistence foundation

Work exclusively in `cuny-advisor-v2` on `feature/phase02c-persistence`.
Phase 02B merged through PR #6 (`8d10a00830f704c016817480b4452085f011601c`)
is the baseline. Implement only isolated local/disposable PostgreSQL persistence,
SQLAlchemy 2.x, psycopg, Alembic, immutable draft catalogs/evidence, synthetic
snapshots, repository adapters and regression/CI checks. These dependencies are
authorized. Preserve the pure Pydantic contracts, evaluator results, mathematics
paths and four-column selector contract. No program-specific evaluator formulas.

Read architecture, data model, decisions, roadmap, academic boundaries, source
mapping, rule model, selector parity and persistence design before changes.
Keep schema `cuny_advisor_v2` explicit everywhere, including Alembic tracking.
Use distinct migration/runtime roles, loopback disposable V2-only databases and
synthetic snapshots only. No production/institutional/V1 credentials, cross-schema
access, runtime DDL, automatic startup migrations/imports or automatic publication.

No new endpoints, frontend features, accounts, real student data, transcripts,
CMS, AI, complete audit/planner, scheduled scraping, deployment or later phases.
Unknown academic interpretations remain unresolved. Source verification is not
institutional approval; no persistence operation grants academic authority.

Inspect all changed/untracked files and run backend/frontend checks, including
real PostgreSQL integration where available. Report unrun checks honestly.
Commit only this phase, push the current branch and create a PR against `main`.
Do not merge, force push, rewrite unrelated commits, deploy or begin another phase.
Stop for owner review. Preserve unrelated work; risky synchronization needs review.

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
V2 persistence slice above is authorized.

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
The Phase 00 deliverable was documentation only. Current Phase 02C authorization
is defined above and supersedes the previous phase restrictions within
that limited scope; later phases remain unauthorized.
