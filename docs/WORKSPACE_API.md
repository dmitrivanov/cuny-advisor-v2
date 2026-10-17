# Phase 02D local workspace API

Implemented bounded slice, not a public production service. Public catalog drafts
and fictional what-if scenarios only. No authentication, academic publication,
student records, AI or database writes. `/docs` exposes typed OpenAPI schemas.

## Routes

All under `/api/v1/academic`; all responses (including errors) use `Cache-Control:
no-store`. IDs are explicit opaque identities, never display course codes.

| Method / route | Contract |
| --- | --- |
| GET `/releases` | Persisted `ReleaseSummary[]`; optional `campus_id` / `program_id` filters. Campus/program/credential/year/release/revision are returned from one schema-qualified binding query. An empty database returns `[]`, no fixture fallback. |
| GET `/campuses/{campus_id}/programs/{program_id}/releases/{release_id}` | `CatalogView`: exact validated `Release`, four ordered columns of requirement groups with referenced course IDs, and protected limitation text. One repository load; original rule AST/source evidence is retained. |
| POST same scoped route + `/preview` | `HypotheticalRequest` → `ProgressView`, using the same immutable loaded release and unchanged pure evaluator. No stored snapshot, inputs or conversation. |

Example request (only with the corresponding reviewed release selected):

```json
{
  "hypothetical": true,
  "selected_course_ids": ["bmcc-course-mat-301", "bmcc-course-csc-101"],
  "allocations": []
}
```

Optional explicit allocations use `{requirement_id, completion_id, credits}` with
completion ID `hypothetical:{course_id}` and **string** exact credits (up to 128
integer and 128 fractional digits; no numeric JSON floats, NaN or exponent syntax). No automatic
allocation search, splitting, grade assumption, prerequisite waiver or transfer match.
A frontend dropdown proposes one group per course; the backend remains authoritative
for all ledger validation. Repeated selection IDs and out-of-context references
are rejected. Existing evaluator protections handle unsupported overlap/over-credit.

The hypothetical request explicitly assumes selected courses passed at their known
catalog credits. The adapter creates domain completions with `verified=True` **only
as fictional inputs**; this is not verification of a student record and is never
persisted. Grade ranks remain `None`. Course/source/year evidence gates remain in
force. Requirement allocations and all-course prerequisite checks are separate.
If any selected course has no captured credit value, response state is `unresolved`,
`snapshot=null`, with `missing_catalog_credit:{id}` issues; no zero-credit substitute
or inferred credit is inserted. Otherwise the response includes the engine Snapshot,
prerequisite Result trees and explicit fictional/partial-audit limitations. Overall
degree status remains `unresolved`. No user-supplied arbitrary engine/source flags,
grades, placement, waiver, student identifiers or free-text fields are accepted.

## Errors and database boundary

- 404: exact campus/program/release not found; no different year substituted.
- 422: malformed request, invalid identifier, duplicate/unknown selection, invalid
  decimal or allocation reference. Domain uncertainty is a result, not a fake pass.
- 503: missing/unsafe configuration, unavailable DB, corrupt catalog. Safe local
  setup guidance; SQL/DSNs/driver error details never returned.
- Unsupported mutation methods/routes: 404/405. No catalog or snapshot write API.

FastAPI dependency injection creates an engine lazily per academic request, yields
an explicit repository and disposes it afterward. Health and API startup never
connect, migrate or seed. It uses the Phase 02C loopback/database/role guards and
schema `cuny_advisor_v2`. No global individual-session backend state. The current
operational runtime role still has development import permissions; read-only API
behavior is enforced by the bounded service, not claimed as product authorization.
Future public deployment needs separately reviewed auth, rate/body/time limits and
operational/security gates; this phase is local only.

Next.js proxies only the three supported capabilities through
`/api/academic/[...path]`, validates allowed path shapes/local HTTP backend origin,
uses timeouts/no redirects/no caching, and bounds preview JSON to 64,000 characters.
It forwards no cookies, tokens or chat messages. The existing `/api/health` proxy
is untouched. Frontend errors are safe 404/422/setup messages; the API itself remains
the source of contract validation. Exact credits stay strings across every boundary.

## Verification

Backend DI doubles test boundary behavior independently of PostgreSQL. Real
PostgreSQL CI tests prove discovery/catalog isolation and math-preview parity for
persisted CS/CIS/synthetic releases. All Phase 02A–02C tests remain. Browser tests
intercept the academic API with explicitly labeled reviewed public fixture responses;
these establish UI behavior, **not** browser-to-PostgreSQL end-to-end proof. No SQLite.
Actual final test counts and CI evidence are recorded in the PR.
