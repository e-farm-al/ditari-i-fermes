/**
 * GET  /api/farms/[farmId]/hives/[hiveId]/inspections  — list inspections
 * POST /api/farms/[farmId]/hives/[hiveId]/inspections  — add inspection (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, hives, hiveInspections } from "@/db";
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
      .from(hiveInspections)
      .where(eq(hiveInspections.hiveId, params.hiveId))
      .orderBy(desc(hiveInspections.inspectionDate));

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
    const {
      inspectionDate, queenPresent, queenStatus, colonyStrength,
      framesWithBees, framesWithBrood, honeyStores,
      diseaseSigns, diseaseNotes, temperament, treatmentApplied, notes,
    } = body;

    if (!inspectionDate) {
      return err(API_ERRORS.VALIDATION_ERROR, "inspectionDate is required", 422);
    }

    const [record] = await db
      .insert(hiveInspections)
      .values({
        hiveId: params.hiveId,
        inspectorId: user.id,
        inspectionDate,
        queenPresent: queenPresent ?? true,
        queenStatus, colonyStrength,
        framesWithBees, framesWithBrood, honeyStores,
        diseaseSigns: diseaseSigns ?? false,
        diseaseNotes, temperament, treatmentApplied, notes,
      })
      .returning();

    return ok(record, 201);
  });
}
