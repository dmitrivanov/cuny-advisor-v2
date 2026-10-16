# V1 data architecture audit

Phase 01C, read-only source analysis. Snapshot and evidence labels are defined in
[V1 feature inventory](V1_FEATURE_INVENTORY.md). All V1 source links below are pinned
to `ba499bc078a4889ed7ed4ad2f381a5c6950753d3`. No database was opened, inspected or
modified; ORM declarations do not prove deployed constraints or current data.

## Storage and schema lifecycle

`database.py` creates an SQLAlchemy engine and session factory; SQLite is the local
fallback, PostgreSQL URLs are normalized to psycopg2. Main server module import
calls `Base.metadata.create_all`. `seed_database.py` additionally inspects columns,
issues ALTER TABLE/UPDATE/index DDL, commits compatibility repairs, and rebuilds
program curricula from CSV. No Alembic migration directory/revision chain was found
in the inspected recursive Git tree. Therefore schema creation and procedural repairs
exist, not a reviewed, reversible versioned migration history. The checked-in [render.yaml](https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/render.yaml) includes
seeding in the primary service build and declares a separate legacy app service;
this is configuration evidence only, not proof of a running service. Do not run
those commands for this audit or point them at V2. [DB] [APP] [DDL] [SEED]

The seeder deliberately deletes superseded populated program rows sharing a campus
and code, clears/rebuilds a selected program's academic data, and treats full CSV as
the active record. This fixes V1 selector duplicates but destroys the immutable
catalog-release semantics V2 needs for historical student audits. [SEED]

## Existing ORM tables and relationships

All 29 model classes below declare an integer `id` primary key. Referenced foreign
keys are conventional numeric references; campus coherence across multiple related
rows is mostly application policy, not a composite database constraint. Field names
shown are source declarations, not queried DB values. [MODELS]

| Tables / source lines in `models.py` | Keys and relationships | Relevant limitations |
| --- | --- | --- |
| `institutions` 8–30 | Unique code/name; owns departments/courses/choice pools | Code nullable; no catalog-release or campus access boundary |
| `departments` 86–99 | FK institution; unique institution+code | No scoped user/authority bindings |
| `programs` 102–119 | FK department; unique department+code+catalog_year | Year nullable string; URLs often query only program code |
| `courses` 305–326 | Nullable institution FK; unique institution+code; `catalog_code`, display-code compatibility | Mutable title/integer credits; no course-version or verified source section |
| `program_courses` 329–342 | FKs program/course; unique pair; requirement_type | Duplicates relationships also represented in requirement groups |
| `course_prerequisites` 345–365 | FKs program/course/prerequisite; unique tuple incl group_id | AND-of-OR representation only; no grade/standing/term condition or source per rule |
| `course_requirement_group_prerequisites` 415–430 | FKs program/course/requirement group; unique tuple | Group-name projection in API loses stable identity |
| `course_alternatives` 433–448 | Program/course/alternative FKs; unique directed tuple | Does not by itself mean transfer equivalence or personal substitution |
| `requirement_groups` 460–478 | Program FK; unique program+name; type, credits, count, order, completion_options/required_course_sets Text | Serialized arrays, no typed AST version or overlap policy |
| `requirement_group_courses` 481–490 | Group/course FKs; unique pair | Course can appear in many groups; no global allocation record |
| `choice_groups` 493–511 | Institution FK; unique institution+code; targets, advising_note/source | Campus-wide mutable pools with program adjustments layered elsewhere |
| `choice_group_courses` 514–526 | Pool/course FKs; unique pair | No explicit release/effective dates |
| `course_equivalencies` 33–83 | Source/destination institution FKs; code-based directional unique tuple | Grade/year/status/source exist, but unique tuple excludes period so multiple versions collide |
| `curriculum_graph_edge_overrides` 368–394 | Program/source/target FKs; relation/action/group, author/time, unique relationship tuple | Adds/removes visual relations without immutable academic approval history |
| `curriculum_graph_node_positions` 397–412 | Program/course FKs; unique pair, x/y | Visual offsets only; should not own academic semantics |
| `faq_entries` 451–458 | Program FK, question/answer/intent | Unversioned content strings |
| `curriculum_drafts` 529–550 | Optional institution/department FK; published program FK; JSON text/status/author/time | Mutable draft and publish pointer; not an immutable catalog release |
| `curriculum_draft_versions` 553–570 | Draft FK, unique draft+version; JSON/note/author/time | Snapshot concept valuable; approval not bound to verified academic grants |
| `careers`, `skills`, `career_skills` 122–160 | Career/skill slugs; join FKs and unique pair | Resource provenance richer than core rules; not student academic history |
| `program_careers` 163–183 | Program/career FKs, unique pair; points/evidence/source/review time | Scoring constants and active state do not establish institutional approval |
| `cpl_types`, `program_cpl_guidance` 186–221 | CPL code; program/type FKs; unique pair; evidence/guidance/source/status | Guidance, not adjudicated individual credit awards |
| `academic_terms` 224–233 | Unique provider_code; name/provider/verified/source/active | Source term metadata, not a complete offering/section timetable |
| `schedule_provider_configs` 236–254 | Unique code; enabled/approval/owner/permission/refresh/retention metadata | Stored readiness declarations; live provider behavior unverified |
| `transfer_options` 257–271 | Source program FK, target name/program strings; unique source+target | Reviewed destination resource, distinct from course equivalency |
| `governance_drafts`, `governance_draft_versions` 274–302 | Draft entity type/id, JSON/source/status; version FK/unique number | Generic entity ID is not a typed FK; no independent reviewer/author separation |

