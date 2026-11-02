// lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
});

// [TODO VAD: the site now displays £29/month, £290/year, and a £19/month
// founder price, but this Price ID has not been updated to match — it still
// points at the old £20/month Price object. Create new Stripe Price
// object(s) for £29/month (and £290/year, and the £19 founder price if that
// needs its own metered/coupon approach) and wire the correct one in here
// before this goes live, or checkout will charge the old amount.]
export const STAGE_LIST_PRICE_ID = 'price_1UBiXO0GWnkpvsiAYzmuSwzE';
