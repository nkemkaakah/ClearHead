export const CRISIS_OVERRIDE_HEADLINE =
  "You mentioned something that concerns us. Please reach out right now.";

export const CRISIS_RESOURCES = [
  {
    id: "emergency",
    icon: "📞",
    contact: "999",
    label: "Emergency",
    href: "tel:999",
  },
  {
    id: "samaritans",
    icon: "📞",
    contact: "116 123",
    label: "Samaritans (free, 24/7)",
    href: "tel:116123",
  },
  {
    id: "shout",
    icon: "💬",
    contact: "Text SHOUT to 85258",
    label: "free crisis text line",
    href: "sms:85258?&body=SHOUT",
  },
] as const;
