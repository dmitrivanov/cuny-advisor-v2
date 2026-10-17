# Second-program validation — Phase 02B

Selection recorded before fixture creation: **BMCC Computer Information Systems
A.A.S., catalog 2026–2027**. Its official
[program page](https://www.bmcc.cuny.edu/academics/departments/cis/computer-information-systems-cis/)
was followed from the BMCC program directory and retrieved 2026-10-16. The Notes
section explicitly identifies 2026–2027; no applicability is inferred from an
undated course listing. No institutional approval of this project is implied.

The bounded fixture will reuse shared category and course identities, exercise a
different math option set, a nested Scientific World choice, a six-credit program
elective pool and an incompletely enumerated general elective. It will not claim
complete program coverage or apply A.S. totals to an A.A.S. degree. Unknown pools,
grades, discipline classifications and academic interpretation remain unresolved.
Evidence, implementation details and actual validation are appended below.

## Captured scope and deliberate gaps

`bmcc_cis_reference()` assembles a small local JSON fixture using the same shared
category registry as the new CS evidence revision. The original Phase 02A CS JSON
is retained unchanged for historical comparison. Stable campus course identities
are reused (e.g. MAT 206/301, CSC 101/111, CIS 345); source-specific version payloads
remain distinct when their evidence scope differs. A CIS statement is not silently
promoted into a verified CS course fact.

The CIS page states required-core total 14, curriculum 36 and program 60. Math
offers MAT 157/206/301, each four credits; CS does not add MAT 157 as an alternative.
CIS lists a different six-credit program-elective pool. CIS 345 is a curriculum
requirement there, while it is eligible in CS's program elective pool. The other
elective's open discipline list and exclusion are preserved as an unknown rule;
there is no invented complete catalog pool or prefix-matching algorithm.

Scientific World has an observed AND/OR layout. The candidate
`CSC 101 AND (CSC 110 OR CSC 111)` is retained with an explicit `Unknown` child;
it cannot produce a met result before grouping/category allocation review. The
fixture does not infer a Flexible Core total by subtraction. It omits many actual
major/science requirements rather than pretending to cover the full degree.
The eleven program-elective identities have unknown credits in this bounded
capture; undated department metadata is not silently assigned this catalog year.

Four projection columns remain present, even for partial/empty configurations.
Tests cover distinct program/release identity, same shared category vocabulary,
different math/elective behavior, crossed-release input denial, missing elective
credits and unresolved grouping. Existing tests cover cross-campus identity denial
and synthetic two-year changes; Phase 02B adds source-scope denial and an actual
Phase 02A-generated fictional 2025–2026 snapshot.

## Historical and round-trip validation

`backend/tests/fixtures/phase02a_snapshot.json` was generated from the unchanged
Phase 02A evaluator before Phase 02B modifications, using fictional policy/history.
It is **not** official 2025–2026 BMCC evidence. Tests preserve its `02a.1` result
and compare supported results with a separately labeled `02b.1` recomputation.
Recomputation is not rewriting the old snapshot or claiming a complete legacy
runtime dispatcher. Exact old runtime execution remains pinned to commit `91ece06`.
All three release loaders and current snapshots pass semantic JSON round-trips.

No generic evaluator branch checks CS/CIS program IDs, course display codes or
catalog-year literals. Additional programs still need their own source review;
these tests do not certify all BMCC or A.A.S. curricula.
