export default function Footer() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm text-ink-soft sm:flex-row sm:justify-between sm:px-8">
        <span className="flex items-center gap-2 font-display text-lg text-ink">
          <img src="/logo-icon.png" alt="" className="h-6 w-6" />
          Stage List
        </span>
        <div className="flex items-center gap-5">
          <a href="/support" className="link-sweep">
            Support
          </a>
          <a href="/privacy" className="link-sweep">
            Privacy
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} Stage List. All rights reserved.</p>
      </div>
    </footer>
  );
}
