# V1-informed modernization strategy

Phase 01C recommendation for owner review. Source baseline and evidence confidence:
[V1 inventory](V1_FEATURE_INVENTORY.md); data details: [V1 data audit](V1_DATA_AUDIT.md).
V2 is an evolution of useful workflows with redesigned ownership, security and UX.
It is not permission to clone the V1 runtime, migrate its live database or recreate
all prototypes. No application, dependency or database change is part of this phase.

## Treatment and priorities

Classification applies to concepts or narrowly scoped artifacts, not automatic code
reuse. Relative complexity: S = bounded isolated work, M = multi-module integration,
L = substantial academic/state validation, XL = governance/data/engine redesign.
These are comparative estimates, not delivery dates or staffing commitments.

| Capability / artifact | Classification | Priority / complexity | Dependencies and main acceptance |
| --- | --- | --- | --- |
| Completed Course Selector | **Preserve concept, redesign implementation** | P0 / L | Approved catalog, record revisions, audit allocation; reusable workspace module accessible from chat/progress/plan; one selection changes all views |
| Degree Map Tree | **Preserve concept, redesign implementation** | P0 / L | Canonical rule graph projection, audit overlay, accessible list; expand/highlight/categories/print retain meaning across views |
| Structured semester planner | **Preserve concept, redesign implementation** | P0 / XL | Audit residuals, same-term rules, workload constraints; partial plan remains useful with explicit unplaced IDs/reasons |
| Degree progress/audit | **Replace** heuristic calculation implementation | P0 / XL | Source-approved AST and global allocation; same inputs yield same versioned result without model |
| Program/campus choice | **Reuse carefully after verification** of identity/dedup intent | P0 / M | Separate identity/version/assignment; no code-only or silent latest-year resolution |
| CSV catalog/source notes | **Reuse carefully after verification** | P0 / L | Staging, schema validation and independent academic source reconciliation before release |
| AND/OR parsing helpers and fixture ideas | **Reuse carefully after verification** | P0 / M | Translate supported subset into typed expressions; never silently flatten unsupported conditions |
| Browser local/sessionStorage persistence and iframe state copying | **Replace** | P0 / L | Workspace ownership, fixed guest expiry, revisions and explicit conversion; browser cache cannot become academic authority |
| Admin role/auth defaults and unguarded access paths | **Replace** | P0 / L | Scoped grants, independent verified academic authority, negative access tests; no shared-account student identity |
| Mutable course/catalog/seed repair model | **Replace** | P0 / XL | Isolated V2 schema, Alembic, immutable publication and reproducible history; no V1 schema/engine reuse |
| Chat onboarding branches | **Preserve concept, redesign implementation** | P1 / M | Confirmed minimal profile plus deterministic choices; optional free text, corrections and non-chat alternative |
| Major-change / transfer comparison | **Preserve concept, redesign implementation** | P1 / L | Verified scoped mappings + canonical destination audit; no cross-campus code fallback or estimate-as-award |
| Advisor prospectus / print / handoff | **Preserve concept, redesign implementation** | P1 / L | Immutable report contract, residual warnings, explicit consent and authorized recipients; print/text/HTML agree |
| Optional AI explanations and intent extraction | **Preserve concept, redesign implementation** | P1 / L | Approved Gemini Gateway, bounded cost, minimal context and claim validation; structured tools survive failure |
| Graph layout preferences | **Reuse carefully after verification** of concept | P1 / S–M | Separate nonacademic layout state from published academic relations; schema/version-bound offsets |
| Draft / preview / version history concepts | **Preserve concept, redesign implementation** | P1 / L | Verified scoped approval, exact content hash, independent author/reviewer, controlled publication/rollback |
| Raw transcript-to-Gemini endpoint | **Replace** | Later / XL | Security-approved upload/quarantine/extraction/review; no direct authority or raw-data default sending |
| AP / broader CPL guidance | **Reuse carefully after verification** of sources and categories | Later / L | Typed exam/learning evidence and reviewed award/applicability; IB remains unresolved until authoritative scope exists |
| Career/O*NET recommendations | **Defer** | Later / M | Owner confirms value/scope, permissions, source freshness and independent operating budget |
| Live sections / schedule-provider integration | **Defer** | Later / L | Official access agreement, term/offering freshness and failure behavior; keep plans tentative |
| Ordinary CMS copy/layout | **Replace** scattered strings with approved-block content | Later / M | Protected messages, safe block schemas, campus composition; no rule editing by ordinary content role |
| Legacy alternate chatbot/FAQ/Chroma/Ollama entrypoints | **Remove** from planned V2 initial runtime | P0 scope reduction / S | Do not delete or alter V1; retain audit references and only deliberately selected behavior |
| Unsafe cross-campus direct-code matching, AI-only academic claims, default sensitive logs | **Remove** from target behavior | P0 / M | Denial/unresolved outputs and minimized telemetry; no false confidence |
| Direct production data/log import | **Defer** unless separately justified and authorized | No current scope | Ownership, consent/authority, minimization and retention review; no presumed need to migrate student data |

Evidence for treatment: [SELECT] [GRAPH] [PLAN] [TRANSFER] [SEED] [AUTH] [AI]
[EXTRACT] [REFERRAL] [DRAFT]. V1 remains intact even where the V2 classification is Remove.

## Recommended implementation order (future, separately authorized)

1. **Review the audit and agree on a parity charter.** Preserve selector/tree as primary
   modules, optional AI explanation, comparison and report concepts. Decide which
   alternate entrypoints and career/CPL scope matter. Name actual academic reviewers;
   professor feedback is a product signal, not college policy approval.
