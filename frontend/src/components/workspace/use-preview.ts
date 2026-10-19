"use client";
import { useEffect, useState } from "react";
import { getProgressBody } from "@/lib/workspace/api";
import { previewBody } from "@/lib/workspace/state";
import type { Progress, Summary, WorkspaceState } from "@/lib/workspace/types";
export function usePreview(state: WorkspaceState, summary: Summary | null) {
  const context = JSON.stringify([
    state.catalog?.release.campus_id,
    state.catalog?.release.program.id,
    state.catalog?.release.id,
  ]);
  const [assumedFor, setAssumedFor] = useState(""),
    [requested, setRequested] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<{
    key: string;
    value?: Progress;
    error?: string;
  } | null>(null);
  const assumed = assumedFor === context;
  const setAssumed = (value: boolean) => setAssumedFor(value ? context : "");
  const key = JSON.stringify([summary ?? null, previewBody(state)]);
  const resultKey = JSON.stringify([key, attempt]);
  const enabled = requested && assumed && !!summary && !!state.catalog;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const [item, body] = JSON.parse(key) as [
      Summary,
      ReturnType<typeof previewBody>,
    ];
    getProgressBody(item, body, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setResponse({ key: resultKey, value });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResponse({
            key: resultKey,
            error:
              error instanceof Error
                ? error.message
                : "Preview unavailable. Please try again.",
          });
      });
    return () => controller.abort();
  }, [enabled, key, resultKey]);
  const current = response?.key === resultKey ? response : null;
  return {
    assumed,
    setAssumed,
    run: () => {
      setRequested(true);
      setAttempt((n) => n + 1);
    },
    busy: enabled && !current,
    stale: !!response && !current,
    value: current?.value,
    error: current?.error,
  };
}
export type PreviewController = ReturnType<typeof usePreview>;
