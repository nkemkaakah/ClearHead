"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import {
  CHECKIN_SLIDERS,
  DEFAULT_SCORES,
  roundScore,
  SLIDER_MAX,
  SLIDER_MIN,
  SLIDER_STEP,
  WORSE_THRESHOLD,
  type SliderId,
} from "@/lib/checkin/sliders";
import {
  ACTION_STATUS_KEY,
  CHECKIN_COMPLETED_KEY,
  CHECK_ANSWERS_KEY,
  PLANNED_ACTION_KEY,
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

type ActionQuestionAnswer = "sent" | "not_yet" | "replied" | null;

export function CheckInPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [smsScheduled, setSmsScheduled] = useState(false);
  const [outcome, setOutcome] = useState<"stable" | "worse" | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<string[]>([]);
  const [firstMessage, setFirstMessage] = useState("");

  // Action question state
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionQuestionAnswer, setActionQuestionAnswer] =
    useState<ActionQuestionAnswer>(null);
  const [actionQuestionDone, setActionQuestionDone] = useState(false);
  const [shortCopied, setShortCopied] = useState(false);

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

      const routes = [plan.primary_route, ...plan.secondary_routes].filter(Boolean);
      setSavedRoutes(routes.length > 0 ? routes : FALLBACK_ROUTES);
      setFirstMessage(plan.message);
      setReady(true);
    } catch {
      router.replace("/");
    }

    setActionStatus(sessionStorage.getItem(ACTION_STATUS_KEY));
  }, [router]);

  const handleScoreChange = (id: SliderId, value: number) => {
    setScores((current) => ({ ...current, [id]: value }));
  };

  const handleSubmit = async () => {
    const rounded = {
      mood: roundScore(scores.mood),
      sleep: roundScore(scores.sleep),
      stress: roundScore(scores.stress),
    };
    const average =
      (rounded.mood + rounded.sleep + rounded.stress) / CHECKIN_SLIDERS.length;

    setOutcome(average >= WORSE_THRESHOLD ? "stable" : "worse");
    sessionStorage.setItem(CHECKIN_COMPLETED_KEY, new Date().toISOString());

    if (phone.trim()) {
      try {
        const response = await fetch("/api/schedule-check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim() }),
        });
        if (response.ok) {
          setSmsScheduled(true);
        }
      } catch {
        // Non-critical — submit proceeds regardless
      }
    }

    setSubmitted(true);
  };

  const handleRestart = () => {
    sessionStorage.removeItem(SESSION_STARTED_KEY);
    sessionStorage.removeItem(CHECK_ANSWERS_KEY);
    sessionStorage.removeItem(SUPPORT_PLAN_KEY);
    sessionStorage.removeItem(CHECKIN_COMPLETED_KEY);
    sessionStorage.removeItem(ACTION_STATUS_KEY);
    sessionStorage.removeItem(PLANNED_ACTION_KEY);
    router.push("/");
  };

  const handleActionAnswer = (answer: ActionQuestionAnswer) => {
    setActionQuestionAnswer(answer);
    if (answer === "sent" || answer === "replied") {
      setActionQuestionDone(true);
    }
  };

  const handleShortCopy = async () => {
    await navigator.clipboard.writeText(firstMessage);
    setShortCopied(true);
    setTimeout(() => setShortCopied(false), 2000);
  };

  const routesToShow = savedRoutes.length > 0 ? savedRoutes : FALLBACK_ROUTES;
  const showActionQuestion =
    actionStatus === "sent" || actionStatus === "stuck";

  if (!ready) {
    return null;
  }

  return (
    <PageShell step={5}>
      {!submitted && (
        <div className="max-w-lg">
          {/* Action question — shown only if user went through MessagePage */}
          {showActionQuestion && !actionQuestionDone && (
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                A quick question first
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Before the sliders, just one question about your support plan.
              </p>
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                Did you manage to send the message we prepared?
              </h2>
              <div className="mt-4 space-y-2">
                {(
                  [
                    ["sent", "Yes, I sent it"],
                    ["not_yet", "Not yet"],
                    ["replied", "They replied"],
                  ] as [ActionQuestionAnswer, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleActionAnswer(value)}
                    className={`w-full rounded-xl border p-4 text-left text-sm font-medium transition-all ${
                      actionQuestionAnswer === value
                        ? "border-[#2d5a4a] bg-[#e8f0ed] text-slate-900 ring-2 ring-[#2d5a4a]"
                        : "border-slate-200 text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {actionQuestionAnswer === "sent" && (
                <div className="mt-4 rounded-lg bg-green-50 p-3">
                  <p className="text-sm text-green-800">
                    Well done — that took courage. Continue below.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setActionQuestionDone(true)}
                    className="mt-3"
                  >
                    Continue to sliders
                  </Button>
                </div>
              )}

              {actionQuestionAnswer === "replied" && (
                <div className="mt-4 rounded-lg bg-green-50 p-3">
                  <p className="text-sm text-green-800">
                    That&apos;s a great sign. Keep going — you&apos;re doing
                    the right thing.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setActionQuestionDone(true)}
                    className="mt-3"
                  >
                    Continue to sliders
                  </Button>
                </div>
              )}

              {actionQuestionAnswer === "not_yet" && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-600">
                    No rush — you can still send it. Copy it again below.
                  </p>
                  {firstMessage && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-[14px] leading-relaxed text-slate-800">
                      {firstMessage}
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => void handleShortCopy()}
                    className={`transition-colors ${shortCopied ? "bg-green-700 hover:bg-green-700" : ""}`}
                  >
                    {shortCopied ? "Copied ✓" : "Copy message"}
                  </Button>
                  <div>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setActionQuestionDone(true)}
                    >
                      I&apos;ll try again later — continue to sliders
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sliders — shown immediately if no action question, or after action question is done */}
          {(!showActionQuestion || actionQuestionDone) && (
            <>
              <h1 className="text-xl font-semibold text-slate-900">
                How have you been since your support check?
              </h1>
              <p className="mt-2 text-slate-600">
                We&apos;ll use this check-in to understand how things change
                over time. Three quick questions — no right or wrong answers.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                If you add your phone number, ClearHead will send you a
                one-time SMS in a few days to remind you to check in again.
              </p>

              <div className="mt-8 space-y-8">
                {CHECKIN_SLIDERS.map((slider) => {
                  const fillPercent =
                    ((scores[slider.id] - SLIDER_MIN) /
                      (SLIDER_MAX - SLIDER_MIN)) *
                    100;

                  return (
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
                        step={SLIDER_STEP}
                        value={scores[slider.id]}
                        aria-valuenow={roundScore(scores[slider.id])}
                        onChange={(event) =>
                          handleScoreChange(
                            slider.id,
                            Number(event.target.value),
                          )
                        }
                        style={
                          {
                            "--slider-fill": `${fillPercent}%`,
                          } as CSSProperties
                        }
                        className="checkin-slider mt-3 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a4a] focus-visible:ring-offset-2"
                      />
                      <div className="mt-1 flex justify-between text-xs text-slate-500">
                        <span>{slider.lowLabel}</span>
                        <span>{slider.highLabel}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {slider.label}: {roundScore(scores[slider.id])}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-slate-900"
                >
                  Phone number for one-time check-in SMS{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 07700 900123"
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#2d5a4a] focus:outline-none focus:ring-1 focus:ring-[#2d5a4a]"
                />
                <p className="mt-1 text-xs text-slate-400">
                  We&apos;ll send a single reminder in about 3 days. No
                  marketing, no spam.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => void handleSubmit()}
                className="mt-6 w-full sm:w-auto"
              >
                Share how I&apos;ve been
              </Button>
            </>
          )}
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
            {smsScheduled
              ? "We've scheduled a one-time check-in SMS for about 3 days from now. You can also come back to ClearHead any time."
              : "You can return to ClearHead any time to run another check-in."}
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

          <p className="mt-4 text-sm text-slate-500">
            {smsScheduled
              ? "We've scheduled a one-time check-in SMS for about 3 days from now."
              : "You can return to ClearHead any time to run another check-in."}
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
