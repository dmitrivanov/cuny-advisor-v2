"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CompactCourses } from "./compact-courses";
import {
  mapIntent,
  mapURL,
  readMapTarget,
  type MapTarget,
} from "@/lib/workspace/map-navigation";
import { usePreview } from "./use-preview";
const DegreeMap = dynamic(
  () => import("@/components/explorer/degree-map").then((m) => m.DegreeMap),
  { ssr: false, loading: () => <p role="status">Opening your program map…</p> },
);
import { AcademicExplorer } from "@/components/explorer/academic-explorer";
import {
  explorerIntent,
  explorerURL,
  validTarget,
  type ExplorerTarget,
} from "@/lib/catalog/navigation";
import { useInstitutions } from "@/components/campus/institutions-provider";
import { useAdvising } from "@/components/campus/advising-provider";
import { AdaptiveProfile } from "@/components/campus/adaptive-profile";
import {
  applyUpdate,
  reported,
  switchCampus,
  setGoal,
} from "@/lib/advising/profile";
import {
  interpretBounded,
  validateProposal,
} from "@/lib/advising/orchestration";
import {
  conversationFacts,
  decodeConversation,
  confirmConversation,
  describeReported,
  fieldLabel,
} from "@/lib/advising/conversation";
import { goalLabels } from "@/lib/advising/readiness";
import type { ConversationProposal } from "@/lib/advising/orchestration";
import type { Campus } from "@/lib/advising/campuses";
import { AcademicIcon } from "@/components/academic-icon";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { getCatalog, listReleases } from "@/lib/workspace/api";
import {
  guidance,
  moduleFromHash,
  modules,
  programName,
  suggestedPrompts,
} from "@/lib/workspace/registry";
import { initialState, workspaceReducer } from "@/lib/workspace/state";
import type { Guidance } from "@/lib/workspace/registry";
import type { ModuleId, Summary } from "@/lib/workspace/types";
import { DegreeProgress } from "./academic-modules";

