import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
};

const BASE =
  "rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS = {
  primary:
    "bg-[var(--accent)] text-white shadow-button hover:bg-[var(--accent-hover)] active:scale-[0.98]",
  secondary:
    "border border-default bg-surface text-[var(--foreground)] hover:bg-accent-subtle active:scale-[0.98]",
  ghost: "text-body hover:text-[var(--display)]",
};

const SIZES = {
  lg: "px-8 py-3.5 text-base",
  md: "px-6 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
