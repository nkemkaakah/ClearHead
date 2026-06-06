import { hasCrisisInAnswers } from "@/lib/crisis/detect";
import { SUPPORT_CHECK_QUESTIONS } from "@/lib/check/questions";
import { createTask, pollUntilStopped, type ManusEvent } from "./client";

export type UrgencyBand = "low" | "moderate" | "urgent";

export type SupportPlan = {
  urgency_band: UrgencyBand;
  route: string[];
  message: string;
  safety_flag: boolean;
  main_concerns: string[];
  explanation: string;
  check_in_plan: string;
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
    main_concerns: {
      type: "array",
      items: { type: "string" },
    },
    explanation: { type: "string" },
    check_in_plan: { type: "string" },
  },
  required: [
    "urgency_band",
    "route",
    "message",
    "safety_flag",
    "main_concerns",
    "explanation",
    "check_in_plan",
  ],
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
    main_concerns: [],
    explanation: "",
    check_in_plan: "",
  };
}

function buildPrompt(answers: Record<string, string>): string {
  const formattedAnswers = SUPPORT_CHECK_QUESTIONS.map((question) => {
    const answer = answers[question.id] ?? "No answer provided";
    return `- ${question.text}\n  Answer: ${answer}`;
  }).join("\n");

  return `You are ClearHead, a UK student support navigator. Review this completed support check and return a structured next-step support plan.

Rules:
- This is a support check, not triage or diagnosis.
- Assign urgency_band: low (self-care + monitor), moderate (contact support soon), or urgent (immediate crisis).
- route: ordered list of concrete UK support routes (uni counselling, GP, NHS Talking Therapies, etc.).
- message: a copy-ready first-contact message the student can paste and send tonight.
- safety_flag: true only if answers suggest immediate risk.
- main_concerns: a short list of the key themes you identified (e.g. ["sleep disruption", "anxiety", "missed lectures"]). Keep each item brief — 2–4 words.
- explanation: 1–2 sentences explaining why this urgency band and route fits. Start with "Based on what you shared…". Be warm, not clinical.
- check_in_plan: one sentence suggesting when to check in again (e.g. "We suggest checking in again in about 3 days, or sooner if things worsen.").
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

  if (
    !Array.isArray(plan.main_concerns) ||
    !plan.main_concerns.every((item) => typeof item === "string")
  ) {
    throw new Error("Manus structured output had invalid main_concerns");
  }

  if (typeof plan.explanation !== "string") {
    throw new Error("Manus structured output had invalid explanation");
  }

  if (typeof plan.check_in_plan !== "string") {
    throw new Error("Manus structured output had invalid check_in_plan");
  }

  return {
    urgency_band: plan.urgency_band,
    route: plan.route,
    message: plan.message,
    safety_flag: plan.safety_flag,
    main_concerns: plan.main_concerns,
    explanation: plan.explanation,
    check_in_plan: plan.check_in_plan,
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
