import Link from 'next/link';

export default function JobsPlaceholder() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Jobs</h1>
      <p className="mt-2 text-ink-soft">Job management is coming soon.</p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-clay-deep">
        ← Back to dashboard
      </Link>
    </div>
  );
}
