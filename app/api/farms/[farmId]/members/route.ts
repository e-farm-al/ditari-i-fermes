/**
 * GET  /api/farms/[farmId]/members       — list all members + roles
 * POST /api/farms/[farmId]/members       — invite a user by phone or email (manager+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, farmMembers, users } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const rows = await db
      .select({
        member: farmMembers,
        user: {
          id: users.id,
          name: users.name,
          phone: users.phone,
          email: users.email,
        },
      })
      .from(farmMembers)
      .innerJoin(users, eq(farmMembers.userId, users.id))
      .where(eq(farmMembers.farmId, farm.id));

    return ok(rows);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "manager", async ({ farm, user }) => {
    const body = await req.json();
    const { phone, email, role = "worker" } = body;

    if (!phone && !email) {
      return err(
        API_ERRORS.VALIDATION_ERROR,
        "Either phone or email is required",
        422
      );
    }

    const validRoles = ["manager", "worker", "viewer"];
    if (!validRoles.includes(role)) {
      return err(
        API_ERRORS.VALIDATION_ERROR,
        "Role must be one of: manager, worker, viewer",
        422
      );
    }

    // Find target user
    const conditions = phone
      ? eq(users.phone, phone)
      : eq(users.email, email);

    const [targetUser] = await db
      .select()
      .from(users)
      .where(conditions)
      .limit(1);

    if (!targetUser) {
      return err(
        API_ERRORS.USER_NOT_FOUND,
        "No user found with that phone or email",
        404
      );
    }

    // Check not already a member
    const [existing] = await db
      .select()
      .from(farmMembers)
      .where(
        and(
          eq(farmMembers.farmId, farm.id),
          eq(farmMembers.userId, targetUser.id)
        )
      )
      .limit(1);

    if (existing) {
      return err(
        API_ERRORS.DUPLICATE_RECORD,
        "This user is already a member of the farm",
        409
      );
    }

    const [member] = await db
      .insert(farmMembers)
      .values({
        farmId: farm.id,
        userId: targetUser.id,
        role,
        invitedBy: user.id,
      })
      .returning();

    return ok({ member, user: targetUser }, 201);
  });
}
