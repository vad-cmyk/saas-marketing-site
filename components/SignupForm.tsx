"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "error";

export default function SignupForm() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, businessName }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error ?? "Something went wrong starting your trial. Please try again.",
        );
      }

      window.location.href = data.url;
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong starting your trial. Please try again.",
      );
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="mt-9 space-y-3 text-left" noValidate>
      <div>
        <label htmlFor="businessName" className="sr-only">
          Business name
        </label>
        <input
          id="businessName"
          type="text"
          required
          autoComplete="organization"
          placeholder="Business name"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-soft/60 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="email" className="sr-only">
          Work email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Work email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-soft/60 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 block w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_12px_30px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_18px_36px_-10px_rgba(156,68,35,0.7)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
      >
        {isSubmitting ? "Starting your trial…" : "Start free trial"}
      </button>

      {error && (
        <p role="alert" className="pt-1 text-center text-sm text-clay-deep">
          {error}
        </p>
      )}
    </form>
  );
}
