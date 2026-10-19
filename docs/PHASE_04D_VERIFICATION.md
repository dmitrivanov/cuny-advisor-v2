# Phase 04D verification — 2026-10-19

Branch `feature/phase04d-degree-maps`, based on main `7db961a`. PR #13 was merged;
PR #14 was initially open. The owner chose to merge #14, and its merged status was
confirmed before fast-forwarding the new branch. Initial working tree was clean.

## Actual checks

| Command / check | Result |
| --- | --- |
| `cd backend && .venv/bin/python -m pytest -q -m 'not postgres'` | 172 passed, 75 deselected; one existing Google SDK deprecation warning |
| Fresh PostgreSQL 17 bootstrap, explicit Alembic upgrade, `pytest -q -m postgres -rs` | 75 passed, 172 deselected |
| `ruff check .` / `black --check .` in backend | Passed; 61 Python files unchanged |
| `.venv/bin/python -m pip check` | No broken requirements |
| `cd frontend && npm test` | 72 passed, zero failed/skipped |
| `npm run lint` / `npm run typecheck` | Passed |
| `npm run build` | Passed |
| `npm run test:browser` | 60 passed, Chromium |
| Isolated keyboard modal regression, `--repeat-each=12` | 12 passed |
| `git diff --check` | Passed |

Frontend builds/browser checks used an ignored validation copy of the same source
and node_modules to protect the existing frontend's development build artifacts.
Playwright fixture servers bind loopback ports 3100/3101. PostgreSQL checks used a
fresh disposable cluster on 55439 with explicit role/bootstrap/migrations and stopped
that cluster afterwards. No existing development data, role or schema was changed.

Backend projection tests cover real CS/CIS context, immutable input, exact decimal
strings, no unverified prerequisites, synthetic nested AND/OR, empty evidence,
provisional/year-unconfirmed sources, outgoing/incoming conflicts, unsupported grade
and unknown OR branches, and collision-resistant condition identities. The retained
frontend CS/CIS graph fixtures are checked against the backend projection. Existing
MAT 206/301/302 regressions remain in the passing unchanged engine suite.

Frontend tests cover context/bounds/malformed payload rejection, deterministic layout,
cycle-safe traversal, relationship separation, display compression, unchanged canonical
state, source-safe explanation text and exact values. Browser tests cover program
chat preview/edition choice, detail/source/focus behavior, graph/list parity, collapse,
AND/OR/upstream/downstream, direction controls, keyboard search/removal, shared progress,
late-response rejection, unknown-course/missing-map views, reduced motion, responsive
layout and all existing selector/conversation/institution/academic regressions.
No screen-reader certification or full accessibility audit is claimed. Keyboard and
ARIA behavior were checked in Chromium; Safari and Firefox were not tested.

Early browser runs caught an open suggestion list obstructing later controls,
mobile select intrinsic-width overflow, and modal trigger focus loss during graph
updates. The intermittent focus bug was reproduced with narrow focus diagnostics:
controlled nodes lost measured dimensions during rerenders and temporarily became
unfocusable. Retaining measured visual dimensions and stable initial bounds resolved
12 repeated runs; native dismissal also closes the dialog before detachment. Temporary
diagnostics were removed. These issues were corrected. Layout was revised to avoid paths visually traversing
intervening node columns. Single-course requirements share course cards without
changing the backend AST or outcomes. No known failed checks remain.
Local Markdown links across eight changed guidance/docs files: 117 checked, zero missing.

## Actual local database browser workflow

A separate Gemini-disabled backend at `127.0.0.1:8100` used only the existing runtime
SELECT role for disposable database `cuny_advisor_v2_dev` on local PostgreSQL 55432,
schema `cuny_advisor_v2`. A built frontend on `127.0.0.1:3200` queried it. Existing
owner services on 3000/8000 were not stopped or reconfigured. Only the root local
V2 runtime URL was loaded privately; `backend/.env.local` was not inspected or changed.

The browser loaded the persisted CS 2026–2027 draft map, opened compact history,
added fictional MAT 301 and CSC 101, returned to the map with two reported courses,
acknowledged hypothetical passed-course assumptions, and ran the actual backend
preview. It returned **7 hypothetical unique credits, 0 allocated credits, degree
status unresolved**. The same result appeared on the map, alongside remaining and
unresolved requirement states. No mocked academic responses or Gemini calls were
used in this smoke check. No student records were created or imported.
[Live map / synchronized preview](images/phase04d-live-map.png).

The isolated review frontend is available at [local port 3200](http://127.0.0.1:3200/campus/bmcc#chat)
while its two verification processes remain running. Normal local development uses
the README commands; restart the backend to load the additive graph DTO, without
migrating or reimporting data. These verification-only launchers live under ignored
`var/phase04d-review`; they are not application startup behavior.

## Screenshots reviewed

Responsive screenshots use clearly scoped public HTTP test fixtures. They are not
additional proof of database connectivity. Any prerequisite AND/OR graph used in
browser tests is a separately labeled synthetic fixture, not a real BMCC degree map.

| Width | Degree map / list | Compact history |
| --- | --- | --- |
| 375 | [Map/list](images/phase04d-map-375.png) | [History](images/phase04d-history-375.png) |
| 768 | [Map](images/phase04d-map-768.png) | [History](images/phase04d-history-768.png) |
| 1440 | [Map](images/phase04d-map-1440.png) | [History](images/phase04d-history-1440.png) |

No document overflow at the tested widths. Wide graphs may need zoom/focus or the
list; mobile initially uses the list. Screenshots use stable animation-disabled
frames. The prior four-column view remains available as a secondary disclosure,
not the default long list. Native full-screen mobile details remain edition-bound.

## Boundaries and limitations

CS: 49 projected nodes, 31 membership edges, 17 requirement groups (6 unresolved).
CIS: 26 nodes, 17 membership edges, 6 requirement groups (3 unresolved). Neither
real draft has a verified prerequisite edge under current evidence checks. Visible
counts vary with scope, collapsed groups and safe single-course display compression.
No complete graduation audit or finished BMCC ingestion is claimed. Missing descriptions,
hours, grades, terms, source applicability and unsupported conditions remain explicit.

No dependencies, source releases, engine logic, schema, migrations, credentials,
production resources or V1 files/data were changed. Five pre-existing high npm
advisories remain unrelated technical debt; no audit suppression/fix was introduced.
No merge, deploy, next phase, model calls or real student data.
