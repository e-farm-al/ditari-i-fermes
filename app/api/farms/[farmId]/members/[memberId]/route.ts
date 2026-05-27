/**
 * PUT    /api/farms/[farmId]/members/[memberId]  — change role (manager+)
 * DELETE /api/farms/[farmId]/members/[memberId]  — remove member (manager+, or self)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, farmMembers } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; memberId: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "manager", async ({ farm, member: callerMember }) => {
    const body = await req.json();
    const { role } = body;

    const validRoles = ["manager", "worker", "viewer"];
    if (!validRoles.includes(role)) {
      return err(API_ERRORS.VALIDATION_ERROR, "Invalid role", 422);
    }

    // Cannot change the owner's role
    const [target] = await db
      .select()
      .from(farmMembers)
      .where(
        and(
          eq(farmMembers.id, params.memberId),
          eq(farmMembers.farmId, farm.id)
        )
      )
      .limit(1);

    if (!target) {
      return err(API_ERRORS.MEMBER_NOT_FOUND, "Member not found", 404);
    }

    if (target.role === "owner") {
      return err(API_ERRORS.FORBIDDEN, "Cannot change the owner's role", 403);
    }

    const [updated] = await db
      .update(farmMembers)
      .set({ role })
      .where(eq(farmMembers.id, params.memberId))
      .returning();

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm, user, member: callerMember }) => {
    const [target] = await db
      .select()
      .from(farmMembers)
      .where(
        and(
          eq(farmMembers.id, params.memberId),
          eq(farmMembers.farmId, farm.id)
        )
      )
      .limit(1);

    if (!target) {
      return err(API_ERRORS.MEMBER_NOT_FOUND, "Member not found", 404);
    }

    // Only managers+ can remove others; anyone can remove themselves
    const isSelf = target.userId === user.id;
    const isManagerOrAbove =
      callerMember.role === "manager" || callerMember.role === "owner";

    if (!isSelf && !isManagerOrAbove) {
      return err(API_ERRORS.INSUFFICIENT_ROLE, "Only managers can remove other members", 403);
    }

    if (target.role === "owner") {
      return err(API_ERRORS.FORBIDDEN, "Cannot remove the farm owner", 403);
    }

    await db.delete(farmMembers).where(eq(farmMembers.id, params.memberId));
    return ok({ deleted: true });
  });
}
