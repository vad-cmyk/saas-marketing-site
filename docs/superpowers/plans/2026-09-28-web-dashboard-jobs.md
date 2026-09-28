# Web Dashboard Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/dashboard/jobs` placeholder with a real, working Jobs section — job list grouped by status, create a job, job detail with per-item and per-job status transitions, an availability-clash warning, check-in, cancel, delete, and a copy-share-link action — mirroring the mobile app's existing Jobs feature against the same Supabase schema, and fixing two invalidation/query gaps this leaves in sub-project #2's already-shipped Inventory code.

**Architecture:** Extends the existing `lib/queries.ts` React Query data layer (from sub-project #2) with eight new Jobs hooks mirroring the app's `lib/queries.ts` 1:1, plus two small required edits to hooks sub-project #2 already shipped. New pages are client components, consumed by the existing server-rendered dashboard shell from sub-project #1.

**Tech Stack:** Next.js 16.3.4 (App Router), React 19.2.8, Tailwind v4, `@supabase/supabase-js` ^2.115.0, `@tanstack/react-query` `5.104.0` (all already dependencies — no new packages this sub-project).

**Spec:** `docs/superpowers/specs/2026-09-28-web-dashboard-jobs-design.md`

## Global Constraints

- No new backend: no new tables, columns, RLS policies, or RPC functions. Everything reuses what the mobile app already depends on in the same Supabase project (ref `yloqsehowpwxuuuwxdaw`), including the existing `project_clashes` Postgres function.
- Two required edits to sub-project #2's already-shipped `lib/queries.ts` are part of this plan, not optional cleanup: `useProjects()`'s query must change from `.select('*')` to `.select('*, allocations(count)')` (Task 1 — the job list needs the per-job item count); `useAllocateItem()`'s `onSuccess` must add invalidations for `['project-allocations', data.project_id]` and `['project-clashes', data.project_id]` alongside its existing two (Task 3 — without this, allocating an item to a job from the Inventory side won't make it appear on that job's detail page without a manual reload).
- No item picker on the job detail page. Allocating an item to a job only happens from the item's own detail page (`AllocateItemPanel`, shipped in sub-project #2) — this plan never adds a second way to create an allocation.
- No editing a job's own fields (address, client name/email, dates, notes) after creation. Only status can change post-creation, matching the app.
- Delete lives on the job detail page as a text link (`Delete this job`), not on the list — the app's long-press-to-delete has no web equivalent, and per the accepted design, moving it to the detail page matches how Inventory's item detail page already does delete.
- No automated test runner exists in this repo. Verification is `npm run build` plus manual/Playwright browser testing against the real Supabase project and `npm run dev` locally.
- Real test account for manual verification: email `appreview@thestagelist.com`. **Its password is not recorded in this plan** — the previous plan in this repo had it in plaintext, which had to be redacted and the account needs rotating; get the current password from the user or wherever it's now stored before starting manual verification. The account's org "Sample Staging Co" has a real seeded project ("12 Willow Grove, Bristol", id `ba4b0609-920a-463b-87a4-b5a2822be139`, status `confirmed`) and at least one item already allocated to it from sub-project #2's own verification work — useful real seed data for testing status transitions without creating everything from scratch.
- Visual language reuses the existing site tokens from `app/globals.css` (`--cream`, `--cream-deep`, `--ink`, `--ink-soft`, `--clay`, `--clay-deep`, `--sage`, `--sage-deep`, `--line`, `--paper`) and `font-display`. No new colors, no new fonts — this site has no dedicated "warning" color, so the clash banner reuses `clay`, the same pragmatic choice sub-project #2 already made for its status dots.
- `useUpdateAllocationStatus` must set `checked_out_at` when moving an allocation to `out` and `returned_at` when moving it to `returned` — these two timestamps are what `project_clashes` and the item detail page's job-history list depend on being accurate; skipping them silently breaks both features without throwing any error.

---

### Task 1: Data layer for the job list + the job list page

**Files:**
- Modify: `lib/queries.ts:336-348` (update `useProjects()`)
- Modify: `app/dashboard/jobs/page.tsx` (replaces the sub-project #1 placeholder)

**Interfaces:**
- Consumes: `ProjectRow` (sub-project #2, unchanged).
- Produces: updated `useProjects()` return type `(ProjectRow & { allocations: { count: number }[] })[]` — consumed by this task's own list page. `AllocateItemPanel` (sub-project #2) also calls `useProjects()` but only reads `property_address`/`client_name`/`status`, so the added `allocations` field doesn't require any change there.

- [ ] **Step 1: Update `useProjects` to include each job's item count**

In `lib/queries.ts`, replace the existing `useProjects` function (lines 336-348):

```ts
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectRow[];
    },
  });
}
```

with:

```ts
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, allocations(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (ProjectRow & { allocations: { count: number }[] })[];
    },
  });
}
```

- [ ] **Step 2: Build the job list page**

Replace the contents of `app/dashboard/jobs/page.tsx` (the sub-project #1 placeholder) with:

```tsx
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
```

- [ ] **Step 3: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in with the demo account, open `http://localhost:3000/dashboard/jobs`. Confirm "12 Willow Grove, Bristol" appears under a "Confirmed" section header with its correct allocated-item count (matching however many items sub-project #2's verification work left allocated to it).

- [ ] **Step 4: Commit**

```bash
git add lib/queries.ts app/dashboard/jobs/page.tsx
git commit -m "Add Jobs list page with per-status grouping"
```

---

### Task 2: Create a job

**Files:**
- Modify: `lib/queries.ts` (add `ProjectInsert` type and `useCreateProject`)
- Create: `app/dashboard/jobs/NewJobPanel.tsx`
- Modify: `app/dashboard/jobs/page.tsx` (add the "New job" button and panel)

**Interfaces:**
- Consumes: `ProjectRow` (sub-project #2), `useProjects` (Task 1).
- Produces: `ProjectInsert` type, `useCreateProject()` — used only by this task's `NewJobPanel`; no later task depends on them directly.

- [ ] **Step 1: Add the create-job type and hook**

In `lib/queries.ts`, insert this directly after the `useProjects` function (i.e. immediately before `useAllocateItem`):

```ts
export interface ProjectInsert {
  property_address: string;
  client_name?: string | null;
  client_email?: string | null;
  status?: ProjectRow['status'];
  stage_date?: string | null;
  collect_date?: string | null;
  notes?: string | null;
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: ProjectInsert) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

- [ ] **Step 2: Build the new-job panel**

Create `app/dashboard/jobs/NewJobPanel.tsx`:

```tsx
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
              type="text"
              placeholder="Stage date (YYYY-MM-DD)"
              value={stageDate}
              onChange={(e) => setStageDate(e.target.value)}
              className="w-1/2 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink"
            />
            <input
              type="text"
              placeholder="Collect date (YYYY-MM-DD)"
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
```

- [ ] **Step 3: Wire the panel into the job list page**

Modify `app/dashboard/jobs/page.tsx`:

Add to the imports:

```tsx
import { useMemo, useState } from 'react';
import { useProjects, type ProjectRow } from '@/lib/queries';
import NewJobPanel from './NewJobPanel';
```

(This replaces the existing `import { useMemo } from 'react';` and `import { useProjects, type ProjectRow } from '@/lib/queries';` lines with the version above, adding `useState` and the new `NewJobPanel` import.)

Add state inside the component, right after `const { data: projects, isLoading } = useProjects();`:

```tsx
  const [newJobOpen, setNewJobOpen] = useState(false);
```

Replace the existing header line:

```tsx
      <h1 className="font-display text-3xl text-ink">Jobs</h1>
```

with:

```tsx
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Jobs</h1>
        <button
          type="button"
          onClick={() => setNewJobOpen(true)}
          className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper transition-colors duration-300 ease-out hover:bg-clay-deep"
        >
          + New job
        </button>
      </div>
```

Add the panel render at the very end of the component's returned JSX, just before the final closing `</div>`:

```tsx
      {newJobOpen && <NewJobPanel onClose={() => setNewJobOpen(false)} />}
```

- [ ] **Step 4: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in with the demo account, click "+ New job", fill in a property address (e.g. "42 Testing Lane, Bristol") and a client name, click "Create job". Confirm the panel closes and the new job appears under "Confirmed" without a manual page reload (confirms `useCreateProject`'s invalidation is working).

- [ ] **Step 5: Commit**

```bash
git add lib/queries.ts app/dashboard/jobs/NewJobPanel.tsx app/dashboard/jobs/page.tsx
git commit -m "Add creating a job"
```

---

### Task 3: Job detail page — view, status transitions, cancel

**Files:**
- Modify: `lib/queries.ts` (add `useProject`, `useProjectAllocations`, `useUpdateProjectStatus`, `useUpdateAllocationStatus`; update `useAllocateItem`'s `onSuccess`)
- Create: `app/dashboard/jobs/[id]/page.tsx`
- Modify: `app/dashboard/jobs/page.tsx` (wrap each job card in a `Link` to its detail page)

**Interfaces:**
- Consumes: `ProjectRow`, `AllocationRow`, `ItemRow`, `PhotoRow`, `photoUrl` (all sub-project #2, unchanged), `useProjects` (Task 1).
- Produces: `useProject(projectId)`, `useProjectAllocations(projectId)`, `useUpdateProjectStatus()`, `useUpdateAllocationStatus()` — consumed by this task's own detail page and, for `useProjectAllocations`'s query key, by Task 4's added invalidations.

- [ ] **Step 1: Add the job-detail read/mutation hooks**

In `lib/queries.ts`, insert directly after `useProjects` and before `useAllocateItem` (i.e. after the `ProjectInsert`/`useCreateProject` block added in Task 2):

```ts
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId as string)
        .single();
      if (error) throw error;
      return data as ProjectRow;
    },
  });
}

export function useProjectAllocations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-allocations', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allocations')
        .select('*, items(*, item_photos(storage_path, is_primary, sort_order))')
        .eq('project_id', projectId as string)
        .neq('status', 'dropped')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as (AllocationRow & {
        items: ItemRow & { item_photos: PhotoRow[] };
      })[];
    },
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProjectRow['status'] }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
    },
  });
}

