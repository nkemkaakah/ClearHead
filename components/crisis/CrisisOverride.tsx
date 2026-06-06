import {
  CRISIS_OVERRIDE_HEADLINE,
  CRISIS_RESOURCES,
} from "@/lib/crisis/resources";

export function CrisisOverride() {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="crisis-override-headline"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 px-6"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h1
          id="crisis-override-headline"
          className="text-xl font-semibold leading-snug text-slate-900"
        >
          {CRISIS_OVERRIDE_HEADLINE}
        </h1>

        <ul className="mt-6 space-y-4">
          {CRISIS_RESOURCES.map((resource) => (
            <li key={resource.id}>
              <a
                href={resource.href}
                className="block rounded-lg border border-slate-200 p-4 font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                {resource.icon} {resource.contact} — {resource.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
