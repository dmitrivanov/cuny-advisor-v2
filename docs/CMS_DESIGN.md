# CMS design

Phase 00 second-prompt baseline, 2026-10-16. Proposed internal CMS module inside
FastAPI, with Next.js editing and preview UI. No vendor, code, or service is created.
Permissions and academic authority follow [ACCESS_CONTROL.md](ACCESS_CONTROL.md).

## Approved blocks

Pages consist of schema-validated approved blocks: headings, constrained rich text,
links, notices, FAQs, resource cards, contact cards, advising entry points and
read-only references to published catalog/program information. Each block type has
a versioned schema, allowed fields, length limits, accessibility requirements,
and registered renderer. Adding a new type requires a reviewed implementation in
a separately authorized development phase; editors cannot upload code.

Drag-and-drop ordering changes an ordered list of stable block IDs. Provide keyboard
move controls and an equivalent list editor with announced position changes.
Validate the complete page server-side, including duplicate IDs, allowed nesting,
heading structure, link destinations, scope and block limits.

No arbitrary HTML, scripts, styles, embedded executable content, template expressions,
or user-supplied components. Store constrained rich text as a typed document tree,
sanitize at ingestion and rendering, and escape text output. Allowlist safe URL
schemes and approved media origins; prevent script/data URLs, unsafe iframes and
server-side remote-fetch abuse. Content Security Policy supplements these controls.

## Content layers and campus overrides

Keep platform defaults, campus overrides, and program-specific content distinct.
Overrides reference stable page/block keys and a base revision. A campus may reorder,
replace, hide or add blocks only where the template explicitly allows it. Safety,
privacy/consent and academic-provenance notices are protected from being removed
or weakened through CMS configuration. Profile data and transcripts never belong
in CMS content or public page caches.

Resolve published content deterministically: program override → campus override →
platform default for allowed fields. Pin the effective composition to exact source
revision IDs. Upstream changes create an impact review rather than silently changing
a published campus composition. Missing/conflicting references block publication.
An override cannot modify a catalog rule or confer academic authority.

Official catalog content uses read-only references to an approved release. Faculty
syllabi/section contributions use a separate record type and visibly labeled panel
with author verification state, term, review status and provenance. Never merge
faculty text into the official rule tree or present it as an authoritative catalog.
Conflicting claims are flagged for review and excluded from eligibility calculations.

## Draft, preview, approve, publish

Draft → in-review → approved → published → superseded/withdrawn. Rejecting review
creates a revision requiring correction. Preview uses the exact prospective campus
composition, role policy, block schema and academic references. It is authenticated,
non-indexable, privately cached or uncached, and cannot leak through a public URL.

Store author, parent revision, composition, block schemas, reviewer, approvals,
hash and timestamps. Ordinary presentation changes need independent editorial
review; academic claims additionally require authorized academic review as specified
in access control. Prefer catalog-reference blocks over retyping policy. A syllabus
is published only after faculty identity and required contribution reviews pass.

Publishing is a distinct Publisher capability. Recheck current scope, immutable
approved content hash, complete reviews, valid references and revision conflicts
at publication. Changed content invalidates approvals. Publication atomically updates
the effective revision pointer and schedules idempotent public-cache invalidation;
until invalidation finishes, never serve a withdrawn unsafe revision.

## Revisions and rollback

Revision history and audit events retain diffs, provenance, reviewer decisions,
publish/withdraw reasons and affected campus scope. Rollback creates a new revision
from an earlier approved composition; it never deletes history or bypasses current
permissions, schema checks, protected blocks, or academic effective dates. Old
approvals are not automatically valid for a new composition or withdrawn source.
Re-review academic content where applicability or evidence changed.

CMS rollback cannot roll back an academic catalog release. That is a separate
source-backed academic change with impact analysis and explicit approval. Emergency
withdrawal may hide unsafe content promptly but cannot publish replacement policy.

## Future acceptance

Verify approved blocks only, HTML/script injection rejection, keyboard reorder,
campus isolation, authenticated previews, concurrent draft conflict handling,
stale-approval rejection, source-layer labeling, safe override inheritance,
atomic publication, cache withdrawal and audited rollback. CMS delivery is phased
in the roadmap; Phase 01 establishes its schema and authorization boundaries, not
an implied complete production editor.
