const TOTAL_STEPS = 5;

type FlowProgressProps = {
  step: number;
};

export function FlowProgress({ step }: FlowProgressProps) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-label={`Step ${step} of ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 < step
              ? "h-2 w-2 bg-slate-400"
              : i + 1 === step
                ? "h-2 w-5 bg-[#2d5a4a]"
                : "h-2 w-2 bg-slate-200"
          }`}
        />
      ))}
      <span className="ml-1.5 text-xs text-slate-500">
        Step {step} of {TOTAL_STEPS}
      </span>
    </div>
  );
}
