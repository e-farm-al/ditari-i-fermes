/**
 * GET  /api/farms/[farmId]/sections  — list sections
 * POST /api/farms/[farmId]/sections  — create section (worker+)
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, farmSections } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const sections = await db
      .select()
      .from(farmSections)
      .where(eq(farmSections.farmId, farm.id));
    return ok(sections);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const body = await req.json();
    const { name, type, description } = body;

    if (!name?.trim() || !type) {
      return err(API_ERRORS.VALIDATION_ERROR, "name and type are required", 422);
    }

    const [section] = await db
      .insert(farmSections)
      .values({ farmId: farm.id, name: name.trim(), type, description })
      .returning();

    return ok(section, 201);
  });
}
