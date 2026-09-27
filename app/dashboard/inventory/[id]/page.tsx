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
