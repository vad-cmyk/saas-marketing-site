import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/inventory', label: 'Inventory' },
  { href: '/dashboard/jobs', label: 'Jobs' },
  { href: '/dashboard/branding', label: 'Branding' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('memberships')
    .select(
      'role, organizations(id, name, subscription_status, trial_ends_at, logo_url, brand_color, contact_email, contact_phone)',
    )
    .limit(1)
    .maybeSingle();

  const org = data?.organizations as { name: string } | null | undefined;

  if (error || !org) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <p className="text-lg text-ink">
            We couldn&rsquo;t load your account. Try signing in again.
          </p>
          <SignOutButton className="mt-4 inline-block rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-paper">
            Sign out
          </SignOutButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-paper px-5 py-6">
        <p className="font-display text-lg text-ink">{org.name}</p>
        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors duration-200 ease-out hover:bg-cream hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <SignOutButton className="mt-auto rounded-xl border border-line px-3 py-2 text-left text-sm font-medium text-ink-soft transition-colors duration-200 ease-out hover:bg-cream hover:text-ink">
          Sign out
        </SignOutButton>
      </aside>
      <main className="flex-1 bg-cream px-10 py-10">{children}</main>
    </div>
  );
}
