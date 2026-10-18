# Phase 04A conversation orchestration

## Flow and responsibility

1. Existing campus registry determines operational capability. Only BMCC can mount
   the conversation API; selecting it does not imply enrollment.
2. Without enabled local configuration and explicit fictional external-AI consent,
   chat retains the Phase 03B exact navigation/goal interpreter and profile controls.
3. Consented messages call a bounded same-origin Next.js proxy. FastAPI validates
   loopback access, body size, session budget, campus identity, goal and fact shapes.
4. Provider adapter receives only the latest message, bounded recent history,
   selected assistant, goal, allowed reported facts and untrusted selection context.
   It receives no environment, credentials, full catalog, SQL or tool executor.
5. Gemini returns `Proposal`: message, typed updates, optional goal, optional
   allowlisted action and clarification flag. Strict validation checks nested
   values, evidence, duplicate fields, institution bindings and action availability.
6. Valid response creates **pending** changes. User can Apply or Discard; no model
   suggestion silently replaces a confirmed fact. Client revalidates the converted
   Phase 03B proposal and compares the exact captured state before atomic application.
   Institution changes apply first, reusing existing program/catalog invalidation.
7. Existing `readiness()` and `AdaptiveProfile` recompute one relevant question.
   Gemini does not determine missing information or add grade requirements. Natural
   editorial acknowledgement is separate from deterministic question selection.
8. Structured buttons open only catalog, completed courses or limited progress.
   Existing academic APIs/evaluator alone supply facts and uncertainty. Full planner,
   transfer calculation, advisor handoff and other campuses remain unavailable.

## Structured contract

Provider `updates` contain an allowlisted field and a typed value; no provenance,
role, academic context or arbitrary nested properties are accepted. Values are
reported strings, institution-bound program names or institution-bound course
codes. Completed, in-progress and planned histories are distinct fields. Goals
reuse the existing eight values. `action` is null/catalog/completed/progress.
All changes require review, including goals and corrections of confirmed facts.
This is a proposed whole-field replacement, not an automatic history merge.
Review carefully before replacing an existing fictional course list.

Request fact snapshots accept reported/confirmed evidence only. Unknown,
not-applicable and conflicting states remain explicit without promoting candidates
to truth. They minimize transport; the full Phase 03B profile remains in the browser.
Relationship editing, previous institutions, placement, other credits, program start
and catalog applicability continue through existing deterministic controls and cannot
be changed by the model in this phase. Proposal rejection returns no partial changes.

## Example synthetic journeys

- “I'm studying computer science at BMCC and want to plan next semester.” Model
  proposes BMCC, reported Computer Science, and next-semester goal. Confirming uses
  existing readiness to ask about completed courses, then in-progress courses;
  no repeated institution/program or default grade question. Course selector can
  be offered; no plan or catalog entitlement is inferred.
- “I'm at BMCC and want to transfer to City College.” Proposed destination CCNY
  remains independent of assistant identity. Transfer equivalencies remain explicitly
  unimplemented; deterministic transfer readiness asks the next missing useful fact.
- “I don't know what I want to study.” Exploration goal has no required program,
  course history or year. Existing optional interest and catalog controls remain.
- “Actually, I go to LaGuardia.” Pending correction never silently overwrites a
  confirmed institution. Confirmation invalidates dependent assumptions through
  Phase 03B functions while preserving the selected BMCC assistant.

These are intended real-model journeys, exercised with fake provider proposals;
no live provider quality claim is made by those tests.

## Session and privacy lifecycle

Conversation, consent, pending proposals and provider capability remain component
memory. Tool navigation keeps chat mounted and retains recent conversation. Client
navigation away from the campus resets conversation/consent/selector; the root
provider retains the independent fictional profile as in Phase 03B. Refresh clears
all browser state. Backend stores only random session token, creation time/count
and process quota state, expiring after one hour or restart; no prompts/profile/chat
are kept by the application backend after request handling. This local throttle
session is **not** the future 24-hour authenticated guest workspace.

Google receives explicitly consented fictional messages/context. The application's
no-storage behavior does not assert Google's retention policy. Real-data use needs
separate privacy/institutional review. Session token is not identity or authorization
to student records. No account, production endpoint or distributed deployment exists.

Known limitations: no streaming, no academic retrieval/explanation generation, no
multi-worker budget coordinator, heuristic PII/injection/text filtering, no real-model
benchmark and no complete safety/compliance certification. See [gateway controls
and setup](GEMINI_GATEWAY.md) and [actual verification](PHASE_04A_VERIFICATION.md).