const contextKey = (
  item: Pick<Summary, "campus_id" | "program_id" | "release_id">,
) => JSON.stringify([item.campus_id, item.program_id, item.release_id]);
type Message = {
  role: "you" | "guide";
  text: string;
  actions?: ModuleId[];
  ai?: boolean;
  explorer?: ExplorerTarget;
  mapTarget?: MapTarget;
};
export function Workspace({ campus }: { campus: Campus }) {
  const { advising, setAdvising } = useAdvising();
  const { campuses } = useInstitutions();
  useEffect(
    () => setAdvising((current) => switchCampus(current, campus.id)),
    [campus.id, setAdvising],
  );
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const [releases, setReleases] = useState<Summary[] | null>(null);
  const [listingError, setListingError] = useState("");
  const [selection, setSelection] = useState("");
  const contextRef = useRef("");
  const [catalogError, setCatalogError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const conversationRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const previousModule = useRef<ModuleId>("chat");
  const [mapTarget, setMapTarget] = useState<MapTarget>({});
  const [input, setInput] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [pending, setPending] = useState<{
    proposal: ConversationProposal;
    snapshot: string;
  } | null>(null);
  const aiSession = useRef<string | null>(null);
  const aiAbort = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/conversation/status", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((value) => {
        if (value?.enabled === true) setAiAvailable(true);
      })
      .catch(() => {});
    return () => {
      controller.abort();
      aiAbort.current?.abort();
    };
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "guide",
      text: `Hi! I’m the ${campus.shortName} advising assistant prototype. What would you like help with today? Fictional information only.`,
      actions: ["completed"],
    },
  ]);
  useEffect(() => {
    const log = conversationRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);
  const readLocation = useCallback(() => {
    const url = new URL(window.location.href);
    setMapTarget(readMapTarget(url.search));
    dispatch({ type: "navigate", module: moduleFromHash(url.hash) });
    const parts = ["campus", "program", "release"].map((name) =>
      url.searchParams.get(name),
    );
    const key =
      parts.every(Boolean) && parts[0] === campus.id
        ? JSON.stringify(parts)
        : "";
    if (parts.every(Boolean) && parts[0] !== campus.id)
      setCatalogError({
        key: "",
        message:
          "This catalog belongs to another campus. Choose a matching campus catalog explicitly.",
      });
    if (key !== contextRef.current) {
      setAdvising((current) => {
        const fact = current.profile.academicContext;
        if (fact.state !== "known") return current;
        const bound = JSON.stringify([
          fact.value.campusId,
          fact.value.programId,
          fact.value.releaseId,
        ]);
        return bound === key
          ? current
          : applyUpdate(current, {
              key: "academicContext",
              fact: {
                state: "unknown",
                reason:
                  "Selected release changed; fictional applicability needs reconfirmation",
              },
            });
      });
      contextRef.current = key;
      dispatch({ type: "reset" });
      setSelection(key);
    }
  }, [campus.id, setAdvising]);
  useEffect(() => {
    void Promise.resolve().then(() => {
      readLocation();
    });
    window.addEventListener("popstate", readLocation);
    window.addEventListener("hashchange", readLocation);
    return () => {
      window.removeEventListener("popstate", readLocation);
      window.removeEventListener("hashchange", readLocation);
    };
  }, [readLocation]);
  useEffect(() => {
    if (state.active === "chat") return;
    const controller = new AbortController();
    listReleases(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setReleases(items.filter((item) => item.campus_id === campus.id));
          setListingError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setListingError(error.message);
      });
    return () => controller.abort();
  }, [attempt, state.active, campus.id]);
  useEffect(() => {
    if (!selection) return;
    const [campus_id, program_id, release_id] = JSON.parse(
      selection,
    ) as string[];
    const controller = new AbortController();
    getCatalog(
      {
        campus_id,
        program_id,
        release_id,
        catalog_year: "",
        credential: "",
        revision_id: "",
      },
      controller.signal,
    )
      .then((catalog) => {
        if (!controller.signal.aborted) {
          if (
            catalog.release.campus_id !== campus.id ||
            catalog.release.program.id !== program_id ||
            catalog.release.id !== release_id
          )
            throw new Error(
              "Catalog does not match this assistant and exact program/release.",
            );
          dispatch({ type: "catalog", catalog });
          setCatalogError(null);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setCatalogError({ key: selection, message: error.message });
      });
    return () => controller.abort();
  }, [selection, attempt, campus.id]);
  function navigate(module: ModuleId) {
    if (state.active === "chat" && module !== "chat")
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    const url = new URL(window.location.href);
    url.hash = module;
    window.history.pushState(null, "", url);
    dispatch({ type: "navigate", module });
  }
  useEffect(() => {
    if (previousModule.current === state.active) return;
    previousModule.current = state.active;
    if (state.active === "chat" && returnFocus.current?.isConnected)
      returnFocus.current.focus();
    else headingRef.current?.focus();
  }, [state.active]);
  function choose(value: string) {
    const item = releases?.find((item) => contextKey(item) === value);
    const url = new URL(window.location.href);
    for (const name of ["campus", "program", "release"])
      url.searchParams.delete(name);
    if (item) {
      url.searchParams.set("map_program", item.program_id);
      url.searchParams.delete("focus_code");
      url.searchParams.delete("path_direction");
      url.searchParams.set("campus", item.campus_id);
      url.searchParams.set("program", item.program_id);
      url.searchParams.set("release", item.release_id);
    }
    window.history.pushState(null, "", url);
    readLocation();
  }
  function openExplorer(target: ExplorerTarget) {
    if (!validTarget(target)) return;
    navigate("catalog");
    window.history.replaceState(
      null,
      "",
      explorerURL(window.location.href, target),
    );
    window.dispatchEvent(new Event("explorer:navigate"));
  }
  function openMap(target: MapTarget) {
    navigate("map");
    window.history.replaceState(null, "", mapURL(window.location.href, target));
    setMapTarget(target);
  }
  function sendLocal(text: string) {
    if (!text.trim()) return;
    const proposal = interpretBounded(text, campuses);
    const accepted = proposal && validateProposal(proposal, advising);
    if (accepted)
      setAdvising((current) => {
        let next = proposal.goal ? setGoal(current, proposal.goal) : current;
        for (const update of proposal.updates)
          next = applyUpdate(next, update, campuses);
        return next;
      });
    const degreeDestination = mapIntent(text);
    if (degreeDestination) {
      setMessages((items) => [
        ...items.slice(-37),
        { role: "you", text: text.trim().slice(0, 600) },
        {
          role: "guide",
          text: degreeDestination.program
            ? "Explore this program’s limited degree map. Choose its catalog edition explicitly; this is not a complete degree plan."
            : "Open your degree map to inspect source-backed requirements and verified pathways.",
          actions: ["map"],
          mapTarget: degreeDestination,
        },
      ]);
      setInput("");
      return;
    }
    if (/^show (?:my )?remaining requirements[.!?]*$/i.test(text.trim())) {
      setMessages((items) => [
        ...items.slice(-37),
        { role: "you", text },
        {
          role: "guide",
          text: "Review remaining and unresolved outcomes from the deterministic preview.",
          actions: ["progress"],
        },
      ]);
      setInput("");
      return;
    }
    const destination = explorerIntent(text);
    const reply: Guidance = destination
      ? {
          text: "Explore BMCC’s academic possibilities. Browsing does not change your advising selections.",
          actions: ["catalog"],
          explorer: destination,
        }
      : accepted
        ? { text: proposal.message, actions: proposal.actions }
        : guidance(text);
    setMessages((items) => [
      ...items.slice(-37),
      { role: "you", text: text.trim().slice(0, 600) },
      { role: "guide", ...reply },
    ]);
    setInput("");
  }
  async function send(text: string) {
    if (!text.trim() || busy) return;
    if (
      mapIntent(text) ||
      /^show (?:my )?remaining requirements[.!?]*$/i.test(text.trim()) ||
      explorerIntent(text) ||
      !aiAvailable ||
      !consent
    ) {
      sendLocal(text);
      return;
    }
    setBusy(true);
    setAiError("");
    setPending(null);
    setInput("");
    const snapshot = JSON.stringify(advising);
    setMessages((items) => [
      ...items.slice(-37),
      { role: "you", text: text.trim().slice(0, 600) },
    ]);
    const controller = new AbortController();
    aiAbort.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      if (!aiSession.current) {
        const response = await fetch("/api/conversation/session", {
          method: "POST",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const session = await response.json();
        if (typeof session.session_id !== "string") throw new Error();
        aiSession.current = session.session_id;
      }
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          session_id: aiSession.current,
          campus_id: campus.id,
          message: text.trim().slice(0, 600),
          facts: conversationFacts(advising),
          goal: advising.session.primaryGoal,
          history: messages.slice(-8).map(({ role, text }) => ({ role, text })),
          external_ai_consent: true,
          module: ["catalog", "completed", "progress"].includes(state.active)
            ? state.active
            : "chat",
          catalog_context: state.catalog
            ? {
                campus_id: state.catalog.release.campus_id,
                program_id: state.catalog.release.program.id,
                release_id: state.catalog.release.id,
                applicability: "unresolved",
              }
            : null,
        }),
      });
      if (!response.ok) throw new Error();
      const value: unknown = await response.json();
      if (
        value &&
        typeof value === "object" &&
        "mode" in value &&
        value.mode === "fallback"
      )
        throw new Error();
      const proposal = decodeConversation(value, advising);
      if (!proposal) throw new Error();
      if (proposal.updates.length || proposal.goal)
        setPending({ proposal, snapshot });
      setMessages((items) => [
        ...items,
        {
          role: "guide",
          text: proposal.message,
          actions: proposal.actions,
          ai: true,
        },
      ]);
    } catch {
      if (!controller.signal.aborted || aiAbort.current === controller) {
        setAiError(
          "AI conversation is unavailable or its proposal was rejected. Local navigation remains available.",
        );
        const reply = guidance(text);
        setMessages((items) => [...items, { role: "guide", ...reply }]);
      }
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  const active = modules.find((module) => module.id === state.active)!;
  const catalog = state.catalog;
  const summary: Summary | null = catalog
    ? {
        campus_id: catalog.release.campus_id,
        program_id: catalog.release.program.id,
        release_id: catalog.release.id,
        catalog_year: catalog.release.catalog_year,
        credential: catalog.release.credential,
        revision_id:
          releases?.find(
            (item) =>
              item.release_id === catalog.release.id &&
              item.program_id === catalog.release.program.id &&
              item.campus_id === catalog.release.campus_id,
          )?.revision_id ?? "explicit deep link",
      }
    : null;
  const preview = usePreview(state, summary);
  const mapMismatch =
    state.active === "map" &&
    mapTarget.program &&
    catalog?.release.program.id !== mapTarget.program;
  const isChat = state.active === "chat";
  return (
    <div className="workspace-root">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to workspace
      </a>
      <header className="chat-brand page-container">
        <a
          href="#chat"
          onClick={(event) => {
            event.preventDefault();
            navigate("chat");
          }}
          className="inline-flex items-center gap-3"
        >
          <span className="brand-mark">
            <AcademicIcon name="compass" className="size-5" />
          </span>
          <strong>CUNY Advisor</strong>
        </a>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>
            {campus.shortName} ·{" "}
            {aiAvailable && consent ? "AI conversation" : "No live AI"}
          </span>
          <Link className="source-link" href="/">
            Back to campuses
          </Link>
        </div>
      </header>
      <main
        id="main-content"
        className={`page-container ${isChat ? "chat-home" : "focused-workspace"}`}
        tabIndex={-1}
      >
        <div hidden={!isChat}>
          <GlassPanel
            className="conversation-panel"
            aria-labelledby="chat-heading"
          >
            <p className="eyebrow mb-3">A place to begin</p>
            <h1
              id="chat-heading"
              ref={isChat ? headingRef : undefined}
              tabIndex={-1}
              className="font-editorial text-3xl sm:text-4xl"
            >
              What’s your next step?
            </h1>
            {summary && (
              <p className="mt-3 text-xs text-muted">
                {programName(summary.program_id)} · {state.selected.length}{" "}
                unique hypothetical selections retained
              </p>
            )}
            <div
              ref={conversationRef}
              className="conversation-messages mt-6"
              role="log"
              aria-label="Session conversation"
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.map((message, index) => (
                <article
                  key={index}
                  className={`message message--${message.role}`}
                >
                  <p className="mb-2 text-xs font-semibold text-muted">
                    {message.role === "you"
                      ? "You"
                      : message.ai
                        ? "AI assistant · Unverified conversation"
                        : "Local guide"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {message.text}
                  </p>
                  {message.mapTarget?.program && (
                    <div className="program-map-preview">
                      <strong>{programName(message.mapTarget.program)}</strong>
                      <span>Limited draft map · choose a catalog edition</span>
                    </div>
                  )}
                  {message.actions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((id) => (
                        <button
                          key={id}
                          className="action-card"
                          onClick={() =>
                            id === "map"
                              ? openMap(message.mapTarget ?? {})
                              : id === "catalog" && message.explorer
                                ? openExplorer(message.explorer)
                                : navigate(id)
                          }
                        >
                          Open {modules.find((item) => item.id === id)!.name}{" "}
                          <span aria-hidden="true">↗</span>
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
            {aiAvailable && (
              <div className="adaptive-question mt-4">
                <p className="text-sm">
                  Optional AI conversation sends your fictional messages and
                  limited profile context to Google Gemini. No real transcripts,
                  student IDs, SSNs or sensitive records. Independent prototype;
                  no institutional approval.
                </p>
                <label className="field-label mt-2">
                  <input
                    type="checkbox"
                    checked={consent}
                    disabled={busy}
                    onChange={(event) => {
                      setConsent(event.target.checked);
                      setPending(null);
                    }}
                  />{" "}
                  Use external AI for fictional conversation
                </label>
              </div>
            )}
            {busy && (
              <p role="status" className="mt-3 text-sm">
                Preparing a response…
              </p>
            )}
            {aiError && (
              <p role="alert" className="workspace-notice mt-3">
                {aiError}{" "}
                <button
                  type="button"
                  className="source-link"
                  onClick={() => {
                    setConsent(false);
                    setPending(null);
                  }}
                >
                  Use local mode
                </button>
              </p>
            )}
            {pending && (
              <section
                className="adaptive-question mt-4"
                aria-label="Review proposed fictional changes"
              >
                <h2 className="text-sm font-semibold">
                  Review proposed fictional changes
                </h2>
                <p className="text-xs">
                  Nothing has changed yet. Confirm corrections explicitly;
                  conflicting confirmed facts are never overwritten
                  automatically.
                </p>
                <ul className="my-3 text-sm">
                  {pending.proposal.updates.map((update) => (
                    <li key={update.key}>
                      {fieldLabel(update.key)}:{" "}
                      {describeReported(
                        update.fact.state === "known"
                          ? update.fact.value
                          : null,
                      )}
                    </li>
                  ))}
                  {pending.proposal.goal && (
                    <li>Goal: {goalLabels[pending.proposal.goal]}</li>
                  )}
                </ul>
                {pending.snapshot !== JSON.stringify(advising) && (
                  <p role="alert">
                    Context changed. Discard these changes and ask again.
                  </p>
                )}
                <GlassButton
                  disabled={pending.snapshot !== JSON.stringify(advising)}
                  onClick={() => {
                    setAdvising((current) =>
                      confirmConversation(
                        current,
                        pending.proposal,
                        pending.snapshot,
                      ),
                    );
                    setPending(null);
                  }}
                >
                  Apply reported changes
                </GlassButton>{" "}
                <GlassButton
                  variant="secondary"
                  onClick={() => setPending(null)}
                >
                  Discard changes
                </GlassButton>
              </section>
            )}
            <form
              className="mt-6"
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <label className="field-label" htmlFor="chat-input">
                {aiAvailable && consent
                  ? "Your message"
                  : "Your navigation prompt"}
              </label>
              <textarea
                className="workspace-input mt-2"
                id="chat-input"
                rows={2}
                maxLength={600}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  aiAvailable && consent
                    ? "Tell me what you would like to explore"
                    : "Try: Open completed courses"
                }
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-muted">
                  {aiAvailable && consent
                    ? "Fictional information only. External AI is enabled."
                    : "Supported prompts only. Messages stay in this tab."}
                </p>
                <GlassButton type="submit" disabled={!input.trim() || busy}>
                  Send
                </GlassButton>
              </div>
            </form>
            <AdaptiveProfile onTool={navigate} />
            <div
              className="suggested-prompts mt-5"
              aria-label="Supported prompts"
            >
              {[
                "Explore academic programs",
                "Plan next semester",
                "Transfer to another college",
              ].map((prompt) => (
                <button
                  className="suggested-prompt"
                  key={prompt}
                  onClick={() => send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <details className="mt-3 text-xs text-muted">
              <summary>More supported prompts</summary>
              <div className="suggested-prompts mt-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    className="suggested-prompt"
                    key={prompt}
                    onClick={() => send(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </details>
          </GlassPanel>
        </div>
        {!isChat && (
          <GlassPanel className="module-panel" aria-labelledby="module-heading">
            <div className="module-heading-row">
              <div>
                <p className="eyebrow mb-2">
                  Contextual tool
                  {active.availability === "limited"
                    ? " · Limited preview"
                    : ""}
                </p>
                <h1
                  id="module-heading"
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-2xl font-semibold"
                >
                  {active.name}
                </h1>
              </div>
              <GlassButton variant="secondary" onClick={() => navigate("chat")}>
                ← Return to chatbot
              </GlassButton>
            </div>
            {active.availability === "future" ? (
              <p className="workspace-notice mt-5">
                Not implemented. No upload, planner, reporting or handoff
                service is available.
              </p>
            ) : state.active === "catalog" ? (
              campus.id === "bmcc" ? (
                <>
                  {catalogError?.key === "" && (
                    <p role="alert" className="workspace-notice mb-4">
                      {catalogError.message}
                    </p>
                  )}
                  <AcademicExplorer
                    programMaps={releases ?? []}
                    openProgramMap={(item) => {
                      choose(contextKey(item));
                      openMap({ program: item.program_id });
                    }}
                  />
                </>
              ) : (
                <p className="workspace-notice">
                  Academic exploration is available for BMCC only.
                </p>
              )
            ) : (
              <>
                <div className="module-context">
                  <p className="text-sm">
                    {summary
                      ? `${summary.campus_id.toUpperCase()} · ${programName(summary.program_id)} · ${summary.catalog_year}`
                      : "Choose your program and catalog explicitly."}
                  </p>
                  <details className="context-choice" open={!selection}>
                    <summary className="text-sm font-semibold text-brand">
                      Choose / change catalog
                    </summary>
                    <label className="field-label">
                      Program / catalog release
                      <select
                        className="workspace-input"
                        value={mapMismatch ? "" : selection}
                        onChange={(event) => choose(event.target.value)}
                        disabled={!releases}
                      >
                        <option value="">
                          Choose explicitly — no default year
                        </option>
                        {selection &&
                          !releases?.some(
                            (item) => contextKey(item) === selection,
                          ) && (
                            <option value={selection}>
                              Requested deep-linked release
                            </option>
                          )}
                        {releases
                          ?.filter(
                            (item) =>
                              state.active !== "map" ||
                              !mapTarget.program ||
                              item.program_id === mapTarget.program,
                          )
                          .map((item) => (
                            <option
                              key={contextKey(item)}
                              value={contextKey(item)}
                            >
                              {item.campus_id.toUpperCase()} ·{" "}
                              {programName(item.program_id)} ·{" "}
                              {item.catalog_year}{" "}
                            </option>
                          ))}
                      </select>
                    </label>
                    <p className="mt-2 text-xs text-muted">
                      Changing release clears incompatible selections and
                      allocations.
                    </p>
                  </details>
                </div>
                {listingError && (
                  <div role="alert" className="workspace-notice mb-4">
                    <p>{listingError}</p>
                    <GlassButton
                      variant="secondary"
                      onClick={() => setAttempt((value) => value + 1)}
                    >
                      Retry catalog connection
                    </GlassButton>
                  </div>
                )}
                {!releases && !listingError && (
                  <p role="status">Loading persisted catalog list…</p>
                )}
                {releases?.length === 0 && (
                  <p role="status" className="workspace-notice">
                    No catalog releases imported. Follow the explicit fixture
                    import in README; no catalog is fabricated.
                  </p>
                )}
                {!catalog ? (
                  <div>
                    {catalogError?.key === selection ? (
                      <p role="alert" className="workspace-notice">
                        {catalogError.message}
                      </p>
                    ) : selection ? (
                      <p role="status">Loading the exact requested release…</p>
                    ) : (
                      <p className="text-sm text-muted">
                        Your selections remain hypothetical. No academic context
                        is chosen automatically.
                      </p>
                    )}
                    {selection && catalogError?.key === selection && (
                      <GlassButton
                        variant="secondary"
                        className="mt-4"
                        onClick={() => setAttempt((value) => value + 1)}
                      >
                        Retry exact release
                      </GlassButton>
                    )}
                  </div>
                ) : (
                  <>
                    {state.active === "map" &&
                      summary &&
                      (mapMismatch ? (
                        <p className="workspace-notice">
                          Choose a catalog edition for{" "}
                          {programName(mapTarget.program!)} above. Your existing
                          history stays in its current context until you choose.
                        </p>
                      ) : (
                        <>
                          {mapTarget.courseCode &&
                            !catalog.release.courses.some(
                              (c) => c.code === mapTarget.courseCode,
                            ) && (
                              <p role="status" className="workspace-notice">
                                That course isn’t captured in this edition.
                                Choose an available course.
                              </p>
                            )}
                          <DegreeMap
                            key={`${catalog.release.id}:${mapTarget.courseCode ?? ""}:${mapTarget.direction ?? "both"}`}
                            initialDirection={mapTarget.direction}
                            initialFocus={
                              catalog.release.courses.find(
                                (c) => c.code === mapTarget.courseCode,
                              )?.identity.id
                            }
                            state={state}
                            dispatch={dispatch}
                            preview={preview}
                            openHistory={() => navigate("completed")}
                            openProgress={() => navigate("progress")}
                          />
                        </>
                      ))}
                    {state.active === "completed" && (
                      <>
                        <CompactCourses state={state} dispatch={dispatch} />
                        <button
                          className="explorer-text-button mt-4"
                          onClick={() => navigate("map")}
                        >
                          Return to degree map →
                        </button>
                        <button
                          className="action-card mt-4"
                          onClick={() =>
                            setAdvising((current) =>
                              applyUpdate(current, {
                                key: "completedCourses",
                                fact: reported(
                                  state.selected.map((id) => {
                                    const course = catalog.release.courses.find(
                                      (item) => item.identity.id === id,
                                    )!;
                                    return {
                                      code: course.code,
                                      institutionId: catalog.release.campus_id,
                                      context: {
                                        campusId: catalog.release.campus_id,
                                        programId: catalog.release.program.id,
                                        releaseId: catalog.release.id,
                                        courseId: id,
                                      },
                                    };
                                  }),
                                ),
                              }),
                            )
                          }
                        >
                          Use these fictional completed courses in my profile
                        </button>
                      </>
                    )}
                    {state.active === "progress" && summary && (
                      <>
                        <DegreeProgress state={state} preview={preview} />
                        <button
                          className="explorer-text-button mt-4"
                          onClick={() => navigate("map")}
                        >
                          Return to degree map →
                        </button>
                      </>
                    )}
                    <button
                      className="action-card mt-4"
                      onClick={() =>
                        setAdvising((current) =>
                          applyUpdate(current, {
                            key: "academicContext",
                            fact: reported({
                              campusId: catalog.release.campus_id,
                              programId: catalog.release.program.id,
                              releaseId: catalog.release.id,
                              applicability: "hypothetical_confirmed",
                            }),
                          }),
                        )
                      }
                    >
                      Use this draft for the fictional scenario only
                    </button>
                    <details className="mt-6 text-xs text-muted">
                      <summary>Draft catalog limitations</summary>
                      <p>{catalog.limitation}</p>
                      <p className="mt-2 break-all">
                        Release: {catalog.release.id}
                      </p>
                    </details>
                  </>
                )}
              </>
            )}
          </GlassPanel>
        )}
        <footer className="prototype-footer">
          <p>
            Independent prototype ·{" "}
            {aiAvailable && consent ? "External AI conversation" : "No live AI"}
          </p>
          <details>
            <summary>About this prototype</summary>
            <p>
              No CUNY or BMCC endorsement. Fictional scenarios only; do not
              enter real student information. Conversation and selections are
              kept only in tab memory and clear on refresh. This is not a
              complete degree audit. Source verification is not institutional
              approval.
            </p>
          </details>
        </footer>
      </main>
    </div>
  );
}
