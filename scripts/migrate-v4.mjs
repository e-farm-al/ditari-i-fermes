import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

console.log("Running v4 migration — beekeeper module...");

await sql`ALTER TABLE hives ADD COLUMN IF NOT EXISTS queen_introduced date`;
console.log("✓ hives.queen_introduced");

await sql`ALTER TABLE hives ADD COLUMN IF NOT EXISTS queen_year_color smallint`;
console.log("✓ hives.queen_year_color");

await sql`ALTER TABLE hives ADD COLUMN IF NOT EXISTS queen_source varchar(100)`;
console.log("✓ hives.queen_source");

await sql`ALTER TABLE hive_inspections ADD COLUMN IF NOT EXISTS supers_count smallint`;
console.log("✓ hive_inspections.supers_count");

await sql`
  CREATE TABLE IF NOT EXISTS hive_swarms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hive_id uuid NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
    swarm_date date NOT NULL,
    caught boolean NOT NULL DEFAULT false,
    new_hive_id uuid REFERENCES hives(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`;
console.log("✓ hive_swarms table");

await sql`CREATE INDEX IF NOT EXISTS hive_swarms_hive_idx ON hive_swarms(hive_id)`;
await sql`CREATE INDEX IF NOT EXISTS hive_swarms_date_idx ON hive_swarms(swarm_date)`;
console.log("✓ hive_swarms indexes");

console.log("\nMigration v4 complete.");
