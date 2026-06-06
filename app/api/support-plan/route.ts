import { NextResponse } from "next/server";
import {
  createUrgentSupportPlan,
  CrisisDetectedError,
  getSupportPlan,
  type SupportPlan,
} from "@/lib/manus/support-plan";
import { detectCrisisLanguage } from "@/lib/crisis/detect";

function isAnswersRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((answer) => typeof answer === "string");
}

function hasCrisisInAnswers(answers: Record<string, string>): boolean {
  return Object.values(answers).some((answer) => detectCrisisLanguage(answer));
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("answers" in body) ||
    !isAnswersRecord(body.answers)
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { answers } = body;

  if (hasCrisisInAnswers(answers)) {
    return NextResponse.json<SupportPlan>(createUrgentSupportPlan());
  }

  try {
    const plan = await getSupportPlan(answers);
    return NextResponse.json<SupportPlan>(plan);
  } catch (error) {
    if (error instanceof CrisisDetectedError) {
      return NextResponse.json<SupportPlan>(createUrgentSupportPlan());
    }

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[support-plan] failed:", message, stack);

    return NextResponse.json(
      { error: "support_plan_failed", detail: message },
      { status: 500 },
    );
  }
}
