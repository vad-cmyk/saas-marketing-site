// app/api/founder-availability/route.ts
import { NextResponse } from 'next/server';
import { getFounderAvailability } from '@/lib/founderAvailability';

export async function GET() {
  try {
    const { remaining, soldOut } = await getFounderAvailability();
    return NextResponse.json(
      { remaining, soldOut },
      // Short cache: this changes rarely (one write per founder signup) and
      // doesn't need to be live-accurate to the second on a pricing page.
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (err) {
    console.error('Failed to load founder availability', err);
    // Fail closed on the display side too — if we can't confirm seats are
    // left, don't invite someone into a flow that might then reject them.
    return NextResponse.json({ remaining: 0, soldOut: true }, { status: 200 });
  }
}
