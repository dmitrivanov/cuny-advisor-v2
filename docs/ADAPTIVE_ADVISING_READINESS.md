# Deterministic goal-dependent advising readiness

Phase 03B local prototype, 2026-10-17. Readiness measures availability of fictional
information for a task. It does not certify academic eligibility, registration,
transfer, graduation or a working planner/report service.

## Pure policies

`readiness(state)` derives required/optional/missing facts, blocking uncertainties,
one next question, safe existing actions and human-review limitations. It computes
from the current profile/session on every render; goal or fact corrections cannot
leave an old stored readiness score. There is no percentage or global completeness.

| Goal | Required information | Selected optional information |
| --- | --- | --- |
| Explore programs | Assistant campus and this explicit exploratory goal | Area of interest; no history, grades or schedule survey |
| Next semester | Current institution/program, completed and in-progress histories, term, load, scenario context | Intensity, schedule, modality, pace, placement |
| Degree pathway | Institution/program, completed/in-progress histories, scenario context | Term, load, pace |
| Prerequisites | Target course, completed/in-progress histories | Scenario context and placement; grade-specific eligibility remains conditional |
| Transfer | Current institution, destination, relevant completed coursework | Intended program, in-progress, other reported credits |
| Change program | Institution, current/intended programs, completed coursework | Context and in-progress coursework |
| Return to college | Previous education, intended program | Coursework and target term |
| Advisor meeting | Current institution/program | Coursework and reported credits |

The missing-fact order follows each task's required facts, not all profile fields.
Known answers (including explicit empty histories) are not asked again. Conflicting
facts and required not-applicable answers are surfaced for review rather than silently
converted into truth. Not-applicable course histories do not create courses/credit.
Explicitly acknowledged unknown answers remain missing/blocking but are not asked
again automatically. Users can clear/change goals or correct facts rather
than being forced through a wizard. Optional refinements are offered in the review
controls, not asked as mandatory defaults.

If a required academic context is missing, ask the intuitive program-start question
when not already known, then offer catalog selection for a fictional scenario.
A start period **never maps automatically to a release**. Catalog entitlement remains
a human-review issue; only the explicit scenario-binding action enables a fictional
reference. Different assistant/current institutions or conflicting program/institution
facts block planning readiness instead of applying the assistant's rules elsewhere.

## Readiness levels versus capabilities

- `conversation_ready`: goal missing, required information missing, blockers, or
  assistant unavailable. Conversation or source exploration can still be useful.
- `module_ready`: program exploration/prerequisite information ready for a **bounded
  existing tool**, not an eligibility decision. The full prerequisite answer still
  comes from the canonical evaluator and can be unresolved.
- `planning_ready`: required fictional planning information captured without modeled
  context blockers; **no planner, sequencing recommendation or transfer evaluator is
  implemented**. This is preparation state only, explicitly disclosed in UI.
- `handoff_ready`: captured basic information to discuss with a human; **no report,
  recipient verification or handoff service is implemented**.

Safe actions are only the existing catalog, Completed Courses and limited hypothetical
progress tools at an operational pilot. A future-campus state returns no such actions.
Readiness never authorizes a nonexistent capability or bypasses exact-release API
validation. Every result retains human-review/prototype limitations. Missing grades,
placement, evidence conflicts and program requirements remain the backend's concern;
no duplicate prerequisite, credit allocation or degree rules are added in TypeScript.

## Bounded conversation and future Gateway

The eight goal labels are exact supported intents, in addition to the four existing
navigation prompts. The explicitly supported correction syntax is:
“Actually, I'm studying at LaGuardia, not BMCC.” (registry names/short names/IDs,
case-normalized, ordinary apostrophe or curly apostrophe). It updates only the
reported current institution; assistant perspective is unchanged. Other arbitrary
language gets the existing no-live-AI guidance. The profile editor is the reliable
structured correction path for all other facts.

The future interpreter interface can propose text, goals, fact updates and tool
actions; current validation rejects unsupported actions, evidence promotions and
provider-selected catalogs. No Gemini adapter, API credential, SDK, prompt service,
network request or generic tool executor exists. Authoritative academic validation
remains in FastAPI/domain services. Adding a provider requires separate authorization
and backend/security/evidence evaluation, not merely implementing an interface.
