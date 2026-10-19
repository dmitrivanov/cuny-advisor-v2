"use client";
import "../explorer/degree-map.css";
import { useId, useRef, useState, type Dispatch } from "react";
import type { Action } from "@/lib/workspace/state";
import type { WorkspaceState } from "@/lib/workspace/types";
import { courseTitle } from "@/lib/workspace/presentation";
import { GroupedCourses } from "./academic-modules";
export function CompactCourses({
  state,
  dispatch,
}: {
  state: WorkspaceState;
  dispatch: Dispatch<Action>;
}) {
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const id = useId(),
    input = useRef<HTMLInputElement>(null),
    catalog = state.catalog!;
  const options = catalog.release.courses
    .filter(
      (c) =>
        !state.selected.includes(c.identity.id) &&
        `${c.code} ${courseTitle(c)}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
    )
    .slice(0, 8);
  function add(course: string) {
    dispatch({ type: "toggle", course });
    setQuery("");
    setActive(0);
    input.current?.focus();
    setOpen(false);
  }
  return (
    <section className="compact-history" aria-label="Course history">
      <p className="history-intro">
        Build your course history, one course at a time. Selections are
        hypothetical and do not verify earned credit.
      </p>
      <div className="history-search-wrap">
        <label htmlFor={id}>Add completed courses</label>
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-autocomplete="list"
          aria-activedescendant={
            open && options[active] ? `${id}-option-${active}` : undefined
          }
          autoComplete="off"
          placeholder="Search a course code or title…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((n) =>
                Math.max(
                  0,
                  Math.min(
                    options.length - 1,
                    n + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (e.key === "Enter" && open && options[active]) {
              e.preventDefault();
              add(options[active].identity.id);
            }
          }}
        />
        {open && (
          <ul
            role="listbox"
            id={`${id}-options`}
            aria-label="Course suggestions"
            className="history-suggestions"
          >
            {options.map((c, i) => (
              <li
                role="option"
                key={c.identity.id}
                id={`${id}-option-${i}`}
                aria-selected={active === i}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActive(i)}
                onClick={() => add(c.identity.id)}
              >
                <strong>{c.code}</strong>
                <span>{courseTitle(c)}</span>
                <small>＋ Add</small>
              </li>
            ))}
            {!options.length && (
              <li role="presentation">
                No matching courses in this edition. Free-text entries cannot
                establish credit.
              </li>
            )}
          </ul>
        )}
      </div>
      <div className="history-count" role="status">
        {state.selected.length} courses selected · reported, not verified
      </div>
      <ul className="history-chips" aria-label="Selected courses">
        {state.selected.map((courseId) => {
          const c = catalog.release.courses.find(
            (c) => c.identity.id === courseId,
          )!;
          return (
            <li key={courseId}>
              <span>
                <strong>{c.code}</strong>
                <small>{courseTitle(c)}</small>
              </span>
              <button
                aria-label={`Remove ${c.code}`}
                onClick={() => {
                  dispatch({ type: "toggle", course: courseId });
                  input.current?.focus();
                  setOpen(false);
                }}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
      {!state.selected.length && (
        <p className="history-empty">Your selected courses will appear here.</p>
      )}
      {state.selected.length > 0 && (
        <details className="history-extra">
          <summary>Review details & optional credit proposals</summary>
          <p className="history-intro">
            Grades, terms and attendance are not captured or verified here.
            Optional allocation proposals are validated by the academic engine.
          </p>
          {state.selected.map((courseId) => {
            const c = catalog.release.courses.find(
                (c) => c.identity.id === courseId,
              )!,
              value = state.assignments[courseId] ?? {
                requirement_id: "",
                credits: "",
              };
            const groups = catalog.columns
              .flatMap((c) => c.groups)
              .filter((g) => g.course_ids.includes(courseId));
            return (
              <fieldset key={courseId} className="history-course-details">
                <legend>
                  {c.code} · {courseTitle(c)}
                </legend>
                <p>
                  Catalog: {catalog.release.campus_id.toUpperCase()} ·{" "}
                  {catalog.release.catalog_year} · {c.credits ?? "Unconfirmed"}{" "}
                  credits. Grade and term not supplied.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="field-label">
                    Apply {c.code} to
                    <select
                      className="workspace-input"
                      value={value.requirement_id}
                      onChange={(e) =>
                        dispatch({
                          type: "assign",
                          course: courseId,
                          value: { ...value, requirement_id: e.target.value },
                        })
                      }
                    >
                      <option value="">No allocation proposed</option>
                      {groups.map((g) => (
                        <option key={g.requirement_id} value={g.requirement_id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label">
                    Proposed credits for {c.code}
                    <input
                      className="workspace-input"
                      inputMode="decimal"
                      value={value.credits}
                      disabled={!value.requirement_id}
                      onChange={(e) =>
                        dispatch({
                          type: "assign",
                          course: courseId,
                          value: { ...value, credits: e.target.value },
                        })
                      }
                    />
                  </label>
                </div>
              </fieldset>
            );
          })}
        </details>
      )}
      <details className="history-extra">
        <summary>Browse the four academic categories</summary>
        <GroupedCourses state={state} dispatch={dispatch} />
      </details>
    </section>
  );
}
