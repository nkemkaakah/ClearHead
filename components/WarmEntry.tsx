"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { SESSION_STARTED_KEY } from "@/lib/session/keys";

export function WarmEntry() {
  const router = useRouter();

  const handleStart = () => {
    sessionStorage.setItem(SESSION_STARTED_KEY, new Date().toISOString());
    router.push("/check");
  };

  return (
    <PageShell className="bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="w-full max-w-sm">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight leading-[1.15] text-slate-900 sm:text-4xl">
            Hey. Whatever&apos;s going on, you&apos;re in the right place.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 max-w-sm">
            In a few minutes, you&apos;ll have a clear next step, a message
            ready to send tonight, and a check-in so you&apos;re not alone.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            className="mt-8 w-full sm:w-auto"
          >
            Let&apos;s start
          </Button>

          <p className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>No account</span>
            <span>·</span>
            <span>~3 minutes</span>
            <span>·</span>
            <span>Stays on this device</span>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
