# CUNY Advisor V2

The local application has an English landing page, a FastAPI health endpoint,
and a connectivity indicator with the Phase 01B design system. Phase 02A adds a
backend-only, in-memory academic catalog/rules prototype and synthetic tests.
Phase 02B adds scoped academic evidence, partial program fixtures and synthetic
non-credit claims; it provides no new public academic service or student storage.
This is an independent project,
starting with BMCC; it does not imply CUNY or BMCC approval.

There are no accounts, student workspaces, database models/migrations, CMS,
Gemini calls, complete graduation audits/plans, or transcript handling. Do not enter real student
information. V1 is reference-only and is not used by either application.

## Requirements

- Node.js 24 LTS and npm (the frontend supports Node 22–24).
- Python 3.14 (the version used locally and in CI).
- Two terminal windows; ports 3000 and 8000 available on loopback.

Dependencies are pinned in `frontend/package-lock.json` and the backend requirements
files. Initial dependency installation requires internet access. Running the apps
needs no cloud service, API key, database, Docker, or production configuration.

## Start the backend

From the repository root:

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

On Windows, use `.venv\Scripts\activate` (or `.venv\Scripts\Activate.ps1` in
PowerShell). If `python3` is not Python 3.14, use your installed 3.14 interpreter.

[Health](http://127.0.0.1:8000/api/v1/health) returns HTTP 200:

```json
{"status":"ok","service":"cuny-advisor-v2-api"}
```

This is process liveness only. It checks no database or external services.
Local API documentation: [Swagger UI](http://127.0.0.1:8000/docs).

## Start the frontend

In a second terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [the local preview](http://127.0.0.1:3000). The connection card checks on load
and offers **Check again**. With the backend running, it displays **Backend connected**.
Stop the backend and retry to see **Backend unavailable**. A connection failure
does not prevent the landing page from rendering.

The browser calls the same-origin `/api/health` Next.js route. That route contacts
`http://127.0.0.1:8000/api/v1/health` with a four-second timeout, no cache, and no
redirects. Unexpected/non-200 responses return HTTP 503 with
`{"status":"unavailable"}`. No backend error details reach the browser. The
browser bounds the full request to seven seconds. No CORS configuration is needed.

## Optional local configuration

Defaults work without an environment file. To use a different local API port:

```sh
cp .env.example frontend/.env.local
```

Edit `API_BASE_URL` there, for example `http://127.0.0.1:8001`, then restart Next.js
and start Uvicorn on the matching port. The origin must be loopback HTTP
(`localhost`, `127.0.0.1`, or `[::1]`) without credentials, path, query, or fragment.
Non-local origins are deliberately rejected in this phase. This variable is
server-only; do not prefix it with `NEXT_PUBLIC_`. The backend has no environment
configuration in Phase 01A. Never put secrets or production URLs in either app.

## Run checks

Backend, from `backend/` with the virtual environment activated:

```sh
python -m pytest -q
python -m pip check
```

Frontend, from `frontend/`:

```sh
npm run lint
npm run typecheck
NEXT_TELEMETRY_DISABLED=1 npm run build
```

`typecheck` first generates Next.js route types, so it works on a clean checkout.
The local scripts explicitly use Next.js Webpack for consistent local builds;
Turbopack worker port binding was unavailable in the execution sandbox. The build
does not need a running backend, network fonts or cloud assets. To preview
the built frontend locally, use `npm start` after building; do not run it alongside
the dev server on the same port. `NEXT_TELEMETRY_DISABLED=1` is optional and can also
be set in your shell or local environment file. On PowerShell, set environment
variables with `$env:NEXT_TELEMETRY_DISABLED="1"` before running the command.

`.github/workflows/ci.yml` runs backend pytest and frontend lint/typecheck/build on
pushes and pull requests. It has read-only repository permissions, requires no
secrets, and has no deployment step. Creating the workflow locally does not execute
it on GitHub. Stop either local server with Ctrl+C.

## Layout and phase boundaries

- `frontend/src/app/`: App Router page/layout/styles and fixed health proxy.
- `frontend/src/components/`: client-side connectivity indicator.
- `backend/app/`: FastAPI entry point and versioned health router.
- `backend/app/academic/`: typed contracts, partial draft fixture, pure evaluator and projections; no new API.
- `backend/tests/`: unchanged health checks and synthetic academic regressions.
- `docs/`: implementation boundaries, source mapping and future architecture/governance plans.
- `AGENTS.md`: current authorization and contributor instructions.

See [the roadmap](docs/IMPLEMENTATION_ROADMAP.md) and
[decision register](docs/DECISIONS.md). Phase 01A does not fulfill the broader
Phase 01 acceptance criteria. Further implementation requires separate authorization.

For the Phase 02A prototype, run backend pytest above and read the
[rules model](docs/ACADEMIC_RULES_MODEL.md),
[source mapping](docs/BMCC_CATALOG_SOURCE_MAPPING.md) and
[selector parity](docs/V1_SELECTOR_PARITY.md). The reference fixture is not
institutionally approved. No academic service is exposed in the landing page.

See the [policy evidence matrix](docs/ACADEMIC_POLICY_EVIDENCE.md),
[second-program validation](docs/SECOND_PROGRAM_VALIDATION.md) and
[proposed Phase 02C persistence design](docs/PERSISTENCE_DESIGN_PHASE_02C.md).
Database/ORM/migration work in that design is proposed, not implemented.

## Verification record

See [Phase 01A verification](docs/PHASE_01A_VERIFICATION.md) for exact results,
including the remaining development-only dependency advisories. The local checks
are not a claim of a completed GitHub Actions run or production readiness.
