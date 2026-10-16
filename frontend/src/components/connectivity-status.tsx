"use client";

import { GlassPanel } from "./ui/glass-panel";
import { GlassButton } from "./ui/glass-button";
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
    <GlassPanel aria-labelledby="connection-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="connection-title" className="text-lg font-semibold tracking-tight">Local connection</h2>
        <span className="preview-label">Live status</span>
      </div>
      <p role="status" aria-live="polite" className="mt-5 flex items-center gap-3 font-semibold">
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${status === "connected" ? "bg-success" : status === "unavailable" ? "bg-warning" : "bg-muted"}`} />
        {labels[status]}
      </p>
      <p className="mt-3 text-sm leading-7 text-muted">
        {status === "connected" ? "The website successfully reached the local FastAPI health endpoint." : status === "checking" ? "Contacting the local API. This may take a few seconds." : "Start the backend using the README instructions, then check again."}
      </p>
      <GlassButton variant="secondary" onClick={() => { setStatus("checking"); void checkConnection(); }} disabled={status === "checking"} className="mt-5">Check again</GlassButton>
    </GlassPanel>
  );
}
