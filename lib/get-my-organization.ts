import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

type Organization = {
  id: string;
  name: string;
  subscription_status: string;
  trial_ends_at: string | null;
  logo_url: string | null;
  brand_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  stripe_customer_id: string | null;
  has_payment_method: boolean;
  created_at: string;
};

export const getMyOrganization = cache(async () => {
  const supabase = await createClient();

  // A person can end up a member of more than one organization — most
  // commonly in testing (signing up repeatedly with the same email creates
  // a fresh org + membership each time), but there's nothing stopping it
  // for a real customer either. Found live 2026-11-09: fetching a single
  // row with no order let Postgres return any matching membership, which
  // surfaced as the dashboard showing a stale org from months earlier
  // instead of the current one.
  //
  // PostgREST's `order` with a referencedTable only reorders nested arrays
  // in a one-to-many embed — it doesn't affect which row comes first for a
  // to-one join like this one, so sorting has to happen here instead of in
  // the query. A person realistically has a handful of memberships at
  // most, so fetching all of them and picking the newest is simple and
  // correct rather than relying on undefined row order from a `.limit(1)`.
  const { data, error } = await supabase
    .from('memberships')
    .select(
      'role, organizations(id, name, subscription_status, trial_ends_at, logo_url, brand_color, contact_email, contact_phone, stripe_customer_id, has_payment_method, created_at)',
    );

  if (error || !data || data.length === 0) {
    return null;
  }

  const organizations = data
    .map((row) => row.organizations as unknown as Organization | null)
    .filter((org): org is Organization => org !== null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return organizations[0] ?? null;
});
