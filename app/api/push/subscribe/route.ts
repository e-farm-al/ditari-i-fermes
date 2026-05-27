/**
 * POST /api/push/subscribe    — save browser push subscription
 * DELETE /api/push/subscribe  — remove push subscription (logout / revoke)
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, pushSubscriptions } from "@/db";
import { withAuth, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

export async function POST(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const body = await req.json();
    const { endpoint, p256dh, auth, deviceInfo } = body;

    if (!endpoint || !p256dh || !auth) {
      return err(
        API_ERRORS.VALIDATION_ERROR,
        "endpoint, p256dh, and auth are required",
        422
      );
    }

    // Upsert — same endpoint may re-subscribe after token rotation
    const [subscription] = await db
      .insert(pushSubscriptions)
      .values({
        userId: user.id,
        endpoint, p256dh, authKey: auth, deviceInfo,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [pushSubscriptions.endpoint],
        set: {
          p256dh, authKey: auth, deviceInfo,
          lastUsedAt: new Date(),
        },
      })
      .returning();

    return ok(subscription, 201);
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return err(API_ERRORS.VALIDATION_ERROR, "endpoint is required", 422);
    }

    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    return ok({ deleted: true });
  });
}
