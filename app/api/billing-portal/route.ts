// app/api/billing-portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getMyOrganization } from '@/lib/get-my-organization';
import { stripeErrorResponse } from '@/lib/stripeErrorResponse';

export async function POST(request: NextRequest) {
  // getMyOrganization() resolves the org from the authenticated session's own
  // memberships row (RLS-scoped) — never from client input — so there's no
  // way to request a portal session for a different business's billing.
  const org = await getMyOrganization();

  if (!org) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  if (!org.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No billing account found for this organization' },
      { status: 400 },
    );
  }

  const origin = request.nextUrl.origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return stripeErrorResponse(err, 'billing-portal');
  }
}
