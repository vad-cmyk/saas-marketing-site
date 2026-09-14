# Web Dashboard: Auth + Shell — Design

## Context

Stage List's product today is mobile-only: the Expo/React Native app (`staged-ready`) is the sole way a customer uses their account — browsing inventory, managing jobs, allocating items, editing branding. The marketing website (`saas-marketing-site`, Next.js 16 App Router) has zero logged-in experience. Its only auth-adjacent page is `/set-password`, a one-time password-setup step after Stripe checkout that ends with "Download the app and sign in" — there is no `/login`, no dashboard, no way to view or manage account data from a browser at all.

This is sub-project #1 of a larger, explicitly-approved initiative to bring full feature parity to a web dashboard, so customers can use Stage List from a browser as well as the app. Because "full parity" is too large for one spec, the work is being decomposed into sub-projects, built in order:

1. **Auth + dashboard shell** (this spec)
2. Inventory (browse/search/filter, add/edit items with photos)
3. Jobs (list, detail, allocate/return items, status changes)
4. Branding settings
5. Client proposals (create/send flow — the read-only viewer at `/proposal/[token]` already exists)

This spec covers **only** sub-project #1: the login page, the protected dashboard shell, and navigation. It deliberately does not build any real inventory/jobs/branding views — those are separate specs. Scope discipline here matters: the temptation to "just add a bit of the inventory list while I'm in here" is exactly what the sub-project boundaries exist to prevent.

## Goals

- A customer can log into the website with the **exact same account** they use in the mobile app (same email/password, same organization, same `memberships` row) — no new account system, no separate web-only credentials.
- Anyone who can sign into the app can sign into the website — no additional permission tier for this sub-project (all current membership roles get the same access to the shell; role-gating individual features is a concern for later sub-projects, e.g. branding settings being owner-only, matching the app's existing `my_role === 'owner'` check pattern).
- Visiting any `/dashboard/*` route while logged out redirects to `/login`. Visiting `/login` while already logged in redirects to `/dashboard`.
- The dashboard home page after login is a simple, honest welcome screen with working navigation — not a preview of data that doesn't have a real page yet.
- Visual language matches the marketing site's existing design system (Fraunces display font, Public Sans body font, clay/cream/sage palette — see Design section), adapted into a denser, functional dashboard layout rather than the marketing site's spacious editorial sections.

## Non-Goals (explicitly out of scope for this spec)

- Any real inventory, jobs, or branding **data** views — those are Sub-projects #2–4. The nav links to them, but their target pages are simple "Coming soon" placeholders in this spec.
- Sign-up / account creation from the website — accounts are still created exclusively via the existing Stripe checkout → webhook → invite flow. This spec is login-only.
- Password reset UI changes — `/set-password` already handles this (invite and recovery both land there) and is untouched by this spec.
- Role-based feature gating beyond "logged in or not" — e.g., there's no "owner vs staff" distinction enforced anywhere in this shell. That belongs to whichever later sub-project first needs it (branding settings, most likely).
- Mobile-app changes of any kind. This is 100% a `saas-marketing-site` change.

## Approach

**Session handling: Supabase SSR cookie-based auth (`@supabase/ssr`), not the existing browser-only client pattern.**

The existing `lib/supabase.ts` client (`createClient` from `@supabase/supabase-js`, no SSR helpers) is fine for the one-off client-side flows it's used for today (`/set-password`, the proposal viewer) but doesn't give server components or middleware any way to know who's logged in — everything has to happen after the page has already loaded in the browser, causing a flash of unauthenticated content and blocking any future server-side data fetching.

`@supabase/ssr` is Supabase's own recommended pattern for Next.js App Router: it stores the session in cookies (readable by middleware and server components, not just client components) and handles refresh automatically. This is barely more setup than the client-only approach, and every later sub-project (inventory, jobs) will want server-rendered, auth-gated data fetching — building that on top of a client-only session now would mean redoing the auth plumbing later. Doing it properly now avoids that rework.

This introduces one new dependency: `@supabase/ssr`.

## Design

### Routes

| Route | Access | Purpose |
|---|---|---|
| `/login` | Public (redirects away if already authenticated) | Email + password sign-in form |
| `/dashboard` | Protected | Welcome page + navigation |
| `/dashboard/inventory` | Protected | Placeholder page ("Inventory management is coming soon") — Sub-project #2 builds the real thing |
| `/dashboard/jobs` | Protected | Placeholder page ("Job management is coming soon") — Sub-project #3 |
| `/dashboard/branding` | Protected | Placeholder page ("Branding settings are coming soon") — Sub-project #4 |

Placeholder pages exist so the nav has somewhere real to link to (no dead links, no "#" hrefs) without building the actual feature early. Each is a small static server component: a heading, one sentence of "coming soon" copy, and a link back to `/dashboard`.

### File structure

- `middleware.ts` (new, project root) — runs on every request, refreshes the Supabase session cookie, and redirects: unauthenticated + `/dashboard/*` → `/login`; authenticated + `/login` → `/dashboard`.
- `lib/supabase/server.ts` (new) — `createServerClient` factory for use in server components/route handlers, reading/writing the session via Next.js's `cookies()`.
- `lib/supabase/middleware.ts` (new) — the session-refresh helper `middleware.ts` calls, per Supabase's standard SSR pattern (keeps `middleware.ts` itself thin).
- `lib/supabase/client.ts` (new) — `createBrowserClient` factory for the one client-side piece of this sub-project: the login form's submit handler. This is a distinct file from the existing `lib/supabase.ts`, which stays exactly as-is (nothing else in the codebase should be migrated to the new client as part of this spec — that's unrelated scope creep).
- `app/login/page.tsx` (new) — the login form (client component: email/password fields, submit calls `supabase.auth.signInWithPassword`, redirects to `/dashboard` on success, shows an inline error on failure).
- `app/dashboard/layout.tsx` (new) — the protected shell: reads the session server-side (via `lib/supabase/server.ts`), fetches the user's organization name (via the existing `memberships`/`organizations` tables — same query shape the mobile app already relies on), renders the nav + a sign-out button, and renders `{children}`.
- `app/dashboard/page.tsx` (new) — "Welcome back, {org name}" + nothing else.
- `app/dashboard/inventory/page.tsx`, `app/dashboard/jobs/page.tsx`, `app/dashboard/branding/page.tsx` (new) — the placeholder pages described above.

