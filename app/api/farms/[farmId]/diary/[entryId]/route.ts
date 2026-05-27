/**
 * GET    /api/farms/[farmId]/diary/[entryId]  — get entry
 * PUT    /api/farms/[farmId]/diary/[entryId]  — edit entry (author or manager+)
 * DELETE /api/farms/[farmId]/diary/[entryId]  — delete entry (author or manager+)
 */

import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, diaryEntries } from "@/db";
import { withFarmAccess, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string; entryId: string } };

async function getEntry(farmId: string, entryId: string) {
  const [entry] = await db
    .select()
    .from(diaryEntries)
    .where(and(eq(diaryEntries.id, entryId), eq(diaryEntries.farmId, farmId)))
    .limit(1);
  return entry;
}

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const entry = await getEntry(farm.id, params.entryId);
    if (!entry) return err(API_ERRORS.ENTRY_NOT_FOUND, "Entry not found", 404);
    return ok(entry);
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user, member }) => {
    const entry = await getEntry(farm.id, params.entryId);
    if (!entry) return err(API_ERRORS.ENTRY_NOT_FOUND, "Entry not found", 404);

    // Only the author or a manager+ can edit
    const canEdit =
      entry.authorId === user.id ||
      member.role === "manager" ||
      member.role === "owner";

    if (!canEdit) {
      return err(API_ERRORS.FORBIDDEN, "You can only edit your own entries", 403);
    }

    const body = await req.json();
    const { entryDate, category, title, notes, photoUrls } = body;

    const [updated] = await db
      .update(diaryEntries)
      .set({
        ...(entryDate !== undefined && { entryDate }),
        ...(category !== undefined && { category }),
        ...(title !== undefined && { title }),
        ...(notes !== undefined && { notes }),
        ...(photoUrls !== undefined && { photoUrls }),
        updatedAt: new Date(),
      })
      .where(eq(diaryEntries.id, params.entryId))
      .returning();

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user, member }) => {
    const entry = await getEntry(farm.id, params.entryId);
    if (!entry) return err(API_ERRORS.ENTRY_NOT_FOUND, "Entry not found", 404);

    const canDelete =
      entry.authorId === user.id ||
      member.role === "manager" ||
      member.role === "owner";

    if (!canDelete) {
      return err(API_ERRORS.FORBIDDEN, "You can only delete your own entries", 403);
    }

    await db.delete(diaryEntries).where(eq(diaryEntries.id, params.entryId));
    return ok({ deleted: true });
  });
}
