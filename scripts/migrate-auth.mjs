import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

console.log("Running auth migration...");

await sql`ALTER TABLE users DROP COLUMN IF EXISTS clerk_id`;
console.log("✓ Dropped clerk_id column");

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar(255)`;
console.log("✓ Added password_hash column");

console.log("Done.");
