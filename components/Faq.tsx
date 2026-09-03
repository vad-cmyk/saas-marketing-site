"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";

// Answer-reveal timing: kept in sync with the transform/opacity transition
// below so the grid row only collapses once the fade-out has finished.
const ANSWER_TRANSITION_MS = 300;

const faqs = [
  {
    q: "Do I need a credit card to start?",
    a: "No — only if you continue past the 14-day trial. You can try the full product first and decide afterwards.",
  },
  {
    q: "What happens if I don't add a card?",
    a: "Your trial ends automatically at the end of the 14 days. No charge, no surprise, nothing further required from you.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There's no contract or minimum term — cancel whenever you like.",
  },
  {
    q: "Is my inventory data private to my business?",
    a: "Yes. Every staging business's inventory, jobs, and proposals are fully isolated from every other business on StagingHub.",
  },
];

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  // The grid row (which reserves/reclaims vertical space) toggles instantly —
  // animating `grid-template-rows` itself is a layout property, which the
  // transform/opacity-only rule forbids. Instead we drive the *visible*
  // reveal entirely with transform + opacity on the answer text, and only
  // collapse the row once that fade-out has actually finished, so the
  // close motion still reads as smooth rather than an abrupt snap.
  const [rowOpen, setRowOpen] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setRowOpen(true);
      return;
    }
    const timer = setTimeout(() => setRowOpen(false), ANSWER_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <div className="border-b border-line/80">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-lg text-ink sm:text-xl">{q}</span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition-transform duration-300 ease-out"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div className="grid" style={{ gridTemplateRows: rowOpen ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p
            className="max-w-2xl origin-top pb-6 text-[0.975rem] text-ink-soft transition-[transform,opacity] ease-out"
            style={{
              transitionDuration: `${ANSWER_TRANSITION_MS}ms`,
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateY(0) scaleY(1)" : "translateY(-6px) scaleY(0.98)",
            }}
          >
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-cream-deep/60">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:px-8 sm:py-28">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-deep">
            Questions
          </p>
          <h2 className="mt-4 text-3xl text-ink sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-14">
          <div>
            {faqs.map((faq, i) => (
              <FaqItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
