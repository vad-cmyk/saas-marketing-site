export default function ProposalNotFound() {
  return (
    <main className="bg-grain relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-6">
      <div className="anim-fadeup relative z-10 flex max-w-md flex-col items-center text-center">
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          aria-hidden="true"
          className="accent-text mb-8 opacity-80"
        >
          <path
            d="M20 52V30a16 16 0 0 1 32 0v22"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M14 52h44M18 52v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6M48 52v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="accent-text mb-3 text-xs font-semibold tracking-[0.25em] uppercase">
          Staged Ready
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink italic sm:text-4xl">
          This proposal isn&rsquo;t available
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
          The link may have expired or been removed. If you think this is a mistake, contact the
          business that sent it to you.
        </p>
      </div>
    </main>
  );
}
