"use client";
import "./explorer.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { browseGet, coursePage } from "@/lib/catalog/api";
import type {
  Course,
  Department,
  Program,
  Snapshot,
  Source,
} from "@/lib/catalog/api";
import {
  explorerURL,
  readExplorer,
  type ExplorerTarget,
  type ExplorerView,
} from "@/lib/catalog/navigation";
import type { Summary } from "@/lib/workspace/types";
import { programName } from "@/lib/workspace/registry";
import { CourseDetail } from "./course-detail";
const PathwayView = dynamic(
  () => import("./pathway-view").then((m) => m.PathwayView),
  { ssr: false, loading: () => <p role="status">Opening pathway…</p> },
);
function useResource<T>(path: string | null, attempt: number) {
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  }>({ key: "" });
  const key = path === null ? null : `${path}:${attempt}`;
  useEffect(() => {
    if (!path || !key) return;
    const controller = new AbortController();
    browseGet<T>(path, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error: "We couldn’t load this information. Please try again.",
          });
      });
    return () => controller.abort();
  }, [path, key]);
  return key === result.key
    ? result
    : { key: key ?? "", data: undefined, error: undefined };
}
const credentials: Record<string, string> = {
  AA: "Associate in Arts",
  AS: "Associate in Science",
  AAS: "Associate in Applied Science",
  certificate: "Certificate",
  microcredential: "Microcredential",
};
const views: Record<
  ExplorerView,
  { label: string; title: string; subtitle: string }
