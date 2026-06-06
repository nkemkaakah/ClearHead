import { CrisisFooter } from "@/components/CrisisFooter";
import { FlowProgress } from "@/components/FlowProgress";

type PageShellProps = {
  step?: number;
  className?: string;
  children: React.ReactNode;
};

export function PageShell({ step, className = "", children }: PageShellProps) {
  return (
    <div className={`flex min-h-screen flex-col ${className}`}>
      <header className="px-6 pt-8 pb-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <p className="text-sm font-medium text-slate-500">ClearHead</p>
          {step !== undefined && <FlowProgress step={step} />}
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-28 pt-4">{children}</main>

      <CrisisFooter />
    </div>
  );
}
