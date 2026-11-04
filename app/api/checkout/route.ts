// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe, STAGE_LIST_PRICE_IDS, type BillingPlan } from '@/lib/stripe';
import { getFounderAvailability } from '@/lib/founderAvailability';

export async function POST(request: NextRequest) {
  const { email, businessName, website, plan } = await request.json();

  // Defense in depth: the signup form's client-side honeypot field should
  // already stop bots before this request is sent, but don't trust the
  // client alone — reject here too if it's somehow present and filled.
  if (typeof website === 'string' && website.trim()) {
    return NextResponse.json(
      { error: 'email and businessName are required' },
      { status: 400 },
    );
  }

  if (!email || !businessName) {
    return NextResponse.json(
      { error: 'email and businessName are required' },
      { status: 400 },
    );
  }

  const selectedPlan: BillingPlan =
    plan === 'yearly' ? 'yearly' : plan === 'founder' ? 'founder' : 'monthly';

  // The UI disables the founder option once sold out, but that's only
  // convenience — this is the actual gate. Re-checked here rather than
  // trusted from the client, since the request body is just JSON anyone
  // could post directly.
  if (selectedPlan === 'founder') {
    const { soldOut } = await getFounderAvailability();
    if (soldOut) {
      return NextResponse.json(
        { error: 'Founder pricing is sold out — the first 20 spots are taken.' },
        { status: 409 },
      );
    }
  }

  const priceId = STAGE_LIST_PRICE_IDS[selectedPlan];

  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    payment_method_collection: 'if_required',
    metadata: { business_name: businessName },
    subscription_data: {
      trial_period_days: 30,
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
