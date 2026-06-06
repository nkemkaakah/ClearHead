"use client";

import { useRouter } from "next/navigation";
import { ClearHeadLogo } from "@/components/ClearHeadLogo";
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
    <PageShell className="hero-glow">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="w-full max-w-sm">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted shadow-card">
            <ClearHeadLogo showWordmark={false} />
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight leading-[1.15] text-display sm:text-4xl">
            Hey. Whatever&apos;s going on, you&apos;re in the right place.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-body">
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

          <p className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-caption">
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
