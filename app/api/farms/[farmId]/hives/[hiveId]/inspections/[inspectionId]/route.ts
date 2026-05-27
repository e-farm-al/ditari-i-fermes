/**
 * GET    /api/farms/[farmId]/hives/[hiveId]/inspections/[inspectionId]
 * PUT    /api/farms/[farmId]/hives/[hiveId]/inspections/[inspectionId]
 * DELETE /api/farms/[farmId]/hives/[hiveId]/inspections/[inspectionId]
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, hives, hiveInspections } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = {
  params: { farmId: string; hiveId: string; inspectionId: string };
};

async function resolveInspection(farmId: string, hiveId: string, inspectionId: string) {
  const [hive] = await db
    .select({ id: hives.id })
    .from(hives)
    .where(and(eq(hives.id, hiveId), eq(hives.farmId, farmId)))
    .limit(1);

  if (!hive) return { hive: null, inspection: null };

  const [inspection] = await db
    .select()
    .from(hiveInspections)
    .where(
      and(
        eq(hiveInspections.id, inspectionId),
        eq(hiveInspections.hiveId, hiveId),
      ),
    )
    .limit(1);

  return { hive, inspection: inspection ?? null };
}

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const { hive, inspection } = await resolveInspection(
      farm.id, params.hiveId, params.inspectionId,
    );
    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);
    if (!inspection) return err(API_ERRORS.INSPECTION_NOT_FOUND, "Inspection not found", 404);
    return ok(inspection);
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const { hive, inspection } = await resolveInspection(
      farm.id, params.hiveId, params.inspectionId,
    );
    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);
    if (!inspection) return err(API_ERRORS.INSPECTION_NOT_FOUND, "Inspection not found", 404);

    const body = await req.json();
    const {
      inspectionDate, queenPresent, queenStatus, colonyStrength,
      framesWithBees, framesWithBrood, honeyStores,
      diseaseSigns, diseaseNotes, temperament, treatmentApplied,
      supersCount, notes,
    } = body;

    const [updated] = await db
      .update(hiveInspections)
      .set({
        inspectionDate:   inspectionDate   !== undefined ? inspectionDate   : inspection.inspectionDate,
        queenPresent:     queenPresent     !== undefined ? queenPresent     : inspection.queenPresent,
        queenStatus:      queenStatus      !== undefined ? queenStatus      : inspection.queenStatus,
        colonyStrength:   colonyStrength   !== undefined ? colonyStrength   : inspection.colonyStrength,
        framesWithBees:   framesWithBees   !== undefined ? framesWithBees   : inspection.framesWithBees,
        framesWithBrood:  framesWithBrood  !== undefined ? framesWithBrood  : inspection.framesWithBrood,
        honeyStores:      honeyStores      !== undefined ? honeyStores      : inspection.honeyStores,
        diseaseSigns:     diseaseSigns     !== undefined ? diseaseSigns     : inspection.diseaseSigns,
        diseaseNotes:     diseaseNotes     !== undefined ? diseaseNotes     : inspection.diseaseNotes,
        temperament:      temperament      !== undefined ? temperament      : inspection.temperament,
        treatmentApplied: treatmentApplied !== undefined ? treatmentApplied : inspection.treatmentApplied,
        supersCount:      supersCount      !== undefined ? supersCount      : inspection.supersCount,
        notes:            notes            !== undefined ? notes            : inspection.notes,
        updatedAt:        new Date(),
      })
      .where(eq(hiveInspections.id, params.inspectionId))
      .returning();

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const { hive, inspection } = await resolveInspection(
      farm.id, params.hiveId, params.inspectionId,
    );
    if (!hive) return err(API_ERRORS.HIVE_NOT_FOUND, "Hive not found", 404);
    if (!inspection) return err(API_ERRORS.INSPECTION_NOT_FOUND, "Inspection not found", 404);

    await db
      .delete(hiveInspections)
      .where(eq(hiveInspections.id, params.inspectionId));

    return ok({ deleted: true });
  });
}
