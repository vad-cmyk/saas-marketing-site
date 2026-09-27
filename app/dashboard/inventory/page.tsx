'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCategories, useItems, photoUrl } from '@/lib/queries';
import AddItemPanel from './AddItemPanel';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [addPanelOpen, setAddPanelOpen] = useState(false);

  const { data: categories } = useCategories();
  const { data: items, isLoading } = useItems({
    search: search.trim() || undefined,
    category,
  });

  return (
    <div>
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
              <Link
                key={item.id}
                href={`/dashboard/inventory/${item.id}`}
                className="overflow-hidden rounded-2xl border border-line bg-paper transition-transform duration-200 ease-out hover:-translate-y-0.5"
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
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-ink-soft">
          No pieces match yet. Try a different search or category.
        </p>
      )}

      {addPanelOpen && <AddItemPanel onClose={() => setAddPanelOpen(false)} />}
    </div>
  );
}
