"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionPlan } from "@/components/ActionPlan";
import { CrisisFooter } from "@/components/CrisisFooter";
import { useCrisis } from "@/components/crisis/CrisisProvider";
import type { SupportPlan } from "@/lib/manus/support-plan";
import {
  CHECK_ANSWERS_KEY,
  SUPPORT_PLAN_KEY,
} from "@/lib/session/keys";

type PageStatus = "loading" | "ready" | "error";

function isSupportPlan(value: unknown): value is SupportPlan {
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

export function PlanPage() {
  const router = useRouter();
  const { triggerCrisisOverride } = useCrisis();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [plan, setPlan] = useState<SupportPlan | null>(null);

  const fetchPlan = async () => {
    setStatus("loading");

    const storedAnswers = sessionStorage.getItem(CHECK_ANSWERS_KEY);
    if (!storedAnswers) {
      router.replace("/");
      return;
    }

    let answers: Record<string, string>;

    try {
      answers = JSON.parse(storedAnswers) as Record<string, string>;
    } catch {
      router.replace("/");
      return;
    }

    try {
      const response = await fetch("/api/support-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const data: unknown = await response.json();

      if (!isSupportPlan(data)) {
        setStatus("error");
        return;
      }

      if (data.urgency_band === "urgent" || data.safety_flag) {
        triggerCrisisOverride();
        setStatus("ready");
        return;
      }

      sessionStorage.setItem(SUPPORT_PLAN_KEY, JSON.stringify(data));
      setPlan(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 pt-8">
        <p className="text-sm font-medium tracking-wide text-slate-500">
          ClearHead
        </p>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-24 pt-6">
        {status === "loading" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <p className="mt-4 text-slate-600">
              Finding your support options…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="max-w-lg">
            <h1 className="text-xl font-semibold text-slate-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-slate-600">
              We couldn&apos;t load your support plan. Please try again.
            </p>
            <button
              type="button"
              onClick={() => void fetchPlan()}
              className="mt-6 rounded-full bg-slate-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" &&
          plan &&
          (plan.urgency_band === "low" || plan.urgency_band === "moderate") && (
          <div>
            <ActionPlan
              urgencyBand={plan.urgency_band}
              route={plan.route}
            />
            <button
              type="button"
              onClick={() => router.push("/message")}
              className="mt-8 rounded-full bg-slate-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-slate-800"
            >
              See your copy-ready message
            </button>
          </div>
          )}
      </main>

      <CrisisFooter />
    </div>
  );
}
