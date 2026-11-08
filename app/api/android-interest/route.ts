// app/api/android-interest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidEmail, submittedTooFast } from "@/lib/formValidation";
import { verifyTurnstileToken, getClientIp } from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  // Defense in depth: reject the same honeypot field name and time-trap
  // field the forms send, in case this route is ever targeted directly.
  // Silent fake-success either way — no hint to a bot which check caught it.
  const honeypot = typeof body?.website === "string" ? body.website.trim() : "";
  if (honeypot || submittedTooFast(body?.startedAt)) {
    return NextResponse.json({ ok: true });
  }

  const turnstileOk = await verifyTurnstileToken(body?.turnstileToken, getClientIp(request));
  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Verification failed — please try again." },
      { status: 400 },
    );
  }

  if (!isValidEmail(body?.email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email = body.email.trim();

  // Plain anon-key client, not the SSR cookie-based one — this route has no
  // user session to read, it's a public, unauthenticated capture form. The
  // android_interest table's RLS policy only grants INSERT to anon, so this
  // can't be used to read back anyone else's submitted email.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.from("android_interest").insert({ email });

  if (error) {
    console.error("[android-interest] insert failed:", error);
    // Still report success to the visitor — a dropped signup isn't
    // something they can act on, and surfacing a technical error here
    // would be more confusing than reassuring.
  }

  return NextResponse.json({ ok: true });
}
