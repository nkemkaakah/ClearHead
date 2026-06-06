"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { detectCrisisLanguage } from "@/lib/crisis/detect";
import { CrisisListener } from "./CrisisListener";
import { CrisisOverride } from "./CrisisOverride";

type CrisisContextValue = {
  isCrisisActive: boolean;
  triggerCrisisOverride: () => void;
  checkForCrisis: (text: string) => boolean;
};

const CrisisContext = createContext<CrisisContextValue | null>(null);

export function CrisisProvider({ children }: { children: ReactNode }) {
  const [isCrisisActive, setIsCrisisActive] = useState(false);

  const triggerCrisisOverride = useCallback(() => {
    setIsCrisisActive(true);
  }, []);

  const checkForCrisis = useCallback(
    (text: string) => {
      if (detectCrisisLanguage(text)) {
        setIsCrisisActive(true);
        return true;
      }
      return false;
    },
    [],
  );

  const value = useMemo(
    () => ({
      isCrisisActive,
      triggerCrisisOverride,
      checkForCrisis,
    }),
    [isCrisisActive, triggerCrisisOverride, checkForCrisis],
  );

  return (
    <CrisisContext.Provider value={value}>
      <CrisisListener />
      {children}
      {isCrisisActive ? <CrisisOverride /> : null}
    </CrisisContext.Provider>
  );
}

export function useCrisis(): CrisisContextValue {
  const context = useContext(CrisisContext);
  if (!context) {
    throw new Error("useCrisis must be used within CrisisProvider");
  }
  return context;
}
