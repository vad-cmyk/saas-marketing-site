"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import SignupForm from "./SignupForm";

const included = [
  "Unlimited inventory items and photos",
  "Job allocation with real-time availability checks",
  "Shareable client proposals",
  "Unlimited staff logins for your business",
  "Works on iPhone and in any browser",
];

type Cycle = "monthly" | "yearly";

export default function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

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
                  onClick={() => setCycle("monthly")}
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
                  onClick={() => setCycle("yearly")}
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
                  {cycle === "monthly" ? "£29" : "£290"}
                </span>
                <span className="pb-1.5 text-lg text-ink-soft">
                  {cycle === "monthly" ? "/ month" : "/ year"}
                </span>
              </div>
              {cycle === "yearly" && (
                <p className="mt-1 text-sm text-sage-deep">Two months free</p>
              )}
              <p className="mt-3 text-sm text-ink-soft">
                Try Stage List free for 30 days. Only add a card if you
                decide to keep going.
              </p>

              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-sage px-4 py-1.5 text-center text-xs font-semibold text-paper">
                Founding stagers: £19/month, locked for life. First 20
                businesses.
              </p>
              <p className="mt-1.5 text-xs text-ink-soft">Limited to 20.</p>

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
