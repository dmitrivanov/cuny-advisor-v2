"use client";
import { useEffect, useRef } from "react";
import type { Course, Rule, Source } from "@/lib/catalog/api";
export function CourseDetail({
  course,
  sources,
  close,
  pathway,
}: {
  course: Course;
  sources: Source[];
  close: () => void;
  pathway: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const source = sources.find((s) =>
    course.evidence.some((e) => e.source_id === s.id),
  );
  const safe = (url: string) => /^https:\/\//.test(url);
  function rule(label: string, value: Rule) {
    return (
      <section className="course-condition">
        <h3>{label}</h3>
        {value.text ? (
          <>
            <p>
              {value.text
                .replace(/^[\s\S]*?Prerequisites?\s*:\s*/i, "")
                .replace(/Course Syllabus\s*$/i, "")}
            </p>
            {value.status !== "source_verified" && (
              <p className="condition-qualification">
                Confirm this requirement with BMCC; its applicability to this
                catalog year hasn’t been verified.
              </p>
            )}
          </>
        ) : (
          <p className="text-muted">
            Not confirmed in the available catalog information. Check with BMCC
            before registering.
          </p>
        )}
      </section>
    );
  }
  return (
    <dialog
      ref={ref}
      className="course-detail-sheet"
      aria-labelledby="detail-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientY < r.top ||
            e.clientX > r.right ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
    >
      <header className="course-sheet-header">
        <span className="explorer-kicker">Course details</span>
        <button
          autoFocus
          className="explorer-close"
          onClick={close}
          aria-label="Close course details"
        >
          ×
        </button>
      </header>
      <div className="course-sheet-content">
        <span className="course-detail-code">{course.code}</span>
        <h2 id="detail-title">{course.title}</h2>
        <div className="course-detail-meta">
          <span>
            {course.credits_min === course.credits_max
              ? course.credits_min
              : `${course.credits_min}–${course.credits_max}`}{" "}
            credits
          </span>
          <span>{course.catalog_year}</span>
        </div>
        <p className="course-description">{course.description}</p>
        <button className="explorer-primary" onClick={pathway}>
          Explore course pathway <span aria-hidden="true">↗</span>
        </button>
        {rule("Prerequisites", course.prerequisite)}
        {course.corequisite.text && rule("Corequisites", course.corequisite)}
        <details className="course-more">
          <summary>Hours & additional information</summary>
          <dl>
            <dt>Contact hours</dt>
            <dd>{course.contact_hours ?? "Not listed"}</dd>
            <dt>Lecture hours</dt>
            <dd>{course.lecture_hours ?? "Not listed"}</dd>
            <dt>Lab hours</dt>
            <dd>{course.lab_hours ?? "Not listed"}</dd>
          </dl>
          {course.designations.length > 0 && (
            <p>{course.designations.join(" · ")}</p>
          )}
          {course.placement_permission.text &&
            rule("Placement & permission", course.placement_permission)}
          {course.enrollment_restrictions.text &&
            rule("Enrollment conditions", course.enrollment_restrictions)}
          {course.minimum_grade.text &&
            rule("Grade information", course.minimum_grade)}
          {course.cross_listing.text &&
            rule("Related course information", course.cross_listing)}
        </details>
        {source && safe(source.url) && (
          <a
            className="explorer-source"
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            View official BMCC source <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </dialog>
  );
}
