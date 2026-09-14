# Web Dashboard Auth + Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a login page and a protected dashboard shell to the marketing website, so a customer can sign into their existing Stage List account from a browser, not just the mobile app.

**Architecture:** Supabase's official SSR pattern (`@supabase/ssr`) for cookie-based sessions readable by both Next.js middleware and server components. Middleware enforces the redirect rules; server components fetch the signed-in user's organization via the same `memberships`/`organizations` tables (and the same RLS policies) the mobile app already relies on — no new backend, no new tables, no new RLS.

**Tech Stack:** Next.js 16.3.4 (App Router), React 19.2.8, Tailwind v4, `@supabase/supabase-js` ^2.115.0 (already a dependency), `@supabase/ssr` 0.12.7 (new dependency added in Task 1).

**Spec:** `docs/superpowers/specs/2026-09-14-web-dashboard-auth-shell-design.md`

## Global Constraints

- Reuses the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars — same names already used by `lib/supabase.ts` and already set both locally (`.env.local`) and in Vercel production. No new env vars.
- Visual language reuses existing tokens verbatim from `app/globals.css`: `--cream` `#f6f1e7`, `--cream-deep` `#efe7d8`, `--ink` `#211c17`, `--ink-soft` `#4a4238`, `--clay` `#bc562e`, `--clay-deep` `#9c4423`, `--sage` `#55624a`, `--sage-deep` `#414b37`, `--line` `#ddd2bd`, `--paper` `#fffdf8`, and the `--font-display` (Fraunces) / `--font-body` (Public Sans) pairing already loaded in `app/layout.tsx`. No new fonts, no new colors.
- No automated test runner exists in this repo (no test script in `package.json`). Every task's verification is either `npm run build` (catches type errors and broken imports) or manual browser verification against the real Supabase project (ref `yloqsehowpwxuuuwxdaw`) and `npm run dev` locally — consistent with how every other feature in this repo has been built and verified. Do not add a test framework as part of this plan.
- Real test account for manual verification: email `appreview@thestagelist.com`, password `StageDemobK3jXh5PA4`. This account already has a confirmed Supabase Auth user, an organization ("Sample Staging Co"), and an owner membership — created for App Store review purposes and safe to reuse here. It is not a real customer.
- Out of scope (do not build): any real inventory/jobs/branding data views (placeholder "coming soon" pages only), sign-up/account creation on the website, changes to `/set-password`, role-based feature gating, any mobile-app changes.

---

### Task 1: Supabase SSR client helpers

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Modify: `package.json` (add `@supabase/ssr` dependency)

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (existing env vars, already set).
- Produces: `createClient()` from `lib/supabase/client.ts` — a browser-side Supabase client factory, no arguments, returns a `SupabaseClient`. `createClient()` from `lib/supabase/server.ts` — an `async` server-side Supabase client factory (reads Next.js `cookies()`), no arguments, returns `Promise<SupabaseClient>`. Both are consumed by Tasks 2, 3, and 4. Note both files export a same-named `createClient` function — callers always import it via its full path (`@/lib/supabase/client` or `@/lib/supabase/server`), never both in the same file, so the name collision never actually occurs in practice; this mirrors Supabase's own documented convention for this exact pattern.

- [ ] **Step 1: Install the dependency**

```bash
cd "/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site"
npm install @supabase/ssr@0.12.7
```

- [ ] **Step 2: Create the browser client factory**

Create `lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Create the server client factory**

Create `lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from a Server Component during render, where
            // cookies can't be mutated — safe to ignore because
            // middleware.ts (Task 4) refreshes the session on every request
            // regardless.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Verify it builds**

