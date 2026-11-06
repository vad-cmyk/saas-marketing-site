// lib/formValidation.ts
// Shared server-side validation for the two public, unauthenticated forms
// (signup, Android interest) — deliberately not zod, to avoid a new
// dependency for two simple fields; add zod if a third form needs this.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length <= 200 && EMAIL_RE.test(value.trim());
}

export function isValidBusinessName(value: unknown): value is string {
  // Stripe metadata values are capped at 500 chars — stay well under that
  // so a too-long name fails here with a clear message, not a confusing
  // Stripe API error later.
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 200;
}

// Time-trap: a real visitor takes at least a couple of seconds to read the
// form and type into it. `startedAt` is set client-side the moment the form
// mounts; anything submitted faster than this is almost certainly scripted.
const MIN_FORM_SECONDS = 3;

export function submittedTooFast(startedAt: unknown): boolean {
  const started = Number(startedAt);
  if (!Number.isFinite(started)) return false; // missing/malformed — don't block on it, honeypot still covers bots
  return Date.now() - started < MIN_FORM_SECONDS * 1000;
}
