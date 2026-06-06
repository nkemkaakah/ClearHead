import { NextResponse } from "next/server";

type ScheduledCheckIn = {
  phone: string;
  send_at: string;
  message: string;
};

function isValidUKPhone(value: string): boolean {
  return /^(\+44|0)[0-9\s]{9,14}$/.test(value.trim());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("phone" in body) ||
    typeof (body as Record<string, unknown>).phone !== "string"
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const phone = ((body as Record<string, unknown>).phone as string).trim();

  if (!isValidUKPhone(phone)) {
    return NextResponse.json(
      { error: "invalid_phone", message: "Please enter a valid UK phone number." },
      { status: 422 },
    );
  }

  const sendAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const message =
    "Hey, this is ClearHead. How are you doing compared to a few days ago? " +
    "You can run another support check any time at clearhead.app.";

  const scheduled: ScheduledCheckIn = { phone, send_at: sendAt, message };

  // In production an agentic workflow would pick this up and send the SMS at send_at.
  console.log("[ClearHead] Check-in scheduled:", JSON.stringify(scheduled));

  return NextResponse.json({ scheduled: true, send_at: sendAt });
}
