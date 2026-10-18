"""Browse-only contracts. Source verification never grants academic approval."""

from datetime import date
from decimal import Decimal
from typing import Annotated, Literal
from pydantic import Field, HttpUrl, model_validator
from app.academic.contracts import Contract, Completed, Unknown, NoConditions, Credits

ID = Annotated[str, Field(pattern=r"^[A-Za-z0-9_.:-]{1,160}$")]


class All(Contract):
    op: Literal["all"] = "all"
    children: tuple["Condition", ...] = Field(min_length=1)


class Any(Contract):
    op: Literal["any"] = "any"
    children: tuple["Condition", ...] = Field(min_length=1)


class ExternalCondition(Contract):
    op: Literal["placement", "test", "permission", "concurrent", "program"]
    value: str = Field(min_length=1)


Condition = Annotated[
    Completed | Unknown | NoConditions | All | Any | ExternalCondition,
    Field(discriminator="op"),
]
All.model_rebuild()
Any.model_rebuild()


class Evidence(Contract):
    source_id: ID
    locator: str = Field(min_length=1)
    catalog_year: str | None = None


class Source(Contract):
    id: ID
    url: HttpUrl
    retrieved_on: date
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    format: Literal["bulletin_ssr", "visible_dom_extract"]
    catalog_year: str | None


class RuleText(Contract):
    text: str | None = None
    raw_reference: str | None = None
    status: Literal["unresolved", "provisional", "conflicting", "source_verified"] = (
        "unresolved"
    )
    expression: Condition = Unknown(
        reason="Source did not establish a structured interpretation"
    )
    evidence: tuple[Evidence, ...] = ()
    academic_review: Literal["required"] = "required"

    @model_validator(mode="after")
    def verified(self):
        if self.status == "source_verified" and (
            not self.text
            or not self.evidence
            or any(not e.catalog_year for e in self.evidence)
        ):
            raise ValueError(
                "Verified interpretation requires original text and explicit year evidence"
            )
        if self.status != "source_verified" and not isinstance(
            self.expression, Unknown
        ):
            raise ValueError("Unreviewed conditions cannot publish a structured rule")
        return self


class Department(Contract):
    id: ID
    name: str
    bulletin_name: str
    kind: Literal["academic_department", "offering_unit"]
    url: HttpUrl
    prefixes: tuple[str, ...] = ()
    evidence: tuple[Evidence, ...] = Field(min_length=1)


class Program(Contract):
    id: ID
    name: str
    credential: Literal["AA", "AS", "AAS", "certificate", "microcredential"]
    url: HttpUrl
    catalog_year: str | None = None
    department_ids: tuple[ID, ...] = ()
    relationship: Literal["page_host_only", "unresolved"] = "unresolved"
    requirement_sources: tuple[Evidence, ...] = ()
    status: Literal["identity_source_verified_requirements_pending"] = (
        "identity_source_verified_requirements_pending"
    )
    evidence: tuple[Evidence, ...] = Field(min_length=1)


class Course(Contract):
    id: ID
    code: str = Field(pattern=r"^[A-Z][A-Z0-9]* [0-9][A-Za-z0-9.]*$")
    source_code: str
    prefix: str
    number: str
    title: str = Field(min_length=1)
    description: str
    description_original: str
    credits_min: Credits
    credits_max: Credits
    contact_hours: Credits | None = None
    lecture_hours: Credits | None = None
    lab_hours: Credits | None = None
    department_ids: tuple[ID, ...]
    designations: tuple[str, ...] = ()
    prerequisite: RuleText = RuleText()
    corequisite: RuleText = RuleText()
    minimum_grade: RuleText = RuleText()
    placement_permission: RuleText = RuleText()
    enrollment_restrictions: RuleText = RuleText()
    cross_listing: RuleText = RuleText()
    catalog_year: str
    effective_start: str | None = None
    effective_end: str | None = None
    evidence: tuple[Evidence, ...] = Field(min_length=1)
    status: Literal["facts_source_verified_rules_pending"] = (
        "facts_source_verified_rules_pending"
    )

    @model_validator(mode="after")
    def fields(self):
        if (
            self.code != f"{self.prefix} {self.number}"
            or self.credits_max < self.credits_min
            or self.credits_max <= Decimal(0)
        ):
            raise ValueError("Invalid credit-bearing course or code")
        if any(e.catalog_year != self.catalog_year for e in self.evidence):
            raise ValueError("Course source year mismatch")
        for rule in (
            self.prerequisite,
            self.corequisite,
            self.minimum_grade,
            self.placement_permission,
            self.enrollment_restrictions,
            self.cross_listing,
        ):
            if rule.status == "source_verified" and any(
                e.catalog_year != self.catalog_year for e in rule.evidence
            ):
                raise ValueError("Rule year mismatch")
        return self


class Snapshot(Contract):
    id: ID
    campus_id: Literal["bmcc"] = "bmcc"
    catalog_year: str
    retrieved_on: date
    sources: tuple[Source, ...]
    departments: tuple[Department, ...]
    programs: tuple[Program, ...]
    courses: tuple[Course, ...]
    exceptions: tuple[str, ...] = ()

    @model_validator(mode="after")
    def integrity(self):
        for records, field in [
            (self.sources, "id"),
            (self.departments, "id"),
            (self.programs, "id"),
            (self.courses, "id"),
            (self.courses, "code"),
        ]:
            keys = [getattr(r, field) for r in records]
            if len(keys) != len(set(keys)):
                raise ValueError("Duplicate catalog identity/code")
        sources = {s.id: s for s in self.sources}
        departments = {d.id for d in self.departments}
        for record in (*self.departments, *self.programs, *self.courses):
            if not set(getattr(record, "department_ids", ())) <= departments:
                raise ValueError("Unknown offering relationship")
            references = list(record.evidence)
            if isinstance(record, Course):
                if record.catalog_year != self.catalog_year:
                    raise ValueError("Mixed catalog years")
                for rule in (
                    record.prerequisite,
                    record.corequisite,
                    record.minimum_grade,
                    record.placement_permission,
                    record.enrollment_restrictions,
                    record.cross_listing,
                ):
                    references.extend(rule.evidence)
            if isinstance(record, Program):
                references.extend(record.requirement_sources)
            for e in references:
                if (
                    e.source_id not in sources
                    or e.catalog_year != sources[e.source_id].catalog_year
                ):
                    raise ValueError("Invalid source applicability")
        return self
