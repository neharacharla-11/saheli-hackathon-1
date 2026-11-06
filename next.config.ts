import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Care tabs used to live under /app/care/*.
  async redirects() {
    return ["screenings", "pain", "intimate", "expert"].map((x) => ({
      source: `/app/care/${x}`,
      destination: `/app/${x}`,
      permanent: false,
    }));
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
