"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ActionPlan } from "@/components/ActionPlan";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
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
  "Matching support options for your situation…",
  "Preparing your next steps…",
  "Almost there…",
] as const;

export function PlanPage() {
  const router = useRouter();
  const { triggerCrisisOverride } = useCrisis();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [plan, setPlan] = useState<SupportPlan | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingTimers = useRef<ReturnType<typeof setInterval>[]>([]);

  const startLoadingAnimation = () => {
    setLoadingMsgIdx(0);
    setLoadingProgress(0);

    const msgInterval = setInterval(() => {
      setLoadingMsgIdx((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 3000);

    const progressInterval = setInterval(() => {
      setLoadingProgress((p) => Math.min(p + 1, 90));
    }, 150);

    loadingTimers.current = [msgInterval, progressInterval];
  };

  const stopLoadingAnimation = () => {
    for (const timer of loadingTimers.current) {
      clearInterval(timer);
    }
    loadingTimers.current = [];
    setLoadingProgress(100);
  };

  const fetchPlan = async () => {
    setStatus("loading");
    startLoadingAnimation();

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
        stopLoadingAnimation();
        return;
      }

      const data: unknown = await response.json();

      if (!isSupportPlan(data)) {
        setStatus("error");
        stopLoadingAnimation();
        return;
      }

      if (data.urgency_band === "urgent" || data.safety_flag) {
        stopLoadingAnimation();
        triggerCrisisOverride();
        setStatus("ready");
        return;
      }

      stopLoadingAnimation();
      sessionStorage.setItem(SUPPORT_PLAN_KEY, JSON.stringify(data));
      setPlan(data);
      setStatus("ready");
    } catch {
      stopLoadingAnimation();
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
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <div className="w-full max-w-xs">
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#2d5a4a] transition-all duration-150 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p
              key={loadingMsgIdx}
              className="mt-6 text-base text-slate-600 transition-opacity duration-500"
            >
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              This usually takes 10–20 seconds
            </p>
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
              route={plan.route}
            />
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/message")}
              className="mt-8 w-full sm:w-auto"
            >
              Get your copy-ready message
            </Button>
          </div>
        )}
    </PageShell>
  );
}
