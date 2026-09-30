# Web Dashboard Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/dashboard/branding` placeholder with a real settings page — logo upload, brand colour, contact email, contact phone — owner-editable, non-owner read-only, mirroring the mobile app's existing `settings/branding.tsx`.

**Architecture:** Two new hooks in the existing `lib/queries.ts` (`useMyOrganization`, `useUpdateOrganizationBranding`), one new helper in `lib/photos.ts` (`uploadLogo`, reusing the existing Canvas resize pipeline with a new PNG output option), and a single page component. No new routes beyond the one placeholder being replaced.

**Tech Stack:** Next.js 16.3.4 (App Router), React 19.2.8, Tailwind v4, `@supabase/supabase-js` ^2.115.0, `@tanstack/react-query` `5.104.0` (all already dependencies — no new packages this sub-project).

**Spec:** `docs/superpowers/specs/2026-09-30-web-dashboard-branding-design.md`

## Global Constraints

- No new backend: the `organizations` table's `logo_url`/`brand_color`/`contact_email`/`contact_phone` columns, the column-scoped `GRANT` restricting who can update them, and the `org-logos/{org_id}/...` storage policies all already exist and already work from the app. Nothing here should need a new migration.
- Logo uploads are PNG, not JPEG — logos are routinely uploaded with a transparent background, and JPEG would flatten that to solid white/black. Matches the app's `ImageManipulator.SaveFormat.PNG` choice exactly.
- Logo storage path is `org-logos/{org_id}/{timestamp}-{random}.png` in the `inventory` bucket — this exact prefix (`org-logos`) and folder-segment shape is load-bearing: the storage policies key on `(storage.foldername(objects.name))[1] = 'org-logos'` and `(storage.foldername(objects.name))[2]` matching the caller's owned org id. Any other path shape will be rejected by RLS, not silently misrouted.
- Only org owners (`my_role === 'owner'`) can edit; everyone else sees the same four fields read-only, with the exact copy "Only the account owner can edit business branding." — matching the app's own gate, not a web-specific rephrasing.
- `updateBranding`'s payload only includes `logo_url` when a new logo was uploaded in this session (conditionally spread, not always-present) — matches the app's exact mutation shape, not an equivalent-but-different implementation.
- Local form state seeds from the loaded organization exactly once (a `seeded` flag), never re-syncing on a background refetch — a refetch mid-edit must not silently discard unsaved changes to the colour or contact fields.
- No automated test runner exists in this repo. Verification is `npm run build` plus manual/Playwright browser testing against the real Supabase project and `npm run dev` locally.
- Real test account for manual verification: email `appreview@thestagelist.com`. **Its password is not recorded in this plan** — it was rotated partway through this session (the password written in an earlier plan in this same directory no longer works). Get the current password from the user before starting manual verification. The account's org "Sample Staging Co" has a real seeded project ("12 Willow Grove, Bristol") with a real `share_token` — useful for confirming branding changes actually reach `/proposal/{share_token}`, which already reads these same columns and requires no changes itself.
- Visual language reuses the existing site tokens from `app/globals.css` (`--cream`, `--ink`, `--ink-soft`, `--clay`, `--clay-deep`, `--line`, `--paper`) and `font-display`. No new colors, no new fonts.

---

### Task 1: Branding settings page

