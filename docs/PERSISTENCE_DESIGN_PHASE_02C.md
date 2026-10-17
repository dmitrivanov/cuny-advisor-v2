# Phase 02C persistence foundation

Status: implemented bounded adapter, 2026-10-17; database execution evidence is
recorded separately in the PR. This is an independent project, not an approved
BMCC catalog, complete degree audit, student database or academic publication system.

## Implemented boundary and tradeoffs

`backend/app/persistence/` uses SQLAlchemy Core 2.x tables and explicit transactions,
not ORM replacements for the domain. Existing frozen Pydantic Release/Snapshot
contracts and the pure evaluator remain authoritative and unchanged. FastAPI startup,
health and frontend have no database dependency or new endpoint. No network importer.

A campus edition is `(campus_id, catalog_year)`. Its immutable revision has an
explicit caller-supplied `revision_id` and cannot change year. A program release
binding has `(campus_id, release_id)`, explicit program/credential/year/revision,
and maps exactly to `Release.id`. Several program bindings can attach to one campus
revision. This is an append-only draft collection, **not a sealed, academically
approved campus-wide manifest**. Publication/freeze/withdrawal workflows are deferred.

Implemented tables, all in `cuny_advisor_v2`:

| Tables | Responsibility |
| --- | --- |
| `campus`, `program` | Campus-scoped opaque identities; credential belongs to a program release |
| `catalog_edition`, `catalog_revision`, `program_release_binding` | Edition versus revision versus exact program context |
| `course_identity`, `course_version`, `release_course_version` | Campus identity, immutable version payload, ordered release membership |
| `category_definition`, `release_category` | Content-addressed shared category definitions; explicit release vocabulary |
| `source_evidence`, `evidence_conflict` | Complete scoped Source DTOs, dates/status/locators and explicit conflict edges |
| `rule_version`, `rule_source`, `program_requirement` | Validated constrained AST JSONB, source edges, requirements and scoped rule/category FKs |
| `synthetic_evaluation_snapshot` | Retained complete Snapshot, exact release hash and engine ID; no student ownership or accounts |

The release's canonical JSONB envelope is the authoritative serialization, with
normalized relational projections for identity, membership and context. Loading
revalidates the DTO/hash and compares **every projection**, including extra/missing
members. It does not trust a hash alone. Component payloads preserve original order
and references; sorted JSON object keys do not reorder arrays. Reading batches each
relation, then closes the connection before evaluation. Indexes are supplied by
primary/unique keys; broad query/search optimization is deferred until measured.

Complex ASTs, provenance, declarations, issues and snapshots remain JSONB rather
than an explosion of operator tables. Decimal values are exact JSON **strings** from
Pydantic, including trailing zeros and precision beyond 28 digits. No float or fixed
NUMERIC scale intervenes. SHA-256 covers canonical UTF-8 JSON (sorted object keys,
compact separators, no ASCII escaping). Source records are retained content, but
**raw official web artifacts are not captured**; source URLs/sections are not a
substitute for a future reviewed evidence acquisition process.

Sharing requires the same explicit campus/version ID and identical course payload.
Code/title equality never merges identities or establishes transfer equivalence.
Different same-ID content rejects the entire transaction. Category sharing is by
exact definition hash; academic applicability remains on program/year requirements.
Legacy nullable source scope is retained, never upgraded to verified authority.

## Writes, snapshots and reproducibility

`CatalogRepository.save_release(release, revision_id=...)` revalidates the complete
DTO, accepts **draft only**, and atomically inserts all rows. Identical imports are
idempotent. Same-ID changes, including decimal scale or revision rebinding, raise
`PersistenceConflict`; corrections need new release and affected version IDs. A
failed late insertion rolls back newly inserted parents/members too. The manual
fixture command commits each program independently and reports each retained draft;
it does not promise bundle-wide atomicity or publish anything.

`load_release(campus_id, program_id, release_id)` always requires explicit context;
wrong scope returns not found. The adapter's `evaluate` method loads the full model
and calls the existing pure function. Persistence changes no academic interpretation.

`save_synthetic_snapshot(..., synthetic=True)` requires an explicit synthetic-only
caller assertion and an already retained exact release. The table and method are
not authorized to accept real records. Snapshots retain original results, non-credit
claims, allocations, explanation trees and engine IDs; loading does not recompute or
relabel old outputs. Recomputed current results use a separate snapshot ID. The
adapter does not certify result authenticity or re-execute an unavailable historical
engine. Exact historical execution also requires retained engine/runtime artifacts,
which this phase does not implement.

## Isolation and migration review

