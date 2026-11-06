import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "./providers";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

const publicSans = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "variable",
});

const siteDescription =
  "Inventory and job allocation for property stagers and home staging businesses. Photograph once, allocate to jobs, share with clients. £29/month, 30-day free trial, no card.";

export const metadata: Metadata = {
  metadataBase: new URL("https://thestagelist.com"),
  title: "Stage List — Inventory & job allocation for property stagers",
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Stage List — Inventory & job allocation for property stagers",
    description: siteDescription,
    type: "website",
    siteName: "Stage List",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stage List — Inventory & job allocation for property stagers",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
