// lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
});

// Created 2026-11-02 under the same product (prod_VC6k1V7DiEZZAP) as the
// retired £20/month price below, in TEST mode (same mode as the key this
// file loads locally). [TODO VAD: confirm production's STRIPE_SECRET_KEY —
// set in Vercel, not in this repo — is also test mode, or create live-mode
// equivalents of these three prices and swap the IDs below before relying
// on this in production. Could not check production's key mode from here:
// Vercel blocked pulling a production secret value into this session.]
export const STAGE_LIST_PRICE_IDS = {
  monthly: 'price_1UXODI0GWnkpvsiAA9hadVV9', // £29/month
  yearly: 'price_1UXODI0GWnkpvsiAUh0kAvlR', // £290/year
  // Not wired into the public signup form — there's no backend enforcement
  // of "first 20 businesses," so this price is for manually onboarding
  // founding customers (e.g. a Stripe Payment Link) until that's built.
  founder: 'price_1UXODJ0GWnkpvsiAOTZeXYWO', // £19/month, founder offer
} as const;

export type BillingPlan = keyof typeof STAGE_LIST_PRICE_IDS;

// Retired 2026-11-02 — superseded by STAGE_LIST_PRICE_IDS above. Left here
// (not archived in Stripe) only as a record for anyone still referencing it;
// nothing in this repo uses it anymore.
export const STAGE_LIST_PRICE_ID = 'price_1UBiXO0GWnkpvsiAYzmuSwzE';
