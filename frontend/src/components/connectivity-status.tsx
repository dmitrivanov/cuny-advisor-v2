"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "checking" | "connected" | "unavailable";

const labels: Record<Status, string> = {
  checking: "Checking connection…",
  connected: "Backend connected",
  unavailable: "Backend unavailable",
};

export function ConnectivityStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const controller = useRef<AbortController | null>(null);

  const checkConnection = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const timeout = setTimeout(() => request.abort(), 7000);
    try {
      const response = await fetch("/api/health", {
        cache: "no-store",
        signal: request.signal,
      });
      const result: unknown = await response.json();
      const healthy = response.ok && typeof result === "object" && result !== null
        && "status" in result && result.status === "ok";
      if (controller.current === request) setStatus(healthy ? "connected" : "unavailable");
    } catch {
      if (controller.current === request) setStatus("unavailable");
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    const initialCheck = setTimeout(() => void checkConnection(), 0);
    return () => {
      clearTimeout(initialCheck);
      controller.current?.abort();
      controller.current = null;
    };
  }, [checkConnection]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-7" aria-labelledby="connection-title">
      <h2 id="connection-title" className="text-xl font-bold">Local connection</h2>
      <p role="status" aria-live="polite" className="mt-5 flex items-center gap-3 font-semibold">
        <span aria-hidden="true" className={`h-3 w-3 rounded-full ${status === "connected" ? "bg-emerald-600" : status === "unavailable" ? "bg-amber-600" : "bg-slate-400"}`} />
        {labels[status]}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {status === "connected" ? "The website successfully reached the local FastAPI health endpoint." : status === "checking" ? "Contacting the local API. This may take a few seconds." : "Start the backend using the README instructions, then check again."}
      </p>
      <button type="button" onClick={() => { setStatus("checking"); void checkConnection(); }} disabled={status === "checking"} className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Check again</button>
    </section>
  );
}