2. **Create a synthetic evidence/contract foundation.** Select a small BMCC catalog
   scope, immutable source snapshots and catalog-assignment rules. Reconcile CSV/year/
   map conflicts. Define canonical IDs, workspace ownership, record provenance and
   access contracts before a backend schema implementation. No automatic production import.
3. **Build the deterministic audit core and regression fixtures.** Implement typed
   prerequisites, alternative paths, credit allocation, grades/repeats/exceptions
   within verified scope. Add only separately authorized persistence under
   `cuny_advisor_v2`; all schema work stays outside V1. Unknown rules block definitive outcomes.
4. **Deliver selector and progress together as the first academic vertical slice.**
   Reuse Light Frosted Glass primitives with opaque evidence surfaces. Provide
   search/category/choice details, reported-course review, canonical audit status,
   explanation links and a non-chat entry. Require atomic revision synchronization.
5. **Deliver a read-only map projection alongside the selector.** Preserve category
   folding and dependency exploration. Evaluate custom rendering versus React Flow +
   worker ELK with a bounded spike; no admin academic mutation through graph dragging.
   Keep accessible list and print projections even if the canvas is unavailable.
6. **Add deterministic semester planning.** Plan from canonical audit residuals and
   approved rules, with concrete versus unassigned slots and term confidence. Make
   infeasibility/partial plans first-class. Add the synthetic 50-required/46-placed
   case across UI/report contracts before any AI commentary.
7. **Add comparison, reports and human review.** Destination transfer evaluation feeds
   the same audit; reports freeze exact versions and preserve unresolved/unplaced
   items. Consent/case handling must satisfy guest expiry and advisor authorization.
8. **Add Gemini explanations after deterministic outputs are stable.** Pin audit/plan
   result IDs, validate claims, meter tokens and preserve structured outputs on
   errors. Add transcript processing, formal AP/IB/CPL awards, CMS and integrations
   only through their separately approved roadmap gates.

This is dependency ordering within the existing roadmap, not authorization for
new numbered implementation phases. Security and identity/workspace foundations
are prerequisites whenever a slice needs private state; a synthetic contract demo
must not be represented as completed real-user access control.

## Acceptance and regression matrix

| Risk / fixture | Required acceptance in V2 |
| --- | --- |
| Same course in required + elective or two fixed groups | Approved overlap policy determines allocation once; every view and report displays the same allocation IDs |
| A AND (B OR C), grade/standing conditions | Source-backed expression evaluated with explanation; unsupported/missing evidence unresolved, never assumed met |
| Corequisite bundle and true prerequisite chain | Same-term completion permitted only by approved condition; prerequisite evaluated before term; bundle load considered together |
| Optional cycle versus impossible cycle | Test valid alternative path separately from unsatisfiable necessary dependency cycle; layout warnings never decide eligibility |
| 50 modeled remaining / 46 placed | Partial status, four residual credits with affected requirement IDs/reasons; no full-degree completion claim; all exports/handoffs preserve it |
| Placeholder and actual offering | Slot is not earned credit, completed course, registered section or proof a class is offered |
| Transfer same code at different campuses | No equivalence without reviewed evidence; grade/year/direction/combination conditions enforced |
| Two catalog years | Correct student assignment, stable historical replay, explicit comparison; no silent newest-year substitution |
| Gemini timeout/invalid response/budget exhaustion | Audit, selector, graph/list, plan and printable report remain available; commentary marked unavailable |
| Guest expiry/conversion/handoff race | Fixed 24h denial, scoped selected-data conversion and consented snapshot semantics from SECURITY.md |
| Academic graph edit versus layout drag | Only layout changes immediately; academic edit creates reviewed proposal, invalidates dependent outputs after publication |
| Report parity | HTML/text/PDF payloads preserve plan completeness, uncertainties, evidence, versions and consent scope |

## Data reuse and cutover discipline

No direct V1 database migration is planned. A later authorized source importer should
read an explicitly reviewed export/source snapshot into V2 staging, retain original
file/hash/row lineage, validate identity and rule semantics, then require academic
approval before publishing. “Approved” in V1 is imported provenance, not an automatic
V2 reviewer decision. Preserve original claims and record conflicts rather than
silently choosing a source. Missing source evidence quarantines the assertion.

Use synthetic parallel comparison to expose differences; V1 output is a behavior
reference, not an oracle. Academic reviewers resolve whether each difference is an
intended correction, unsupported policy, source drift or regression. Backout means
withdrawing the new V2 release or reverting its own deployment after separate
approval, never changing V1 or mutating historical V2 audit inputs.

## Decisions still needing owner review

- Pilot BMCC program/year and responsible institutional academic authority.
- Detailed overlap, substitution, grade/repeat and catalog assignment policies.
- Renderer choice, package/license/bundle review and benchmark budgets for graph/export.
- Exact planning search/solver strategy after reference fixtures and scale are known.
- Which career/CPL/transfer destinations are first-release scope versus later work.
- Real-data retention/provider approval, accepted handoff-case policy and verified recipients.
- Whether any legacy artifacts require migration beyond reviewed public catalog sources.

The owner-approved direction is evolutionary modernization. The specific library,
solver, source corrections and implementation sequencing here remain recommendations.

[SELECT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L3098-L3615

[GRAPH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/curriculum_graph_service.py#L47-L282

[PLAN]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4035-L4310

[TRANSFER]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/transfer_analysis.html#L636-L840

[SEED]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/seed_database.py#L1388-L1530

[AUTH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/auth.py#L1-L47

[AI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L901-L980

[EXTRACT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L376-L445

[REFERRAL]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L526-L684

[DRAFT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L733-L1407
