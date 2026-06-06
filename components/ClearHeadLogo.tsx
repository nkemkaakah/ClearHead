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
        <rect width="32" height="32" rx="9" fill="#e8f0ed" />
        <path
          d="M9 21.5C11.5 14.5 20.5 14.5 23 21.5"
          stroke="#2d5a4a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="13" r="3" fill="#2d5a4a" />
        <path
          d="M16 16V19"
          stroke="#2d5a4a"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className="text-sm font-semibold tracking-tight text-slate-800 transition-colors group-hover:text-[#2d5a4a]">
          ClearHead
        </span>
      )}
    </span>
  );
}
