const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill\s+my\s*self|suicide|suicidal)\b/i,
  /\b(self[\s-]?harm|hurt\s+my\s*self|cutting\s+my\s*self)\b/i,
  /\b(end\s+my\s+life|want\s+to\s+die|wish\s+i\s+(?:was|were)\s+dead)\b/i,
  /\b(no\s+reason\s+to\s+live|better\s+off\s+dead|don'?t\s+want\s+to\s+live)\b/i,
  /\b(overdose|take\s+my\s+life)\b/i,
];

export function detectCrisisLanguage(text: string): boolean {
  const normalised = text.trim();
  if (!normalised) {
    return false;
  }

  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalised));
}
