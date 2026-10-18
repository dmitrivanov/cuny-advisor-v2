"""Explicit public-source collection and deterministic offline staging; no startup hooks."""

import hashlib
import json
import re
from decimal import Decimal
from pathlib import Path
from .contracts import Snapshot
from .source import nuxt_document, plain

DATA = Path(__file__).parent / "data"
YEAR = "2025-2026"


def sha(value):
    return hashlib.sha256(value).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(), parse_float=Decimal)


def write(path, value):
    Path(path).write_text(
        json.dumps(value, indent=2, ensure_ascii=False, default=str) + "\n"
    )


def reference(source, locator, year=None):
    return dict(source_id=source, locator=locator, catalog_year=year)


def source_extract(html, department_id):
    page = nuxt_document(html)
    settings = page["pinia"]["settings"]
    if settings["catalogDisplayName"] != YEAR + " Catalog":
        raise ValueError("Catalog changed: choose and review a separate year")
    records = page["data"]["department-courses-" + department_id]
    if not isinstance(records, list):
        raise ValueError("Source course list missing")
    fields = (
        "id",
        "courseGroupId",
        "code",
        "subjectCode",
        "courseNumber",
        "longName",
        "name",
        "description",
        "credits",
        "departments",
        "attributes",
        "requirementDesignation",
        "requirementGroup",
        "consent",
        "effectiveStartDate",
        "effectiveEndDate",
        "alternativeCode",
    )
    return dict(
        department_id=department_id,
        catalog_id=settings["activeCatalog"],
        catalog_year=YEAR,
        html_sha256=sha(html.encode()),
        records=[
            {
                **{k: c.get(k) for k in fields},
                "components": [
                    {k: v.get(k) for k in ("name", "contactHours")}
                    for v in c.get("components", [])
                ],
                "catalog_attributes": c.get("customFields", {}).get(
                    "catalogAttributes", []
                ),
            }
            for c in records
        ],
    )


