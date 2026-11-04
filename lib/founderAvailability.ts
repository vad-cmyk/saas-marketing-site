// lib/founderAvailability.ts
import { stripe, STAGE_LIST_PRICE_IDS } from './stripe';

export const FOUNDER_SEAT_LIMIT = 20;

// "First 20 businesses" is a lifetime allocation, not a count of who's
// currently subscribed — a founder who later cancels keeps their spot
// claimed rather than freeing it up for someone else. status: 'all' counts
// every subscription Stripe has ever created on the founder price,
// including trialing, active, past_due, and canceled ones.
export async function getFounderAvailability(): Promise<{
  claimed: number;
  remaining: number;
  soldOut: boolean;
}> {
  let claimed = 0;
  let startingAfter: string | undefined;

  // 20 is small enough that this never needs more than one page in
  // practice, but paginate defensively rather than assume Stripe's default
  // page size (10) always covers it.
  for (;;) {
    const page = await stripe.subscriptions.list({
      price: STAGE_LIST_PRICE_IDS.founder,
      status: 'all',
      limit: 100,
      starting_after: startingAfter,
    });
    claimed += page.data.length;
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  const remaining = Math.max(0, FOUNDER_SEAT_LIMIT - claimed);
  return { claimed, remaining, soldOut: remaining === 0 };
}
