/**
 * PUT    /api/farms/[farmId]/reminders/[reminderId]  — update reminder (worker+)
 * DELETE /api/farms/[farmId]/reminders/[reminderId]  — delete reminder (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, reminders } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; reminderId: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const [reminder] = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.id, params.reminderId), eq(reminders.farmId, farm.id)))
      .limit(1);

    if (!reminder) return err(API_ERRORS.REMINDER_NOT_FOUND, "Reminder not found", 404);

    const body = await req.json();
    const { title, description, dueDate, dueTime, repeatType, repeatInterval, repeatEndDate, status } = body;

    const [updated] = await db
      .update(reminders)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate }),
        ...(dueTime !== undefined && { dueTime }),
        ...(repeatType !== undefined && { repeatType }),
        ...(repeatInterval !== undefined && { repeatInterval }),
        ...(repeatEndDate !== undefined && { repeatEndDate }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      })
      .where(eq(reminders.id, params.reminderId))
      .returning();

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm }) => {
    const [reminder] = await db
      .select({ id: reminders.id })
      .from(reminders)
      .where(and(eq(reminders.id, params.reminderId), eq(reminders.farmId, farm.id)))
      .limit(1);

    if (!reminder) return err(API_ERRORS.REMINDER_NOT_FOUND, "Reminder not found", 404);

    await db.delete(reminders).where(eq(reminders.id, params.reminderId));
    return ok({ deleted: true });
  });
}
