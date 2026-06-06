import { hasCrisisInAnswers } from "@/lib/crisis/detect";
import { SUPPORT_CHECK_QUESTIONS } from "@/lib/check/questions";
import { createTask, pollUntilStopped, type ManusEvent } from "./client";

export type UrgencyBand = "low" | "moderate" | "urgent";

export type MessageDraft = {
  recipient: "wellbeing" | "tutor" | "gp" | "trusted_person";
  label: string;
  text: string;
};

export type SupportPlan = {
  urgency_band: UrgencyBand;
  primary_route: string;
  secondary_routes: string[];
  message: string;
  messages: MessageDraft[];
  safety_flag: boolean;
  main_concerns: string[];
  explanation: string;
  check_in_plan: string;
  planned_action: string;
};

export const SUPPORT_PLAN_SCHEMA = {
  type: "object",
  properties: {
    urgency_band: { type: "string", enum: ["low", "moderate", "urgent"] },
    primary_route: { type: "string" },
    secondary_routes: { type: "array", items: { type: "string" } },
    message: { type: "string" },
    messages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          recipient: {
            type: "string",
            enum: ["wellbeing", "tutor", "gp", "trusted_person"],
          },
          label: { type: "string" },
          text: { type: "string" },
        },
        required: ["recipient", "label", "text"],
        additionalProperties: false,
      },
    },
    safety_flag: { type: "boolean" },
    main_concerns: { type: "array", items: { type: "string" } },
    explanation: { type: "string" },
    check_in_plan: { type: "string" },
    planned_action: { type: "string" },
  },
  required: [
    "urgency_band",
    "primary_route",
    "secondary_routes",
    "message",
    "messages",
    "safety_flag",
    "main_concerns",
    "explanation",
    "check_in_plan",
    "planned_action",
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
    primary_route: "",
    secondary_routes: [],
    message: "",
    messages: [],
    safety_flag: true,
    main_concerns: [],
    explanation: "",
    check_in_plan: "",
    planned_action: "",
  };
}

function buildPrompt(answers: Record<string, string>): string {
  const formattedAnswers = SUPPORT_CHECK_QUESTIONS.map((question) => {
    const answer = answers[question.id] ?? "No answer provided";
    return `- ${question.text}\n  Answer: ${answer}`;
  }).join("\n");

  return `You are ClearHead, a UK student support navigator. Review this completed support check and return a structured next-step support plan.

Student context (hardcoded for this product):
- Student type: First-year international student, UK university
- Situation: Experiencing anxiety and sleep disruption, beginning to miss lectures
- Support sought: Unsure which service to contact or what to say
- Barrier: Does not know who to contact or how to ask for help

Rules:
- This is a support check, not triage or diagnosis.
- Assign urgency_band: low (self-care + monitor), moderate (contact support soon), or urgent (immediate crisis).
- primary_route: the single clearest first step (e.g. "University wellbeing service"). One string, no list.
- secondary_routes: 1–2 backup routes as a JSON array (e.g. ["GP/NHS Talking Therapies", "Samaritans 116 123 if urgent tonight"]).
- message: a copy-ready first-contact message for university wellbeing that the student can paste and send tonight. Keep it warm and brief. Same text as messages[0].text.
- messages: 2–3 copy-ready message drafts for different recipients. Always include "wellbeing" and "tutor". Include "gp" if symptoms warrant GP contact. Each has a label (display name) and text (the actual message body).
- safety_flag: true only if answers suggest immediate risk.
- main_concerns: a short list of the key themes you identified (e.g. ["sleep disruption", "anxiety", "missed lectures"]). Keep each item brief — 2–4 words.
- explanation: 1–2 sentences explaining why this urgency band and route fits. Start with "Based on what you shared…". Be warm, not clinical.
- check_in_plan: one sentence suggesting when to check in again (e.g. "We suggest checking in again in about 3 days, or sooner if things worsen.").
- planned_action: one clear sentence of what the student should do first (e.g. "Contact university wellbeing today using the message below.").
- Do not use words: triage, diagnosis, treatment plan, therapist.

Example wellbeing message: "Hi, I'm a first-year international student and I've been struggling with anxiety and sleep for the past two weeks. It's starting to affect my lectures and studies. I'm not sure what support is available, but I'd really like to speak with someone. Could you let me know how I can access support?"
Example tutor message: "Hi, I wanted to let you know I've been struggling with anxiety and sleep recently, which has started affecting my attendance. I'm reaching out to university wellbeing too, but wanted to ask if we could discuss academic support or next steps."

Support check answers:
${formattedAnswers}`;
}

function isMessageDraft(value: unknown): value is MessageDraft {
  if (typeof value !== "object" || value === null) return false;
  const d = value as Record<string, unknown>;
  return (
    (d.recipient === "wellbeing" ||
      d.recipient === "tutor" ||
      d.recipient === "gp" ||
      d.recipient === "trusted_person") &&
    typeof d.label === "string" &&
    typeof d.text === "string"
  );
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

  if (typeof plan.primary_route !== "string") {
    throw new Error("Manus structured output had invalid primary_route");
  }

  if (
    !Array.isArray(plan.secondary_routes) ||
    !plan.secondary_routes.every((item) => typeof item === "string")
  ) {
    throw new Error("Manus structured output had invalid secondary_routes");
  }

  if (typeof plan.message !== "string") {
    throw new Error("Manus structured output had invalid message");
  }

  if (!Array.isArray(plan.messages) || !plan.messages.every(isMessageDraft)) {
    throw new Error("Manus structured output had invalid messages");
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

  if (typeof plan.planned_action !== "string") {
    throw new Error("Manus structured output had invalid planned_action");
  }

  return {
    urgency_band: plan.urgency_band,
    primary_route: plan.primary_route,
    secondary_routes: plan.secondary_routes,
    message: plan.message,
    messages: plan.messages,
    safety_flag: plan.safety_flag,
    main_concerns: plan.main_concerns,
    explanation: plan.explanation,
    check_in_plan: plan.check_in_plan,
    planned_action: plan.planned_action,
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
