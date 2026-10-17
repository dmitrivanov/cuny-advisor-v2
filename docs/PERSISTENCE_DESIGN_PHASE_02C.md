# Proposed Phase 02C persistence design

**Proposal only.** Phase 02B adds no PostgreSQL connection, SQLAlchemy dependency,
ORM class, Alembic configuration, migration, schema or database. This design needs
owner review and separate implementation authorization. Only public catalog
evidence and synthetic test snapshots are proposed for an initial persistence
slice. No student accounts, real records, production or V1 resources.

## Boundaries and contract mapping

Keep FastAPI's modular monolith. A catalog repository owns versioned public
definitions and evidence; an evaluation repository owns immutable synthetic input/
result snapshots. Pure Pydantic contracts/evaluator have no ORM imports or sessions.
Application services assemble/validate DTOs and coordinate transactions; Next.js
remains presentation. Database state cannot silently select a student's catalog.

The current `Release` DTO binds one program/year context. Proposed persistence
separates a campus catalog edition/revision from a **program release binding**.
The latter retains `Release.id`, preventing an ambiguous campus-wide release ID
from substituting for the current program context. A campus edition can share
course versions/category vocabulary across programs; differing evidence or
semantics require distinct versions even when display codes match.

| Proposed table / ownership | Keys, relationships and integrity |
| --- | --- |
| `campus`, `program`, `course_identity` — catalog | Opaque IDs; campus-owned program/course identity; unique campus/display-code policy reviewed separately. Code equality never creates equivalence. |
| `catalog_edition`, `catalog_release` — catalog | Campus/year and immutable revision payload/hash; correction creates a new revision. A year label alone is not applicability. |
| `program_version`, `program_release_binding` — catalog | Campus/program/credential, release membership, exact requirement and course-version selection; binding ID maps to DTO Release.id. |
| `course_version`, `release_course_version` — catalog | Stable course identity, immutable code/title/credit/rules/source revision; release membership. Do not duplicate course identity per program. No deduplication when values or evidence differ. |
| `category_definition`, `category_version`, `program_requirement` — catalog | Shared vocabulary; explicit credential/program/year targets, eligible pools, advice versus required, column and override bindings. No automatic AA/AS/AAS inheritance. |
| `rule_version`, `rule_source`, `requirement_rule` — rules | Constrained schema-versioned AST in JSONB plus binding IDs; typed validation and references before acceptance. No executable expressions or graph-layout policy. |
| `source_artifact`, `source_section`, `evidence_assertion`, `assertion_source`, `evidence_conflict` — evidence | URL, publisher, exact locator, retrieval/publication/revision/effective dates, immutable captured bytes/hash where permitted, claim scope, year confirmation, verification state and review-required flag. Source conflict is separate from degree failure. |
| `change_proposal`, `review_decision`, `publication_event` — governance | Exact immutable revision/hash, author and independently verified scoped reviewer reference; no self-approval or Super Admin-derived authority. Draft and published content are separate from faculty contributions. |
| `synthetic_evaluation_snapshot`, `snapshot_input`, `snapshot_result` — evaluation | Exact program binding, record revision, source/release payload, engine/runtime version, allocations, non-credit claims and result explanations; original JSON plus hash for replay. Not a student database. |

Use composite campus-scoped unique/FK relationships, e.g. `(campus_id, course_id)`
and `(campus_id, program_release_id)`, to reject cross-campus parents. Explicit
course-version membership rejects cross-release references; a program binding
cannot use another program's scoped assertion. Evidence conflicts must reference
existing same-context assertions; conflict cycles are not prerequisite graph cycles.
The current optional legacy scope fields require an explicit normalization/review
step before publication, never an invented campus/program inference.

Keep exact credits as unconstrained PostgreSQL `NUMERIC` or reviewed lossless
decimal text with validation, not float or a prematurely fixed two-decimal scale.
Existing tests include values beyond 28 decimal digits. Preserve the original
decimal strings in the canonical DTO snapshot, including meaningful scale, even
if normalized numeric columns are used for querying. Reject NaN/Infinity/negative
values and never silently round. Precision/resource bounds need an explicit
contract decision before accepting external input.

