/**
 * GET  /api/farms/[farmId]/poultry  — list flocks
 * POST /api/farms/[farmId]/poultry  — add flock (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, poultryFlocks } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "active";

    const conditions = [eq(poultryFlocks.farmId, farm.id)];
    if (status) conditions.push(eq(poultryFlocks.status, status as any));

    const rows = await db.select().from(poultryFlocks).where(and(...conditions));
    return ok(rows);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const body = await req.json();
    const {
      name, species, breed, purpose, currentCount,
      dateAcquired, acquisitionAgeWeeks, sectionId, notes,
    } = body;

    if (!name || !species || !purpose || !dateAcquired) {
      return err(
        API_ERRORS.VALIDATION_ERROR,
        "name, species, purpose, and dateAcquired are required",
        422
      );
    }

    const [flock] = await db
      .insert(poultryFlocks)
      .values({
        farmId: farm.id,
        name, species, breed, purpose,
        currentCount: currentCount ?? 0,
        dateAcquired, acquisitionAgeWeeks, sectionId, notes,
      })
      .returning();

    return ok(flock, 201);
  });
}
