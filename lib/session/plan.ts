import type { SupportPlan } from "@/lib/manus/support-plan";

function isMessageDraftArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      (item as Record<string, unknown>).recipient !== undefined &&
      typeof (item as Record<string, unknown>).label === "string" &&
      typeof (item as Record<string, unknown>).text === "string",
  );
}

export function isSupportPlan(value: unknown): value is SupportPlan {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const plan = value as Record<string, unknown>;

  return (
    (plan.urgency_band === "low" ||
      plan.urgency_band === "moderate" ||
      plan.urgency_band === "urgent") &&
    typeof plan.primary_route === "string" &&
    Array.isArray(plan.secondary_routes) &&
    (plan.secondary_routes as unknown[]).every(
      (item) => typeof item === "string",
    ) &&
    typeof plan.message === "string" &&
    isMessageDraftArray(plan.messages) &&
    typeof plan.safety_flag === "boolean" &&
    Array.isArray(plan.main_concerns) &&
    (plan.main_concerns as unknown[]).every(
      (item) => typeof item === "string",
    ) &&
    typeof plan.explanation === "string" &&
    typeof plan.check_in_plan === "string" &&
    typeof plan.planned_action === "string"
  );
}
