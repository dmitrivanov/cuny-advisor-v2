# CUNY Advisor V2

The home page is an interactive campus selector. BMCC opens a minimal chat-first
workspace with deterministic local guidance; **no live AI advising is available**. Explore the persisted draft
catalog, select hypothetical completed courses and run a limited deterministic
progress preview. Semester planning, transcript review and advisor tools are
explicitly future modules.

This independent project starts with BMCC and has no CUNY/BMCC endorsement.
Use fictional scenarios only. No accounts, real student records, uploads, chat
storage, complete graduation audit, academic publication or production deployment.
Selections/conversation live only in tab memory and disappear on refresh. V1 stays
read-only and is never connected. All academic uncertainty remains explicit.

## Campus entry and conversation

`/` is an interactive CUNY campus selector backed by the persisted Phase 04B institutional registry. BMCC is the only local pilot; all other
listed assistants are future/unavailable. Click/tap BMCC (or activate its node with Enter/Space) to open
`/campus/bmcc`, then use supported prompts, adaptive fictional answers and contextual
tools. Assistant selection does not establish enrollment. No live AI is enabled.

Legacy root BMCC query/hash tool links migrate to the scoped route. Profile/session
facts live only in memory across client navigation; refresh clears them. Leaving
chat for campus selection clears that workspace's conversation/selector while keeping
independent profile facts for the current client session. Tool-to-chat return keeps
state as before. No accounts, personal data storage or real student inputs.

See [multi-campus architecture](docs/MULTICAMPUS_ARCHITECTURE.md),
[profile/readiness](docs/ADAPTIVE_ADVISING_READINESS.md) and
[Phase 03B verification](docs/PHASE_03B_VERIFICATION.md).

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
[Phase 02C persistence design](docs/PERSISTENCE_DESIGN_PHASE_02C.md).
The bounded draft persistence adapter is implemented; academic publication and
student storage remain deferred.

## Verification record

See [Phase 01A verification](docs/PHASE_01A_VERIFICATION.md) for exact results,
including the remaining development-only dependency advisories. The local checks
are not a claim of a completed GitHub Actions run or production readiness.

## Optional Phase 02C disposable PostgreSQL workflow

Do not use V1, institutional or production resources. This database stores public
catalog fixtures and explicitly synthetic snapshots only. The web/API still run
without it. See [persistence design and reviewer checklist](docs/PERSISTENCE_DESIGN_PHASE_02C.md).

1. Install Docker with Compose. Copy `.env.example` to an ignored root `.env` and
   replace the three password placeholders with **different generated local values**.
   Use URL-safe characters (or URL-encode passwords in the URLs). Keep the same
   password in each role's URL and its password variable. Never share the file.
2. From the repository root, export that trusted local file and start the database:

   ```sh
   set -a
   source .env
   set +a
   docker compose -p cuny-advisor-v2-local up -d --wait postgres
   ```

3. Bootstrap **once on a fresh dedicated instance**, then migrate manually:

   ```sh
   cd backend
   source .venv/bin/activate
   python -m pip install -r requirements-dev.txt
   python -m scripts.bootstrap_local
   python -m alembic upgrade head
   ```

   Bootstrap creates the schema and separate `v2_migrator`/`v2_runtime` roles. It
   refuses existing roles. No application startup step runs this command or migrations.
   No dotenv loader is installed; variables must be explicitly exported.

4. Run tests **before importing fixtures** to exercise empty downgrade as well:

   ```sh
   python -m pytest -q -m 'not postgres'
   python -m pytest -q -m postgres -rs
   python -m pip check
   ```

   Without `V2_DATABASE_URL`, DB tests skip honestly; a configured but broken DB
   fails. Full `python -m pytest -q -rs` runs both sets. Tests append synthetic rows;
   repeated runs are safe, but empty-downgrade verification skips once history exists.
   CI supplies a fresh `cuny_advisor_v2_test` database every run. Ruff and Black
   checks, when installed, are `ruff check .` and `black --check .` from `backend`.

5. Optionally import the reviewed CS/CIS assemblies explicitly:

   ```sh
   python -m app.persistence.import_fixtures --revision-id bmcc-2026-27-reviewed-fixture-r1
   ```

   Each program is atomic and independently repeatable; this is not bundle-wide
   publication. Do not edit retained identities in place. Changed content requires
   a new release and changed course version IDs. No source verification is upgraded.

For psql, use prompted credentials rather than URLs in command history:

```sh
PGHOST=127.0.0.1 PGPORT=55432 PGDATABASE=cuny_advisor_v2_dev PGUSER=v2_runtime psql -W
```

Then `\dt cuny_advisor_v2.*` and schema-qualified SELECTs. DBeaver uses the same
host/port/database/runtime role; enter the password privately. Runtime has no DDL.
Use the migration role only for explicit migration work. No database is public.

Stop from the repository root with `docker compose -p cuny-advisor-v2-local down`.
To **destroy only this disposable V2 database and all its synthetic history**, use
`docker compose -p cuny-advisor-v2-local down -v`, then repeat bootstrap/migrate.
Never run reset commands against another project/volume. Empty migration downgrade
is supported with `python -m alembic downgrade base`; retained releases block it.

