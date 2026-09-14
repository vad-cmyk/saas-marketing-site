import Link from 'next/link';
import { getMyOrganization } from '@/lib/get-my-organization';
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
  const org = await getMyOrganization();

  if (!org) {
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
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-line bg-paper px-5 py-4 sm:w-64 sm:border-b-0 sm:border-r sm:py-6">
        <p className="font-display text-lg text-ink">{org.name}</p>
        <nav className="mt-4 flex flex-wrap gap-1 sm:mt-8 sm:flex-col">
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
        <SignOutButton className="mt-4 rounded-xl border border-line px-3 py-2 text-left text-sm font-medium text-ink-soft transition-colors duration-200 ease-out hover:bg-cream hover:text-ink sm:mt-auto">
          Sign out
        </SignOutButton>
      </aside>
      <main className="flex-1 bg-cream px-5 py-6 sm:px-10 sm:py-10">{children}</main>
    </div>
  );
}
