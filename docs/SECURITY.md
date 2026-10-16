# Security and student data lifecycles

Phase 00 second-prompt design, 2026-10-16. Controls are planned, not implemented
or compliance-certified. No CUNY data-processing approval has been established.
See [access control](ACCESS_CONTROL.md) for authority and [decisions](DECISIONS.md)
for requirements versus proposed operating targets.

## Identity and sessions

Initial registered authentication uses email/password; SSO is future work. Use a
maintained password hashing implementation with Argon2id, independently generated
salts, verified email ownership, generic login/reset responses, expiring single-use
reset tokens stored as hashes, session invalidation after password reset, throttling,
and secure HTTP-only cookies. Apply CSRF defense to state changes, including guest
changes. Require MFA and recent authentication for privileged grants, publication,
and authority changes. Exact parameters and identity library require implementation
review; no credentials or secrets are created in this phase.

A guest receives a cryptographically random opaque server-side workspace capability
through a secure cookie. Persist only a hash of its secret. Workspace IDs alone
confer no access. Guest authorization is an authenticated temporary session without
an account; expiry is fixed at creation plus 24 hours and is never extended by
activity, uploads, jobs, handoff, or attempted conversion. Lost guest access is
not recoverable through a guessable URL or an unverified email claim.

## Data lifecycle

The 24-hour guest limit is a user requirement. Cleanup targets below are proposed
engineering commitments to validate before launch. Retention of registered data
and consented handoffs remains subject to an approved, disclosed policy.

| Data/state | Allowed use | Expiry/deletion behavior |
| --- | --- | --- |
| Active guest workspace | Temporary profile, chat, progress, plans, reports, private transcript review and summary | Access stops exactly at creation + 24h, including API, streams, downloads and workers |
| Expired guest workspace | Deletion tasks only | Cancel jobs; invalidate credentials, caches and storage access; purge primary records/files/derivatives within 1h target; retry and alert on failure |
| Guest raw transcript | Quarantined scan and isolated extraction; never public | Delete as soon as review no longer needs it, on explicit delete, or with workspace expiry, whichever is first |
| Guest-derived content | Extracted fields, previews, chat, audit/plan/report snapshots | Same workspace deadline; no permanent copy through reports, queues, telemetry or analytics |
| Registered workspace | Save and resume profiles, records, progress, plans and reports across sessions | No guest TTL; user controls deletion; inactivity and retention durations must be approved/disclosed before real-data rollout |
| Registered raw transcript | Private processing and review | Shortest approved review window; saving extracted coursework does not require indefinite raw-file retention |
| Consented advisor handoff | Selected summary snapshot and explicitly selected attachments, recipient and purpose | Separate disclosed retention/access deadline recorded at consent; pending handoff expires no later than the guest workspace |
| Security/audit metadata | Minimal event records, no transcript/chat content | Approved limited schedule; avoid storing guest identity or reusable capability |
| Backups | Recovery only, never ordinary retrieval | Exclude guest payloads from long-retention backups; approved short-lived copies/replicas must support guest erasure or equivalent per-workspace cryptographic erasure |

Expiry enforcement is synchronous authorization, independent of cleanup job health.
Deletion is idempotent and covers storage versions, extraction scratch files,
indexes, caches, pending job payloads, and exports. Workers check expiry before
reading, each costly step, and finalization; a tombstone prevents late writes from
recreating erased content. Restore procedures replay deletion markers before
serving data. Temporary storage and infrastructure must demonstrate the advertised
guest cleanup semantics before guest uploads are enabled.

## Guest-to-registered conversion

1. Require possession of the active guest session and authentication to a
   verified-email account. Verification does not pause the guest clock.
2. Show selected profile, coursework, plans, reports, and optional transcript files
   to retain, existing-account conflicts, and the registered retention notice.
3. Obtain explicit save/merge intent; do not link by matching email or transcript name.
4. Lock the workspace and check expiry, destination ownership, expected revisions,
   and idempotency. Atomically claim selected data for the account; revoke the guest
   capability on success. Failed/expired conversion grants no ownership.
5. Preserve evidence status and catalog versions. For external storage, use a durable
   move manifest: only successfully claimed selected objects gain account access;
   original aliases are revoked and abandoned/unselected objects are cleaned up.

Concurrent conversions can have one winner only. Do not duplicate awards or silently
overwrite an existing profile. A completed authorized conversion removes the guest
TTL only from explicitly retained account data; unselected data keeps its original
deadline. Conversion does not create or extend advisor consent.

## Guest summary and advisor handoff

Allow an English summary preview and download while the workspace is active.
It includes student-reported provenance, academic context, plan and unresolved
issues, with sensitive details minimized. Download is not an advisor handoff.

Handoff is optional and never bundled with upload or registration. Show the verified
advisor/queue recipient and college, exact summary revision, selected fields and
attachments, purpose, retention deadline, access expiry, and revocation limits.
Unchecked transcript attachment is excluded. Require affirmative explicit consent
and record its version, scope, timestamp and session/account evidence. Email/contact
sharing is separately selected; identity verification is not implied by consent.

Proposed handoff state: draft → consented/pending → accepted → closed, with revoked
and expired terminal alternatives. Pending payload stays in the guest workspace.
Recipient acceptance before expiry rechecks active consent, recipient grants and
workspace validity, then creates a minimal independent advising-case snapshot.
Only that explicitly consented snapshot may outlive the guest workspace under its
disclosed case retention policy. If this policy or recipient validation is absent,
handoff remains disabled; no implicit indefinite retention is allowed.

Revocation blocks new retrieval and invalidates application-served downloads and
pending delivery. Explain that an already downloaded copy cannot be recalled and
that any separately justified retained case evidence follows the disclosed policy.
No public bearer-link handoff or automatic transcript emailing. Route internally
to an authorized case queue; any future notifications contain no student payload.

## Upload, processing and AI safeguards

Guest and registered uploads use identical safety controls: private encrypted
storage, type/signature and page/size checks, quarantine, malware scanning,
non-networked resource-limited parsing, inaccessible scratch paths, and field-level
review. Downloads pass through an authorization proxy so expiry and revocation
can terminate access; a long-lived object URL must not bypass these checks.
Uploading a transcript does not prove academic correctness or identity.

Guest data is not public or less sensitive. AI receives minimized reviewed text
only through the Gateway after approved provider arrangements and a clear processing
notice. Never send raw transcripts by default. Guest expiry also governs retained
provider artifacts; disable providers/features whose retention cannot meet the
promised lifecycle. Protect per-workspace budgets with layered IP/device/session
abuse throttles and accessible challenges; new guest sessions cannot bypass the
global/campus spend ceiling.

## Threats and verification

Test stolen/guessed identifiers, CSRF, account enumeration, conversion fixation,
expired-session replay, campus/program escalation, self-approval, stale delegations,
malicious uploads, XSS in CMS and documents, prompt injection, cache leakage,
concurrent expiry/conversion/handoff, and post-deletion worker writes.
Require TLS, storage encryption, least-privilege services, redacted telemetry,
scoped retrieval, and authorized streaming. No transcript/PII in CMS or ordinary logs.

Production-like readiness additionally requires tested deletion/restore behavior,
an incident owner and response plan, privileged access review, dependency review,
and approval of retention, hosting and provider arrangements. Phase 01 tests use
synthetic payloads and disposable local resources only after authorization.
