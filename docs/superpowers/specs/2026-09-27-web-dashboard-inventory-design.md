# Web Dashboard: Inventory — Design

## Context

Sub-project #1 (auth + dashboard shell — spec at
`docs/superpowers/specs/2026-09-14-web-dashboard-auth-shell-design.md`) shipped
`/dashboard` with a working login, protected layout, and three placeholder
pages: Inventory, Jobs, Branding — each just a "coming soon" static page. This
is sub-project #2: replacing the Inventory placeholder with the real thing.

The mobile app (`staged-ready`) already has a complete, working Inventory
feature against the same Supabase project (ref `yloqsehowpwxuuuwxdaw`):

- `app/(tabs)/index.tsx` — searchable, category-filterable photo grid
- `app/(tabs)/add.tsx` — add an item with photo(s), optional AI-suggest
- `app/item/[id].tsx` — view/edit an item, its photos, and its job history;
  allocate it to a job

This spec brings the same feature set to the browser, reusing the exact same
tables, RLS policies, storage bucket, and Edge Function the app already
depends on — no backend changes.

## Goals

- A signed-in user can browse, search, and category-filter their inventory
  from `/dashboard/inventory`, in a photo-grid layout matching the app's
  visual language (adapted to more columns on a wider screen).
- They can add a new item, including uploading one or more photos, from the
  browser — no camera required, a standard file picker.
- "Suggest details from photo" (the app's AI-assist feature) is available on
  web too, calling the same `suggest-item-details` Edge Function.
- They can open an item's detail page at `/dashboard/inventory/[id]`, view
  and edit every field the app's item screen shows, manage its photos, view
  its job history, and allocate it to a job via the same project-picker
  pattern the app uses.
- Deleting an item works the same way the app's does, including the
  storage-cleanup-before-row-delete ordering the app's `useDeleteItem`
  comment explains (see Data Layer below) — getting this backwards
  permanently orphans files in a public bucket.
- Visual language matches sub-project #1's dashboard shell (same design
  tokens, same `bg-cream`/`bg-paper` surfaces) and the app's own inventory
  screens' layout conventions (photo-forward grid, not a dense table).

## Non-Goals

- No changes to the mobile app. Every file touched by this spec lives in
  `saas-marketing-site`.
- No new backend: no new tables, columns, RLS policies, storage buckets, or
  Edge Functions. Everything this spec needs already exists and already
  works from the app.
- No quantity-as-separate-items, no status-pill/location/sort filters beyond
  what the app's list screen has today (search + category). Explicitly
  deferred — revisit as its own sub-project later, touching app and web
  together, per the brainstorming discussion this spec came out of.
- No Jobs section (job creation, status management, check-in). Allocating
  an existing item to an existing job is in scope (the app's item detail
  screen already does this); building/managing jobs themselves is
  sub-project #3.
- No bulk/spreadsheet import, even though `useBulkCreateItems` already
  exists in the app's query layer — it isn't wired to any app screen today,
  so there's no reference UI to mirror; out of scope for this pass.

## Approach

**Add `@tanstack/react-query` (pinned `5.104.0`) as a new dependency,
mirroring the app's data layer 1:1.**

Sub-project #1's dashboard shell used plain server-component data fetching
because its needs were simple (one query, one render). Inventory is
fundamentally interactive — live search-as-you-type, instant UI updates
after add/edit/delete, a multi-step add-item flow (pick photo → optionally
suggest → fill in fields → submit → upload photos) — the kind of state
management React Query is built for, and the app's entire `lib/queries.ts`
is already proven against this exact schema and RLS. Reimplementing that
logic by hand with raw `useState`/`useEffect` would mean re-deriving
cache-invalidation behavior the app has already gotten right (e.g.
`useAllocateItem` invalidating four different query keys on success).
Mirroring the hook names and shapes keeps the two codebases easy to compare
and keeps future app/web parity work cheap.

