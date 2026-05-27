import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db, farmMembers, hives } from "@/db";
import { eq, and } from "drizzle-orm";
import EditHiveForm from "./EditHiveForm";

export default async function EditHivePage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  const [hive] = await db
    .select()
    .from(hives)
    .where(and(eq(hives.id, params.id), eq(hives.farmId, membership.farmId)))
    .limit(1);

  if (!hive) notFound();

  return <EditHiveForm farmId={membership.farmId} hive={hive} />;
}
