# Phase 04A — local Gemini conversational gateway

Independent synthetic-only prototype. BMCC is the sole operational assistant.
No institutional approval, real student processing, deployment or academic authority.

## Configuration and restart

Only `backend/app/conversation/provider.py` imports Google's maintained
`google-genai==2.31.0`. Its pinned dependencies were added to backend requirements;
no frontend packages were added. The deprecated `google-generativeai` is not used.

Default model: `gemini-3.8-flash`, configurable through `GEMINI_MODEL`. Google's
[model directory](https://ai.google.dev/gemini-api/docs/models) and
[model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) listed
it as stable on 2026-10-17. Selection prioritizes stable structured-output support
and a bounded Flash workload; no live latency, cost or quality benchmark is claimed.
[Structured output](https://ai.google.dev/gemini-api/docs/structured-output) and
[maintained Python SDK](https://googleapis.github.io/python-genai/) were consulted.
The adapter uses SDK `models.generate_content`, Pydantic response schema, explicit
JSON MIME type and disabled automatic function calling. No provider chat session,
retrieval store, grounding search or tool execution is created.

1. From the repository root, install existing requirements:
   `backend/.venv/bin/python -m pip install -r backend/requirements-dev.txt`.
2. Manually copy `backend/.env.example` to **ignored** `backend/.env.local` only if
   that local file does not already exist. Edit it privately; never paste the key
   in chat, screenshots, terminal commands or PRs. Do not overwrite existing secrets.
3. Set `GEMINI_ENABLED=true`, your own `GEMINI_API_KEY`, and optional `GEMINI_MODEL`.
   Configuration accepts these three keys only; quote values containing whitespace.
4. Stop only your existing V2 backend using Ctrl+C in its own terminal (or your
   verified V2 PID). From `backend`, start:
   `.venv/bin/python -m scripts.run_local --port 8000`.
   This explicit entry point reads `.env.local`, sets the local-mode guard, binds
   loopback and disables access logs. Existing process environment takes precedence.
   It does not load the root database dotenv; preserve your existing exported V2
   database configuration privately if academic tools are needed. No implicit DB
   creation/migration/import occurs. Restart the backend after changing AI settings.
5. Keep Next.js on loopback with the existing `API_BASE_URL` origin (default 8000).
   Open `/campus/bmcc`; explicitly check the fictional external-AI consent control.

Plain `uvicorn app.main:app` neither loads dotenv nor opts into live AI. The gateway
requires `GEMINI_ENABLED=true`, a nonempty key and `V2_LOCAL_CONVERSATION=1` (set by
`run_local`). Missing/disabled configuration preserves local deterministic mode.
No actual owner secrets were read, changed or copied during implementation.

## API and bounded cost

- `GET /api/v1/conversation/status`: enabled boolean only; no model/key details.
- `POST /api/v1/conversation/session`: random local session capability.
- `POST /api/v1/conversation`: schema-validated fictional turn, consent, BMCC identity,
  minimal reported facts, goal, last eight turns and optional untrusted selection
  context. Selection context remains explicitly unresolved, never catalog authority.
- The matching Next.js `/api/conversation` proxy allows only these routes, loopback
  backend origins, bounded input, no redirects and no-store responses. Mutating
  browser origins must match the frontend origin. Backend rejects remote clients
  and nonlocal origins. No CORS grant or public deployment is provided.

Limits: 600 characters per user message, eight history turns of at most 1,200
characters, up to eight proposals, 24,000 input bytes, 1,000 output tokens, 8,000
raw output characters, 12-second SDK request timeout and 26-second orchestration
budget. At most two provider attempts; retry only 429/500/502/503/504 once, not
invalid keys/requests/models. SDK retries are disabled to avoid multiplicative calls.
One generation in flight per process, 20 turns per one-hour session, 80 turns per
process/hour and 128 active sessions. Failed admitted requests consume quota.
A turn can cost two provider attempts; limits are not a dollar/monthly billing cap.
These are local process-memory safeguards, not distributed production quotas or
account authentication. Refresh/restart resets relevant in-memory state as described
in [orchestration](CONVERSATION_ORCHESTRATION.md); the global cap resists simple
session reset bypass within a running process.

## Authority and failure boundaries

Strict Pydantic contracts reject extra fields, unknown goals/actions, academicContext
updates, institutional verification and relationship changes. Program/course proposals
must agree with the reported institution; duplicates reject the whole turn. The model
cannot select a catalog, assign enrollment from the assistant, award credit or execute
SQL/filesystem/URLs. All accepted profile/goal changes remain pending for explicit
user confirmation; stale snapshots disable application. No partial profile mutation
occurs on output failure. Existing Phase 03B profile/readiness functions remain in use.

This phase does **not** ask Gemini to author sourced academic facts. Catalog content,
provenance, release identifiers, exact credits and unresolved results are rendered by
existing deterministic modules. Conservative text filters replace detected academic
assertions, questions and URLs with a bounded catalog-tool explanation. These filters
and prompt instructions are defense in depth, not a proof of semantic correctness;
AI prose is visibly unverified and must never establish academic authority. Automatic
catalog retrieval, source-grounded generated academic explanations and broader tool
execution remain future work. Unsupported planning/audit/transfer/handoff stays unavailable.

Missing configuration, rejected output, API-key/model errors, quota/rate limiting,
timeouts and provider outage yield safe fallback, with no raw exception or partial
proposal. Frontend labels fallback as local guidance, supports turning AI off and
retains the existing deterministic controls. No credentials, prompts or provider
responses are logged/persisted by application code. Common identifier/injection
patterns are rejected before provider calls; rejected earlier history is filtered.
These heuristics are **not** complete PII detection or a certified injection defense.
Never enter real transcripts, IDs, DOBs, SSNs or student records. External processing
terms, retention, regions and institutional privacy/security review are prerequisites
to any separately authorized real-user operation.

## Opt-in owner smoke

From `backend`, with the explicitly configured local backend and frontend running:

```sh
.venv/bin/python -m scripts.smoke_gemini --live
```

This performs one fictional turn through Next.js → FastAPI → Gemini (at most two
bounded attempts), validates the response and prints availability only. It never
prints content or credentials. Without `--live`, it makes no requests. Disabled or
missing configuration skips generation. No live call is run by automated tests/CI.
Future model changes should repeat synthetic quality/adversarial evaluation and
owner opt-in smoke; fake-provider tests do not measure real model extraction quality.
