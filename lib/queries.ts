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

export interface ItemUpdate {
  name?: string;
  category?: string;
  description?: string | null;
  colour?: string | null;
  material?: string | null;
  condition?: string | null;
  bay?: string | null;
  purchase_price?: number | null;
}

export function useItem(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item', itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId as string)
        .single();
      if (error) throw error;
      return data as ItemRow;
    },
  });
}

export function useItemPhotos(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item-photos', itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_photos')
        .select('*')
        .eq('item_id', itemId as string)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PhotoRow[];
    },
  });
}

export interface ProjectRow {
  id: string;
  property_address: string;
  client_name: string | null;
  client_email: string | null;
  status: 'proposal' | 'confirmed' | 'staged' | 'collected' | 'cancelled';
  stage_date: string | null;
  collect_date: string | null;
  notes: string | null;
  share_token: string;
  org_id: string;
  created_at: string;
}

export interface AllocationRow {
  id: string;
  item_id: string;
  project_id: string;
  quantity: number;
  status: 'proposed' | 'confirmed' | 'out' | 'returned' | 'dropped';
  checked_out_at: string | null;
  returned_at: string | null;
  org_id: string;
  created_at: string;
}

export function useItemHistory(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item-history', itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allocations')
        .select('*, projects(*)')
        .eq('item_id', itemId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (AllocationRow & { projects: ProjectRow })[];
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ItemUpdate }) => {
      const { data, error } = await supabase
        .from('items')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ItemRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', data.id] });
    },
  });
}

// item_photos rows cascade-delete with the item, but the storage objects
// they point at don't — must remove those explicitly, and in this order.
// The storage bucket's DELETE policy authorizes removal by checking that
// the requesting user belongs to the org that owns the *item* whose folder
// the object sits in (via storage.foldername(objects.name)[1] -> item id).
// Once the item row is gone, that check can never pass again, so deleting
// the row first permanently orphans every one of its files in the public
// bucket. Storage cleanup must happen first, and must be best-effort — a
// storage failure must never block the row delete, which is the part the
// user is waiting on and can see.
export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data: photos } = await supabase
        .from('item_photos')
        .select('storage_path')
        .eq('item_id', itemId);

      if (photos && photos.length > 0) {
        await supabase.storage
          .from(INVENTORY_BUCKET)
          .remove(photos.map((p) => p.storage_path as string))
          .catch(() => {});
      }

      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: (_data, itemId) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.removeQueries({ queryKey: ['item', itemId] });
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, allocations(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (ProjectRow & { allocations: { count: number }[] })[];
    },
  });
}

export function useAllocateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { itemId: string; projectId: string; quantity?: number }) => {
      const { data, error } = await supabase
        .from('allocations')
        .insert({
          item_id: input.itemId,
          project_id: input.projectId,
          quantity: input.quantity ?? 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data as AllocationRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item-history', data.item_id] });
    },
  });
}
