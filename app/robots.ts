import type { MetadataRoute } from "next";

const baseUrl = "https://thestagelist.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/set-password", "/proposal", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
