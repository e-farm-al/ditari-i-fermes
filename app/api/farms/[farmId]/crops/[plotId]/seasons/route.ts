/**
 * GET  /api/farms/[farmId]/crops/[plotId]/seasons  — list seasons for a plot
 * POST /api/farms/[farmId]/crops/[plotId]/seasons  — start a new crop season (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, cropPlots, cropSeasons } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; plotId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const [plot] = await db
      .select({ id: cropPlots.id })
      .from(cropPlots)
      .where(and(eq(cropPlots.id, params.plotId), eq(cropPlots.farmId, farm.id)))
      .limit(1);

    if (!plot) return err(API_ERRORS.PLOT_NOT_FOUND, "Plot not found", 404);

    const seasons = await db
      .select()
      .from(cropSeasons)
      .where(eq(cropSeasons.plotId, params.plotId))
      .orderBy(desc(cropSeasons.seasonYear));

    return ok(seasons);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user }) => {
    const [plot] = await db
      .select({ id: cropPlots.id })
      .from(cropPlots)
      .where(and(eq(cropPlots.id, params.plotId), eq(cropPlots.farmId, farm.id)))
      .limit(1);

    if (!plot) return err(API_ERRORS.PLOT_NOT_FOUND, "Plot not found", 404);

    const body = await req.json();
    const {
      cropType, variety, seasonYear,
      plantingDate, expectedHarvestDate, seedQuantityKg, notes,
    } = body;

    if (!cropType || !seasonYear) {
      return err(API_ERRORS.VALIDATION_ERROR, "cropType and seasonYear are required", 422);
    }

    const [season] = await db
      .insert(cropSeasons)
      .values({
        plotId: params.plotId,
        createdBy: user.id,
        cropType, variety, seasonYear,
        plantingDate, expectedHarvestDate, seedQuantityKg, notes,
        status: "planned",
      })
      .returning();

    return ok(season, 201);
  });
}
