# Completed Course Selector parity — Phase 02A

The owner/professor-approved product contract preserves four top-level columns,
in the canonical backend order: **Required Common Core**, **Flexible Core**, **Major Requirements**,
**Major Electives**. Flexible Core holds non-major general education categories;
the major elective pool is program-specific. Approval of this layout is product
direction, not institutional policy approval. No selector UI is implemented or
rewritten in Phase 02A.

## Read-only V1 evidence and interpretation

Reference revision `ba499bc078a4889ed7ed4ad2f381a5c6950753d3`; inspected as text
from the existing Phase 01C source cache. V1 was not imported, executed or changed.
This inspection does not claim to observe its deployed runtime.

- [DISPLAY_AREAS and selector](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L1848-L1865)
  define four grouping concepts. The pinned source's literal labels/order are
  Program Requirements, Program Electives, Common Core, Flexible Core. The current
  owner request supplies the normalized V2 labels/order above; no false claim of
  byte-identical V1 labels is made.
- [Prerequisite helpers](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2727-L2752)
  evaluate AND groups with nested OR alternatives separately from category totals.
  [Group completion](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2896-L2965)
  and [rendering](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L3098-L3150)
  provide useful category/alternative interaction concepts.
- [V1 prerequisite sample](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/course_prerequisites.csv#L14-L15)
  and [CS sample](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/cs_courses.csv#L12-L18)
  encode the 206 → 301 → 302 progression. Owner reports that behavior worked
  correctly. It is a preservation regression, **not a known V1 bug**. CSV content
  remains behavioral reference, not authority for the 2026–2027 degree.

## Regression contract and implemented tests

| Case | Expected bounded result |
| --- | --- |
| MAT 206 assigned to math | Degree math can be met; missing synthetic grade makes MAT 301 prerequisite unresolved; MAT 302 remains unmet without 301 |
| Path A: 206 → 301 → 302 | Progression passes with explicit synthetic grade conditions; 301 preparation creates no extra requirement allocation |
| Path B: 301 → 302 | Math and subsequent 302 progression pass with sufficient evidence; no fabricated historical 206 completion |
| MAT 301 completed, MAT 302 absent | Math can be met while the separate major-calculus requirement remains unmet |
| Recommendation versus requirement | SPE advice is distinct; it cannot consume degree credit |
| Scientific World | Both specified courses required; selecting one does not complete the pair |
| Six-credit electives | Only eligible allocated credit counts; outside-pool allocations rejected |
| Flexible discipline cap | Across-category course count checked; missing taxonomy unresolved |
| Multiple eligibility | Explicit allocation only, earned credit counted once; unsupported overlap unresolved |
| Different years | Frozen release/course versions retained and historical result replay unchanged |
| Unknown/conflicting/unsupported | Explicit unresolved result or invalid-contract rejection, never invented approval |
| Four columns | Exact ordered enum/projection retained, including empty columns in future configurations |

The first mandatory test's phrase “does not automatically satisfy MAT 301 prerequisite
eligibility” is implemented as **no inference from degree math completion**. It does
not falsely state that MAT 206 can never satisfy MAT 301's actual prerequisite.
Once the independently modeled prerequisite conditions are met, Path A advances.
The current official-source draft remains unresolved for complete eligibility
because year-specific grade/placement/exemption interpretation is unapproved.

## Future consumers

`selector_columns` groups canonical requirement definitions; it never calculates
completion. `condition_projection` carries course prerequisite/corequisite rules
with nested groups and provenance, separately from degree category membership.
There are no layout coordinates, academic overrides, graph libraries or alternate
frontend rule formulas. A later selector/progress/tree/planner must bind the same
release and evaluation snapshot. Category completion, prerequisite conditions,
earned credit, allocations and actual offering availability remain separate.

Future UI preserves searchable choices, alternatives, category detail and the map
concept while consuming canonical results. Known V1 risks documented in the
[audit](V1_DATA_AUDIT.md) do not imply its mathematics chain was broken. See the
[rules model](ACADEMIC_RULES_MODEL.md) for deliberately unsupported policy and
the [source mapping](BMCC_CATALOG_SOURCE_MAPPING.md) for verification gaps.


## Phase 03A frontend visual refinement (2026-10-17)

The owner explicitly authorizes V1 visual ordering: Major Requirements, Major
Electives, Required Common Core, Flexible Core. This supersedes the old frontend
ordering requirement only. The canonical enum/backend projection and all four
semantics above remain unchanged. `selectorColumns` sorts a copy for display and
preserves group identities; tests check both this and rendered ordering.

Reinspected the pinned audit-cache `frontend/db_progress_graph.html` as text:
`DISPLAY_AREAS` (1848–1865), `renderCompletedCourseGrid` (3098 onward),
`createSelectableCourseCard` (3175 onward) and card CSS (73–175). No user comparison
screenshots were available, and V1 was not executed or modified. Code/title/
checkbox hierarchy, consistent cards and “Class details” inspired the refinement.
V1 automatic recognition, locking, hidden-satisfied courses and completion/credit
helpers were deliberately not copied: those would change academic semantics or
imply functionality/evidence absent in V2. Blank pools stay explicitly unresolved.
