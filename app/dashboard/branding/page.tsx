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
