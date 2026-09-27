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
