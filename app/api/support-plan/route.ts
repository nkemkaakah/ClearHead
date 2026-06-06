import { NextResponse } from "next/server";
import {
  createUrgentSupportPlan,
  CrisisDetectedError,
  getSupportPlan,
  type SupportPlan,
} from "@/lib/manus/support-plan";
import { hasCrisisInAnswers } from "@/lib/crisis/detect";

function isAnswersRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((answer) => typeof answer === "string");
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

    return NextResponse.json({ error: "support_plan_failed" }, { status: 500 });
  }
}
