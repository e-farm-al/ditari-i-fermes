import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, farmMembers } from "@/db";
import { eq } from "drizzle-orm";
import NewReminderForm from "./NewReminderForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kujtesë e re — Ditari i Fermës",
};

export default async function NewReminderPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  return <NewReminderForm farmId={membership.farmId} />;
}
