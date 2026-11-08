import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Default PKCE flow ties resetPasswordForEmail's link to a secret
        // stored only in the browser that requested it — opening the email
        // on a different device/browser (the normal case: request on
        // desktop, open on phone) leaves no way to complete the exchange,
        // failing with "Auth session missing!" on /set-password. Confirmed
        // live 2026-11-08. Implicit flow puts the session tokens directly
        // in the link itself, so any device can use it.
        flowType: 'implicit',
      },
    },
  );
}
