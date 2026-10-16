# Logical data model

Status: target logical model, 2026-10-16. Phase 02A implements a bounded subset as
frozen in-memory Pydantic contracts; no SQL, ORM classes, migrations or database
connections. See [PRD](PRD.md) for evidence and assumptions.

## Implemented Phase 02A subset

Campus-scoped CourseIdentity/ProgramIdentity, release-bound CourseVersion,
shared Category vocabulary, Requirement, Rule/typed expression union, Source and
DeclaredTotal are implemented under `backend/app/academic/contracts.py`.
EvaluationInput/Completion/Allocation and Snapshot retain synthetic revision-bound
inputs, exact decimal credits, source-linked per-rule results and explicit issues.
ExceptionProposal represents an unapplied request; release lifecycle state is not
an implemented publication/approval workflow. No student or authorization model
is implemented. [ACADEMIC_RULES_MODEL.md](ACADEMIC_RULES_MODEL.md) defines the
supported subset and conservative unsupported states; the entity inventory below
remains the future normalized persistence design.

## Conventions and isolation

Use opaque IDs, UTC timestamps, explicit status, creator, and revision metadata.
Academic credits and GPA use exact decimal representations, never binary floats.
Academic terms have campus-owned ordering and dates; course codes are display
values, never global identifiers. Distinguish record time from policy effective
time. Effective intervals use a consistent inclusive-start/exclusive-end convention.

Every campus-scoped entity carries `campus_id`. Parent references must enforce
matching campus through composite constraints, not application convention alone.
Cross-campus transfer relationships explicitly identify source and destination;
they require an authorized evaluation scope and must not bypass student grants.
Public catalog data and private student evidence have separate access policies.

## Entity inventory

| Entity | Essential attributes and relationships |
| --- | --- |
| Institution / Campus | Institution identity; stable campus code, name, timezone, enabled capabilities. Institution has many campuses. |
| User / ExternalIdentity | Internal identity mapped to approved provider subject; avoid using email as immutable identity. |
| Membership / AccessGrant | User, campus, role, permitted action/scope, validity, issuer; advisor-student assignment is explicit and revocable. |
| Student / EnrollmentContext | Student identity separated from campus program enrollment; one student may have several historical or active contexts. |
| ProfileRevision | Enrollment context, prior revision, goals, availability, modality, desired workload, optional support preferences, provenance and confirmation per field. |
| Program / ProgramVersion | Stable campus program ID; release-specific credential, title, track, requirements root, effective period. |
| CatalogRelease | Campus, catalog label, revision, effective period, publication state, reviewer, publication time, superseded release. |
| SourceArtifact / SourceSection | URL or private evidence reference, publisher, retrieved time, content hash, section/page, applicable period, review status. |
| Course / CourseVersion | Campus-local stable identity; release-specific code, title, credit range, grading basis, prerequisites, co-requisites, restrictions, source links. |
| RuleNode / RuleSource | Release-scoped typed expression, children, parameters, precedence, source sections and reviewer. No executable free-text policy. |
| CatalogAssignment | Enrollment context, program version, applicable release, assignment basis, reviewer, validity and revision; never silently choose newest. |
| AcademicRecordRevision / CourseAttempt | Student context, revision and source; original institution, course identity or unresolved label, term, grade, credit, attempt status, verification state. Retain every repeat. |
| GradePolicy / RepeatPolicy | Release-scoped normalization and counting policy backed by reviewed sources; unknown values remain unresolved. |
| TransferEquivalency | Source and destination campuses/courses or groups, mapping type, effective dates, minimum conditions, evidence, review and release status. |
| TransferCase / TransferAward | Student-specific evaluation case and destination context; awarded credit only after authorized decision; link original attempts and prevent duplicate awards. |
| AcademicException | Student/context, specific requirement, permitted effect, approving authority, reason, evidence, expiry and revocation. An advisor note alone is not an exception. |
| Term / CourseOffering / Section | Campus term; offering freshness, source and confirmation; optional section modality, meeting times and status. Catalog existence does not imply a term offering. |
| AuditRun / RequirementResult / CreditAllocation | Frozen inputs, engine version, mode, result tree, rule evidence, explicit allocations, unresolved reasons and content hash. |
| Plan / PlanRevision / PlannedCourse | Owner/context, target terms, goals, constraints, selected alternatives, source audit, validation run and revision. |
| Document / ImportJob / ExtractedField | Private storage reference, checksum, scan state, retention deadline; extraction version, page/row provenance, confidence and review decision. |
| Conversation / Message / ActionProposal | Owner and context, minimized messages, cited evidence, proposed structured change, confirmation and execution outcome. |
| AdvisorReport / ReportRevision | Access scope, student, frozen audit/plan/profile inputs, outstanding issues, reviewer and report artifact hash. |
| ModelInvocation / BudgetLedger | Actor scope, request ID, model/prompt versions, token counts, estimated/reserved/actual cost, status; no raw sensitive prompt by default. |
| Job / AuditEvent | Scoped durable work, lease/retries/idempotency; append-only security and academic-action metadata with retention policy. |

