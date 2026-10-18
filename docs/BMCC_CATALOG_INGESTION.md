# BMCC source catalog ingestion — Phase 04C-1

Implemented source-backed **browsing**, retrieved 2026-10-17, pending owner PR review.
No institutional approval, student records, complete audit or new academic eligibility
algorithm. Existing 2026–2027 CS/CIS draft releases are unchanged. Gemini is unnecessary
and no call or credential inspection was performed.

## Source inventory and applicability

| Official source | Role and applicability |
| --- | --- |
| [College Bulletin](https://bmcc.catalog.cuny.edu/) | Primary year-bound source: home title and active catalog settings explicitly say **2025–2026**, catalog ID `YiimrCscg9IpPRh0XQeo`, effective-start setting 2025-08-26. No end date asserted. |
| [Bulletin courses](https://bmcc.catalog.cuny.edu/courses) | Public course browse lists **19 offering units**. Full SSR records collected once per unit, not 1,278 individual requests. |
| [Academic departments](https://www.bmcc.cuny.edu/academics/departments/) | Current directory: **18 academic departments**, separate from Academic Services. Year applicability unconfirmed. |
| [Academic programs](https://www.bmcc.cuny.edu/academics/programs/) | Current listing: **67 entries** under credential headings. Program identities/links only; year applicability and requirements pending. |
| [Course listings](https://www.bmcc.cuny.edu/academics/courses/) | Navigation to 18 supporting departmental lists; verbatim evidence blocks retained, year unconfirmed. |
| [Degree maps](https://www.bmcc.cuny.edu/academics/advisement/advisement-resources/academic-program-maps/) | Inventory links for 2017–2018 through 2025–2026 captured. Sequencing resources only; PDFs/degree requirements not ingested in this phase. |

The 2025–2026 Bulletin does **not** replace or silently combine with existing
2026–2027 program-page fixtures. Each course fact references its source year.
Current directory/program/support sources explicitly have null catalog year.
Supporting prerequisites remain provisional even where the prose looks simple.
Numeric requisite IDs on Bulletin course detail pages (for example MAT 301: 016816;
MAT 302: 016817) are opaque evidence, not academic expressions. Department listing
SSR does not include resolved requisite definitions. No hidden endpoint, login,
registration system, section data or Gemini was used to infer them.

Direct Python requests to the four www.bmcc.cuny.edu entry pages returned HTTP errors;
normal public web/browser reads succeeded. No access restriction was bypassed. The
Bulletin robots.txt explicitly allowed public paths when reviewed. The collector
checks robots policy on refresh, uses one sequential request per known offering unit
with 0.5-second spacing, bounds source size and refuses unexpected origins. No network
request occurs during application startup or a normal catalog browse/API call.

## Coverage and reconciliation

The machine-readable [coverage report](../backend/app/catalog_ingestion/data/coverage.json)
is rebuilt from the retained source extracts and checked against the reviewed snapshot.
Denominators describe this retrieved source scope, not all possible historical BMCC
courses, all sections, or a future authoritative institutional master database.

| Dimension | Observed / represented | Coverage denominator |
| --- | --- | --- |
| Academic departments | 18 / 18 | **100%** of current directory's academic-department entries |
| Bulletin offering units | 19 / 19 | **100%** of course-browse units; includes Cooperative Education as an offering unit, not a nineteenth academic department |
| Program-list entries | 67 / 67 | **100%**: 25 AA, 28 AS, 8 AAS, 5 certificates, 1 microcredential; not 67 degree programs |
| Program page-host relationships | 61 / 67 | **91.04%**; remaining 6 unresolved, no inferred departmental ownership |
| Source course rows | 1,278 | Two duplicate normalized codes yield 1,276 unique listed codes |
| Credit-bearing browse records | 1,263 / 1,265 | **99.84%** of unique positive-credit candidates; two conflicting codes quarantined |
| Description and exact credit range | 1,263 / 1,263 | **100%** of imported browse records |
| Supporting prerequisite text | 656 / 1,263 | **51.94%**, provisional evidence blocks; remainder unknown, never no-prerequisites |
| Verified structured eligibility rules | 0 / 1,263 | **0%** of imported courses; no unsupported interpretation promoted |
| Complete program-specific degree requirements | 0 / 67 | Deferred to Phase 04C-2, not an ingestion failure disguised as complete |

Field-specific coverage uses **1,263 imported courses** as the denominator:
contact hours 1,263 (100%); lecture hours 1,242 (98.34%); lab hours 70 (5.54%).
Supporting evidence candidates: corequisites 125 (9.90%), minimum-grade mentions
30 (2.38%), placement/permission/test mentions 324 (25.65%), enrollment-restriction
mentions 18 (1.43%), cross-listing/equivalency mentions 21 (1.66%). These are text
capture rates, not verified rule counts or evidence that other courses lack a lab
or academic condition. Missing optional fields remain null/unknown.

Eleven zero-credit entries are excluded from this credit-bearing browser: ESL 49,
54, 96; MAT 8, 12, 14, 41, 51, 56, 56.5; MES 1. Their source records remain in the
extract archive. `ITL 180E` and `ITL 190E` have conflicting duplicate source records:
retain both raw observations and quarantine both codes pending reconciliation.
No arbitrary winner is chosen. ANI412 and ITL190E source display strings lack a space;
normalized codes are assembled from the source's separate prefix/number fields,
while `source_code` retains original spelling. No transfer equivalence is inferred.

Source directory names differ from Bulletin names for Allied Health Sciences / Allied
Health and Criminology and Criminal Justice / Criminal Justice. Both labels are
retained. Event units, registrar and administrative records embedded in the site's
SSR settings are excluded from the 19 public academic course-offering units.
Prefixes are derived from observed many-to-many course/department memberships;
no one-prefix/one-department or discipline-equivalence assumption is made.

Program IDs are project identities, separate from requirements. The explicit reviewed
`project_program_ids.json` mapping preserves IDs across title changes; new URLs need
identity review instead of automatic ID creation or code-based equivalence. The two established
CS/CIS IDs remain recognizable, but browsing data is never passed into their audit
release bindings. A URL hosted under a department page supports `page_host_only`,
not a verified assignment of academic governance, catalog applicability or approval.
Program page URLs are retained; uninspected requirement references remain empty.

## Artifacts, staging and source review

`backend/app/catalog_ingestion/data/source_extracts/` retains public, source-derived
records only: approved index/visible DOM extracts, 19 Bulletin record extracts,
unit inventory, degree-map links and capture metadata. It excludes staff-account
metadata, schedules and unrelated SSR settings. Bulletin extract files carry original
HTML SHA-256 and catalog ID; source rows carry URL, locator, retrieval date, year and
extract SHA-256. HTML fingerprints are provenance anchors, not signatures or claims
of institutional approval. Original downloaded HTML is in ignored local review
artifacts; committed extracts preserve every imported description, value and relevant
rule-text block, not an assertion that the whole website was archived.

`source.py` strictly decodes public Nuxt SSR references without executing JavaScript;
unrecognized tags, missing payload and cycles fail for manual review. `pipeline.py`
performs deterministic offline staging, typed field/reference validation, exact
credit conversion, duplicate conflict quarantine and coverage reporting. It preserves
original description markup as data but renders only plain React text.

`reviewed_snapshot.json` is a reproducible source-fact snapshot. `review.json` records
its exact digest and bounded **project source/format review**, not an academic approval.
The import CLI rebuilds staging from extracts and requires an exact match to both
reviewed digest and coverage artifact. It never imports an arbitrary newly collected
file or automatically publishes structured rules. No general approval/CMS system is
implemented. Credentials and backend/.env.local are not involved in source review.

Rule envelopes preserve text separately from structured expressions, status, raw
opaque reference, evidence and academic-review-required marker. Candidate evidence
blocks are conservatively selected by explicit keyword matching; they are not a
semantic parser. Full blocks retain surrounding qualifications and may include a
syllabus link label or unrelated mention of grades. All such blocks remain provisional.
No missing field becomes `NoConditions` or a successful eligibility outcome.

The browse AST reuses existing Completed/minimum-grade-rank, Unknown and explicit
NoConditions contracts, preserves all/any wire semantics recursively, and represents
placement/test/permission/concurrent/program conditions as typed leaves. Synthetic
unit tests exercise AND/OR nesting and these leaves. They are representation tests,
not assertions about real BMCC rules. No new operator is sent to the pure evaluator;
no grade-rank mapping, exception approval or prerequisite clearance is implemented.

## Database architecture

Migration `04c1_001` follows `04b_001`, adding seven append-only tables exclusively
in `cuny_advisor_v2`:

- `browse_catalog_snapshot`: campus/year identity and exact canonical typed payload/hash.
- `browse_catalog_source`, `browse_catalog_department`, `browse_catalog_program`,
  `browse_catalog_course`: snapshot-scoped identities and typed payload/hash projections;
  unique normalized course code within a snapshot.
- `browse_course_department`, `browse_program_department`: composite same-snapshot
  foreign keys to entity and department parents. Program link meaning remains explicit.

JSONB follows existing DTO-envelope conventions; Decimal credits serialize as exact
strings, including ranges and trailing precision. These are browse projections,
not replacements for academic course/release tables. Stable campus identity is reused;
no existing release, requirement, source or evaluation snapshot is rewritten.

Import is one migration-role transaction, with deterministic table/key ordering,
conflict-safe exact comparisons and complete projection verification before commit.
Reads reconstruct the frozen model under REPEATABLE READ and check **every** scoped
projection, including missing/modified/extra rows. Model validation checks source and
year relationships; relational FKs protect department scoping. No silent fallback.
Runtime has SELECT only on new tables; UPDATE/DELETE triggers reject mutation even
for importer operations. Retained snapshots refuse downgrade. Refresh appends a new
snapshot ID; changing a retained ID fails atomically. This is not a publication lifecycle.

## Explicit import and refresh

First use README's existing disposable V2 bootstrap and separate role configuration.
From `backend`, with trusted local migration-role environment already exported:

```sh
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m alembic current
.venv/bin/python -m app.catalog_ingestion.cli report
.venv/bin/python -m app.catalog_ingestion.cli stage --output ../var/bmcc-staged-snapshot.json
.venv/bin/python -m app.catalog_ingestion.cli import
.venv/bin/python -m app.catalog_ingestion.cli import
```

Expected migration head `04c1_001`; both imports report 1,263 credit courses with
snapshot `bmcc-bulletin-2025-2026-20261017-r1`. Existing academic fixtures and the
institutional registry have their own explicit import commands and remain required.
The backend uses runtime-role V2_DATABASE_URL, with Gemini disabled. No implicit DDL.

To refresh, explicitly collect into a **new empty** ignored directory:

```sh
.venv/bin/python -m app.catalog_ingestion.cli collect --directory ../var/bmcc-refresh
```

This collects Bulletin units only. Re-capture the four website index/support artifacts
through permitted public access, retain dated extraction evidence, review newly added
or removed units/programs and update the staged inventory. Never silently copy old
support text while relabeling it as newly retrieved. Review catalog ID/year and source
diffs, run `stage --directory ../var/bmcc-refresh --output ../var/bmcc-refresh-stage.json`
and coverage checks. A changed Bulletin year fails the current parser until reviewed.
Only after explicit project source review should a new snapshot, dated extracts,
coverage and review digest be proposed together in a PR. The CLI intentionally has no
command to auto-approve pending rules or install arbitrary staging into the DB.

## Read-only API and UX

`GET /api/v1/bmcc-catalog/snapshots` discovers retained explicit year/identity tuples.
For an exact `{snapshot}`:

- `GET /api/v1/bmcc-catalog/{snapshot}/departments`
- `GET /api/v1/bmcc-catalog/{snapshot}/programs`
- `GET /api/v1/bmcc-catalog/{snapshot}/sources`
- `GET /api/v1/bmcc-catalog/{snapshot}/courses?q=MAT%20301&department=MATH-BMC&offset=0&limit=20`
- `GET /api/v1/bmcc-catalog/{snapshot}/courses/{course_id}`

Course lists return snapshot_id, catalog_year, total, offset, limit and typed items.
Search covers code/title/description case-insensitively, with deterministic lexical
code order. Limit defaults 20, maximum 50; missing snapshot/course 404, invalid query
422, missing setup/integrity failure 503, unsupported writes 405. All are no-store.
Sources include public URLs/dates/hashes; rule evidence references source IDs and
locators. No academic eligibility or registration action is exposed.

Next.js's fixed-route, loopback-only `/api/bmcc-catalog/...` proxy bounds payloads and
timeouts. Existing BMCC Academic Catalog offers an expandable source browser that
loads on demand, requires explicit browsing snapshot selection, searches/paginates,
filters offering units, shows descriptions/credits/hours/designations and discloses
rule/source evidence. It retains the glass design, accessible native controls and
Return to chatbot. New browsing courses cannot be selected into the old audit draft.
The existing program/release selector and four-column completed-course/progress
workflows remain separate and unchanged. No static course fallback.

## Unresolved questions and Phase 04C-2

Reconcile Italian duplicate identities, obtain year-bound prerequisite definitions
and authoritative grade/placement/permission interpretations, verify true program
ownership/year applicability, and review differences between Bulletin, current program
pages and degree maps. Do not derive current availability from a catalog record.
Full program-specific degree requirement ingestion/validation remains Phase 04C-2.
No other campus is activated, and source verification is not endorsement or approval.
See [actual verification](PHASE_04C1_VERIFICATION.md).
