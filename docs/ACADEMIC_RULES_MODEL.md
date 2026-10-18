# Academic rules model — bounded Phases 02A–02B

Phase 02A merged through PR #5; Phase 02B extends it on
`feature/phase02b-catalog-evidence`. This is a pure,
in-memory foundation within the FastAPI modular monolith. No new API routes,
database, authentication, importer, AI, academic UI or production integration.
The only business endpoint remains `GET /api/v1/health`.

## Architecture and contracts

| Module | Responsibility |
| --- | --- |
| `backend/app/academic/contracts.py` | Frozen Pydantic contracts; campus identities, course versions, program/release binding, sources, shared categories, typed rules, completions, allocations, results and proposal-only exceptions |
| `evaluation.py` | Pure condition evaluation and global validation of an explicit proposed allocation ledger; explainable results with frozen inputs |
| `projections.py` | Four selector columns and course-condition projection carrying the original grouped AST; no UI formulas or graph layout |
| `fixtures/bmcc_cs_2026_2027.json` | Partial manually curated source-backed draft, with provisional assertions and explicit gaps |
| `backend/tests/academic_factory.py` | Separate fictional policy/grade/discipline inputs and synthetic histories |

Stable campus-scoped course identity is separate from display code and immutable
version ID. A release binds exactly one program version context, year, course
versions, requirement configuration and source set. Additional programs may bind
the same catalog course identities and shared category IDs; do not create a new
course identity for each program or copy category semantics into the engine.
The reference fixture uses readable stable identifiers for curation, never code
matching to resolve student/transfer evidence.

`Category` is shared vocabulary; `Requirement` binds its campus/program/year target,
rule and footnotes in a release. Credential is explicit AA/AS/AAS. The two-year
regression shares identities/category definitions but changes version IDs and
targets without rewriting an old snapshot. This prototype embeds version objects
in a release snapshot; a normalized shared repository and persistence are future
work, not an implemented multi-program catalog service.

Validation rejects duplicate IDs, dangling sources/course/category references,
cross-campus course/program binding, incorrect source-year binding, negative or
non-finite credit, empty logic and unrecognized operators/fields. All collections
retained in contracts are tuples. Exact `Decimal` credits serialize as strings.
Sources retain retrieval date, target year, section, state and year confirmation.
Source confidence and academic publication authority remain separate dimensions.
Credit addition uses an isolated Decimal context sized from input integer/fraction
places and count, so caller precision cannot alter totals or historical replay.
Tests cover low caller precision and values beyond the default 28-digit precision.

## Supported semantics

| Contract | Meaning / limitation |
| --- | --- |
| `Completed` | Explicit course identity with optional minimum grade rank; missing grade unresolved when required; ranks are synthetic, not an implemented institutional grade scale |
| `AllOf` / `AnyOf` | Nested AND / OR; child explanations retained; no CSV delimiters or executable text |
| `CreditMinimum` | Minimum allocated earned credit from an explicit eligible pool |
| `DisciplineCap` | Counts distinct courses across allocated Flexible Core groups; missing classifications unresolved, never inferred from code prefixes |
| `Unknown` | Explicit missing, conflicting or unsupported policy condition |
| `NoConditions` | Explicit reviewed/synthetic assertion of no conditions; missing prerequisite never means this |
| `Requirement.kind` | Required and recommended are separate; advice cannot consume degree credit |
| `CourseVersion.prerequisite` / `.corequisite` | Separate from degree requirement membership and each other; corequisite AST retained, same-term execution unresolved |
| `ExceptionProposal` | Explicit subject/release/requirement/substitution proposal; cannot approve or apply an exception |

Result states are `met`, `unmet`, `unresolved` with stable reason strings and child
evidence. AND preserves unresolved children; OR can be met by a known valid branch.
Provisional/conflicting sources or unconfirmed source-year applicability return
unresolved before execution. Unsupported JSON operators fail validation instead of
being interpreted. Synthetic rules execute only in an entirely synthetic source
set, preventing accidental promotion into the BMCC reference release.

The same evidence checks apply to course metadata used by completion, credit and
discipline conditions. A verified rule cannot promote a course's provisional,
conflicting or unconfirmed-year metadata into a met result. Credit thresholds
also require captured catalog credit; a fixture's missing value cannot be filled
by a synthetic completion's arbitrary credit. Explanations preserve the affected
metadata source IDs. Course-level provenance is deliberately coarse: field-level
evidence and review are future refinements, so this conservative check can leave
otherwise plausible conditions unresolved.

This earned-only subset has no projected/conditional audit mode. In-progress and
failed attempts are not earned passes; an in-progress prerequisite is unmet in this
mode. Future conditional outcomes must name an explicit future condition and mode.
No `met` rule result is proof of full course eligibility, offering or graduation.
`Snapshot.degree_status` is deliberately always `unresolved`.

## Evaluation and allocation boundary

Call `evaluate(release, inputs)` with synthetic completions and explicit allocations.
The prototype **validates** the whole proposed ledger; it does not search for a best
allocation or greedily consume courses by display order. It rejects duplicate,
unknown, ineligible, over-target or over-earned allocations; unverified/unearned
inputs cannot consume credit. Cross-group overlap is unsupported and unresolved,
including a partial split that stays within earned credit. Eligible for multiple
categories does not mean allocated to all of them.

Earned credit sums each validated unique course completion once; allocated degree
credit is separate. Unsupported repeats, unknown identities, course-credit variation,
wrong campus/release and withdrawn release produce unresolved results. Invalid
record/context returns zero earned credit, with issues; invalid allocation retains
valid earned credit but returns zero allocated credit and unresolved requirements.
Do not interpret those zeros as an official zero-credit academic history.

