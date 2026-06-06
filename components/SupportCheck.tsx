"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CrisisFooter } from "@/components/CrisisFooter";
import { useCrisis } from "@/components/crisis/CrisisProvider";
import {
  SUPPORT_CHECK_QUESTIONS,
  TOTAL_QUESTIONS,
} from "@/lib/check/questions";
import {
  CHECK_ANSWERS_KEY,
  SESSION_STARTED_KEY,
} from "@/lib/session/keys";

function ProgressBar({ currentIndex }: { currentIndex: number }) {
  const progress = (currentIndex / TOTAL_QUESTIONS) * 100;

  return (
    <div className="w-full">
      <p className="mb-2 text-sm text-slate-600">
        Support check — step {currentIndex + 1} of {TOTAL_QUESTIONS}
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-300"
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

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_STARTED_KEY)) {
      router.replace("/");
    }
  }, [router]);

  const handleContinue = () => {
    if (!currentValue.trim()) {
      return;
    }

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
    <div className="flex min-h-screen flex-col">
      <header className="px-6 pt-8">
        <p className="text-sm font-medium tracking-wide text-slate-500">
          ClearHead
        </p>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-24 pt-6">
        <ProgressBar currentIndex={currentIndex} />

        <div className="mt-8 max-w-lg">
          <h1 className="text-xl font-semibold leading-snug text-slate-900">
            {question.text}
          </h1>

          {question.inputType === "textarea" ? (
            <textarea
              value={currentValue}
              onChange={(event) => setCurrentValue(event.target.value)}
              placeholder="Share as much or as little as you like..."
              rows={4}
              className="mt-4 w-full rounded-lg border border-slate-200 p-4 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          ) : (
            <div className="mt-4 space-y-2">
              {question.options?.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center rounded-lg border p-4 transition-colors ${
                    currentValue === option
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={currentValue === option}
                    onChange={(event) => setCurrentValue(event.target.value)}
                    className="mr-3"
                  />
                  <span className="text-slate-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!currentValue.trim()}
            className="mt-8 rounded-full bg-slate-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLastQuestion ? "See my support options" : "Continue"}
          </button>
        </div>
      </main>

      <CrisisFooter />
    </div>
  );
}
