'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useProject,
  useProjectAllocations,
  useProjectClashes,
  useCheckInJob,
  useDeleteProject,
  useUpdateProjectStatus,
  useUpdateAllocationStatus,
  photoUrl,
  type ProjectRow,
  type AllocationRow,
} from '@/lib/queries';

const NEXT_PROJECT_STATUS: Partial<Record<ProjectRow['status'], ProjectRow['status']>> = {
  proposal: 'confirmed',
  confirmed: 'staged',
};

const NEXT_ALLOCATION_STATUS: Partial<Record<AllocationRow['status'], AllocationRow['status']>> = {
  proposed: 'confirmed',
  confirmed: 'out',
  out: 'returned',
};

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const { data: project, isLoading, isError } = useProject(projectId);
  const { data: allocations } = useProjectAllocations(projectId);
  const updateProjectStatus = useUpdateProjectStatus();
  const updateAllocationStatus = useUpdateAllocationStatus();
  const { data: clashes } = useProjectClashes(projectId);
  const checkInJob = useCheckInJob();
  const deleteProject = useDeleteProject();
  const [copied, setCopied] = useState(false);

  const [mutationError, setMutationError] = useState<string | null>(null);

  async function handleAdvanceStatus() {
    if (!project) return;
    const next = NEXT_PROJECT_STATUS[project.status];
    if (!next) return;
    setMutationError(null);
    try {
      await updateProjectStatus.mutateAsync({ id: project.id, status: next });
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Could not update job status');
    }
  }

  async function handleCancel() {
    if (!project) return;
    if (!window.confirm('Mark this job as cancelled?')) return;
    setMutationError(null);
    try {
      await updateProjectStatus.mutateAsync({ id: project.id, status: 'cancelled' });
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Could not cancel job');
    }
  }

  async function handleAdvanceAllocation(allocationId: string, next: AllocationRow['status']) {
    setMutationError(null);
    try {
      await updateAllocationStatus.mutateAsync({ id: allocationId, status: next });
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Could not update item status');
    }
  }

  async function handleCopyShareLink() {
    if (!project) return;
    const url = `${window.location.origin}/proposal/${project.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCheckIn() {
    if (!project) return;
    const outCount = (allocations ?? []).filter((a) => a.status === 'out').length;
    const message =
      outCount > 0
        ? `Mark all ${outCount} out ${outCount === 1 ? 'item' : 'items'} as returned and close this job?`
        : 'Close this job as collected?';
    if (!window.confirm(message)) return;
    setMutationError(null);
    try {
      await checkInJob.mutateAsync(project.id);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Could not check in job');
    }
  }

  async function handleDelete() {
    if (!project) return;
    const count = (allocations ?? []).length;
    const confirmMessage =
      count > 0
        ? `"${project.property_address}" and its ${count} allocated ${count === 1 ? 'item record' : 'item records'} will be permanently removed. This can't be undone.`
        : `"${project.property_address}" will be permanently removed. This can't be undone.`;
    if (!window.confirm(confirmMessage)) return;
    setMutationError(null);
    try {
      await deleteProject.mutateAsync(project.id);
      router.push('/dashboard/jobs');
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Could not delete job');
    }
  }

  if (isLoading) {
    return <p className="text-ink-soft">Loading…</p>;
  }

  if (isError || !project) {
    return (
      <div>
        <p className="text-ink-soft">This job couldn&apos;t be found.</p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/jobs')}
          className="mt-4 text-sm font-medium text-clay-deep"
        >
          ← Back to jobs
        </button>
      </div>
    );
  }

  const nextStatus = NEXT_PROJECT_STATUS[project.status];
  const stage = formatDate(project.stage_date);
  const collect = formatDate(project.collect_date);

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => router.push('/dashboard/jobs')}
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← Back to jobs
      </button>

      <h1 className="mt-4 font-display text-2xl text-ink">{project.property_address}</h1>
      {project.client_name && <p className="mt-1 text-sm text-ink-soft">{project.client_name}</p>}
      <p className="mt-1 text-sm capitalize text-ink-soft">
        {project.status}
        {stage ? ` · ${stage}` : ''}
        {collect ? ` → ${collect}` : ''}
      </p>

      {clashes && clashes.length > 0 && (
        <div className="mt-4 rounded-2xl border border-clay bg-cream-deep p-3.5">
          <p className="mb-1 text-sm font-semibold text-clay-deep">Availability clash</p>
          {clashes.map((c) => (
            <p key={c.item_id} className="text-xs leading-relaxed text-clay-deep">
              {c.item_name}: needs {c.wanted}, {c.free} free
              {c.clashes_with ? ` — also held by ${c.clashes_with}` : ''}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopyShareLink}
          className="rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink"
        >
          {copied ? 'Copied!' : 'Send to client'}
        </button>
        {nextStatus && (
          <button
            type="button"
            onClick={handleAdvanceStatus}
            disabled={updateProjectStatus.isPending}
            className="rounded-full bg-clay px-4 py-2.5 text-sm font-medium capitalize text-paper transition-colors duration-300 ease-out hover:bg-clay-deep disabled:opacity-60"
          >
            Mark {nextStatus}
          </button>
        )}
        {project.status === 'staged' && (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={checkInJob.isPending}
            className="rounded-full bg-sage px-4 py-2.5 text-sm font-medium text-paper transition-colors duration-300 ease-out hover:bg-sage-deep disabled:opacity-60"
          >
            Check in job
          </button>
        )}
        {project.status !== 'collected' && project.status !== 'cancelled' && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium text-clay-deep hover:bg-cream"
          >
            Cancel job
          </button>
        )}
      </div>

      {mutationError && <p className="mt-2 text-sm text-clay-deep">{mutationError}</p>}

      <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Allocated items {allocations ? `(${allocations.length})` : ''}
      </h2>

      {allocations && allocations.length > 0 ? (
        <div className="space-y-2">
          {allocations.map((a) => {
            const nextAllocStatus = NEXT_ALLOCATION_STATUS[a.status];
            const primaryPhoto =
              [...a.items.item_photos].sort(
                (x, y) => Number(y.is_primary) - Number(x.is_primary),
              )[0] ?? null;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                  {primaryPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl(primaryPhoto.storage_path)}
                      alt={a.items.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🛋️
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {a.items.name}
                    {a.quantity > 1 ? ` ×${a.quantity}` : ''}
                  </p>
                  <p className="text-xs capitalize text-ink-soft">{a.status}</p>
                </div>
                {nextAllocStatus && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceAllocation(a.id, nextAllocStatus)}
                    disabled={updateAllocationStatus.isPending}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-medium capitalize text-ink-soft hover:text-ink disabled:opacity-60"
                  >
                    Mark {nextAllocStatus}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">No items allocated yet. Add pieces from Inventory.</p>
      )}

      <button
        type="button"
        onClick={handleDelete}
        className="mt-8 text-sm font-medium text-clay-deep"
      >
        Delete this job
      </button>
    </div>
  );
}
