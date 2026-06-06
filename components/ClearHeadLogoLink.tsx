import Link from "next/link";
import { ClearHeadLogo } from "@/components/ClearHeadLogo";

type ClearHeadLogoLinkProps = {
  className?: string;
};

export function ClearHeadLogoLink({ className = "" }: ClearHeadLogoLinkProps) {
  return (
    <Link
      href="/"
      className={`group rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${className}`}
      aria-label="ClearHead home"
    >
      <ClearHeadLogo />
    </Link>
  );
}
