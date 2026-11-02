// app/api/android-interest/route.ts
import { NextRequest, NextResponse } from "next/server";

// [TODO VAD: wire android_interest capture to a real destination — no
// backend table exists for this yet, requires a schema change. For now this
// just logs the email server-side and always reports success so the UI can
// show a confirmation regardless.]
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  // Defense in depth: reject the same honeypot field name the signup form
  // uses, in case this route is ever targeted directly by a bot.
  const honeypot = typeof body?.website === "string" ? body.website.trim() : "";
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  console.log("[android-interest] registered:", email);

  return NextResponse.json({ ok: true });
}