export function useUpdateAllocationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AllocationRow['status'] }) => {
      const patch: {
        status: AllocationRow['status'];
        checked_out_at?: string;
        returned_at?: string;
      } = { status };
      if (status === 'out') patch.checked_out_at = new Date().toISOString();
      if (status === 'returned') patch.returned_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('allocations')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AllocationRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-allocations', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-clashes', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item-history', data.item_id] });
    },
  });
}
```

- [ ] **Step 2: Fix `useAllocateItem`'s missing invalidations**

The `useAllocateItem` hook (currently just above `useProjects` — check its actual position after Task 2's edits) was shipped in sub-project #2 without two invalidations the app's own version has, because the query keys they reference didn't exist anywhere in the web app yet. They exist now (`project-allocations` from Step 1 above; `project-clashes` will exist once Task 4 adds `useProjectClashes` — invalidating it now is harmless, since invalidating a query key nobody is subscribed to yet is a no-op).

Replace the existing `useAllocateItem`'s `onSuccess`:

```ts
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item-history', data.item_id] });
    },
```

with:

```ts
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item-history', data.item_id] });
      queryClient.invalidateQueries({ queryKey: ['project-allocations', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-clashes', data.project_id] });
    },
```

(The rest of `useAllocateItem` — its `mutationFn` — is unchanged.)

- [ ] **Step 3: Build the job detail page**

Create `app/dashboard/jobs/[id]/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useProject,
  useProjectAllocations,
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

      <div className="mt-4 flex flex-wrap gap-2">
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
    </div>
  );
}
```

- [ ] **Step 4: Link job cards to their detail page**

Modify `app/dashboard/jobs/page.tsx`:

Add to the imports:

```tsx
import Link from 'next/link';
```

Replace the job-card wrapper:

```tsx
                    <div key={job.id} className="rounded-2xl border border-line bg-paper p-4">
