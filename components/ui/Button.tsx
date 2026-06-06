import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
};

const BASE =
  "rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a4a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS = {
  primary:
    "bg-[#2d5a4a] text-white hover:bg-[#1e3f34] active:scale-[0.98]",
  secondary:
    "border border-slate-300 text-slate-900 hover:bg-slate-50 active:scale-[0.98]",
  ghost: "text-slate-600 hover:text-slate-900",
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
