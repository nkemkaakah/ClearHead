import { ClearHeadLogoLink } from "@/components/ClearHeadLogoLink";
import { CrisisFooter } from "@/components/CrisisFooter";
import { FlowProgress } from "@/components/FlowProgress";

type PageShellProps = {
  step?: number;
  className?: string;
  children: React.ReactNode;
};

export function PageShell({ step, className = "", children }: PageShellProps) {
  return (
    <div className={`flex min-h-screen flex-col bg-page ${className}`}>
      <header className="border-b border-default/60 bg-surface/80 px-6 pb-4 pt-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <ClearHeadLogoLink />
          {step !== undefined && <FlowProgress step={step} />}
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-28 pt-4">{children}</main>

      <CrisisFooter />
    </div>
  );
}