```

with:

```tsx
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="block rounded-2xl border border-line bg-paper p-4 transition-transform duration-200 ease-out hover:-translate-y-0.5"
                    >
```

and its matching closing tag with `</Link>`. That card's JSX has two consecutive `</div>` lines right before the `);` that ends the `.map()` callback — one closes the inner `mt-2 flex items-center justify-between` row, the other (the second/outer one) closes the card itself. Change only that second, outer `</div>` — the one that matches the `<div key={job.id} ...>` opening tag above — to `</Link>`.

- [ ] **Step 5: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in with the demo account, click into "12 Willow Grove, Bristol" from the list. Confirm its allocated item(s) render with photo, name, and status. Click a "Mark {status}" button on an allocated item and confirm its status advances and the button updates to the next step (or disappears once `returned`). Click "Mark {status}" on the job itself and confirm the job's own status advances.

Then verify the cross-cutting fix from Step 2: open an Inventory item's detail page in another tab, allocate it to this same job via "Add to a job", then switch back to the job detail tab (or re-navigate to it) and confirm the newly allocated item now appears — this is the specific behavior Step 2's invalidation fix exists to make true.

- [ ] **Step 6: Commit**

```bash
git add lib/queries.ts "app/dashboard/jobs/[id]/page.tsx" app/dashboard/jobs/page.tsx
git commit -m "Add job detail page with status transitions"
```

---

### Task 4: Availability clashes, check-in, delete, share link

**Files:**
- Modify: `lib/queries.ts` (add `useProjectClashes`, `useCheckInJob`, `useDeleteProject`)
- Modify: `app/dashboard/jobs/[id]/page.tsx` (add the clash banner, check-in button, delete link, and copy-share-link button)

**Interfaces:**
- Consumes: `ProjectRow`, `AllocationRow` (sub-project #2, unchanged), `useProject`/`useProjectAllocations` (Task 3).
- Produces: `useProjectClashes(projectId)`, `useCheckInJob()`, `useDeleteProject()` — final task in this plan, nothing downstream consumes these further.

- [ ] **Step 1: Add the remaining Jobs hooks**

In `lib/queries.ts`, insert at the very end of the file, directly after `useAllocateItem` (by this point in the plan, the last function in the file — `useDeleteItem` sits earlier, before `useProjects`, not after it):

```ts
export function useProjectClashes(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-clashes', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('project_clashes', {
        p_project: projectId as string,
      });
      if (error) throw error;
      return data as {
        item_id: string;
        item_name: string;
        wanted: number;
        free: number;
        clashes_with: string | null;
      }[];
    },
  });
}

