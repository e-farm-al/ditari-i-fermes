/**
 * GET /api/cron/send-reminders
 *
 * Called by Vercel Cron at 06:00 AM daily.
 * Finds all pending reminders due today, sends Web Push to all
 * subscribed devices of each farm member, and logs the result.
 *
 * Vercel Cron config lives in vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/send-reminders", "schedule": "0 6 * * *" }]
 * }
 *
 * The CRON_SECRET env var protects this endpoint from public access.
 */

import { NextRequest } from "next/server";
import { eq, and, lte } from "drizzle-orm";
import webpush from "web-push";
import { db, reminders, farmMembers, pushSubscriptions, notificationLog } from "@/db";
import { ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

export async function GET(req: NextRequest) {
  // Verify cron secret so only Vercel can trigger this
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return err(API_ERRORS.UNAUTHENTICATED, "Unauthorized", 401);
  }

  // Configure VAPID inside the handler so env vars are available at runtime
  webpush.setVapidDetails(
    "mailto:kevin@farmdiary.al",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Find all pending reminders due today or overdue
  const dueReminders = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.status, "pending"),
        lte(reminders.dueDate, today)
      )
    );

  let sent = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    // Get all member subscriptions for this farm
    const memberSubs = await db
      .select({ subscription: pushSubscriptions })
      .from(farmMembers)
      .innerJoin(
        pushSubscriptions,
        eq(farmMembers.userId, pushSubscriptions.userId)
      )
      .where(eq(farmMembers.farmId, reminder.farmId));

    for (const { subscription } of memberSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.authKey },
          },
          JSON.stringify({
            title: "Farm Diary",
            body: reminder.title,
            data: {
              farmId: reminder.farmId,
              reminderId: reminder.id,
              subjectType: reminder.subjectType,
              subjectId: reminder.subjectId,
            },
          })
        );

        await db.insert(notificationLog).values({
          reminderId: reminder.id,
          subscriptionId: subscription.id,
          status: "sent",
        });

        sent++;
      } catch (e: any) {
        await db.insert(notificationLog).values({
          reminderId: reminder.id,
          subscriptionId: subscription.id,
          status: "failed",
          errorMessage: e?.message ?? "Unknown error",
        });

        failed++;
      }
    }

    // Mark reminder as sent (or advance repeat schedule)
    if (reminder.repeatType === "none") {
      await db
        .update(reminders)
        .set({ status: "sent", updatedAt: new Date() })
        .where(eq(reminders.id, reminder.id));
    } else {
      // Advance due date by repeat interval
      const next = advanceDueDate(
        reminder.dueDate,
        reminder.repeatType,
        reminder.repeatInterval
      );

      const expired =
        reminder.repeatEndDate && next > reminder.repeatEndDate;

      await db
        .update(reminders)
        .set({
          dueDate: next,
          status: expired ? "sent" : "pending",
          updatedAt: new Date(),
        })
        .where(eq(reminders.id, reminder.id));
    }
  }

  return ok({ processed: dueReminders.length, sent, failed });
}

// Advance a date string (YYYY-MM-DD) by N units of repeatType
function advanceDueDate(
  dateStr: string,
  repeatType: string,
  interval: number
): string {
  const date = new Date(dateStr);
  switch (repeatType) {
    case "daily":
      date.setDate(date.getDate() + interval);
      break;
    case "weekly":
      date.setDate(date.getDate() + interval * 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + interval);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + interval);
      break;
  }
  return date.toISOString().split("T")[0];
}
