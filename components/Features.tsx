import Reveal from "./Reveal";

const features = [
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden="true">
        <rect x="5" y="10" width="30" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="21" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M14 10l2.2-4h7.6L26 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Photograph your inventory once, allocate it to jobs forever.",
    body: "Snap every sofa, lamp, and side table into StagingHub a single time. From then on, assigning it to a new listing is a few taps — no re-cataloguing, no spreadsheets.",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden="true">
        <path d="M20 6l14 7-14 7-14-7 14-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M6 20l14 7 14-7M6 27l14 7 14-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Know what's available before you promise it to a client.",
    body: "StagingHub tracks how much of each piece is already committed elsewhere, so you can see exactly what's free — and catch a scheduling clash before it ever reaches a client.",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden="true">
        <rect x="8" y="5" width="24" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M14 14h12M14 20h12M14 26h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="29" cy="30" r="6" fill="var(--paper)" stroke="currentColor" strokeWidth="2" />
        <path d="M27 30l1.4 1.6L32 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Send clients a shareable proposal in seconds.",
    body: "Turn an allocation into a polished, shareable proposal link — no exporting, no formatting. Clients see exactly what's staged for their property, instantly.",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-b border-line/70 bg-cream-deep/60">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-deep">
            What StagingHub does
          </p>
          <h2 className="mt-4 text-3xl text-ink sm:text-4xl">
            Built around how staging businesses actually work.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 110}>
              <div className="group h-full rounded-2xl border border-line bg-paper p-8 shadow-[0_1px_0_rgba(33,28,23,0.03)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_40px_-20px_rgba(33,28,23,0.22)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-clay/10 text-clay-deep transition-colors duration-300 group-hover:bg-clay/16">
                  {feature.icon}
                </div>
                <h3 className="mt-6 text-xl leading-snug text-ink">
                  {feature.title}
                </h3>
                <p className="mt-3 text-[0.975rem] text-ink-soft">
                  {feature.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
