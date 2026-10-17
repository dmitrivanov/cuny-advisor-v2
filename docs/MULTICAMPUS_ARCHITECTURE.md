# Multi-campus frontend foundation — Phase 03B

Implemented local prototype, 2026-10-17. BMCC is the only operational **project
pilot**, not an institutionally approved assistant. No AI or production service.

## Registry and capability boundary

`frontend/src/lib/advising/campuses.ts` is presentation/capability metadata:
identity, slug, accurate name/type, project assistant availability and art-directed
positions. It contains no courses, requirements, equivalencies or campus-specific
chat logic. Eight names and community/senior classifications were checked against
[CUNY's official directory](https://www.cuny.edu/about/university-resources/telephone-email-directories/)
on 2026-10-17 (Senior Colleges and Community Colleges sections). These metadata
facts do not validate academic rules or imply approval. The displayed eight are
a representative subset, not an assertion of the university's complete count.

BMCC is `pilot`; CCNY, LaGuardia, Queensborough, Hunter, Baruch, Brooklyn and Queens
are `planned`. Availability is a local product decision, not a college fact.
`hasAcademicTools` is the shared explicit capability predicate. Future activation
requires more than adding a node: separately reviewed catalogs, capability routing,
academic/security tests and owner authorization. No other campus inherits BMCC rules.

## Owner-review entry interaction

The constellation occupies the primary landing area; no persistent information panel
or hero is rendered. Native BMCC button activation routes directly to `/campus/bmcc`.
Hover/focus exposes a small description connected with `aria-describedby`; Escape
clears it. Planned campuses expose only a dismissible live status notice. No selection
implies enrollment. The expandable accessible list retains a direct BMCC link.
“Back to campuses” in chat retains the independent in-memory profile as before.
Decorative orbits alone animate slowly; target geometry is fixed, interaction pauses
motion and reduced-motion disables it. This adds no academic or provider behavior.

## Routing and state

- `/`: dark campus selection, no operational chat or academic fetch.
- `/campus/bmcc`: shared minimal light conversation and existing contextual tools.
- `/campus/{known-planned-slug}`: explicit unavailable page and return link only.
- Unknown campus: Next.js not-found; no assistant or academic calls.
- Legacy `/?campus=bmcc&program=...&release=...#completed` migrates client-side with
  `replace` to the same query/hash under `/campus/bmcc`. Known non-operational campus
  queries resolve to their unavailable route. Old bare supported tool hashes migrate
  deliberately to the historical BMCC prototype. Plain `/` stays campus selection.

The root client `AdvisingProvider` retains profile/session **only in memory** across
Next.js Link navigation. Before choosing a campus, assistant identity is `null`.
Mounting an operational campus applies `switchCampus`; educational history remains,
but an actual assistant change clears catalog applicability and task-specific goals/
preferences. Campus-relative relationships are keyed by campus, never inferred from
assistant selection. Future unavailable pages do not instantiate a conversation.

The existing workspace reducer owns exact release/course selections/allocations and
active tool, with unchanged academic semantics. Leaving its campus route unmounts
that workspace: conversation, draft input and hypothetical selector state reset.
The independent profile survives client navigation through the landing; full refresh
resets everything. No browser storage, cookies, account, student table or HTTP profile
API. Moving between tools within the same workspace retains conversation/selections.

Release discovery is filtered to the actual assistant campus, deep-link campus mismatch
is rejected without loading another campus's catalog, and loaded response campus is
checked again. Release switches/back-forward clear incompatible selections via the
existing reducer and invalidate profile applicability for a different exact release.
Profile histories retain explicitly scoped source course identities and are never
automatically applied to another release, campus or degree requirement.

## Profile and orchestration

See [profile model](STUDENT_PROFILE_MODEL.md) and [readiness](ADAPTIVE_ADVISING_READINESS.md).
The pure frontend readiness functions govern question selection and information
readiness, not academic satisfaction, eligibility or credit arithmetic. Existing
FastAPI, PostgreSQL repositories and pure evaluator remain unchanged and authoritative.

Structured actions are allowlisted to existing catalog/completed/progress tools.
The future `FutureAdvisingInterpreter` interface returns **proposals**: bounded text,
optional supported goal, validated reported/confirmed fact updates and allowlisted
actions. `validateProposal` accepts unknown input and refuses malformed arrays,
unsupported capabilities, evidence promotions and catalog-selection updates. No
provider is instantiated, no SDK/key/network call and no generic tool executor.
A later server boundary must validate authority and retrieved academic facts too;
the interface alone is not production authorization or an AI safety certification.

## Constellation and accessibility

Native buttons reference registry positions. SVG edges and elliptical orbits are
purely decorative CUNY-network membership imagery, not a geographic map, institutional
agreement or verified transfer pathway. No external logos or image assets are used.

Hover and keyboard focus share a contextual detail panel; click/tap pins a selection.
A single modest CSS transform/glow/opacity transition changes visual emphasis without
reflow. No physics, autoplay, timers, particles, WebGL or graph dependency. At mobile
widths the same buttons form a compact touch selector; SVG decoration is hidden.
Native list/disclosure and an SSR BMCC link offer a usable non-graph alternative.
Reduced motion disables transitions and node zoom; focus, labels and availability
remain. Visual metadata never controls academic policy.

No backend, migration, fixture, schema, dependency or V1 change. Local DBs remain
disposable and loopback only. See [actual verification](PHASE_03B_VERIFICATION.md).
