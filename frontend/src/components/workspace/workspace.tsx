"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
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
export function Workspace() {
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
  const [chatOpen, setChatOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "guide",
      text: "Welcome. I can open supported modules using the prompts below. This is a deterministic local navigation guide, not a live AI advisor. Please use fictional course selections only.",
      actions: ["catalog", "completed"],
    },
  ]);
  const readLocation = useCallback(() => {
    const url = new URL(window.location.href);
    dispatch({ type: "navigate", module: moduleFromHash(url.hash) });
    const parts = ["campus", "program", "release"].map((name) =>
      url.searchParams.get(name),
    );
    const key = parts.every(Boolean) ? JSON.stringify(parts) : "";
    if (key !== contextRef.current) {
      contextRef.current = key;
      dispatch({ type: "reset" });
      setSelection(key);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(() => {
      readLocation();
      setNavOpen(window.matchMedia("(min-width: 768px)").matches);
    });
    window.addEventListener("popstate", readLocation);
    window.addEventListener("hashchange", readLocation);
    return () => {
      window.removeEventListener("popstate", readLocation);
      window.removeEventListener("hashchange", readLocation);
    };
  }, [readLocation]);
  useEffect(() => {
    const controller = new AbortController();
    listReleases(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setReleases(items);
          setListingError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setListingError(error.message);
      });
    return () => controller.abort();
  }, [attempt]);
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
          dispatch({ type: "catalog", catalog });
          setCatalogError(null);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setCatalogError({ key: selection, message: error.message });
      });
    return () => controller.abort();
  }, [selection, attempt]);
  function navigate(module: ModuleId) {
    const url = new URL(window.location.href);
    url.hash = module;
    window.history.pushState(null, "", url);
    dispatch({ type: "navigate", module });
    if (module === "chat") setChatOpen(true);
    else if (window.matchMedia("(max-width: 767px)").matches)
      setChatOpen(false);
  }
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
    const reply: Guidance = guidance(text);
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
  return (
    <div className="workspace-root">
      <a className="skip-link" href="#main-content">
        Skip to workspace
      </a>
      <header className="site-header">
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-4">
          <a
            href="#chat"
            className="flex items-center gap-3"
            onClick={(event) => {
              event.preventDefault();
              navigate("chat");
            }}
          >
            <span className="brand-mark">
              <AcademicIcon name="compass" className="size-6" />
            </span>
            <span>
              <strong className="block tracking-tight">
                CUNY Advisor <span className="font-normal text-muted">V2</span>
              </strong>
              <span className="text-xs text-muted">
                A workspace for your next question
              </span>
            </span>
          </a>
          <span className="preview-label workspace-header-badge">
            Local development · No live AI
          </span>
        </div>
      </header>
      <main
        id="main-content"
        className="page-container pb-10 pt-6"
        tabIndex={-1}
      >
        <aside className="workspace-notice mb-6">
          <strong>Independent academic prototype.</strong> No CUNY or BMCC
          endorsement. Fictional scenarios only; no real student information.
          Nothing in this session is saved.
        </aside>
        <div className="workspace-context mb-6">
          <div>
            <p className="eyebrow mb-2">Academic context</p>
            <p className="text-sm">
              {summary
                ? `${summary.campus_id.toUpperCase()} · ${programName(summary.program_id)} · ${summary.catalog_year}`
                : "Choose a persisted draft release to explore academic modules."}
            </p>
            {summary && (
              <p className="mt-1 break-all text-xs text-muted">
                {summary.release_id} · {state.selected.length} unique
                hypothetical selections
              </p>
            )}
          </div>
          <details className="context-choice">
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
                <option value="">Choose explicitly — no default year</option>
                {selection &&
                  !releases?.some((item) => contextKey(item) === selection) && (
                    <option value={selection}>
                      Requested deep-linked release
                    </option>
                  )}
                {releases?.map((item) => (
                  <option key={contextKey(item)} value={contextKey(item)}>
                    {item.campus_id.toUpperCase()} ·{" "}
                    {programName(item.program_id)} · {item.catalog_year} ·{" "}
                    {item.release_id}
                  </option>
                ))}
              </select>
            </label>
          </details>
          <p className="text-xs text-muted sm:col-span-2">
            Changing release clears all hypothetical selections and allocations.{" "}
            {catalog && (
              <a
                className="source-link"
                href={`?campus=${encodeURIComponent(catalog.release.campus_id)}&program=${encodeURIComponent(catalog.release.program.id)}&release=${encodeURIComponent(catalog.release.id)}#${state.active}`}
              >
                Open a fresh deep-linked workspace
              </a>
            )}
          </p>
        </div>
        {listingError && (
          <div role="alert" className="workspace-notice mb-5">
            <p>{listingError}</p>
            <GlassButton
              variant="secondary"
              className="mt-3"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Retry catalog connection
            </GlassButton>
          </div>
        )}
        {!releases && !listingError && (
          <p role="status" className="mb-4 text-sm">
            Loading persisted catalog list…
          </p>
        )}
        {releases?.length === 0 && (
          <p role="status" className="workspace-notice mb-4">
            No catalog releases imported. Follow the explicit fixture import in
            README; no catalog is fabricated.
          </p>
        )}
        <details
          className="module-menu mb-6"
          open={navOpen}
          onToggle={(event) => setNavOpen(event.currentTarget.open)}
        >
          <summary className="font-semibold">Workspace modules</summary>
          <nav
            aria-label="Academic modules"
            className="mt-3 flex flex-wrap gap-2"
          >
            {modules.map((module) => (
              <a
                key={module.id}
                href={`#${module.id}`}
                aria-current={state.active === module.id ? "page" : undefined}
                className={`module-link ${state.active === module.id ? "module-link--active" : ""}`}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(module.id);
                }}
              >
                {module.name}
                {module.availability !== "active" && (
                  <span className="ml-2 text-xs">
                    {module.availability === "future" ? "Future" : "Preview"}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </details>
        <div
          className={`workspace-columns ${state.active === "chat" ? "workspace-columns--home" : ""}`}
        >
          <GlassPanel className="conversation-panel self-start">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">Start with a conversation</p>
                <h1 className="font-editorial text-3xl">
                  A little more clarity.
                </h1>
                <p className="mt-2 text-sm text-muted">
                  Local navigation guide · Supported prompts only
                </p>
              </div>
              <button
                className="module-link shrink-0 whitespace-nowrap"
                aria-expanded={chatOpen}
                aria-controls="conversation-content"
                onClick={() => setChatOpen((value) => !value)}
              >
                {chatOpen ? "Collapse" : "Open chat"}
              </button>
            </div>
            <div id="conversation-content" hidden={!chatOpen}>
              <div
                className="conversation-messages"
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
                    <p className="mb-2 text-xs font-semibold">
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
                            {modules.find((item) => item.id === id)!.name}{" "}
                            <span aria-hidden="true">↗</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <form
                className="mt-5"
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
                  rows={3}
                  maxLength={600}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Try: Open completed courses"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    No chat messages are sent to a server.
                  </p>
                  <GlassButton type="submit" disabled={!input.trim()}>
                    Send
                  </GlassButton>
                </div>
              </form>
              <details className="mt-5">
                <summary className="text-sm font-semibold">
                  Supported prompts
                </summary>
                <div className="mt-3 grid gap-2">
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
            </div>
          </GlassPanel>
          {state.active === "chat" ? (
            <aside className="space-y-5">
              <div className="rounded-card border border-line bg-soft p-6">
                <p className="eyebrow mb-3">One workspace. Connected tools.</p>
                <h2 className="text-xl font-semibold">
                  Where would you like to begin?
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Browse a draft catalog, explore hypothetical completions, then
                  review what the deterministic rules can—and cannot—establish.
                </p>
              </div>
              {modules
                .filter((module) =>
                  ["catalog", "completed", "progress"].includes(module.id),
                )
                .map((module) => (
                  <button
                    key={module.id}
                    className="workspace-module-card"
                    onClick={() => navigate(module.id)}
                  >
                    <span className="mb-2 block text-lg font-semibold">
                      {module.name} <span className="text-brand">↗</span>
                    </span>
                    <span className="text-sm text-muted">
                      {module.description}
                    </span>
                  </button>
                ))}
            </aside>
          ) : (
            <GlassPanel className="module-panel min-w-0">
              <p className="eyebrow mb-2">
                Academic module · {active.availability}
              </p>
              <h2 className="mb-3 text-2xl font-semibold">{active.name}</h2>
              <p className="mb-6 text-sm text-muted">{active.description}</p>
              {active.availability === "future" ? (
                <p className="workspace-notice">
                  Not implemented. No upload, planner, reporting or handoff
                  service is available. Continue with Chat, Catalog or Completed
                  Courses.
                </p>
              ) : !catalog ? (
                <div>
                  {catalogError?.key === selection ? (
                    <p role="alert" className="workspace-notice">
                      {catalogError.message}
                    </p>
                  ) : selection ? (
                    <p role="status">Loading the exact requested release…</p>
                  ) : (
                    <p className="workspace-notice">
                      Choose a program and release above to open this module.
                      Existing selections never carry into another release.
                    </p>
                  )}
                  {selection && catalogError?.key === selection && (
                    <GlassButton
                      className="mt-4"
                      variant="secondary"
                      onClick={() => setAttempt((value) => value + 1)}
                    >
                      Retry exact release
                    </GlassButton>
                  )}
                </div>
              ) : (
                <>
                  <p className="workspace-notice mb-5">{catalog.limitation}</p>
                  {state.active === "catalog" && (
                    <CatalogExplorer
                      catalog={catalog}
                      state={state}
                      dispatch={dispatch}
                    />
                  )}
                  {state.active === "completed" && (
                    <CompletedCourses state={state} dispatch={dispatch} />
                  )}
                  {state.active === "progress" && summary && (
                    <DegreeProgress state={state} summary={summary} />
                  )}
                </>
              )}
            </GlassPanel>
          )}
        </div>
        <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-line py-5 text-xs text-muted">
          <p>Independent project · English-language local prototype</p>
          <p>No official degree audit, live AI or student accounts</p>
        </footer>
      </main>
    </div>
  );
}