### Visual design

Reuses the marketing site's existing tokens directly (`app/globals.css`'s `--cream`/`--cream-deep`/`--ink`/`--ink-soft`/`--clay`/`--clay-deep`/`--sage`/`--sage-deep`/`--line`/`--paper`, and the `--font-display`/`--font-body` Fraunces/Public Sans pairing already loaded in `app/layout.tsx`) — no new fonts, no new colors.

Layout: a left sidebar (fixed width, `bg-paper` background, `border-r border-line`) containing the org name at top, then nav links (Dashboard, Inventory, Jobs, Branding), then a sign-out button pinned to the bottom. Main content area to the right, `bg-cream` background, padded, where each page's content renders. This is a denser, more conventional dashboard layout than the marketing site's centered/spacious sections — appropriate for a working tool rather than a landing page — while still reading as the same product visually (same fonts, same warm palette, same rounded-corner/soft-shadow language already used in cards like `Pricing.tsx`'s plan card).

The `/login` page reuses the same centered-card treatment already established on `/set-password` (`bg-grain` radial-gradient background, a single centered rounded card) for visual consistency between the site's two existing "utility" pages.

### Data flow

1. User submits the login form → `supabase.auth.signInWithPassword({ email, password })` via the browser client → on success, Supabase sets the session cookie (handled automatically by `@supabase/ssr`) → client redirects to `/dashboard`.
2. `middleware.ts` runs on the `/dashboard` request, refreshes the session if needed, confirms it's valid, allows the request through.
3. `app/dashboard/layout.tsx` (server component) reads the session, queries `memberships` joined to `organizations` for the current `auth.uid()` to get the org name, and renders the shell. RLS already scopes this correctly (same policies the mobile app relies on — no new RLS needed). The query shape should mirror `useMyOrganization` in the mobile app's `lib/queries.ts` for consistency, written as a direct server-side Supabase query here rather than a React Query hook.
4. Sign-out: a button in the sidebar calls `supabase.auth.signOut()` (browser client) and redirects to `/login`.

### Error handling

- Wrong email/password on `/login`: Supabase returns an auth error; the form shows it inline (e.g., "Invalid email or password") without redirecting. No enumeration of whether the email exists (Supabase's own error message here is already generic).
- A membership/organization lookup failure in the dashboard layout (shouldn't happen for a real logged-in user, but defensively): render a simple error state rather than crashing, with a sign-out link — this would only realistically happen if someone's membership was deleted while they had an active session.
- Session expiry mid-visit: middleware's redirect-if-unauthenticated check covers this on the next navigation; no special handling needed beyond what `@supabase/ssr` already does.

### Testing

- Manual verification against the real Supabase project (same pattern used throughout this project — no mocking): log in with a real test account, confirm redirect to `/dashboard`, confirm the org name displayed matches the real `organizations.name`, confirm each nav link reaches its placeholder page, confirm sign-out returns to `/login` and that `/dashboard` is then inaccessible until logging in again, confirm visiting `/login` while already authenticated redirects to `/dashboard`, confirm visiting `/dashboard` directly while logged out redirects to `/login`.
- No automated test suite exists in this repo today (no test runner configured in `package.json`) — this spec does not introduce one; verification is manual against the live/preview deployment, consistent with how every other feature in this repo has been verified so far.

## Open Questions

None outstanding — all scope and design questions were resolved during brainstorming (see conversation this spec originated from).