## Relationships and immutable snapshots

A campus has many releases; a release binds program versions, course versions,
rule trees, and source evidence. A student has multiple enrollment contexts,
each with catalog assignment and profile history. Course attempts retain original
institution identity and connect to reviewed destination awards separately.

An AuditRun references exact record, profile, catalog-assignment, exception-set,
catalog-release, and engine versions. Store normalized input snapshots or durable
version references plus canonical hashes; hashes alone cannot reproduce results.
Requirement results reference rule IDs and evidence. Credit allocations identify
attempt/award, credit quantity, and requirement. Reports and plans reference audit
runs rather than recomputing invisibly at read time.

Catalog and audit immutability does not mean permanent retention of identifiable
student data. Define private evidence erasure, de-identification, backup expiry,
and authorized retention exceptions before real-data use. A historical snapshot
whose private inputs were lawfully removed must be marked non-replayable.

## Rule representation

Proposed operators: all-of, any-of, choose-N, minimum-credits, minimum-grade,
minimum-GPA, residency, prerequisite, co-requisite, standing, and explicit exclusions.
Version the expression schema and semantics. Validate parameter types, dangling
references, unsupported operators, cycles, and contradictory constraints before
publication. Cross-listed/equivalent groups have explicit counting policies.

Each requirement evaluates as met, unmet, conditional, or unresolved. Conditional
means a named future condition such as passing an in-progress prerequisite;
unresolved means missing evidence or unsupported policy. Keep these separate from
import verification status and from whether a report has been advisor-reviewed.

## Invariants and state transitions

- Release lifecycle: draft → in-review → published → superseded or withdrawn.
  Review rejection returns a draft. Published content is immutable; corrections
  create a new release, and withdrawn releases remain inspectable.
- Import lifecycle: uploaded → quarantined → scan-approved → extracted →
  needs-review → confirmed → incorporated. Any unsafe or unsupported file is
  rejected; failures can retry safely before incorporation. Confirmation and
  incorporation are separate audited operations.
- Extraction never overwrites student history. Deduplication keys use document
  hash plus reviewed institution/course/term/attempt evidence; ambiguous duplicates
  require review because legitimate repeated attempts can look similar.
- A student-confirmed transcript entry remains student-reported unless an
  authorized evidence process verifies it. Source confidence is not authority.
- Credit consumed across requirements cannot exceed eligible earned credit except
  where an explicit overlap policy permits it. Transfer awards and original
  attempts cannot both generate the same destination credit.
- Equivalencies are directional, effective-dated, and conditional. One-to-many
  and many-to-one mappings require group completeness; reverse equivalence and
  transitivity are never implicit.
- Approved exceptions apply only within scope and validity; revoked exceptions
  invalidate future use and mark dependent plans stale without rewriting history.
- Plan lifecycle: draft → validated → student-confirmed → advisor-reviewed,
  with stale and superseded markers. None of these statuses means registered.
