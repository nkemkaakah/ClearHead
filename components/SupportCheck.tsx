"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { useCrisis } from "@/components/crisis/CrisisProvider";
import {
  SUPPORT_CHECK_QUESTIONS,
  TOTAL_QUESTIONS,
} from "@/lib/check/questions";
import {
  CHECK_ANSWERS_KEY,
  SESSION_STARTED_KEY,
} from "@/lib/session/keys";

function QuestionProgress({ currentIndex }: { currentIndex: number }) {
  const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100;

  return (
    <div className="w-full max-w-lg">
      <p className="mb-2 text-xs text-caption">
        Question {currentIndex + 1} of {TOTAL_QUESTIONS}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function SupportCheck() {
  const router = useRouter();
  const { checkForCrisis } = useCrisis();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentValue, setCurrentValue] = useState("");

  const question = SUPPORT_CHECK_QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1;
  const isSafetyQuestion = question.isSafetyScreening;

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_STARTED_KEY)) {
      router.replace("/");
    }
  }, [router]);

  const handleBack = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((i) => i - 1);
    setCurrentValue(answers[SUPPORT_CHECK_QUESTIONS[currentIndex - 1].id] ?? "");
  };

  const handleContinue = () => {
    if (!currentValue.trim()) return;

    if (question.isSafetyScreening && checkForCrisis(currentValue)) {
      return;
    }

    const updatedAnswers = { ...answers, [question.id]: currentValue };
    setAnswers(updatedAnswers);

    if (isLastQuestion) {
      sessionStorage.setItem(CHECK_ANSWERS_KEY, JSON.stringify(updatedAnswers));
      router.push("/plan");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setCurrentValue("");
  };

  return (
    <PageShell step={2}>
      <QuestionProgress currentIndex={currentIndex} />

      <div className="mt-8 max-w-lg">
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 flex items-center gap-1 text-sm text-caption hover:text-body"
          >
            ← Back
          </button>
        )}

        {isSafetyQuestion && (
          <p className="mb-3 text-sm text-caption">
            We ask everyone this — it helps us know if you might need immediate
            support.
          </p>
        )}

        <h1 className="text-xl font-semibold leading-snug text-display">
          {question.text}
        </h1>

        {question.inputType === "textarea" ? (
          <textarea
            value={currentValue}
            onChange={(event) => setCurrentValue(event.target.value)}
            placeholder="Share as much or as little as you like..."
            rows={5}
            className="mt-4 min-h-[120px] w-full rounded-lg border border-default bg-surface p-4 text-display shadow-sm placeholder:text-caption focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        ) : (
          <div className="mt-4 space-y-2">
            {question.options?.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center rounded-xl border p-4 transition-all active:scale-[0.99] ${
                  currentValue === option
                    ? "option-selected"
                    : "border-default bg-surface hover:bg-accent-subtle"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(event) => setCurrentValue(event.target.value)}
                  className="mr-3 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                />
                <span className="text-display">{option}</span>
              </label>
            ))}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          disabled={!currentValue.trim()}
          className="mt-8 w-full sm:w-auto"
        >
          {isLastQuestion ? "See my support options" : "Continue"}
        </Button>

        {!currentValue.trim() && (
          <p className="mt-2 text-center text-xs text-caption">
            Share a little to continue — there&apos;s no wrong answer.
          </p>
        )}
      </div>
    </PageShell>
  );
}
