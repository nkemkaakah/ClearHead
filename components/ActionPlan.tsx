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
          className="text-[#2d5a4a] underline"
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
          className="text-[#2d5a4a] underline"
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
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Your urgency signal
        </p>
        <div
          className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${config.pillClass}`}
        >
          {config.pillText}
        </div>
        <p className="mt-1 text-sm text-slate-600">{config.description}</p>

        {mainConcerns.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              What we heard
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {mainConcerns.map((concern) => (
                <li
                  key={concern}
                  className="rounded-full bg-slate-100 px-3 py-0.5 text-sm text-slate-700"
                >
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {explanation && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Why this route
            </p>
            <p className="mt-1 text-sm text-slate-700">{explanation}</p>
          </div>
        )}

        {plannedAction && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              What to do next
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {plannedAction}
            </p>
          </div>
        )}

        {checkInPlan && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Next check-in
            </p>
            <p className="mt-1 text-sm text-slate-700">{checkInPlan}</p>
          </div>
        )}
      </div>

      {/* Route list */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Your next-step support plan
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Concrete support routes you can act on tonight.
        </p>

        {/* First step — prominent card */}
        {primaryRoute && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Your first step
            </p>
            <div
              className={`mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${config.accentBorder}`}
            >
              <span className="text-base font-semibold text-slate-900">
                {linkifyText(primaryRoute)}
              </span>
            </div>
          </div>
        )}

        {/* Secondary routes */}
        {secondaryRoutes.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Also consider
            </p>
            <ol className="mt-3 space-y-3">
              {secondaryRoutes.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {index + 2}
                  </span>
                  <span className="text-slate-800">{linkifyText(step)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
