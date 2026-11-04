'use client';

import { useState } from 'react';

export default function ManageBillingLink({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch('/api/billing-portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'Could not open billing');
      }
      window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not open billing');
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Opening…' : 'Manage billing'}
    </button>
  );
}
