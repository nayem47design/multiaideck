import { defineConfig } from "drizzle-kit";

// Migrations are generated from src/lib/db/schema.ts into ./drizzle (`npm run db:generate`).
// The app applies them on start (PGlite) or with `npm run db:migrate` (Postgres).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
