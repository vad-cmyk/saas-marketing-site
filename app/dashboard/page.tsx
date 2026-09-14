import { createClient } from '@/lib/supabase/server';

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('memberships')
    .select('organizations(name)')
    .limit(1)
    .maybeSingle();

  const orgName =
    (data?.organizations as { name: string } | null | undefined)?.name ??
    'your business';

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Welcome back, {orgName}</h1>
      <p className="mt-2 text-ink-soft">
        Use the navigation on the left to get to Inventory, Jobs, or Branding.
      </p>
    </div>
  );
}