Degree requirement evaluation uses allocated courses; prerequisite evaluation uses
the full synthetic earned history independently. `eligibility(...)` evaluates a
specified course's modeled prerequisite and never consults category completion.
Historical MAT 301 completion does not require fabricating an older MAT 206 attempt.
The function name does not claim complete registration clearance.

Snapshots retain the entire immutable release, record revision, completions, ledger,
engine version `02a.1`, rule/source IDs, explanations and known issues. Replaying
those exact values reproduces the result. No private data is stored. A future
service must bind actor/workspace, exceptions, catalog assignment and authorized
record verification before accepting real input; this library is not an auth boundary.

## Governance and future persistence

Draft/in-review/published/withdrawn are representation contracts only. There is no
publication function, approval service, authority grant, CMS or admin override.
Frozen objects prevent in-place mutation, but a caller can construct a different
object; a future repository must enforce revision identity and immutable publication.
It must capture source artifacts, validate complete policies/cycles/conflicts,
require distinct verified scoped academic review of the exact revision, and retain
withdrawn historical releases. Publication is not allowed merely because a model's
state field says `published` or an administrator supplies a source URL.

Future SQLAlchemy/Alembic records must target isolated `cuny_advisor_v2` resources
with dedicated roles. No schema or irreversible API decision is introduced here.
V1 CSVs and graph overrides remain reference evidence only. Typed nested rules,
explicit identities, immutable inputs and canonical projections replace ambiguous
AND/OR strings and independent browser/manual-graph calculations.

## Limits and proposed Phase 02B gate

Not implemented: automatic/global optimal allocation, overlap policies, normalized
multi-program catalog persistence, source importer/archive, authority verification,
rule publication, grade/repeat/GPA/residency policies, arbitrary count operators,
necessary-cycle diagnosis, approved exceptions/transfer awards, same-term scheduling,
offering availability, planner or complete graduation audit. These omissions must
remain unresolved wherever material. No packages were added.

Suggested Phase 02B, **requiring separate owner authorization**: reconcile the open
[source questions](BMCC_CATALOG_SOURCE_MAPPING.md), capture immutable evidence,
add a second program/year configuration to validate reuse, and specify/test a
reviewed overlap/allocation policy and grade semantics. Then propose a narrow
read-only selector/list integration using these outputs. Full graph/planner,
database provisioning and real student workflows remain separately gated.

## Local verification

From `backend/`, use the existing `.venv`:

```sh
.venv/bin/python -m pytest -q
.venv/bin/python -m pip check
```

The existing CI backend job discovers the new tests without workflow changes.
Ruff and Black were available as local tools; no lint/format dependency was added
to the project. Exact final results are recorded in the roadmap after verification.
No new UI exists to browser-test in this phase; frontend and health/proxy are unchanged.

## Implemented Phase 02B extensions

`Source` adds publisher, campus/program claim scope, separate publication/revision/
effective dates, explicit conflict references, an unresolved state and an
`academic_review="required"` marker. These are evidence contracts, not approvals.
Old Phase 02A sources remain parseable with optional scope fields; all newly curated
reference sources have explicit scope. Release validation rejects crossed campus,
program and year scope or dangling/self conflict references. Unknown sources may
have no URL; they remain unresolved and cannot masquerade as verified locators.

`evidence.source_problem` is a pure helper shared by course and rule evaluation.
It never fetches a website. Missing/provisional/conflicting/unresolved evidence and
unconfirmed years cannot pass. Conflicts block either linked side, including
one-sided links, even if someone changes a state label to source-verified. A state
edit is not resolution or academic authorization.

`NonCreditEvidence` represents fictional placement, exemption and waiver claims
separately from `Completion`; no credits field is accepted. It does not apply an
exception or create transfer credit. Relevant unsatisfied modeled conditions return
`non_credit_evidence_requires_academic_review`; earned and allocated totals stay
unchanged. Invalid/duplicate references fail safely. Already-supported earned
completion stays separate; a claim is not required to report a historical course.

Shared category definitions come from one local vocabulary file. The
new CS evidence revision and partial CIS A.A.S. fixture bind their own rules and
source scope to those categories. Fixture assembly is explicit and local, not a
general importer or automatic scraping pipeline. Missing credits, taxonomy, grade
semantics, STEM allocation and candidate scientific grouping remain unresolved.

New snapshots use engine `02b.1`; parsing retains stored `02a.1` snapshots. The
golden historical scenario was generated before modifications and has only fictional
inputs. Tests compare supported result semantics with a new-engine recomputation
while preserving the old snapshot and label. No full legacy-engine runtime dispatcher
or persistence is implemented. Exact old execution requires its pinned code artifact.

The earlier Phase 02B recommendation above is historical; only this bounded
evidence work is now authorized. Proposed persistence is documented in
[PERSISTENCE_DESIGN_PHASE_02C.md](PERSISTENCE_DESIGN_PHASE_02C.md), not implemented.
The [policy matrix](ACADEMIC_POLICY_EVIDENCE.md) records human decisions still needed.

## Phase 04C-1 ingestion representation boundary

Source browsing reuses Completed/minimum-grade-rank, Unknown and NoConditions and
preserves recursive all/any semantics. Additional placement/test/permission/concurrent/
program leaves describe evidence without adding evaluator operators. Provisional,
missing and conflicting rule text must carry Unknown; source-verified structured
interpretations require original text and explicit year evidence. No new BMCC rule
is promoted in this snapshot, and no browse AST enters the existing evaluator.
Synthetic representation tests are not verified academic policy. Full prerequisite
reconciliation and program requirements remain separately reviewed future work.
See [ingestion design](BMCC_CATALOG_INGESTION.md).
