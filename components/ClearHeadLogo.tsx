type ClearHeadLogoProps = {
  showWordmark?: boolean;
  className?: string;
};

export function ClearHeadLogo({
  showWordmark = true,
  className = "",
}: ClearHeadLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="flex-shrink-0"
      >
        <rect width="32" height="32" rx="9" fill="var(--accent-muted)" />
        <path
          d="M9 21.5C11.5 14.5 20.5 14.5 23 21.5"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="13" r="3" fill="var(--accent)" />
        <path
          d="M16 16V19"
          stroke="var(--accent)"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className="text-sm font-semibold tracking-tight text-display transition-colors group-hover:text-[var(--accent)]">
          ClearHead
        </span>
      )}
    </span>
  );
}
