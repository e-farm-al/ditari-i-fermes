/**
 * GET  /api/farms/[farmId]/livestock  — list animals (filter by species, status)
 * POST /api/farms/[farmId]/livestock  — add an animal (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, livestock } from "@/db";
import { withFarmAccess, ok, err, parsePagination } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const url = new URL(req.url);
    const species = url.searchParams.get("species");
    const status = url.searchParams.get("status") ?? "active";
    const { page, pageSize, offset } = parsePagination(req);

    const conditions = [eq(livestock.farmId, farm.id)];
    if (species) conditions.push(eq(livestock.species, species as any));
    if (status) conditions.push(eq(livestock.status, status as any));

    const rows = await db
      .select()
      .from(livestock)
      .where(and(...conditions))
      .limit(pageSize)
      .offset(offset);

    return ok({ items: rows, page, pageSize });
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const body = await req.json();
    const {
      species, tagNumber, name, breed, sex,
      dateOfBirth, dateAcquired, acquisitionType,
      motherId, fatherId, sectionId, notes,
    } = body;

    if (!species || !sex || !dateAcquired) {
      return err(
        API_ERRORS.VALIDATION_ERROR,
        "species, sex, and dateAcquired are required",
        422
      );
    }

    const [animal] = await db
      .insert(livestock)
      .values({
        farmId: farm.id,
        species, tagNumber, name, breed, sex,
        dateOfBirth, dateAcquired,
        acquisitionType: acquisitionType ?? "born_on_farm",
        motherId, fatherId, sectionId, notes,
      })
      .returning();

    return ok(animal, 201);
  });
}
