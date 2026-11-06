import Image from "next/image";

export default function Nav() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[100] focus-visible:rounded-full focus-visible:bg-clay focus-visible:px-5 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-paper"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
        <a
          href="#top"
          className="flex items-center gap-2.5 transition-transform duration-300 ease-out hover:-translate-y-0.5"
        >
          <Image src="/logo-icon.png" alt="" width={36} height={36} className="h-9 w-9" priority />
          <span className="font-display text-xl tracking-tight text-ink">
            Stage List
          </span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-ink-soft sm:flex">
          <a href="#features" className="link-sweep">
            Features
          </a>
          <a href="#pricing" className="link-sweep">
            Pricing
          </a>
          <a href="#faq" className="link-sweep">
            FAQ
          </a>
          <a href="/login" className="link-sweep">
            Sign in
          </a>
        </div>

        <a
          href="#pricing"
          className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_20px_-8px_rgba(156,68,35,0.55)] transition-[transform,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_12px_26px_-8px_rgba(156,68,35,0.65)] active:translate-y-0"
        >
          Start free trial
        </a>
      </nav>
      </header>
    </>
  );
}
