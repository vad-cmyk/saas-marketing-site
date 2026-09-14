import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getMyOrganization = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('memberships')
    .select(
      'role, organizations(id, name, subscription_status, trial_ends_at, logo_url, brand_color, contact_email, contact_phone)',
    )
    .limit(1)
    .maybeSingle();

  if (error || !data?.organizations) {
    return null;
  }

  return data.organizations as unknown as {
    id: string;
    name: string;
    subscription_status: string;
    trial_ends_at: string | null;
    logo_url: string | null;
    brand_color: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  };
});
