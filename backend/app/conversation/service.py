"""In-memory local budgets, validation and conservative academic-text boundary."""

import asyncio
import re
import secrets
from time import monotonic
from .contracts import ConversationRequest, ConversationResponse, Proposal
from .provider import Provider

# Deliberately conservative: academic answers are rendered by existing sourced modules.
ACADEMIC = re.compile(
    r"\b(?:[A-Z]{2,8}\s?\d{2,4}|credits?|prerequisites?|requirements?|eligib\w*|graduat\w*|equivalen\w*|guarantee\w*|catalog year|verified|approved|registration|available courses|must take|need to take)\b",
    re.I,
)
SENSITIVE = re.compile(
    r"\b(?:\d{3}[- ]\d{2}[- ]\d{4}|\d{8,}|\d{1,2}[/-]\d{1,2}[/-]\d{4}|SSN|social security|student id|date of birth|api.?key|password)\b",
    re.I,
)
INJECTION = re.compile(
    r"ignore (?:all |previous |system )?instructions|system prompt|reveal.*secret|execute.*sql|institution_verified|<script",
    re.I,
)


class ConversationOrchestrator:
    def __init__(self, provider: Provider | None):
        self.provider = provider
        self.sessions: dict[str, tuple[float, int]] = {}
        self.total = 0
        self.window = monotonic()
        self.lock = asyncio.Lock()
        self.inflight = False

    def new_session(self):
        now = monotonic()
        self.sessions = {
            key: value for key, value in self.sessions.items() if now - value[0] < 3600
        }
        if len(self.sessions) >= 128:
            return None
        token = secrets.token_urlsafe(32)
        self.sessions[token] = (now, 0)
        return token

    def fallback(self, reason="unavailable"):
        return ConversationResponse(
            mode="fallback",
            message="AI conversation is unavailable. You can still use supported navigation prompts and fictional profile controls.",
            reason=reason,
        )

    def validate(self, proposal: Proposal, request: ConversationRequest):
        keys = [u.key for u in proposal.updates]
        if len(keys) != len(set(keys)):
            raise ValueError("Repeated proposal")
        institution = next(
            (u.value for u in proposal.updates if u.key == "currentInstitution"), None
        )
        current = request.facts.get("currentInstitution")
        institution = institution or (
            current.value if current and current.state == "known" else None
        )
        for update in proposal.updates:
            if (
                update.key == "currentProgram"
                and update.value.institutionId != institution
            ):
                raise ValueError("Program institution mismatch")
            if update.key in (
                "completedCourses",
                "inProgressCourses",
                "plannedCourses",
            ):
                if any(c.institutionId != institution for c in update.value):
                    raise ValueError("Course institution mismatch")
        # Proposals remain pending even when there is no contradiction.
        return proposal

    async def converse(self, request: ConversationRequest):
        if self.provider is None:
            return self.fallback("disabled")
        safe_context = request.model_dump_json(exclude={"session_id", "history"})
        if SENSITIVE.search(safe_context) or INJECTION.search(safe_context):
            return self.fallback("unsafe_input")
        # Previously rejected turns must not poison every later unrelated follow-up.
        request = request.model_copy(
            update={
                "history": [
                    turn
                    for turn in request.history
                    if not SENSITIVE.search(turn.text)
                    and not INJECTION.search(turn.text)
                ]
            }
        )
        async with self.lock:
            now = monotonic()
            if now - self.window >= 3600:
                self.total = 0
                self.window = now
            entry = self.sessions.get(request.session_id)
            if (
                not entry
                or now - entry[0] >= 3600
                or entry[1] >= 20
                or self.total >= 80
                or self.inflight
            ):
                return self.fallback("limited")
            self.sessions[request.session_id] = (entry[0], entry[1] + 1)
            self.total += 1
            self.inflight = True
        try:
            proposal = await asyncio.wait_for(
                self.provider.propose(request), timeout=26
            )
            proposal = self.validate(Proposal.model_validate(proposal), request)
            if SENSITIVE.search(proposal.model_dump_json()) or INJECTION.search(
                proposal.model_dump_json()
            ):
                return self.fallback("invalid_output")
            # No unsupported academic/provider assertions are passed through as academic evidence.
            message = proposal.message
            if ACADEMIC.search(message) or "?" in message or "http" in message.lower():
                message = "I can help you explore your next steps. Academic answers need the sourced catalog tools; unresolved policies remain unresolved."
            if (proposal.goal or request.goal) == "transfer":
                message += " Verified transfer equivalencies are not implemented in this prototype."
            return ConversationResponse(
                mode="gemini",
                message=message,
                updates=proposal.updates,
                goal=proposal.goal,
                action=proposal.action,
                clarification_needed=proposal.clarification_needed,
            )
        except Exception:
            return self.fallback("invalid_output")
        finally:
            async with self.lock:
                self.inflight = False
