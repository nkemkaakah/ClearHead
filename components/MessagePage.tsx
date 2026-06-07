"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import type { MessageDraft } from "@/lib/manus/support-plan";
import {
  ACTION_STATUS_KEY,
  PLANNED_ACTION_KEY,
  SUPPORT_PLAN_KEY,
} from "@/lib/session/keys";
import { isSupportPlan } from "@/lib/session/plan";

const SHORT_MESSAGE =
  "Hi, I'm a student struggling with anxiety and sleep. Could you tell me what support is available?";

type ActionStatus = "idle" | "sent" | "stuck";
type StuckReason =
  | "too_long"
  | "privacy"
  | "dont_know_who"
  | "overwhelmed"
  | null;

export function MessagePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<MessageDraft[]>([]);
  const [primaryRoute, setPrimaryRoute] = useState("");
  const [plannedAction, setPlannedAction] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState<Record<number, boolean>>({});
  const [showActionPrompt, setShowActionPrompt] = useState(false);
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [stuckReason, setStuckReason] = useState<StuckReason>(null);
  const [shortCopied, setShortCopied] = useState(false);

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

      const drafts =
        plan.messages.length > 0
          ? plan.messages
          : [{ recipient: "wellbeing" as const, label: "University wellbeing", text: plan.message }];

      setMessages(drafts);
      setPrimaryRoute(plan.primary_route);
      setPlannedAction(plan.planned_action);
      setReady(true);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleCopy = async (index: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [index]: true }));
    setShowActionPrompt(true);
    setTimeout(() => setCopied((prev) => ({ ...prev, [index]: false })), 2000);
  };

  const handleSent = () => {
    sessionStorage.setItem(ACTION_STATUS_KEY, "sent");
    sessionStorage.setItem(PLANNED_ACTION_KEY, plannedAction);
    setActionStatus("sent");
  };

  const handleStuck = () => {
    sessionStorage.setItem(ACTION_STATUS_KEY, "stuck");
    setActionStatus("stuck");
  };

  const handleUndoAction = () => {
    sessionStorage.removeItem(ACTION_STATUS_KEY);
    sessionStorage.removeItem(PLANNED_ACTION_KEY);
    setActionStatus("idle");
    setStuckReason(null);
  };

  const handleShortCopy = async () => {
    await navigator.clipboard.writeText(SHORT_MESSAGE);
    setShortCopied(true);
    setTimeout(() => setShortCopied(false), 2000);
  };

  if (!ready) {
    return null;
  }

  const activeMessage = messages[activeTab];

  return (
    <PageShell step={4}>
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-display">
          Your copy-ready messages
        </h1>
        <p className="mt-2 text-body">
          Choose who you want to contact. Copy the message and paste it into an
          email or app. Edit anything before sending.
        </p>

        {/* Recipient tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {messages.map((draft, index) => (
            <button
              key={draft.recipient}
              type="button"
              onClick={() => setActiveTab(index)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                activeTab === index
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-button"
                  : "border-default text-body hover:bg-accent-subtle"
              }`}
            >
              {draft.label}
            </button>
          ))}
        </div>

        {/* Active message */}
        {activeMessage && (
          <div key={activeMessage.recipient} className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-caption">
              {activeMessage.label}
            </h2>

            <div
              aria-live="polite"
              className="mt-3 rounded-xl border border-default bg-surface p-5 text-[15px] leading-relaxed text-body shadow-inner"
            >
              {activeMessage.text}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => void handleCopy(activeTab, activeMessage.text)}
              className={`mt-5 w-full transition-colors sm:w-auto ${
                copied[activeTab] ? "bg-green-700 hover:bg-green-700" : ""
              }`}
            >
              {copied[activeTab] ? "Message copied ✓" : "Copy message"}
            </Button>

            {showActionPrompt && actionStatus === "idle" && (
              <div className="mt-5 rounded-xl border border-[var(--border-subtle)] bg-accent-subtle p-4">
                <p className="text-sm font-medium text-body">
                  Did you manage to send it?
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button variant="primary" size="md" onClick={handleSent}>
                    I sent it
                  </Button>
                  <Button variant="secondary" size="md" onClick={handleStuck}>
                    I can&apos;t send this yet
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sent confirmation */}
        {actionStatus === "sent" && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="font-semibold text-green-900">
              That&apos;s the hardest part done.
            </p>
            <p className="mt-1 text-sm text-green-800">
              University wellbeing will be in touch. You took a real step today.
            </p>
            <button
              type="button"
              onClick={handleUndoAction}
              className="mt-3 text-xs text-green-700 underline underline-offset-2 hover:text-green-900"
            >
              Actually, I haven&apos;t sent it yet
            </button>
          </div>
        )}

        {/* Stuck branching UI */}
        {actionStatus === "stuck" && stuckReason === null && (
          <div className="mt-6 rounded-xl border border-default bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-display">
                That&apos;s okay. What&apos;s getting in the way?
              </p>
              <button
                type="button"
                onClick={handleUndoAction}
                className="ml-4 shrink-0 text-xs text-caption underline underline-offset-2 hover:text-body"
              >
                Go back
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {(
                [
                  ["too_long", "The message feels too long"],
                  ["privacy", "I'm worried about privacy"],
                  ["dont_know_who", "I don't know who exactly to send it to"],
                  ["overwhelmed", "I'm feeling too overwhelmed right now"],
                ] as [StuckReason, string][]
              ).map(([reason, label]) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setStuckReason(reason)}
                  className="w-full rounded-xl border border-default p-4 text-left text-sm text-body transition-all hover:border-[var(--accent)] hover:bg-accent-muted"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {actionStatus === "stuck" && stuckReason === "too_long" && (
          <div className="mt-6 rounded-xl border border-default bg-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-body">
                Here&apos;s a shorter version:
              </p>
              <button
                type="button"
                onClick={() => setStuckReason(null)}
                className="ml-4 shrink-0 text-xs text-caption underline underline-offset-2 hover:text-body"
              >
                Change reason
              </button>
            </div>
            <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-accent-subtle p-4 text-[15px] leading-relaxed text-body">
              {SHORT_MESSAGE}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => void handleShortCopy()}
              className={`mt-4 transition-colors ${shortCopied ? "bg-green-700 hover:bg-green-700" : ""}`}
            >
              {shortCopied ? "Copied ✓" : "Copy short version"}
            </Button>
          </div>
        )}

        {actionStatus === "stuck" && stuckReason === "privacy" && (
          <div className="mt-6 rounded-xl border border-default bg-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-body">
                This version shares nothing personal:
              </p>
              <button
                type="button"
                onClick={() => setStuckReason(null)}
                className="ml-4 shrink-0 text-xs text-caption underline underline-offset-2 hover:text-body"
              >
                Change reason
              </button>
            </div>
            <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-accent-subtle p-4 text-[15px] leading-relaxed text-body">
              {SHORT_MESSAGE}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => void handleShortCopy()}
              className={`mt-4 transition-colors ${shortCopied ? "bg-green-700 hover:bg-green-700" : ""}`}
            >
              {shortCopied ? "Copied ✓" : "Copy this version"}
            </Button>
          </div>
        )}

        {actionStatus === "stuck" && stuckReason === "dont_know_who" && (
          <div className="mt-6 rounded-xl border border-default bg-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-body">
                Your clearest first step:
              </p>
              <button
                type="button"
                onClick={() => setStuckReason(null)}
                className="ml-4 shrink-0 text-xs text-caption underline underline-offset-2 hover:text-body"
              >
                Change reason
              </button>
            </div>
            {primaryRoute && (
              <div className="mt-3 rounded-xl border-l-4 border-l-[var(--accent)] bg-accent-muted p-4">
                <p className="font-medium text-display">{primaryRoute}</p>
              </div>
            )}
            <p className="mt-3 text-sm text-body">
              Search your university website for &ldquo;wellbeing&rdquo; or
              &ldquo;student support&rdquo; to find the right email address.
            </p>
          </div>
        )}

        {actionStatus === "stuck" && stuckReason === "overwhelmed" && (
          <div className="mt-6 rounded-xl border border-default bg-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-body">
                One tiny step — that&apos;s all.
              </p>
              <button
                type="button"
                onClick={() => setStuckReason(null)}
                className="ml-4 shrink-0 text-xs text-caption underline underline-offset-2 hover:text-body"
              >
                Change reason
              </button>
            </div>
            <p className="mt-2 text-sm text-body">
              Just copy the message and save it for later. You don&apos;t have
              to send it right now.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() =>
                void handleCopy(activeTab, activeMessage?.text ?? "")
              }
              className={`mt-4 transition-colors ${copied[activeTab] ? "bg-green-700 hover:bg-green-700" : ""}`}
            >
              {copied[activeTab] ? "Saved ✓" : "Copy and save for later"}
            </Button>
          </div>
        )}

        {/* Continue to check-in — shown once any action is taken */}
        {(actionStatus === "sent" ||
          actionStatus === "stuck") && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/checkin")}
            className="mt-6 w-full sm:w-auto"
          >
            Continue to wellbeing check-in
          </Button>
        )}

        {/* Always-visible fallback continue */}
        {actionStatus === "idle" && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.push("/checkin")}
            className="mt-6"
          >
            Continue to wellbeing check-in
          </Button>
        )}
      </div>
    </PageShell>
  );
}
