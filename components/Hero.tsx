"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";

// [TODO VAD: App Store URL once approved]
const APP_STORE_URL: string | null = null;

function AppStoreBadge() {
  const content = (
    <span className="flex items-center gap-2.5 rounded-xl bg-ink px-4 py-2.5 text-paper">
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.417 2.19-1.11 2.98-.775.9-2.04 1.56-3.19 1.47-.12-1.1.42-2.24 1.1-3 .78-.88 2.11-1.55 3.2-1.45zM20.6 17.26c-.52 1.16-.77 1.68-1.44 2.7-.94 1.43-2.26 3.21-3.9 3.22-1.46.02-1.84-.95-3.82-.94-1.98.01-2.4.96-3.86.94-1.64-.02-2.9-1.63-3.84-3.06C1.4 17.34.2 13.73 1.2 11.1c.66-1.73 1.86-2.84 3.07-3.07.98-.2 1.83.44 3.2.44 1.33 0 2.33-.47 3.42-.47 1.18 0 1.95.47 3.14.47.03 0 .05 0 .08-.01-1.22.33-2.52 1.6-2.52 3.47 0 2.33 1.99 3.3 2.07 3.34-.02.06-.4 1.3-1.06 1.99z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[0.6rem] font-medium">Download on the</span>
        <span className="block font-display text-base leading-none">App Store</span>
      </span>
    </span>
  );

  if (APP_STORE_URL) {
    return (
      <a
        href={APP_STORE_URL}
        className="inline-block transition-transform duration-300 ease-out hover:-translate-y-0.5"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <div className="opacity-50" aria-hidden="true">
        {content}
      </div>
      <span className="text-xs text-ink-soft">Coming soon — in App Store review</span>
    </div>
  );
}

function AndroidInterestForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real users never fill this in
  // Time trap: set once at mount, sent back on submit. A real visitor takes
  // at least a couple of seconds to read the form and type into it.
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Honeypot: if this hidden field is filled, it's almost certainly a
    // bot. Silently no-op — no API call, same as the signup form's.
    if (website.trim()) return;

    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("submitting");
    try {
      await fetch("/api/android-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, website, startedAt }),
      });
    } catch {
      // Intentionally swallow — we show a confirmation regardless, there's
      // no user-facing action to take if this fails.
    }
    track("android_interest_submitted");
    setStatus("done");
  }

  if (status === "done") {
    return <p className="text-sm text-sage-deep">Thanks — we&rsquo;ll let you know.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label htmlFor="android-email" className="sr-only">
        Email for Android interest
      </label>
      <input
        id="android-email"
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={status === "submitting"}
        className="w-48 rounded-full border border-line bg-paper px-4 py-2 text-base text-ink placeholder:text-ink-soft/80 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
      />

      {/* Honeypot field — hidden from real users, off-canvas rather than
          display:none so bots that skip display:none still fill it in. */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="android-website">Website</label>
        <input
          id="android-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink-soft transition-colors duration-300 ease-out hover:text-clay-deep disabled:opacity-60"
      >
        Android? Register interest
      </button>
      <a href="/privacy" className="link-sweep text-xs text-ink-soft/80">
        Privacy Policy
      </a>
    </form>
  );
}

