"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import {
  CHECKIN_SLIDERS,
  DEFAULT_SCORES,
  SLIDER_MAX,
  SLIDER_MIN,
  WORSE_THRESHOLD,
  type SliderId,
} from "@/lib/checkin/sliders";
import {
  CHECKIN_COMPLETED_KEY,
  CHECK_ANSWERS_KEY,
  SESSION_STARTED_KEY,
  SUPPORT_PLAN_KEY,
} from "@/lib/session/keys";
import { isSupportPlan } from "@/lib/session/plan";

const STABLE_RESOURCES: { label: string; href?: string }[] = [
  { label: "Try 5 minutes of the Headspace app (free for students)" },
  { label: "Student Minds", href: "https://studentminds.org.uk" },
  {
    label: "NHS Every Mind Matters",
    href: "https://nhs.uk/every-mind-matters",
  },
];

const FALLBACK_ROUTES = [
  "Contact your university counselling service",
  "Self-refer to NHS Talking Therapies: nhs.uk/mental-health/talking-therapies",
  "If things feel urgent tonight: Samaritans 116 123",
];

export function CheckInPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [submitted, setSubmitted] = useState(false);
  const [outcome, setOutcome] = useState<"stable" | "worse" | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<string[]>([]);

  useEffect(() => {
    const storedPlan = sessionStorage.getItem(SUPPORT_PLAN_KEY);

    if (!storedPlan) {
      router.replace("/");
      return;
    }

    try {
      const plan = JSON.parse(storedPlan) as unknown;

      if (!isSupportPlan(plan)) {
        router.replace("/");
        return;
      }

      setSavedRoutes(plan.route);
      setReady(true);
    } catch {
      router.replace("/");
    }
  }, [router]);

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

  const handleRestart = () => {
    sessionStorage.removeItem(SESSION_STARTED_KEY);
    sessionStorage.removeItem(CHECK_ANSWERS_KEY);
    sessionStorage.removeItem(SUPPORT_PLAN_KEY);
    sessionStorage.removeItem(CHECKIN_COMPLETED_KEY);
    router.push("/");
  };

  const routesToShow = savedRoutes.length > 0 ? savedRoutes : FALLBACK_ROUTES;

  if (!ready) {
    return null;
  }

  return (
    <PageShell step={5}>
      {!submitted && (
        <div className="max-w-lg">
          <h1 className="text-xl font-semibold text-slate-900">
            How have you been since your support check?
          </h1>
          <p className="mt-2 text-slate-600">
            Three quick questions — no right or wrong answers. This is just
            for you.
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
                  className="mt-3 h-2 w-full cursor-pointer accent-[#2d5a4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a4a] focus-visible:ring-offset-2"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-500">
                  <span>{slider.lowLabel}</span>
                  <span>{slider.highLabel}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {slider.label}: {scores[slider.id]}
                </p>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            className="mt-8 w-full sm:w-auto"
          >
            Share how I&apos;ve been
          </Button>
        </div>
      )}

      {submitted && outcome === "stable" && (
        <div className="max-w-lg">
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-green-900">
              Really glad to hear you&apos;re holding steady.
            </h1>
            <p className="mt-2 text-green-800">
              Taking steps to look after yourself takes courage. You&apos;ve
              done something important today.
            </p>
          </div>

          <p className="mt-6 text-slate-700">
            Your support plan is still there whenever you need it. Small daily
            actions add up — here are a few to try:
          </p>

          <ul className="mt-4 space-y-2">
            {STABLE_RESOURCES.map((resource) => (
              <li
                key={resource.label}
                className="flex items-start gap-2 text-slate-800"
              >
                <span className="mt-0.5 text-slate-400">→</span>
                {resource.href ? (
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2d5a4a] underline"
                  >
                    {resource.label}
                  </a>
                ) : (
                  <span>{resource.label}</span>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-slate-500">
            If things feel harder later, come back and go through the support
            check again — it&apos;s always here.
          </p>

          <Button
            variant="ghost"
            size="md"
            onClick={handleRestart}
            className="mt-4"
          >
            Start a new support check
          </Button>
        </div>
      )}

      {submitted && outcome === "worse" && (
        <div className="max-w-lg">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-amber-900">
              It sounds like things have been harder.
            </h1>
            <p className="mt-2 text-amber-800">
              Thank you for checking in honestly. You don&apos;t have to
              manage this alone — please reach out to one of these tonight.
            </p>
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                window.location.href = "tel:116123";
              }}
              className="w-full sm:w-auto"
            >
              Talk to someone now
            </Button>
          </div>

          <ol className="mt-6 list-decimal space-y-3 pl-5 text-slate-800">
            {routesToShow.map((route) => (
              <li key={route}>{route}</li>
            ))}
          </ol>

          <p className="mt-6 text-slate-600">
            Any one of these steps matters. You reached out once — you can do
            it again.
          </p>

          <Button
            variant="ghost"
            size="md"
            onClick={handleRestart}
            className="mt-4"
          >
            Start a new support check
          </Button>
        </div>
      )}
    </PageShell>
  );
}
