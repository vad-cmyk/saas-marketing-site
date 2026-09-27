# Web Dashboard Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/dashboard/inventory` placeholder with a real, working Inventory section — browse/search/filter, add items with photos and AI-suggest, view/edit/delete, and allocate items to a job — mirroring the mobile app's existing Inventory feature against the same Supabase schema.

**Architecture:** A new `@tanstack/react-query` data layer (`lib/queries.ts`) mirrors the app's existing hooks 1:1 against the same tables/RLS. Photo handling is reimplemented for the browser using the Canvas API in place of the app's Expo APIs, producing the same output (resized/compressed JPEG at the same storage path convention). All new pages are client components, consumed by the existing server-rendered dashboard shell from sub-project #1.

**Tech Stack:** Next.js 16.3.4 (App Router), React 19.2.8, Tailwind v4, `@supabase/supabase-js` ^2.115.0, `@supabase/ssr` ^0.12.7 (both already dependencies), `@tanstack/react-query` (new, pinned `5.104.0`).

**Spec:** `docs/superpowers/specs/2026-09-27-web-dashboard-inventory-design.md`

## Global Constraints

- No new backend: no new tables, columns, RLS policies, storage buckets, or Edge Functions. Everything reuses what the mobile app already depends on in the same Supabase project (ref `yloqsehowpwxuuuwxdaw`).
- Storage path convention for item photos is `{item_id}/{timestamp}.jpg` — load-bearing. The storage bucket's DELETE policy authorizes removal by checking `storage.foldername(objects.name)[1]` against items the requesting user's org owns; any other path shape breaks that check.
- `useDeleteItem` must remove storage objects *before* deleting the item row, best-effort (swallow storage errors), never the other way around — deleting the row first permanently orphans files in the public bucket, since the storage policy's authorization check can never pass again once the item row is gone.
- `useSuggestItemDetails` must only fire from an explicit user action (a button click), never automatically on file selection — each call costs money.
- No automated test runner exists in this repo. Verification is `npm run build` plus manual/Playwright browser testing against the real Supabase project and `npm run dev` locally.
- Real test account for manual verification: email `appreview@thestagelist.com`, password `<redacted from source — rotate this account's password via the Supabase dashboard>`. Has a real org ("Sample Staging Co") with 3 existing sample items (no photos) and a real seeded project ("12 Willow Grove, Bristol", status `confirmed`) for testing allocation. Not a real customer — created for App Store review, safe to reuse.
- Visual language reuses the existing site tokens from `app/globals.css` (`--cream`, `--cream-deep`, `--ink`, `--ink-soft`, `--clay`, `--clay-deep`, `--sage`, `--line`, `--paper`) and `font-display`/`font-body`. No new colors, no new fonts.
- No quantity-as-separate-items, no status-pill/location/sort filters beyond search + category. No Jobs section (creating/managing jobs) — only allocating an *existing* item to an *existing* job is in scope. No bulk/spreadsheet import.

---

### Task 1: React Query setup + Inventory list page (browse/search/filter)

