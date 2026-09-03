export default function Footer() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm text-ink-soft sm:flex-row sm:justify-between sm:px-8">
        <span className="font-display text-lg text-ink">StagingHub</span>
        <p>&copy; {new Date().getFullYear()} StagingHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
