import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, farmMembers, reminders } from "@/db";
import { eq, and } from "drizzle-orm";
import EditReminderForm from "./EditReminderForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ndrysho detyrën — Ditari i Fermës",
};

type Props = { params: { id: string } };

export default async function EditReminderPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  const [reminder] = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, params.id), eq(reminders.farmId, membership.farmId)))
    .limit(1);

  if (!reminder) redirect("/reminders");

  return (
    <EditReminderForm
      farmId={membership.farmId}
      reminder={{
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate as string,
        dueTime: reminder.dueTime as string | null,
        repeatType: reminder.repeatType,
        status: reminder.status,
      }}
    />
  );
}
