/**
 * GET  /api/farms/[farmId]/livestock/[animalId]/production  — list production records
 * POST /api/farms/[farmId]/livestock/[animalId]/production  — log production (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, livestock, livestockProduction } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; animalId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const [animal] = await db
      .select({ id: livestock.id })
      .from(livestock)
      .where(and(eq(livestock.id, params.animalId), eq(livestock.farmId, farm.id)))
      .limit(1);

    if (!animal) return err(API_ERRORS.ANIMAL_NOT_FOUND, "Animal not found", 404);

    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    const conditions = [eq(livestockProduction.animalId, params.animalId)];
    if (type) conditions.push(eq(livestockProduction.productionType, type as any));

    const records = await db
      .select()
      .from(livestockProduction)
      .where(and(...conditions))
      .orderBy(desc(livestockProduction.recordedDate));

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
    const { productionType, quantity, unit, recordedDate, notes } = body;

    if (!productionType || !quantity || !unit || !recordedDate) {
      return err(API_ERRORS.VALIDATION_ERROR, "productionType, quantity, unit, and recordedDate are required", 422);
    }

    const [record] = await db
      .insert(livestockProduction)
      .values({
        animalId: params.animalId,
        recordedBy: user.id,
        productionType, quantity, unit, recordedDate, notes,
      })
      .returning();

    return ok(record, 201);
  });
}
