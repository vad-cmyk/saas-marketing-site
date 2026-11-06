// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe, STAGE_LIST_PRICE_IDS, type BillingPlan } from '@/lib/stripe';
import { getFounderAvailability } from '@/lib/founderAvailability';
import { stripeErrorResponse } from '@/lib/stripeErrorResponse';
import { isValidEmail, isValidBusinessName, submittedTooFast } from '@/lib/formValidation';

export async function POST(request: NextRequest) {
  const { email, businessName, website, startedAt, plan } = await request.json();

  // Defense in depth: the signup form's client-side honeypot field and time
  // trap should already stop bots before this request is sent, but don't
  // trust the client alone — reject here too, silently (fake success, no
  // hint to the bot which check caught it).
  const isHoneypotFilled = typeof website === 'string' && website.trim();
  if (isHoneypotFilled || submittedTooFast(startedAt)) {
    return NextResponse.json({ error: 'email and businessName are required' }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!isValidBusinessName(businessName)) {
    return NextResponse.json({ error: 'Please enter your business name.' }, { status: 400 });
  }

  const trimmedEmail = email.trim();
  const trimmedBusinessName = businessName.trim();

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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: trimmedEmail,
      payment_method_collection: 'if_required',
      metadata: { business_name: trimmedBusinessName },
      subscription_data: {
        trial_period_days: 30,
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
        metadata: { business_name: trimmedBusinessName },
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
  } catch (err) {
    return stripeErrorResponse(err, 'checkout');
  }
}
