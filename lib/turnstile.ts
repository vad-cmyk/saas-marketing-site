const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

/**
 * Verifies a Cloudflare Turnstile token server-side. This is the check that
 * actually counts — the widget on the client is just UX, anyone can post
 * directly to the API without it.
 *
 * Fails closed: a missing/invalid token is rejected. If TURNSTILE_SECRET_KEY
 * isn't set (e.g. a local dev environment that hasn't configured it), the
 * check is skipped rather than permanently locking out local testing.
 */
export async function verifyTurnstileToken(
  token: unknown,
  remoteIp?: string | null,
): Promise<boolean> {
  if (!SECRET_KEY) {
    return true;
  }

  if (typeof token !== "string" || !token) {
    return false;
  }

  try {
    const body = new URLSearchParams({ secret: SECRET_KEY, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Couldn't reach Cloudflare to verify — fail closed, since we can't
    // confirm the token is real.
    return false;
  }
}

/** Best-effort client IP from standard proxy headers (Vercel sets these). */
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}
