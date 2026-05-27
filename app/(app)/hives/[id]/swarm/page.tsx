import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db, farmMembers, hives } from "@/db";
import { eq, and } from "drizzle-orm";
import SwarmForm from "./SwarmForm";

export default async function SwarmPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  const [hive] = await db
    .select({ id: hives.id, hiveCode: hives.hiveCode })
    .from(hives)
    .where(and(eq(hives.id, params.id), eq(hives.farmId, membership.farmId)))
    .limit(1);

  if (!hive) notFound();

  // Provide other active hives for the "new hive" selector
  const otherHives = await db
    .select({ id: hives.id, hiveCode: hives.hiveCode })
    .from(hives)
    .where(and(eq(hives.farmId, membership.farmId), eq(hives.status, "active")));

  return (
    <SwarmForm
      farmId={membership.farmId}
      hiveId={hive.id}
      hiveCode={hive.hiveCode}
      allHives={otherHives.filter((h) => h.id !== hive.id)}
    />
  );
}