- `config.py` rejects all but `postgresql+psycopg`, loopback hosts, database names
  `cuny_advisor_v2_dev`/`cuny_advisor_v2_test`, expected dedicated role names and URLs
  without driver query options. These guards supplement, not replace, provisioning
  discipline: names alone cannot prove a database is disposable.
- `scripts/bootstrap_local.py` runs explicitly against a **fresh V2-only instance**
  using its disposable `postgres` admin. It creates distinct non-superuser roles,
  removes PUBLIC database privileges (including TEMP) and public schema access,
  creates the schema owned by `v2_migrator`, and sets scoped search paths. It refuses
  pre-existing roles; it is not a credential/role reconciler for shared servers.
- `v2_migrator` owns schema/tables and runs Alembic explicitly. `v2_runtime` has
  schema USAGE and catalog/snapshot SELECT/INSERT only; no UPDATE/DELETE/TRUNCATE,
  CREATE/schema ownership, temporary tables or Alembic tracking writes.
- Metadata, FKs, every DDL statement and Alembic version table are schema-qualified.
  PostgreSQL's system catalogs remain accessible as required by the driver. No V1,
  foreign business schema, `public` fallback or production resource is used.
- `02c_001_foundation.py` freezes reviewed CREATE TABLE/FK/check/trigger/grant SQL;
  upgrade does not import mutable metadata or call `create_all`. Its schema must be
  explicitly bootstrapped first. A unit check compares frozen table DDL to current
  metadata. There is no app startup migration, seed or schema repair.
- All 16 tables have UPDATE/DELETE rejection triggers in addition to runtime
  privileges. Table owners/superusers can deliberately bypass/drop triggers; this
  is accidental-mutation protection, not tamper-proof governance. Runtime INSERT
  still belongs behind a future authorized service boundary, never a public client.
- Empty-only downgrade is supported. Any retained release blocks downgrade to avoid
  history destruction. The schema/version table remain after empty downgrade.
  Destructive reset means explicitly removing only the disposable Compose volume.

