# Web Dashboard: Jobs — Design

## Context

Sub-project #1 (auth + dashboard shell) shipped `/dashboard` with three
placeholder pages: Inventory, Jobs, Branding. Sub-project #2 replaced the
Inventory placeholder with a real feature, including allocating an
existing item to an existing job from the item's detail page — but there
was no way yet to create, view, or manage a job itself from the browser.
This is sub-project #3: replacing the Jobs placeholder with the real
thing.

The mobile app (`staged-ready`) already has a complete, working Jobs
feature against the same Supabase project (ref `yloqsehowpwxuuuwxdaw`):

- `app/(tabs)/jobs.tsx` — job list, grouped into sections by status, with
  a "New job" button and long-press-to-delete
- `app/job/new.tsx` — create a job (address, client name/email, stage/
  collect dates, notes)
- `app/job/[id].tsx` — job detail: allocated items with per-item status
  controls, job status advancement, a bulk "check in" action, cancel,
  an availability-clash warning, and a copy-share-link action

This spec brings the same feature set to the browser, reusing the exact
same tables, RLS policies, and Postgres RPC function the app already
depends on — no backend changes. It also makes one small necessary change
to code sub-project #2 already shipped (see Approach).

## Goals

- A signed-in user can see all their jobs at `/dashboard/jobs`, grouped by
  status the same way the app groups them (staged, confirmed, proposal,
  collected, cancelled — in that order, empty sections omitted).
- They can create a new job (property address required; client name,
  client email, stage date, collect date, notes all optional), created
  with status `confirmed` — matching the app's `new.tsx`, which
  deliberately skips the schema's `proposal` default.
- They can open a job's detail page at `/dashboard/jobs/[id]` and see its
  allocated items (photo, name, quantity, status), each with a button to
  advance that item's status forward one step (`proposed` → `confirmed` →
  `out` → `returned`) — matching the app's one-step-forward-only pattern.
- They can advance the job's own status forward one step
  (`proposal` → `confirmed` → `staged`), matching the app.
- They can "Check in" a `staged` job in one action: every `out` allocation
  on it becomes `returned` and the job itself becomes `collected` in the
  same operation — matching the app's `useCheckInJob`, which exists
  specifically because forgetting this step is what makes availability
  data wrong.
- They can cancel a job (status → `cancelled`), matching the app.
- They see an availability-clash warning when an allocated item's
  quantity on this job exceeds what's actually free across overlapping
  jobs — calling the same `project_clashes` RPC the app already calls, no
  new backend logic.
- They can copy a shareable client link (`/proposal/{share_token}`, the
  page already live on this site, unrelated to this spec) to their
  clipboard.
- They can delete a job. The app only exposes this via a long-press on
  the list, with no delete affordance on the detail screen at all — long-
  press has no web equivalent, so per your call during design, delete
  moves to a "Delete this job" text link on the job detail page, using
  the same allocation-count warning copy the app's long-press confirm
  already has and the same `confirm()`-dialog pattern the Inventory item
  detail page already established.

## Non-Goals

- No changes to `/proposal/[token]` itself — that client-facing page
  already exists, already works, and is out of scope here.
- No item picker on the job detail page. Allocating an item to a job only
  happens from the item's own detail page (`AllocateItemPanel`, shipped
  in sub-project #2) — matching the app, whose job detail screen says
  "Add pieces from Inventory" rather than offering its own picker.
- No new backend: no new tables, columns, RLS policies, or RPC functions.
  `projects`, `allocations`, and `project_clashes` all already exist and
  already work from the app.
- No editing a job's own fields (address, client name/email, dates,
  notes) after creation — the app doesn't support this either; only
  status can change post-creation.
- No client-facing changes to the proposal page's content (e.g. which
  items appear on it) — that's driven by `share_token` + allocation data
  the same way it already is today, unaffected by this spec.

## Approach

**Extend `lib/queries.ts` with the app's Jobs hooks, same names/keys/
bodies, same pattern established for Inventory.** `ProjectRow` and
`AllocationRow` already exist in the website's `lib/queries.ts` (added in
sub-project #2's Task 3, for the item detail page's job-history list) —
Jobs reuses both without redefinition, adding only a new `ProjectInsert`
type for job creation.

