import type { UrgencyBand } from "@/lib/manus/support-plan";

type ActionPlanProps = {
  urgencyBand: Exclude<UrgencyBand, "urgent">;
  route: string[];
};

const BAND_LABELS: Record<Exclude<UrgencyBand, "urgent">, string> = {
  low: "🟡 Low urgency signal — stress and early signs",
  moderate: "🟠 Moderate urgency signal — some functional impact",
};

export function ActionPlan({ urgencyBand, route }: ActionPlanProps) {
  return (
    <div className="max-w-lg">
      <p className="text-sm font-medium text-slate-500">Your urgency signal</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">
        {BAND_LABELS[urgencyBand]}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">
        Your next-step support plan
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Concrete support routes you can take tonight.
      </p>

      <ol className="mt-4 list-decimal space-y-3 pl-5">
        {route.map((step) => (
          <li key={step} className="text-slate-800">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
