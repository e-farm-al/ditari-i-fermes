import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

console.log("Running v2 migration...");

await sql`
  ALTER TABLE farms
  ADD COLUMN IF NOT EXISTS farm_type farm_section_type NOT NULL DEFAULT 'mixed'
`;
console.log("✓ Added farm_type column to farms");

console.log("Done.");
