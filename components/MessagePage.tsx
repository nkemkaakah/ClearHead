"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CrisisFooter } from "@/components/CrisisFooter";
import type { SupportPlan } from "@/lib/manus/support-plan";
import { SUPPORT_PLAN_KEY } from "@/lib/session/keys";

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

export function MessagePage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedPlan = sessionStorage.getItem(SUPPORT_PLAN_KEY);

    if (!storedPlan) {
      router.replace("/");
      return;
    }

    try {
      const plan = JSON.parse(storedPlan) as unknown;

      if (!isSupportPlan(plan) || !plan.message.trim()) {
        router.replace("/");
        return;
      }

      setMessage(plan.message);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleCopy = async () => {
    if (!message) {
      return;
    }

    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!message) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 pt-8">
        <p className="text-sm font-medium tracking-wide text-slate-500">
          ClearHead
        </p>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-24 pt-6">
        <div className="max-w-lg">
          <h1 className="text-xl font-semibold text-slate-900">
            Your copy-ready message
          </h1>
          <p className="mt-2 text-slate-600">
            Copy this and paste it into an email or message to your uni
            counselling service or GP.
          </p>

          <blockquote className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
            {message}
          </blockquote>

          <button
            type="button"
            onClick={() => void handleCopy()}
            className="mt-6 rounded-full bg-slate-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-slate-800"
          >
            {copied ? "Copied ✓" : "Copy message"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/checkin")}
            className="mt-4 block rounded-full border border-slate-300 px-8 py-3 text-base font-medium text-slate-900 transition-colors hover:bg-slate-50"
          >
            Next: set up your check-in
          </button>
        </div>
      </main>

      <CrisisFooter />
    </div>
  );
}
