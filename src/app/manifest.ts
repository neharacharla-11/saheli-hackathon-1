import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Saheli",
    short_name: "Saheli",
    description: "Made for every version of her by her. A caring companion for food, movement, mind and health care.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#FDF4F6",
    theme_color: "#FDF4F6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
