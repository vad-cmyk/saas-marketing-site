# Web Dashboard: Branding — Design

## Context

Sub-project #1 (auth + dashboard shell) shipped `/dashboard` with three
placeholder pages: Inventory, Jobs, Branding. Sub-projects #2 and #3
replaced Inventory and Jobs with the real thing. This is sub-project #4:
replacing the Branding placeholder.

The mobile app (`staged-ready`) already has this feature:
`app/settings/branding.tsx`, reached from the Settings tab's "Business
branding" row (owner-only). It lets an org's owner set a logo, a brand
hex colour, a contact email, and a contact phone number.

This data isn't cosmetic-only — it already drives the client-facing
`/proposal/[token]` page, live on this same site today: that page reads
`organization.logo_url`, `.brand_color`, `.contact_email`, and
`.contact_phone` to render a branded header and footer for whoever the
stager shares the link with (`app/proposal/[token]/page.tsx:45-47,
55-65, 180-218`, using `lib/proposal.ts`). Today there is no way to set
any of those four fields from the browser at all — only from the app.
This sub-project closes that gap.

## Goals

- A signed-in **owner** can view and edit their organization's logo,
  brand colour, contact email, and contact phone from
  `/dashboard/branding`, matching the app's `settings/branding.tsx`
  field-for-field.
- A signed-in **non-owner** (any other membership role) can view the same
  four fields read-only, with the same explanatory copy the app uses
  ("Only the account owner can edit business branding.") — matching the
  app's own role gate exactly, not a web-specific interpretation of it.
- Saved changes are immediately reflected on `/proposal/[token]` for that
  org's jobs — this is the entire point of the fields existing, and
  nothing about that existing page needs to change for it to work, since
  it already reads these same columns.
- Logo upload produces a **PNG**, not the JPEG the Inventory/Jobs photo
  pipelines use — logos routinely have transparent backgrounds, and the
  app deliberately outputs PNG for exactly that reason
  (`staged-ready/lib/photos.ts:36-54`, `ImageManipulator.SaveFormat.PNG`).
  Reusing the existing JPEG-only web photo pipeline as-is would flatten
  a transparent logo onto a white or black background — a real quality
  regression the spec must not introduce by accident.

## Non-Goals

- No team-member management (inviting/removing members, changing roles).
  The app doesn't expose this from the branding screen either — it isn't
  in scope for this sub-project.
- No subscription/billing settings, no sign-out control — the dashboard
  shell already has sign-out (`app/dashboard/layout.tsx`), and billing is
  handled entirely outside the app per this project's existing pattern.
- No new backend: no new columns, tables, or storage buckets. The
  `organizations` table's four branding columns, the `inventory` storage
  bucket's `org-logos/{org_id}/...` path, and every RLS policy involved
  already exist and already work from the app
  (`supabase/migrations/0012_*.sql` adds the columns,
  `0013_organization_branding_write_access.sql` adds the owner-scoped
  column-level `GRANT` and the four `org-logos`-prefixed storage
  policies).
- No change to `/proposal/[token]` itself — it already reads these
  columns correctly; this sub-project only adds a way to set them.

## Approach

**Extend `lib/queries.ts` with `useMyOrganization()` and
`useUpdateOrganizationBranding()`, mirroring the app's `lib/queries.ts`
(lines 74-104) exactly** — same query (`memberships` joined to
`organizations`, `.limit(1).maybeSingle()`), same returned shape
(spreading the organization plus a `my_role` field from the membership
row), same mutation (a column-scoped `update` on `organizations`, which
the database's own `GRANT` already restricts to the four branding
columns regardless of what the client sends — defense in depth already
proven by the app, not something this sub-project adds).

This is a distinct hook from the website's existing
`lib/get-my-organization.ts` (`getMyOrganization()`), which is a
server-only helper the dashboard layout already uses for its
subscription-status gate. That helper stays as-is — it's a React Server
Component data fetch with no re-fetch/invalidation story, and the
layout's use of it is unrelated to this page's own interactive editing.
The new client hook exists because this page needs live cache
invalidation after a save, same reasoning as every other sub-project's
own client-side hooks.

