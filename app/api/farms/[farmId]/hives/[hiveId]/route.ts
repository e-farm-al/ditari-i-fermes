/**
 * GET    /api/farms/[farmId]/hives/[hiveId]  — hive detail
 * PUT    /api/farms/[farmId]/hives/[hiveId]  — update hive (worker+)
 * DELETE /api/farms/[farmId]/hives/[hiveId]  — delete hive (manager+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, hives } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; hiveId: string } };

async function getHive(farmId: string, hiveId: string) {
  const [hive] = await db
    .select()
    .from(hives)
    .where(and(eq(hives.id, hiveId), eq(hives.farmId, farmId)))
    .limit(1);
  return hive;
}

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const hive = await getHive(farm.id, params.hiveId);
    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);
    return ok(hive);
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const hive = await getHive(farm.id, params.hiveId);
    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);

    const body = await req.json();
    const {
      hiveCode, hiveType, installationDate, locationNotes, sectionId, status, notes,
      queenIntroduced, queenYearColor, queenSource,
    } = body;

    const [updated] = await db
      .update(hives)
      .set({
        ...(hiveCode !== undefined && { hiveCode }),
        ...(hiveType !== undefined && { hiveType }),
        ...(installationDate !== undefined && { installationDate }),
        ...(locationNotes !== undefined && { locationNotes }),
        ...(sectionId !== undefined && { sectionId }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(queenIntroduced !== undefined && { queenIntroduced }),
        ...(queenYearColor !== undefined && { queenYearColor }),
        ...(queenSource !== undefined && { queenSource }),
        updatedAt: new Date(),
      })
      .where(eq(hives.id, params.hiveId))
      .returning();

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "manager", async ({ farm }) => {
    const hive = await getHive(farm.id, params.hiveId);
    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);

    await db.delete(hives).where(eq(hives.id, params.hiveId));
    return ok({ deleted: true });
  });
}
