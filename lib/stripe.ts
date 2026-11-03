// lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2026-08-26.dahlia',
});

// Price IDs are mode-scoped in Stripe (a test-mode price does not exist
// under a live-mode key, and vice versa) — they live in env vars rather
// than as literals here so each environment's STRIPE_SECRET_KEY and its
// price IDs stay in matching modes without a code change. Set in Vercel's
// dashboard for production; the defaults below are the TEST-mode prices
// created 2026-11-02 under product prod_VC6k1V7DiEZZAP, used whenever the
// env var isn't set (e.g. local dev against .env.local's test key).
//
// .trim() guards against stray leading/trailing whitespace from pasting a
// value into Vercel's env var UI — confirmed live 2026-11-03: a copy-pasted
// price ID picked up a leading tab character, which Stripe treats as part
// of the ID, producing a "No such price" error on every checkout attempt.
const envPrice = (name: string) => process.env[name]?.trim() || undefined;

export const STAGE_LIST_PRICE_IDS = {
  monthly: envPrice('STRIPE_PRICE_ID_MONTHLY') ?? 'price_1UXODI0GWnkpvsiAA9hadVV9', // £29/month
  yearly: envPrice('STRIPE_PRICE_ID_YEARLY') ?? 'price_1UXODI0GWnkpvsiAUh0kAvlR', // £290/year
  // Not wired into the public signup form — there's no backend enforcement
  // of "first 20 businesses," so this price is for manually onboarding
  // founding customers (e.g. a Stripe Payment Link) until that's built.
  founder: envPrice('STRIPE_PRICE_ID_FOUNDER') ?? 'price_1UXODJ0GWnkpvsiAOTZeXYWO', // £19/month, founder offer
} as const;

export type BillingPlan = keyof typeof STAGE_LIST_PRICE_IDS;
