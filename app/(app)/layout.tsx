import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, farms, farmMembers } from "@/db";
import { eq } from "drizzle-orm";
import BottomNav from "./BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  let farmType = "mixed";
  if (membership) {
    const [farm] = await db
      .select({ farmType: farms.farmType })
      .from(farms)
      .where(eq(farms.id, membership.farmId))
      .limit(1);
    if (farm?.farmType) farmType = farm.farmType;
  }

  return (
    <>
      {children}
      <BottomNav farmType={farmType} />
    </>
  );
}
