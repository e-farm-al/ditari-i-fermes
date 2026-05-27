/**
 * GET  /api/farms/[farmId]/hives/[hiveId]/harvests  — list harvests
 * POST /api/farms/[farmId]/hives/[hiveId]/harvests  — log harvest (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, hives, hiveHarvests } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; hiveId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const [hive] = await db
      .select({ id: hives.id })
      .from(hives)
      .where(and(eq(hives.id, params.hiveId), eq(hives.farmId, farm.id)))
      .limit(1);

    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);

    const records = await db
      .select()
      .from(hiveHarvests)
      .where(eq(hiveHarvests.hiveId, params.hiveId))
      .orderBy(desc(hiveHarvests.harvestDate));

    return ok(records);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user }) => {
    const [hive] = await db
      .select({ id: hives.id })
      .from(hives)
      .where(and(eq(hives.id, params.hiveId), eq(hives.farmId, farm.id)))
      .limit(1);

    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);

    const body = await req.json();
    const { harvestDate, honeyKg, waxKg, propolisG, notes } = body;

    if (!harvestDate || !honeyKg) {
      return err(API_ERRORS.VALIDATION_ERROR, "harvestDate and honeyKg are required", 422);
    }

    const [record] = await db
      .insert(hiveHarvests)
      .values({
        hiveId: params.hiveId,
        harvestedBy: user.id,
        harvestDate, honeyKg, waxKg, propolisG, notes,
      })
      .returning();

    return ok(record, 201);
  });
}
