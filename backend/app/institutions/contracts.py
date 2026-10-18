from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

Category = Literal[
    "community_college", "senior_college", "graduate_professional", "honors_college"
]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class Source(Strict):
    id: str = Field(pattern=r"^[a-z0-9-]+$")
    url: HttpUrl
    title: str = Field(min_length=1, max_length=300)
    retrieved_on: date


class Reference(Strict):
    source_id: str
    locator: str = Field(min_length=1, max_length=400)


class Institution(Strict):
    id: str = Field(pattern=r"^[a-z][a-z0-9-]{0,79}$")
    slug: str = Field(pattern=r"^[a-z][a-z0-9-]{0,79}$")
    official_name: str = Field(min_length=1, max_length=200)
    display_name: str = Field(min_length=1, max_length=80)
    category: Category
    active: bool
    website: HttpUrl
    classification_note: str = Field(max_length=600)
    sources: tuple[Reference, ...] = Field(min_length=1)


class Dataset(Strict):
    snapshot_id: str = Field(pattern=r"^[a-z0-9-]+$")
    retrieved_on: date
    scope_source: str
    sources: tuple[Source, ...] = Field(min_length=1)
    institutions: tuple[Institution, ...]

    @model_validator(mode="after")
    def unique(self):
        for values in [
            [i.id for i in self.institutions],
            [i.slug for i in self.institutions],
            [i.official_name for i in self.institutions],
            [s.id for s in self.sources],
        ]:
            if len(values) != len(set(values)):
                raise ValueError("Registry duplicate identity or name")
        source_ids = {s.id for s in self.sources}
        if self.scope_source not in source_ids or any(
            r.source_id not in source_ids for i in self.institutions for r in i.sources
        ):
            raise ValueError("Unknown registry source")
        if any(
            len(i.sources) != len({r.source_id for r in i.sources})
            for i in self.institutions
        ):
            raise ValueError("Duplicate institution provenance")
        return self


class InstitutionView(Institution):
    support_status: Literal["pilot", "planned"]


class RegistryView(Strict):
    snapshot_id: str
    retrieved_on: date
    scope_source: str
    sources: tuple[Source, ...]
    institutions: tuple[InstitutionView, ...]
