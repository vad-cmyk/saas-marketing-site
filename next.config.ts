import type { NextConfig } from "next";

// mail.thestagelist.com exists only for DNS/email records (Resend + Stripe
// sending), not as an HTTPS-served subdomain — so includeSubDomains/preload
// are deliberately left off HSTS here rather than risk enforcing HTTPS on a
// subdomain that was never set up to serve anything over it.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
