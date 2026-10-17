# Phase 03B verification and owner review

Date: 2026-10-17. Branch: `feature/phase03b-multicampus-profile`.
Preflight verified PR #9 **merged** (`cb548e40ffae2f23dcd35efaaed78c3410870cfb`),
clean tree, fetched/fast-forwarded main, then created this branch from main.
No stacking on an unmerged PR or history rewrite.

## Implemented scope

- A typed eight-campus display/capability registry and dark, art-directed SVG/native
  button constellation at `/`; hover/focus emphasis, touch selection, contextual
  information, accessible list and reduced-motion fallback.
- Shared light minimal chat at `/campus/bmcc`, safe future/unknown routes and explicit
  legacy BMCC hash/query migration. Only BMCC is a local operational pilot.
- Campus-neutral evidence-aware in-memory profile/session, independent institutions,
  current/intended programs and completed/in-progress/planned histories.
- Goal-dependent readiness, one contextual question, exact bounded intents/correction,
  optional review/secondary goals and validated future-provider proposal contracts.
- Explicit fictional course-list/context bridges; no automatic award, verification,
  applicability assignment, transfer mapping or TypeScript academic calculations.

No backend/API/proxy/evaluator/repository/schema/migration/catalog fixture changes.
No dependencies or lockfile changes, Gemini, real student data, accounts, permanent
profiles, uploads, institutional integration, planner/report service or deployment.
V1 was not touched. Existing local services were not restarted or reconfigured.

