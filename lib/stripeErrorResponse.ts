// lib/stripeErrorResponse.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// Every API route that calls the Stripe SDK directly (not just via webhooks)
// needs this — an uncaught Stripe error crashes the route handler, which
// Vercel turns into a 500 with an EMPTY body. The client's `response.json()`
// then throws its own unrelated "Unexpected end of JSON input" error, which
// is what actually reached users twice during this session (the tab-corrupted
// price ID, and a stale/deleted customer ID) instead of a readable message.
export function stripeErrorResponse(err: unknown, context: string) {
  if (err instanceof Stripe.errors.StripeError) {
    console.error(`Stripe error in ${context}`, err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong with billing. Please try again.' },
      { status: err.statusCode ?? 500 },
    );
  }

  console.error(`Unexpected error in ${context}`, err);
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 },
  );
}
