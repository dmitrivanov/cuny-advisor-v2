"use client";
import { useEffect, useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { browseGet, coursePage } from "@/lib/catalog/api";
import type {
  Snapshot,
  Department,
  Program,
  Source,
  CoursePage,
  Evidence,
  Rule,
} from "@/lib/catalog/api";
function CourseBrowserContent() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]),
    [snapshot, setSnapshot] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]),
    [programs, setPrograms] = useState<Program[]>([]),
    [sources, setSources] = useState<Source[]>([]);
  const [draft, setDraft] = useState(""),
    [query, setQuery] = useState(""),
    [department, setDepartment] = useState(""),
    [offset, setOffset] = useState(0),
    [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState<CoursePage | null>(null),
    [error, setError] = useState(""),
    [indexLoading, setIndexLoading] = useState(true);
  const [completedKey, setCompletedKey] = useState("");
  const key = JSON.stringify([snapshot, query, department, offset, attempt]);
  const loading = indexLoading || (!!snapshot && completedKey !== key);
  useEffect(() => {
    const controller = new AbortController();
    browseGet<Snapshot[]>("snapshots", controller.signal)
      .then((items) => {
        if (
          !Array.isArray(items) ||
          items.some(
            (i) => i.campus_id !== "bmcc" || typeof i.snapshot_id !== "string",
          )
        )
          throw new Error("Invalid BMCC snapshots");
        if (!controller.signal.aborted) {
          setSnapshots(items);
          setIndexLoading(false);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setIndexLoading(false);
        }
      });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    if (!snapshot) return;
    const controller = new AbortController();
    Promise.all([
      browseGet<unknown>(
        `${snapshot}/courses?${new URLSearchParams({ q: query, department, offset: String(offset), limit: "20" })}`,
        controller.signal,
      ).then((v) => coursePage(v, snapshot)),
      browseGet<Department[]>(`${snapshot}/departments`, controller.signal),
      browseGet<Program[]>(`${snapshot}/programs`, controller.signal),
      browseGet<Source[]>(`${snapshot}/sources`, controller.signal),
    ])
      .then(([p, d, pr, s]) => {
        if (controller.signal.aborted) return;
        if (![d, pr, s].every(Array.isArray))
          throw new Error("Invalid browsing metadata");
        setPage(p);
        setDepartments(d);
        setPrograms(pr);
        setSources(s);
        setCompletedKey(key);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setCompletedKey(key);
        }
      });
    return () => controller.abort();
  }, [snapshot, query, department, offset, attempt, key]);
  function evidence(refs: Evidence[]) {
    return refs.map((e, i) => {
      const source = sources.find((s) => s.id === e.source_id);
      return (
        <p key={`${e.source_id}-${i}`} className="text-xs text-muted">
          {source && /^https:\/\//.test(source.url) ? (
            <a
              href={source.url}
              className="source-link"
              target="_blank"
              rel="noreferrer"
            >
              Official source
            </a>
          ) : (
            "Source reference"
          )}{" "}
          · {e.locator} · {e.catalog_year ?? "Year unconfirmed"}
          {source ? ` · retrieved ${source.retrieved_on}` : ""}
        </p>
      );
    });
  }
  function rule(label: string, r: Rule) {
    return (
      <details className="class-details">
        <summary>
          {label} · {r.status.replaceAll("_", " ")}
        </summary>
        <div className="space-y-2 text-sm">
          <p>
            {r.text ??
              "No usable rule text captured. Eligibility remains unresolved; absence is not permission."}
          </p>
          {r.raw_reference && (
            <p>Unresolved source reference: {r.raw_reference}</p>
          )}
          <p>
            Structured interpretation:{" "}
            {r.expression.op === "unknown"
              ? "unresolved"
              : "source-verified representation; not an eligibility decision"}
            . Academic review required.
          </p>
          {r.status === "provisional" && (
            <p>
              Supporting evidence candidate only. Catalog-year applicability and
              interpretation are unconfirmed.
            </p>
          )}
          {evidence(r.evidence)}
        </div>
      </details>
    );
  }
  return (
    <section
      aria-labelledby="browse-heading"
      className="my-6 space-y-5 border-b border-line pb-8"
    >
      <h2 id="browse-heading" className="text-xl font-semibold">
        BMCC source catalog
      </h2>
      <p className="workspace-notice">
        Browse course facts independently of the draft degree tools below.
        Program identities do not establish degree requirements. Source
        verification is not institutional approval; no registration or
        eligibility decision.
      </p>
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading source catalog…</p>}
      {!loading && !error && !snapshots.length && (
        <p role="status">
          No browsing snapshots imported. Run the explicit reviewed BMCC catalog
          import.
        </p>
      )}
      <label className="field-label">
        Browsing snapshot
        <select
          className="workspace-input max-w-full"
          aria-label="Browsing snapshot"
          value={snapshot}
          onChange={(e) => {
            setError("");
            setSnapshot(e.target.value);
            setDepartments([]);
            setPrograms([]);
            setSources([]);
            setOffset(0);
            setDepartment("");
            setPage(null);
          }}
        >
          <option value="">Choose a catalog year explicitly</option>
          {snapshots.map((s) => (
            <option key={s.snapshot_id} value={s.snapshot_id}>
              {s.catalog_year} · {s.snapshot_id}
            </option>
          ))}
        </select>
      </label>
      {snapshot && (
        <>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              setQuery(draft.trim());
              setOffset(0);
            }}
          >
            <label className="field-label grow">
              Search BMCC courses
              <input
                className="workspace-input max-w-full"
                value={draft}
                maxLength={120}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Course code, title or description"
              />
            </label>
            <GlassButton type="submit">Search courses</GlassButton>
          </form>
          <label className="field-label">
            Offering department / unit
            <select
              className="workspace-input max-w-full"
              value={department}
              onChange={(e) => {
                setError("");
                setDepartment(e.target.value);
                setOffset(0);
              }}
            >
              <option value="">All offering units</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <details>
            <summary>Departments and program identities</summary>
            <p className="text-sm text-muted">
              Website identities have unconfirmed catalog-year applicability.
              Page-host relationships are not verified academic governance
              assignments. Degree requirements await Phase 04C-2.
            </p>
            <ul className="my-3 space-y-2">
              {departments.map((d) => (
                <li key={d.id}>
                  {d.name} · {d.kind.replaceAll("_", " ")} · observed subjects:{" "}
                  {d.prefixes.join(", ") || "not captured"}
                </li>
              ))}
            </ul>
            <ul className="space-y-2">
              {programs.map((p) => (
                <li key={p.id}>
                  {p.name} · {p.credential} · requirements pending · year{" "}
                  {p.catalog_year ?? "unconfirmed"}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
      {error && (
        <GlassButton
          variant="secondary"
          onClick={() => {
            setError("");
            setIndexLoading(true);
            setAttempt((n) => n + 1);
          }}
        >
          Retry BMCC source catalog
        </GlassButton>
      )}
      {page && !loading && !error && (
        <>
          <p role="status">
            {page.total} courses match · {page.catalog_year} · facts
            source-verified, rules require review.
          </p>
          {!page.items.length && <p>No courses match this search.</p>}
          <div className="space-y-4">
            {page.items.map((c) => (
              <article key={c.id} className="glass-card rounded-card p-5">
                <h3 className="font-semibold">
                  {c.code} · {c.title}
                </h3>
                <p className="text-sm text-muted">
                  Credits:{" "}
                  {c.credits_min === c.credits_max
                    ? c.credits_min
                    : `${c.credits_min}–${c.credits_max}`}{" "}
                  · contact hours: {c.contact_hours ?? "not captured"} ·
                  lecture: {c.lecture_hours ?? "not captured"} · lab:{" "}
                  {c.lab_hours ?? "not captured"}
                </p>
                <details className="my-3">
                  <summary>
                    Course description and source details for {c.code}
                  </summary>
                  <p className="my-3 whitespace-pre-line text-sm">
                    {c.description}
                  </p>
                  {c.designations.length > 0 && (
                    <p className="text-xs text-muted">
                      Captured designations: {c.designations.join("; ")}. No
                      transfer equivalence is inferred.
                    </p>
                  )}
                  {evidence(c.evidence)}
                  {rule("Prerequisites", c.prerequisite)}
                  {rule("Corequisites", c.corequisite)}
                  {rule("Minimum-grade evidence", c.minimum_grade)}
                  {rule(
                    "Placement / permission evidence",
                    c.placement_permission,
                  )}
                  {rule(
                    "Enrollment restriction evidence",
                    c.enrollment_restrictions,
                  )}
                  {rule("Cross-listing evidence", c.cross_listing)}
                </details>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <GlassButton
              variant="secondary"
              disabled={offset === 0}
              onClick={() => {
                setError("");
                setOffset((n) => Math.max(0, n - 20));
              }}
            >
              Previous courses
            </GlassButton>
            <GlassButton
              variant="secondary"
              disabled={offset + 20 >= page.total}
              onClick={() => {
                setError("");
                setOffset((n) => n + 20);
              }}
            >
              Next courses
            </GlassButton>
          </div>
        </>
      )}
    </section>
  );
}

export function BmccCourseBrowser() {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="my-6 border-b border-line pb-6"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="text-lg font-semibold">
        Browse BMCC source catalog
      </summary>
      {open && <CourseBrowserContent />}
    </details>
  );
}
