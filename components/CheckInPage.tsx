"use client";

import { useEffect, useState } from "react";
import { CrisisFooter } from "@/components/CrisisFooter";
import {
  CHECKIN_SLIDERS,
  DEFAULT_SCORES,
  SLIDER_MAX,
  SLIDER_MIN,
  WORSE_THRESHOLD,
  type SliderId,
} from "@/lib/checkin/sliders";
import type { SupportPlan } from "@/lib/manus/support-plan";
import {
  CHECKIN_COMPLETED_KEY,
  SUPPORT_PLAN_KEY,
} from "@/lib/session/keys";

const STABLE_RESOURCES = [
  "Try 5 minutes of the Headspace app (free for students)",
  "Student Minds: studentminds.org.uk",
  "NHS Every Mind Matters: nhs.uk/every-mind-matters",
];

const FALLBACK_ROUTES = [
  "Contact your university counselling service",
  "Self-refer to NHS Talking Therapies: nhs.uk/mental-health/talking-therapies",
  "If things feel urgent tonight: Samaritans 116 123",
];

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

export function CheckInPage() {
  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [submitted, setSubmitted] = useState(false);
  const [outcome, setOutcome] = useState<"stable" | "worse" | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<string[]>([]);

  useEffect(() => {
    const storedPlan = sessionStorage.getItem(SUPPORT_PLAN_KEY);

    if (!storedPlan) {
      return;
    }

    try {
      const plan = JSON.parse(storedPlan) as unknown;

      if (isSupportPlan(plan)) {
        setSavedRoutes(plan.route);
      }
    } catch {
      // Keep fallback routes if plan cannot be parsed.
    }
  }, []);

  const handleScoreChange = (id: SliderId, value: number) => {
    setScores((current) => ({ ...current, [id]: value }));
  };

  const handleSubmit = () => {
    const average =
      (scores.mood + scores.sleep + scores.stress) / CHECKIN_SLIDERS.length;

    setOutcome(average >= WORSE_THRESHOLD ? "stable" : "worse");
    sessionStorage.setItem(CHECKIN_COMPLETED_KEY, new Date().toISOString());
    setSubmitted(true);
  };

  const routesToShow = savedRoutes.length > 0 ? savedRoutes : FALLBACK_ROUTES;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 pt-8">
        <p className="text-sm font-medium tracking-wide text-slate-500">
          ClearHead
        </p>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-24 pt-6">
        {!submitted && (
          <div className="max-w-lg">
            <h1 className="text-xl font-semibold text-slate-900">
              How have you been since your support check?
            </h1>
            <p className="mt-2 text-slate-600">
              Three quick questions. No right or wrong answers.
            </p>

            <div className="mt-8 space-y-8">
              {CHECKIN_SLIDERS.map((slider) => (
                <div key={slider.id}>
                  <label
                    htmlFor={slider.id}
                    className="block text-sm font-medium text-slate-900"
                  >
                    {slider.label}
                  </label>
                  <input
                    id={slider.id}
                    type="range"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={1}
                    value={scores[slider.id]}
                    onChange={(event) =>
                      handleScoreChange(slider.id, Number(event.target.value))
                    }
                    className="mt-3 w-full accent-slate-900"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>{slider.lowLabel}</span>
                    <span>{slider.highLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="mt-8 rounded-full bg-slate-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-slate-800"
            >
              Submit check-in
            </button>
          </div>
        )}

        {submitted && outcome === "stable" && (
          <div className="max-w-lg">
            <h1 className="text-xl font-semibold text-slate-900">
              Good to hear things are holding steady.
            </h1>
            <p className="mt-2 text-slate-600">
              Well done for taking this step. Your support plan is still there
              when you need it.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-slate-900">
              A small resource for today
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-800">
              {STABLE_RESOURCES.map((resource) => (
                <li key={resource}>{resource}</li>
              ))}
            </ul>

            <p className="mt-6 text-slate-600">
              If things feel harder, you can always come back and go through the
              support check again.
            </p>
          </div>
        )}

        {submitted && outcome === "worse" && (
          <div className="max-w-lg">
            <h1 className="text-xl font-semibold text-slate-900">
              It sounds like things have been harder.
            </h1>
            <p className="mt-2 text-slate-600">
              Here are your support options again — please reach out tonight.
            </p>

            <ol className="mt-6 list-decimal space-y-3 pl-5 text-slate-800">
              {routesToShow.map((route) => (
                <li key={route}>{route}</li>
              ))}
            </ol>

            <p className="mt-6 text-slate-600">
              You are not alone. Taking any one of these steps matters.
            </p>
          </div>
        )}
      </main>

      <CrisisFooter />
    </div>
  );
}
