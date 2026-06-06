import type { SupportPlan } from "@/lib/manus/support-plan";

export function isSupportPlan(value: unknown): value is SupportPlan {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const plan = value as Record<string, unknown>;

  return (
    (plan.urgency_band === "low" ||
      plan.urgency_band === "moderate" ||
      plan.urgency_band === "urgent") &&
    Array.isArray(plan.route) &&
    plan.route.every((item) => typeof item === "string") &&
    typeof plan.message === "string" &&
    typeof plan.safety_flag === "boolean"
  );
}
