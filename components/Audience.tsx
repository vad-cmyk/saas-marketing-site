import Reveal from "./Reveal";

const fitFor = [
  "You run from one storage unit, maybe two",
  "You're a team of one to three",
  "You're tracking stock in your head, Notes app, or a spreadsheet",
  "You've double-booked a piece at least once",
];

const notFitFor = [
  "You run a warehouse with a team and RFID scanning — Stageforce is built for that, and it's good at it",
  "You need invoicing, CRM, or e-signatures in the same tool",
];

function CheckIcon() {
  return (
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
  );
}

function CrossIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-1 h-4 w-4 shrink-0 text-ink-soft"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Audience() {
  return (
    <section id="who-its-for" className="border-b border-line/70">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-deep">
            Fit check
          </p>
          <h2 className="mt-4 text-3xl text-ink sm:text-4xl">
            Who Stage List is built for.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-line bg-paper p-8">
              <h3 className="text-xl text-ink">Stage List is for you if&hellip;</h3>
              <ul className="mt-5 space-y-3">
                {fitFor.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.95rem] text-ink-soft">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div className="h-full rounded-2xl border border-line bg-cream-deep/60 p-8">
              <h3 className="text-xl text-ink">It&rsquo;s not for you if&hellip;</h3>
              <ul className="mt-5 space-y-3">
                {notFitFor.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.95rem] text-ink-soft">
                    <CrossIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
