import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stage List",
    short_name: "Stage List",
    description: "Inventory and job allocation for property stagers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#bc562e",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
