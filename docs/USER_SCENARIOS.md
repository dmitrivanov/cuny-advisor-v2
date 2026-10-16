# User scenarios and acceptance criteria

Status: proposed, 2026-10-16. All students, courses, institutions beyond the named
campuses, and policy values in future fixtures must be synthetic until validated.
These scenarios specify behavior; they do not assert actual BMCC requirements.
Requirement IDs reference the [PRD](PRD.md).

## S1 — New student builds a realistic profile (R1, R2)

Given a student selects BMCC and an intended program, when they describe work
hours, interests, modality, and a desired course load in chat, the system previews
structured profile fields and asks only for missing academic context. Confirmation
creates a revision with student-reported provenance. A structured form provides
the same workflow. Declining optional support questions does not block advising.
If the catalog assignment is unknown, no definitive audit is produced.

## S2 — Continuing student checks degree progress (R3, R4)

Given a confirmed context and reviewed coursework, when the student asks what
remains, the system returns a reproducible requirement tree, credit allocations,
excluded attempts, and cited sources. In-progress courses appear separately from
earned credit. Running the same frozen inputs without Gemini returns the same
academic outcome. Unknown grades or unsupported rules produce unresolved nodes,
and the UI explains which conclusions remain supported.

## S3 — Working student plans next semester (R2, R5)

Given a preferred workload, evening availability, and an audit, when the student
asks for a semester plan, the system offers valid alternatives and explains
tradeoffs. Hard prerequisites and co-requisites remain enforced. If section data
is missing, label scheduling feasibility unverified. If no feasible option fits,
show conflicting constraints and ask which preference may change. Confirming a
draft saves it; no enrollment occurs.

## S4 — Returning student has repeats and older catalogs (R3, R4)

Given multiple attempts and an uncertain catalog entitlement, when the student
requests an audit, preserve all attempts and request catalog-assignment review.
After approved assignment, apply that release's repeat and grade policies with
traceable allocations. Do not default to the newest catalog or count repeated
credit twice. A hypothetical newer-catalog comparison is labeled separately.

## S5 — Transcript import contains ambiguous evidence (R6)

Given an authorized synthetic PDF upload, when processing finishes, show extracted
institution, terms, courses, grades, credits, source pages, and review flags.
The student corrects ambiguous fields and confirms entries before incorporation.
Confirmation does not elevate student-reported evidence to institutional verification.
Re-uploading the same document cannot duplicate credit; a legitimate repeat remains
representable. Unsafe files are rejected; failed extraction offers manual entry.

## S6 — Transfer-in credit needs an institutional decision (R4, R7)

Given a source course and a dated destination equivalency, when a student compares
BMCC applicability, show the mapping conditions and destination requirement use
separately. Missing, expired, or unreviewed mappings create pending evaluations.
AI cannot approve an award. An authorized transfer reviewer may record a scoped
decision with evidence, triggering a new audit rather than overwriting the old one.

## S7 — Transfer-out or major-change exploration (R5, R7, R9)

Given a BMCC context, when the student selects a hypothetical destination or major,
create an isolated comparison with explicit program and catalog versions. Show
reusable credits, unmet requirements, unknown equivalencies, and evidence freshness.
Do not infer reverse/transitive equivalence or guarantee admission or time to degree.
The current declared context and saved plan change only after a separate confirmed
action; destination private records remain inaccessible.

## S8 — Advisor prepares a report and reviews an exception (R8)

Given an active assignment, when the advisor opens a student workspace, show
profile provenance, audit evidence, student constraints, unresolved issues, and
plan revision. Generate an immutable report snapshot with scoped access and
review status. An advisor note does not waive a requirement. Only an authorized
exception workflow with scope and evidence changes the next audit. Revoking the
advisor assignment immediately blocks future report retrieval and download links.

## S9 — Steward corrects a catalog (R3)

Given a draft source correction, when a steward proposes new rules, display the
release diff and affected golden cases. A distinct authorized reviewer approves
publication. A source conflict blocks affected rules. Existing audits retain their
original evidence; affected current plans become stale and offer recomputation.
Withdrawing an erroneous release blocks new use without deleting history.

## S10 — Second campus and malicious requests (R9, R10)

