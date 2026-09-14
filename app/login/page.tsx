'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Invalid email or password.');
      setIsSubmitting(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main
      className="bg-grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(188,86,46,0.14), transparent 60%), radial-gradient(ellipse 55% 45% at 90% 15%, rgba(85,98,74,0.14), transparent 60%), radial-gradient(ellipse 70% 60% at 50% 100%, rgba(188,86,46,0.08), transparent 65%)",
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-md overflow-hidden rounded-[1.75rem] border border-line bg-paper p-10 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)] sm:p-14">
        <h1 className="text-3xl text-ink sm:text-4xl">Sign in</h1>
        <p className="mx-auto mt-5 max-w-md text-balance text-lg text-ink-soft">
          Sign in with your Stage List account.
        </p>

        <form onSubmit={handleSubmit} className="mt-9 space-y-3 text-left" noValidate>
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
              disabled={isSubmitting}
              className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-soft/60 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-soft/60 transition-[border-color,box-shadow] duration-300 ease-out focus-visible:border-clay disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 block w-full rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_12px_30px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow,opacity] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_18px_36px_-10px_rgba(156,68,35,0.7)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          {error && (
            <p role="alert" className="pt-1 text-center text-sm text-clay-deep">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
