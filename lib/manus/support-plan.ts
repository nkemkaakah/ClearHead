import { detectCrisisLanguage } from "@/lib/crisis/detect";
import { SUPPORT_CHECK_QUESTIONS } from "@/lib/check/questions";
import { createTask, pollUntilStopped, type ManusEvent } from "./client";

export type UrgencyBand = "low" | "moderate" | "urgent";

export type SupportPlan = {
  urgency_band: UrgencyBand;
  route: string[];
  message: string;
  safety_flag: boolean;
};

export const SUPPORT_PLAN_SCHEMA = {
  type: "object",
  properties: {
    urgency_band: {
      type: "string",
      enum: ["low", "moderate", "urgent"],
    },
    route: {
      type: "array",
      items: { type: "string" },
    },
    message: { type: "string" },
    safety_flag: { type: "boolean" },
  },
  required: ["urgency_band", "route", "message", "safety_flag"],
  additionalProperties: false,
} as const;

export class CrisisDetectedError extends Error {
  constructor() {
    super("Crisis language detected");
    this.name = "CrisisDetectedError";
  }
}

export function createUrgentSupportPlan(): SupportPlan {
  return {
    urgency_band: "urgent",
    route: [],
    message: "",
    safety_flag: true,
  };
}

function hasCrisisInAnswers(answers: Record<string, string>): boolean {
  return Object.values(answers).some((answer) => detectCrisisLanguage(answer));
}

function buildPrompt(answers: Record<string, string>): string {
  const formattedAnswers = SUPPORT_CHECK_QUESTIONS.map((question) => {
    const answer = answers[question.id] ?? "No answer provided";
    return `- ${question.text}\n  Answer: ${answer}`;
  }).join("\n");

  return `You are ClearHead, a UK student support navigator. Review this completed support check and return a next-step support plan.

Rules:
- This is a support check, not triage or diagnosis.
- Assign an urgency signal as urgency_band: low, moderate, or urgent.
- route must be an ordered list of concrete UK support routes (uni counselling, GP, NHS Talking Therapies, etc.).
- message must be a copy-ready first-contact message the student can send tonight.
- safety_flag is true only if answers suggest risk; never provide therapeutic advice.
- Do not use words: triage, diagnosis, treatment plan, therapist.

Support check answers:
${formattedAnswers}`;
}

function isUrgencyBand(value: unknown): value is UrgencyBand {
  return value === "low" || value === "moderate" || value === "urgent";
}

function parseSupportPlan(value: unknown): SupportPlan {
  if (typeof value !== "object" || value === null) {
    throw new Error("Manus structured output was not an object");
  }

  const plan = value as Record<string, unknown>;

  if (!isUrgencyBand(plan.urgency_band)) {
    throw new Error("Manus structured output had invalid urgency_band");
  }

  if (!Array.isArray(plan.route) || !plan.route.every((item) => typeof item === "string")) {
    throw new Error("Manus structured output had invalid route");
  }

  if (typeof plan.message !== "string") {
    throw new Error("Manus structured output had invalid message");
  }

  if (typeof plan.safety_flag !== "boolean") {
    throw new Error("Manus structured output had invalid safety_flag");
  }

  return {
    urgency_band: plan.urgency_band,
    route: plan.route,
    message: plan.message,
    safety_flag: plan.safety_flag,
  };
}

function extractSupportPlan(events: ManusEvent[]): SupportPlan {
  const resultEvent = [...events]
    .reverse()
    .find(
      (event) =>
        event.type === "structured_output_result" &&
        event.structured_output_result !== undefined,
    );

  const structuredOutput = resultEvent?.structured_output_result;

  if (!structuredOutput?.success) {
    const errorMessage = structuredOutput?.error ?? "No structured output returned";
    throw new Error(`Manus support plan failed: ${errorMessage}`);
  }

  return parseSupportPlan(structuredOutput.value);
}

export async function getSupportPlan(
  answers: Record<string, string>,
): Promise<SupportPlan> {
  if (hasCrisisInAnswers(answers)) {
    throw new CrisisDetectedError();
  }

  const prompt = buildPrompt(answers);
  const taskId = await createTask(prompt, SUPPORT_PLAN_SCHEMA);
  const events = await pollUntilStopped(taskId);
  const plan = extractSupportPlan(events);

  if (plan.urgency_band === "urgent" || plan.safety_flag) {
    throw new CrisisDetectedError();
  }

  return plan;
}