Local Compose binds PostgreSQL to `127.0.0.1:55432`; CI uses an isolated PostgreSQL
17 service on loopback with explicitly throwaway CI credentials. Python dependencies
are exactly pinned. The PostgreSQL image uses the supported major `17` to receive
minor fixes; its digest is not locked, so bit-identical container replay is deferred.
PostgreSQL 17 support was checked against the [official version policy](https://www.postgresql.org/support/versioning/)
on 2026-10-17. Python selections were checked against primary release metadata:
[SQLAlchemy](https://pypi.org/project/SQLAlchemy/), [Alembic](https://pypi.org/project/alembic/),
[psycopg](https://pypi.org/project/psycopg/). Workflow commands are in [README](../README.md).

## Verification and independent review checklist

Unit tests do not require a database. PostgreSQL-marked tests skip only when
`V2_DATABASE_URL` is absent; configured connection failures fail. No SQLite substitute.
The CI PostgreSQL job bootstraps roles, migrates and executes integration tests on
real PostgreSQL separately from unit/frontend checks. Docker/PostgreSQL were absent
locally during implementation; local DB tests are explicitly unrun, not passed.

Local verification commands (from backend unless stated):

| Check | Actual result |
| --- | --- |
| `.venv/bin/python -m pytest -q -rs` | 80 passed; 15 PostgreSQL cases skipped because no URL/server |
| `ruff check backend` / `black --check backend` (root) | Passed |
| `.venv/bin/python -m pip check` | No broken requirements |
| `node --test scripts/design-contrast.test.mjs` (frontend) | 9 passed |
| `npm run lint`, `npm run typecheck`, `NEXT_TELEMETRY_DISABLED=1 npm run build` (frontend) | All exit 0; generated type-reference change restored |
| Local Markdown target checks and `git diff --check` | Passed |

Real PostgreSQL CI evidence: [branch run 39004401425](https://github.com/dmitrivanov/cuny-advisor-v2/actions/runs/39004401425)
completed successfully on PostgreSQL **17.11**: **15 passed, 80 deselected in 3.44s**,
no integration skips; bootstrap, upgrade and dependency consistency also passed.
Backend and frontend jobs passed. Five Alembic configuration deprecation warnings
identified the missing `path_separator`; the configuration now explicitly sets
`path_separator = os` and anchors its import path to the config directory. This
corrects the configuration rather than suppressing warnings. Subsequent head/PR
checks are reported in the PR; local PostgreSQL remains unavailable.

Reviewers should check:

- [ ] Explicit schema and Alembic version location; frozen SQL and empty downgrade.
- [ ] Cross-campus and cross-program composite FKs, scoped loads, no code matching.
- [ ] Idempotency, same-ID rejection, late-failure transaction rollback.
- [ ] Exact Decimal strings/ordering and full DTO/projection/hash agreement.
- [ ] Two programs, two years, evidence conflicts, historical/current engine IDs.
- [ ] MAT 206/301/302 parity, invalid allocations and non-credit claims.
- [ ] Runtime DDL/TEMP/update/delete/truncate denial and owner mutation trigger.
- [ ] Source verification versus institutional authority; unchanged evaluator/API.
- [ ] Actual CI integration results, not only locally skipped tests.

## Deliberate deferrals and next slice proposal

No academic approval/publication, change proposals, faculty contribution workflow,
CMS, source artifact downloader, student/auth tables, RLS, arbitrary imports,
automatic allocation, backup/restore drill, broad load testing or deployment.
DB roles are operational roles, not product authorization roles. Composite FKs are
integrity boundaries; a privileged runtime operator can read all public fixture
catalogs, so this is not an end-user tenancy/access-control implementation.

STEM credit allocation, grade/repeat applicability, placement, transfer notation and
policy conflicts remain unresolved exactly as in Phase 02B. Official source
verification is distinct from institutional approval. A proposed next user-visible
slice is a read-only catalog/evidence explorer over one explicit retained draft,
with four-column projection and uncertainty explanations, subject to separate
owner authorization. No next phase is started here.


## PR #7 focused integrity and concurrency hardening

Owner-authorized review stays within Phase 02C; Phase 02D is not started.

`_load()` checks **all** rows in the requested campus/program/release for each
scoped projection. For shared tables it checks exactly the expected primary keys
and their complete values, including payload/hash. Unreferenced course versions,
other programs/campuses and historical revisions must not invalidate a release.
This is referenced-graph integrity checking, not a database-wide orphan audit.
Tests inject missing/modified shared course versions and category definitions;
all referencing releases fail, while independent campus versions remain valid.
Correct exact-content category sharing across campuses is intentional.

Composite FK parents enforce the exact program/release combination for all seven
scoped relations. Course membership also binds campus/course/version; categories
reference shared definition hashes; requirements/rule-source/conflict edges bind
same-context parents. FKs cannot certify that a valid existing version or edge was
actually selected by the canonical release: `_load()` detects that mismatch and
extra rows. No broad shared-table scan is needed. A real comparison blind spot was fixed:
Python dict equality treats JSON `false`/`0` and `3`/`3.0` as equal. Both `_load()`
and `ensure()` now compare complete canonical JSON text (including types), so a
modified payload cannot pass by retaining the old hash and Python-equal values.
The canonical hash serialization itself is unchanged. Owner-only fault injection disables only mutation triggers in
a rollback-only transaction; PostgreSQL FK/check constraints remain enabled.

Two write-path corrections:

- Payload-order insertion could acquire shared identities in opposite orders,
  allowing a deadlock across concurrently imported releases. Imports now sort
  writes by dependency-ordered table and complete primary key. Serialized arrays
  and membership positions retain their original order; no evaluator change.
- Unqualified `ON CONFLICT DO NOTHING` could hide a secondary-unique collision and
  fail later as an unexplained missing-row lookup. `ensure()` now requires a matching primary-key row and exact typed content;
  missing/mismatched rows raise `PersistenceConflict` and roll back the import.
  It deliberately keeps `DO NOTHING` across all unique indexes: real CI contention
  exposed races on redundant unique indexes when targeting only the PK. Ignoring
  an INSERT conflict is never itself treated as successful idempotency.

Concurrency tests use independent engines/real PostgreSQL backend PIDs, barriers
before contested INSERTs, bounded statement/barrier/future timeouts and no retries.
If transactions first choose different keys, a second barrier holds those inserts
to expose the old lock-order cycle reliably. Tests cover identical/conflicting
release IDs and distinct release IDs sharing identical/conflicting versions in
reversed payload order. Winners load exactly; losers retain no partial binding or
scoped rows. A separate secondary-unique conflict proves earlier new rows roll back.
Each contention scenario repeats three times with fresh identities.
READ COMMITTED is asserted; serializable/repeatable-read retry policy and general
stress/performance testing remain deferred. This does not claim deadlock freedom
for arbitrary out-of-repository SQL or future write paths.

PostgreSQL documents the relevant [ON CONFLICT visibility](https://www.postgresql.org/docs/17/transaction-iso.html)
and [consistent lock ordering](https://www.postgresql.org/docs/17/explicit-locking.html).
No new dependencies, tables, migration, academic facts or approval semantics.
Final focused-review CI results are recorded in PR #7; local PostgreSQL remains
unavailable and locally skipped database tests must not be counted as passed.
