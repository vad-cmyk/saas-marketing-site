// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Matches lib/supabase/client.ts — this client is what /set-password
      // uses to pick up the recovery session from the link's URL. See that
      // file's comment for why implicit (not the SDK default PKCE) flow.
      flowType: 'implicit',
    },
  },
);

export function photoUrl(storagePath: string): string {
  return supabase.storage.from('inventory').getPublicUrl(storagePath).data.publicUrl;
}
