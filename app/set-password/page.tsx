"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "saving" | "done" | "error";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setStatus("error");
      return;
    }

    setStatus("done");
  }

  const isSaving = status === "saving";

  return (
    <main
      className="bg-grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(188,86,46,0.14), transparent 60%), radial-gradient(ellipse 55% 45% at 90% 15%, rgba(85,98,74,0.14), transparent 60%), radial-gradient(ellipse 70% 60% at 50% 100%, rgba(188,86,46,0.08), transparent 65%)",
      }}
    >
      {status === "done" ? (
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
            Choose a password for your StagingHub account, then sign in from
            the mobile app.
          </p>

          <form
            onSubmit={handleSubmit}
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
                className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-soft/60 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-3 block w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_12px_30px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_18px_36px_-10px_rgba(156,68,35,0.7)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
            >
              {isSaving ? "Saving…" : "Set password"}
            </button>

            {error && (
              <p role="alert" className="pt-1 text-center text-sm text-clay-deep">
                {error}
              </p>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