export function useCheckInJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const returnedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from('allocations')
        .update({ status: 'returned', returned_at: returnedAt })
        .eq('project_id', projectId)
        .eq('status', 'out')
        .select();
      if (error) throw error;

      const { error: statusError } = await supabase
        .from('projects')
        .update({ status: 'collected' })
        .eq('id', projectId);
      if (statusError) throw statusError;

      return data as AllocationRow[];
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-allocations', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.removeQueries({ queryKey: ['project', projectId] });
    },
  });
}
```

(`useDeleteProject`'s `removeQueries` on the now-deleted project's own cache entry mirrors the same fix already applied to `useDeleteItem` during sub-project #2's final review — applying that lesson from the start here rather than waiting for a review to catch it again.)

- [ ] **Step 2: Add the clash banner, check-in, delete, and share-link actions**

Modify `app/dashboard/jobs/[id]/page.tsx`:

Replace the imports:

```tsx
import {
  useProject,
  useProjectAllocations,
  useUpdateProjectStatus,
  useUpdateAllocationStatus,
  photoUrl,
  type ProjectRow,
  type AllocationRow,
} from '@/lib/queries';
```

with:

```tsx
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
```

Add these hooks and state inside the component, directly after the existing `const updateAllocationStatus = useUpdateAllocationStatus();` line:

```tsx
  const { data: clashes } = useProjectClashes(projectId);
  const checkInJob = useCheckInJob();
  const deleteProject = useDeleteProject();
  const [copied, setCopied] = useState(false);
```

Add these handlers directly after the existing `handleAdvanceAllocation` function:

```tsx
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
```

Add the clash banner directly after the status/dates paragraph (`{collect ? \` → ${collect}\` : ''}</p>`) and before the action-buttons `<div>`:

```tsx
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
```

Replace the existing action-buttons block:

```tsx
      <div className="mt-4 flex flex-wrap gap-2">
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
```

with:

```tsx
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
```

Add the delete link at the very end of the component's returned JSX, directly after the allocated-items section's closing tag and before the final closing `</div>`:

```tsx
      <button
        type="button"
        onClick={handleDelete}
        className="mt-8 text-sm font-medium text-clay-deep"
      >
        Delete this job
      </button>
```

