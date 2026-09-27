import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Stage List",
};

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
      <h1 className="text-3xl text-ink sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-ink-soft">Last updated: 27 September 2026</p>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-ink-soft">
        <p>
          Stage List (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides an inventory and
          job-allocation app for property staging businesses. This policy explains what
          information we collect, why, and how you can control it.
        </p>

        <section>
          <h2 className="font-display text-xl text-ink">Information we collect</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Account information:</strong> your email
              address and password (stored securely, never in plain text), and your
              business name.
            </li>
            <li>
              <strong className="text-ink">Business data:</strong> anything you or your
              team enter to run your staging business — inventory items and their photos,
              categories, colour, material, dimensions, condition, quantity, storage
              location, and value; jobs and client property details; branding details such
              as your logo, brand colour, and business contact information.
            </li>
            <li>
              <strong className="text-ink">Payment information:</strong> handled entirely
              by Stripe, our payment processor. We never see or store your card details.
            </li>
            <li>
              <strong className="text-ink">Usage information:</strong> basic technical
              information (like device and browser type) needed to keep the app and
              website working reliably and securely.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">How we use it</h2>
          <p className="mt-3">
            We use your information to provide the Stage List service: running your
            account, storing and syncing your inventory and job data across the app and
            website, processing payments, sending account-related emails (like invites and
            password resets), and providing customer support. We do not sell your data,
            and we do not use your business data for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Who we share it with</h2>
          <p className="mt-3">
            We use a small number of trusted service providers to run Stage List, each
            processing only what they need to do their job:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Supabase</strong> — our database, authentication,
              and file storage provider, hosting your account and business data.
            </li>
            <li>
              <strong className="text-ink">Stripe</strong> — our payment processor, handling
              subscription billing.
            </li>
            <li>
              <strong className="text-ink">Resend</strong> — our email provider, delivering
              account emails like invites and password resets.
            </li>
            <li>
              <strong className="text-ink">Apple</strong> — distributing the Stage List
              mobile app via TestFlight and the App Store.
            </li>
          </ul>
          <p className="mt-3">
            Data within a business account is only visible to members of that business —
            every staging business&rsquo;s inventory, jobs, and proposals are fully isolated
            from every other business on Stage List.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Data retention</h2>
          <p className="mt-3">
            We retain your information for as long as your account is active. If you close
            your account or ask us to delete your data, we&rsquo;ll remove it within a
            reasonable time, except where we&rsquo;re required to keep certain records (for
            example, payment records) for legal or accounting purposes.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Your rights</h2>
          <p className="mt-3">
            You can ask us to access, correct, export, or delete your personal data at any
            time by contacting us at{" "}
            <a href="mailto:hello@thestagelist.com" className="text-clay-deep underline">
              hello@thestagelist.com
            </a>
            . If you&rsquo;re in the UK or EU, you also have rights under UK/EU data
            protection law, including the right to lodge a complaint with your local data
            protection authority.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Children</h2>
          <p className="mt-3">
            Stage List is a business tool and is not directed at, or intended for use by,
            children.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Changes to this policy</h2>
          <p className="mt-3">
            If we make material changes to this policy, we&rsquo;ll update the date at the
            top of this page.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Contact us</h2>
          <p className="mt-3">
            Questions about this policy or your data? Email{" "}
            <a href="mailto:hello@thestagelist.com" className="text-clay-deep underline">
              hello@thestagelist.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
