/**
 * GET  /api/farms/[farmId]/reminders  — list reminders (filter by status)
 * POST /api/farms/[farmId]/reminders  — create reminder (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and, gte } from "drizzle-orm";
import { db, reminders } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "pending";

    const conditions = [eq(reminders.farmId, farm.id)];
    if (status) conditions.push(eq(reminders.status, status as any));

    const rows = await db
      .select()
      .from(reminders)
      .where(and(...conditions))
      .orderBy(reminders.dueDate);

    return ok(rows);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user }) => {
    const body = await req.json();
    const {
      title, description, dueDate, dueTime,
      repeatType, repeatInterval, repeatEndDate,
      subjectType, subjectId,
    } = body;

    if (!title?.trim() || !dueDate) {
      return err(API_ERRORS.VALIDATION_ERROR, "title and dueDate are required", 422);
    }

    const [reminder] = await db
      .insert(reminders)
      .values({
        farmId: farm.id,
        createdBy: user.id,
        title: title.trim(), description,
        dueDate, dueTime,
        repeatType: repeatType ?? "none",
        repeatInterval: repeatInterval ?? 1,
        repeatEndDate,
        subjectType, subjectId,
        status: "pending",
      })
      .returning();

    return ok(reminder, 201);
  });
}