- [ ] **Step 3: Verify against the real Supabase project**

Run: `npm run build` — must succeed with no type errors.

Run: `npm run dev`, sign in with the demo account.

**Share link:** on "12 Willow Grove, Bristol"'s detail page, click "Send to client", confirm the button reads "Copied!" briefly, then paste the clipboard contents into a new browser tab and confirm it loads `/proposal/<share_token>` correctly (the existing, already-live proposal page).

**Check-in:** find or create a job in `staged` status with at least one allocation in `out` status (advance an allocation to `out` first if none exists), click "Check in job", confirm the browser dialog mentions the out-item count, confirm on accepting that the allocation becomes `returned` and the job's own status becomes `collected`.

**Clash warning:** create two new jobs with overlapping `stage_date`/`collect_date` ranges, allocate the same inventory item to both with its status set to `confirmed` or `out` on at least one (advance a freshly created `proposed` allocation forward), and confirm the clash banner appears on one of the jobs listing that item's `wanted`/`free` counts and which other job it clashes with.

**Delete:** open a job with at least one allocated item, click "Delete this job", confirm the dialog text mentions the allocated-item count, confirm on accepting that the job is removed and you're returned to the job list, and confirm (via the Supabase dashboard or by re-visiting the job's now-invalid URL) that the job and its allocations are actually gone.

- [ ] **Step 4: Commit**

```bash
git add lib/queries.ts "app/dashboard/jobs/[id]/page.tsx"
git commit -m "Add availability clashes, check-in, delete, and share link to job detail"
```

---

## Self-Review Notes

**Spec coverage:** Routes (`/dashboard/jobs`, `/dashboard/jobs/[id]`) → Tasks 1, 3. File structure (`page.tsx`, `NewJobPanel.tsx`, `[id]/page.tsx`, the `lib/queries.ts` additions) → Tasks 1-4, each traced to the task that first needs it. The two required fixes to sub-project #2's shipped code (`useProjects`'s select, `useAllocateItem`'s invalidations) → Tasks 1 and 3 respectively, both called out in Global Constraints as non-optional. All eight new hooks from the Data Layer section → Tasks 1-4. Visual design (list grouping, card conventions, detail page layout, clash banner reusing `clay`) → Tasks 1-4 throughout. Error handling (inline `mutationError`, confirm-before-delete with allocation-count warning, non-blocking clash banner) → Tasks 3-4. Testing → each task's own real-browser verification against the real Supabase project and the seeded demo data, including the specific cross-page invalidation check Task 3 calls for.

**Placeholder scan:** No TBD/TODO markers; every step has complete, real code.

**Type consistency:** `ProjectRow`, `AllocationRow` (both sub-project #2, unchanged) are referenced identically by name throughout. `ProjectInsert` (Task 2), and the return types of `useProject`/`useProjectAllocations`/`useProjectClashes` (Task 3/4) are each defined exactly once, in the task that first needs them, and referenced identically by every later task that uses them — no redefinitions, no name drift. Hook names (`useProjects`, `useCreateProject`, `useProject`, `useProjectAllocations`, `useUpdateProjectStatus`, `useUpdateAllocationStatus`, `useProjectClashes`, `useCheckInJob`, `useDeleteProject`) match the app's own `lib/queries.ts` naming throughout, as the spec requires for app/web parity. `NEXT_PROJECT_STATUS`/`NEXT_ALLOCATION_STATUS` are defined once in Task 3's `[id]/page.tsx` and not redefined in Task 4's modification of that same file.

**Forward-reference check:** Task 1's list page has no "New job" button and no link to a detail route — both are added in later tasks, matching sub-project #2's own precedent (Task 1's Inventory list page also shipped without its "Add item" button or item-detail links). Task 2's `NewJobPanel` calls only `onClose()` on success — it does not navigate to a detail page, since `/dashboard/jobs/[id]` doesn't exist until Task 3 (mirroring sub-project #2's `AddItemPanel`, which also doesn't navigate to a not-yet-built detail route). Task 3's detail page references only hooks and types that exist by Task 3 (nothing from Task 4). Task 4 only *modifies* files Task 3 already created — it introduces no new files and no forward references of its own, since it's the last task.
