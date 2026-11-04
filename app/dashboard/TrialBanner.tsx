'use client';

import { useState } from 'react';

export default function TrialBanner({ trialEndsAt }: { trialEndsAt: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date.now() is an impure read — not safe to call directly in render, and
  // useMemo's factory still runs during render so it doesn't help either.
  // A lazy useState initializer is the documented exception: it runs once,
  // outside React's purity checks for render itself. More than accurate
  // enough for a once-a-day-resolution trial countdown.
  const [now] = useState(() => Date.now());
  const daysLeft = Math.ceil(
    (new Date(trialEndsAt).getTime() - now) / (24 * 60 * 60 * 1000),
  );
  const ended = daysLeft <= 0;
  // Within the last 5 days (or already ended), switch to the site's accent
  // color to read as more urgent than the earlier, calmer days of a trial.
  const urgent = ended || daysLeft <= 5;

  async function handleAddPaymentMethod() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/billing-portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'Could not open billing');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing');
      setLoading(false);
    }
  }

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-sm ${
        urgent
          ? 'border-clay/30 bg-clay/10 text-clay-deep'
          : 'border-sage/30 bg-sage/10 text-sage-deep'
      }`}
    >
      <p className="font-medium">
        {ended
          ? 'Your free trial has ended. Add a payment method to keep your account.'
          : daysLeft === 1
            ? '1 day left in your free trial. Add a payment method to keep going after it ends.'
            : `${daysLeft} days left in your free trial. Add a payment method to keep going after it ends.`}
      </p>
      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-clay-deep">{error}</span>}
        <button
          type="button"
          onClick={handleAddPaymentMethod}
          disabled={loading}
          className="shrink-0 rounded-full bg-clay px-4 py-2 text-xs font-semibold text-paper transition-colors duration-300 ease-out hover:bg-clay-deep disabled:opacity-60"
        >
          {loading ? 'Opening…' : 'Add payment method'}
        </button>
      </div>
    </div>
  );
}
