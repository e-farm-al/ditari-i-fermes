import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, farmMembers, reminders } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import RemindersClient from "./RemindersClient";
import NotificationBanner from "../NotificationBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kujtesa — Ditari i Fermës",
  description: "Menaxhoni kujtesa për inspektime dhe aktivitete të fermës",
};

export default async function RemindersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  const farmId = membership.farmId;

  const pendingRows = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.farmId, farmId), eq(reminders.status, "pending")))
    .orderBy(reminders.dueDate);

  const doneRows = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.farmId, farmId), eq(reminders.status, "completed")))
    .orderBy(desc(reminders.updatedAt))
    .limit(10);

  const serialized = (rows: typeof pendingRows) =>
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      dueDate: r.dueDate as string,
      dueTime: r.dueTime as string | null,
      repeatType: r.repeatType,
      status: r.status,
      updatedAt: r.updatedAt.toISOString(),
    }));

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
            <Bell className="h-4 w-4 text-sky-600" strokeWidth={1.5} />
          </div>
          <span className="text-base font-bold text-gray-900">Kujtesa</span>
        </div>
        <Link
          href="/reminders/new"
          className="flex h-10 items-center gap-1.5 rounded-xl bg-farm-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-farm-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          E re
        </Link>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4 space-y-4">
        <NotificationBanner />
        <RemindersClient
          farmId={farmId}
          pending={serialized(pendingRows)}
          done={serialized(doneRows)}
        />
      </main>
    </div>
  );
}
