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
      className="fixed bottom-28 right-4 z-40 min-h-[44px] rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-medium text-rose-700 shadow-sm transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
    >
      Need urgent help?
    </button>
  );
}
