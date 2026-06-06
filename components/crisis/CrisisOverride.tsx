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
        <p className="mt-2 text-sm text-slate-600">
          These are free, confidential, and available right now.
        </p>

        <ul className="mt-6 space-y-3">
          {CRISIS_RESOURCES.map((resource) => (
            <li key={resource.id}>
              <a
                href={resource.href}
                className="flex items-center gap-4 rounded-xl border-2 border-slate-200 p-4 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                <span className="text-2xl">{resource.icon}</span>
                <span>
                  <span className="block text-lg font-bold text-slate-900">
                    {resource.contact}
                  </span>
                  <span className="text-sm text-slate-600">
                    {resource.label}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
