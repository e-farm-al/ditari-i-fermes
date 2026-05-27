/**
 * GET  /api/farms/[farmId]/crops  — list crop plots
 * POST /api/farms/[farmId]/crops  — add plot (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, cropPlots } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "active";

    const conditions = [eq(cropPlots.farmId, farm.id)];
    if (status) conditions.push(eq(cropPlots.status, status as any));

    const rows = await db.select().from(cropPlots).where(and(...conditions));
    return ok(rows);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const body = await req.json();
    const { name, areaHectares, soilType, irrigationType, sectionId, coordinates, notes } = body;

    if (!name?.trim()) {
      return err(API_ERRORS.VALIDATION_ERROR, "Plot name is required", 422);
    }

    const [plot] = await db
      .insert(cropPlots)
      .values({
        farmId: farm.id,
        name: name.trim(),
        areaHectares, soilType,
        irrigationType: irrigationType ?? "none",
        sectionId, coordinates, notes,
      })
      .returning();

    return ok(plot, 201);
  });
}
