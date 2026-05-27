/**
 * Farm Diary — Database Client
 * Single shared Drizzle instance for the entire app.
 * Import `db` from here in all API routes and server components.
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

// Re-export schema so you can import tables from one place:
// import { db, users, farms } from "@/db"
export * from "./schema";
