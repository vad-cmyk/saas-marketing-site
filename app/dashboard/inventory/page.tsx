import Link from 'next/link';

export default function InventoryPlaceholder() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Inventory</h1>
      <p className="mt-2 text-ink-soft">Inventory management is coming soon.</p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-clay-deep">
        ← Back to dashboard
      </Link>
    </div>
  );
}