**One necessary change to already-shipped Inventory code.** The app's
`useAllocateItem` invalidates four query keys on success: `items`,
`item-history`, `project-allocations`, and `project-clashes`. The web
version shipped in sub-project #2 only invalidates the first two, because
the other two query keys didn't exist anywhere in the web app yet — Jobs
is what makes them real. Without adding those two invalidations now,
allocating an item to a job from the Inventory side won't make it appear
on that job's detail page without a manual reload. Similarly, the
`useProjects()` hook added in sub-project #2 (for `AllocateItemPanel`'s
project picker) queries `.select('*')`; the app's own `useProjects` queries
`.select('*, allocations(count)')` so the job list can show each job's
item count. Sub-project #2's final review flagged this exact difference
and parked it as harmless because nothing consumed the count at the time
— it stops being harmless the moment the Jobs list needs it, so this spec
updates the query in place rather than introducing a second, differently-
shaped hook.

**Job list and detail pages become client components** (`'use client'`),
same as Inventory's pages, for the same reason: live status transitions,
instant UI updates after check-in/cancel/delete, and React Query's cache
invalidation doing the cross-page consistency work by hand-rolling it
would duplicate.

## Design

### Routes

| Route | Purpose |
|---|---|
| `/dashboard/jobs` | Job list grouped by status, "New job" entry point (opens a panel, not a separate route — matching Inventory's "Add item" pattern rather than the app's separate `new.tsx` screen) |
| `/dashboard/jobs/[id]` | Job detail: allocated items with status controls, job status/check-in/cancel/delete actions, clash warning, share-link copy |

### File structure

- `app/dashboard/jobs/page.tsx` (replaces the placeholder) — the list
  view: section-grouped jobs, "New job" button that opens `NewJobPanel`.
- `app/dashboard/jobs/NewJobPanel.tsx` (new, client component) — the
  create-job form: property address (required), client name, client
  email, stage date, collect date, notes, submit. Its own file for the
  same reason `AddItemPanel` got its own file: a distinct, self-contained
  flow from browsing.
- `app/dashboard/jobs/[id]/page.tsx` (new, client component) — job
  detail: header (address/client/dates/status), clash-warning banner
  (when present), action row (copy share link, advance status, check in,
  cancel, delete), allocated-items list with per-item status buttons.
- `lib/queries.ts` (modified) — add `useProject`, `useProjectAllocations`,
  `useProjectClashes`, `useCreateProject`, `useDeleteProject`,
  `useUpdateProjectStatus`, `useUpdateAllocationStatus`, `useCheckInJob`,
  and the `ProjectInsert` type; update `useProjects` to select the
  allocation count; add two invalidations to `useAllocateItem`'s
  `onSuccess`.

### Data layer

All eight new hooks mirror the app's `lib/queries.ts` (lines 373-576)
exactly — same table/RPC names, same column selections, same status-
transition logic, translated to the website's browser Supabase client.
Specifics worth calling out:

