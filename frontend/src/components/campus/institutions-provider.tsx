"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { decodeRegistry } from "@/lib/advising/campuses";
import type { Campus } from "@/lib/advising/campuses";
type Registry = {
  campuses: readonly Campus[];
  loading: boolean;
  error: string;
  retry: () => void;
};
const Context = createContext<Registry | null>(null);
export function InstitutionsProvider({ children }: { children: ReactNode }) {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/institutions", { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return decodeRegistry(await r.json());
      })
      .then((items) => {
        setCampuses(items);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCampuses([]);
          setError(
            "Institution registry unavailable. Check the local V2 database setup.",
          );
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <Context.Provider
      value={{
        campuses,
        loading,
        error,
        retry: () => {
          setLoading(true);
          setError("");
          setAttempt((n) => n + 1);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useInstitutions() {
  const value = useContext(Context);
  if (!value) throw new Error("InstitutionsProvider required");
  return value;
}
