# AI strategy

Status: proposed, 2026-10-16. No model calls or credentials are configured by this
phase. [PRD](PRD.md) contains the evidence register; model names and prices must
be rechecked against [Google pricing](https://ai.google.dev/gemini-api/docs/pricing)
and [terms](https://ai.google.dev/gemini-api/terms) before implementation.

## Division of responsibility

Gemini interprets advising intent, asks focused clarifying questions, summarizes
reviewed evidence, and explains deterministic results in plain language. It may
propose profile changes, course candidates, or transcript fields as structured
drafts. It cannot establish academic truth or institutional authority.

The rules engine alone evaluates prerequisites, course eligibility, degree-credit
allocation, repeats, GPA calculations, residency, approved exceptions, and plan
feasibility. Authorized reviewers establish catalog policy and transfer awards.
An attractive model response cannot override a failed rule or missing source.

## Gateway flow

1. Authenticate and authorize the actor and active student/campus context.
2. Classify the task using explicit UI actions and simple routing where possible.
   Use the model only when language interpretation or explanation adds value.
3. Retrieve only allowed, published campus/release evidence and the minimum relevant
   profile fields. Do not attach entire student records or transcript files.
4. Run deterministic tools for audits and planning; retain typed results, citations,
   uncertainty codes, and input versions.
5. Reserve a conservative token/cost allowance, enforce limits, then call an approved
   Gemini model through a versioned prompt and bounded structured-output contract.
6. Validate output schema, source IDs, academic assertions, action parameters,
   authorization, and consistency with tool results. Tool proposals cannot supply
   trusted actor or campus identity.
7. Present validated explanations and changes for confirmation; perform mutations
   only through application services with current revisions. Log minimized usage.

Potential read tools are catalog lookup, profile summary, audit retrieval, and
plan validation. Mutation tools create action proposals; they do not directly
publish catalogs, approve equivalencies, or modify academic records. Cap tool
steps at three per turn initially and prohibit recursive agent loops.

## Grounding and uncertainty

Citations resolve to source section, campus, catalog release, effective period,
retrieval date, and supporting rule/result. A valid URL alone does not establish
support for a claim. Reject nonexistent IDs and mismatched catalog context. Render
academic outcomes from deterministic structures and templates; constrain model
prose so it cannot change status, credit totals, eligibility, or guarantees.

When a program, catalog assignment, grade, offering, or transfer decision is
unknown, ask for the missing item or show a clearly bounded hypothetical result.
If sources conflict, identify the conflict and route it to review. Do not manufacture
a numerical confidence score for academic correctness. Extraction confidence and
source verification are separate signals.

No live web browsing is required for a student conversation. Future source refresh
is an administrator-reviewed ingestion process. Documents and source text are
untrusted data; instructions embedded in them cannot override tool policy.

## Model selection and privacy

Evaluate a currently supported, economical Gemini text model for ordinary advising
against a higher-capability candidate using the same synthetic benchmark. Adopt
the least expensive model that passes safety and usefulness gates. Pin model and
prompt versions; repeat evaluations before upgrades or retirement migrations.
Do not assume a free tier is appropriate for student data.

Before real student processing, institutional reviewers must approve endpoint,
contract, data handling, retention, permitted regions, access, and any subprocessors.
Public developer terms are not evidence of institutional approval. Default to
synthetic data until that review and separate user authorization are complete.
Minimize/redact identifiers, do not infer sensitive attributes, and never treat
optional student support preferences as a basis for restrictive academic decisions.

## Cost control

Proposed initial limits, subject to measurements and budget approval:

| Control | Initial proposal |
| --- | --- |
| Ordinary advising turn | 6,000 input tokens, 1,000 output tokens, one generation |
| Recovery | At most one additional generation after validation failure, within the same reserved turn budget |
| Interactive timeout | 12 seconds total provider budget; bounded retries with backoff only within this deadline |
| Per-turn ceiling | $0.05 including recovery and billable extras |
| Per-user quota | 30 AI turns/day; deterministic features remain available |
| Pilot monthly ceiling | $100 across advising and extraction; alert at 50%, 80%, 95%; stop new paid work before exhaustion |
| Transcript sub-budget | At most $20/month within the $100 ceiling, at most $0.25/document, 20 pages/document |

Compute estimated USD as input tokens × input rate / 1,000,000 + output tokens ×
output rate / 1,000,000 + applicable cached-token, reasoning, storage, and tool
charges. Use the selected model's actual billing dimensions; do not treat these
caps as a claim that a specific model will meet them. If the estimate exceeds a
ceiling, shorten context, use a safe template, or refuse the paid operation.

Maintain a versioned rate table and atomic budget reservation ledger per request,
user, campus, task, and month. Reserve maximum billable usage before dispatch,
reconcile actual usage, and conservatively retain unknown charges after timeouts
until reconciliation. Concurrent workers must not overspend through race conditions.
Provider billing caps are supplementary; the gateway enforces application limits.
An emergency kill switch disables all paid calls.

Prefer deterministic answers for structured queries, curated source retrieval,
bounded history, and reusable public catalog summaries. Cache public material by
campus/release/model/prompt hash. Private results must include owner, permissions,
and record revision in cache scope; never share personalized responses between
students. Deletion and access revocation invalidate derived caches.

Report cost per completed turn and completed advising task, tokens, cache hit rate,
fallback rate, daily spend, and projected monthly spend. Avoid savings that reduce
policy correctness. Transcript OCR/extraction is separately metered and can fall
back to manual entry; never retry a large document without a new budget check.

## Evaluation and failure behavior

Use synthetic profiles and academic fixtures reviewed by a designated academic
authority before a pilot. Include prerequisites, repeat attempts, missing grades,
catalog changes, transfer ambiguity, cross-campus requests, misleading sources,
prompt injection, stale records, inaccessible citations, and adversarial uploads.

Release gates: all deterministic golden cases pass; no unsupported definitive
academic claims, unauthorized actions, or cross-user disclosures in the evaluation
suite; valid citations for every material catalog claim; budget and provider-outage
tests pass. An initial usefulness target is at least 90% advisor-rated acceptable
responses on a fixed benchmark, with all remaining responses safely unresolved.
These are proposed gates, not measured outcomes or guarantees outside the suite.

On timeout, outage, invalid output, missing evidence, or exhausted budget, return
the saved deterministic audit/plan with a template explanation and next steps.
Do not fail over to an unapproved provider. Stop streaming unvalidated academic
assertions; present progress separately from the final authoritative result.

## Guest, governance and language refinements

Apply the same Gateway privacy and correctness controls to guests and registered
users. Authorize by workspace/session, check fixed guest expiry before dispatch and
final response, and discard late results after expiry. Do not persist guest prompts,
responses, extraction artifacts or provider files beyond their lifecycle. Disable
any feature whose provider retention cannot meet the approved guest promise.
Transcript upload is not consent to advisor handoff or permission to train models.

Use the existing per-principal quota as a provisional limit for each guest workspace
and registered account, with additional session/device/network throttles and shared
campus/global ceilings to resist guest-session rotation. Do not pool private caches
between guests or accounts. Registered conversion never resets global spend or
creates a new academic verification state.

Ground academic claims in official approved catalog releases only. Reviewed faculty
contributions can explain syllabus/section context with explicit source labels but
cannot establish prerequisites or override requirements. CMS copy is not academic
truth; referenced catalog content must resolve to the approved source revision.
Models cannot grant roles, validate faculty identity, approve policy, publish CMS,
consent on behalf of a student, or select advisor recipients independently.

Initial responses, summaries and reports are English-only. Explain unsupported
language input in English rather than silently translating academic records or
claiming multilingual support. Evaluate guest expiry races, consent tampering,
faculty/catalog conflicts, CMS prompt injection and cross-workspace conversion
alongside the existing benchmark. Details: [security](SECURITY.md) and
[access control](ACCESS_CONTROL.md).
