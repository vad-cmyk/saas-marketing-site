"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Step = "checking" | "code" | "password" | "done";
type SaveStatus = "idle" | "saving" | "error";
type CodeStatus = "idle" | "verifying" | "error";

export default function SetPassword() {
  // The email link should establish a session automatically via Supabase's
  // own redirect — but corporate email security (Microsoft 365 Safe Links,
  // and similar products) silently "pre-visits" every link in an incoming
  // email to scan it, burning the one-time link before the person ever
  // taps it themselves. Confirmed live 2026-11-09 with a real customer on
  // Microsoft 365: that single automated visit was enough to invalidate the
  // link, so by the time she clicked it, no session came through at all.
  //
  // There's no way to make a clickable link immune to that (it's an
  // automated visit indistinguishable from a real one), so the fix is a
  // fallback that doesn't depend on a link being clicked exactly once by a
  // human: the recovery email also carries a plain-text code, which a
  // scanner can't "use" just by reading the email body.
  const [step, setStep] = useState<Step>("checking");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");
  const [codeError, setCodeError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      // Give the client a moment to process any auth tokens in the URL
      // (set by Supabase's redirect) before deciding there's no session.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setStep(data.session ? "password" : "code");
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStep((current) => (current === "done" ? current : "password"));
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeStatus("verifying");
    setCodeError(null);

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    // This same page and code-entry fallback serves two different kinds of
    // link: a password reset for an existing customer, and a first-time
    // invite for a brand-new one. Supabase tracks those as different OTP
    // "types" even though the email's {{ .Token }} field looks identical —
    // try recovery first (the more common case reaching this fallback),
    // then invite, rather than asking the person which kind of email they
    // got.
    for (const type of ["recovery", "invite"] as const) {
      const { error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedCode,
        type,
      });
      if (!error) {
        setStep("password");
        return;
      }
    }

    setCodeStatus("error");
    setCodeError("That code didn't work — check it and try again.");
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveStatus("saving");
    setSaveError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setSaveError(updateError.message);
      setSaveStatus("error");
      return;
    }

    setStep("done");
  }

  const isSaving = saveStatus === "saving";
  const isVerifyingCode = codeStatus === "verifying";

  return (
    <main
      className="bg-grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(188,86,46,0.14), transparent 60%), radial-gradient(ellipse 55% 45% at 90% 15%, rgba(85,98,74,0.14), transparent 60%), radial-gradient(ellipse 70% 60% at 50% 100%, rgba(188,86,46,0.08), transparent 65%)",
      }}
    >
      {step === "done" ? (
        <div
          className="anim-fadescale relative z-10 mx-auto w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-line bg-paper p-10 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)] sm:p-14"
          style={{ animationDelay: "0ms" }}
        >
          <div
            className="anim-fadeup mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-sage/30 bg-sage/10"
            style={{ animationDelay: "80ms" }}
          >
            <svg
              viewBox="0 0 20 20"
              className="h-6 w-6 text-sage-deep"
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
          </div>

          <h1
            className="anim-fadeup mt-6 text-3xl text-ink sm:text-4xl"
            style={{ animationDelay: "170ms" }}
          >
            You&apos;re all set
          </h1>

          <p
            className="anim-fadeup mx-auto mt-5 max-w-md text-balance text-lg text-ink-soft"
            style={{ animationDelay: "260ms" }}
          >
            Download the app and sign in with your email and new password.
          </p>

          <a
            href="https://apps.apple.com/us/app/stage-list-inventory/id6809767671"
            target="_blank"
            rel="noopener noreferrer"
            className="anim-fadeup mt-7 inline-block rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_12px_30px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_18px_36px_-10px_rgba(156,68,35,0.7)] active:translate-y-0"
            style={{ animationDelay: "340ms" }}
          >
            Get Stage List on the App Store
          </a>

          <p
            className="anim-fadeup mt-4 text-xs text-ink-soft/80"
            style={{ animationDelay: "400ms" }}
          >
            Available now on the App Store.
          </p>
        </div>
      ) : step === "checking" ? (
        <div
          className="anim-fadescale relative z-10 mx-auto w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-line bg-paper p-10 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)] sm:p-14"
          style={{ animationDelay: "0ms" }}
        >
          <p className="text-lg text-ink-soft">One moment…</p>
        </div>
      ) : step === "code" ? (
        <div
          className="anim-fadescale relative z-10 mx-auto w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-line bg-paper p-10 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)] sm:p-14"
          style={{ animationDelay: "0ms" }}
        >
          <h1
            className="anim-fadeup text-3xl text-ink sm:text-4xl"
            style={{ animationDelay: "80ms" }}
          >
            Enter your code
          </h1>

          <p
            className="anim-fadeup mx-auto mt-5 max-w-md text-balance text-lg text-ink-soft"
            style={{ animationDelay: "170ms" }}
          >
            The link didn&rsquo;t carry a valid session through — this can
            happen if your email provider scans links automatically. Enter
            the 6-digit code from the same email instead.
          </p>

          <form
            onSubmit={handleCodeSubmit}
            className="anim-fadeup mt-9 space-y-3 text-left"
            style={{ animationDelay: "260ms" }}
            noValidate
          >
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isVerifyingCode}
                className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-soft/80 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="code" className="sr-only">
                6-digit code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                disabled={isVerifyingCode}
                className="w-full rounded-full border border-line bg-paper px-5 py-3 text-center text-sm tracking-[0.3em] text-ink placeholder:text-ink-soft/80 placeholder:tracking-normal transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingCode}
              className="mt-3 block w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_12px_30px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_18px_36px_-10px_rgba(156,68,35,0.7)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
            >
              {isVerifyingCode ? "Checking…" : "Continue"}
            </button>

            {codeError && (
              <p role="alert" className="pt-1 text-center text-sm text-clay-deep">
                {codeError}
              </p>
            )}
          </form>
        </div>
      ) : (
        <div
          className="anim-fadescale relative z-10 mx-auto w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-line bg-paper p-10 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)] sm:p-14"
          style={{ animationDelay: "0ms" }}
        >
          <h1
            className="anim-fadeup text-3xl text-ink sm:text-4xl"
            style={{ animationDelay: "80ms" }}
          >
            Set your password
          </h1>

          <p
            className="anim-fadeup mx-auto mt-5 max-w-md text-balance text-lg text-ink-soft"
            style={{ animationDelay: "170ms" }}
          >
            Choose a password for your Stage List account, then sign in from
            the mobile app.
          </p>

          <form
            onSubmit={handlePasswordSubmit}
            className="anim-fadeup mt-9 space-y-3 text-left"
            style={{ animationDelay: "260ms" }}
            noValidate
          >
            <div>
              <label htmlFor="password" className="sr-only">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSaving}
                className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-soft/80 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-3 block w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_12px_30px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_18px_36px_-10px_rgba(156,68,35,0.7)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
            >
              {isSaving ? "Saving…" : "Set password"}
            </button>

            {saveError && (
              <p role="alert" className="pt-1 text-center text-sm text-clay-deep">
                {saveError}
              </p>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
