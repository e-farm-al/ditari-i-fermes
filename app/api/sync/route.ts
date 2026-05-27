/**
 * POST /api/sync
 *
 * Batch sync endpoint for offline-first writes.
 * The client sends an array of queued mutations that happened offline.
 * Each mutation is processed in order and the result (success or error)
 * is returned per-item so the client knows which to retry.
 *
 * Mutation shape:
 * {
 *   id: string;           // client-generated UUID (idempotency key)
 *   farmId: string;
 *   entity: "diary" | "livestock" | "hive" | "flock" | "reminder" | ...
 *   action: "create" | "update" | "delete";
 *   payload: object;      // the data for the action
 *   clientTimestamp: string; // ISO timestamp — used for conflict resolution
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, diaryEntries, livestock, hives, poultryFlocks, reminders, farmMembers } from "@/db";
import { withAuth, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

type SyncMutation = {
  id: string;
  farmId: string;
  entity: string;
  action: "create" | "update" | "delete";
  payload: Record<string, any>;
  clientTimestamp: string;
};

type SyncResult = {
  id: string;        // mutation id
  ok: boolean;
  error?: string;
};

export async function POST(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const body = await req.json();
    const mutations: SyncMutation[] = body.mutations;

    if (!Array.isArray(mutations) || mutations.length === 0) {
      return err(API_ERRORS.VALIDATION_ERROR, "mutations array is required", 422);
    }

    if (mutations.length > 200) {
      return err(API_ERRORS.VALIDATION_ERROR, "Maximum 200 mutations per sync batch", 422);
    }

    const results: SyncResult[] = [];

    for (const mutation of mutations) {
      try {
        // Verify user has write access to this farm
        const [membership] = await db
          .select({ role: farmMembers.role })
          .from(farmMembers)
          .where(
            and(
              eq(farmMembers.farmId, mutation.farmId),
              eq(farmMembers.userId, user.id)
            )
          )
          .limit(1);

        if (!membership || membership.role === "viewer") {
          results.push({ id: mutation.id, ok: false, error: "FORBIDDEN" });
          continue;
        }

        await applyMutation(mutation, user.id);
        results.push({ id: mutation.id, ok: true });
      } catch (e: any) {
        // Log but don't crash the whole batch
        console.error(`[sync] mutation ${mutation.id} failed:`, e?.message);
        results.push({ id: mutation.id, ok: false, error: e?.message ?? "INTERNAL_ERROR" });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    return ok({ results, successCount, failureCount: results.length - successCount });
  });
}

async function applyMutation(mutation: SyncMutation, userId: string) {
  const { farmId, entity, action, payload, clientTimestamp } = mutation;
  const syncedAt = new Date(clientTimestamp);

  switch (entity) {
    case "diary": {
      if (action === "create") {
        await db
          .insert(diaryEntries)
          .values({
            id: payload.id, // client-generated UUID
            farmId,
            authorId: userId,
            entryDate: payload.entryDate,
            category: payload.category ?? "observation",
            subjectType: payload.subjectType,
            subjectId: payload.subjectId,
            title: payload.title,
            notes: payload.notes,
            photoUrls: payload.photoUrls ?? [],
            syncedAt, // marks this as coming from offline
          })
          .onConflictDoNothing(); // already synced — skip
      } else if (action === "update") {
        await db
          .update(diaryEntries)
          .set({ ...payload, syncedAt, updatedAt: new Date() })
          .where(and(eq(diaryEntries.id, payload.id), eq(diaryEntries.farmId, farmId)));
      } else if (action === "delete") {
        await db
          .delete(diaryEntries)
          .where(and(eq(diaryEntries.id, payload.id), eq(diaryEntries.farmId, farmId)));
      }
      break;
    }

    case "livestock": {
      if (action === "create") {
        await db
          .insert(livestock)
          .values({ id: payload.id, farmId, ...payload })
          .onConflictDoNothing();
      } else if (action === "update") {
        await db
          .update(livestock)
          .set({ ...payload, updatedAt: new Date() })
          .where(and(eq(livestock.id, payload.id), eq(livestock.farmId, farmId)));
      }
      break;
    }

    case "reminder": {
      if (action === "create") {
        await db
          .insert(reminders)
          .values({ id: payload.id, farmId, createdBy: userId, ...payload })
          .onConflictDoNothing();
      } else if (action === "update") {
        await db
          .update(reminders)
          .set({ ...payload, updatedAt: new Date() })
          .where(and(eq(reminders.id, payload.id), eq(reminders.farmId, farmId)));
      } else if (action === "delete") {
        await db
          .delete(reminders)
          .where(and(eq(reminders.id, payload.id), eq(reminders.farmId, farmId)));
      }
      break;
    }

    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}
