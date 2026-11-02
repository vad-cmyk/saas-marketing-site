import Reveal from "./Reveal";

export default function Proof() {
  return (
    <section id="proof" className="border-b border-line/70 bg-cream-deep/60">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:px-8 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-deep">
            Where it started
          </p>
          <h2 className="mt-4 text-3xl text-ink sm:text-4xl">
            Built for a real staging business first.
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <div className="grid gap-8 rounded-2xl border border-line bg-paper p-8 sm:p-10 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border border-line bg-cream-deep/60 p-3 text-center text-xs text-ink-soft">
                [TODO VAD: Jazmine photo, square, ~400px]
              </div>
              <p className="mt-4 font-display text-lg text-ink">Jazmine</p>
              <p className="text-sm text-ink-soft">Founder, Staged Ready — Norfolk</p>
            </div>

            <div>
              <blockquote className="text-lg leading-relaxed text-ink">
                <span className="text-sm font-semibold uppercase tracking-[0.08em] text-clay-deep">
                  [TODO VAD: confirm with Jazmine]
                </span>
                <p className="mt-2">
                  &ldquo;I was about to pay $100 a month for Stageforce and realised I
                  only needed a fifth of it. Stage List does that fifth, on my phone,
                  in the storage unit.&rdquo;
                </p>
              </blockquote>

              <p className="mt-6 text-[0.975rem] text-ink-soft">
                Stage List was built for Staged Ready, a property staging business in
                Norfolk. It&rsquo;s now open to other UK stagers.
              </p>

              <a
                href="https://stagedready.com"
                className="link-sweep mt-4 inline-block text-sm text-clay-deep"
              >
                stagedready.com
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