**Files:**
- Modify: `package.json` (add `@tanstack/react-query`)
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`
- Create: `lib/queries.ts`
- Modify: `app/dashboard/inventory/page.tsx` (replaces the sub-project #1 placeholder)

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/client` (sub-project #1).
- Produces: `photoUrl(storagePath: string): string`, `ItemOverview` type, `useItems(params: { search?: string; category?: string })`, `useCategories()` — all from `lib/queries.ts`, consumed by Tasks 2-4.

- [ ] **Step 1: Install React Query**

```bash
cd "/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site"
npm install @tanstack/react-query@5.104.0
```

- [ ] **Step 2: Create the QueryClientProvider wrapper**

Create `app/providers.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Wire it into the root layout**

Modify `app/layout.tsx` — add the import and wrap `{children}`:

```tsx
import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

const publicSans = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "Stage List — Inventory & job allocation for property stagers",
  description:
    "Photograph your staging inventory once, allocate it to jobs forever. Know what's available before you promise it to a client. £20/month, 14-day free trial, no card required.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create the data layer with the two list-page hooks**

Create `lib/queries.ts`:

```ts
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
```

- [ ] **Step 5: Build the list page**

Replace the contents of `app/dashboard/inventory/page.tsx` (the sub-project #1 placeholder) with:

```tsx
'use client';

import { useState } from 'react';
import { useCategories, useItems, photoUrl } from '@/lib/queries';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data: categories } = useCategories();
  const { data: items, isLoading } = useItems({
    search: search.trim() || undefined,
    category,
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Inventory</h1>

      <input
        type="text"
        placeholder="Search name, colour, description"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-4 w-full max-w-md rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-soft/60 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay"
      />

      {categories && categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? undefined : c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200 ease-out ${
                category === c
                  ? 'border-clay bg-clay text-paper'
                  : 'border-line bg-paper text-ink-soft hover:text-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="mt-8 text-ink-soft">Loading…</p>
      ) : items && items.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => {
            const isOut = item.out_qty > 0;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-line bg-paper"
              >
                <div className="aspect-square w-full bg-cream-deep">
                  {item.primary_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl(item.primary_photo)}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      🛋️
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${isOut ? 'bg-clay' : 'bg-sage'}`}
                    />
                    <span className="flex-1 truncate text-sm font-semibold text-ink">
                      {item.name}
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink-soft">
                    {isOut ? (item.current_jobs ?? 'Out') : (item.bay ?? 'In storage')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-ink-soft">
          No pieces match yet. Try a different search or category.
        </p>
      )}
    </div>
  );
}
```

Note: cards are plain `<div>`s here, not links — the detail route doesn't exist until Task 3, which converts these into `<Link>`s. `<img>` is used directly rather than `next/image`, since these are dynamic Supabase Storage URLs and adding `next/image` remote-pattern config is out of scope for this pass.

- [ ] **Step 6: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in at `http://localhost:3000/login` with `appreview@thestagelist.com` / `<redacted from source — rotate this account's password via the Supabase dashboard>`, navigate to `http://localhost:3000/dashboard/inventory`.
Expected: the 3 real seeded items ("Linen Sofa (3-seat)", "Round Oak Coffee Table", "Ceramic Table Lamp") appear in the grid (each showing the 🛋️ fallback, since none have photos yet), with category chips for "Seating", "Tables", "Lighting". Click a category chip — confirm the grid filters to just that category. Type into the search box (e.g. "sofa") — confirm the grid filters to matching items.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app/providers.tsx app/layout.tsx lib/queries.ts app/dashboard/inventory/page.tsx
git commit -m "Add React Query and the real Inventory list page"
```

---

### Task 2: Add Item (photos, AI-suggest)

**Files:**
- Create: `lib/photos.ts`
- Modify: `lib/queries.ts` (add `useCreateItem`, `useAddItemPhoto`, `useSuggestItemDetails`, and their types)
- Create: `app/dashboard/inventory/AddItemPanel.tsx`
- Modify: `app/dashboard/inventory/page.tsx` (add the "Add item" button and panel)

**Interfaces:**
- Consumes: `useCategories` (Task 1). `uploadPhoto`, `getPhotoBase64ForSuggestion` from this task's own `lib/photos.ts`.
- Produces: `ItemRow`, `ItemInsert`, `PhotoRow`, `PhotoInsert`, `SuggestedItemDetails` types, `useCreateItem()`, `useAddItemPhoto()`, `useSuggestItemDetails()` — all from `lib/queries.ts`, consumed by Task 3 (`ItemRow`, `PhotoRow`) and Task 4.

- [ ] **Step 1: Create the browser photo-handling module**

Create `lib/photos.ts`:

```ts
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

async function resizeAndCompress(
  file: File,
  maxDimension: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not create image blob'));
      },
      'image/jpeg',
      quality,
    );
  });
}

