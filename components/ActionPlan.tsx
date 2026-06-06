import type { UrgencyBand } from "@/lib/manus/support-plan";

type ActionPlanProps = {
  urgencyBand: Exclude<UrgencyBand, "urgent">;
  primaryRoute: string;
  secondaryRoutes: string[];
  mainConcerns: string[];
  explanation: string;
  checkInPlan: string;
  plannedAction: string;
};

type BandConfig = {
  description: string;
  pillClass: string;
  pillText: string;
  accentBorder: string;
};

const BAND_CONFIG: Record<Exclude<UrgencyBand, "urgent">, BandConfig> = {
  low: {
    pillText: "Low urgency signal",
    description: "Stress and early signs — support is available",
    pillClass: "bg-yellow-50 border border-yellow-200 text-yellow-900",
    accentBorder: "border-l-4 border-l-yellow-400",
  },
  moderate: {
    pillText: "Moderate urgency signal",
    description: "Some functional impact — reaching out soon is a good idea",
    pillClass: "bg-amber-50 border border-amber-200 text-amber-900",
    accentBorder: "border-l-4 border-l-amber-400",
  },
};

const PHONE_REGEX = /(\+?[\d\s()–-]{7,})/g;
const URL_REGEX = /(https?:\/\/[^\s]+|[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi;

function linkifyText(text: string) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const phoneMatch = PHONE_REGEX.exec(remaining);
    const urlMatch = URL_REGEX.exec(remaining);

    PHONE_REGEX.lastIndex = 0;
    URL_REGEX.lastIndex = 0;

    const phoneIdx = remaining.search(PHONE_REGEX);
    const urlIdx = remaining.search(URL_REGEX);

    const hasPhone = phoneIdx !== -1;
    const hasUrl = urlIdx !== -1;

    if (!hasPhone && !hasUrl) {
      parts.push(remaining);
      break;
    }

    const usePhone =
      hasPhone && (!hasUrl || phoneIdx <= urlIdx) && phoneMatch;
    const useUrl =
      hasUrl && (!hasPhone || urlIdx < phoneIdx) && urlMatch;

    if (usePhone && phoneMatch) {
      parts.push(remaining.slice(0, phoneIdx));
      parts.push(
        <a
          key={key++}
          href={`tel:${phoneMatch[0].replace(/\s/g, "")}`}
          className="text-[var(--accent)] underline"
        >
          {phoneMatch[0]}
        </a>,
      );
      remaining = remaining.slice(phoneIdx + phoneMatch[0].length);
    } else if (useUrl && urlMatch) {
      parts.push(remaining.slice(0, urlIdx));
      const href = urlMatch[0].startsWith("http")
        ? urlMatch[0]
        : `https://${urlMatch[0]}`;
      parts.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] underline"
        >
          {urlMatch[0]}
        </a>,
      );
      remaining = remaining.slice(urlIdx + urlMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts;
}

export function ActionPlan({
  urgencyBand,
  primaryRoute,
  secondaryRoutes,
  mainConcerns,
  explanation,
  checkInPlan,
  plannedAction,
}: ActionPlanProps) {
  const config = BAND_CONFIG[urgencyBand];

  return (
    <div className="max-w-lg space-y-8">
      {/* Summary card */}
      <div className="card-accent p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-caption">
          Your urgency signal
        </p>
        <div
          className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${config.pillClass}`}
        >
          {config.pillText}
        </div>
        <p className="mt-1 text-sm text-body">{config.description}</p>

        {mainConcerns.length > 0 && (
          <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-caption">
              What we heard
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {mainConcerns.map((concern) => (
                <li
                  key={concern}
                  className="rounded-full bg-surface px-3 py-0.5 text-sm text-body shadow-sm"
                >
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {explanation && (
          <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-caption">
              Why this route
            </p>
            <p className="mt-1 text-sm text-body">{explanation}</p>
          </div>
        )}

        {plannedAction && (
          <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-caption">
              What to do next
            </p>
            <p className="mt-1 text-sm font-medium text-display">
              {plannedAction}
            </p>
          </div>
        )}

        {checkInPlan && (
          <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-caption">
              Next check-in
            </p>
            <p className="mt-1 text-sm text-body">{checkInPlan}</p>
          </div>
        )}
      </div>

      {/* Route list */}
      <div>
        <h2 className="text-xl font-semibold text-display">
          Your next-step support plan
        </h2>
        <p className="mt-1 text-sm text-body">
          Concrete support routes you can act on tonight.
        </p>

        {/* First step — prominent card */}
        {primaryRoute && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-caption">
              Your first step
            </p>
            <div
              className={`mt-2 card-accent p-4 ${config.accentBorder}`}
            >
              <span className="text-base font-semibold text-display">
                {linkifyText(primaryRoute)}
              </span>
            </div>
          </div>
        )}

        {/* Secondary routes */}
        {secondaryRoutes.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-caption">
              Also consider
            </p>
            <ol className="mt-3 space-y-3">
              {secondaryRoutes.map((step, index) => (
                <li
                  key={step}
                  className="card flex items-start gap-3 p-4"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-[var(--accent)]">
                    {index + 2}
                  </span>
                  <span className="text-body">{linkifyText(step)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
