/**
 * GET  /api/farms/[farmId]/crops/[plotId]/seasons/[seasonId]/harvests
 * POST /api/farms/[farmId]/crops/[plotId]/seasons/[seasonId]/harvests
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, cropPlots, cropSeasons, cropHarvests } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; plotId: string; seasonId: string } };

async function validateSeason(farmId: string, plotId: string, seasonId: string) {
  const [plot] = await db
    .select({ id: cropPlots.id })
    .from(cropPlots)
    .where(and(eq(cropPlots.id, plotId), eq(cropPlots.farmId, farmId)))
    .limit(1);
  if (!plot) return null;

  const [season] = await db
    .select()
    .from(cropSeasons)
    .where(and(eq(cropSeasons.id, seasonId), eq(cropSeasons.plotId, plotId)))
    .limit(1);
  return season ?? null;
}

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const season = await validateSeason(farm.id, params.plotId, params.seasonId);
    if (!season) return err(API_ERRORS.SEASON_NOT_FOUND, "Season not found", 404);

    const harvests = await db
      .select()
      .from(cropHarvests)
      .where(eq(cropHarvests.seasonId, params.seasonId))
      .orderBy(desc(cropHarvests.harvestDate));

    return ok(harvests);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user }) => {
    const season = await validateSeason(farm.id, params.plotId, params.seasonId);
    if (!season) return err(API_ERRORS.SEASON_NOT_FOUND, "Season not found", 404);

    const body = await req.json();
    const { harvestDate, quantityKg, quality, storageLocation, notes } = body;

    if (!harvestDate || !quantityKg) {
      return err(API_ERRORS.VALIDATION_ERROR, "harvestDate and quantityKg are required", 422);
    }

    const [harvest] = await db
      .insert(cropHarvests)
      .values({
        seasonId: params.seasonId,
        harvestedBy: user.id,
        harvestDate, quantityKg, quality, storageLocation, notes,
      })
      .returning();

    // Auto-mark season as harvested
    await db
      .update(cropSeasons)
      .set({ status: "harvested", actualHarvestDate: harvestDate, updatedAt: new Date() })
      .where(eq(cropSeasons.id, params.seasonId));

    return ok(harvest, 201);
  });
}
