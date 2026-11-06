import type { Metadata } from "next";

// /login is a 'use client' page, which can't export its own metadata — this
// route-segment layout carries it instead. Without this, the page inherited
// the homepage's title/description, which is misleading for a sign-in page.
export const metadata: Metadata = {
  title: "Sign in — Stage List",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
