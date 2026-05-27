/**
 * GET    /api/farms/[farmId]/livestock/[animalId]  — animal detail
 * PUT    /api/farms/[farmId]/livestock/[animalId]  — update animal (worker+)
 * DELETE /api/farms/[farmId]/livestock/[animalId]  — delete animal (manager+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, livestock } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; animalId: string } };

async function getAnimal(farmId: string, animalId: string) {
  const [animal] = await db
    .select()
    .from(livestock)
    .where(and(eq(livestock.id, animalId), eq(livestock.farmId, farmId)))
    .limit(1);
  return animal;
}

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const animal = await getAnimal(farm.id, params.animalId);
    if (!animal) return err(API_ERRORS.ANIMAL_NOT_FOUND, "Animal not found", 404);
    return ok(animal);
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const animal = await getAnimal(farm.id, params.animalId);
    if (!animal) return err(API_ERRORS.ANIMAL_NOT_FOUND, "Animal not found", 404);

    const body = await req.json();
    const {
      tagNumber, name, breed, dateOfBirth,
      motherId, fatherId, status, sectionId, notes,
    } = body;

    const [updated] = await db
      .update(livestock)
      .set({
        ...(tagNumber !== undefined && { tagNumber }),
        ...(name !== undefined && { name }),
        ...(breed !== undefined && { breed }),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(motherId !== undefined && { motherId }),
        ...(fatherId !== undefined && { fatherId }),
        ...(status !== undefined && { status }),
        ...(sectionId !== undefined && { sectionId }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(livestock.id, params.animalId))
      .returning();

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "manager", async ({ farm }) => {
    const animal = await getAnimal(farm.id, params.animalId);
    if (!animal) return err(API_ERRORS.ANIMAL_NOT_FOUND, "Animal not found", 404);

    await db.delete(livestock).where(eq(livestock.id, params.animalId));
    return ok({ deleted: true });
  });
}
