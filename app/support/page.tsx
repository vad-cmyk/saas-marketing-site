import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — Stage List",
};

const faqs = [
  {
    q: "How do I get started?",
    a: "Sign up for a 14-day free trial at thestagelist.com — no card required. You'll receive an email to set your password, then you can sign in from the mobile app or the website.",
  },
  {
    q: "I didn't get my invite or password reset email.",
    a: "Check your spam folder first. If it's still missing, email us at hello@thestagelist.com and we'll help you get set up.",
  },
  {
    q: "How do I add someone from my team?",
    a: "Every plan includes unlimited staff logins. Email hello@thestagelist.com with the email address you'd like to add and we'll send them an invite.",
  },
  {
    q: "How do I cancel or change my subscription?",
    a: "Email hello@thestagelist.com and we'll take care of it — no contract or minimum term.",
  },
];

export default function Support() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
      <h1 className="text-3xl text-ink sm:text-4xl">Support</h1>
      <p className="mt-5 max-w-xl text-lg text-ink-soft">
        Need help with Stage List? Email us directly and we&rsquo;ll get back to you as
        soon as we can.
      </p>

      <a
        href="mailto:hello@thestagelist.com"
        className="mt-7 inline-block rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_12px_30px_-10px_rgba(156,68,35,0.6)] transition-[transform,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_18px_36px_-10px_rgba(156,68,35,0.7)] active:translate-y-0"
      >
        Email hello@thestagelist.com
      </a>

      <div className="mt-16">
        <h2 className="font-display text-2xl text-ink">Frequently asked questions</h2>
        <div className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-line/70 pb-6">
              <h3 className="text-base font-semibold text-ink">{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
