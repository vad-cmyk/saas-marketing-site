'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);

    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch {
      // Global sign-out failed (likely a network blip). Fall back to a
      // local-only sign-out so the session cookie is still cleared even
      // though we couldn't reach Supabase to invalidate it server-side.
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Best effort — even the local sign-out failed. We still navigate
        // below; the middleware will re-check the session on /login.
      }
    }

    // The QueryClient is a single instance for the whole SPA session
    // (app/providers.tsx) and nothing else clears it — without this, a
    // different account signing in in the same tab could see this
    // account's cached data (e.g. useMyOrganization) synchronously
    // before its own fetch resolves, and a seed-once form could persist
    // that stale data as a genuine write to the new account's own row.
    queryClient.clear();

    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-busy={isSigningOut}
      className={className}
    >
      {isSigningOut ? 'Signing out…' : children}
    </button>
  );
}
