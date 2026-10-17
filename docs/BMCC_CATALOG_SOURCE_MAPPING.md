# BMCC catalog source mapping — Phase 02A

Reviewed 2026-10-16, campus BMCC, target catalog **2026–2027**, Computer Science
A.S. Official webpages are the owner/professor-selected primary project sources.
That selection and source verification confer no institutional academic approval.
The fixture is manually curated, partial and **draft**, never a graduation audit.
No V1 database, student record or live AI was accessed.

## Evidence register and executable traceability

Every fixture assertion references a `Source` with URL, retrieval date, target
catalog year, section, evidence state and separate `year_confirmed` flag. Dates
below apply to all sources. `source_verified` means observed source text with
explicit year applicability; it does not mean approved for real student decisions.
`provisional` means observed current text whose target-year applicability or
interpretation remains unconfirmed. `conflicting` is supported and tested; no
invented conflict is inserted into the reference fixture. Synthetic policies and
histories live separately in `backend/tests/academic_factory.py`.

| Source / section | Fixture IDs and captured facts | State |
| --- | --- | --- |
| [CS program](https://www.bmcc.cuny.edu/academics/departments/cis/computer-science/), Requirements, year note | `program-totals`: required 12, flexible 18, common 30, curriculum 30, degree 60 | Source-verified, 2026–2027 explicit |
| Same, footnote 1 | `program-f1` → `math-rule`: MAT 206 OR MAT 301 | Source-verified |
| Same, footnotes 2–3 | `program-f2` → `life-science-rule`: PHY 215; `program-f3` → `flexible-discipline-cap`: maximum two courses per discipline/field | Source-verified; classifications missing |
| Same, footnotes 4–5 | `program-f4` → `creative-advice-rule`: SPE 100 OR 102 recommended; `program-f5` → `scientific-rule`: CSC 101 AND 111 | Source-verified |
| Same, footnote 6 | `program-f6` → `major-electives-rule`: six credits from 14 listed identities | Source-verified pool membership; course metadata incomplete |
| Same, Curriculum Requirements / footnote 7 | `program-major` → six major course requirements; `program-f7` → unresolved `general-elective-rule`, STEM allocation | Source-verified text, allocation unresolved |
| [Math Pathways](https://www.bmcc.cuny.edu/academics/pathways/mathematical-and-quantitative-reasoning/), MAT entries | `math-current`: four-credit mathematics entries; prerequisite alternatives | Provisional target-year applicability |
| [Math department courses](https://www.bmcc.cuny.edu/academics/departments/math/course-listings/), MAT 206/206.5/301/302 | `math-department-current`: corroborates MAT 206 OR 206.5 before 301; 301 before 302 | Provisional year/conditions |
| [Math placement](https://www.bmcc.cuny.edu/academics/departments/math/testing-and-placement/), 200/300-level requirements | `math-placement-current`: placement/exemption routes require department interpretation | Provisional; no placement clearance implemented |
| [Scientific World](https://www.bmcc.cuny.edu/academics/pathways/scientific-world/), CSC 101/111 | `science-current`: 3 / 4 course credits; program-qualified prerequisite language | Provisional year/interpretation |
| [Life and Physical Sciences](https://www.bmcc.cuny.edu/academics/pathways/life-and-physical-sciences/), PHY 215 | `physics-current`: four credits, MAT 302 corequisite and credit exclusions | Provisional; timing/exclusions not implemented |
| [CIS course listing](https://www.bmcc.cuny.edu/academics/departments/cis/course-listings/), CIS 317/345 | `cis-current`: four / three credits | Provisional year; remaining elective metadata not captured |
| [Pathways](https://www.bmcc.cuny.edu/academics/pathways/), Common Core / credential notes | `pathways-current`: shared categories, program-specific sixth flexible course and AAS differences | Provisional release bindings |

The [program directory](https://www.bmcc.cuny.edu/academics/programs/) and
[course directory](https://www.bmcc.cuny.edu/academics/courses/) were opened as
navigation evidence, not degree-rule authority. All primary pages above were
accessible through the web tool. An initial guessed `/departments/mathematics/`
URL failed; the actual `/departments/math/` listing and placement page succeeded.
Linked syllabi, all other program catalogs, registration systems and private
DegreeWorks were not inspected. No complete content archive/hash is claimed;
the JSON retains structured assertions and locators, not immutable webpage bytes.
Archival source capture and review are gates before publication.

## Credit reconciliation — an open interpretation, not a silent correction

Keep declared category targets distinct from course credit. The math and physical
science slots each specify three, while linked STEM entries carry four. Scientific
World's listed pair carries seven against its six-credit slot. On those observations,
the nominal Common Core slots can involve three extra STEM credits. The program's
four-credit general elective may absorb permitted STEM variants, but the exact
allocation, remaining elective credit and both mathematics paths need authorized
review. This arithmetic is an investigation aid, not an implemented overlap policy.
Do not replace 60 with a raw row sum, change a course to three credits, or award
extra degree credit merely because MAT 301 was needed as preparation.

The fixture preserves totals and individual values. It uses `Unknown` for general
elective/STEM allocation and missing pools. The prototype rejects all cross-group
reuse, including partial splits, until explicit reviewed overlap semantics exist.
It does not solve this policy question through a greedy allocation heuristic.

## Unresolved questions before academic publication

- Confirm release-specific grade, repeat, transfer, placement/exemption and approved
  exception semantics. A synthetic grade rank of 3 is a test condition only.
- Reconcile course-list prerequisite alternatives with program qualifiers, especially
  CSC 111 and departmental approval. Do not infer transfer equivalence by code.
- Confirm STEM excess-credit treatment, general-elective residuals and extra MAT 301
  credit on Path A without changing published targets.
- Curate all elective credits, English/flexible category pools, and discipline or
  interdisciplinary classifications. Prefixes are not a verified discipline taxonomy.
- Confirm PHY 215 same-term corequisite and mutual credit exclusions; no offering,
  seat, schedule or registration availability is known.
- Establish authorized academic reviewers, immutable source capture, catalog
  assignment and publication review. Super Admin is not academic authority.

The source-to-rule IDs above are checked through release reference validation and
JSON round-trip tests. Source absence, uncertainty and unsupported conditions cannot
be promoted to a definitive result. See [model](ACADEMIC_RULES_MODEL.md) and
[parity](V1_SELECTOR_PARITY.md) for implementation and regression boundaries.

Final implementation review additionally enforces course-level evidence states,
not just rule-level states, for modeled completion/credit/discipline conditions.
Missing catalog elective credit remains unresolved even when a synthetic input
supplies a number. No new official-source verification or institutional approval
is inferred from the added synthetic regression tests.
