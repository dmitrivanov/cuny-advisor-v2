# Phase 04A verification and owner review

Branch: `feature/phase04a-gemini-gateway`. Date: 2026-10-17.
Preflight verified PR #10 merged at `ab940ac212d6b3ace82490fb91a292373dc7501b`,
clean working tree, fetched origin, fast-forwarded local main and created this branch.
No unmerged/stale base, history rewrite, merge or deployment.

## Delivered scope

Backend-only maintained Google GenAI adapter; strict Pydantic conversation/proposal
contracts; local-only API and bounded same-origin Next.js proxy; explicit dotenv
startup; opt-in fictional chat with external-provider notice; pending confirmation,
stale-state checks, loading/fallback and existing action/profile/readiness reuse.
No new frontend dependencies, academic calculations, catalog/schema/fixture changes,
AI academic retrieval, scraping, accounts, persistent profiles/chat or real records.

All new direct/transitive Python SDK dependencies are pinned. `google-genai` is the
only new direct runtime capability; its auth/HTTP/crypto/retry/websocket libraries
are SDK dependencies. No deprecated Google generative SDK or dotenv package added.
Existing npm advisories remain unchanged technical debt.

## Actual local checks

Frontend checks ran against an ignored source-identical copy at
`var/phase04a-validation/frontend`, using existing node_modules, to preserve the
owner's running dev server/build artifacts. Browser checks used the existing
Playwright harness and a separate loopback production server on 3100.

| Check | Result |
| --- | --- |
| Backend `.venv/bin/python -m pytest -q -m 'not postgres'` | **146 passed, 61 deselected**, 1.31s |
| `ruff check backend/app backend/tests backend/scripts/run_local.py backend/scripts/smoke_gemini.py` | Passed |
| Black check on all changed/new Python implementation/test/startup files | Passed, 11 files unchanged |
| Backend `.venv/bin/python -m pip check` | No broken requirements |
| `npm test` | **51 passed**, zero failures |
| `npm run lint` | Passed, zero warnings/errors |
| `npm run typecheck` | Passed |
| `npm run build` | Passed, including conversation proxy routes |
| `npm run test:browser` | **35 passed**, 11.6s (final run; capture run also passed) |
| `git diff --check` | Passed |
| `git check-ignore backend/.env.local .env.local` | Both ignored; no secret contents read |
| `.venv/bin/python -m scripts.smoke_gemini` | Explicitly skipped; no network request without `--live` |

Existing PostgreSQL tests run in the fresh disposable PostgreSQL CI job after push.
Their final status belongs to the PR/checks and completion report; they are not
claimed as locally executed against the owner's reviewed development database.

SDK import emits a Python 3.14 deprecation warning for `_UnionGenericAlias` (planned
Python 3.17 removal). It does not fail tests; no suppression or unrelated dependency
remediation was introduced. Pip also reported its existing unwritable-cache warning.

## Test evidence

Backend fake providers cover multi-turn history, reported program/course stages,
correction proposals against confirmed facts, malformed/extra fields, invalid
campuses/actions/goals/evidence, rejected academic applicability/relationship edits,
program/course institution mismatch, duplicate proposals, safe errors, input limits,
remote/origin denial, expired/unknown sessions, session capacity, per-session/global
budgets and concurrent reservation. SDK transport fakes cover invalid-key/request/
model errors without retry, bounded 429/503 retry, disabled automatic function calls,
timeout configuration and exception redaction. No real key or external call required.

Existing frontend/profile/readiness units remain; new tests cover pending-versus-
confirmed mutation, stale snapshots, unchanged assistant identity, next useful
question without default grades, unsupported actions/evidence and minimized course
context with independent completed/in-progress histories.

Six new browser cases cover natural message proposals, confirm/discard, multi-turn
context, tool return, malformed response fallback, disabled mode, configured mode
without consent, stale confirmation and mobile loading/limited-provider fallback.
All existing 29 campus/profile/selector/catalog/progress/responsive/uncertainty
browser regressions remain. New AI browser responses are **mocked synthetic output**,
not proof of Gemini quality or real PostgreSQL connectivity.

During verification, the first build rejected exporting a helper from a Next route;
it was moved into a server helper. Browser assertions were corrected to distinguish
Next's own alert announcer and exploratory readiness's persistent section. Neither
timeouts nor assertions of safe errors/confirmation were weakened. A rejected earlier
history turn was found to poison follow-up requests and is now filtered before
provider transport, with a regression test. No failed run is counted as a pass.

## Screenshots and limits

Opened and inspected each new screenshot: privacy notice, unverified AI attribution,
readable proposed changes, Apply/Discard, the existing deterministic next question,
safe fallback and mobile wrapping. No model-specific JSON or credentials shown.

- [Pending reported changes](images/phase04a-pending-proposal.png)
- [Confirmed context and next useful question](images/phase04a-confirmed-chat.png)
- [Safe local fallback](images/phase04a-safe-fallback.png)
- [375px fallback/loading flow](images/phase04a-mobile-fallback.png)

Live Gemini smoke was **not run**: it is deliberately owner opt-in. No real local
key was inspected, no secrets file was changed, and existing services were not
restarted. The owner can follow [setup and smoke instructions](GEMINI_GATEWAY.md)
to verify their privately configured provider/model. Fake-provider tests establish
control flow/validation, not real extraction quality, live cost, latency or semantic
safety. Heuristic PII/injection/academic-text filtering is not a complete defense;
no real student processing or compliance certification is authorized.

No new manual real-database workflow is claimed for this phase. Existing academic
regressions and fresh PostgreSQL CI checks preserve that separate boundary. No
hardware-device, Safari/Firefox, screen-reader, distributed-quota or CPU benchmark
certification. Provider prose is unverified and cannot establish academic truth;
sourced academic answers still render in existing deterministic modules.

## Owner review

- Configure local backend privately, restart only that V2 service and explicitly opt
  into fictional AI. Test the four example journeys in the orchestration document.
- Review each proposal before Apply; correct confirmed institution and check dependent
  assumptions invalidate without changing assistant perspective.
- Verify a normal follow-up, existing course selector, local fallback and refresh reset.
- Optionally run the one-turn `--live` smoke; never paste keys or real records.
- Review the PR/CI before merge. No deployment or subsequent phase is authorized.
