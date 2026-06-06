"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { SUPPORT_PLAN_KEY } from "@/lib/session/keys";
import { isSupportPlan } from "@/lib/session/plan";

type PageState = "loading" | "ready";

export function MessagePage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState<string>("");
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
      setState("ready");
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleCopy = async () => {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state !== "ready") {
    return null;
  }

  return (
    <PageShell step={4}>
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-slate-900">
          Your copy-ready message
        </h1>
        <p className="mt-2 text-slate-600">
          Copy this and paste it into an email or message to your uni
          counselling service or GP. You can edit it before sending.
        </p>

        <div
          aria-live="polite"
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-[15px] leading-relaxed text-slate-800 shadow-inner"
        >
          {message}
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => void handleCopy()}
          className={`mt-6 w-full sm:w-auto transition-colors ${
            copied ? "bg-green-700 hover:bg-green-700" : ""
          }`}
        >
          {copied ? "Message copied ✓" : "Copy message"}
        </Button>

        {copied && (
          <p className="mt-3 text-sm text-slate-500">
            Paste this into your email app and edit anything before sending.
          </p>
        )}

        <Button
          variant="secondary"
          size="lg"
          onClick={() => router.push("/checkin")}
          className="mt-4 w-full sm:w-auto"
        >
          Continue to wellbeing check-in
        </Button>
      </div>
    </PageShell>
  );
}
