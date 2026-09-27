'use client';

import { useState } from 'react';
import { useAllocateItem, useProjects } from '@/lib/queries';

export default function AllocateItemPanel({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const { data: projects } = useProjects();
  const allocateItem = useAllocateItem();
  const [error, setError] = useState<string | null>(null);

  async function handleAllocate(projectId: string) {
    try {
      await allocateItem.mutateAsync({ itemId, projectId });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to job');
    }
  }

  const activeProjects = (projects ?? []).filter(
    (p) => p.status !== 'collected' && p.status !== 'cancelled',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-paper p-6 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Add to a job</h2>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>

        {activeProjects.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No active jobs yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {activeProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleAllocate(project.id)}
                disabled={allocateItem.isPending}
                className="w-full rounded-xl border border-line bg-paper p-3 text-left transition-colors duration-200 ease-out hover:bg-cream disabled:opacity-60"
              >
                <p className="text-sm font-semibold text-ink">{project.property_address}</p>
                <p className="text-xs text-ink-soft">{project.client_name ?? project.status}</p>
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-clay-deep">{error}</p>}
      </div>
    </div>
  );
}
