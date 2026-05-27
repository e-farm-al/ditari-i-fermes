import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Print every SQL statement during push/generate
  verbose: true,
  // Safety check — never auto-drop columns in production
  strict: true,
});