> = {
  departments: {
    label: "Departments",
    title: "Find your field.",
    subtitle: "Discover the subjects that spark your curiosity.",
  },
  programs: {
    label: "Programs",
    title: "A direction that feels like you.",
    subtitle: "Explore degrees, certificates, and new possibilities.",
  },
  courses: {
    label: "Courses",
    title: "Follow your curiosity.",
    subtitle: "Find a course. See where it could take you.",
  },
  pathways: {
    label: "Pathways",
    title: "See how learning connects.",
    subtitle: "Explore the steps behind a course.",
  },
};
export function AcademicExplorer({
  programMaps = [],
  openProgramMap,
}: {
  programMaps?: Summary[];
  openProgramMap?: (item: Summary) => void;
}) {
  const [target, setTarget] = useState<ExplorerTarget>({ view: "departments" }),
    [attempt, setAttempt] = useState(0),
    [draft, setDraft] = useState("");
  const historyRef = useRef<string[]>([]),
    heading = useRef<HTMLHeadingElement>(null);
  const sync = useCallback(() => {
    const next = readExplorer(window.location.search);
    setTarget(next);
    setDraft(next.q ?? "");
  }, []);
  useEffect(() => {
    void Promise.resolve().then(sync);
    window.addEventListener("popstate", sync);
    window.addEventListener("explorer:navigate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("explorer:navigate", sync);
    };
  }, [sync]);
  function go(next: ExplorerTarget, focus = true) {
    historyRef.current.push(window.location.href);
    window.history.pushState(null, "", explorerURL(window.location.href, next));
    setTarget(next);
    setDraft(next.q ?? "");
    if (focus) window.requestAnimationFrame(() => heading.current?.focus());
  }
  function back() {
    const previous = historyRef.current.pop();
    if (previous) {
      window.history.pushState(null, "", previous);
      sync();
    } else go({ view: target.view, edition: target.edition });
    heading.current?.focus();
  }
  const index = useResource<Snapshot[]>("snapshots", attempt);
  const snapshots = Array.isArray(index.data)
    ? index.data.filter((s) => s.campus_id === "bmcc")
    : [];
  // Browsing defaults to latest retained edition; this NEVER assigns an audit catalog.
  const edition = target.edition ?? snapshots.at(-1)?.snapshot_id;
  const selectedEdition = snapshots.find((s) => s.snapshot_id === edition);
  const root = edition ? encodeURIComponent(edition) : null;
  const depts = useResource<Department[]>(
    root ? `${root}/departments` : null,
    attempt,
  );
  const programs = useResource<Program[]>(
    root ? `${root}/programs` : null,
    attempt,
  );
  const sources = useResource<Source[]>(
    root ? `${root}/sources` : null,
    attempt,
  );
  const departments = Array.isArray(depts.data) ? depts.data : [],
    programList = Array.isArray(programs.data) ? programs.data : [];
  const department = departments.find((d) => d.id === target.department),
    program = programList.find((p) => p.id === target.program);
  const coursesNeeded = target.view === "courses" || !!department;
  const listPath =
    root && coursesNeeded
      ? `${root}/courses?${new URLSearchParams({ q: target.q ?? "", department: target.department ?? "", offset: String(target.offset ?? 0), limit: "20" })}`
      : null;
  const list = useResource<unknown>(listPath, attempt);
  let page: ReturnType<typeof coursePage> | null = null,
    invalid = false;
  if (list.data && edition) {
    try {
      page = coursePage(list.data, edition);
    } catch {
      invalid = true;
    }
  }
  const selected = useResource<Course>(
    root && target.course
      ? `${root}/courses/${encodeURIComponent(target.course)}`
      : null,
    attempt,
  );
  let course: Course | undefined;
  if (selected.data && edition && selectedEdition) {
    try {
      course = coursePage(
        {
          snapshot_id: edition,
          catalog_year: selectedEdition.catalog_year,
          total: 1,
          offset: 0,
          limit: 1,
          items: [selected.data],
        },
        edition,
      ).items[0];
    } catch {
      invalid = true;
    }
  }
  const error =
    index.error ||
    depts.error ||
    programs.error ||
    sources.error ||
    (coursesNeeded && list.error) ||
    selected.error ||
    (invalid
      ? "This course information couldn’t be displayed. Please try again."
      : "");
  const pending =
    (!index.data && !index.error) ||
    (!!root && (!depts.data || !programs.data || !sources.data)) ||
    (!!root && coursesNeeded && !page && !list.error);
  const query = (target.q ?? "").toLowerCase();
  const collection =
    target.view === "departments"
      ? departments.filter((d) => d.name.toLowerCase().includes(query))
      : programList.filter((p) =>
          `${p.name} ${p.credential}`.toLowerCase().includes(query),
        );
  function selectCourse(c: Course) {
    go({ ...target, course: c.id, edition }, false);
  }
  function closeCourse() {
    const next = { ...target };
    delete next.course;
    window.history.replaceState(
      null,
      "",
      explorerURL(window.location.href, next),
    );
    setTarget(next);
  }
  const title = department?.name ?? program?.name ?? views[target.view].title;
  const clean = { view: target.view, edition } as ExplorerTarget;
  return (
    <section className="academic-explorer" aria-label="Academic Explorer">
      <nav aria-label="Explorer breadcrumbs" className="explorer-breadcrumbs">
        <button onClick={() => go({ view: "departments", edition })}>
          BMCC
        </button>
        <span aria-hidden="true">/</span>
        <button onClick={() => go(clean)}>{views[target.view].label}</button>
        {(department || program) && (
          <>
            <span aria-hidden="true">/</span>
            <span>{department?.name ?? program?.name}</span>
          </>
        )}
      </nav>
      <div className="explorer-heading">
        <div>
          <p className="explorer-kicker">Explore your possibilities</p>
          <h2 ref={heading} tabIndex={-1}>
            {title}
          </h2>
          <p>
            {department
              ? `Explore ${department.prefixes.join(", ") || "available"} courses with this department.`
              : program
                ? (credentials[program.credential] ?? program.credential)
                : views[target.view].subtitle}
          </p>
        </div>
        {index.data && snapshots.length > 0 && (
          <label className="explorer-year">
            Catalog year
            <select
              aria-label="Explorer catalog year"
              value={edition ?? ""}
              onChange={(e) =>
                go({ view: target.view, edition: e.target.value })
              }
            >
              {snapshots.map((s) => (
                <option key={s.snapshot_id} value={s.snapshot_id}>
                  {s.catalog_year.replace("-", "–")}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <nav className="explorer-tabs" aria-label="Explore academics">
        {Object.entries(views).map(([view, v]) => (
          <button
            key={view}
            aria-current={target.view === view ? "page" : undefined}
            onClick={() => go({ view: view as ExplorerView, edition })}
          >
            {v.label}
          </button>
        ))}
      </nav>
      {(department || program || target.course) && (
        <button className="explorer-text-button explorer-back" onClick={back}>
          ← Back to {views[target.view].label.toLowerCase()}
        </button>
      )}
      {error ? (
        <div className="explorer-empty" role="alert">
          <span className="explorer-empty-icon">↻</span>
          <h3>Let’s try that again.</h3>
          <p>{error}</p>
          <button
            className="explorer-primary"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </button>
        </div>
      ) : pending ? (
        <div className="explorer-loading" role="status">
          <span />
          Finding your next possibility…
        </div>
      ) : !snapshots.length ? (
        <div className="explorer-empty" role="status">
          <h3>The catalog isn’t available yet.</h3>
          <p>Please check back soon.</p>
        </div>
      ) : !selectedEdition ? (
        <div className="explorer-empty" role="alert">
          <h3>This catalog year isn’t available.</h3>
          <button
            className="explorer-primary"
            onClick={() => go({ view: target.view })}
          >
            Explore available catalog
          </button>
        </div>
      ) : (target.department && !department) || (target.program && !program) ? (
        <div className="explorer-empty" role="alert">
          <h3>
            We couldn’t find that {target.department ? "department" : "program"}
            .
          </h3>
          <button className="explorer-primary" onClick={() => go(clean)}>
            Explore {views[target.view].label.toLowerCase()}
          </button>
        </div>
      ) : (
        <>
          {target.view === "programs" && !program && programMaps.length > 0 && (
            <section aria-label="Supported program maps">
              <h3 className="font-semibold mb-3">Explore a program map</h3>
              <p className="text-sm text-muted mb-4">
                Separate draft editions with limited requirements. These do not
                use the browsing catalog year above.
              </p>
              <div className="explorer-collection-grid">
                {programMaps
                  .filter((p) => p.campus_id === "bmcc")
                  .map((p) => (
                    <button
                      key={p.release_id}
                      className="explorer-collection-card"
                      onClick={() => openProgramMap?.(p)}
                    >
                      <h3>{programName(p.program_id)}</h3>
                      <span>{p.catalog_year} · Draft degree map ↗</span>
                    </button>
                  ))}
              </div>
            </section>
          )}
          {target.view !== "pathways" && !program && (
            <form
              className="explorer-search"
              onSubmit={(e) => {
                e.preventDefault();
                go({ ...target, q: draft.trim(), offset: 0 });
              }}
            >
              <span aria-hidden="true">⌕</span>
              <input
                aria-label={`Search ${department ? "department courses" : views[target.view].label.toLowerCase()}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={120}
                placeholder={
                  department || target.view === "courses"
                    ? "Search by course, title, or interest…"
                    : `Search ${views[target.view].label.toLowerCase()}…`
                }
              />
              <button type="submit">Search</button>
            </form>
          )}
          {department && (
            <div className="explorer-context-note">
              <h3>Find your next course</h3>
              <p>
                Browse this department’s courses below. Program connections
                haven’t been confirmed yet.
              </p>
              {"url" in department &&
                typeof department.url === "string" &&
                department.url.startsWith("https://") && (
                  <a href={department.url} target="_blank" rel="noreferrer">
                    Visit the department ↗
                  </a>
                )}
            </div>
          )}
          {program ? (
            <div className="program-overview">
              <div className="program-monogram" aria-hidden="true">
                {program.credential}
              </div>
              <h3>Your next chapter starts with a question.</h3>
              <p>Read about {program.name} on BMCC’s official program page.</p>
              <a
                className="explorer-primary"
                href={
                  program.url.startsWith("https://") ? program.url : undefined
                }
                target="_blank"
                rel="noreferrer"
              >
                Explore this program ↗
              </a>
              <div className="explorer-context-note">
                <h4>Explore courses independently</h4>
                <p>
                  Courses for this program haven’t been confirmed here yet. You
                  can still discover courses across BMCC.
                </p>
                <button
                  className="explorer-text-button"
                  onClick={() => go({ view: "courses", edition })}
                >
                  Browse all courses →
                </button>
              </div>
            </div>
          ) : target.view === "pathways" ? (
            target.demo ? (
              <>
                <div className="explorer-section-top">
                  <button
                    className="explorer-text-button"
                    onClick={() => go({ view: "pathways", edition })}
                  >
                    ← Back to BMCC pathways
                  </button>
                </div>
                <PathwayView />
              </>
            ) : (
              <div className="explorer-empty pathway-empty">
                <span className="explorer-empty-icon" aria-hidden="true">
                  ⌘
                </span>
                <h3>
                  {course
                    ? `${course.code}: a pathway to explore.`
                    : "Every course is part of a bigger picture."}
                </h3>
                <p>
                  A verified pathway {course ? "for this course " : ""}isn’t
                  available yet. Course descriptions and preparation notes are
                  available in Courses.
                </p>
                <div className="explorer-empty-actions">
                  <button
                    className="explorer-primary"
                    onClick={() => go({ view: "courses", edition })}
                  >
                    Explore courses
                  </button>
                  <button
                    className="explorer-secondary"
                    onClick={() =>
                      go({ view: "pathways", edition, demo: true })
                    }
                  >
                    Try a fictional pathway
                  </button>
                </div>
              </div>
            )
          ) : coursesNeeded ? (
            <>
              <div className="explorer-section-top">
                <p role="status">
                  {page?.total ?? 0} courses
                  {department ? ` · ${department.name}` : " to discover"}
                </p>
              </div>
              <div className="explorer-course-grid">
                {page?.items.map((c) => (
                  <button
                    className="explorer-course-card"
                    key={c.id}
                    onClick={() => selectCourse(c)}
                    aria-label={`View ${c.code}: ${c.title}`}
                  >
                    <span className="explorer-course-top">
                      <strong>{c.code}</strong>
                      <span>
                        {c.credits_min === c.credits_max
                          ? c.credits_min
                          : `${c.credits_min}–${c.credits_max}`}{" "}
                        cr.
                      </span>
                    </span>
                    <h3>{c.title}</h3>
                    <span className="course-card-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
              {page?.items.length === 0 && (
                <div className="explorer-empty">
                  <h3>No courses found.</h3>
                  <p>Try a different course code or interest.</p>
                </div>
              )}
              <div className="explorer-pagination">
                <button
                  disabled={!target.offset}
                  onClick={() =>
                    go({
                      ...target,
                      offset: Math.max(0, (target.offset ?? 0) - 20),
                    })
                  }
                >
                  ← Previous
                </button>
                <span>
                  {page?.total
                    ? `${(target.offset ?? 0) + 1}–${Math.min((target.offset ?? 0) + 20, page.total)} of ${page.total}`
                    : "0 results"}
                </span>
                <button
                  disabled={!page || (target.offset ?? 0) + 20 >= page.total}
                  onClick={() =>
                    go({ ...target, offset: (target.offset ?? 0) + 20 })
                  }
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="explorer-section-top">
                <p role="status">
                  {collection.length} {views[target.view].label.toLowerCase()}
                </p>
              </div>
              <div className="explorer-collection-grid">
                {collection.map((item, index) => (
                  <button
                    key={item.id}
                    className="explorer-collection-card"
                    onClick={() =>
                      go({
                        ...clean,
                        [target.view === "departments"
                          ? "department"
                          : "program"]: item.id,
                      })
                    }
                  >
                    <span
                      className={`collection-symbol collection-symbol--${index % 4}`}
                      aria-hidden="true"
                    >
                      {target.view === "departments"
                        ? "✧"
                        : (item as Program).credential}
                    </span>
                    <h3>{item.name}</h3>
                    <span>
                      {target.view === "departments"
                        ? "Explore courses"
                        : credentials[(item as Program).credential]}
                    </span>
                    <span className="collection-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
              {collection.length === 0 && (
                <div className="explorer-empty">
                  <h3>No matches yet.</h3>
                  <p>Try a different subject or interest.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
      {target.course && !course && !selected.error && (
        <p role="status">Opening course details…</p>
      )}
      {course && target.view !== "pathways" && (
        <CourseDetail
          key={course.id}
          course={course}
          sources={Array.isArray(sources.data) ? sources.data : []}
          close={closeCourse}
          pathway={() => go({ view: "pathways", course: course!.id, edition })}
        />
      )}
    </section>
  );
}
