"use client";

import { useRouter } from "next/navigation";
import { CrisisFooter } from "@/components/CrisisFooter";
import { SESSION_STARTED_KEY } from "@/lib/session/keys";

export function WarmEntry() {
  const router = useRouter();

  const handleStart = () => {
    sessionStorage.setItem(SESSION_STARTED_KEY, new Date().toISOString());
    router.push("/check");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <div className="max-w-lg text-center">
          <p className="text-sm font-medium tracking-wide text-slate-500">
            ClearHead
          </p>
          <h1 className="mt-4 text-2xl font-semibold leading-snug text-slate-900 sm:text-3xl">
            Hey. Whatever&apos;s going on, you&apos;re in the right place.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Let&apos;s figure out together what support you need.
          </p>
          <p className="mt-6 text-sm text-slate-500">
            A student support navigator to help you find your next step — no
            account needed.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="mt-8 rounded-full bg-slate-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-slate-800"
          >
            Let&apos;s start
          </button>
        </div>
      </main>
      <CrisisFooter />
    </div>
  );
}
