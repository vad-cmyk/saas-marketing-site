import type { MetadataRoute } from "next";

const baseUrl = "https://thestagelist.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/`, lastModified },
    { url: `${baseUrl}/compare/stageforce`, lastModified },
    { url: `${baseUrl}/terms`, lastModified },
    { url: `${baseUrl}/privacy`, lastModified },
    { url: `${baseUrl}/support`, lastModified },
  ];
}
