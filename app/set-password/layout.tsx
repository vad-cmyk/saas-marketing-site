import type { Metadata } from "next";

// Same reason as app/login/layout.tsx — /set-password is a 'use client'
// page, so its metadata lives in this route-segment layout instead.
export const metadata: Metadata = {
  title: "Set your password — Stage List",
  robots: { index: false, follow: false },
};

export default function SetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
