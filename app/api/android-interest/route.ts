// app/api/android-interest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
