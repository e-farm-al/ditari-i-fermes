import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

console.log("Running QR codes migration...");

await sql`
  CREATE TABLE IF NOT EXISTS qr_codes (
    code        VARCHAR(10)  PRIMARY KEY,
    entity_type VARCHAR(20)  NOT NULL,
    entity_id   UUID         NOT NULL,
    farm_id     UUID         NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
  )
`;
console.log("✓ qr_codes table");

await sql`CREATE INDEX IF NOT EXISTS qr_codes_entity_idx ON qr_codes(entity_type, entity_id)`;
await sql`CREATE INDEX IF NOT EXISTS qr_codes_farm_idx   ON qr_codes(farm_id)`;
console.log("✓ qr_codes indexes");

console.log("\nQR migration complete.");
