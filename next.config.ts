import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The dev indicator covers the mobile tab bar (bottom-left) and the chat top bar's actions in
  // every other corner. Compile and runtime errors still show without it.
  devIndicators: false,
  partialPrefetching: true,
  turbopack: {
    // A stray package-lock.json in a parent folder must not change the project root.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
