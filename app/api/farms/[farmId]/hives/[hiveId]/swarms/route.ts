/**
 * GET  /api/farms/[farmId]/hives/[hiveId]/swarms  — list swarms
 * POST /api/farms/[farmId]/hives/[hiveId]/swarms  — record a swarm (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, hives, hiveSwarms } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; hiveId: string } };

async function getHive(farmId: string, hiveId: string) {
  const [hive] = await db
    .select({ id: hives.id })
    .from(hives)
    .where(and(eq(hives.id, hiveId), eq(hives.farmId, farmId)))
    .limit(1);
  return hive;
}

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const hive = await getHive(farm.id, params.hiveId);
    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);

    const records = await db
      .select()
      .from(hiveSwarms)
      .where(eq(hiveSwarms.hiveId, params.hiveId))
      .orderBy(desc(hiveSwarms.swarmDate));

    return ok(records);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const hive = await getHive(farm.id, params.hiveId);
    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);

    const body = await req.json();
    const { swarmDate, caught, newHiveId, notes } = body;

    if (!swarmDate) {
      return err(API_ERRORS.VALIDATION_ERROR, "swarmDate is required", 422);
    }

    const [record] = await db
      .insert(hiveSwarms)
      .values({
        hiveId: params.hiveId,
        swarmDate,
        caught: caught ?? false,
        newHiveId: newHiveId ?? null,
        notes,
      })
      .returning();

    return ok(record, 201);
  });
}
