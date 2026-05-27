/**
 * GET  /api/farms/[farmId]/poultry/[flockId]/records  — list daily records
 * POST /api/farms/[farmId]/poultry/[flockId]/records  — add daily record (worker+)
 *
 * Note: UNIQUE(flock_id, record_date) enforced at DB level.
 * POST will upsert: if a record exists for that date it is updated.
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, poultryFlocks, poultryDailyRecords } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; flockId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const [flock] = await db
      .select({ id: poultryFlocks.id })
      .from(poultryFlocks)
      .where(and(eq(poultryFlocks.id, params.flockId), eq(poultryFlocks.farmId, farm.id)))
      .limit(1);

    if (!flock) return err(API_ERRORS.FLOCK_NOT_FOUND, "Flock not found", 404);

    const records = await db
      .select()
      .from(poultryDailyRecords)
      .where(eq(poultryDailyRecords.flockId, params.flockId))
      .orderBy(desc(poultryDailyRecords.recordDate));

    return ok(records);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user }) => {
    const [flock] = await db
      .select({ id: poultryFlocks.id, currentCount: poultryFlocks.currentCount })
      .from(poultryFlocks)
      .where(and(eq(poultryFlocks.id, params.flockId), eq(poultryFlocks.farmId, farm.id)))
      .limit(1);

    if (!flock) return err(API_ERRORS.FLOCK_NOT_FOUND, "Flock not found", 404);

    const body = await req.json();
    const {
      recordDate, eggsCollected, mortalityCount = 0,
      mortalityReason, feedKg, waterLiters, notes,
    } = body;

    if (!recordDate) {
      return err(API_ERRORS.VALIDATION_ERROR, "recordDate is required", 422);
    }

    // Upsert — safe for offline sync (same date may arrive twice)
    const [record] = await db
      .insert(poultryDailyRecords)
      .values({
        flockId: params.flockId,
        recordedBy: user.id,
        recordDate, eggsCollected, mortalityCount,
        mortalityReason, feedKg, waterLiters, notes,
      })
      .onConflictDoUpdate({
        target: [poultryDailyRecords.flockId, poultryDailyRecords.recordDate],
        set: {
          eggsCollected, mortalityCount, mortalityReason,
          feedKg, waterLiters, notes,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Keep currentCount updated if mortality was logged
    if (mortalityCount > 0) {
      await db
        .update(poultryFlocks)
        .set({
          currentCount: Math.max(0, flock.currentCount - mortalityCount),
          updatedAt: new Date(),
        })
        .where(eq(poultryFlocks.id, params.flockId));
    }

    return ok(record, 201);
  });
}