## SQLAlchemy and Alembic proposal

- Repository adapters under a future persistence module; domain services accept
  repository interfaces, never ORM objects. Use explicit transaction boundaries
  and load a complete immutable release before pure evaluation; no lazy database
  access during rule execution or N+1 per-node queries.
- SQLAlchemy metadata, all tables, FKs, indexes and Alembic's version table explicitly
  use schema **`cuny_advisor_v2`**. Prefer a dedicated disposable V2 database with
  dedicated migration/runtime roles. Runtime has no DDL privileges and no access
  to V1, foreign schemas or fallback `public` objects. Constrained search paths
  supplement explicit qualification, not replace it.
- A separately authorized first migration creates only reviewed V2 catalog/evidence
  tables and constraints. Do not run `create_all` on startup, repair schemas at
  runtime, attach V1 engines, reuse credentials or auto-run seed/import scripts.
- Review generated migration SQL manually. Future CI uses disposable synthetic
  V2-only PostgreSQL to test upgrade, safe rollback where supported, schema isolation
  and restoration. Expand/contract for later changes; never drop historical
  published evidence merely to make a migration downgrade convenient.

## Safe imports, immutable publication and rollback

Accept explicit reviewed local bundles first. No bulk crawler or URL fetch inside
the evaluator. Staging stores original payload/hash and declared context; validate
schema, sources, dates, credits, identities, AST, conflicts, reference membership,
supported semantics and canonical round-trip before producing a draft diff.
Unknown fields/operators, missing evidence or conflicting applicability quarantine
the affected assertion; no blank prerequisite means automatic eligibility.

Capture source bytes and provenance only through a separately reviewed acquisition
process; current URL/section records are not proof that immutable raw artifacts
exist. A hash without retained content cannot replay the evidence. A new source
capture creates a revision; do not overwrite the URL's old content snapshot.

Publication is atomic only after independent authorized academic review binds the
exact context and content hash. Changing payload invalidates approval. Published
payloads cannot be updated/deleted by a runtime catalog writer. Withdraw via an
append-only event, block new use and preserve old snapshots; corrections publish
new releases rather than rewriting student history. A CMS or graph position edit
cannot alter rule definitions. No actual authority-verification workflow is built
in Phase 02B or established merely by this proposed schema.

## Required future integrity tests — not database tests run in Phase 02B

1. Serialize every reference release to the repository and reload the same DTO,
   including source states/conflicts/dates, tuple ordering, nested AND/OR, unknown
   operators represented explicitly, exact decimals, shared categories and four columns.
2. Store/reload synthetic inputs, non-credit claims and snapshots; assert exact
   engine/release identities, explanations, allocations and totals. Placement/waiver
   data cannot insert earned credit. Unsupported overlap remains unresolved.
3. Preserve a Phase 02A snapshot with engine `02a.1` and a new `02b.1` recomputation
   separately. Exact historical execution requires its pinned code/dependency
   artifact; a new engine must never relabel an old result. Test comparable results
   on supported old inputs and explicit rejection of unavailable engine versions.
4. Test two programs/two years/same display course code on two synthetic campuses;
   database constraints deny crossed references, stale binding substitutions and
   inferred equivalence. Same identities may share versions only when payloads match.
5. Reject duplicate/missing IDs, unsupported AST, non-finite credits, unresolved
   publication, self/stale approvals, mutation/deletion of published payloads and
   runtime DDL. Rejected staged imports cannot mutate published data.
6. Round-trip a withdrawn release and historical snapshot; deny new use while
   retaining authorized historical replay. Restore a disposable backup and verify
   hashes/DTO equality without any V1 or production connection.

Phase 02B runs in-memory/JSON integrity tests only. Database performance, security,
migration reversibility and authority workflow remain unimplemented and unverified.
