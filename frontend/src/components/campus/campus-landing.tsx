"use client";
import Link from "next/link";
import { AcademicIcon } from "@/components/academic-icon";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { campusById, categoryLabels } from "@/lib/advising/campuses";
import { useInstitutions } from "./institutions-provider";
import { useRouter } from "next/navigation";
/** No randomness, map coordinates, institutional logos or transfer-edge semantics. */
export function CampusLanding() {
  const { campuses, loading, error, retry } = useInstitutions();
  const [notice, setNotice] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    const url = new URL(window.location.href);
    const campus = url.searchParams.get("campus");
    if (
      campus &&
      url.searchParams.get("program") &&
      url.searchParams.get("release")
    ) {
      const match = campusById(campus, campuses);
      if (match)
        router.replace(`/campus/${match.slug}${url.search}${url.hash}`);
    } else if (
      [
        "#chat",
        "#completed",
        "#catalog",
        "#progress",
        "#planner",
        "#transcripts",
        "#advisors",
      ].includes(url.hash)
    )
      router.replace(`/campus/bmcc${url.search}${url.hash}`);
  }, [router, campuses]);
  const active = campusById(hovered ?? focused ?? "", campuses);
  return (
    <main className="campus-landing">
      <a className="skip-link" href="#campus-list">
        Skip to campus list
      </a>
      <header className="constellation-header">
        <Link href="/" aria-label="CUNY Advisor home">
          <span className="brand-mark">
            <AcademicIcon name="compass" className="size-5" />
          </span>
          <span className="constellation-wordmark">CUNY Advisor</span>
        </Link>
        <span>
          Independent prototype <span aria-hidden="true">/</span> Fictional
          scenarios
        </span>
      </header>
      <section className="constellation-intro">
        <h1>Choose your campus.</h1>
        {loading && (
          <p role="status">Loading the CUNY institutional registry…</p>
        )}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button className="source-link" onClick={retry}>
              Retry institution registry
            </button>
          </div>
        )}
        {!loading && !error && campuses.length === 0 && (
          <p role="status">
            No institutions have been imported. Run the reviewed local registry
            import.
          </p>
        )}
        {!loading && !error && campuses.length > 0 && (
          <p className="registry-summary">
            {campuses.length} institutions · BMCC is the only local academic
            pilot.
          </p>
        )}
      </section>
      <section
        className="constellation-layout"
        aria-label="CUNY campus selection"
      >
        <div
          className={`constellation ${loading || error || !campuses.length ? "constellation--pending" : ""}`}
          data-active={active?.id}
          data-interacting={!!(hovered || focused || notice)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="constellation-orbit" aria-hidden="true" />
          <svg
            className="constellation-edges"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="edge-light">
                <stop stopColor="#adc0e5" />
                <stop offset="1" stopColor="#607ba9" />
              </radialGradient>
            </defs>
            {campuses
              .filter((c) => c.id !== "bmcc")
              .map((c) => (
                <path
                  key={c.id}
                  data-emphasized={active?.id === c.id || active?.id === "bmcc"}
                  d={`M 50 50 Q ${(50 + c.visualPosition.x) / 2} ${c.visualPosition.y} ${c.visualPosition.x} ${c.visualPosition.y}`}
                />
              ))}
          </svg>
          {campuses.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`campus-node ${c.assistantAvailability === "pilot" ? "campus-node--pilot" : ""}`}
              style={
                {
                  "--node-x": `${c.visualPosition.x}%`,
                  "--node-y": `${c.visualPosition.y}%`,
                } as CSSProperties
              }
              aria-label={`${c.shortName} · ${c.assistantAvailability === "pilot" ? "Pilot available" : "Future assistant unavailable"}`}
              aria-describedby={
                active?.id === c.id ? "campus-information" : undefined
              }
              data-emphasized={active?.id === c.id}
              data-receded={!!(hovered ?? focused) && active?.id !== c.id}
              onMouseEnter={() => setHovered(c.id)}
              onFocus={() => {
                setFocused(c.id);
                setHovered(null);
              }}
              onBlur={() => setFocused(null)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setNotice(null);
                  setFocused(null);
                  setHovered(null);
                }
              }}
              onClick={() => {
                if (c.assistantAvailability === "pilot")
                  router.push(`/campus/${c.slug}`);
                else setNotice(c.id);
              }}
            >
              <span className="campus-orb" aria-hidden="true">
                {c.shortName === "Queensborough"
                  ? "QCC"
                  : c.shortName === "LaGuardia"
                    ? "LAG"
                    : ((
                        {
                          bmcc: "BMCC",
                          ccny: "CCNY",
                          hunter: "HC",
                          baruch: "BC",
                          brooklyn: "BK",
                          queens: "QC",
                        } as Record<string, string>
                      )[c.id] ??
                      c.shortName
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 3)
                        .toUpperCase())}
              </span>
              <span className="campus-node-label">
                {c.shortName}
                <small>
                  {c.assistantAvailability === "pilot"
                    ? "Pilot available"
                    : "Coming later"}
                </small>
              </span>
            </button>
          ))}
          {active && (
            <div
              id="campus-information"
              role="tooltip"
              className="campus-tooltip"
              style={
                {
                  "--detail-x": `${active.visualPosition.x}%`,
                  "--detail-y": `${active.visualPosition.y}%`,
                } as CSSProperties
              }
            >
              <strong>{active.name}</strong>
              <span>{categoryLabels[active.type]}</span>
              {active.classificationNote && (
                <span>{active.classificationNote}</span>
              )}
              <span>
                {active.assistantAvailability === "pilot"
                  ? "Local pilot available · Opens an assistant, not enrollment."
                  : "Future assistant · Unavailable"}
              </span>
            </div>
          )}
        </div>
        {notice && (
          <div className="campus-notice" role="status" aria-live="polite">
            <p>
              <strong>{campusById(notice, campuses)?.shortName}</strong> ·
              Assistant unavailable. This campus is planned for a future
              release.
            </p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss campus notice"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>
      <footer className="constellation-footer">
        <p>Illustrative network, not a map or verified transfer pathways.</p>
        <details id="campus-list">
          <summary>Accessible campus list</summary>
          <ul>
            {campuses.map((c) => (
              <li key={c.id}>
                <span>
                  {c.name} · {categoryLabels[c.type]} —{" "}
                  {c.assistantAvailability === "pilot"
                    ? "Local pilot"
                    : "Future / unavailable"}
                </span>
                {c.assistantAvailability === "pilot" && (
                  <Link href={`/campus/${c.slug}`}>
                    Talk to {c.shortName} Advisor
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </details>
        <details>
          <summary>Privacy & academic limitations</summary>
          <p>
            No CUNY or college affiliation, endorsement or academic approval.
            Fictional scenarios only; do not enter real student information. No
            complete audit, registration, accounts or saved personal data.
            Optional external AI conversation requires consent in the BMCC
            workspace. Refresh clears session information.
          </p>
        </details>
      </footer>
    </main>
  );
}
