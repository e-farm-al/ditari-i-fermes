import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

console.log("Running v3 migration...");

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(60) UNIQUE`;
console.log("✓ Added username column to users");

console.log("Done.");
