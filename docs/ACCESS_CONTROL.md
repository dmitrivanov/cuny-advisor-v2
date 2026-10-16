# Access control and academic governance

Phase 00, second-prompt baseline, 2026-10-16. This is a product authorization
design, not a statement of CUNY appointments or approval. Actual academic reviewers
and the process for validating their authority remain unconfirmed.

## Policy model

Use deny-by-default scoped roles plus explicit action grants. A role binding includes
principal, campus, optional department/program/section, actions, issuer, authority
evidence, start/end dates, delegation parent, and revocation state. Resource ownership,
workspace expiry, consent, and workflow state are additional conditions. Roles do
not form an automatic hierarchy: platform administration does not imply academic
approval or access to student records. A person may hold several separately verified
roles; separation-of-duty rules still apply across those roles.

Evaluate authorization in FastAPI application services for every request, tool,
download, stream, and worker operation. Use scoped PostgreSQL RLS as a second
boundary with transaction-local context and non-bypass application roles. Derive
identity and scope from the session and verified grants, never model arguments.

## Role/permission matrix

Every permission below is limited to an active binding's scope. “Separate grant”
means the listed role alone does not confer that permission.

| Role | Access/configuration | Propose content | Approve academic changes | Publish | Private student data |
| --- | --- | --- | --- | --- | --- |
| Platform Super Admin | Platform settings, campus provisioning, suspend/revoke access; record verified authority designations | Platform CMS drafts | Separate verified Academic Approver grant only | Separate Publisher grant only | No default access |
| College Admin | Delegated college configuration and non-academic role management | College requirements, prerequisites, course changes; campus CMS overrides | Separate verified Academic Approver grant only | Separate Publisher grant only | No default access |
| Department / Program Admin | Delegated department/program configuration and contributor grants | Requirements, prerequisites, course changes in scope | Separate verified Academic Approver grant only | Separate Publisher grant only | No default access |
| Faculty Contributor | Own verified affiliation and assigned section context | Syllabus and section information; corrections as proposals | No | No | No roster/transcript access from this role |
| Content Editor / Publisher | Approved CMS editing scope; editor and publisher capabilities independently assigned | CMS blocks, ordering, contextual text | No academic authority from this role | Publisher capability only, after required reviews | No default access |
| Academic Approver | Review queue in explicitly verified subject scope | Review comments; may propose separately | Yes within authorized subject scope; never own proposal | Separate Publisher grant only | Only evidence needed for assigned approval; student cases need a separate case grant |
| Human Advisor | Assigned advising cases | Notes, plans, handoff responses, exception requests | Separate verified exception/transfer approval grant only | No catalog/CMS publication | Assigned student or consented handoff payload only |
| Registered Student | Own account and saved workspaces | Own profile, records, plans and reports; corrections remain reported evidence | No | No | Own data and explicitly chosen handoff scope |
| Guest | Own unexpired 24-hour workspace | Temporary profile, records, plans, transcript review, summary | No | No | Own temporary data and handoff preview |

Editors can preview but cannot publish without the publisher capability. Publisher
authority does not include academic approval. Admins may propose academic edits but
must never directly patch a published catalog. Student/guest consent grants no
academic status or verification of their submitted records.

## Delegation and verification

Platform staff record academic authority only after evidence from an independently
validated college authority-designation process. Until that process is confirmed,
real academic approval remains blocked. A Super Admin cannot self-designate academic
authority based on the platform title. Demo grants are synthetic and clearly labeled.

An issuer may delegate only actions explicitly marked delegable within their own
scope and remaining validity. College scope can narrow to department/program; it
cannot expand to another campus. Academic approval delegation additionally requires
recorded authority to delegate that specific academic subject. Record issuer,
recipient, evidence, reason, duration and parent grant. Prevent self-escalation,
cycles, stale-parent use, and delegation beyond the parent expiry. Revoking a parent
invalidates descendants and pending actions at their next access check.

Verify faculty identity and current affiliation through an approved independent
process before enabling submissions. Email verification alone does not prove
faculty status. Record section/program assignment and validity; identity verification
does not make faculty contributions official academic policy.

## Approval workflows

### Official academic changes

College/department admin proposal → completeness/source review → authorized Academic
Approver decision → approved immutable revision → authorized Publisher release.
Cover requirements, prerequisites, course information, and equivalencies. Require
source sections, campus/program, effective dates, rule diff, impacted audits/plans,
and fixture results. Author and Academic Approver must be distinct people. A publisher
may also hold an approver grant, but cannot approve their own authored revision.
Publication checks the exact approved hash and current grants. Any material edit
invalidates approval; rejection returns a new draft with reasons.

Academic approval validates faithful representation of authorized policy; it does
not authorize changing college policy itself. Conflicting or absent official
evidence stays unresolved pending the actual academic authority's decision.

### Faculty contributions

Verified faculty draft → section/affiliation check → content/safety review →
authorized academic review for syllabus or section academic assertions → publication
in the faculty-contribution layer. Administrative editorial review can cover purely
presentational corrections. Any statement affecting requirements or eligibility
must enter the official academic workflow; a faculty contribution never overrides
the catalog. Display author, scope, source category, term, review date and status.

### CMS and student cases

Ordinary CMS copy follows editor draft → independent editorial review → Publisher.
Academic statements additionally require the official workflow or a reference to
an already approved exact academic revision. See [CMS design](CMS_DESIGN.md).
Transfer awards and exceptions require specific verified academic case authority;
Human Advisor status alone is insufficient. Consent-based handoff authorizes only
advising access and cannot bypass those approval requirements.

## Revocation, audit and safety

Record grant changes, review decisions, publication, withdrawal, rollback, and
student-data access with actor, scope, time, reason, revision hash and correlation ID.
Keep private payloads out of general audit events. Revalidate approver authority
at approval and publication; expired/revoked grants require renewed review of
pending releases. Historical decisions remain traceable. A security suspension may
hide content immediately but cannot create replacement academic truth.

No default impersonation or universal student-data browser. Any future emergency
access requires a separately designed, time-limited, reasoned and audited process;
it is not a capability silently inherited by Super Admin.
