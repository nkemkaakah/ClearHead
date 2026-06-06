import { CRISIS_RESOURCES } from "@/lib/crisis/resources";

export function CrisisFooter() {
  return (
    <footer className="border-t border-default bg-surface/90 px-6 py-4 backdrop-blur-sm">
      <p className="mb-3 text-center text-xs text-caption">
        If you need urgent help, these resources are free and available now
      </p>
      <ul className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
        {CRISIS_RESOURCES.map((resource) => (
          <li key={resource.id}>
            <a
              href={resource.href}
              className="flex min-h-[44px] items-center text-sm text-body underline-offset-2 hover:text-[var(--accent)] hover:underline"
            >
              {resource.icon} {resource.contact} — {resource.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
