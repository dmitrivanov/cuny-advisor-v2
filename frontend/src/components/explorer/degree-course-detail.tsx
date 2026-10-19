"use client";
import { useEffect, useRef } from "react";
import type { Catalog, Course } from "@/lib/workspace/types";
import { courseTitle } from "@/lib/workspace/presentation";
export function DegreeCourseDetail({
  course,
  catalog,
  selected,
  toggle,
  close,
  focusPath,
}: {
  course: Course;
  catalog: Catalog;
  selected: boolean;
  toggle: () => void;
  close: () => void;
  focusPath: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  function dismiss(action: () => void = close) {
    // Release native modal focus/inertness while the dialog is still attached.
    ref.current?.close();
    action();
  }
  const source = catalog.release.sources.find(
    (s) => course.source_ids.includes(s.id) && s.url?.startsWith("https://"),
  );
  return (
    <dialog
      ref={ref}
      className="course-detail-sheet degree-course-sheet"
      aria-labelledby="degree-course-title"
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
    >
      <header className="course-sheet-header">
        <span className="explorer-kicker">Course details</span>
        <button
          autoFocus
          aria-label="Close course details"
          className="explorer-close"
          onClick={() => dismiss()}
        >
          ×
        </button>
      </header>
      <div className="course-sheet-content">
        <span className="course-detail-code">{course.code}</span>
        <h2 id="degree-course-title">{courseTitle(course)}</h2>
        <div className="course-detail-meta">
          <span>{course.credits ?? "Unconfirmed"} credits</span>
          <span>{catalog.release.catalog_year}</span>
        </div>
        <p className="course-description">
          A description for this catalog edition has not been captured. The
          source link below may provide additional information.
        </p>
        <button className="explorer-primary" onClick={toggle}>
          {selected ? "Remove from course history" : "Add to course history"}
        </button>
        <p className="condition-qualification">
          Student-reported selection only. This does not verify earned credit or
          satisfy a requirement automatically.
        </p>
        <section className="course-condition">
          <h3>Preparation & pathways</h3>
          <p>
            Use the map to inspect verified prerequisite relationships. Missing
            or unverified preparation requirements remain unresolved for this
            edition.
          </p>
          <button
            className="explorer-text-button"
            onClick={() => dismiss(focusPath)}
          >
            Focus prerequisite pathway →
          </button>
        </section>
        <details className="course-more">
          <summary>Additional course information</summary>
          <p>
            Hours and corequisites have not been verified for this edition. No
            availability or eligibility is implied.
          </p>
        </details>
        {source?.url && (
          <a
            className="explorer-source"
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            View academic source ↗
          </a>
        )}
      </div>
    </dialog>
  );
}
