import { getMyOrganization } from '@/lib/get-my-organization';

export default async function DashboardHome() {
  // The layout already guarantees an organization exists before rendering
  // children (it shows a fallback UI and never renders `{children}`
  // otherwise), so this fallback is defensive only — it should be
  // unreachable in practice.
  const org = await getMyOrganization();
  const orgName = org?.name ?? 'your business';

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Welcome back, {orgName}</h1>
      <p className="mt-2 text-ink-soft">
        Use the navigation on the left to get to Inventory, Jobs, or Branding.
      </p>
    </div>
  );
}
