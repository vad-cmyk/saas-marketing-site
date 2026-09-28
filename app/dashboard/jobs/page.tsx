'use client';

import { useMemo } from 'react';
import { useProjects, type ProjectRow } from '@/lib/queries';

const STATUS_ORDER: ProjectRow['status'][] = [
  'staged',
  'confirmed',
  'proposal',
  'collected',
  'cancelled',
];

const STATUS_LABEL: Record<ProjectRow['status'], string> = {
  proposal: 'Proposal',
  confirmed: 'Confirmed',
  staged: 'Staged',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function JobsPage() {
  const { data: projects, isLoading } = useProjects();

  const sections = useMemo(() => {
    if (!projects) return [];
    return STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_LABEL[status],
      jobs: projects.filter((p) => p.status === status),
    })).filter((section) => section.jobs.length > 0);
  }, [projects]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Jobs</h1>

      {isLoading ? (
        <p className="mt-8 text-ink-soft">Loading…</p>
      ) : sections.length > 0 ? (
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <div key={section.status}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {section.label}
              </h2>
              <div className="space-y-2.5">
                {section.jobs.map((job) => {
                  const count = job.allocations?.[0]?.count ?? 0;
                  const stage = formatDate(job.stage_date);
                  const collect = formatDate(job.collect_date);
                  return (
                    <div key={job.id} className="rounded-2xl border border-line bg-paper p-4">
                      <p className="text-sm font-semibold text-ink">{job.property_address}</p>
                      {job.client_name && (
                        <p className="mt-0.5 text-sm text-ink-soft">{job.client_name}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-ink-soft">
                          {stage ? (collect ? `${stage} → ${collect}` : stage) : 'No dates set'}
                        </span>
                        <span className="text-xs font-medium text-ink-soft">
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-ink-soft">No jobs yet.</p>
      )}
    </div>
  );
}
