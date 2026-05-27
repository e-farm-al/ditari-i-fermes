/**
 * GET  /api/farms  — list all farms the user is a member of
 * POST /api/farms  — create a new farm (caller becomes owner)
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, farms, farmMembers } from "@/db";
import { withAuth, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

export async function GET(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    // Return every farm the user belongs to, with their role
    const rows = await db
      .select({
        farm: farms,
        role: farmMembers.role,
        joinedAt: farmMembers.joinedAt,
      })
      .from(farmMembers)
      .innerJoin(farms, eq(farmMembers.farmId, farms.id))
      .where(eq(farmMembers.userId, user.id));

    return ok(rows);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const body = await req.json();
    const { name, region, location, sizeHectares } = body;

    if (!name?.trim()) {
      return err(API_ERRORS.VALIDATION_ERROR, "Farm name is required", 422);
    }

    // Create farm + owner membership in a transaction
    const result = await db.transaction(async (tx) => {
      const [farm] = await tx
        .insert(farms)
        .values({
          ownerId: user.id,
          name: name.trim(),
          region,
          location,
          sizeHectares,
        })
        .returning();

      const [member] = await tx
        .insert(farmMembers)
        .values({
          farmId: farm.id,
          userId: user.id,
          role: "owner",
        })
        .returning();

      return { farm, member };
    });

    return ok(result, 201);
  });
}