export default function Hero() {
  return (
    <section
      id="top"
      className="bg-grain relative overflow-hidden border-b border-line/70"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(188,86,46,0.14), transparent 60%), radial-gradient(ellipse 55% 45% at 90% 15%, rgba(85,98,74,0.14), transparent 60%), radial-gradient(ellipse 70% 60% at 50% 100%, rgba(188,86,46,0.08), transparent 65%)",
      }}
    >
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16 sm:px-8 sm:py-24 lg:py-28">
        <p
          className="anim-fadeup inline-flex w-fit items-center gap-2 self-center rounded-full border border-clay/30 bg-paper/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-clay-deep lg:self-start"
          style={{ animationDelay: "0ms" }}
        >
          Built for property staging businesses
        </p>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.7fr_0.85fr_1.35fr]">
          {/* Narrow left column — the supporting line and the trial CTA. */}
          <div
            className="anim-fadeup order-2 text-center lg:order-1 lg:text-left"
            style={{ animationDelay: "120ms" }}
          >
            <p className="mx-auto max-w-xs text-base leading-relaxed text-ink-soft lg:mx-0">
              Photograph a piece once, then allocate it to jobs with
              confidence — no more promising the same sofa to two clients in
              the same week. Catalogue from your phone in the unit; review
              from your laptop at your desk.
            </p>
            <a
              href="#pricing"
              className="mt-6 inline-block rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_10px_28px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_16px_34px_-10px_rgba(156,68,35,0.7)] active:translate-y-0"
            >
              Start your free trial
            </a>
            <p className="mt-3 text-sm text-ink-soft">30-day free trial · No card required</p>
          </div>

          {/* Centre — the phone mockup set in a layered brand circle. */}
          <div
            className="anim-fadescale relative order-1 mx-auto flex h-[340px] w-full max-w-sm items-center justify-center lg:order-2 lg:h-[420px]"
            style={{ animationDelay: "260ms", ["--tilt" as string]: "-2deg" }}
          >
            <div
              aria-hidden="true"
              className="absolute h-[300px] w-[300px] rounded-full border border-clay/25 sm:h-[360px] sm:w-[360px] lg:h-[400px] lg:w-[400px]"
              style={{ transform: "translate(14px, -10px)" }}
            />
            <div
              aria-hidden="true"
              className="absolute h-[280px] w-[280px] rounded-full sm:h-[340px] sm:w-[340px] lg:h-[380px] lg:w-[380px]"
              style={{
                background:
                  "radial-gradient(circle at 30% 26%, rgba(255,253,248,0.55), transparent 45%), radial-gradient(circle at 70% 80%, rgba(65,75,55,0.3), transparent 58%), var(--clay)",
                boxShadow:
                  "0 40px 80px -30px rgba(156,68,35,0.45), 0 18px 40px -18px rgba(33,28,23,0.25)",
              }}
            />
            <div className="relative mx-auto rotate-[-2deg] transition-transform duration-500 ease-out hover:rotate-0">
              <div className="relative mx-auto w-[220px] rounded-[2.25rem] border-[6px] border-ink bg-ink p-2 shadow-[0_30px_60px_-20px_rgba(33,28,23,0.4)] sm:w-[250px]">
                <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[1.6rem] bg-paper">
                  <div
                    className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-ink"
                    aria-hidden="true"
                  />
                  <Image
                    src="/app-screenshot.jpg"
                    alt="Stage List inventory screen on iPhone, showing a searchable, filterable list of staging pieces"
                    fill
                    sizes="(min-width: 640px) 250px, 220px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-2 rotate-[3deg] rounded-2xl border border-line bg-paper px-4 py-3 shadow-[0_18px_36px_-14px_rgba(33,28,23,0.3)] sm:-left-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-sage-deep">
                Available for job
              </p>
              <p className="mt-1 font-display text-xl text-ink">3 of 5 in stock</p>
            </div>
          </div>

          {/* Right — the big stacked headline, led in by the rest of the
              sentence so it reads as a payoff, not an isolated slogan. */}
          <div
            className="anim-fadeup order-3 text-center lg:text-right"
            style={{ animationDelay: "180ms" }}
          >
            <p className="text-lg text-ink-soft sm:text-xl">
              Every sofa, lamp, and vase —
            </p>
            <h1 className="font-display text-[3.2rem] leading-[0.95] tracking-tight text-ink whitespace-nowrap sm:text-[4.4rem] lg:text-[4.2rem] xl:text-[4.8rem]">
              never
              <br />
              <em className="text-clay-deep italic">double-booked.</em>
            </h1>
          </div>
        </div>

        {/* Footer row — App Store badge and Android waitlist. */}
        <div
          className="anim-fadeup flex flex-col items-center justify-between gap-6 border-t border-line/70 pt-8 sm:flex-row"
          style={{ animationDelay: "320ms" }}
        >
          <AppStoreBadge />
          <AndroidInterestForm />
        </div>
      </div>
    </section>
  );
}
