'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const INVENTORY_BUCKET = 'inventory';

export function photoUrl(storagePath: string): string {
  return supabase.storage.from(INVENTORY_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export interface ItemOverview {
  id: string;
  name: string;
  description: string | null;
  category: string;
  colour: string | null;
  material: string | null;
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
  condition: string | null;
  quantity: number;
  bay: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  tags: string[];
  retired: boolean;
  created_at: string;
  updated_at: string;
  primary_photo: string | null;
  out_qty: number;
  in_storage_qty: number;
  current_jobs: string | null;
}

export function useItems(params: { search?: string; category?: string } = {}) {
  const { search, category } = params;
  return useQuery({
    queryKey: ['items', { search, category }],
    queryFn: async () => {
      let query = supabase
        .from('item_overview')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) query = query.eq('category', category);
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%,colour.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ItemOverview[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('category')
        .eq('retired', false);
      if (error) throw error;
      const unique = Array.from(
        new Set((data ?? []).map((r) => r.category as string)),
      );
      return unique.sort();
    },
  });
}
