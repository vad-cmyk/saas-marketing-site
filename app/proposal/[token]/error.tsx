'use client';

export default function ProposalError({ reset }: { reset: () => void }) {
  return (
    <main className="bg-grain relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-6">
      <div className="anim-fadeup relative z-10 flex max-w-md flex-col items-center text-center">
        <p className="accent-text mb-3 text-xs font-semibold tracking-[0.25em] uppercase">
          Staged Ready
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink italic sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
          We couldn&rsquo;t load this proposal right now. Please try again in a moment.
        </p>
        <button
          onClick={reset}
          className="accent-bg mt-8 rounded-full px-6 py-3 text-sm font-semibold text-paper shadow-[0_1px_2px_rgba(36,31,26,0.08),0_12px_24px_-8px_rgba(36,31,26,0.35)] transition-[transform,box-shadow,filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_1px_2px_rgba(36,31,26,0.1),0_18px_32px_-10px_rgba(36,31,26,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,var(--clay))] active:translate-y-0 active:brightness-95"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
