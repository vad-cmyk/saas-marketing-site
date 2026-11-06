import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Page not found — Stage List",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-deep">
          404
        </p>
        <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">
          We can&rsquo;t find that page.
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
          The page you&rsquo;re looking for doesn&rsquo;t exist, or may have moved.
          Here are a few places to go instead:
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-paper transition-colors duration-300 ease-out hover:bg-clay-deep"
          >
            Go to homepage
          </Link>
          <Link href="/#pricing" className="link-sweep text-sm text-ink-soft">
            Pricing
          </Link>
          <a href="/support" className="link-sweep text-sm text-ink-soft">
            Support
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
