# Phase 03A verification and owner review

Date: 2026-10-17. Branch: `feature/phase03a-chat-first-ux`. Baseline: merged
Phase 02D PR #8, `d550232`. Independent local prototype; no institutional approval.

## Scope and references

Frontend UX only: conversation-only default, focused contextual tools, return/focus
management, compact four-column course cards and disclosures. Read-only reference:
pinned V1 `ba499bc078a4889ed7ed4ad2f381a5c6950753d3`, selector HTML/CSS/JS in the
existing audit cache. No owner comparison screenshots were available; V1 was not
run, imported or modified. See [parity decisions](V1_SELECTOR_PARITY.md).

Backend, academic evaluator, repositories, catalog fixtures, migrations, schema,
API/proxy routes, reducer, deterministic prompt router, dependencies and lockfile
are unchanged. No real records, new student persistence, AI or deployment.

## Actual local checks

Python 3.14.5, Node 24.18.0, npm 11.16.0; existing pinned dependencies reused.
The frontend was copied with `rsync` into ignored `var/phase03a-validation/frontend`
(excluding node_modules, .next and test artifacts), using a symlink to existing
node_modules. This kept production build/type generation and port-3100 browser
checks separate from the owner's existing port-3000 dev server. No package/config
changes were needed. The root generated `next-env.d.ts` change from the initial
check was restored; it is excluded from the scoped commit.

| Command | Actual result |
| --- | --- |
| `npm test` | 20 passed, 0 failed |
| `npm run lint` | Exit 0, no warnings/errors |
| `npm run typecheck` | Exit 0; route generation and TypeScript passed |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | Exit 0; production build succeeded |
| `CAPTURE_WORKSPACE_SHOTS=1 WORKSPACE_SCREENSHOT_DIR=/absolute/repo/docs/images npm run test:browser` | 13 Chromium tests passed |
| `.venv/bin/python -m pytest -q -m 'not postgres'` (from backend) | 102 passed, 61 deselected in 0.51s |
| Local Markdown target check and `git diff --check` | Passed |

Frontend commands above ran inside the isolated copy; the same commands run from
`frontend/` in CI/on a stopped development environment. An initial browser run found
ambiguous error locators (including the Next route announcer) and overly broad error
mocks. Error scenarios now run independently and mock only the intended failing
capability. Final reruns passed; earlier failed runs are not counted as passing.

The browser suite mocks public academic responses to isolate UX behavior. These
13 passes and the screenshots below are **not PostgreSQL connectivity evidence**.
It checks default absence of dashboard/menu/context controls, explicit module
invocation, return focus, conversation/selection/precision retention, visual column
ordering, card structure and hidden technical IDs, disclosure without checkbox
toggling, unresolved empty pools, errors, release clearing, refresh/history/deep
links, keyboard entry/return, reduced motion, noindex, and readable titles/no overflow
at 375/768/1440px. Presentation unit tests prove column sorting does not mutate
canonical projections or group identities and known absent titles stay honest.

## Separate real local application smoke check

In the actual in-app browser at `http://127.0.0.1:3000`, using the existing FastAPI
server on loopback 8000 and dedicated PostgreSQL on loopback 55432:

1. Reloaded the partial CIS catalog deep link; persisted 18-course catalog loaded
   with explicit partial-data limitations and concise missing-title fallbacks.
2. Returned to chat and used its Completed Courses action; chose the persisted
   BMCC Computer Science A.S. 2026–2027 draft-2 explicitly inside the module.
3. Selected MAT 301 and CSC 101; returned to chat and observed two retained unique
   hypothetical selections, with the conversation/input visible and no dashboard.
4. Sent the exact supported degree-requirements prompt, opened its Degree Progress
   action and confirmed the fictional passed-course assumption.
5. Ran the real backend preview: engine `02b.1`, **7** hypothetical unique earned
   credits, **0** allocated credits, overall degree status **unresolved**. Missing
   academic approval, discipline evidence, partial-audit and STEM allocation issues
   remained explicit; grade and conflicting transfer conditions stayed unresolved.

No browser interception was used in this separate smoke check. The local database
contains the reviewed CS draft-2 and partial CIS draft-1 fixtures from the prior
setup. No bootstrap, fixture import or migration was run in Phase 03A. Local
PostgreSQL integration tests were not rerun: no backend changes required them,
and the development fixture database was not polluted with fault-injection tests.
Existing CI still executes its separate fresh PostgreSQL integration job.

## Screenshot self-review

These images use explicitly mocked reviewed public fixture responses and fictional
selections. They demonstrate appearance/interaction, not verified academic policy
or a complete audit. Each final image was opened and visually reviewed locally.

- [Minimalist chat homepage](images/phase03a-chat-home.png)
- [Conversation with a module action](images/phase03a-chat-action.png)
- [Four-column selector, desktop](images/phase03a-selector-desktop.png)
- [Expanded class details](images/phase03a-course-details.png)
- [Mobile chat, 375px](images/phase03a-chat-mobile.png)
- [Mobile selector, 375px](images/phase03a-selector-mobile.png)

Review findings: conversation home has one surface with restrained chrome; selected
cards have a text label and subtle accent; unselected cards have equal structure;
course titles wrap at whole words. Redundant single-course requirement headings
were removed visually and details moved into the course disclosure. Expanded
provenance remains dense on purpose but is on demand. Mobile stacks the columns,
so long elective pools require vertical scrolling; search reduces that list without
inventing missing pools. Focus outlines remain visible, including module headings.

## Limits and manual owner checklist

Chromium/local in-app browser checks are not Safari/Firefox, device hardware or a
screen-reader audit. Existing palette contrast tests passed; this is not an
accessibility certification. Reduced-motion was emulated; unsupported-filter,
forced-colors and reduced-transparency fallbacks were retained/reviewed in CSS,
not tested in separate legacy engines. Existing npm advisories remain unchanged
technical debt. No dependencies or advisory suppressions were added.

- [ ] Open `/` and confirm no module menu, program dropdown or dashboard.
- [ ] Use a supported prompt, open its tool action and choose an exact release.
- [ ] Tab/Enter through course controls and expand Class details without selecting.
- [ ] Select courses/propose exact credits, return to chat, and reopen the tool.
- [ ] Change release and confirm incompatible selections/allocations clear.
- [ ] Run the explicitly hypothetical preview; inspect unresolved evidence.
- [ ] Review 375/768/1440px layouts, long titles, disclosure and visible focus.
- [ ] Review screenshots and known missing academic metadata; do not infer approval.

Owner review is required before merge. No merge, deployment, next phase or Gemini
integration is performed by this task. Remote CI results belong to the PR checks.
