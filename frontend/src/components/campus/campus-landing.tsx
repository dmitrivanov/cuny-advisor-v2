"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { campuses, campusById } from "@/lib/advising/campuses";
import { useRouter } from "next/navigation";
/** No randomness, map coordinates, institutional logos or transfer-edge semantics. */
export function CampusLanding() {
  const [selected, setSelected] = useState("bmcc");
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
      const match = campusById(campus);
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
  }, [router]);
  const active = campusById(hovered ?? focused ?? selected)!;
  return (
    <main className="campus-landing">
      <a className="skip-link" href="#campus-list">
        Skip to campus list
      </a>
      <header className="constellation-header">
        <Link href="/" aria-label="CUNY Advisor home">
          CA<span className="constellation-wordmark">CUNY Advisor</span>
        </Link>
        <span>
          Independent prototype <span aria-hidden="true">/</span> No live AI
        </span>
      </header>
      <section className="constellation-intro">
        <p className="constellation-eyebrow">
          ONE UNIVERSITY. MANY POSSIBLE PATHS.
        </p>
        <h1>
          Your next chapter
          <br />
          <em>starts with a conversation.</em>
        </h1>
        <p>Choose a campus to begin.</p>
      </section>
      <section
        className="constellation-layout"
        aria-label="CUNY campus selection"
      >
        <div
          className="constellation"
          data-active={active.id}
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
                  data-emphasized={active.id === c.id || active.id === "bmcc"}
                  d={`M 39 49 Q ${(39 + c.visualPosition.x) / 2} ${c.visualPosition.y} ${c.visualPosition.x} ${c.visualPosition.y}`}
                />
              ))}
          </svg>
          <p className="network-label" aria-hidden="true">
            CUNY <span>CONNECTED POSSIBILITIES</span>
          </p>
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
              aria-pressed={selected === c.id}
              aria-controls="campus-information"
              data-emphasized={hovered === c.id || focused === c.id}
              data-receded={!!(hovered ?? focused) && active.id !== c.id}
              onMouseEnter={() => setHovered(c.id)}
              onFocus={() => setFocused(c.id)}
              onBlur={() => setFocused(null)}
              onClick={() => {
                setSelected(c.id);
                setHovered(null);
              }}
            >
              <span className="campus-orb" aria-hidden="true">
                {c.shortName === "Queensborough"
                  ? "QCC"
                  : c.shortName === "LaGuardia"
                    ? "LAG"
                    : ((
                        {
                          hunter: "HC",
                          baruch: "BC",
                          brooklyn: "BK",
                          queens: "QC",
                        } as Record<string, string>
                      )[c.id] ?? c.shortName)}
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
        </div>
        <aside
          className="campus-information"
          id="campus-information"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="constellation-eyebrow">YOUR CAMPUS PERSPECTIVE</p>
          <p className="campus-detail-index">
            {String(campuses.indexOf(active) + 1).padStart(2, "0")}{" "}
            <span>/ 08</span>
          </p>
          <h2>{active.name}</h2>
          <p>
            {active.type === "community_college"
              ? "Community college"
              : "Senior college"}
          </p>
          <span
            className={`campus-availability ${active.assistantAvailability === "pilot" ? "campus-availability--pilot" : ""}`}
          >
            {active.assistantAvailability === "pilot"
              ? "Local pilot available"
              : "Future assistant · Unavailable"}
          </span>
          <p className="campus-detail-copy">
            {active.assistantAvailability === "pilot"
              ? "Explore the reviewed local catalog and fictional course scenarios. Your choice opens an assistant; it does not establish where you study."
              : "This college is part of the CUNY network. Its assistant and academic catalog are not implemented in this prototype."}
          </p>
          {active.assistantAvailability === "pilot" ? (
            <Link className="campus-enter" href={`/campus/${active.slug}`}>
              Talk to {active.shortName} Advisor{" "}
              <span aria-hidden="true">↗</span>
            </Link>
          ) : (
            <p className="campus-unavailable">No assistant to enter yet</p>
          )}
        </aside>
      </section>
      <footer className="constellation-footer">
        <p>Illustrative network, not a map or verified transfer pathways.</p>
        <details id="campus-list">
          <summary>Accessible campus list</summary>
          <ul>
            {campuses.map((c) => (
              <li key={c.id}>
                <span>
                  {c.name} —{" "}
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
            live AI, complete audit, registration, accounts or saved personal
            data. Refresh clears session information.
          </p>
        </details>
      </footer>
    </main>
  );
}