**Files:**
- Modify: `lib/queries.ts` (add `MyOrganization` type, `useMyOrganization()`, `OrganizationBrandingUpdate` type, `useUpdateOrganizationBranding()`)
- Modify: `lib/photos.ts` (add a `format` parameter to `resizeAndCompress`, add `uploadLogo`)
- Modify: `app/dashboard/branding/page.tsx` (replaces the sub-project #1 placeholder)

**Interfaces:**
- Consumes: `photoUrl(storagePath: string): string` (already in `lib/queries.ts`, sub-project #2), `createClient()` from `@/lib/supabase/client` (sub-project #1).
- Produces: `MyOrganization` type, `useMyOrganization()`, `OrganizationBrandingUpdate` type, `useUpdateOrganizationBranding()`, `uploadLogo(file: File, orgId: string): Promise<string>` — this is the final task in this plan, nothing downstream in this plan consumes these further.

This is a single task rather than several: the data layer (the two hooks, the logo helper) has no independently-testable surface without the page that consumes it, and the page has nothing to render without the data layer — splitting them would leave an intermediate task with no working, demonstrable deliverable, which the plan's own task-sizing rule doesn't allow.

- [ ] **Step 1: Add the organization hooks to the data layer**

In `lib/queries.ts`, append at the very end of the file, directly after `useDeleteProject`:

```ts
export interface MyOrganization {
  id: string;
  name: string;
  subscription_status: string;
  trial_ends_at: string | null;
  logo_url: string | null;
  brand_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  my_role: string;
}

export function useMyOrganization() {
  return useQuery({
    queryKey: ['my-organization'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select(
          'role, organizations(id, name, subscription_status, trial_ends_at, logo_url, brand_color, contact_email, contact_phone)',
        )
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data?.organizations) return null;
      return { ...data.organizations, my_role: data.role } as MyOrganization;
    },
  });
}

export interface OrganizationBrandingUpdate {
  logo_url?: string | null;
  brand_color?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

export function useUpdateOrganizationBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orgId,
      updates,
    }: {
      orgId: string;
      updates: OrganizationBrandingUpdate;
    }) => {
      const { error } = await supabase.from('organizations').update(updates).eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organization'] });
    },
  });
}
```

- [ ] **Step 2: Add PNG output support and the logo upload helper**

In `lib/photos.ts`, replace the `resizeAndCompress` function signature and its `canvas.toBlob` call:

```ts
async function resizeAndCompress(
  file: File,
  maxDimension: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

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
  bitmap.close();

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
```

with:

```ts
async function resizeAndCompress(
  file: File,
  maxDimension: number,
  quality: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

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
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not create image blob'));
      },
      format,
      quality,
    );
  });
}
```

(`uploadPhoto` and `getPhotoBase64ForSuggestion` both call `resizeAndCompress` without a fourth argument, so they keep getting JPEG — no change needed at either call site.)

Then add this function at the end of the file, after `getPhotoBase64ForSuggestion`:

```ts
// Matches the mobile app's logo output (400px wide, PNG, quality 0.8) —
// PNG specifically, not JPEG: logos are routinely uploaded with a
// transparent background, and JPEG would flatten that to solid white or
// black.
export async function uploadLogo(file: File, orgId: string): Promise<string> {
  const blob = await resizeAndCompress(file, 400, 0.8, 'image/png');
  const path = `org-logos/${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

  const { error } = await supabase.storage
    .from('inventory')
    .upload(path, blob, { contentType: 'image/png' });

  if (error) throw error;
  return path;
}
```

- [ ] **Step 3: Build the branding page**

Replace the contents of `app/dashboard/branding/page.tsx` (the sub-project #1 placeholder) with:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useMyOrganization, useUpdateOrganizationBranding, photoUrl } from '@/lib/queries';
import { uploadLogo } from '@/lib/photos';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export default function BrandingPage() {
  const { data: org, isLoading } = useMyOrganization();
  const updateBranding = useUpdateOrganizationBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed local edit state from the loaded org once, not on every refetch —
  // otherwise a background refetch mid-edit would clobber unsaved changes.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (org && !seeded) {
      setBrandColor(org.brand_color ?? '');
      setContactEmail(org.contact_email ?? '');
      setContactPhone(org.contact_phone ?? '');
      setSeeded(true);
    }
  }, [org, seeded]);

  const currentLogoUrl = logoPath ? photoUrl(logoPath) : (org?.logo_url ?? null);

  async function handlePickLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !org) return;
    setUploadingLogo(true);
    setLogoError(null);
    try {
      const path = await uploadLogo(file, org.id);
      setLogoPath(path);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Could not upload logo');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave() {
    if (!org) return;
    setSaveError(null);
    setSaved(false);
    if (brandColor && !HEX_COLOR_RE.test(brandColor)) {
      setSaveError('Enter a hex colour like #9C4423, or leave it blank.');
      return;
    }
    try {
      await updateBranding.mutateAsync({
        orgId: org.id,
        updates: {
          ...(logoPath ? { logo_url: photoUrl(logoPath) } : {}),
          brand_color: brandColor || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
        },
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes');
    }
  }

  if (isLoading || !seeded) {
    return <p className="text-ink-soft">Loading…</p>;
  }

  if (!org) {
    return <p className="text-ink-soft">We couldn&apos;t load your organization.</p>;
  }

  if (org.my_role !== 'owner') {
    return (
      <div>
        <h1 className="font-display text-3xl text-ink">Branding</h1>
        <p className="mt-2 text-ink-soft">Only the account owner can edit business branding.</p>
        <div className="mt-6 max-w-md space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Logo</p>
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo_url}
                alt=""
                className="mt-2 h-24 w-24 rounded-2xl border border-line object-contain"
              />
            ) : (
              <p className="mt-2 text-sm text-ink-soft">No logo set.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Brand colour
            </p>
            <p className="mt-1 text-sm text-ink">{org.brand_color ?? 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Contact email
            </p>
            <p className="mt-1 text-sm text-ink">{org.contact_email ?? 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Contact phone
            </p>
            <p className="mt-1 text-sm text-ink">{org.contact_phone ?? 'Not set'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl text-ink">Branding</h1>
      <p className="mt-2 text-ink-soft">
        This appears on the staging proposals you send to clients.
      </p>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Logo</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingLogo}
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-paper"
        >
          {uploadingLogo ? (
            <span className="text-xs text-ink-soft">Uploading…</span>
          ) : currentLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentLogoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-ink-soft">Add logo</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePickLogo}
          className="hidden"
        />
        {logoError && <p className="mt-2 text-sm text-clay-deep">{logoError}</p>}
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Brand colour
          </label>
          <div className="flex items-center gap-3">
            <span
              className="h-8 w-8 shrink-0 rounded-full border border-line"
              style={{ backgroundColor: HEX_COLOR_RE.test(brandColor) ? brandColor : '#E5D9CC' }}
            />
            <input
              type="text"
              placeholder="#9C4423"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="flex-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Contact email
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Contact phone
          </label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={updateBranding.isPending || uploadingLogo}
        className="mt-6 w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper transition-colors duration-300 ease-out hover:bg-clay-deep disabled:opacity-60"
      >
        {updateBranding.isPending ? 'Saving…' : 'Save'}
      </button>

      {saveError && <p className="mt-3 text-sm text-clay-deep">{saveError}</p>}
      {saved && !saveError && <p className="mt-3 text-sm text-ink-soft">Saved.</p>}
    </div>
  );
}
```

- [ ] **Step 4: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in with the demo account (ask the user for its current password — the one in this repo's older plans has been rotated and no longer works). Navigate to `http://localhost:3000/dashboard/branding`.

Confirm the form is editable (the demo account is the org's owner). Pick a real logo image via the file picker, confirm it uploads and the preview updates. Set a brand colour (e.g. `#9C4423`), a contact email, and a contact phone. Click Save, confirm "Saved." appears. Reload the page and confirm all four values persisted (including the logo).

Confirm validation: type an invalid value into the brand colour field (e.g. `red`) and click Save — confirm it's rejected with the inline error and nothing is submitted.

Then — the reason this field exists — find the demo org's seeded job with a `share_token` (query `projects` for "12 Willow Grove, Bristol" if you need to look it up) and open `http://localhost:3000/proposal/<share_token>` in the browser. Confirm the logo, brand colour, and contact info you just set actually render on that page's header/footer.

- [ ] **Step 5: Commit**

```bash
git add lib/queries.ts lib/photos.ts app/dashboard/branding/page.tsx
git commit -m "Add business branding settings page"
```

---

## Self-Review Notes

**Spec coverage:** The single route (`/dashboard/branding`) → Task 1. File structure (`lib/queries.ts`, `lib/photos.ts`, `app/dashboard/branding/page.tsx`) → all three modified in Task 1, nothing listed in the spec left untouched. Data layer (`useMyOrganization`, `useUpdateOrganizationBranding`, `uploadLogo`) → all three implemented verbatim to the spec's description, including the PNG-not-JPEG requirement and the load-bearing `org-logos/{org_id}/...` path shape. Visual design (logo picker, colour swatch, read-only non-owner view) → all present. Error handling (hex validation, save error, logo upload error, seed-once state) → all present, matching the app's exact behavior including the conditional `logo_url` spread. Testing → Step 4 covers the demo-account edit/persist flow and, specifically, the `/proposal/[token]` downstream verification the spec calls out as the real point of this feature.

**Placeholder scan:** No TBD/TODO markers; every step has complete, real code.

**Type consistency:** `MyOrganization` and `OrganizationBrandingUpdate` are each defined once, in Step 1, and used identically (by name) in Step 3's page component — no redefinition, no name drift. `uploadLogo`'s signature (`file: File, orgId: string): Promise<string>`) matches exactly how it's called in Step 3 (`uploadLogo(file, org.id)`). `photoUrl` (sub-project #2) and `resizeAndCompress`'s existing two call sites are referenced correctly and left otherwise unchanged.

**Forward-reference check:** N/A beyond the single task — there is no Task 2 to forward-reference, and Task 1 only consumes interfaces that already exist on `main` before this plan starts (`photoUrl`, `createClient`).
