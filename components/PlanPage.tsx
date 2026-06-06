"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionPlan } from "@/components/ActionPlan";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { RotatingLoadingText } from "@/components/ui/RotatingLoadingText";
import { useCrisis } from "@/components/crisis/CrisisProvider";
import type { SupportPlan } from "@/lib/manus/support-plan";
import {
  CHECK_ANSWERS_KEY,
  SUPPORT_PLAN_KEY,
} from "@/lib/session/keys";
import { isSupportPlan } from "@/lib/session/plan";

type PageStatus = "loading" | "ready" | "error";

const LOADING_MESSAGES = [
  "Reading your answers…",
  "Understanding what you're going through…",
  "Finding the right support options…",
  "Matching routes for your situation…",
  "Drafting your next steps…",
  "Preparing your copy-ready message…",
  "Almost ready…",
] as const;

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
    <PageShell step={3}>
      {status === "loading" && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="w-full max-w-sm">
            <RotatingLoadingText
              messages={LOADING_MESSAGES}
              active={status === "loading"}
            />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="max-w-lg">
          <h1 className="text-xl font-semibold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-slate-600">
            We couldn&apos;t load your support plan right now. Please try
            again — your answers are still saved.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            If you need help right now, the crisis numbers are below.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => void fetchPlan()}
            className="mt-6"
          >
            Try again
          </Button>
        </div>
      )}

      {status === "ready" &&
        plan &&
        (plan.urgency_band === "low" || plan.urgency_band === "moderate") && (
          <div className="max-w-lg">
            <ActionPlan
              urgencyBand={plan.urgency_band}
              primaryRoute={plan.primary_route}
              secondaryRoutes={plan.secondary_routes}
              mainConcerns={plan.main_concerns}
              explanation={plan.explanation}
              checkInPlan={plan.check_in_plan}
              plannedAction={plan.planned_action}
            />
            <p className="mt-4 text-sm text-slate-500">
              We&apos;ll send you a one-time check-in text in about 3 days to see
              how things are going. You can also come back to ClearHead any time.
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/message")}
              className="mt-6 w-full sm:w-auto"
            >
              Get your copy-ready message
            </Button>
          </div>
        )}
    </PageShell>
  );
}
