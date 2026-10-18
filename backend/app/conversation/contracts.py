"""Untrusted provider proposals are never academic or institutional evidence."""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

Goal = Literal[
    "explore_programs",
    "next_semester",
    "degree_pathway",
    "prerequisites",
    "transfer",
    "change_program",
    "return_college",
    "advisor_meeting",
]
FieldName = Literal[
    "currentInstitution",
    "currentProgram",
    "intendedProgram",
    "completedCourses",
    "inProgressCourses",
    "plannedCourses",
    "targetTerm",
    "courseLoad",
    "studyIntensity",
    "schedule",
    "modality",
    "pace",
    "destination",
    "targetCourse",
    "interest",
]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class Program(Strict):
    name: str = Field(min_length=1, max_length=120)
    institutionId: str = Field(min_length=1, max_length=120)


class Course(Strict):
    code: str = Field(
        min_length=1, max_length=30, pattern=r"^[A-Za-z]{2,8} ?[0-9]{2,4}[A-Za-z]?$"
    )
    institutionId: str = Field(min_length=1, max_length=120)


class Update(Strict):
    key: FieldName
    value: str | Program | list[Course]

    @model_validator(mode="after")
    def shape(self):
        if self.key in ("currentProgram", "intendedProgram"):
            valid = isinstance(self.value, Program)
        elif self.key in ("completedCourses", "inProgressCourses", "plannedCourses"):
            valid = isinstance(self.value, list) and len(self.value) <= 30
        else:
            valid = isinstance(self.value, str) and 0 < len(self.value) <= 160
        if not valid:
            raise ValueError("Unsupported proposal shape")
        return self


class Proposal(Strict):
    message: str = Field(min_length=1, max_length=1200)
    updates: list[Update] = Field(default_factory=list, max_length=8)
    goal: Goal | None = None
    action: Literal["catalog", "completed", "progress"] | None = None
    clarification_needed: bool = False


class Fact(Strict):
    state: Literal["known", "unknown", "not_applicable", "conflicting"]
    value: str | Program | list[Course] | None = None
    provenance: Literal["student_reported", "student_confirmed"] | None = None

    @model_validator(mode="after")
    def evidence_shape(self):
        if self.state == "known" and (self.value is None or self.provenance is None):
            raise ValueError("Known fact requires reported evidence")
        if self.state != "known" and (
            self.value is not None or self.provenance is not None
        ):
            raise ValueError("Unknown fact cannot carry a value")
        return self


class Turn(Strict):
    role: Literal["you", "guide"]
    text: str = Field(min_length=1, max_length=1200)


class CatalogSelection(Strict):
    campus_id: Literal["bmcc"]
    program_id: str = Field(max_length=100, pattern=r"^bmcc-program-[a-z0-9-]+$")
    release_id: str = Field(max_length=100, pattern=r"^bmcc-[a-z0-9-]+$")
    applicability: Literal["unresolved"] = "unresolved"


class ConversationRequest(Strict):
    session_id: str = Field(min_length=20, max_length=100)
    campus_id: Literal["bmcc"]
    message: str = Field(min_length=1, max_length=600)
    facts: dict[FieldName, Fact] = Field(default_factory=dict, max_length=15)
    goal: Goal | None = None
    history: list[Turn] = Field(default_factory=list, max_length=8)
    external_ai_consent: Literal[True]
    module: Literal["chat", "catalog", "completed", "progress"] = "chat"
    catalog_context: CatalogSelection | None = None

    @model_validator(mode="after")
    def validate_facts(self):
        for key, fact in self.facts.items():
            if fact.state == "known":
                Update(key=key, value=fact.value)
        return self


class ConversationResponse(Strict):
    mode: Literal["gemini", "fallback"]
    message: str
    updates: list[Update] = Field(default_factory=list)
    goal: Goal | None = None
    action: Literal["catalog", "completed", "progress"] | None = None
    clarification_needed: bool = False
    reason: (
        Literal["disabled", "unavailable", "limited", "invalid_output", "unsafe_input"]
        | None
    ) = None
