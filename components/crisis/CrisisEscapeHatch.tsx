"use client";

import { useCrisis } from "./CrisisProvider";

export function CrisisEscapeHatch() {
  const { isCrisisActive, triggerCrisisOverride } = useCrisis();

  if (isCrisisActive) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={triggerCrisisOverride}
      className="fixed bottom-20 right-4 z-40 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-sm transition-colors hover:bg-rose-50"
    >
      Need urgent help?
    </button>
  );
}
