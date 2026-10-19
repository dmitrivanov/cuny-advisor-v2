# Phase 04C-UX verification — 2026-10-18

Branch: `feature/phase04c-ux-academic-explorer`, based on updated main `5078883`.
PR #13 was confirmed merged before work. Initial working tree was clean. Work is
frontend presentation/navigation, tests, one runtime dependency, screenshots and docs.
No backend API, evaluator, schema, ingestion fixture or persisted catalog was changed.

## Executed checks

| Command | Actual result |
| --- | --- |
| `cd backend && .venv/bin/python -m pytest -q -m 'not postgres'` | 165 passed, 75 deselected; 1 existing Google SDK Python deprecation warning |
| `cd backend && ruff check .` | Passed |
| `cd backend && black --check .` | 59 files unchanged |
| `cd backend && .venv/bin/python -m pip check` | No broken requirements |
| Explicit bootstrap, `alembic upgrade head`, `pytest -q -m postgres -rs` in fresh PostgreSQL 17 cluster | 75 passed, 165 deselected |
| `cd frontend && npm test` | 64 passed, 0 failed, 0 skipped (includes three explorer contrast checks) |
| `cd frontend && npm run lint` | Passed, zero warnings |
| `cd frontend && npm run typecheck` | Passed |
| `cd frontend && npm run build` | Passed |
| `cd frontend && npm run test:browser` | 49 passed, Chromium |
| `git diff --check` | Passed |
| Local Markdown link check across seven changed documentation files | 102 checked, zero missing targets |

Build and browser runs used an ignored rsync validation copy with the same source and
node_modules, protecting the owner's running development `.next` artifacts. Browser
fixtures ran on loopback ports 3100/3101. PostgreSQL used a fresh disposable cluster on
55438, explicit role bootstrap and migrations; the harness stopped its own cluster.
The owner's development database and existing service processes were not reset.

Browser regressions cover department/program separation, independent course search,
exact course deep links, real-rule empty states, source qualification, dialog Enter /
Escape / focus restoration, chat return, browser back/forward, API errors, synthetic
AND/OR upstream/downstream highlights, zoom, pan, fit, keyboard list, reduced motion,
375/768/1440 overflow and the existing selector/progress/conversation/registry flows.
Unit tests cover unsafe destinations, audit-context preservation, cycle termination,
size bounds, dangling references, immutable traversal and no edges from rule prose.

An initial browser run exposed a lost course-trigger focus and a hidden existing
cross-campus context warning; both were corrected. Test-only selector ambiguities,
expected traversal ordering and the library's exact “Zoom In” control name were also
corrected. Final checks include focus after transitioning out of the modal.

## Real local browser smoke check

Separately from mocked Playwright responses, the in-app browser at
`http://127.0.0.1:3000/campus/bmcc#catalog` showed 19 departments/offering units.
Opening Mathematics queried 45 persisted courses. Searching `MAT 301` returned
MAT 301 and MAT 301H. Opening MAT 301 showed its stored description, 4 credits,
2025–2026 year, provisional preparation text, qualification and official BMCC source
link. Its pathway action displayed the truthful empty state. No model call was made.
These observations exercised the existing Next.js → FastAPI → local PostgreSQL path.
They do not establish a complete academic audit or institutional approval.

[Live persisted course detail](images/phase04c-ux-live-course.png).

## Reviewed screenshots

The responsive screenshots use public catalog HTTP test fixtures; the seven-node
graph is explicitly fictional. They are not additional evidence of DB connectivity.
Screenshots disable animations for a stable final frame; sheet images capture the
viewport rather than extending a fixed overlay across a full-page image.

| Width | Courses | Course sheet | Fictional pathway |
| --- | --- | --- | --- |
| 375 | [Courses](images/phase04c-ux-courses-375.png) | [Sheet](images/phase04c-ux-detail-375.png) | [Graph](images/phase04c-ux-pathway-375.png) |
| 768 | [Courses](images/phase04c-ux-courses-768.png) | [Panel](images/phase04c-ux-detail-768.png) | [Graph](images/phase04c-ux-pathway-768.png) |
| 1440 | [Courses](images/phase04c-ux-courses-1440.png) | [Panel](images/phase04c-ux-detail-1440.png) | [Graph](images/phase04c-ux-pathway-1440.png) |

Before: [Phase 04C-1 source browser](images/phase04c1-browse-1440.png).
After: independent destination tabs, restrained course cards, progressive course
reading panel and context-specific uncertainty. Review inspected mobile, tablet and
desktop output; no horizontal overflow was observed or reported by automated checks.
At full-path fit on narrow screens the graph is necessarily small: use zoom or the
accessible list. No large-graph performance benchmark was conducted. Safari/Firefox
were not automatically tested. Native dialog/backdrop and forced-color fallbacks
are implemented; a full assistive-technology audit remains future work.

## Known limitations

No verified real prerequisite edges, verified program membership or new program
requirements were introduced. Latest browsing edition is not an audit assignment.
The graph is a visualization demonstration, never eligibility logic. Human-friendly
natural-language navigation beyond the exact local commands remains future work.

React Flow 12.12.0 is the only added direct dependency, installed with scripts disabled;
ELK was evaluated and deferred. npm reported five high advisories, already documented
in README before this phase. No unrelated dependency/audit fixes were attempted.
A transient automatic-approval usage-limit failure initially prevented a build from
running; the later authorized build and test executions succeeded.
