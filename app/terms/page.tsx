import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Stage List",
};

export default function TermsOfService() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
      <h1 className="text-3xl text-ink sm:text-4xl">Terms of Service</h1>
      <p className="mt-3 text-sm text-ink-soft">Last updated: 6 November 2026</p>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-ink-soft">
        <p>
          These terms govern your use of Stage List. References to &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;Stage List&rdquo; mean The Stage List, trading at
          14 Tipperary Avenue, NR18 0ZA
          ([TODO VAD: your full legal name — UK law requires a sole trader/unregistered
          business to be identified by the owner&rsquo;s actual name alongside a trading
          name; once The Stage List is incorporated, replace this whole line with the
          registered company name, company number, and &ldquo;registered in England and
          Wales&rdquo;]). By signing up for or using Stage List, you agree to these
          terms. This document is written in plain English and is not a substitute for
          independent legal advice.
        </p>

        <section>
          <h2 className="font-display text-xl text-ink">The service</h2>
          <p className="mt-3">
            Stage List is an inventory and job-allocation app for property staging
            businesses. It lets you photograph and catalogue your inventory, allocate
            items to jobs, see what&rsquo;s available before you promise it to a client,
            and share proposals with clients.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Trial and subscription</h2>
          <p className="mt-3">
            New accounts get a 30-day free trial. No card is required to start a trial.
            If you want to keep using Stage List after your trial ends, you&rsquo;ll need
            to add a card and start a paid subscription. There&rsquo;s no contract or
            minimum term — you can cancel anytime, and cancelling stops future billing.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Acceptable use</h2>
          <p className="mt-3">
            You agree not to use Stage List for anything illegal, to upload content you
            don&rsquo;t have the right to use, or to try to abuse, disrupt, or gain
            unauthorised access to the service or other accounts.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Your data</h2>
          <p className="mt-3">
            You own your business and inventory data. We&rsquo;re a processor, not an
            owner, of your content — we store and process it so Stage List can work, and
            we don&rsquo;t sell it or use it for advertising. See our{" "}
            <a href="/privacy" className="text-clay-deep underline">
              Privacy Policy
            </a>{" "}
            for more detail on what we collect and why.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Limitation of liability</h2>
          <p className="mt-3">
            Stage List is provided &ldquo;as is&rdquo;. To the fullest extent permitted
            by law, we are not liable for any indirect or consequential loss, and our
            total liability to you for any claim relating to the service is capped at
            the fees you paid us in the 12 months before the claim arose. Nothing in
            these terms limits liability that cannot legally be limited, such as for
            death or personal injury caused by negligence.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Changes to these terms</h2>
          <p className="mt-3">
            If we make material changes to these terms, we&rsquo;ll update the date at
            the top of this page.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Governing law</h2>
          <p className="mt-3">
            These terms are governed by the laws of England and Wales, and any disputes
            will be handled by the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Contact us</h2>
          <p className="mt-3">
            Questions about these terms? Email{" "}
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