This means `/dashboard/inventory` and `/dashboard/inventory/[id]` become
client components (`'use client'`), unlike sub-project #1's server-rendered
shell pages. The dashboard layout itself (server-rendered, auth-gated)
does not change — these are its `{children}`.

## Design

### Routes

| Route | Purpose |
|---|---|
| `/dashboard/inventory` | Search bar, category filter chips, photo grid, "Add item" entry point (opens a panel/modal, not a separate route) |
| `/dashboard/inventory/[id]` | Item detail: photos, editable fields, job history, "Add to a job" |

### File structure

- `app/dashboard/inventory/page.tsx` (replaces the placeholder) — the list
  view: search input, category chips, photo grid, "Add item" button that
  opens `AddItemPanel`.
- `app/dashboard/inventory/AddItemPanel.tsx` (new, client component) — the
  add-item flow: photo picker (`<input type="file" accept="image/*"
  multiple>`), optional "Suggest details from photo" button, form fields,
  submit. Its own file because it's a genuinely separate, self-contained
  flow from browsing — mirrors the app's separate `add.tsx` screen.
- `app/dashboard/inventory/[id]/page.tsx` (new, client component) — item
  detail: photo carousel/grid, view/edit fields, job history list,
  "Add to a job" button opening `AllocateItemPanel`.
- `app/dashboard/inventory/[id]/AllocateItemPanel.tsx` (new, client
  component) — the project picker for allocating this item to a job. Its
  own file for the same reason as `AddItemPanel`: a distinct, self-contained
  interaction, not something that belongs inline in the detail page's
  render.