Source anchors: [MODELS], [EQ]. No user, student, transcript-attempt, transfer-award,
workspace, persistent audit-run, saved-plan, consent-case or advisor-report table
is declared in this model file. Session login and browser artifacts are different
storage mechanisms; absence here is not a claim that no external system exists.

## Academic rule encodings and duplication

1. **Prerequisites:** CSV uses `|` for AND groups and literal ` or ` within each group.
   `parse_relationships` writes numeric group IDs to `CoursePrerequisite`. APIs project
   singleton strings or nested arrays; the browser uses every/some to evaluate them.
   This cannot directly express arbitrary nested logic, minimum grade, placement,
   permission or same-term conditions. [PARSE] [RELSEED] [LOAD] [ALLOC]
2. **Canonical versus program rows:** `course_prerequisites.csv` supplies campus facts;
   seeding replicates them per program only when no explicit prerequisite exists.
   A declared blank deletes locks. The input source URL is not persisted on each
   prerequisite row. A changed canonical source can therefore coexist with older
   explicit program relations. [PREREQCSV] [CANON]
3. **Corequisites/recommended:** graph overrides can carry these relation types;
   base `CoursePrerequisite` cannot. The selector/planner payload ignores graph
   overrides. A JSON degree-map note names a corequisite without supplying a
   canonical executable condition. [GRAPH] [GRAPHADMIN] [LOAD] [MAP]
4. **Requirements/electives:** CSV group/type/targets become RequirementGroup plus
   links. Completion paths and course sets live as JSON Text; program choice-pool
   adjustments are reconstructed by seed/publication processes. `ProgramCourse`
   and group links duplicate association meaning. Fake elective/Pathways courses
   share the real Course table through `choice_group_code`. [MODELS] [RELSEED] [DRAFT]
5. **Allocation:** browser required/elective sets and group helper functions own
   applicability; transfer analysis independently matches every target row. The
   graph has another projection. There is no saved credit-allocation ledger binding
   a particular attempt to a particular requirement. [ALLOC] [TRANSFER] [GRAPH]
6. **Degree-map guidance:** JSON maps and hardcoded browser filenames carry their
   own year, credit/semester totals, course codes and faculty note. CS CSV is 2025–2026,
   its selected map 2026–2027; the CSV common-core declared target is 12 while its
   candidate row credits sum to 14. The distinct declared group targets sum to 60
   while that map declares 63. These comparisons require rule/overlap adjudication;
   candidate sums alone are not an audit. They show drift potential, not which
   source is academically correct. [CSCSV] [MAP] [HARD]
7. **Special requirement:** BMCC writing-intensive status is a sessionStorage boolean
   and UI percent cap, not a rule backed by section-level evidence. [HARD] [PROGRESS]

## Course and program identity

