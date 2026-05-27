/**
 * GET  /api/farms/[farmId]/livestock/[animalId]/health  — list health records
 * POST /api/farms/[farmId]/livestock/[animalId]/health  — add health record (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, livestock, livestockHealth } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; animalId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    // Verify animal belongs to farm
    const [animal] = await db
      .select({ id: livestock.id })
      .from(livestock)
      .where(and(eq(livestock.id, params.animalId), eq(livestock.farmId, farm.id)))
      .limit(1);

    if (!animal) return err(API_ERRORS.ANIMAL_NOT_FOUND, "Animal not found", 404);

    const records = await db
      .select()
      .from(livestockHealth)
      .where(eq(livestockHealth.animalId, params.animalId))
      .orderBy(desc(livestockHealth.eventDate));

    return ok(records);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user }) => {
    const [animal] = await db
      .select({ id: livestock.id })
      .from(livestock)
      .where(and(eq(livestock.id, params.animalId), eq(livestock.farmId, farm.id)))
      .limit(1);

    if (!animal) return err(API_ERRORS.ANIMAL_NOT_FOUND, "Animal not found", 404);

    const body = await req.json();
    const { recordType, eventDate, description, medication, dosage, administeredBy, nextDueDate } = body;

    if (!recordType || !eventDate || !description) {
      return err(API_ERRORS.VALIDATION_ERROR, "recordType, eventDate, and description are required", 422);
    }

    const [record] = await db
      .insert(livestockHealth)
      .values({
        animalId: params.animalId,
        recordedBy: user.id,
        recordType, eventDate, description,
        medication, dosage, administeredBy, nextDueDate,
      })
      .returning();

    return ok(record, 201);
  });
}