Campus names/types: verified against the official [CUNY directory](https://www.cuny.edu/about/university-resources/telephone-email-directories/)
on 2026-10-17, Senior Colleges/Community Colleges sections. Availability/positions
are project choices. Edges mean illustrative network membership only, not transfer
agreements, geography or academic pathways. No official logos are used.

## Actual checks

Existing Python 3.14.5, Node 24.18.0 and npm 11.16.0 dependencies were reused.
Frontend source/tests were copied to ignored `var/phase03b-validation/frontend`,
with existing node_modules symlinked; generated output and the loopback port-3100
production test server stay separate from the owner's running dev server on 3000.
No test configuration or dependency was changed to achieve this isolation.

| Command | Actual result |
| --- | --- |
| `npm test` | **47 passed**, 0 failed |
| `npm run lint` | Passed, no warnings/errors |
| `npm run typecheck` | Passed; generated routes and TypeScript |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | Passed, including dynamic `/campus/[slug]` |
| `CAPTURE_MULTICAMPUS_SHOTS=1 WORKSPACE_SCREENSHOT_DIR=/absolute/repo/docs/images npm run test:browser` | **26 passed**, including existing Phase 03A workflows |
| `.venv/bin/python -m pytest -q -m 'not postgres'` (backend) | **102 passed, 61 deselected**, 0.61s |
| `.venv/bin/python -m pip check` (backend) | No broken requirements |
| Local Markdown target check and `git diff --check` | Passed |

PostgreSQL fault-injection integration tests were not rerun locally because no
backend/persistence changes required them. The reviewed development fixture database
was not modified/polluted with test rows; CI retains its separate fresh PostgreSQL
service job. Remote CI status is reported on the PR, not assumed from local checks.

Initial runs caught tablet decorative orbit overflow, an ambiguous goal label and
unused test imports. Fixes clip decorative overflow, provide an explicit select
label and remove unused imports. Screenshot self-review also fixed a tablet badge
stretching as a grid item, replaced truncated decorative initials and distinguished
BMCC hover zoom from its default selected appearance. These were corrected before
the final passing run; earlier failed runs are not passing evidence.

## Automated coverage

Profile/readiness tests cover all six relationships, unknown enrollment, a different
current institution, prospective students with no college history, returning users,
multiple educational affiliations, independent current/intended programs, course
stages, explicit none versus unknown/NA, conflicts, provenance preservation/rejected
promotions, goal changes/secondary goals, corrections, catalog uncertainty, no global
grade requirement, conditional prerequisite results, future-campus capabilities,
neutral initial assistant identity, acknowledged unknowns without repeated questions,
explicit goal clearing and rejected future-provider proposals.

Browser tests cover eight nodes and one pilot, hovered/focused campus information,
reduced-motion CSS, native touch input, 375/768/1440px overflow and node bounds,
BMCC entry, future/unknown blocking even with misleading BMCC query parameters,
legacy route migration, cross-campus query rejection, mismatched response identity,
exact-release applicability invalidation, adaptive questions/correction,
profile retention through client navigation/reset on refresh, explicit profile-course
copy, all existing selector/preview/state/focus/history/error regressions.

UI catalog tests use explicitly mocked reviewed fixture responses. They and the
screenshots are not evidence of PostgreSQL connectivity or academic approval.
Light and dark palette tests check readable text/action/focus token contrast.

## Separate unmocked local browser smoke

Actual in-app browser against Next.js `127.0.0.1:3000`, existing FastAPI on 8000 and
local V2 PostgreSQL on 55432 (no interception):

1. Existing root BMCC query/hash link migrated to `/campus/bmcc` with exact context.
2. Campus selection displayed CCNY information with **no assistant entry action**;
   returning to BMCC opened its real scoped conversation.
3. Supported program-exploration intent opened Academic Catalog without asking
   history/scheduling questions. Explicit CS draft-2 selection loaded **28** persisted
   catalog courses and retained the four canonical requirement categories.
4. Completed Courses selected MAT 301 and CSC 101; returning to chat retained **2**
   unique fictional selections and the conversation.
5. The existing degree-requirements prompt opened its limited preview. After explicit
   hypothetical consent, real evaluation returned engine **02b.1**, **7** hypothetical
   unique earned credits, **0** allocated credits and overall **unresolved**. Academic
   approval, discipline evidence, partial audit, STEM/grade/transfer policy gaps stayed
   explicit. No profile information was sent as an academic record.

No migration/bootstrap/import, provider configuration or existing-service mutation
was performed. All new profile examples are fictional and remain in tab memory.

## Eight screenshots and visual self-review

Opened every image locally; reviewed typography, art-directed balance, label/node
separation, thin curved connections, restrained glow, whole-word text, glass/light
chat transition, mobile selector and tablet information layout. Hover frames wait
for the finite transition to settle; there is no continuous animation. Only desktop/
tablet present the constellation; mobile deliberately uses the permitted accessible
selector instead of squeezing the graph. No graph library, external logo or imagery.

1. [Landing, 1440px](images/phase03b-landing-1440.png)
2. [BMCC hovered](images/phase03b-bmcc-focus.png)
3. [CCNY hovered, unavailable](images/phase03b-ccny-focus.png)
4. [Landing, 768px](images/phase03b-landing-768.png)
5. [Landing, 375px](images/phase03b-landing-375.png)
6. [BMCC chat entry](images/phase03b-chat-entry.png)
7. [Goal-aware contextual action](images/phase03b-chat-action.png)
8. [Existing Completed Courses after routing](images/phase03b-completed-courses.png)

## Limits and deliberate choices

- No unrestricted language understanding: eight exact goal labels, four previous
  navigation prompts, one documented registry-based institution correction grammar.
  Structured controls are the correction fallback. No fake LLM or wizard.
- Information readiness can say planning/handoff ready, but full planning, transfer
  equivalence, academic approval and handoff capabilities remain **unimplemented**.
- The profile is conceptual, fictional and transient. Leaving the campus workspace
  resets its conversation/selector while independent profile facts survive client
  navigation. Refresh resets all. Course history never repopulates an academic
  selector automatically or infers new-campus applicability.
- Source verification is not approval; academic policy/catalog gaps remain unchanged.
- Browser evidence is Chromium/in-app plus emulated touch/reduced motion, not real
  device hardware, Safari/Firefox or a screen-reader audit. Existing forced-color/
  transparency fallbacks are retained; no complete accessibility certification.
- Existing npm advisories are unchanged technical debt. No dependency remediation,
  production access, student data or institutional integration is authorized.

## Owner checklist

- [ ] Inspect landing/hover at 1440px and tablet 768px: no overlaps, calm motion.
- [ ] Test keyboard and reduced motion; inspect CCNY and confirm no entry action.
- [ ] Test mobile tap then explicit BMCC entry; review accessible campus list.
- [ ] Confirm assistant choice does not populate current institution/relationship.
- [ ] Explore programs without a survey; change goal and answer one question.
- [ ] Correct the current institution; inspect invalidated program/context assumptions.
- [ ] Review explicit none/unknown/not-applicable and provenance distinctions.
- [ ] Open CS selector and hypothetical preview; inspect unresolved academic conditions.
- [ ] Switch routes/refresh; verify documented transient-state behavior.

Stop at owner PR review. Do not merge, deploy, start another phase or integrate Gemini.