Run: `npm run build`
Expected: build succeeds with no type errors. (There are no pages using these helpers yet, so this only proves the files themselves compile and `@supabase/ssr`'s types resolve correctly — Tasks 2 and 3 exercise them for real.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/supabase/client.ts lib/supabase/server.ts
git commit -m "Add Supabase SSR client helpers for the web dashboard"
```

---

### Task 2: Dashboard shell (layout, welcome page, placeholder pages)

**Files:**
- Create: `app/dashboard/layout.tsx`
- Create: `app/dashboard/SignOutButton.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `app/dashboard/inventory/page.tsx`
- Create: `app/dashboard/jobs/page.tsx`
- Create: `app/dashboard/branding/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (Task 1, server-side org lookup) and `@/lib/supabase/client` (Task 1, via `SignOutButton`'s browser-side `signOut()` call).
- Produces: the `/dashboard`, `/dashboard/inventory`, `/dashboard/jobs`, `/dashboard/branding` routes that Task 3's login redirect and Task 4's middleware both target by path (no shared component/type interface beyond the routes themselves).

No auth-redirect guard is added in this task — that's Task 4's job. If there's no valid session yet when this task is tested (there won't be, since Task 3's login page doesn't exist yet), the `memberships` RLS policy returns zero rows for the anonymous request, `org` below is `null`, and the layout renders its graceful fallback. That fallback is not a stopgap — it's the same real error state the spec requires for the (rare, later) case of a signed-in user whose membership was deleted mid-session.

- [ ] **Step 1: Create the sign-out button (client component)**

Create `app/dashboard/SignOutButton.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create the protected layout shell**

Create `app/dashboard/layout.tsx`:

```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/inventory', label: 'Inventory' },
  { href: '/dashboard/jobs', label: 'Jobs' },
  { href: '/dashboard/branding', label: 'Branding' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('memberships')
    .select(
      'role, organizations(id, name, subscription_status, trial_ends_at, logo_url, brand_color, contact_email, contact_phone)',
    )
    .limit(1)
    .maybeSingle();

  const org = data?.organizations as { name: string } | null | undefined;

  if (error || !org) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <p className="text-lg text-ink">
            We couldn&rsquo;t load your account. Try signing in again.
          </p>
          <SignOutButton className="mt-4 inline-block rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-paper">
            Sign out
          </SignOutButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-paper px-5 py-6">
        <p className="font-display text-lg text-ink">{org.name}</p>
        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors duration-200 ease-out hover:bg-cream hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <SignOutButton className="mt-auto rounded-xl border border-line px-3 py-2 text-left text-sm font-medium text-ink-soft transition-colors duration-200 ease-out hover:bg-cream hover:text-ink">
          Sign out
        </SignOutButton>
      </aside>
      <main className="flex-1 bg-cream px-10 py-10">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create the welcome page**

Create `app/dashboard/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server';

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('memberships')
    .select('organizations(name)')
    .limit(1)
    .maybeSingle();

  const orgName =
    (data?.organizations as { name: string } | null)?.name ?? 'your business';

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Welcome back, {orgName}</h1>
      <p className="mt-2 text-ink-soft">
        Use the navigation on the left to get to Inventory, Jobs, or Branding.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create the three placeholder pages**

Create `app/dashboard/inventory/page.tsx`:

```tsx
import Link from 'next/link';

export default function InventoryPlaceholder() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Inventory</h1>
      <p className="mt-2 text-ink-soft">Inventory management is coming soon.</p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-clay-deep">
        ← Back to dashboard
      </Link>
    </div>
  );
}
```

Create `app/dashboard/jobs/page.tsx`:

```tsx
import Link from 'next/link';

export default function JobsPlaceholder() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Jobs</h1>
      <p className="mt-2 text-ink-soft">Job management is coming soon.</p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-clay-deep">
        ← Back to dashboard
      </Link>
    </div>
  );
}
```

Create `app/dashboard/branding/page.tsx`:

```tsx
import Link from 'next/link';

export default function BrandingPlaceholder() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Branding</h1>
      <p className="mt-2 text-ink-soft">Branding settings are coming soon.</p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-clay-deep">
        ← Back to dashboard
      </Link>
    </div>
  );
}
```

- [ ] **Step 5: Verify the fallback state manually**

Run: `npm run dev`, then visit `http://localhost:3000/dashboard` in a browser with no Supabase session cookie present (a fresh/incognito window).
Expected: the "We couldn't load your account" fallback renders (not a crash, not a blank page) — this is the correct state at this point in the plan, since there's no login page yet.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard
git commit -m "Add dashboard shell: protected layout, welcome page, placeholder pages"
```

---

### Task 3: Login page

**Files:**
- Create: `app/login/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/client` (Task 1). Redirects to `/dashboard` (Task 2's route) on success.
- Produces: the `/login` route that Task 4's middleware redirects unauthenticated visitors to, and redirects authenticated visitors away from.

- [ ] **Step 1: Create the login page**

Create `app/login/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify wrong-password handling against the real Supabase project**

Run: `npm run dev`, visit `http://localhost:3000/login`, submit `appreview@thestagelist.com` with an intentionally wrong password.
Expected: "Invalid email or password." appears inline; the page does not redirect or crash.

- [ ] **Step 3: Verify real sign-in end-to-end**

On the same page, submit `appreview@thestagelist.com` / `StageDemobK3jXh5PA4` (the real demo account credentials from Global Constraints).
Expected: redirected to `/dashboard`, and — because Task 2's shell is already in place — the page now shows the real dashboard with "Welcome back, Sample Staging Co" and a working sidebar (not the fallback state from Task 2's own test, since a real session now exists).

