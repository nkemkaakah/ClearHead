export type Question = {
  id: string;
  text: string;
  inputType: "textarea" | "select";
  options?: string[];
  isSafetyScreening: boolean;
};

export const SUPPORT_CHECK_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "How are you feeling right now, in your own words?",
    inputType: "textarea",
    isSafetyScreening: false,
  },
  {
    id: "q2",
    text: "How long have you been feeling this way?",
    inputType: "select",
    options: ["Just today", "A few days", "A week or two", "A month or more"],
    isSafetyScreening: false,
  },
  {
    id: "q3",
    text: "Is it affecting your sleep, eating, or ability to attend uni?",
    inputType: "select",
    options: ["Not really", "A little", "Quite a bit", "A lot"],
    isSafetyScreening: false,
  },
  {
    id: "q4",
    text: "Have you had thoughts of harming yourself or ending your life?",
    inputType: "textarea",
    isSafetyScreening: true,
  },
  {
    id: "q5",
    text: "Have you spoken to anyone about how you're feeling?",
    inputType: "select",
    options: [
      "Not yet",
      "A friend or family member",
      "A professional",
      "Yes, I have support",
    ],
    isSafetyScreening: false,
  },
];

export const TOTAL_QUESTIONS = SUPPORT_CHECK_QUESTIONS.length;
