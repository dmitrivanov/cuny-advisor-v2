# Academic policy evidence matrix — Phase 02B

Manual review date: **2026-10-16**. Target: **BMCC Computer Science A.S.,
2026–2027**; second program: **BMCC Computer Information Systems A.A.S.,
2026–2027**. Official program Notes explicitly name the year. Other current pages
do not establish that year by themselves. No institutional academic approval is
claimed. Every row below still requires authorized academic review before use for
real students. No institutional account, production database or student data used.

Status distinguishes observed evidence from executable policy: **verified** means
the precise program/year assertion was observed; **provisional** means applicability
or interpretation remains unconfirmed; **conflicting** identifies an explicit source
disagreement; **unresolved** is a missing supported policy/result, not a guess.
Dates of publication, revision, effectiveness and retrieval are separate. Unknown
dates remain null; the target catalog year is not a publication/effective date.

## Matrix

Source IDs link to the [source mapping](BMCC_CATALOG_SOURCE_MAPPING.md) and the
typed local evidence registry. Scopes are intentionally narrower than a complete
institutional policy. Abbreviations: CS = Computer Science A.S.; CIS = Computer
Information Systems A.A.S. All sources retrieved 2026-10-16.

| Assertion / scope | Evidence and locator | Date / applicability | Status and implementation decision |
| --- | --- | --- | --- |
| CS degree math alternative and separate major calculus | [CS program](https://www.bmcc.cuny.edu/academics/departments/cis/computer-science/), footnote 1 / Curriculum Requirements | Explicit 2026–2027; publication unknown | **Verified** alternatives MAT 206/301 and separate MAT 302. Keep both synthetic progression paths; category completion grants no prerequisite waiver. |
| CS STEM/general elective | Same, footnote 7 | Explicit year, allocation mechanics absent | Footnote **verified**; exact excess-credit/overlap allocation **unresolved**. Do not infer an unconditional duplicate allocation. |
| General STEM framework | [CUNY STEM Variant](https://www.cuny.edu/about/administration/offices/undergraduate-studies/pathways/about/ccrc/stem-variant/), STEM Variant Courses; `cuny-stem` | Undated | **Provisional** binding: variable-credit approved variants exist in designated areas; not proof that every BMCC STEM course is a variant. |
| Common Core choice versus major application | [CUNY glossary](https://www.cuny.edu/about/administration/offices/undergraduate-studies/pathways/about/glossary/), STEM Variant; `cuny-stem-glossary` | Undated | Framework observed; BMCC-year allocation **unresolved**. Requirement satisfaction may overlap without increasing uniquely earned credit. Current evaluator conservatively rejects cross-group reuse. |
| Multi-area choice, proficiency and waiver | [CUNY Guidelines](https://www.cuny.edu/wp-content/uploads/sites/4/page-assets/about/administration/offices/undergraduate-studies/pathways/about/policies/Guidelines_5_24_13_Final_Updated_3.15.18_accessible.pdf), pp. 3–4; `cuny-guidelines` | Revised 2018-03-15, p. 1; current applicability unconfirmed | **Provisional**: area choice and college-dependent proficiency exemption differ from credit awards; zero-credit waiver representation is not a passed course. No waiver execution implemented. |
| Grade table and repeats | [BMCC Grading/Forgiveness](https://www.bmcc.cuny.edu/registrar/policies-general-information/grading-forgiveness-policy/), I–III; `bmcc-grades` | Current page undated; forgiveness text mentions grades after 1984-09-01 | **Provisional** year binding. GPA forgiveness retains original attempts; repeat section uses C-or-better terminology. Do not infer a universal prerequisite minimum or implement repeat normalization from this summary. |
| Transfer grade notation | [Admissions](https://www.bmcc.cuny.edu/admissions/transfer-students/), “How many courses”; registrar I current/discontinued table; `bmcc-transfer-notation` / `bmcc-registrar-notation` | Both undated | **Conflicting** notation: admissions TR versus registrar current CR / discontinued TR. Preserve original symbols; no credit eligibility decision follows from this notation conflict. |
| Incoming transfer conditions | Admissions, “What kind of courses” / department approval; `bmcc-transfer-conditions` | Undated | **Provisional**: within-CUNY D treatment depends on major, outside-CUNY C threshold and technical-course department review described. No code-only equivalence or award. |
| Transfer summary | [BMCC knowledgebase](https://help.bmcc.cuny.edu/37085/kb/article/100521/transfer-credits), Transfer credits; `bmcc-transfer-kb` | Updated 2025-03-13 | Broad conditional summary, not a universal D rule; **provisional** for target year. Evaluation/equivalence still required. |
| Math enrollment route | [Math course listing](https://www.bmcc.cuny.edu/academics/departments/math/course-listings/), MAT 301/302; existing `math-current` / `math-department-current` | Undated | Chain observed; year-specific grades, alternatives and approval conditions **unresolved**. Synthetic grade ranks are fictional. |
| Placement / exemption | [Math placement](https://www.bmcc.cuny.edu/academics/departments/math/testing-and-placement/), 200/300 Level Courses; `bmcc-placement` | Undated | **Provisional**: department/AP/previous-course routes described; placement alone awards no modeled credit and applies no automatic exemption. |
| Prerequisite alternatives / department permission | [CIS listing](https://www.bmcc.cuny.edu/academics/departments/cis/course-listings/), CSC 111; `bmcc-csc-prerequisites` | Undated | **Provisional** program-qualified alternatives. Department permission is an authorized review condition, not an administrator override or inferred completion. |
| CS Flexible Core / electives | CS footnotes 3–6; existing source IDs | Explicit year | Cap and eligible pool **verified**; discipline taxonomy and missing course credits **unresolved**. Advice remains distinct from required courses. |
| A.A.S. framework | [BMCC AAS Pathways](https://www.bmcc.cuny.edu/academics/pathways/pathways-for-aas-students/), main text; `bmcc-aas-pathways` | Undated | **Provisional** program bindings; A.A.S. does not automatically inherit A.S. totals. |
| CIS second program | [CIS program](https://www.bmcc.cuny.edu/academics/departments/cis/computer-information-systems-cis/), Required Core / Curriculum / footnotes / Notes | Explicit 2026–2027 | **Verified** bounded options, targets and pool membership; incomplete eligible metadata, Scientific World grouping and overall allocation **unresolved**. See [validation](SECOND_PROGRAM_VALIDATION.md). |

## What reconciliation changes

The framework supports separating “satisfies a requirement” from “adds earned
credit”; it does not justify counting one earned course twice. Supporting legitimate
overlap later needs a separate requirement-satisfaction relation and a bounded
credit ledger, with an approved release-specific policy. Phase 02B keeps the
existing rejection of any cross-group allocation, including a 3+1 split of four
credits. This is a prototype limitation, **not a claim BMCC forbids overlap**.

No universal passing-grade, prerequisite, repeat, equivalence, placement or waiver
algorithm is adopted. `NonCreditEvidence` records synthetic claims separately and
returns review-needed outcomes without credit. Published/current source text is
evidence to reconcile, not a grant of institutional authority to this application.
There was no bulk scrape, source importer or full webpage archive.

## Concrete questions for authorized academic reviewers

1. **Registrar + CS program:** How does footnote 7 allocate each STEM variant's
   excess credits to the four-credit general elective on each math path? Which
   courses have the relevant approved variant designation for this release?
2. **Registrar:** Can a course satisfy a major and one Common Core obligation
   simultaneously, and which credits count against each target versus the unique
   degree total? Is a split allocation or separate satisfaction-only relation needed?
3. **Math department + registrar:** What minimum grades, catalog applicability,
   placement, AP, transfer, prerequisite/corequisite waivers and permission evidence
   apply to MAT 206/206.5/301/302 and PHY 215? Which permissions earn zero credits?
4. **Registrar:** What are the applicable repeat, forgiveness and earned-credit
   rules, including prior C-or-better attempts? How should current CR and legacy TR
   symbols be retained and normalized without misclassifying a transfer award?
5. **CS/CIS program authorities:** Confirm CSC 111 alternatives and CIS Scientific
   World parenthesization/category allocation. No assumed grouping may pass solely
   because both course codes appear in an unreviewed interpretation.
6. **Catalog steward + program authorities:** Supply release-specific discipline/
   interdisciplinary classifications, elective credit values and complete pools,
   especially CIS's open-discipline elective and exclusions.
7. **Institutional authority:** Who may approve these exact scoped revisions and
   establish student catalog assignments? Super Admin alone is insufficient.

These are recorded questions, not messages sent to faculty or institutional staff.
Safe independent work continues while the affected conditions remain unresolved.
