/**
 * GET  /api/farms/[farmId]/hives  — list hives
 * POST /api/farms/[farmId]/hives  — add a hive (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, hives } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "active";

    const conditions = [eq(hives.farmId, farm.id)];
    if (status) conditions.push(eq(hives.status, status as any));

    const rows = await db.select().from(hives).where(and(...conditions));
    return ok(rows);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const body = await req.json();
    const { hiveCode, hiveType, installationDate, locationNotes, sectionId, notes } = body;

    if (!hiveCode) {
      return err(API_ERRORS.VALIDATION_ERROR, "hiveCode is required", 422);
    }

    const [hive] = await db
      .insert(hives)
      .values({
        farmId: farm.id,
        hiveCode, hiveType: hiveType ?? "langstroth",
        installationDate, locationNotes, sectionId, notes,
      })
      .returning();

    return ok(hive, 201);
  });
}
