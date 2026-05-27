import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db, farmMembers, hives, hiveInspections } from "@/db";
import { eq, and } from "drizzle-orm";
import EditInspectionForm from "./EditInspectionForm";

export default async function EditInspectionPage({
  params,
}: {
  params: { id: string; inspectionId: string };
}) {
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

  const [inspection] = await db
    .select()
    .from(hiveInspections)
    .where(
      and(
        eq(hiveInspections.id, params.inspectionId),
        eq(hiveInspections.hiveId, hive.id),
      ),
    )
    .limit(1);

  if (!inspection) notFound();

  return (
    <EditInspectionForm
      farmId={membership.farmId}
      hiveId={hive.id}
      hiveCode={hive.hiveCode}
      inspection={inspection}
    />
  );
}
