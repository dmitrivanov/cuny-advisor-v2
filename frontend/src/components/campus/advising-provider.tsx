"use client";
import { createContext, useContext, useState } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { initialAdvising } from "@/lib/advising/profile";
import type { AdvisingState } from "@/lib/advising/profile";
const Context = createContext<{
  advising: AdvisingState;
  setAdvising: Dispatch<SetStateAction<AdvisingState>>;
} | null>(null);
export function AdvisingProvider({ children }: { children: ReactNode }) {
  const [advising, setAdvising] = useState(initialAdvising);
  return (
    <Context.Provider value={{ advising, setAdvising }}>
      {children}
    </Context.Provider>
  );
}
export function useAdvising() {
  const value = useContext(Context);
  if (!value) throw new Error("AdvisingProvider required");
  return value;
}
