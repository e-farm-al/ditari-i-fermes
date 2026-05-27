/**
 * GET  /api/farms/[farmId]/diary  — list diary entries (filter by date, category, subject)
 * POST /api/farms/[farmId]/diary  — create diary entry (worker+)
 */

import { NextRequest } from "next/server";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db, diaryEntries } from "@/db";
import { withFarmAccess, ok, err, parsePagination } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type Params = { params: { farmId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "viewer", async ({ farm }) => {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const subjectType = url.searchParams.get("subjectType");
    const subjectId = url.searchParams.get("subjectId");
    const from = url.searchParams.get("from"); // YYYY-MM-DD
    const to = url.searchParams.get("to");
    const { page, pageSize, offset } = parsePagination(req);

    const conditions = [eq(diaryEntries.farmId, farm.id)];
    if (category) conditions.push(eq(diaryEntries.category, category as any));
    if (subjectType) conditions.push(eq(diaryEntries.subjectType, subjectType as any));
    if (subjectId) conditions.push(eq(diaryEntries.subjectId, subjectId));
    if (from) conditions.push(gte(diaryEntries.entryDate, from));
    if (to) conditions.push(lte(diaryEntries.entryDate, to));

    const rows = await db
      .select()
      .from(diaryEntries)
      .where(and(...conditions))
      .orderBy(desc(diaryEntries.entryDate))
      .limit(pageSize)
      .offset(offset);

    return ok({ items: rows, page, pageSize });
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withFarmAccess(req, params.farmId, "worker", async ({ farm, user }) => {
    const body = await req.json();
    const {
      entryDate, category, subjectType, subjectId,
      title, notes, photoUrls, syncedAt,
    } = body;

    if (!entryDate || !notes?.trim()) {
      return err(API_ERRORS.VALIDATION_ERROR, "entryDate and notes are required", 422);
    }

    const [entry] = await db
      .insert(diaryEntries)
      .values({
        farmId: farm.id,
        authorId: user.id,
        entryDate, category: category ?? "observation",
        subjectType, subjectId,
        title, notes: notes.trim(),
        photoUrls: photoUrls ?? [],
        syncedAt: syncedAt ? new Date(syncedAt) : null,
      })
      .returning();

    return ok(entry, 201);
  });
}
