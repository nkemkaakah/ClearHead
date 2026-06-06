"use client";

import { useEffect, useState } from "react";

const HOLD_MS = 2400;
const FADE_MS = 450;

type RotatingLoadingTextProps = {
  messages: readonly string[];
  active: boolean;
};

export function RotatingLoadingText({
  messages,
  active,
}: RotatingLoadingTextProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      setVisible(true);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const cycle = () => {
      timeoutId = setTimeout(() => {
        if (cancelled) {
          return;
        }

        setVisible(false);

        timeoutId = setTimeout(() => {
          if (cancelled) {
            return;
          }

          setIndex((current) => (current + 1) % messages.length);
          setVisible(true);
          cycle();
        }, FADE_MS);
      }, HOLD_MS);
    };

    cycle();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [active, messages]);

  return (
    <p
      className={`min-h-[1.5rem] text-base font-medium text-[var(--accent)] transition-opacity ease-in-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-live="polite"
      aria-atomic="true"
    >
      {messages[index]}
    </p>
  );
}
