'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
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
