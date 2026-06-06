export type SliderId = "mood" | "sleep" | "stress";

export type Slider = {
  id: SliderId;
  label: string;
  lowLabel: string;
  highLabel: string;
};

export const CHECKIN_SLIDERS: Slider[] = [
  {
    id: "mood",
    label: "Mood",
    lowLabel: "Very low",
    highLabel: "Good",
  },
  {
    id: "sleep",
    label: "Sleep",
    lowLabel: "Very poor",
    highLabel: "Good",
  },
  {
    id: "stress",
    label: "Stress",
    lowLabel: "Overwhelming",
    highLabel: "Manageable",
  },
];

export const SLIDER_MIN = 1;
export const SLIDER_MAX = 5;
export const SLIDER_STEP = 0.01;
export const WORSE_THRESHOLD = 3;

export function roundScore(value: number): number {
  return Math.round(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, value)));
}

export const DEFAULT_SCORES: Record<SliderId, number> = {
  mood: 3,
  sleep: 3,
  stress: 3,
};
