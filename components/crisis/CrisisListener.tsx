"use client";

import { useEffect } from "react";
import { useCrisis } from "./CrisisProvider";

export function CrisisListener() {
  const { checkForCrisis } = useCrisis();

  useEffect(() => {
    const handleInput = (event: Event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        checkForCrisis(target.value);
      }
    };

    document.addEventListener("input", handleInput);
    return () => document.removeEventListener("input", handleInput);
  }, [checkForCrisis]);

  return null;
}
