import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The share-card route reads fonts and the logo from disk at runtime; make sure they ship with the function.
  outputFileTracingIncludes: { "/g/[slug]/card": ["./src/assets/fonts/**/*", "./public/logo-mark.png"] },
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
