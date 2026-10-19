"use client";
import { useState } from "react";
import type { Dispatch } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import type { PreviewController } from "./use-preview";
import {
  courseTitle,
  selectorColumns,
  studentReason,
} from "@/lib/workspace/presentation";
import type { Action } from "@/lib/workspace/state";
import type {
  Catalog,
  Course,
  Group,
  Result,
  RuleExpression,
  WorkspaceState,
} from "@/lib/workspace/types";

function CourseLabel({ course }: { course: Course }) {
  return (
    <>
      <strong className="course-code">{course.code}</strong>
      <span className="course-title">{courseTitle(course)}</span>
    </>
  );
}
function Condition({
  expression,
  catalog,
}: {
  expression: RuleExpression;
  catalog: Catalog;
}) {
  const name = (id: string) =>
    catalog.release.courses.find((course) => course.identity.id === id)?.code ??
    "Course reference unavailable";
  switch (expression.op) {
    case "completed":
      return (
        <span>
          {name(expression.course_id)}
          {expression.minimum_grade_rank !== null
            ? " (minimum grade condition; grade remains unknown)"
            : ""}
        </span>
      );
    case "all":
    case "any":
      return (
        <div>
          <p>{expression.op === "all" ? "All of:" : "Any of:"}</p>
          <ul className="list-disc pl-5">
            {expression.children.map((child, index) => (
              <li key={index}>
                <Condition expression={child} catalog={catalog} />
              </li>
            ))}
          </ul>
        </div>
      );
    case "credits":
      return (
        <span>
          {expression.minimum} credits from{" "}
          {expression.eligible.map(name).join(", ")}
        </span>
      );
    case "unknown":
      return <span>Unresolved: {expression.reason.replaceAll("_", " ")}</span>;
    case "no_conditions":
      return <span>No conditions in the captured rule.</span>;
    case "discipline_cap":
      return <span>Discipline course cap: {expression.maximum}</span>;
  }
}
function ClassDetails({
  course,
  catalog,
  group,
}: {
  course: Course;
  catalog: Catalog;
  group: Group;
}) {
  return (
    <details className="class-details">
      <summary>
        Class details<span className="sr-only"> for {course.code}</span>
      </summary>
      <div className="space-y-2 text-xs text-muted">
        <p>Catalog credits: {course.credits ?? "Not captured"}</p>
        <p>
          {group.kind} · target {group.target_credits ?? "not captured"}{" "}
          credits. {group.condition_label}
        </p>
        <p>
          Requirement applicability: {group.label}. Selection alone does not
          establish satisfaction.
        </p>
        <div>
          Prerequisites:{" "}
          {course.prerequisite ? (
            <Condition
              expression={course.prerequisite.expression}
              catalog={catalog}
            />
          ) : (
            "Not captured; eligibility is unresolved."
          )}
        </div>
        {course.corequisite && (
          <div>
            Corequisites:{" "}
            <Condition
              expression={course.corequisite.expression}
              catalog={catalog}
            />
          </div>
        )}
        <p>
          Source verification is not institutional approval. No section
          availability is established.
        </p>
        {course.source_ids.map((id) => {
          const source = catalog.release.sources.find((item) => item.id === id);
          return source ? (
            <p key={id}>
              {source.section} · {source.state.replaceAll("_", " ")} · academic
              review {source.academic_review}. {source.note}
              {source.conflicts_with.length
                ? " Conflicting evidence remains unresolved."
                : ""}
            </p>
          ) : (
            <p key={id}>Source details unavailable; unresolved.</p>
          );
        })}
      </div>
    </details>
  );
}
function Reason({ result }: { result: Result }) {
  return (
    <div className="mt-2 border-l border-line pl-3">
      <span className={`outcome outcome--${result.status}`}>
        {result.status}
      </span>
      <span className="ml-2 text-sm">{studentReason(result.reason)}</span>
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
        {catalog.release.campus_id === "bmcc" &&
        catalog.release.program.id === "bmcc-program-cis-aas"
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
export function GroupedCourses({
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
        Select fictional passed courses. Shared courses are selected once.
        Selection does not allocate credit, verify a record or waive
        prerequisites.
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
        {selectorColumns(catalog.columns).map((column, columnIndex) => (
          <section
            className="selector-column"
            key={column.title}
            aria-label={column.title}
          >
            <h2 className="selector-heading">{column.title}</h2>
            {column.groups.length === 0 && (
              <p className="requirement-card text-sm text-muted">
                Requirements not yet captured in this partial release.
              </p>
            )}
            {column.groups.map((group, groupIndex) => {
              const courses = group.course_ids
                .map((id) =>
                  catalog.release.courses.find(
                    (course) => course.identity.id === id,
                  ),
                )
                .filter((course): course is Course => !!course);
              const visible = courses.filter((course) =>
                `${course.code} ${courseTitle(course)}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              );
              if (search && courses.length && !visible.length) return null;
              return (
                <fieldset className="selector-group" key={group.requirement_id}>
                  <legend
                    className={
                      courses.length === 1 && group.label === courses[0].code
                        ? "sr-only"
                        : "group-label"
                    }
                  >
                    {group.label}
                    {group.kind === "recommended" ? " · Recommended" : ""}
                  </legend>
                  {!courses.length && (
                    <div className="requirement-card">
                      <p className="text-sm">
                        Eligible courses not yet verified · unresolved
                      </p>
                    </div>
                  )}
                  {courses.length !== 1 && (
                    <details className="requirement-details">
                      <summary>
                        Requirement details
                        <span className="sr-only"> for {group.label}</span>
                      </summary>
                      <p>
                        {group.kind} · target{" "}
                        {group.target_credits ?? "not captured"} credits
                      </p>
                      <p>{group.condition_label}</p>
                      {!courses.length && (
                        <p>
                          No verified eligible course pool is available here. No
                          satisfaction or credit is inferred.
                        </p>
                      )}
                    </details>
                  )}
                  {visible.map((course) => {
                    const selected = state.selected.includes(
                      course.identity.id,
                    );
                    const inputId = `course-${columnIndex}-${groupIndex}-${course.identity.id}`;
                    return (
                      <article
                        className={`selector-course ${selected ? "selector-course--selected" : ""}`}
                        key={course.identity.id}
                        aria-label={course.code}
                      >
                        <label className="selector-choice" htmlFor={inputId}>
                          <input
                            id={inputId}
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              dispatch({
                                type: "toggle",
                                course: course.identity.id,
                              })
                            }
                          />
                          <span className="min-w-0">
                            <CourseLabel course={course} />
                            {selected && (
                              <span className="selection-label">Selected</span>
                            )}
                          </span>
                        </label>
                        <ClassDetails
                          course={course}
                          catalog={catalog}
                          group={group}
                        />
                      </article>
                    );
                  })}
                </fieldset>
              );
            })}
          </section>
        ))}
      </div>
      {search &&
        !catalog.columns.some((column) =>
          column.groups.some((group) =>
            group.course_ids.some((id) => {
              const course = catalog.release.courses.find(
                (item) => item.identity.id === id,
              );
              return (
                course &&
                `${course.code} ${courseTitle(course)}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
              );
            }),
          ),
        ) && (
          <p role="status" className="mt-4 text-sm">
            No matching selectable courses. Incomplete requirements remain
            unresolved.
          </p>
        )}
    </div>
  );
}
export function DegreeProgress({
  state,
  preview,
}: {
  state: WorkspaceState;
  preview: PreviewController;
}) {
  const { assumed, setAssumed, run, busy, error, value, stale } = preview;
  const current = value || error ? { value, error } : null;
  const snapshot = value?.snapshot;
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
      {!current && !busy && (
        <p className="text-sm text-muted">
          No evaluation yet. Use Completed Courses to select courses and
          optionally propose allocations.
        </p>
      )}
      {stale && (
        <p role="status">
          Context or selection changed. Updating preview; previous results are
          hidden.
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
              Unresolved: {studentReason(issue)}
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
              <p className="mb-4 text-sm">Overall degree status: unresolved</p>
              {snapshot.issues.map((issue, index) => (
                <p key={index} className="mb-3 text-sm">
                  Issue: {studentReason(issue)}
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
