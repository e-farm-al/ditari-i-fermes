import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, farmMembers } from "@/db";
import { eq } from "drizzle-orm";
import NewHiveForm from "./NewHiveForm";

export default async function NewHivePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  return <NewHiveForm farmId={membership.farmId} />;
}
