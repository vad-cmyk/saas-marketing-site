# Stage List — Launch Readiness Pass Report

All 11 sections of the brief were executed in order on `main`, with a commit
after each section (`npm run build` passed cleanly after every commit).
Section 11's copy pass required no code changes (see below), so there is no
extra commit for it — the working tree is clean.

## 1. `[TODO VAD: ...]` placeholders left, by file

- `components/Proof.tsx` — `[TODO VAD: Jazmine photo, square, ~400px]` (photo placeholder div) and `[TODO VAD: confirm with Jazmine]` (wrapping the testimonial quote).
- `components/Hero.tsx` — `[TODO VAD: App Store URL once approved]` (comment above `const APP_STORE_URL: string | null = null`) and `[TODO VAD: app screenshot, 1290×2796]` (phone-mockup placeholder text).
- `components/Footer.tsx` — `[TODO VAD: legal entity name]` (in the copyright line) and `[TODO VAD: confirm wording]` (prefixing the Norfolk founder note).
- `app/terms/page.tsx` — `[TODO VAD: legal entity name and address]` (in the "we/us/Stage List means…" sentence).
- `app/api/android-interest/route.ts` — `[TODO VAD: wire android_interest capture to a real destination — no backend table exists for this yet, requires a schema change]`.
- `lib/stripe.ts` — comment above `STAGE_LIST_PRICE_ID` flagging that displayed prices (£29/£290/£19 founder) are now out of sync with the live Stripe Price object.

## 2. Other-repo trial length + Stripe Price ID

- **Other repo, not touched (out of scope, as instructed):** `Sataging inventory /staged-ready/supabase/functions/stripe-webhook/index.ts`, around lines 96–98 — confirmed on inspection, a hardcoded `trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()`. This still enforces a 14-day trial independently of this repo's Stripe Checkout `trial_period_days` (now 30 in `app/api/checkout/route.ts`). Until this Edge Function is updated to `30 * 24 * 60 * 60 * 1000`, an organization's `trial_ends_at` in Supabase will fall out of sync with what Stripe actually bills — Stripe will let the trial run 30 days, but the app's own `trial_ends_at` field will say day 14. Needs a manual fix in that repo.
- **Stripe Price ID:** `lib/stripe.ts`'s `STAGE_LIST_PRICE_ID = 'price_1UBiXO0GWnkpvsiAYzmuSwzE'` was left unchanged per instructions — it still points at the old £20/month Price object. The site now *displays* £29/month, £290/year, and a £19/month founder price, but checkout will still charge whatever that old Price ID is configured for until new Stripe Price object(s) are created and wired in. Flagged with a `[TODO VAD: ...]` comment directly above the constant.

## 3. What the sign-up form does on submit (confirmed after changes)

Unchanged in substance, now hardened: `SignupForm` trims and validates `businessName`/`email` client-side, checks its honeypot field (`website`) and silently no-ops if filled, then POSTs `{ email, businessName, website }` to `/api/checkout`. That route re-validates (including a server-side honeypot check — defense in depth), creates a Stripe Checkout Session with a 30-day trial, and returns `{ url }`. On success the form fires `track('trial_signup_started')` and then does a full-page redirect via `window.location.href = data.url` — there is still no in-page success state, by design, since the browser navigates to Stripe immediately. Errors render in the existing `role="alert"` paragraph in `text-clay-deep`, matching the error-color convention used elsewhere (confirmed against `app/dashboard/branding/page.tsx`).

The new Android-interest capture (`components/Hero.tsx` + `app/api/android-interest/route.ts`) is intentionally a stub: it validates/trims the email, logs it server-side via `console.log`, and always returns success so the UI shows "Thanks — we'll let you know" regardless. **No real destination exists for this data yet** — wiring it up requires a Supabase schema change, which was explicitly out of scope for this pass.

## 4. Lighthouse mobile scores

Could not get a true "before" baseline, since Lighthouse was only run after all 11 sections' changes were already in place (built and served via `npm run build && npm start` on port 3000, audited with `npx lighthouse http://localhost:3000/ --form-factor=mobile --screenEmulation.mobile --chrome-flags="--headless"` against the system's installed Google Chrome).

**Final scores (mobile, after all changes):**
- Performance: **100**
- Accessibility: **100**
- SEO: **100**

All three are well above the 90 threshold, so no further fixes were needed. One minor non-blocking diagnostic noted: `unused-javascript` scored 0.5 (≈52 KiB estimated savings) — this is a diagnostic audit, not weighted into the Performance category score in Lighthouse's current scoring model, and the category still came out at 100. Not pursued further since it didn't affect any of the three required scores.

## 5. Things noticed that weren't explicitly in the brief

- **Unused asset:** `public/hero-dashboard.jpg` is no longer referenced anywhere after Section 4 replaced the hero image with the CSS phone-frame mockup (I chose "replace" rather than "alongside," per the brief's "your call" on layout). The file is still sitting in `public/` — harmless, but worth deleting in a future cleanup pass if it's not needed elsewhere.
- **Section 11 "How it works" strip:** Skipped deliberately, as the brief allowed. `components/Features.tsx`'s three existing cards already walk through photograph → see availability → share proposal in that order, which is functionally the same three-step narrative the brief's strip would add. Adding a second, near-duplicate three-step section back-to-back with Features would read as redundant rather than reinforcing, so I left it out and am flagging the decision here instead of forcing it in.
- **`npm audit` noise:** Installing `@vercel/analytics` triggered `npm audit` to report 21 pre-existing vulnerabilities (16 moderate, 4 high, 1 critical) across the dependency tree — these were already present before this session (not introduced by `@vercel/analytics` itself, which is a tiny zero-dependency-ish package). Worth a `npm audit` review separately; out of scope here.
- **Founder-pricing enforcement:** The "Founding stagers: £19/month, locked for life. First 20 businesses" badge and the "Limited to 20" line are display-only, as instructed (no live counter, no backend enforcement). Nothing stops business #21 from also landing on the £19 price today — that's a manual/Stripe-coupon-level problem to solve before this goes live with real signups, not something fixable in this repo's current state.
- **Stripe price drift is the single biggest pre-launch blocker:** until `STAGE_LIST_PRICE_ID` is updated (see item 2 above), *every* signup — regardless of which price the page shows — will checkout against the old £20/month Price object. This is the most load-bearing TODO in the whole pass.
- **Middleware deprecation warning:** every build emits "The `middleware` file convention is deprecated. Please use `proxy` instead," pointing at `middleware.ts`. Unrelated to this brief, pre-existing, not touched.

## Files touched/created (absolute paths)

- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/components/Proof.tsx` (new)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/components/Audience.tsx` (new)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/components/Hero.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/components/Features.tsx` (unchanged, reviewed)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/components/Pricing.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/components/Faq.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/components/Footer.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/components/SignupForm.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/page.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/layout.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/support/page.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/privacy/page.tsx`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/terms/page.tsx` (new)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/compare/stageforce/page.tsx` (new)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/opengraph-image.tsx` (new)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/sitemap.ts` (new)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/robots.ts` (new)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/api/checkout/route.ts`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/app/api/android-interest/route.ts` (new)
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/lib/stripe.ts`
- `/Users/vadimharbuz/Downloads/Cloud Code Websites/saas-marketing-site/package.json` / `package-lock.json` (added `@vercel/analytics`)
