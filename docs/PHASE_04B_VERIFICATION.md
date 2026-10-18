# Phase 04B verification — 2026-10-17

Branch `feature/phase04b-institutional-registry`, from main `02f5363` containing
merged Phase 04A PR #11 (`4563cb6`) and the owner's generated frontend instructions.
No dependencies added; no backend/.env.local inspection/change, live Gemini call,
academic evaluator/fixture change, V1 access, real records, merge or deployment.

## Executed automated checks

| Working directory | Exact command | Actual result |
| --- | --- | --- |
| backend | `.venv/bin/python -m pytest -q -m 'not postgres'` | **154 passed, 69 deselected**, 1 existing google-genai Python 3.14 deprecation warning, 1.29s |
| backend | `.venv/bin/python -m pytest -q -m postgres -rs` | **69 passed, 154 deselected**, zero skipped, 6.34s |
| backend | `ruff check .` | Passed (48 Python files in scope for Black below) |
| backend | `black --check .` | Passed, 48 files unchanged |
| backend | `.venv/bin/python -m pip check` | No broken requirements found |
| frontend | `npm test` | **53 passed**, 0 failed / skipped |
| frontend | `npm run lint` | Passed, zero warnings allowed |
| frontend | `npm run typecheck` | Passed |
| frontend | `npm run build` | Passed, Next.js 16.4.2 Webpack production build |
| frontend | `CAPTURE_INSTITUTION_SHOTS=1 WORKSPACE_SCREENSHOT_DIR=/absolute/repository/docs/images npm run test:browser` | **41 passed**, 0 failed / skipped, 14.5s |

Frontend verification used an ignored isolated copy under
`var/phase04b-validation/frontend` with existing node_modules symlinked, so the
owner's active dev-server build directory was not overwritten. No npm install or
advisory changes were needed. Existing dependency advisory debt remains as previously
documented. Browser output includes the harmless FORCE_COLOR/NO_COLOR warning.

The PostgreSQL run used PostgreSQL 17.11 and a fresh, independent loopback cluster
on port 55435, database `cuny_advisor_v2_test`. An ignored local harness generated
throwaway passwords privately, explicitly ran existing bootstrap, `alembic upgrade
head`, then the command above; it stopped its own cluster in finally. It did not
reset the owner's database or alter unrelated roles/services. CI uses the existing
PostgreSQL 17 service and the same bootstrap/migrate/test commands. Unit and PG
selections together cover all **223 backend tests**.

New backend coverage: source membership and classification, unique IDs/slugs/names,
source references, schema contract, frozen DDL/metadata equality, safe empty/failure
API, explicit idempotent DB import, no catalog digest changes, historical retention,
atomic conflicts, runtime SQLSTATE 42501 write rejection, append-only trigger rejection,
cross-snapshot foreign keys, BMCC-only capability constraints, and complete projection
drift (missing/extra/modified/shared-source) rejection. The original 16-table migration
comparison is retained separately from the five-table registry comparison.

Playwright uses an explicit **test-only** stdlib HTTP fixture on loopback 3101 for
SSR/proxy institutional reads and existing route fixtures for academic/provider tests.
These 41 tests verify contracts/UI, not real PostgreSQL or live Gemini. Coverage
includes backend-derived labels/categories, all registry nodes, BMCC routing,
Medicine/Macaulay notes, unsupported notices, loading/error/retry/empty states,
375/768/1440px targets (>=44px, no pairwise overlaps or horizontal overflow), keyboard,
touch, motion pause/reduced motion, existing profile corrections and BMCC module flow.
A first browser run had one strict-locator collision with Next's route announcer;
scoping the error assertion to registry text fixed the test without suppressing errors.
The full rerun above passed. No provider test is described as live verification.

Final `git diff --check` passed. A local link-existence check across changed/new
Markdown checked **113 relative links, zero missing**. All 52 changed/new file paths
were reviewed, including untracked files; a scoped secret-pattern scan found no API
keys, private keys or credential-bearing database URLs. Environment/log/test-cluster
artifacts remain ignored. Generated frontend agent instructions are unchanged.

## Actual local PostgreSQL → FastAPI → Next.js → browser

Separately from mocked browser tests:

1. Reused the owner's disposable PostgreSQL on `127.0.0.1:55432`, database
   `cuny_advisor_v2_dev`, isolated schema `cuny_advisor_v2` and existing role separation.
2. Explicit `alembic upgrade head`; `alembic current` returned **04b_001 (head)**.
3. Ran `.venv/bin/python -m app.institutions.import_registry` twice; both returned
   **Imported 26 institutions: cuny-institutions-2026-10-17-r1**.
4. Compared both existing academic release bindings/digests before and after:
   unchanged CS A.S. draft-2 and partial CIS A.A.S. draft-1. Registry reconstruction
   passed integrity validation using the runtime role.
5. Restarted only the verified V2 backend (loopback 8000), with `GEMINI_ENABLED=false`,
   existing runtime-role database configuration, no startup migrations/import and no
   reading of backend/.env.local. Kept the owner's frontend (loopback 3000) and DB running.
6. HTTP checks: `/api/v1/health` **200**, `{"status":"ok","service":"cuny-advisor-v2-api"}`;
   `/api/v1/institutions` **200, 26 rows**; Next `/api/institutions` **200, 26 rows**;
   `/api/v1/academic/releases` **200, 2 rows**.
7. In the actual in-app browser at port 3000, retried a pre-import unavailable state:
   all 26 institutions appeared. Medicine exposed only its unavailable notice;
   dismiss worked. BMCC opened chat with **No live AI**.
8. Opened Completed Courses, explicitly selected CS A.S. 2026–2027 draft-2, loaded
   persisted course rows, selected fictional MAT 301 and CSC 101. Returned to chat:
   **2 unique hypothetical selections retained**. An unsupported free-form prompt
   correctly returned local-mode limitations and safe module actions.
9. Opened Degree Progress, explicitly consented to fictional passed-course assumptions,
   and ran the limited preview: **7 hypothetical unique earned credits**, **0 allocated**,
   **overall degree status unresolved**. Source conflicts, provisional grades, STEM
   allocation and missing institutional academic approval remained explicit.
10. Returned the browser to campus discovery. Local V2 backend/frontend/DB remain
    running for owner review; no external exposure or production connection.

Gemini live verification is **pending: credentials unavailable**. It was neither
required nor attempted. Public registry facts cannot unlock other-campus catalogs.
This does not establish a complete audit, academic approval or production readiness.

## Screenshots and manual review

Real local DB-backed browser captures:

- [Live registry](images/phase04b-live-registry.png)
- [Live BMCC unresolved preview](images/phase04b-live-bmcc-preview.png)

Controlled test-fixture captures (not evidence of DB connectivity):

- [Desktop constellation](images/phase04b-registry-desktop.png)
- [375px](images/phase04b-registry-375.png), [768px](images/phase04b-registry-768.png),
  [1440px](images/phase04b-registry-1440.png)
- [Specialized institution focus](images/phase04b-specialized-institution.png)
- [Registry unavailable](images/phase04b-registry-unavailable.png)

Screenshots were visually inspected. Review locally at http://127.0.0.1:3000/;
use Tab/Enter/Space and the accessible list, dismiss a planned-campus notice, then
open BMCC and repeat the fictional course/preview flow above. Small-screen grids
scroll vertically; no claim of testing every browser/assistive-technology combination.
Native select interaction during live dev reload briefly invalidated an AX element;
fresh state and the native menu completed the workflow. No source workaround needed.

## Scope and follow-up

Core changes: `backend/app/institutions/`, read-only API, `04b_001`, five metadata
tables and targeted tests; frontend proxy/context, dynamic campus routes, data-derived
profile aliases and scaled constellation; source/design/API/decision/roadmap docs.
Generated frontend AGENTS.md is unchanged. No other campus academic fixtures, rules,
new authentication, CMS, database student persistence or deployment are included.

Known limits and Phase 04C recommendations: [registry design](INSTITUTIONAL_REGISTRY.md).
Source refresh is manual and dated; HTTP/legacy website links preserve source evidence;
Macaulay/Medicine classification notes need continued review as official sources evolve.
Future activation needs separately reviewed academic catalogs and owner authorization.
Identity/support changes require a reviewed migration. Phase 04C is not implemented.