- **`useProjects`** (modified): `.select('*, allocations(count)')`,
  ordered by `created_at` descending — same as the app. Its existing
  consumer (`AllocateItemPanel`'s project picker) only reads
  `property_address`/`client_name`/`status`, so the added `allocations`
  field is inert there and doesn't require touching that file.
- **`useProject(id)`**: single project by id, for the detail page's
  header.
- **`useProjectAllocations(id)`**: `allocations` joined to
  `items(*, item_photos(storage_path, is_primary, sort_order))`,
  filtered to `status <> 'dropped'`, ordered by `created_at` ascending —
  the detail page's allocated-items list, including each item's primary
  photo.
- **`useProjectClashes(id)`**: calls `supabase.rpc('project_clashes', {
  p_project: id })`, returning `{ item_id, item_name, wanted, free,
  clashes_with }[]` — an existing Postgres function that finds allocations
  on this job whose quantity exceeds what's actually free once overlapping
  jobs (by date range) are accounted for. No new backend work; this
  spec only adds the client-side call and the warning banner that reads
  its result.
- **`useCreateProject`**: inserts a `ProjectInsert` (`property_address`
  required; `client_name`, `client_email`, `stage_date`, `collect_date`,
  `notes` all optional/nullable; `status` passed explicitly as
  `'confirmed'` by the panel, matching the app's `new.tsx`), invalidates
  `['projects']`.
- **`useDeleteProject`**: deletes the project row (allocations cascade-
  delete with it at the database level — confirmed by reading the
  app's own delete flow, which warns about exactly this), invalidates
  `['projects']`.
- **`useUpdateProjectStatus`**: updates `status`, invalidates `['projects']`
  and `['project', id]`.
- **`useUpdateAllocationStatus`**: updates an allocation's `status`;
  additionally sets `checked_out_at` when moving to `out` and
  `returned_at` when moving to `returned` (matching the app exactly —
  these two timestamp columns are what `project_clashes` and the item's
  own job-history rely on being accurate). Invalidates
  `['project-allocations', projectId]`, `['project-clashes', projectId]`,
  `['items']`, and `['item-history', itemId]`.
- **`useCheckInJob`**: two-step mutation — first bulk-updates every
  `out` allocation on the project to `returned` (with `returned_at` set),
  then updates the project's own status to `collected`. Invalidates
  `['project-allocations', projectId]`, `['project', projectId]`,
  `['projects']`, and `['items']`.
- **`useAllocateItem`** (modified, sub-project #2's hook): add
  `queryClient.invalidateQueries({ queryKey: ['project-allocations',
  data.project_id] })` and `queryClient.invalidateQueries({ queryKey:
  ['project-clashes', data.project_id] })` to its existing `onSuccess`,
  alongside the `items`/`item-history` invalidations already there.

Status-transition tables (which status can advance to which) are small,
fixed lookup objects defined directly in the two files that use them —
`NEXT_PROJECT_STATUS` (`proposal`→`confirmed`, `confirmed`→`staged`) and
`NEXT_ALLOCATION_STATUS` (`proposed`→`confirmed`, `confirmed`→`out`,
`out`→`returned`) — copied from the app verbatim, since they're pure
display/UI logic, not data-layer concerns.

### Visual design

List page: same page-header pattern as Inventory and Branding
(`font-display` heading, "New job" button top-right). Jobs are grouped
under section labels (`text-xs font-semibold uppercase tracking-wide
text-ink-soft`, matching Inventory's category-chip label styling) in the
order staged, confirmed, proposal, collected, cancelled — sections with
no jobs are omitted, matching the app. Each job is a `bg-paper` card
(not a photo grid — jobs aren't photo-primary) showing address, client
name, a formatted date range, and the item count, styled consistently
with Inventory's list cards (`border-line`, `rounded-2xl`, subtle shadow).

Job detail page: follows the Inventory item detail page's established
layout — back link, header block, an action row of buttons (`bg-clay`
primary for the main forward action, `border-line` secondary buttons for
copy-link/check-in/cancel, `text-clay-deep` text link for delete,
matching Inventory's "Delete this piece" convention), a clash-warning
banner when `useProjectClashes` returns any rows (amber/warning treatment
— this site doesn't have an amber token yet; reuse `clay` for the
warning text/border the same pragmatic way sub-project #2's final review
already did for status dots, rather than inventing a second accent
color), then the allocated-items list as `bg-paper` cards with each
item's photo (or the 🛋️ fallback), name, quantity, and a "Mark
{next status}" button where a next status exists.

### Error handling

- Every mutation (create, delete, status updates, check-in) shows an
  inline error on failure rather than failing silently — matching the
  pattern established on the Inventory item detail page (a
  `mutationError` string state, cleared before each attempt, rendered as
  a `text-clay-deep` paragraph near the action that triggered it).
- Delete asks for confirmation first via `window.confirm()`, with
  message text that includes the allocated-item count when the job has
  any non-dropped allocations — same conditional-warning pattern the
  Inventory item detail page's final-review fix already established for
  its own delete confirmation, applied here to jobs instead of items.
- Copying the share link uses the browser Clipboard API
  (`navigator.clipboard.writeText`) with a brief inline "Copied" 
  confirmation state, the web equivalent of the app's `Alert.alert`
  after `expo-clipboard`.
- The clash-warning banner is informational only — it never blocks any
  action (matching the app, which shows the warning but still lets every
  status transition proceed).

### Testing

No automated test runner exists in this repo (unchanged project-wide
policy). Verification is `npm run build` plus real manual/Playwright
browser testing against the live Supabase project, consistent with every
prior sub-project: create a real job, confirm it appears in the correct
status section, open its detail page, allocate an item to it from the
Inventory side and confirm the job detail page reflects the allocation
without a manual reload (this is the specific behavior the
`useAllocateItem` invalidation fix exists to make true), advance the
item's status forward, advance the job's own status forward, check in a
staged job and confirm its `out` allocations become `returned` and the
job becomes `collected`, copy the share link and confirm it opens the
already-live `/proposal/[token]` page correctly, and delete a job with
an active allocation to confirm the warning copy appears and the
allocation is gone afterward.
