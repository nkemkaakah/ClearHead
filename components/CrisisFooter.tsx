import { CRISIS_RESOURCES } from "@/lib/crisis/resources";

export function CrisisFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
        Crisis support — available now
      </p>
      <ul className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
        {CRISIS_RESOURCES.map((resource) => (
          <li key={resource.id}>
            <a
              href={resource.href}
              className="text-sm text-slate-700 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              {resource.icon} {resource.contact} — {resource.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
