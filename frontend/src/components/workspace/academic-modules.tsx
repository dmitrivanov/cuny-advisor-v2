"use client";
import { useState } from "react";
import type { Dispatch } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { getProgress } from "@/lib/workspace/api";
import { previewBody } from "@/lib/workspace/state";
import type { Action } from "@/lib/workspace/state";
import type {
  Catalog,
  Course,
  Progress,
  Result,
  Summary,
  WorkspaceState,
} from "@/lib/workspace/types";

function CourseLabel({ course }: { course: Course }) {
  return (
    <>
      <strong>{course.code}</strong> · {course.title}
      <span className="block text-xs text-muted">
        {course.credits ?? "Unknown"} catalog credits · {course.identity.id}
      </span>
    </>
  );
}
function Reason({ result }: { result: Result }) {
  return (
    <div className="mt-2 border-l border-line pl-3">
      <span className={`outcome outcome--${result.status}`}>
        {result.status}
      </span>
      <span className="ml-2 text-sm">{result.reason.replaceAll("_", " ")}</span>
      {result.source_ids?.length ? (
        <p className="mt-1 text-xs text-muted">
          Sources: {result.source_ids.join(", ")}
        </p>
      ) : null}
      {result.children.map((child, index) => (
        <Reason key={index} result={child} />
      ))}
    </div>
  );
}
export function CatalogExplorer({
  catalog,
  state,
  dispatch,
}: {
  catalog: Catalog;
  state: WorkspaceState;
  dispatch: Dispatch<Action>;
}) {
  const [search, setSearch] = useState("");
  const courses = catalog.release.courses.filter((course) =>
    `${course.code} ${course.title}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Read-only persisted draft ·{" "}
        {catalog.release.campus_id === "bmcc" && catalog.release.program.id === "bmcc-program-cis-aas"
          ? "CIS is a partial reference. Missing groups, elective metadata and credit values remain unresolved."
          : "Reference data retains provisional and unresolved interpretations."}
      </p>
      <label className="field-label">
        Find a catalog course
        <input
          className="workspace-input"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <p role="status" className="text-sm text-muted">
        {courses.length} catalog courses shown
      </p>
      <div className="space-y-3">
        {courses.map((course) => (
          <details className="course-detail" key={course.identity.id}>
            <summary>
              <CourseLabel course={course} />
            </summary>
            <div className="mt-4 space-y-3 text-sm">
              <p>Version: {course.version_id}</p>
              <p>
                Evidence: {course.source_ids.join(", ")}. No course availability
                or registration is implied.
              </p>
              <GlassButton
                variant="secondary"
                onClick={() =>
                  dispatch({ type: "toggle", course: course.identity.id })
                }
              >
                {state.selected.includes(course.identity.id)
                  ? "Remove hypothetical selection"
                  : "Include in hypothetical selection"}
              </GlassButton>
            </div>
          </details>
        ))}
      </div>
      <h3 className="text-lg font-semibold">Requirements & categories</h3>
      {catalog.columns.map((column) => (
        <section key={column.title}>
          <h4 className="font-semibold text-brand">{column.title}</h4>
          {column.groups.length ? (
            column.groups.map((group) => (
              <p className="mt-2 text-sm" key={group.requirement_id}>
                {group.label} · {group.kind} · target{" "}
                {group.target_credits ?? "unspecified"} credits
              </p>
            ))
          ) : (
            <p className="text-sm text-muted">
              No requirement groups captured.
            </p>
          )}
        </section>
      ))}
      <details className="course-detail">
        <summary>Source evidence & unresolved information</summary>
        <ul className="mt-4 space-y-4">
          {catalog.release.sources.map((source) => (
            <li key={source.id} className="text-sm">
              <strong>{source.id}</strong> · {source.state.replaceAll("_", " ")}{" "}
              · academic review {source.academic_review}
              <p>
                {source.section} · retrieved {source.retrieved_on} · catalog
                year{" "}
                {source.year_confirmed ? "source-confirmed" : "unconfirmed"}
              </p>
              <p className="text-muted">{source.note}</p>
              {source.conflicts_with.length > 0 && (
                <p>Conflicts: {source.conflicts_with.join(", ")}</p>
              )}
              {source.url?.startsWith("https://") && (
                <a
                  className="source-link"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Official source locator ↗
                </a>
              )}
            </li>
          ))}
        </ul>
        {catalog.release.issues.map((issue, index) => (
          <p key={index} className="mt-3 text-sm">
            {issue}
          </p>
        ))}
        <p className="mt-4 text-sm font-semibold">
          Source verification is not institutional approval. Raw source
          artifacts have not been captured.
        </p>
      </details>
    </div>
  );
}
export function CompletedCourses({
  state,
  dispatch,
}: {
  state: WorkspaceState;
  dispatch: Dispatch<Action>;
}) {
  const [search, setSearch] = useState("");
  const catalog = state.catalog!;
  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Hypothetical passed courses only. A shared course has one selection
        across all columns. Columns show referenced course pools; not every
        listed course is necessarily required. Selection neither allocates
        credit nor waives prerequisites.
      </p>
      <label className="field-label mb-5">
        Filter completed-course options
        <input
          className="workspace-input"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="selector-grid">
        {catalog.columns.map((column, columnIndex) => (
          <section className="selector-column" key={column.title}>
            <h3 className="mb-4 font-semibold">{column.title}</h3>
            {column.groups.length === 0 && (
              <p className="text-sm text-muted">
                No groups captured in this partial release.
              </p>
            )}
            {column.groups.map((group, groupIndex) => (
              <fieldset className="mb-5 min-w-0" key={group.requirement_id}>
                <legend className="mb-2 text-sm font-semibold text-brand">
                  {group.label}
                </legend>
                <p className="mb-2 text-xs text-muted">
                  {group.kind} · target {group.target_credits ?? "unknown"}{" "}
                  credits
                </p>
                <p className="mb-2 text-xs text-muted">
                  {group.condition_label}
                </p>
                {group.course_ids.length === 0 && (
                  <p className="text-sm text-muted">
                    Course pool not captured; review catalog evidence.
                  </p>
                )}
                {group.course_ids.map((id) => {
                  const course = catalog.release.courses.find(
                    (course) => course.identity.id === id,
                  );
                  if (
                    !course ||
                    !`${course.code} ${course.title}`
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                    return null;
                  return (
                    <label
                      key={id}
                      className="course-choice"
                      htmlFor={`course-${columnIndex}-${groupIndex}-${id}`}
                    >
                      <input
                        id={`course-${columnIndex}-${groupIndex}-${id}`}
                        type="checkbox"
                        checked={state.selected.includes(id)}
                        onChange={() =>
                          dispatch({ type: "toggle", course: id })
                        }
                      />
                      <span>
                        <CourseLabel course={course} />
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            ))}
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-card border border-line bg-soft p-5">
        <h3 className="font-semibold">
          Selected once · {state.selected.length} courses
        </h3>
        <p className="mt-2 text-sm text-muted">
          Explicit optional allocations below feed the deterministic preview. No
          automatic allocation or credit splitting is performed. Credits are
          exact strings; enter the amount to propose.
        </p>
        {state.selected.length === 0 && (
          <p className="mt-3 text-sm">No courses selected yet.</p>
        )}
        {state.selected.map((id) => {
          const course = catalog.release.courses.find(
            (course) => course.identity.id === id,
          )!;
          const value = state.assignments[id] ?? {
            requirement_id: "",
            credits: "",
          };
          const groups = catalog.columns
            .flatMap((column) => column.groups)
            .filter((group) => group.course_ids.includes(id));
          return (
            <div className="mt-5 border-t border-line pt-4" key={id}>
              <p className="mb-3 text-sm">
                <CourseLabel course={course} />
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field-label">
                  Apply {course.code} to
                  <select
                    className="workspace-input"
                    value={value.requirement_id}
                    onChange={(event) =>
                      dispatch({
                        type: "assign",
                        course: id,
                        value: { ...value, requirement_id: event.target.value },
                      })
                    }
                  >
                    <option value="">No allocation proposed</option>
                    {groups.map((group) => (
                      <option
                        key={group.requirement_id}
                        value={group.requirement_id}
                      >
                        {group.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Proposed credits for {course.code}
                  <input
                    className="workspace-input"
                    inputMode="decimal"
                    value={value.credits}
                    disabled={!value.requirement_id}
                    placeholder="Enter exact credits"
                    onChange={(event) =>
                      dispatch({
                        type: "assign",
                        course: id,
                        value: { ...value, credits: event.target.value },
                      })
                    }
                  />
                </label>
              </div>
              <button
                className="source-link mt-2 text-sm"
                onClick={() => dispatch({ type: "toggle", course: id })}
              >
                Remove {course.code}
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
export function DegreeProgress({
  state,
  summary,
}: {
  state: WorkspaceState;
  summary: Summary;
}) {
  const [assumed, setAssumed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<{
    key: string;
    value?: Progress;
    error?: string;
  } | null>(null);
  const key = JSON.stringify([summary, previewBody(state)]);
  async function run() {
    setBusy(true);
    try {
      setResponse({ key, value: await getProgress(summary, state) });
    } catch (error) {
      setResponse({
        key,
        error: error instanceof Error ? error.message : "Preview failed",
      });
    } finally {
      setBusy(false);
    }
  }
  const current = response?.key === key ? response : null;
  const snapshot = current?.value?.snapshot;
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Limited deterministic preview · {state.selected.length} selected
        courses. This is not a complete graduation audit. Missing grades, source
        conflicts, STEM allocation and partial CIS data remain unresolved.
        Prerequisites are evaluated separately.
      </p>
      <label className="course-choice">
        <input
          type="checkbox"
          checked={assumed}
          onChange={(event) => setAssumed(event.target.checked)}
        />
        <span className="text-sm">
          For this fictional scenario only, assume my selected courses were
          passed at their captured catalog credits. Grades remain unknown. This
          does not verify a student record.
        </span>
      </label>
      <GlassButton onClick={run} disabled={!assumed || busy}>
        {busy ? "Evaluating hypothetical inputs…" : "Run deterministic preview"}
      </GlassButton>
      {!response && (
        <p className="text-sm text-muted">
          No evaluation yet. Use Completed Courses to select courses and
          optionally propose allocations.
        </p>
      )}
      {response && !current && (
        <p role="status">
          Context or selection changed. Run a fresh preview; previous results
          are hidden.
        </p>
      )}
      {current?.error && (
        <p role="alert" className="workspace-notice">
          {current.error}
        </p>
      )}
      {current?.value && (
        <div aria-live="polite">
          <p className="workspace-notice">{current.value.limitation}</p>
          {current.value.issues.map((issue) => (
            <p key={issue} className="mt-3 text-sm">
              Unresolved: {issue}
            </p>
          ))}
          {snapshot && (
            <>
              <dl className="my-5 grid grid-cols-2 gap-3">
                <div className="metric">
                  <dt>Hypothetical unique earned credits</dt>
                  <dd>{snapshot.earned_credits}</dd>
                </div>
                <div className="metric">
                  <dt>Validated allocated credits</dt>
                  <dd>{snapshot.allocated_credits}</dd>
                </div>
              </dl>
              <p className="mb-4 text-sm">
                Engine {snapshot.engine_version} · overall degree status:
                unresolved
              </p>
              {snapshot.issues.map((issue, index) => (
                <p key={index} className="mb-3 text-sm">
                  Issue: {issue}
                </p>
              ))}
              <h3 className="text-lg font-semibold">Requirement outcomes</h3>
              {snapshot.results.map((item) => (
                <details
                  className="course-detail mt-3"
                  key={item.requirement_id}
                >
                  <summary>
                    {state.catalog?.release.requirements.find(
                      (req) => req.id === item.requirement_id,
                    )?.label ?? item.requirement_id}{" "}
                    · {item.result.status} · {item.kind}
                  </summary>
                  <Reason result={item.result} />
                </details>
              ))}
              <h3 className="mb-2 mt-6 text-lg font-semibold">
                Unresolved program constraints
              </h3>
              {snapshot.constraints.map((result, index) => (
                <Reason key={index} result={result} />
              ))}
              <details className="course-detail mt-6">
                <summary>
                  Prerequisite checks · separate from degree satisfaction
                </summary>
                {current.value.prerequisites.map((item) => (
                  <div key={item.course_id} className="mt-4">
                    <p className="font-semibold">
                      {state.catalog?.release.courses.find(
                        (course) => course.identity.id === item.course_id,
                      )?.code ?? item.course_id}
                    </p>
                    <Reason result={item.prerequisite} />
                  </div>
                ))}
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}
