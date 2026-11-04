"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import SignupForm from "./SignupForm";

const included = [
  "Unlimited inventory items and photos",
  "Job allocation with real-time availability checks",
  "Shareable client proposals",
  "Unlimited staff logins for your business",
  "Works on iPhone and in any browser",
];

type Plan = "monthly" | "yearly" | "founder";

export default function Pricing() {
  const [plan, setPlan] = useState<Plan>("monthly");
  const [founderRemaining, setFounderRemaining] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/founder-availability")
      .then((res) => res.json())
      .then((data: { remaining: number }) => {
        if (!cancelled) setFounderRemaining(data.remaining);
      })
      .catch(() => {
        // Leave it null on failure — the founder option just stays hidden
        // rather than claiming a count we don't actually have.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const founderSoldOut = founderRemaining === 0;
  // Never leave a sold-out plan selected if it goes to zero after the user
  // already picked it (e.g. they left the tab open while the last spot went).
  const cycle = plan === "founder" && founderSoldOut ? "monthly" : plan;

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
                30-day free trial · No card required to start
              </p>

              <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-line bg-cream-deep/60 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  aria-pressed={cycle === "monthly"}
                  className={`rounded-full px-4 py-1.5 font-semibold transition-colors duration-300 ease-out ${
                    cycle === "monthly"
                      ? "bg-clay text-paper"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPlan("yearly")}
                  aria-pressed={cycle === "yearly"}
                  className={`rounded-full px-4 py-1.5 font-semibold transition-colors duration-300 ease-out ${
                    cycle === "yearly"
                      ? "bg-clay text-paper"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Yearly
                </button>
              </div>

              <div className="mt-6 flex items-end justify-center gap-2">
                <span className="font-display text-6xl leading-none text-ink">
                  {cycle === "monthly" ? "£29" : cycle === "yearly" ? "£290" : "£19"}
                </span>
                <span className="pb-1.5 text-lg text-ink-soft">
                  / {cycle === "yearly" ? "year" : "month"}
                </span>
              </div>
              {cycle === "yearly" && (
                <p className="mt-1 text-sm text-sage-deep">Two months free</p>
              )}
              {cycle === "founder" && (
                <p className="mt-1 text-sm text-sage-deep">Locked for life</p>
              )}
              <p className="mt-3 text-sm text-ink-soft">
                {cycle === "founder"
                  ? "Try Stage List free for 30 days, then £19/month for as long as you stay subscribed."
                  : "Try Stage List free for 30 days. Only add a card if you decide to keep going."}
              </p>

              {cycle === "founder" ? (
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className="mt-5 text-xs font-semibold text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
                >
                  Back to standard pricing
                </button>
              ) : founderSoldOut ? (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-cream-deep px-4 py-1.5 text-center text-xs font-semibold text-ink-soft">
                  Founder pricing — sold out
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlan("founder")}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-sage px-4 py-1.5 text-center text-xs font-semibold text-paper transition-colors duration-300 ease-out hover:bg-sage-deep"
                >
                  Founding stagers: £19/month, locked for life
                  {founderRemaining !== null && ` — ${founderRemaining} of 20 left`}
                </button>
              )}

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

              <SignupForm plan={cycle} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
