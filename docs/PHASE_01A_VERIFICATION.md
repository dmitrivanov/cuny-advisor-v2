# Phase 01A local verification

Date: 2026-10-16. Scope: local application skeleton only. Commands were run on
macOS with Node 24.18.0, npm 11.16.0 and Python 3.14.5. CI is configured for Node
24 and Python 3.14; no GitHub Actions run was triggered or observed.

| Check | Exact result |
| --- | --- |
| Backend `python -m pytest -q` | Exit 0; `4 passed in 0.12s`; no warnings in the final run |
| Backend `python -m pip check` | Exit 0; `No broken requirements found.` |
| Frontend `npm run lint` | Exit 0; ESLint with `--max-warnings=0`, no findings |
| Frontend `npm run typecheck` | Exit 0; route types generated, `tsc --noEmit` passed |
| Frontend `npm run build` | Exit 0; Next.js 16.4.2 Webpack build completed; `/` and `/_not-found` static, `/api/health` dynamic |
| Frontend `npm ci --offline --cache /private/tmp/cuny-advisor-v2-npm-cache` | Exit 0; clean install from the lockfile completed (deprecation/install-script notices noted below); offline audit output is not used as security evidence |
| Frontend `npm ls --depth=0` | Exit 0; direct dependency tree valid |
| Landing page smoke | HTTP 200; English document, Phase 01A label and no-data notice present |
| Direct backend health | HTTP 200; exact `{ "status": "ok", "service": "cuny-advisor-v2-api" }`; `Cache-Control: no-store` |
| Frontend health proxy, backend running | HTTP 200; same validated health contract; `Cache-Control: no-store` |
| Frontend health proxy, backend stopped | HTTP 503; exact `{ "status": "unavailable" }`; `Cache-Control: no-store`; page still HTTP 200 |
| Browser check | English landing rendered; `Backend connected` observed, then `Check again` displayed `Backend unavailable` after backend stopped |
| Git ignore check | Local virtualenv, node_modules, Next build cache and frontend/backend local environment files ignored; `.env.example` remains trackable |
| `git diff --check` | Exit 0 |
| `npm audit --omit=dev` | Exit 0; `found 0 vulnerabilities` |
| Full `npm audit --json` | Exit 1; 5 high-severity findings in the development lint chain described below |

## Dependency findings and corrected initial failures

npm also reports an unapproved `unrs-resolver` install script under npm 11's
script policy. Lint, typecheck and build succeed without enabling it. No blanket
install-script approval was added.

The full audit identifies `braces` (GHSA-vfj7-8cjw-p6xm) and its `micromatch` →
`fast-glob` → `@next/eslint-plugin-next` → `eslint-config-next` dependency chain.
These are development lint dependencies; the runtime-only audit reports zero.
The audit's proposed fix is a downgrade to `eslint-config-next` 14.2.35, a different
Next.js major. No forced downgrade, suppressed advisory, or unreviewed dependency
replacement was applied. This tooling finding remains unresolved and should be
reviewed before later phases; passing checks do not imply an advisory-free dev tree.

Initial sandbox package downloads failed DNS resolution; authorized downloads
subsequently succeeded. Initial TypeScript 7 was incompatible with the lint parser;
the final stack pins TypeScript 6.0.3 and ESLint 9.39.5. ESLint 10 passed lint but generated peer
compatibility warnings from Next.js plugins, so the final pin uses their supported
ESLint 9 range. npm reports ESLint 9 as deprecated; this is an additional development
tooling limitation pending compatible plugin upgrades. Initial lint findings were
fixed. The initial Starlette TestClient HTTPX deprecation warning was resolved by
using its current `httpx2` dependency; the final pytest run has no warning.

The initial Turbopack build failed while binding a compiler-worker port in this
execution environment, including the retried invocation. The scripts now explicitly
use the supported Webpack option, and that final build passed. Local HTTP servers
required sandbox-approved loopback binding. These environmental failures are not
hidden or counted as passing invocations.

## Boundaries

No authentication/accounts, student persistence, PostgreSQL models/migrations,
CMS, Gemini, degree audit/planner or transcript handling was implemented. No
production or V1 connection, real student data, secrets, commit, push or deployment.
Application servers used for checks are stopped after verification. These tests do
not satisfy the broader Phase 01 academic/security acceptance checklist.