- `lib/queries.ts` (new file in the website's `lib/`, alongside the existing
  `lib/supabase/client.ts` and `lib/supabase/server.ts` from sub-project #1)
  — the React Query hooks: `useItems`, `useCategories`, `useItem`,
  `useItemPhotos`, `useItemHistory`, `useCreateItem`, `useUpdateItem`,
  `useDeleteItem`, `useAddItemPhoto`, `useSuggestItemDetails`, `useProjects`,
  `useAllocateItem` — same names, same query keys, same query/mutation
  bodies as the app's `lib/queries.ts`, using the website's browser Supabase
  client (`@/lib/supabase/client`) instead of the app's `supabase` import.
- `lib/photos.ts` (new file in the website's `lib/`) — `uploadPhoto(file:
  File, itemId: string): Promise<string>`, the browser equivalent of the
  app's `lib/photos.ts` (Canvas-based resize/compress instead of
  `expo-image-manipulator`; see Photo Handling below). Also
  `getPhotoBase64ForSuggestion(file: File): Promise<string>`, the browser
  equivalent feeding `useSuggestItemDetails`.
- `app/providers.tsx` (new) — wraps the app in a `QueryClientProvider`
  (React Query requires this at the root). Added to `app/layout.tsx`.

### Data layer

Every hook in the website's new `lib/queries.ts` has an identical
counterpart in the app's `lib/queries.ts` — same table names
(`items`/`item_overview`/`item_photos`/`projects`/`allocations`), same
column selections, same RLS (org-scoped via `memberships`, already proven
correct by the mobile app and independently verified during sub-project
#1's final review). Two hooks carry behavior worth calling out explicitly
because getting them wrong has real consequences:

**`useDeleteItem`** must delete storage objects *before* the item row, not
after. The app's `lib/queries.ts:234-283` has a detailed comment explaining
why: the storage bucket's DELETE policy authorizes removal by checking that
the requesting user has a membership in the org that owns the *item* the
object's folder belongs to (via `storage.foldername(objects.name)[1]` →
item id). Once the item row is gone, that check can never pass again, and
the delete silently fails — permanently orphaning the file in a public
bucket. The website's version must delete `item_photos`' `storage_path`
values from the bucket first (best-effort, swallowing errors — a storage
failure must not block the row delete, which is the part the user is
waiting on and can see), then delete the item row.

**`useSuggestItemDetails`** must only ever fire on an explicit user action
(a "Suggest details" button), never automatically on file selection — the
app's comment notes this costs money per call. Same constraint applies
here.

### Photo handling

The app's `lib/photos.ts` uses `expo-image-manipulator` (resize to 1600px
wide, JPEG @ 0.7 quality) and `expo-file-system` (read as base64) before
uploading via `supabase.storage.from('inventory').upload(path,
decode(base64), { contentType: 'image/jpeg' })`. Neither Expo API exists in
a browser. The website's `uploadPhoto` reproduces the same output (a
resized, compressed JPEG at the same `{item_id}/{timestamp}.jpg` path
convention the existing storage RLS policies already expect — this path
shape is load-bearing, per `useDeleteItem`'s comment above) using the
Canvas API instead:

1. Read the picked `File` into an `<img>` via `URL.createObjectURL`.
2. Draw it to a `<canvas>` sized to max 1600px on the long edge (matching
   the app's resize target), preserving aspect ratio.
3. Export via `canvas.toBlob(callback, 'image/jpeg', 0.7)` (quality 0.7,
   matching the app's compression).
4. Upload the resulting `Blob` directly — `supabase-js`'s browser client
   accepts a `Blob` for `.upload()` natively, no base64/ArrayBuffer decode
   step needed (that step in the app exists only because React Native's
   `fetch().blob()` produces zero-byte uploads on some iOS versions, a
   problem that doesn't exist in a real browser).

`getPhotoBase64ForSuggestion` follows the same canvas-resize pattern but at
600px wide and quality 0.5 (matching the app's smaller/cheaper suggestion
payload), then reads the canvas output as base64 via
`canvas.toDataURL('image/jpeg', 0.5)` and strips the `data:image/jpeg;
base64,` prefix before sending to the Edge Function — which expects the
same bare base64 string + `mediaType: 'image/jpeg'` shape the app already
sends.

### Visual design

List page: search input + category filter chips at the top (same pattern as
sub-project #1's page headers — `font-display` heading, `bg-paper` card
surfaces on `bg-cream` background), then a responsive photo grid — 2 columns
on mobile widths scaling up to 4-5 on desktop, each card an aspect-square
photo with name and status (in storage / out on a job) below it, directly
adapted from the app's grid item markup (`aspect-square`, rounded corners,
subtle shadow) but using Tailwind's existing site tokens instead of the
app's `clay-*` NativeWind scale (the website already has its own
`--clay`/`--sage`/`--ink` tokens from `app/globals.css`; map the app's
semantic colors — clay for primary actions, sage/amber status dots — onto
those rather than introducing a second color system).

Add-item panel and item detail page: same card/form conventions established
in sub-project #1's login page and the site's pre-existing `/set-password`
page — rounded-full inputs, `bg-clay` primary buttons, `border-line` card
edges.

### Error handling

- A failed photo upload during "Add item" must not block the item row from
  being created — matching the app's pattern in `add.tsx` (create the row
  immediately, upload photos in the background, show per-photo
  upload-in-progress/error state without blocking navigation away from the
  form).
- `useSuggestItemDetails` failures show an inline error and leave the form
  fields as-is (untouched, still editable) rather than blocking submission
  — the user can still fill in details manually.
- Deleting an item asks for confirmation first (matching the app's
  long-press confirmation dialog, translated to a browser `confirm()`-style
  dialog or an in-page confirmation state — implementer's call, either is
  fine as long as it requires a deliberate second action).

### Testing

No automated test runner exists in this repo (unchanged project-wide
policy). Verification is `npm run build` plus real manual/Playwright
browser testing against the live Supabase project, consistent with every
prior sub-project: create a real item with a real photo, confirm it appears
in the grid and the category filter picks it up, search for it, open its
detail page, edit a field and confirm it persists, use "Suggest details"
against a real photo, allocate it to a real job, delete it and confirm no
orphaned storage object remains (spot-check via the Supabase dashboard or
Management API, matching how storage cleanup was verified during the
original branding-settings work this project did).
