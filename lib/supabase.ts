// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function photoUrl(storagePath: string): string {
  return supabase.storage.from('inventory').getPublicUrl(storagePath).data.publicUrl;
}
