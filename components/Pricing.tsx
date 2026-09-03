import Reveal from "./Reveal";

const included = [
  "Unlimited inventory items and photos",
  "Job allocation with real-time availability checks",
  "Shareable client proposals",
  "Unlimited staff logins for your business",
];

export default function Pricing() {
  return (
    <section id="pricing" className="border-b border-line/70">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-28">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-deep">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl text-ink sm:text-4xl">
            One plan. No tiers to decode.
          </h2>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-14 max-w-md">
          <div
            className="bg-grain relative overflow-hidden rounded-[1.75rem] border border-line bg-paper p-10 text-center shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)]"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(188,86,46,0.1), transparent 60%)",
            }}
          >
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-sage/30 bg-sage/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-sage-deep">
                14-day free trial · No card required to start
              </p>

              <div className="mt-8 flex items-end justify-center gap-2">
                <span className="font-display text-6xl leading-none text-ink">£20</span>
                <span className="pb-1.5 text-lg text-ink-soft">/ month</span>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                Try StagingHub free for 14 days. Only add a card if you
                decide to keep going.
              </p>

              <ul className="mt-8 space-y-3 text-left">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.95rem] text-ink-soft">
                    <svg
                      viewBox="0 0 20 20"
                      className="mt-1 h-4 w-4 shrink-0 text-clay-deep"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 10.5l3.5 3.5L16 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                aria-disabled="true"
                className="mt-9 block w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_12px_30px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_18px_36px_-10px_rgba(156,68,35,0.7)] active:translate-y-0"
              >
                Start free trial
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
