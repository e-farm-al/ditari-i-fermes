import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit doesn't read .env.local automatically (that's a Next.js thing)
config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