Course identity is partly improved already: fresh tables use institution+code, and
`get_or_create_course` preserves legacy IDs and `CAMPUS::CODE` storage codes when
old global uniqueness remains. `display_code` hides compatibility details. However
null institution is allowed, publish-created placeholder courses can be unscoped,
and many public APIs resolve `Program.code` with `.first()` without a campus/year.
The selector's deduplication chooses a populated/latest ranked program; that is a
UI choice, not evidence of a student's catalog entitlement. [MODELS] [DDL] [SEED]
[REQ] [LOAD] [DRAFT] [SELECTOR]

V2 should use stable campus course/program identities plus immutable versions and
explicit enrollment catalog assignment. Display codes are not identity keys; source
and destination courses with equal codes must not match without reviewed evidence.
A course shared across releases must retain release-specific title/credits/rules.

## Transfer, AP/IB and student evidence

Transfer equivalents already have source/destination direction, minimum grade,
catalog-year range, status, source_reference and notes. Some source codes encode a
combination using `+`. The source CSV labels records approved and cites Transfer
Explorer; this audit did not independently verify those assertions. The matching
endpoint does not filter grade/year, and browser fallback code matching can still
mark target satisfaction when no approved mapping exists. “Field exists” and
“constraint enforced” must be separate audit statements. [EQ] [EQCSV] [EQAPI] [TRANSFER]

The AP CSV endpoint selects score columns and looks up credits for the first
alternative by legacy `catalog_code`; it returns an estimate and disclaimer. The
UI imports unambiguous AP results into the same code-based completion state.
No durable exam-attempt, accepted award, per-student substitution or verified IB
award object was found. Model original exam/college evidence separately from
institutional evaluation and target applicability in V2. [AP] [CHAT] [IMPORT]

Extracted transcripts can carry institution/grade fields, but selector import narrows
them into course-code completion sets; blank institution is treated permissively.
The main endpoint sends raw bytes to Gemini after MIME/size checks and returns a
reviewable JSON draft. There is no source-page/field lineage persisted through to
audit allocations. Student confirmation is not registrar verification. [EXTRACT] [IMPORT]

## Student/session state and retention

| Mechanism | Observed source use | Migration risk |
| --- | --- | --- |
| Signed session cookie | logged_in, shared-account username and global admin/tester role | Not an individual registered student profile or scoped advisor assignment |
| `cunyBeyondAnonymousDraftV1` localStorage | Intake profile, free text, exam/extracted rows, current program; sliding expiresAt | Client readable/tamperable; no fixed server expiry or comprehensive cleanup |
| sessionStorage contexts | selectedProgramContext, smartOnboardingContext, transferSnapshot | Context/schema drift between entrypoints |
| sessionStorage artifacts | imported courses, referral summary, degree-plan semesters, AI commentary and schedule checklist | Multiple writable copies; plan warnings and evidence status can be lost |
| JSON settings/logs | AI settings file; question/answer/IP/usage log; minimal delivery-event log | Secrets management and PII retention/access need redesign |
| CSV/JSON/static assets | Catalog rows, maps, source notes, hardcoded UI copy | Source governance and interface content mixed across files |

Evidence: [APP] [AUTH] [CHAT] [STATE] [AI] [REFERRAL]. The tracked log filename was
seen in the Git tree but its contents were not fetched. No live log endpoint was
called. The source log-read handler lacks a guard, an access-control concern whose
actual deployment exposure is unverified. [LOG]

## Provenance, constraints and authority gaps

Source URLs and review timestamps do exist in choice pools, career/CPL/transfer
resources, draft metadata and CSV/source notes. They are not uniformly missing.
Core Course/Prerequisite/RequirementGroup records lack immutable artifact hash,
source section/effective interval/reviewer grant and published release membership.
Catalog year alone is neither provenance nor an approval record. [MODELS] [GOV]

Declared FKs/unique pairs are useful, but no general checks enforce positive/ranged
credits, valid rule enums, same-campus relationship consistency, overlap capacity,
nonempty logic groups, verified grant authority or cycle-free prerequisite rules.
SQLite FK enforcement and installed production constraints were not tested.
Source-level admin checks are global and inconsistent; draft status transitions do
not enforce independent academic reviewers. [DB] [MODELS] [AUTH] [GOV] [DRAFT]

## Proposed V2 normalization and isolated schema mapping

