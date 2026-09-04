// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe, STAGINGHUB_PRICE_ID } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const { email, businessName } = await request.json();

  if (!email || !businessName) {
    return NextResponse.json(
      { error: 'email and businessName are required' },
      { status: 400 },
    );
  }

  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: STAGINGHUB_PRICE_ID, quantity: 1 }],
    customer_email: email,
    payment_method_collection: 'if_required',
    metadata: { business_name: businessName },
    subscription_data: {
      trial_period_days: 14,
      trial_settings: {
        end_behavior: { missing_payment_method: 'cancel' },
      },
      metadata: { business_name: businessName },
    },
    success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: 'Stripe did not return a checkout URL' },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: session.url });
}