def stage(directory):
    directory = Path(directory)
    capture = read(directory / "capture.json")
    if capture["catalog_year"] != YEAR:
        raise ValueError("Unsupported catalog-year parser; review source format first")
    inventory = read(directory / "inventory.json")
    sources = []
    departments = []
    programs = []
    courses = {}
    excluded = []
    conflicts = []
    seen = []

    def source(id, url, content, year=None, format="visible_dom_extract"):
        sources.append(
            dict(
                id=id,
                url=url,
                retrieved_on=capture["retrieved_on"],
                sha256=sha(content),
                format=format,
                catalog_year=year,
            )
        )

    for id, file, url in [
        (
            "department-index",
            "departments.json",
            "https://www.bmcc.cuny.edu/academics/departments/",
        ),
        (
            "program-index",
            "programs.json",
            "https://www.bmcc.cuny.edu/academics/programs/",
        ),
        ("support", "support.json", "https://www.bmcc.cuny.edu/academics/courses/"),
        (
            "maps",
            "maps.json",
            "https://www.bmcc.cuny.edu/academics/advisement/advisement-resources/academic-program-maps/",
        ),
    ]:
        source(id, url, (directory / file).read_bytes())
    current = read(directory / "departments.json")
    for unit in inventory:
        observed = next((d for d in current if d["url"] == unit.get("web_url")), None)
        departments.append(
            dict(
                id=unit["id"],
                name=observed["name"] if observed else unit["name"],
                bulletin_name=unit["name"],
                kind="academic_department" if observed else "offering_unit",
                url=unit.get("web_url") or unit["url"],
                prefixes=(),
                evidence=(
                    [reference("department-index", observed["name"])]
                    if observed
                    else [
                        reference(
                            "bulletin-" + unit["id"], "Course offering unit", YEAR
                        )
                    ]
                ),
            )
        )
    identities = read(directory / "project_program_ids.json")
    for row in read(directory / "programs.json"):
        group = row["group"]
        credential = (
            "AAS"
            if "A.A.S." in group
            else (
                "AA"
                if "A.A." in group
                else (
                    "AS"
                    if "A.S." in group
                    else "certificate" if "Certificate" in group else "microcredential"
                )
            )
        )
        matches = [
            u["id"]
            for u in inventory
            if u.get("web_url") and row["url"].startswith(u["web_url"])
        ]
        if row["url"] not in identities:
            raise ValueError(
                "New program requires explicit stable project identity review"
            )
        id = identities[row["url"]]
        programs.append(
            dict(
                id=id,
                name=row["name"],
                credential=credential,
                url=row["url"],
                department_ids=matches,
                relationship="page_host_only" if matches else "unresolved",
                evidence=[reference("program-index", group + " / " + row["name"])],
            )
        )
    for unit in inventory:
        path = directory / (unit["id"] + ".json")
        extract = read(path)
        if (
            extract["catalog_year"] != YEAR
            or extract["catalog_id"] != capture["bulletin_catalog_id"]
            or extract["department_id"] != unit["id"]
        ):
            raise ValueError("Mixed source year")
        source(
            "bulletin-" + unit["id"],
            unit["url"],
            path.read_bytes(),
            YEAR,
            "bulletin_ssr",
        )
        for c in extract["records"]:
            code = f"{c['subjectCode']} {c['courseNumber']}"
            seen.append(code)
            credit = c.get("credits") or {}
            credit = credit.get("creditHours") or {}
            lo = credit.get("min")
            hi = credit.get("max")
            if lo is None or hi is None:
                excluded.append(dict(code=code, reason="missing_credit_range"))
                continue
            if Decimal(str(hi)) <= 0:
                excluded.append(dict(code=code, reason="non_credit"))
                continue
            if code in courses:
                if json.dumps(
                    courses[code]["source_record"], sort_keys=True, default=str
                ) != json.dumps(c, sort_keys=True, default=str):
                    conflicts.append(code)
                else:
                    courses[code]["evidence"].append(
                        reference(
                            "bulletin-" + unit["id"], code + " / " + c["id"], YEAR
                        )
                    )
                continue

            def hours(name):
                values = [
                    Decimal(str(x["contactHours"]))
                    for x in c["components"]
                    if x["name"] == name and x["contactHours"] is not None
                ]
                return str(sum(values)) if values else None

            raw = c.get("requirementGroup") or None
            courses[code] = dict(
                id="bmcc-bulletin-" + c["courseGroupId"],
                code=code,
                source_code=c["code"],
                prefix=c["subjectCode"],
                number=c["courseNumber"],
                title=c["longName"] or c["name"],
                description=plain(c["description"]),
                description_original=c["description"] or "",
                credits_min=str(lo),
                credits_max=str(hi),
                contact_hours=(
                    str(c["credits"]["contactHours"]["value"])
                    if c.get("credits", {}).get("contactHours", {}).get("value")
                    is not None
                    else None
                ),
                lecture_hours=hours("Lecture"),
                lab_hours=hours("Laboratory") or hours("Lab"),
                department_ids=c["departments"],
                designations=c["catalog_attributes"] or c["attributes"] or [],
                prerequisite=dict(raw_reference=str(raw) if raw else None),
                catalog_year=YEAR,
                effective_start=c.get("effectiveStartDate"),
                effective_end=c.get("effectiveEndDate"),
                evidence=[
                    reference("bulletin-" + unit["id"], code + " / " + c["id"], YEAR)
                ],
                source_record=c,
            )
    support = read(directory / "support.json")
    supp_by_code = {}
    for page_index, page in enumerate(support):
        page["source_id"] = "support-" + str(page_index)
        captured = {k: v for k, v in page.items() if k != "source_id"}
        source(
            page["source_id"],
            page["url"],
            json.dumps(captured, indent=2, ensure_ascii=False).encode(),
        )
        for row in page["rows"]:
            m = re.fullmatch(r"([A-Z]+)\s*0*(\d+(?:\.\d+)?[A-Za-z]?)", row["code"])
            if m:
                supp_by_code.setdefault(m[1] + " " + m[2], []).append((page, row))
    for code, c in courses.items():
        c.pop("source_record")
        for page, row in supp_by_code.get(code, []):
            # Preserve the complete original evidence block; never guess AND/OR or year.
            text = row["text"] or ""
            for field, pattern in [
                ("prerequisite", r"pre[- /]?requis|pre/co"),
                ("corequisite", r"co[- /]?requis"),
                ("minimum_grade", r"grade|\bGPA\b"),
                ("placement_permission", r"placement|permission|approval|test|COMPASS"),
                (
                    "enrollment_restrictions",
                    r"not open|cannot|may not|restricted|majors only",
                ),
                ("cross_listing", r"same as|cross.list|equivalent"),
            ]:
                if re.search(pattern, text, re.I):
                    old = c.get(field, {})
                    c[field] = dict(
                        text=text,
                        raw_reference=old.get("raw_reference"),
                        status="provisional",
                        evidence=[
                            reference(
                                page["source_id"],
                                "#" + row["locator"] + " / " + row["code"],
                            )
                        ],
                    )
    for code in set(conflicts):
        courses.pop(code, None)
    # Prefix relationships are observed many-to-many memberships, not inferred governance.
    for d in departments:
        d["prefixes"] = sorted(
            {c["prefix"] for c in courses.values() if d["id"] in c["department_ids"]}
        )
    exceptions = [
        "Bulletin is 2025-2026; current website program/department/support text has unconfirmed year. No year merge.",
        "All structured eligibility interpretations remain unresolved; no academic publication.",
        "Program department links mean page hosting only; degree requirements are not ingested.",
    ]
    exceptions.extend(
        "Conflicting duplicate excluded: " + code for code in sorted(set(conflicts))
    )
    snapshot = Snapshot.model_validate(
        dict(
            id=capture["snapshot_id"],
            catalog_year=YEAR,
            retrieved_on=capture["retrieved_on"],
            sources=sources,
            departments=departments,
            programs=programs,
            courses=sorted(courses.values(), key=lambda c: c["code"]),
            exceptions=exceptions,
        )
    )
    report = dict(
        snapshot_id=snapshot.id,
        source_units=len(inventory),
        academic_departments=sum(
            d.kind == "academic_department" for d in snapshot.departments
        ),
        program_listing_entries=len(programs),
        programs_by_credential={
            k: sum(p.credential == k for p in snapshot.programs)
            for k in ("AA", "AS", "AAS", "certificate", "microcredential")
        },
        course_listing_rows=len(seen),
        unique_listed_codes=len(set(seen)),
        imported_credit_courses=len(snapshot.courses),
        excluded=excluded,
        conflicting_codes=sorted(set(conflicts)),
        courses_with_description=sum(bool(c.description) for c in snapshot.courses),
        courses_with_prerequisite_text=sum(
            c.prerequisite.text is not None for c in snapshot.courses
        ),
        field_coverage={
            field: {
                "captured": sum(
                    getattr(c, field) is not None for c in snapshot.courses
                ),
                "denominator": len(snapshot.courses),
            }
            for field in ("contact_hours", "lecture_hours", "lab_hours")
        },
        rule_text_coverage={
            field: {
                "captured": sum(
                    getattr(c, field).text is not None for c in snapshot.courses
                ),
                "denominator": len(snapshot.courses),
            }
            for field in (
                "prerequisite",
                "corequisite",
                "minimum_grade",
                "placement_permission",
                "enrollment_restrictions",
                "cross_listing",
            )
        },
        verified_structured_rules=0,
        program_department_page_links=sum(
            bool(p.department_ids) for p in snapshot.programs
        ),
    )
    return snapshot, report
