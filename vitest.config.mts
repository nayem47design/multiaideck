import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // Server modules import "server-only"; outside Next it is an empty module.
    alias: { "server-only": "next/dist/compiled/server-only/empty.js" },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
    // Server tests migrate an in-memory Postgres (PGlite) per file; that can take longer than
    // the 10 s default on a busy machine.
    hookTimeout: 60_000,
  },
});
