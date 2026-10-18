# Phase 04C-1 verification — 2026-10-17

Branch `feature/phase04c1-bmcc-catalog`, based on updated main `c7e0b44`
(merged PR #12 confirmed). Initial working tree was clean. Root authorization is
scoped to 04C-1; generated frontend AGENTS.md is preserved, installed Next.js fetch
and route-handler documentation read. No dependency changes, Gemini calls, secrets
inspection, backend/.env.local change, real records, V1 access, merge or deployment.

## Executed automated checks

| Working directory | Command | Actual result |
| --- | --- | --- |
| backend | `.venv/bin/python -m pytest -q -m 'not postgres'` | **165 passed, 75 deselected**, one existing google-genai Python 3.14 deprecation warning |
| backend | `.venv/bin/python -m pytest -q -m postgres -rs` | **75 passed, 165 deselected**, zero skipped, 10.09s |
| backend | `ruff check .` | Passed |
| backend | `black --check .` | Passed; 59 files unchanged |
| backend | `.venv/bin/python -m pip check` | No broken requirements |
| frontend | `npm test` | **55 passed**, zero failed/skipped |
| frontend | `npm run lint` | Passed, zero warnings allowed |
| frontend | `npm run typecheck` | Passed |
| frontend | `npm run build` | Passed, Next.js 16.4.2 Webpack |
| frontend | `CAPTURE_BMCC_SHOTS=1 WORKSPACE_SCREENSHOT_DIR=/absolute/repository/docs/images npm run test:browser` | **46 passed**, zero failed/skipped, 14.4s |

Ruff/Black were installed existing tools, not added project dependencies. Frontend
checks ran from an ignored isolated copy at `var/phase04b-validation/frontend`,
sharing existing node_modules, to preserve the owner's active dev-server .next.
Existing dependency advisories remain unrelated debt. Color-variable and SDK warnings
were not suppressed. Unit/PG selections together cover all 240 backend tests.

The final PostgreSQL run used a new independent PostgreSQL 17.11 cluster on loopback
55437, database `cuny_advisor_v2_test`, generated disposable passwords privately,
explicit existing bootstrap, Alembic upgrade, then the PG test command above. The
harness stopped its own cluster in finally. A previous fresh run at port 55436 also
passed all 75 tests. No unrelated database, role or development cluster was reset.

Coverage includes deterministic source staging/review replay, full source membership,
exact Decimal serialization, program/department relationships and uncertainties,
unique scoped codes, year/source mismatch rejection, missing/cyclic source format,
AND/OR/grade/placement/test/permission/concurrent/program condition representations,
unknown rule behavior, frozen migration DDL, API schemas/search/pagination/errors,
full idempotent import, historical retention, conflicting-identity rollback,
missing/extra/modified projection rejection, immutable rows, runtime SQLSTATE 42501
write refusal and scoped relationship foreign keys. Existing academic MAT progression,
selector/allocation/progress and gateway-fallback tests are retained.

Playwright uses the existing explicit public institution HTTP test fixture and mocked
source/academic API responses. It verifies UI contracts, not real database access or
live Gemini. New cases cover source browser, provisional prerequisite disclosures,
program-year uncertainty, unavailable service/return to chat, and responsive widths
375/768/1440 with no horizontal overflow. Earlier runs caught a snapshot label locator,
an overly broad rule assertion, and mobile native-select width; the control label,
scoped assertions and existing workspace-input styling fixed them without suppressing
checks or increasing timeouts. All prior 41 browser regressions remain passing.

Final `git diff --check` passed. All **67 modified/new paths**, including untracked
source artifacts, were inspected; all JSON parsed and the scoped secret-pattern scan
found no API keys, private keys or credential-bearing URLs. **137 relative Markdown
links passed** an existence check. Downloaded HTML, service logs, environment files,
test clusters and validation build artifacts remain ignored. Existing dependency
lockfiles and generated frontend agent guidance are unchanged.

## Separate actual PostgreSQL → FastAPI → Next.js browser check

Reused only local disposable `cuny_advisor_v2_dev` at 127.0.0.1:55432, schema
`cuny_advisor_v2`, with existing migration/runtime roles. Explicit Alembic upgrade
and current returned **04c1_001 (head)**. Two explicit reviewed CLI imports both
reported **1,263 credit courses** and `bmcc-bulletin-2025-2026-20261017-r1`.
Both old academic release bindings/digests were compared before and after: unchanged.
Institutional registry still returned 26, only BMCC pilot.

Restarted only verified local V2 backend on 127.0.0.1:8000, kept existing frontend
127.0.0.1:3000 and database running. Loaded only selected existing V2 database settings;
never inspected backend/.env.local. Gemini remained disabled.

Actual HTTP responses:

- Health 200: `{"status":"ok","service":"cuny-advisor-v2-api"}`.
- `/api/v1/bmcc-catalog/snapshots` and Next `/api/bmcc-catalog/snapshots`: 200, one snapshot.
- Exact-snapshot `/departments`: 200, 19 entries (18 academic departments plus offering unit).
- `/programs`: 200, 67 entries; `/sources`: 200, 41 sources.
- `/courses?q=MAT%20301`: 200, two matches (standard/honors); standard course
  credits_min **"4"**, prerequisite status **provisional**.
- Existing academic release discovery: 200, two retained releases; institutional
  API/proxy: 200, 26 institutions.

In the actual in-app browser, opened BMCC Academic Catalog, expanded the browser,
explicitly selected 2025–2026 and searched MAT 301. Full persisted description,
four credits, six contact/lecture hours, dated Bulletin source, and year-unconfirmed
department prerequisite text appeared. Structured interpretation remained unresolved,
academic review required. No browsing choice assigned the 2026–2027 audit release
or added a course to completed history. Existing CS/CIS release choices remained
available separately. No mocked response was installed in this live browser.

## Evidence and manual review

[Real local database-backed catalog](images/phase04c1-live-catalog.png).
Controlled fixture browser captures: [375px](images/phase04c1-browse-375.png),
[768px](images/phase04c1-browse-768.png), [1440px](images/phase04c1-browse-1440.png).
Images were visually inspected. Fixture screenshots intentionally use three sample
source courses and an empty audit-release list; they do not claim all 1,263 courses
are simultaneously rendered or imply the real development fixtures are absent.

Review locally at http://127.0.0.1:3000/campus/bmcc#catalog, expand “Browse BMCC
source catalog”, choose the snapshot and search/filter/open evidence. Return to
chat and use existing Completed Courses/Progress with an explicit old draft release
to verify separate context. Browser/data services remain loopback-only for review.
No claim of exhaustive browser/assistive-technology or performance certification.

## Sources, coverage and remaining work

[Design/source report](BMCC_CATALOG_INGESTION.md) and the machine-readable coverage
artifact record explicit denominators and exceptions: 18/18 academic departments,
67/67 program entries, 1,263/1,265 positive-credit candidates (two Italian code
conflicts quarantined), 1,263 complete descriptions/credit ranges, 656 provisional
prerequisite text blocks and zero verified structured new eligibility rules.
Other fields have separate capture rates. Eleven zero-credit entries are retained
as source observations but excluded from credit-course browsing.

Known limits: website/Bulletin years differ; no resolved Bulletin requisite definitions,
automatic rule parser/approval, verified program ownership/year mapping, complete
program requirements, real student state, registration, provider change or deployment.
Gemini live verification remains pending/unavailable and was not attempted.
Full degree-requirement ingestion and validation belong to separately authorized 04C-2.