// Matches the mobile app's resize target (1600px wide, quality 0.7) so an
// item's photos look consistent regardless of which platform added them.
export async function uploadPhoto(file: File, itemId: string): Promise<string> {
  const blob = await resizeAndCompress(file, 1600, 0.7);
  const path = `${itemId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from('inventory')
    .upload(path, blob, { contentType: 'image/jpeg' });

  if (error) throw error;
  return path;
}

// Smaller/lower-quality than uploadPhoto's output — this only feeds the AI
// vision suggestion call, not the catalogue photo itself, so keep the
// payload (and cost) down, matching the app's same tradeoff.
export async function getPhotoBase64ForSuggestion(file: File): Promise<string> {
  const blob = await resizeAndCompress(file, 600, 0.5);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:image/jpeg;base64," prefix — the Edge Function
      // expects a bare base64 string, matching what the app already sends.
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
```

- [ ] **Step 2: Add the item-creation hooks to the data layer**

Modify the top of `lib/queries.ts`: change the existing `import { useQuery } from '@tanstack/react-query';` line to:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
```

Add a new import line right below the existing `import { createClient } from '@/lib/supabase/client';` line:

```ts
import { getPhotoBase64ForSuggestion } from '@/lib/photos';
```

Then append the following to the bottom of `lib/queries.ts` (after the existing `useCategories` function):

```ts
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
```

- [ ] **Step 3: Build the Add Item panel**

Create `app/dashboard/inventory/AddItemPanel.tsx`:

```tsx
'use client';

import { useRef, useState } from 'react';
import {
  useCategories,
  useCreateItem,
  useAddItemPhoto,
  useSuggestItemDetails,
} from '@/lib/queries';
import { uploadPhoto } from '@/lib/photos';

export default function AddItemPanel({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState('');
  const [material, setMaterial] = useState('');
  const [condition, setCondition] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [bay, setBay] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const createItem = useCreateItem();
  const addPhoto = useAddItemPhoto();
  const suggestDetails = useSuggestItemDetails();

  function handlePhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSuggestDetails() {
    if (!photoFile) return;
    try {
      const suggestion = await suggestDetails.mutateAsync(photoFile);
      setName((prev) => prev || suggestion.name);
      setCategory((prev) => prev || suggestion.category);
      setColour((prev) => prev || suggestion.colour);
      setMaterial((prev) => prev || suggestion.material);
      setCondition((prev) => prev || suggestion.condition);
      setDescription((prev) => prev || suggestion.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not suggest details');
    }
  }

  async function handleSave() {
    if (!name.trim() || !category.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const item = await createItem.mutateAsync({
        name: name.trim(),
        category: category.trim(),
        description: description || null,
        colour: colour || null,
        material: material || null,
        condition: condition || null,
        quantity: quantity ? Number(quantity) : 1,
        bay: bay || null,
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
      });

      if (photoFile) {
        const path = await uploadPhoto(photoFile, item.id);
        await addPhoto.mutateAsync({
          item_id: item.id,
          storage_path: path,
          sort_order: 0,
          is_primary: true,
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save item');
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim().length > 0 && category.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-paper p-6 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Add a piece</h2>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>

        <div className="mt-5">
          {photoPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreviewUrl}
              alt=""
              className="h-40 w-40 rounded-xl object-cover"
            />
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-40 w-40 items-center justify-center rounded-xl border-2 border-dashed border-line text-3xl text-ink-soft hover:text-ink"
            >
              +
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelected}
            className="hidden"
          />
          {photoPreviewUrl && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm text-clay-deep"
            >
              Change photo
            </button>
          )}
        </div>

        {photoFile && (
          <button
            type="button"
            onClick={handleSuggestDetails}
            disabled={suggestDetails.isPending}
            className="mt-4 w-full rounded-2xl border border-line bg-paper py-3 text-sm font-semibold text-clay-deep transition-colors duration-200 ease-out hover:bg-cream disabled:opacity-60"
          >
            {suggestDetails.isPending ? 'Thinking…' : '✨ Suggest details from photo'}
          </button>
        )}

        <div className="mt-5 space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink-soft hover:text-ink"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Colour"
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              className="w-1/2 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
            <input
              type="text"
              placeholder="Material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-1/2 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
            <input
              type="number"
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Bay"
              value={bay}
              onChange={(e) => setBay(e.target.value)}
              className="flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
            <input
              type="number"
              placeholder="Price (£)"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="mt-5 w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper transition-[transform,background-color,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep active:translate-y-0 disabled:pointer-events-none disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save piece'}
        </button>

        {error && <p className="mt-3 text-center text-sm text-clay-deep">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire the panel into the list page**

Modify `app/dashboard/inventory/page.tsx`:

Add to the imports at the top:

```tsx
import AddItemPanel from './AddItemPanel';
```

Add a new state variable inside the component, alongside the existing `search`/`category` state:

```tsx
const [addPanelOpen, setAddPanelOpen] = useState(false);
```

Add an "Add item" button — replace the opening `<h1>` line with a flex row containing both the heading and the button:

```tsx
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Inventory</h1>
        <button
          type="button"
          onClick={() => setAddPanelOpen(true)}
          className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper transition-colors duration-300 ease-out hover:bg-clay-deep"
        >
          + Add item
        </button>
      </div>
```

Add the panel render at the very end of the component's returned JSX, just before the final closing `</div>`:

```tsx
      {addPanelOpen && <AddItemPanel onClose={() => setAddPanelOpen(false)} />}
```

- [ ] **Step 5: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in with the demo account, go to `/dashboard/inventory`, click "+ Add item". Pick a real photo file, click "✨ Suggest details from photo", confirm the AI-suggested fields populate (a real call to the live `suggest-item-details` Edge Function — this costs a small amount of real usage, expected). Fill in any remaining required fields (Name, Category), click "Save piece". Confirm the panel closes and the new item appears in the grid with its real uploaded photo.

- [ ] **Step 6: Commit**

```bash
git add lib/photos.ts lib/queries.ts app/dashboard/inventory/AddItemPanel.tsx app/dashboard/inventory/page.tsx
git commit -m "Add item creation with photo upload and AI-suggest"
```

---

### Task 3: Item detail page (view, edit, delete)

**Files:**
- Modify: `lib/queries.ts` (add `useItem`, `useItemPhotos`, `useItemHistory`, `useUpdateItem`, `useDeleteItem`, and their types)
- Create: `app/dashboard/inventory/[id]/page.tsx`
- Modify: `app/dashboard/inventory/page.tsx` (grid cards become links to the detail page)

**Interfaces:**
- Consumes: `ItemRow`, `PhotoRow`, `photoUrl` (Task 1/2).
- Produces: `ItemUpdate`, `ProjectRow`, `AllocationRow` types, `useItem()`, `useItemPhotos()`, `useItemHistory()`, `useUpdateItem()`, `useDeleteItem()` — from `lib/queries.ts`, consumed by Task 4 (`ProjectRow`, `AllocationRow`, and the detail page itself, which Task 4 modifies to add allocation).

- [ ] **Step 1: Add the item-detail hooks to the data layer**

Append to the bottom of `lib/queries.ts`:

```ts
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
```

- [ ] **Step 2: Build the item detail page**

Create `app/dashboard/inventory/[id]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useDeleteItem,
  useItem,
  useItemHistory,
  useItemPhotos,
  useUpdateItem,
  photoUrl,
} from '@/lib/queries';

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between border-b border-line/60 py-2 last:border-0">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const itemId = params.id;

  const { data: item, isLoading } = useItem(itemId);
  const { data: photos } = useItemPhotos(itemId);
  const { data: history } = useItemHistory(itemId);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    colour: '',
    material: '',
    condition: '',
    bay: '',
    purchase_price: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        category: item.category,
        description: item.description ?? '',
        colour: item.colour ?? '',
        material: item.material ?? '',
        condition: item.condition ?? '',
        bay: item.bay ?? '',
        purchase_price: item.purchase_price != null ? String(item.purchase_price) : '',
      });
    }
  }, [item]);

  async function handleSaveEdits() {
    if (!item) return;
    await updateItem.mutateAsync({
      id: item.id,
      patch: {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description || null,
        colour: form.colour || null,
        material: form.material || null,
        condition: form.condition || null,
        bay: form.bay || null,
        purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
      },
    });
    setEditing(false);
  }

  async function handleDelete() {
    if (!item) return;
    if (!window.confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    await deleteItem.mutateAsync(item.id);
    router.push('/dashboard/inventory');
  }

  if (isLoading || !item) {
    return <p className="text-ink-soft">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => router.push('/dashboard/inventory')}
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← Back to inventory
      </button>

      {photos && photos.length > 0 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photoUrl(photo.storage_path)}
              alt={item.name}
              className="h-56 w-56 shrink-0 rounded-2xl object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex h-56 w-56 items-center justify-center rounded-2xl bg-cream-deep text-4xl">
          🛋️
        </div>
      )}

      <div className="mt-5 flex items-start justify-between">
        <div>
          {editing ? (
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-line bg-paper px-3 py-2 text-xl font-bold text-ink"
            />
          ) : (
            <h1 className="font-display text-2xl text-ink">{item.name}</h1>
          )}
          <p className="mt-1 text-sm text-ink-soft">{item.category}</p>
        </div>
        <button
          type="button"
          onClick={() => (editing ? handleSaveEdits() : setEditing(true))}
          className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink-soft hover:text-ink"
        >
          {editing ? 'Save' : 'Edit'}
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-paper p-4">
        {editing ? (
          <div className="space-y-3">
            {(['category', 'colour', 'material', 'condition', 'bay'] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {field}
                </label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Price (£)
              </label>
              <input
                type="number"
                value={form.purchase_price}
                onChange={(e) => setForm((f) => ({ ...f, purchase_price: e.target.value }))}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Row label="Colour" value={item.colour} />
            <Row label="Material" value={item.material} />
            <Row
              label="Dimensions"
              value={
                item.width_cm || item.depth_cm || item.height_cm
                  ? `${item.width_cm ?? '–'} × ${item.depth_cm ?? '–'} × ${item.height_cm ?? '–'} cm`
                  : null
              }
            />
            <Row label="Condition" value={item.condition} />
            <Row label="Quantity" value={String(item.quantity)} />
            <Row label="Bay" value={item.bay} />
            <Row
              label="Price"
              value={item.purchase_price != null ? `£${item.purchase_price.toFixed(2)}` : null}
            />
            {item.description && (
              <p className="pt-2 text-sm leading-relaxed text-ink-soft">{item.description}</p>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Job history
      </h2>
      {history && history.length > 0 ? (
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="rounded-2xl border border-line bg-paper p-3">
              <p className="text-sm font-semibold text-ink">{h.projects.property_address}</p>
              <p className="text-xs text-ink-soft">{h.status}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Not yet allocated to a job.</p>
      )}

      <button
        type="button"
        onClick={handleDelete}
        className="mt-8 text-sm font-medium text-clay-deep"
      >
        Delete this piece
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Link the list page's cards to the detail page**

Modify `app/dashboard/inventory/page.tsx`:

Add to the imports:

```tsx
import Link from 'next/link';
```

Replace the grid card's outer `<div>` (the one with `key={item.id}` and the `overflow-hidden rounded-2xl border border-line bg-paper` class) with a `<Link>` to the same destination, keeping everything inside it unchanged:

```tsx
              <Link
                key={item.id}
                href={`/dashboard/inventory/${item.id}`}
                className="overflow-hidden rounded-2xl border border-line bg-paper transition-transform duration-200 ease-out hover:-translate-y-0.5"
              >
```

(and its matching closing tag changes from `</div>` to `</Link>`)

- [ ] **Step 4: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in with the demo account, go to `/dashboard/inventory`, click the item you created in Task 2 (the one with a real photo). Confirm its photo, name, and category show correctly. Click "Edit", change the Colour field, click "Save" — confirm it persists (reload the page, confirm the new colour still shows). Click "Delete this piece", confirm the browser confirmation dialog, confirm it. Confirm you're returned to `/dashboard/inventory` and the item is gone from the grid.

Then verify the storage cleanup actually happened (not just the row): query the Supabase project directly for any remaining `item_photos` rows or storage objects referencing the deleted item's id, and confirm none exist.

- [ ] **Step 5: Commit**

```bash
git add lib/queries.ts "app/dashboard/inventory/[id]/page.tsx" app/dashboard/inventory/page.tsx
git commit -m "Add item detail page with view, edit, and delete"
```

---

### Task 4: Allocate item to a job

**Files:**
- Modify: `lib/queries.ts` (add `useProjects`, `useAllocateItem`)
- Create: `app/dashboard/inventory/[id]/AllocateItemPanel.tsx`
- Modify: `app/dashboard/inventory/[id]/page.tsx` (add the "Add to a job" button and panel)

**Interfaces:**
- Consumes: `ProjectRow`, `AllocationRow` (Task 3).
- Produces: `useProjects()`, `useAllocateItem()` — nothing downstream in this plan consumes these further; this is the final task.

- [ ] **Step 1: Add the allocation hooks to the data layer**

Append to the bottom of `lib/queries.ts`:

```ts
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectRow[];
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
```

- [ ] **Step 2: Build the allocate panel**

Create `app/dashboard/inventory/[id]/AllocateItemPanel.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useAllocateItem, useProjects } from '@/lib/queries';

export default function AllocateItemPanel({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const { data: projects } = useProjects();
  const allocateItem = useAllocateItem();
  const [error, setError] = useState<string | null>(null);

  async function handleAllocate(projectId: string) {
    try {
      await allocateItem.mutateAsync({ itemId, projectId });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to job');
    }
  }

  const activeProjects = (projects ?? []).filter(
    (p) => p.status !== 'collected' && p.status !== 'cancelled',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-paper p-6 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Add to a job</h2>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>

        {activeProjects.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No active jobs yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {activeProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleAllocate(project.id)}
                disabled={allocateItem.isPending}
                className="w-full rounded-xl border border-line bg-paper p-3 text-left transition-colors duration-200 ease-out hover:bg-cream disabled:opacity-60"
              >
                <p className="text-sm font-semibold text-ink">{project.property_address}</p>
                <p className="text-xs text-ink-soft">{project.client_name ?? project.status}</p>
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-clay-deep">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire the panel into the item detail page**

Modify `app/dashboard/inventory/[id]/page.tsx`:

Add to the imports:

```tsx
import AllocateItemPanel from './AllocateItemPanel';
```

Add a new state variable alongside the existing `editing` state:

```tsx
const [allocateOpen, setAllocateOpen] = useState(false);
```

Add an "Add to a job" button — insert it right after the closing `</div>` of the name/category/edit-button row (the `<div className="mt-5 flex items-start justify-between">...</div>` block) and before the fields card (`<div className="mt-5 rounded-2xl border border-line bg-paper p-4">`):

```tsx
      <button
        type="button"
        onClick={() => setAllocateOpen(true)}
        className="mt-4 w-full rounded-full bg-clay py-3.5 text-base font-semibold text-paper transition-colors duration-300 ease-out hover:bg-clay-deep"
      >
        Add to a job
      </button>
```

Add the panel render at the very end of the component's returned JSX, just before the final closing `</div>` (after the "Delete this piece" button):

```tsx
      {allocateOpen && (
        <AllocateItemPanel itemId={item.id} onClose={() => setAllocateOpen(false)} />
      )}
```

- [ ] **Step 4: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in with the demo account, open the item you created in Task 2, click "Add to a job". Confirm the seeded project "12 Willow Grove, Bristol" appears in the list. Click it. Confirm the panel closes and the item's "Job history" section now shows that project with status "proposed" — without needing to manually reload the page (confirms the query invalidation is working).

- [ ] **Step 5: Commit**

```bash
git add lib/queries.ts "app/dashboard/inventory/[id]/AllocateItemPanel.tsx" "app/dashboard/inventory/[id]/page.tsx"
git commit -m "Add allocating an item to a job"
```

---

## Self-Review Notes

**Spec coverage:** Routes (`/dashboard/inventory`, `/dashboard/inventory/[id]`) → Tasks 1, 3. File structure (all 8 listed files: `AddItemPanel.tsx`, `[id]/page.tsx`, `[id]/AllocateItemPanel.tsx`, `lib/queries.ts`, `lib/photos.ts`, `app/providers.tsx`) → Tasks 1-4, each file's creation traced to the task that first needs it. React Query approach → Task 1. Photo handling (Canvas resize/compress, same path convention) → Task 2. AI-suggest reuse → Task 2. Visual design (site tokens, photo-grid layout) → Tasks 1-4 throughout. Error handling (non-blocking photo upload, non-blocking suggest failure, delete confirmation) → Tasks 2-3. Testing → each task's own real-browser verification against the real Supabase project and the seeded demo data.

**Placeholder scan:** No TBD/TODO markers; every step has complete, real code.

**Type consistency:** `ItemOverview` (Task 1), `ItemRow`/`ItemInsert`/`PhotoRow`/`PhotoInsert`/`SuggestedItemDetails` (Task 2), `ItemUpdate`/`ProjectRow`/`AllocationRow` (Task 3) are each defined exactly once, in the task that first needs them, and referenced identically by name in every later task that uses them — no redefinitions, no name drift. Hook names (`useItems`, `useCategories`, `useCreateItem`, `useAddItemPhoto`, `useSuggestItemDetails`, `useItem`, `useItemPhotos`, `useItemHistory`, `useUpdateItem`, `useDeleteItem`, `useProjects`, `useAllocateItem`) match the app's own `lib/queries.ts` naming throughout, as the spec requires for app/web parity.

**Forward-reference check:** Verified each task only imports files that already exist by the time that task runs — Task 1 doesn't reference `AddItemPanel` (Task 2) or the detail route (Task 3); Task 3's initial detail page doesn't reference `AllocateItemPanel` (Task 4, which adds that button in its own step rather than Task 3 shipping an inert placeholder for it).
