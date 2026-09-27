'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getPhotoBase64ForSuggestion } from '@/lib/photos';

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

export interface ItemRow {
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
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface ItemInsert {
  name: string;
  category: string;
  description?: string | null;
  colour?: string | null;
  material?: string | null;
  condition?: string | null;
  quantity?: number;
  bay?: string | null;
  purchase_price?: number | null;
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemInsert) => {
      const { data, error } = await supabase.from('items').insert(item).select().single();
      if (error) throw error;
      return data as ItemRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export interface PhotoRow {
  id: string;
  item_id: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
}

export interface PhotoInsert {
  item_id: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
}

export function useAddItemPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photo: PhotoInsert) => {
      const { data, error } = await supabase
        .from('item_photos')
        .insert(photo)
        .select()
        .single();
      if (error) throw error;
      return data as PhotoRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['item-photos', data.item_id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export interface SuggestedItemDetails {
  name: string;
  category: string;
  colour: string;
  material: string;
  condition: string;
  description: string;
}

// Only ever called from an explicit "Suggest details" button click — never
// automatically on file selection. Each call costs money.
export function useSuggestItemDetails() {
  return useMutation({
    mutationFn: async (file: File) => {
      const image = await getPhotoBase64ForSuggestion(file);

      const { data, error } = await supabase.functions.invoke('suggest-item-details', {
        body: { image, mediaType: 'image/jpeg' },
      });
      if (error) {
        const context = (error as { context?: Response }).context;
        const body = await context?.json?.().catch(() => null);
        throw new Error(body?.error ?? error.message);
      }
      return data as SuggestedItemDetails;
    },
  });
}
