/**
 * GET    /api/farms/[farmId]  — get farm details
 * PUT    /api/farms/[farmId]  — update farm (manager+)
 * DELETE /api/farms/[farmId]  — delete farm (owner only)
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, farms } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    return ok(farm);
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "manager", async ({ farm }) => {
    const body = await req.json();
    const { name, region, location, sizeHectares } = body;

    const [updated] = await db
      .update(farms)
      .set({
        ...(name && { name: name.trim() }),
        ...(region !== undefined && { region }),
        ...(location !== undefined && { location }),
        ...(sizeHectares !== undefined && { sizeHectares }),
        updatedAt: new Date(),
      })
      .where(eq(farms.id, farm.id))
      .returning();

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "owner", async ({ farm }) => {
    await db.delete(farms).where(eq(farms.id, farm.id));
    return ok({ deleted: true });
  });
}
