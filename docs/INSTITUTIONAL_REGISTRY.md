# CUNY institutional registry — Phase 04B

Implemented local public-data registry, retrieved 2026-10-17. This is institutional
identity evidence, not academic policy validation or institutional approval.

## Verified scope and provenance

The current [CUNY colleges listing](https://www.cuny.edu/about/colleges/) identifies
26 institutions. Membership and outbound Website links were extracted from that
listing, then curated into a reviewed, offline JSON manifest. No assumed total is
encoded in the runtime. Completeness tests compare the manifest against the separate
captured source membership, not a frontend list. The capture includes the original
HTML SHA-256; it is a reproducibility fingerprint, not a digital signature or claim
that CUNY approved this project. The source HTML itself is not shipped.

- `colleges`: [CUNY Colleges & Schools](https://www.cuny.edu/about/colleges/) (retrieved 2026-10-17).
- `directory`: [CUNY Telephone & Email Directories](https://www.cuny.edu/about/university-resources/telephone-email-directories/) (retrieved 2026-10-17).
- `about`: [About CUNY: institutional group counts](https://www.cuny.edu/about/) (retrieved 2026-10-17).
- `medicine`: [School of Medicine independent-college announcement (2024-11-19)](https://www.cuny.edu/news/gov-hochul-announces-cuny-school-of-medicine-elevated-to-independent-college/) (retrieved 2026-10-17).
- `macaulay`: [Macaulay: honors college and home-campus model](https://macaulay.cuny.edu/about-macaulay/) (retrieved 2026-10-17).
- `macaulay-name`: [Macaulay official and common naming guide](https://www.cuny.edu/wp-content/uploads/sites/4/page-assets/about/administration/offices/communications-marketing/services/marketing-and-branding/download/cuny-colleges/Macaulay_Branding_Guide-1.13.14.pdf) (retrieved 2026-10-17).

The snapshot contains **11 senior colleges, 7 community colleges, 7 graduate /
professional institutions, and 1 honors college**. The CUNY About page combines
our last two categories as eight graduate, honors and professional schools.
The older telephone directory and admissions explore listing omit Medicine from
their enumerations; they are not the primary completeness authority. The current
colleges listing and the 2024 CUNY Medicine announcement establish its separate
entry. No completed accreditation transition is asserted.

Macaulay is represented as a consortial honors institution with partner/home-campus
degree relationships, not an additional standalone curriculum catalog. Its formal
name follows the official branding guide; the primary listing uses its common
name. Guttman's formal name follows the CUNY directory. SPS and SLU appear in CUNY's
graduate/professional grouping but also offer undergraduate study: category is not
a degree-level restriction. Classification notes accompany affected rows in the API
and focus descriptions. Offices, centers and affiliates are not added as colleges.

Identifiers and concise display labels are project choices, not official CUNY
identifier codes. Existing eight identifiers remain stable. Names and category
assignments are traceable through per-row source IDs and locators. `active` means
listed in this retrieved scope, not real-time operational or accreditation status.
Website URLs preserve the official listing's outbound hrefs, including HTTP and
legacy paths; redirect destinations and ongoing website uptime are not verified.
No location, address, ranking, enrollment or popularity fields are invented.

| Stable ID | Official name | Display label | Category | Listed website |
| --- | --- | --- | --- | --- |
| `baruch` | Baruch College | Baruch | `senior_college` | [Website](http://www.baruch.cuny.edu/) |
| `bmcc` | Borough of Manhattan Community College | BMCC | `community_college` | [Website](https://www.bmcc.cuny.edu/) |
| `bronx` | Bronx Community College | Bronx CC | `community_college` | [Website](http://www.bcc.cuny.edu/) |
| `brooklyn` | Brooklyn College | Brooklyn | `senior_college` | [Website](https://www.brooklyn.edu/) |
| `ccny` | The City College of New York | CCNY | `senior_college` | [Website](https://www.ccny.cuny.edu/) |
| `city-tech` | New York City College of Technology | City Tech | `senior_college` | [Website](http://www.citytech.cuny.edu/) |
| `graduate-center` | CUNY Graduate Center | Graduate Center | `graduate_professional` | [Website](https://www.gc.cuny.edu/Home) |
| `guttman` | Stella and Charles Guttman Community College | Guttman | `community_college` | [Website](http://guttman.cuny.edu/) |
| `hostos` | Hostos Community College | Hostos | `community_college` | [Website](http://www.hostos.cuny.edu/) |
| `hunter` | Hunter College | Hunter | `senior_college` | [Website](http://www.hunter.cuny.edu/main/) |
| `john-jay` | John Jay College of Criminal Justice | John Jay | `senior_college` | [Website](http://www.jjay.cuny.edu/) |
| `journalism` | Craig Newmark Graduate School of Journalism | Journalism | `graduate_professional` | [Website](https://www.journalism.cuny.edu/) |
| `kingsborough` | Kingsborough Community College | Kingsborough | `community_college` | [Website](https://www.kbcc.cuny.edu/) |
| `labor-urban` | CUNY School of Labor and Urban Studies | Labor & Urban | `graduate_professional` | [Website](http://slu.cuny.edu/) |
| `laguardia` | LaGuardia Community College | LaGuardia | `community_college` | [Website](https://www.laguardia.edu/home/Default.aspx) |
| `law` | CUNY School of Law | Law | `graduate_professional` | [Website](https://www.law.cuny.edu/) |
| `lehman` | Lehman College | Lehman | `senior_college` | [Website](http://www.lehman.cuny.edu/) |
| `macaulay` | William E. Macaulay Honors College at The City University of New York | Macaulay | `honors_college` | [Website](https://macaulay.cuny.edu/) |
| `medgar-evers` | Medgar Evers College | Medgar Evers | `senior_college` | [Website](https://www.mec.cuny.edu/) |
| `medicine` | CUNY School of Medicine | Medicine | `graduate_professional` | [Website](https://medicine.cuny.edu/) |
| `professional-studies` | CUNY School of Professional Studies | Professional Studies | `graduate_professional` | [Website](https://sps.cuny.edu/) |
| `public-health` | CUNY Graduate School of Public Health and Health Policy | Public Health | `graduate_professional` | [Website](http://sph.cuny.edu/) |
| `queens` | Queens College | Queens | `senior_college` | [Website](https://qc.cuny.edu) |
| `queensborough` | Queensborough Community College | Queensborough | `community_college` | [Website](http://www.qcc.cuny.edu/) |
| `staten-island` | College of Staten Island | Staten Island | `senior_college` | [Website](https://www.csi.cuny.edu/) |
| `york` | York College | York | `senior_college` | [Website](https://www.york.cuny.edu/) |

## Persistence and immutability

Alembic `04b_001` follows `02c_001`. Five normalized tables in `cuny_advisor_v2`:

- `institution_registry_snapshot`: immutable snapshot identity, retrieval date,
  primary scope source, canonical SHA-256 digest and expected membership count.
- `institution`: stable identity/unique slug, FK to the existing campus identity,
  and project support status. Only BMCC may be `pilot`; every other row is `planned`.
- `institution_registry_source`: snapshot-scoped source URL, title and retrieval date.
- `institution_revision`: snapshot-scoped official/display name, category, active,
  website and classification note; unique official name within each snapshot.
- `institution_source_reference`: locators with composite FKs to the **same** snapshot's
  source and institution revision. No cross-snapshot provenance contamination.

Existing academic campus keys are reused; catalog DTOs, release bindings, revisions,
credit serialization, pure evaluator and academic uncertainty are untouched.
New rows have UPDATE/DELETE rejection triggers. Runtime gets SELECT only on the
five new tables. The migration owner performs explicit imports in one transaction.
Repeat imports use conflict-safe exact comparisons and verify the complete projection
before commit; differing immutable identities fail and roll back. Reconstruction
under REPEATABLE READ validates types, membership count and canonical digest, so
missing, extra, modified or incorrectly shared source rows fail closed. Digests
include stable identity, support status, every source and every source reference.

New official facts append a new snapshot instead of rewriting history. The newest
retrieval date wins; same-date snapshots use descending snapshot ID as a deterministic
tie-break. Use monotonic revision suffixes for same-day reviewed replacements.
Identity/slug/support are deliberately immutable across snapshots. Changing support
or identity requires a separately reviewed migration; adding a registry entry never
activates academic tools. Retained snapshots prevent downgrade. No startup migration,
source fetch, seeding, AI, administration UI or scheduler is introduced.

## Explicit local setup

Use README's disposable V2 bootstrap and role-separated local configuration first.
Never point these commands at V1 or an institutional database. With trusted local
`V2_MIGRATION_DATABASE_URL` already exported, run from `backend`:

```sh
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m alembic current
.venv/bin/python -m app.institutions.import_registry
.venv/bin/python -m app.institutions.import_registry
```

Expected head: `04b_001`. Both imports report the same snapshot
`cuny-institutions-2026-10-17-r1` and 26 institutions. Import never contacts the
source websites or Gemini. It does not import or replace academic catalog fixtures.
Keep only runtime-role `V2_DATABASE_URL` in the running backend. No credentials are
included here or in the public manifest. Gemini can remain disabled.

## Read-only API

- `GET /api/v1/institutions`: typed `RegistryView`, ordered by case-insensitive
  display label then stable ID; source/reference ordering is deterministic.
- `GET /api/v1/institutions/{slug}`: typed individual institution or 404.
- Unsupported methods: 405; malformed slug: 422. All registry responses are no-store.
- Migrated but unimported registry: list returns 200 JSON `null`; detail returns 404.
- Missing configuration/migration, DB failure or integrity mismatch: safe 503,
  without raw SQL, credentials or static fixture fallback.

Abbreviated individual response (the real response also includes provenance):

```json
{
  "id": "bmcc",
  "slug": "bmcc",
  "official_name": "Borough of Manhattan Community College",
  "display_name": "BMCC",
  "category": "community_college",
  "active": true,
  "website": "https://www.bmcc.cuny.edu/",
  "support_status": "pilot"
}
```

`support_status` is a project capability decision stored separately from official
facts, never evidence of institutional approval. Academic endpoints continue to
require their existing explicit campus/program/release context.

## Frontend integration and limits

Next.js server-only origin handling proxies the fixed registry path at
`GET /api/institutions`; validates loopback `API_BASE_URL`, redirects, timeout and
response shape; and never reads a Gemini key. Campus route rendering independently
uses the same server helper to resolve public identities from the DB-backed API.
Root context supplies registry metadata to discovery and profile normalization.
Names, IDs, categories, support and website originate in this API. There is no
static eight-campus fallback. Loading, retryable errors and unimported/empty states
are explicit. Actual unknown slugs return 404; registry failures show setup help.

Only illustrative placement and orb initials live in frontend code. Desktop keeps
two fixed-node rings, glass surfaces, ambient decorative motion and focus/hover
information. Under 69rem the constellation uses four spaced columns; under 40rem,
two columns. This prevents 26 targets colliding at tablet/mobile widths while
preserving node semantics, motion preference, list access and direct BMCC entry.
Long mobile pages scroll normally. Edges are not geographic or transfer claims.

The existing `hasAcademicTools(id === "bmcc")` allowlist remains a defense-in-depth
capability guard, not an institutional metadata source. Other institutions show a
dismissible unavailable notice and cannot open BMCC tools through query spoofing.
BMCC remains a bounded draft pilot, not a complete audit. No additional institution's
programs, courses, requirements or equivalencies are inferred.

Future Phase 04C should propose a reviewed source-refresh/version workflow,
institutional classification review and separately scoped academic-catalog onboarding.
It must not activate campuses merely because they are discoverable. Gemini live
verification is pending because credentials are unavailable; no live call was needed
or performed for Phase 04B. Authentication, CMS, real records, production rollout and
institutional endorsement remain outside this phase.

See [verification](PHASE_04B_VERIFICATION.md) for executed checks and evidence.