Local implementation verification had no Docker/PostgreSQL available, so local DB
integration was not executed. Consult the Phase 02C PR's actual CI results before
accepting database behavior. Source/artifact capture, academic approval, accounts,
real records, CMS and deployment remain deferred.


## Phase 02D workspace and review

Start the backend and frontend as above. For functional catalog modules, export the
V2 variables **in the backend terminal**, explicitly bootstrap/migrate/import the
reviewed CS/CIS fixtures using the optional PostgreSQL workflow above, then restart
uvicorn with that environment. Health remains DB independent. No startup migration
or seed is run. Without PostgreSQL, chat/navigation still work and modules show
truthful setup errors; no frontend fixtures stand in for a database.

Open `/` to start in chat. Use a supported prompt, or the collapsible module menu.
Choose an exact persisted program/release explicitly. Completed Courses preserves
the four columns and unique IDs. Optional allocations are exact-string proposals,
not automatic degree credit. In Degree Progress, acknowledge the fictional passed-
course assumption and run the preview. Unknown grades, policies and metadata remain
unresolved. CIS is partial; no graduation eligibility is claimed.

Release changes clear hypothetical data. Reload clears conversation/selections but
retains a deep-linked context: `/?campus=bmcc&program=bmcc-program-cs-as&release=bmcc-cs-as-2026-2027-draft-2#catalog`.
A missing release fails, never falls back. Nothing is saved to browser storage.

Supported exact local prompts (case/punctuation normalized): “Show me the academic
programs.”, “Open completed courses.”, “I want to review my degree requirements.”,
“Show the Computer Science catalog.” Unknown questions receive a no-live-AI message.
Chat text is not submitted to an API. Gemini remains future Phase 04.

From frontend, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
For actual browser regressions: `npx playwright install chromium`, then
`npm run test:browser` (starts built Next.js on loopback port 3100). Playwright is a
pinned development-only dependency for these interactive flows; there are no new
runtime packages. Browser tests mock academic API responses with reviewed public
test fixtures; they do not claim browser-to-PostgreSQL coverage. Backend CI separately
runs the real PostgreSQL API/repository tests. No SQLite substitute. Local DB tests
skip when unavailable; report them separately. Existing five high npm advisories
remain pre-existing technical debt; no unrelated audit fixes were attempted.

[Workspace API](docs/WORKSPACE_API.md) · [UX and context lifecycle](docs/UX_WORKFLOWS.md).
Review screenshots in `docs/images/phase02d-*.png` were captured with explicitly
mocked catalog APIs at 375/768/1440px; academic data there is test response data.

Manual review: start with chat, choose the CS release, open Completed Courses,
select MAT 301 / CSC 101, return to chat, verify context, run hypothetical progress,
inspect unresolved/prerequisite evidence, switch to partial CIS and confirm selection
reset. Try an unsupported question, future module, missing deep link and DB offline.
Use keyboard-only navigation and narrow viewport. No real student input.

## Optional Phase 04A Gemini conversation

Disabled by default. Fictional information only; no institutional approval or real
student records. The backend uses the maintained Google GenAI SDK. The browser
never receives a key. Existing local navigation and academic tools work without AI.

Manually configure ignored `backend/.env.local` from `backend/.env.example` without
overwriting existing secrets. Start/restart **only your V2 backend** from `backend`:

```sh
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m scripts.run_local --port 8000
```

Existing process environment wins over the explicit dotenv file. Preserve your
existing exported local V2 database settings separately; no implicit migrations or
imports occur. Keep Next.js bound to loopback with existing `API_BASE_URL`.
Open `/campus/bmcc`, opt into fictional external AI, send a natural message and
review proposed changes before Apply. The existing readiness UI chooses the next
question; existing sourced academic modules retain all academic authority.

Optional owner-only live smoke through the frontend proxy (one fictional turn):
`cd backend && .venv/bin/python -m scripts.smoke_gemini --live`.
Without `--live` it makes no requests; no live request runs in CI.

See [configuration, limits and security](docs/GEMINI_GATEWAY.md),
[session/confirmation flow](docs/CONVERSATION_ORCHESTRATION.md) and
[actual checks/screenshots](docs/PHASE_04A_VERIFICATION.md). No deployment is authorized.

## Phase 04B institutional registry setup

The campus landing page now needs the local V2 database, explicit `04b_001`
migration and registry import. It does not fall back to eight static campuses.
Follow the role-separated disposable database setup above, then with the migration
URL already exported, run from `backend`:

```sh
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m app.institutions.import_registry
```

Start FastAPI with runtime-role `V2_DATABASE_URL` and Gemini disabled:

```sh
GEMINI_ENABLED=false .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

From `frontend`, run `npm run dev`, then open [campus discovery](http://127.0.0.1:3000/).
The server-only `API_BASE_URL` defaults to `http://127.0.0.1:8000`.
The reviewed source scope is 26; only BMCC is a local academic pilot. Academic catalog
fixtures still require the separate documented import and remain partial drafts.
No Gemini key is needed; do not change `backend/.env.local` for registry setup.
See [source mapping, categories, API and schema](docs/INSTITUTIONAL_REGISTRY.md)
and [actual checks/screenshots](docs/PHASE_04B_VERIFICATION.md).
