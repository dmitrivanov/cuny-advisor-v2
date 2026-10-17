# Campus-neutral fictional profile and session

Phase 03B, 2026-10-17. This is an in-memory contract, not a saved student record.
All current input must be fictional. No accounts, uploads, transcript processing,
24-hour guest storage, real records or institutional integrations are implemented.

## Evidence-aware facts

`Fact<T>` is a discriminated union:

- `known`: typed value plus provenance.
- `unknown`: reason and optional acknowledgment that the student is unsure; not equivalent to “no”.
- `not_applicable`: explicit reason, distinct from missing information.
- `conflicting`: reason and at least two candidate values with provenance.

Evidence vocabulary distinguishes `student_reported`, `student_confirmed`,
`extracted_unverified` and `institution_verified`. **Only the first two can be
created through current UI/proposal validation.** A confirmation checkbox confirms
fictional input, not academic truth. Future extracted/verified values require a
separately authorized ingestion/identity boundary; no such source exists here.
Known campus names/short names normalize to registry institution IDs (e.g. a
reported “BMCC” remains the same institution as `bmcc`), without inferring enrollment
or academic equivalence. External institution text remains a report.
Other already retained facts are not upgraded when a user corrects an unrelated fact.

`validateUpdate` bounds text/list sizes, checks allowed fields, course/program/
context structures, relationships, evidence states and provenance. Runtime APIs
accept `unknown` and reject malformed proposals/unsupported keys instead of using
unvalidated object spread from provider text. Fact values are React-rendered text,
not HTML. This supplements the fictional-data boundary; it is not authentication.

## Student Academic Profile

| Dimension | Representation / interpretation |
| --- | --- |
| Campus relationship | Per-campus fact: enrolled, prospective, prospective transfer, returning, alumnus or exploring; one reported perspective for a campus, not exhaustive personal identity |
| Current institution | Independent fact; never filled from assistant choice |
| Previous education | List of institution IDs and bounded descriptions; retains multiple affiliations |
| Current/intended program | Separate facts, each with its own explicit institution |
| Completed/in-progress/planned | Three separate course-history lists; never implicitly converted into earned credits |
| Course identity | Code and reported institution; optional exact campus/program/release/course reference from selector |
| Other credit | Reported text only; not an awarded transfer/exam equivalence |
| Placement/exemption | Reported text, no waiver or award semantics |
| Program start | Reported intuitive start period; never automatically selects an applicable catalog |
| Academic context | Exact reference and `unresolved` or `hypothetical_confirmed`; even confirmation is only scenario context, not institutional catalog entitlement |

An empty **known** course list means the user explicitly reported no courses.
An unknown list remains unknown. Completed and in-progress records are required
separately for relevant readiness; grades are not global fields. Actual minimum-grade
rules remain in the unchanged backend and can return unresolved without grade evidence.

## Advising Session

Selected assistant identity (`null` before selection), primary goal, optional unique
secondary goals, target term, preferred load/intensity, schedule, modality, pace,
destination, target course and area of interest are separate from the student profile.
Current tool remains in the existing workspace reducer. Outstanding questions and
readiness are derived from current facts, not cached mutable scores.

An explicit institution correction invalidates current program and academic-context
assumptions. It invalidates an enrolled-at-assistant relationship if the new reported
institution contradicts it; compatible prospective-transfer/returning/alumnus facts
remain. Destination, intended program and historical course reports remain independent.
Changing program/start period requires catalog review; a date is never an assignment.

Actual assistant switching preserves educational history and per-campus relationships,
but resets scoped academic context, primary/secondary task goals and planning preferences.
It does not move a BMCC course reference into CCNY requirements. Unsupported campus
routes show no tools. Coming back to the same pilot via landing preserves independent
profile facts, but the unmounted workspace's chat/selections are not restored.

## UI and academic boundary

One relevant question appears after a supported goal, with optional profile review/
correction in a disclosure. Structured answers distinguish explicit no courses,
unknown and not applicable. Optional secondary goals and facts are available on demand.
There is no mandatory survey or global “100% complete” score.

“Use these fictional completed courses in my profile” copies the current selector
list with exact release-scoped references and student-reported provenance. This is
an explicit replacement, not an automatic import, award, verification or allocation.
It never copies in-progress/planned courses into completed history. The user must
select the historical list they want; prior profile history is not merged by code.
The profile never automatically repopulates selectors or counts credits.

“Use this draft for the fictional scenario only” confirms a selected real persisted
release for a hypothetical context. It does not resolve institutional applicability
or evidence gaps. A different release clears the profile's previous scenario binding.
No profile text/course history is sent to the backend; only the pre-existing bounded
hypothetical selection/allocation body is sent when running a preview.

See [multi-campus boundaries](MULTICAMPUS_ARCHITECTURE.md) and
[readiness policies](ADAPTIVE_ADVISING_READINESS.md).
