/**
 * GET  /api/farms/[farmId]/crops/[plotId]/seasons/[seasonId]/activities
 * POST /api/farms/[farmId]/crops/[plotId]/seasons/[seasonId]/activities
 */

import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, cropPlots, cropSeasons, cropActivities } from "@/db";
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

    const activities = await db
      .select()
      .from(cropActivities)
      .where(eq(cropActivities.seasonId, params.seasonId))
      .orderBy(desc(cropActivities.activityDate));

    return ok(activities);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user }) => {
    const season = await validateSeason(farm.id, params.plotId, params.seasonId);
    if (!season) return err(API_ERRORS.SEASON_NOT_FOUND, "Season not found", 404);

    const body = await req.json();
    const { activityDate, activityType, productUsed, quantity, unit, notes } = body;

    if (!activityDate || !activityType) {
      return err(API_ERRORS.VALIDATION_ERROR, "activityDate and activityType are required", 422);
    }

    const [activity] = await db
      .insert(cropActivities)
      .values({
        seasonId: params.seasonId,
        performedBy: user.id,
        activityDate, activityType, productUsed, quantity, unit, notes,
      })
      .returning();

    return ok(activity, 201);
  });
}
