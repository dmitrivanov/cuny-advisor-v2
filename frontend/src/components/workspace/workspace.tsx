"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
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
import {
  CatalogExplorer,
  CompletedCourses,
  DegreeProgress,
} from "./academic-modules";

const contextKey = (
  item: Pick<Summary, "campus_id" | "program_id" | "release_id">,
) => JSON.stringify([item.campus_id, item.program_id, item.release_id]);
type Message = { role: "you" | "guide"; text: string; actions?: ModuleId[] };
export function Workspace({ campus }: { campus: Campus }) {
  const { advising, setAdvising } = useAdvising();
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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "guide",
      text: `Hi! I’m the ${campus.shortName} advising assistant prototype. What would you like help with today? Supported prompts and fictional information only.`,
      actions: ["completed"],
    },
  ]);
  useEffect(() => {
    const log = conversationRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);
  const readLocation = useCallback(() => {
    const url = new URL(window.location.href);
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
      url.searchParams.set("campus", item.campus_id);
      url.searchParams.set("program", item.program_id);
      url.searchParams.set("release", item.release_id);
    }
    window.history.pushState(null, "", url);
    readLocation();
  }
  function send(text: string) {
    if (!text.trim()) return;
    const proposal = interpretBounded(text);
    const accepted = proposal && validateProposal(proposal, advising);
    if (accepted)
      setAdvising((current) => {
        let next = proposal.goal ? setGoal(current, proposal.goal) : current;
        for (const update of proposal.updates) next = applyUpdate(next, update);
        return next;
      });
    const reply: Guidance = accepted
      ? { text: proposal.message, actions: proposal.actions }
      : guidance(text);
    setMessages((items) => [
      ...items.slice(-37),
      { role: "you", text: text.trim().slice(0, 600) },
      { role: "guide", ...reply },
    ]);
    setInput("");
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
          <strong>
            CUNY Advisor
          </strong>
        </a>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>{campus.shortName} · No live AI</span>
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
                    {message.role === "you" ? "You" : "Local guide"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {message.text}
                  </p>
                  {message.actions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((id) => (
                        <button
                          key={id}
                          className="action-card"
                          onClick={() => navigate(id)}
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
            <form
              className="mt-6"
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <label className="field-label" htmlFor="chat-input">
                Your navigation prompt
              </label>
              <textarea
                className="workspace-input mt-2"
                id="chat-input"
                rows={2}
                maxLength={600}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Try: Open completed courses"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-muted">
                  Supported prompts only. Messages stay in this tab.
                </p>
                <GlassButton type="submit" disabled={!input.trim()}>
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
                        value={selection}
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
                        {releases?.map((item) => (
                          <option
                            key={contextKey(item)}
                            value={contextKey(item)}
                          >
                            {item.campus_id.toUpperCase()} ·{" "}
                            {programName(item.program_id)} · {item.catalog_year}{" "}
                            · {item.release_id}
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
                    {state.active === "catalog" && (
                      <CatalogExplorer
                        catalog={catalog}
                        state={state}
                        dispatch={dispatch}
                      />
                    )}
                    {state.active === "completed" && (
                      <>
                        <CompletedCourses state={state} dispatch={dispatch} />
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
                      <DegreeProgress state={state} summary={summary} />
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
          <p>Independent prototype · No live AI</p>
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