This refines [DATA_MODEL.md](DATA_MODEL.md), not a migration implementation.
All future persistence remains in isolated `cuny_advisor_v2`, with dedicated V2 roles
and Alembic history; never attach the V1 engine or copy live records automatically.

| Ownership domain | Proposed canonical records | V1 treatment |
| --- | --- | --- |
| Approved academic catalog | Campus, Program/Course identity, immutable release-specific versions, typed Requirement/Rule AST, source artifact/section, reviewed equivalency versions | Reconcile CSV/JSON/rules into drafts; retain legacy source IDs only as provenance |
| Student academic history | Workspace, reported CourseAttempt/ExamAttempt, verification evidence, institutional TransferAward and scoped AcademicException | Do not import browser completion flags as verified credit; preserve grade/term/original institution and uncertainty |
| Advising and saved plans | Profile/RecordRevision, AuditRun/Allocation, PlanRevision/Validation, Session, immutable AdvisorReport/consent case | Replace copied mutable browser JSON with versioned scoped records; support fixed guest TTL and explicit conversion |
| CMS interface content | Approved block schema, versioned message keys/page composition, campus overrides | Extract editorial text, never prerequisites/credit arithmetic into CMS |
| Governance/audit | Scoped grants/delegation, verified author/approver identity, revision-bound proposals/decisions/publication and audit events | Preserve draft/version concept; replace global-admin self-approval and live visual academic overrides |

Represent requirement placeholders as requirement slots, not fabricated Course rows.
Distinguish planned candidate, allocated elective credit, concrete course selection,
term offering and registered section. Use exact decimal credits; retain repeat
attempts and grade scales; model choice/overlap policies explicitly. Normalize
combination transfer mappings into source/destination member sets and conditions,
not delimiter strings. Separate visual LayoutPreference from academic relationship
changes. A versioned derived graph projects approved rules; it is not another rule DB.

## Data migration acceptance (future only)

Every imported catalog assertion must have campus/program/release, original source
artifact and locator, reviewer and resolved conflict state. Reject missing scope,
placeholder-as-course, invalid references and unsupported logic before publication.
Validate same-code different-campus fixtures; preserve two historical releases and
replay their audits after correction. Compare all requirement allocations across
selector, progress, planner, transfer and report projections. Unknown grade/year,
exam/transfer approval or substitution authority produces unresolved outcomes.
No legacy student histories or logs should be carried over without separate
ownership, permission, purpose and retention review. Relative staging sequence is
in [V1_TO_V2_MIGRATION.md](V1_TO_V2_MIGRATION.md).

[DB]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/database.py#L1-L44

[APP]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L1-L171

[DDL]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/seed_database.py#L218-L285

[SEED]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/seed_database.py#L1388-L1530

[MODELS]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/models.py#L1-L570

[EQ]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/models.py#L33-L83

[PARSE]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/seed_database.py#L287-L315

[RELSEED]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/seed_database.py#L707-L770

[LOAD]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1775-L1931

[ALLOC]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2727-L3032

[PREREQCSV]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/course_prerequisites.csv#L1-L15

[CANON]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/seed_database.py#L1069-L1125

[GRAPH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/curriculum_graph_service.py#L47-L282

[GRAPHADMIN]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1984-L2103

[MAP]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/bmcc_cs_degree_map_2026_2027.json#L1-L46

[DRAFT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L733-L1407

[TRANSFER]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/transfer_analysis.html#L636-L840

[CSCSV]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/cs_courses.csv#L1-L31

[HARD]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L1874-L2033

[PROGRESS]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4697-L4804

[REQ]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L2112-L2206

[SELECTOR]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/program_selector_logic.py#L1-L57

[EQCSV]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/docs/course_equivalencies.csv#L1-L10

[EQAPI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L1423-L1451

[AP]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L471-L505

[CHAT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/cuny_beyond.js#L1-L845

[IMPORT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L2488-L2558

[EXTRACT]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L376-L445

[AUTH]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/auth.py#L1-L47

[STATE]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/frontend/db_progress_graph.html#L4313-L4445

[AI]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L901-L980

[REFERRAL]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L526-L684

[LOG]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/faq_fallback_api.py#L982-L1015

[GOV]: https://github.com/dmitrivanov/academic-advisement-system/blob/ba499bc078a4889ed7ed4ad2f381a5c6950753d3/api_db_routes.py#L199-L359