**Add `uploadLogo` to `lib/photos.ts`, alongside the existing
`resizeAndCompress` helper — extended to accept an output format rather
than duplicating the resize/canvas logic.** `resizeAndCompress` today
hardcodes `'image/jpeg'` in its `canvas.toBlob()` call because its only
two callers (`uploadPhoto`, `getPhotoBase64ForSuggestion`) both want
JPEG. `uploadLogo` needs PNG for the transparency reason above, so
`resizeAndCompress` gains a `format` parameter (`'image/jpeg' |
'image/png'`, defaulting to `'image/jpeg'` so the two existing call
sites don't need to change) rather than becoming a second, near-duplicate
function.

## Design

### Routes

| Route | Purpose |
|---|---|
| `/dashboard/branding` | View/edit (owner) or view-only (non-owner) organization branding |

No sub-routes — this is a single settings page, not a list+detail pair
like Inventory or Jobs.

### File structure

- `app/dashboard/branding/page.tsx` (replaces the placeholder) — the
  branding form: logo picker/preview, brand colour hex input with a
  live swatch, contact email, contact phone, Save button; read-only
  rendering of the same four fields when `my_role !== 'owner'`.
- `lib/queries.ts` (modified) — add `MyOrganization` type,
  `useMyOrganization()`, `OrganizationBrandingUpdate` type,
  `useUpdateOrganizationBranding()`.
- `lib/photos.ts` (modified) — `resizeAndCompress` gains a `format`
  parameter; add `uploadLogo(file: File, orgId: string): Promise<string>`.

### Data layer

```
useMyOrganization(): { data: MyOrganization | null, isLoading, isError }
useUpdateOrganizationBranding(): mutation({ orgId, updates: OrganizationBrandingUpdate })
```

`MyOrganization` matches the app's shape: `id`, `name`,
`subscription_status`, `trial_ends_at`, `logo_url`, `brand_color`,
`contact_email`, `contact_phone`, `my_role`. `OrganizationBrandingUpdate`
carries only the four branding fields — never `name` or
`subscription_status`, matching what the database `GRANT` would reject
from a non-owner-authored update anyway, and matching what the app's own
mutation sends.

**Logo upload path and RLS are load-bearing, already proven by the app —
do not deviate from them:** `org-logos/{org_id}/{timestamp}.png` in the
`inventory` bucket. The storage policies key specifically on
`(storage.foldername(objects.name))[1] = 'org-logos'` and
`(storage.foldername(objects.name))[2]` matching the caller's owned org
id via an owner-role membership check — a different path shape and a
different ownership check than item photos' `{item_id}/...` policies,
so this is not simply "reuse `uploadPhoto`'s path convention."

**Save behavior matches the app exactly, not a web-specific redesign:**
picking a new logo uploads it immediately (not deferred to Save time),
showing an uploading state; if that upload fails, the user sees an error
but the rest of the form stays editable and Save still works with
whatever logo the org already had. `handleSave` only includes `logo_url`
in the update payload when a new logo was actually picked and uploaded
in this session — an unrelated edit (e.g. just changing the contact
phone) must not accidentally clear or touch the existing logo.

**Local edit state seeds from the loaded organization once, not on every
refetch** — matching the app's own comment on this exact point
(`staged-ready/app/settings/branding.tsx:32-34`): a background refetch
mid-edit must not clobber in-progress unsaved changes to the colour or
contact fields.

### Visual design

Single-column form on the existing dashboard page conventions
(`font-display` heading, `bg-paper` card, `border-line` edges — same
tokens as every prior sub-project). Logo picker: a rounded square
preview (the current logo, or a dashed-border placeholder with "Add
logo" when none is set) that opens the file picker on click, matching
the app's circular/rounded preview-and-tap pattern translated to a
click. Brand colour: a small swatch circle next to the hex text input,
filled with the colour when it's valid and a neutral placeholder colour
when it isn't — same validation feedback the app gives. Contact email
and phone as plain text inputs, matching the styling already established
by every other form in this project (`AddItemPanel`, `NewJobPanel`).
Save button follows the same `bg-clay` primary-button convention as
every other save action in the dashboard.

Non-owner view: the same four fields rendered as plain read-only text
(no inputs, no Save button), with the app's exact explanatory line
("Only the account owner can edit business branding.") above them.

### Error handling

- Hex colour validation before save: must match `^#[0-9a-fA-F]{6}$` or be
  empty — same regex and same rejection the app uses
  (`staged-ready/app/settings/branding.tsx:20,71-74`). An invalid value
  shows an inline error and does not submit.
- A failed save shows an inline error (the same `mutationError` string-state
  pattern used throughout this project) without losing the user's
  unsaved edits.
- A failed logo upload shows an inline error but does not block the rest
  of the form, matching the app's behavior described above.

### Testing

No automated test runner exists in this repo (unchanged project-wide
policy). Verification is `npm run build` plus real manual/Playwright
browser testing against the live Supabase project: sign in as the demo
account (the org's sole current member, with role `owner`), upload a
real logo image, edit the brand colour and contact fields, save, and
confirm the changes persist on reload. Then — this is the change's whole
point — open that org's existing `/proposal/{share_token}` page (the
seeded "12 Willow Grove, Bristol" job already has one) and confirm the
new logo, colour, and contact info actually render there, proving the
field actually reaches the page it was built for.

The non-owner read-only gate is verified by code review against the
app's identical conditional (`org?.my_role !== 'owner'`), not by a live
second-account test — the demo org's only membership is the owner
account itself, and creating a second real membership solely to exercise
this one conditional is out of proportion to what it's checking.
