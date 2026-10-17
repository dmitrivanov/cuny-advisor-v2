"use client";
import { useState } from "react";
import { useAdvising } from "./advising-provider";
import { campuses } from "@/lib/advising/campuses";
import {
  applyUpdate,
  factAt,
  reported,
  relationships,
  setGoal,
  setSecondaryGoals,
} from "@/lib/advising/profile";
import type { FactKey, ProfileUpdate } from "@/lib/advising/profile";
import { goalLabels, questions, readiness } from "@/lib/advising/readiness";
import type { Goal } from "@/lib/advising/profile";
import type { ModuleId } from "@/lib/workspace/types";
const institutionId = (value: string) =>
  campuses.find((c) =>
    [c.id, c.shortName.toLowerCase(), c.name.toLowerCase()].includes(
      value.trim().toLowerCase(),
    ),
  )?.id ?? value.trim();
function readable(value: unknown): string {
  if (typeof value === "string")
    return campuses.find((c) => c.id === value)?.shortName ?? value;
  if (Array.isArray(value))
    return value.length
      ? value.map(readable).join("; ")
      : "No courses or previous institutions reported";
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    if ("code" in item) return `${item.code} (${readable(item.institutionId)})`;
    if ("description" in item)
      return `${readable(item.institutionId)}: ${item.description}`;
    if ("name" in item) return `${item.name} (${readable(item.institutionId)})`;
    if ("campusId" in item)
      return `${readable(item.campusId)} · explicitly selected fictional draft; applicability still needs human review`;
  }
  return "Information not available";
}
function Answer({
  field,
  onTool,
}: {
  field: FactKey;
  onTool: (id: ModuleId) => void;
}) {
  const { advising, setAdvising } = useAdvising();
  const [value, setValue] = useState("");
  const [institution, setInstitution] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const courseField = [
    "completedCourses",
    "inProgressCourses",
    "plannedCourses",
  ].includes(field);
  const programField =
    field === "currentProgram" || field === "intendedProgram";
  function save(input: ProfileUpdate) {
    const next = applyUpdate(advising, input);
    if (next === advising) {
      setError("Check this fictional answer. No information was changed.");
      return;
    }
    setAdvising(next);
    setValue("");
    setError("");
  }
  return (
    <form
      className="adaptive-answer"
      onSubmit={(event) => {
        event.preventDefault();
        let answer: unknown = value.trim();
        if (courseField)
          answer = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((code) => ({
              code,
              institutionId: institutionId(institution),
            }));
        if (programField)
          answer = {
            name: value.trim(),
            institutionId: institutionId(institution),
          };
        if (field === "previousInstitutions")
          answer = [
            {
              institutionId: institutionId(institution),
              description: value.trim(),
            },
          ];
        save({
          key: field,
          fact: {
            state: "known",
            value: answer,
            provenance: confirmed ? "student_confirmed" : "student_reported",
          },
        });
      }}
    >
      {field === "academicContext" ? (
        <>
          <p className="text-sm text-muted">
            A start date cannot establish which requirements apply. Open a
            catalog to choose a draft for a fictional scenario; actual
            applicability still needs human review.
          </p>
          <button
            className="action-card"
            type="button"
            onClick={() => onTool("catalog")}
          >
            Open Academic Catalog
          </button>
        </>
      ) : (
        <>
          {field === "relationship" ? (
            <label className="field-label">
              Fictional campus relationship
              <select
                className="workspace-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                required
              >
                <option value="">Choose a relationship</option>
                {relationships.map((r) => (
                  <option key={r} value={r}>
                    {
                      {
                        enrolled: "Currently enrolled",
                        prospective: "Prospective student",
                        transfer: "Prospective transfer",
                        returning: "Former / returning student",
                        alumnus: "Graduate / alumnus",
                        exploring: "Exploring",
                      }[r]
                    }
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="field-label">
              Fictional answer
              <input
                className="workspace-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                maxLength={240}
                required
                placeholder={
                  courseField
                    ? "Course codes, separated by commas"
                    : "Use fictional information only"
                }
              />
            </label>
          )}
          {(programField ||
            courseField ||
            field === "previousInstitutions") && (
            <label className="field-label">
              Institution for this information
              <input
                className="workspace-input"
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
                maxLength={240}
                required
                placeholder="For example, BMCC"
              />
            </label>
          )}
          <label className="flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            I confirm this fictional answer (still not institution-verified).
          </label>
          <button className="action-card" type="submit">
            Use fictional answer
          </button>
          {courseField && (
            <button
              type="button"
              className="action-card"
              onClick={() => save({ key: field, fact: reported([]) })}
            >
              No{" "}
              {field === "completedCourses"
                ? "completed"
                : field === "inProgressCourses"
                  ? "in-progress"
                  : "planned"}{" "}
              courses
            </button>
          )}
          {field === "completedCourses" && (
            <button
              type="button"
              className="action-card"
              onClick={() => onTool("completed")}
            >
              Select completed courses from a list
            </button>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-3 text-xs">
        <button
          type="button"
          className="source-link"
          onClick={() =>
            save({
              key: field,
              fact: {
                state: "unknown",
                reason: "Student does not know yet",
                acknowledged: true,
              },
            })
          }
        >
          I’m not sure yet
        </button>
        <button
          type="button"
          className="source-link"
          onClick={() =>
            save({
              key: field,
              fact: {
                state: "not_applicable",
                reason: "Student explicitly marked not applicable",
              },
            })
          }
        >
          Not applicable
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
export function AdaptiveProfile({
  onTool,
}: {
  onTool: (id: ModuleId) => void;
}) {
  const { advising, setAdvising } = useAdvising();
  const info = readiness(advising);
  const [edit, setEdit] = useState<FactKey>("currentInstitution");
  return (
    <div className="adaptive-profile">
      {advising.session.primaryGoal && (
        <section
          aria-label="Next useful question"
          className="adaptive-question"
        >
          <p className="text-xs text-muted">
            Current goal · {goalLabels[advising.session.primaryGoal]}
          </p>
          {info.nextQuestion ? (
            <>
              <h2 className="mt-2 text-base font-semibold">
                {info.nextQuestion.text}
              </h2>
              <Answer
                key={info.nextQuestion.key}
                field={info.nextQuestion.key}
                onTool={onTool}
              />
            </>
          ) : (
            <p className="mt-2 text-sm">
              {info.goalImplemented
                ? "You can explore the catalog now. No course history or scheduling preferences are needed."
                : "We can review the supported academic tools. Full planning, transfer equivalencies and advisor handoff are not implemented."}
            </p>
          )}
          {info.goalImplemented && (
            <button
              className="action-card mt-3"
              onClick={() => onTool("catalog")}
            >
              Explore the campus catalog
            </button>
          )}
        </section>
      )}
      <details className="profile-details">
        <summary>Fictional profile & goal</summary>
        <p className="text-xs text-muted">
          Optional, tab memory only. No real student information. Choosing an
          assistant does not establish enrollment. Unknown and not applicable
          remain distinct.
        </p>
        <label className="field-label mt-3">
          Advising goal
          <select
            className="workspace-input"
            aria-label="Advising goal"
            value={advising.session.primaryGoal ?? ""}
            onChange={(event) =>
              setAdvising((current) =>
                setGoal(
                  current,
                  event.target.value ? (event.target.value as Goal) : null,
                ),
              )
            }
          >
            <option value="">Choose when useful</option>
            {Object.entries(goalLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <details className="mt-3">
          <summary>Secondary goals (optional)</summary>
          {Object.entries(goalLabels)
            .filter(([goal]) => goal !== advising.session.primaryGoal)
            .map(([goal, label]) => (
              <label className="flex items-start gap-2 py-2 text-xs" key={goal}>
                <input
                  type="checkbox"
                  checked={advising.session.secondaryGoals.includes(
                    goal as Goal,
                  )}
                  onChange={(event) =>
                    setAdvising((current) =>
                      setSecondaryGoals(
                        current,
                        event.target.checked
                          ? [...current.session.secondaryGoals, goal as Goal]
                          : current.session.secondaryGoals.filter(
                              (item) => item !== goal,
                            ),
                      ),
                    )
                  }
                />
                {label}
              </label>
            ))}
        </details>
        <p className="mt-3 text-sm">
          Information readiness:{" "}
          <strong>{info.level.replaceAll("_", " ")}</strong>. This is not
          eligibility or academic approval.
        </p>
        {info.blockingUncertainties.map((text) => (
          <p className="mt-2 text-xs text-muted" key={text}>
            {text}
          </p>
        ))}
        {info.humanReview.map((text) => (
          <p className="mt-2 text-xs text-muted" key={text}>
            {text}
          </p>
        ))}
        <label className="field-label mt-4">
          Review or correct a fact
          <select
            className="workspace-input"
            value={edit}
            onChange={(event) => setEdit(event.target.value as FactKey)}
          >
            {Object.entries(questions).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <p className="my-3 text-xs text-muted">
          Current answer: {factAt(advising, edit).state.replaceAll("_", " ")}
          {factAt(advising, edit).state === "known"
            ? ` · ${readable((factAt(advising, edit) as { value: unknown }).value)} · ${(factAt(advising, edit) as { provenance: string }).provenance.replaceAll("_", " ")}`
            : ""}
        </p>
        <Answer key={edit} field={edit} onTool={onTool} />
      </details>
    </div>
  );
}