- Job finalization, record incorporation, and budget charging are transactional
  and idempotent. Optimistic revisions prevent lost updates.

## Query and retention plan

Index campus and owner/context with status, term, and revision for ordinary
queries; index rule-release references, equivalency direction/effective dates,
source hashes, job leases, and budget periods. Enforce unique external identity,
release revisions, operation idempotency keys, and attempt/award allocations.

Use PostgreSQL full-text retrieval first; evaluate vector retrieval only if a
curated benchmark demonstrates material benefit. Any index entry carries source,
campus, release, access policy and content hash. Invalidation follows source
withdrawal, access revocation, and deletion.

Registered and accepted-handoff retention durations remain an institutional decision.
Guest workspaces have the fixed 24-hour lifecycle specified in [security](SECURITY.md). Propose shortest practical
raw-upload retention, separate export expiry, minimized chat retention, and a
documented deletion job for primary storage and derived artifacts. Backup expiry
and audit retention must be reconciled with approved institutional obligations.

## Guest, governance and CMS model extensions

The entities above remain the academic domain. Add a Workspace ownership boundary
around private context data so guests do not require fabricated permanent Student
accounts. Student/EnrollmentContext may be provisional workspace-local records;
registration establishes ownership, not institutional enrollment verification.

| Entity | Required relationships and invariants |
| --- | --- |
| AccountCredential / VerificationToken / Session | User-bound password hash, verified-email state, hashed expiring single-use tokens, session revocation; future external identity linking requires verified account ownership. |
| Workspace / GuestSession | Campus/context, either account owner or guest owner, created time, fixed guest expiry, state and deletion marker; never both permanent and guest access after conversion. |
| Conversion / ConversionItem | Source workspace, authenticated destination, selected-data manifest, expected revision, idempotency key and outcome; one successful claim only. Unselected data retains guest expiry. |
| Department / ProgramScope / SectionAssignment | Campus-constrained hierarchy and verified faculty assignment with evidence and validity. |
| RoleBinding / Delegation | Role/action set, scope, issuer, evidence, parent grant, delegable subset, validity and revocation. No self-escalation or cyclic chains. |
| AuthorityVerification | Reviewer/faculty identity, independently verified affiliation/academic subject, evidence reference, verifier and expiry; role label alone is insufficient. |
| ChangeProposal / ApprovalDecision | Content category, author, target scope, source evidence, effective dates, immutable revision hash, required reviews and decision rationale; no author self-approval. |
| FacultyContribution | Separate syllabus/section provenance, verified author, section/term, review state and publication revision; not a CourseVersion or RuleNode override. |
| Consent / HandoffRequest / AdvisingCaseSnapshot | Exact payload revision, recipient, purpose, consent notice version, selected attachments, retention/access deadline and revocation. Accepted case is separate from temporary workspace data. |
| CMSPage / BlockDefinition / CMSRevision | Approved block schema/version, typed content, stable ordered block IDs, author, exact review hash and parent revision. |
| CMSOverride / Publication | Campus/program scope, base revision, allowed override fields, effective composition IDs, reviewer and publish/withdraw event; rollback creates a revision. |
| DeletionTask / Tombstone | Workspace/object graph, expiry, retries, cleanup proof and minimal non-content deletion marker; prevents resurrection by jobs/restores. |

Profile revisions, attempts, imports, conversations, audits, plans, reports, jobs,
model invocations and private cache keys must carry workspace ownership, not just
student ID. Exact workspace identity prevents collision across guest/account contexts.
Guest-to-account conversion preserves original source verification and academic
snapshot versions. Model spend keys include the guest session plus layered abuse
controls; the global/campus ledger is shared across guest and account usage.

Separate public catalog/CMS revisions from private student data in access policy,
storage and retention. Guest cleanup includes all derived snapshots, not just the
workspace row. Accepted consented case snapshots have their own access/retention
policy; neither an approval event nor a report hash permits indefinite PII storage.
All future tables and Alembic metadata target the isolated `cuny_advisor_v2` schema;
no SQL or database connection is introduced by this model.
