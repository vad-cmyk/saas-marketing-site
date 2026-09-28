'use client';

import { useState } from 'react';
import { useCreateProject } from '@/lib/queries';

function toIsoDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export default function NewJobPanel({ onClose }: { onClose: () => void }) {
  const [address, setAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [stageDate, setStageDate] = useState('');
  const [collectDate, setCollectDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useCreateProject();

  async function handleCreate() {
    if (!address.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createProject.mutateAsync({
        property_address: address.trim(),
        client_name: clientName || null,
        client_email: clientEmail || null,
        stage_date: toIsoDate(stageDate),
        collect_date: toIsoDate(collectDate),
        notes: notes || null,
        status: 'confirmed',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create job');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-paper p-6 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">New job</h2>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <input
            type="text"
            placeholder="Property address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
          <input
            type="text"
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
          <input
            type="email"
            placeholder="Client email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
          <div className="flex gap-3">
            <input
              type="date"
              placeholder="Stage date"
              value={stageDate}
              onChange={(e) => setStageDate(e.target.value)}
              className="w-1/2 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
            <input
              type="date"
              placeholder="Collect date"
              value={collectDate}
              onChange={(e) => setCollectDate(e.target.value)}
              className="w-1/2 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
          />
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!address.trim() || saving}
          className="mt-5 w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper transition-[transform,background-color,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep active:translate-y-0 disabled:pointer-events-none disabled:opacity-40"
        >
          {saving ? 'Creating…' : 'Create job'}
        </button>

        {error && <p className="mt-3 text-center text-sm text-clay-deep">{error}</p>}
      </div>
    </div>
  );
}