- [ ] **Step 4: Commit**

```bash
git add app/login
git commit -m "Add login page"
```

---

### Task 4: Route protection middleware

**Files:**
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts` (project root)

**Interfaces:**
- Consumes: nothing from earlier tasks directly (builds its own server client inline per Supabase's standard middleware pattern, since middleware runs in the Edge runtime where `next/headers`'s `cookies()` isn't available the way Task 1's `lib/supabase/server.ts` uses it). Redirects reference the `/login` (Task 3) and `/dashboard` (Task 2) paths.
- Produces: the enforced redirect behavior described in the spec — this is the final task, nothing later consumes it.

- [ ] **Step 1: Create the session-refresh + redirect helper**

Create `lib/supabase/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginRoute = request.nextUrl.pathname === '/login';

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 2: Wire it into the root middleware**

Create `middleware.ts` in the project root (same level as `package.json`):

```ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 3: Verify the full protection matrix against the real Supabase project**

Run: `npm run dev`. Using a fresh/incognito browser window (no existing session):

1. Visit `http://localhost:3000/dashboard` directly.
   Expected: redirected to `/login`.
2. Sign in with `appreview@thestagelist.com` / `StageDemobK3jXh5PA4`.
   Expected: redirected to `/dashboard`, real welcome page shown (same as Task 3's Step 3, now with middleware actively protecting the route rather than just the layout's own query happening to succeed).
3. While still signed in, visit `http://localhost:3000/login` directly.
   Expected: redirected straight to `/dashboard` (not shown the login form).
4. Click "Sign out" in the sidebar.
   Expected: redirected to `/login`.
5. Immediately visit `http://localhost:3000/dashboard` again.
   Expected: redirected back to `/login` — confirms sign-out actually cleared the session rather than just navigating away.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/middleware.ts middleware.ts
git commit -m "Add middleware to enforce dashboard login protection"
```

---

## Self-Review Notes

**Spec coverage:** Routes table (login, dashboard, 3 placeholders) → Tasks 2–3. File structure (all 8 listed files) → Tasks 1–4, one-to-one. Session handling approach (`@supabase/ssr`) → Task 1. Visual design (tokens, sidebar layout, login card matching `/set-password`) → Tasks 2–3. Data flow (sign-in → cookie → middleware → layout org lookup → sign-out) → Tasks 3, 2, 4 respectively. Error handling (wrong password, membership lookup failure) → Tasks 3 Step 2, Task 2 Step 5. Testing → each task's own verification steps plus Task 4 Step 3's full matrix, matching the spec's Testing section point-for-point.

**Placeholder scan:** No TBD/TODO markers; every step has real, complete code, not descriptions of code.

**Type consistency:** `createClient` (both variants), `org.name` / `orgName`, `SignOutButton`'s `className`/`children` props, and route paths (`/login`, `/dashboard`, `/dashboard/inventory`, `/dashboard/jobs`, `/dashboard/branding`) are used identically everywhere they appear across all four tasks.