Given two campuses using the same course code, when a student searches or asks
the model to switch identity, retrieval uses the authorized campus and release.
Direct API access, guessed IDs, altered tool arguments, background jobs, private
caches, report exports, and streams cannot disclose another student's records.
A transfer comparison may read approved public destination policy without granting
access to private destination records. Denials produce safe, audited errors.

## S11 — Gemini fails or exhausts its budget (R1, R10)

Given saved records and a valid catalog, when Gemini times out, returns invalid
claims, or reaches a spend cap, structured profile editing, deterministic audits,
manual planning, and report snapshots remain available. Show a template explanation
and retry guidance where appropriate. No hidden retries exceed the reservation,
and no unapproved provider receives student information.

## S12 — Concurrent edits, accessibility, and deletion (R2, R8, R10)

Given an advisor and student edit the same plan, stale revision submission produces
a comparison/review conflict rather than lost work. All primary actions work by
keyboard and screen reader with announced progress and errors. Given an authorized
deletion request, the system follows approved retention rules across documents,
messages, exports, caches, and eventual backup expiry; retained evidence exceptions
are documented without implying indefinite retention is mandatory.

## Future validation evidence

For each scenario, retain the synthetic fixture IDs, catalog/engine/prompt versions,
expected academic state, access scope, actual result, and reviewer disposition.
S2–S7 require academic review; S8–S12 require access/security and operational review.
Human UX testing must include students with constrained schedules and assistive
technology users. Phase 00 defines these checks but does not claim they passed.

## S13 — Guest workspace expires (R6, R11)

Given a guest started at a known time and uploaded a synthetic transcript, at
creation + 24h the session, profile, file download, report, stream and in-flight
job finalization all deny access even if cleanup is delayed. Cleanup removes all
primary and derived guest content within the proposed 1h target, reports failures,
and prevents stale workers/restores from resurrecting content. Activity never
extends the TTL. Before expiry, guests see their deadline and save/summary options.

## S14 — Secure registration and save/resume (R11, R12)

Given a guest selects data to retain, registration and verified email alone do not
claim it. Authenticated account ownership plus the active guest session and explicit
merge confirmation are required. Concurrent attempts yield one owner; expired
conversion fails. Success revokes guest access, preserves source verification and
versions, and lets the account resume selected profiles, plans, progress and reports
in a later session. Unselected data expires on the original clock. Reset-token
replay and name/email matching cannot grant access to another workspace.

## S15 — Guest summary and explicit advisor consent (R8, R13)

Given an active guest, summary preview shows provenance and unresolved questions.
Downloading it shares nothing with an advisor. Handoff separately identifies an
authorized recipient, exact payload, purpose, retention deadline and optional
attachments. No raw transcript is included by default. Acceptance rechecks grants
and active consent before expiry; only the consented case snapshot may then outlive
the workspace. Revocation blocks future access; already downloaded copies cannot
be recalled. An unaccepted handoff expires with the guest and never extends access.

## S16 — Delegated governance and faculty contribution (R3, R14)

Given a College Admin proposes a prerequisite change, a distinct Academic Approver
must have verified authority for that campus and subject. Super Admin status alone
cannot approve it. Narrow delegated department authority cannot publish for another
program, approve its own proposal, or survive parent revocation. Editing an approved
revision invalidates its approval. Faculty identity verification enables scoped
syllabus/section proposals only; reviewed publication stays visibly separate from
official requirements and cannot change deterministic audit outcomes.

## S17 — CMS override, preview and rollback (R15)

Given approved block types, an editor can reorder by drag/drop or keyboard and preview
a draft privately. Another campus cannot see that draft. Publication requires proper
review and Publisher capability; academic assertions also require academic authority.
Campus overrides cannot remove protected notices or rewrite catalog policy. Unsafe
HTML/code and stale base revisions are rejected. Rollback creates a reviewed new
revision with an audit trail and cannot revive withdrawn academic content.

## S18 — English-only and guest AI fallback (R1, R10, R16)

Given an English-only release, guest/student UI, CMS, summaries and reports are
English; unsupported-language input receives an English limitation message.
A guest can use structured advising during AI outage until workspace expiry.
Provider work cannot retain or reveal expired guest data. New guest-session creation
cannot bypass shared campus/global spend caps.

S13–S18 extend the future evidence matrix with expiry timestamps, conversion and
consent revisions, delegation-chain state, approved content hashes and cleanup
proof. These are acceptance specifications, not executed tests or CUNY approvals.
