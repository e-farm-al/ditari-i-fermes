import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, farmMembers, hives, hiveInspections } from "@/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Flower2, Plus, ChevronRight, AlertTriangle,
  Leaf, Settings,
} from "lucide-react";
import LogoutButton from "../LogoutButton";

const STRENGTH_LABEL: Record<string, string> = {
  very_weak: "Shumë e dobët",
  weak: "E dobët",
  moderate: "Mesatare",
  strong: "E fortë",
  very_strong: "Shumë e fortë",
};

const STRENGTH_COLOR: Record<string, string> = {
  very_weak: "bg-red-100 text-red-700",
  weak: "bg-orange-100 text-orange-700",
  moderate: "bg-yellow-100 text-yellow-700",
  strong: "bg-emerald-100 text-emerald-700",
  very_strong: "bg-green-100 text-green-700",
};

const HIVE_TYPE_LABEL: Record<string, string> = {
  langstroth: "Langstroth",
  dadant: "Dadant",
  top_bar: "Top Bar",
  warre: "Warré",
  other: "Tjetër",
};

export default async function HivesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  const farmHives = await db
    .select()
    .from(hives)
    .where(and(eq(hives.farmId, membership.farmId), eq(hives.status, "active")));

  // Build a map of hiveId → last inspection
  const hiveIds = farmHives.map((h) => h.id);
  const lastInspMap: Record<string, { date: string; strength: string | null }> = {};

  if (hiveIds.length > 0) {
    const allInsp = await db
      .select({
        hiveId: hiveInspections.hiveId,
        inspectionDate: hiveInspections.inspectionDate,
        colonyStrength: hiveInspections.colonyStrength,
      })
      .from(hiveInspections)
      .where(inArray(hiveInspections.hiveId, hiveIds))
      .orderBy(desc(hiveInspections.inspectionDate));

    for (const r of allInsp) {
      if (!lastInspMap[r.hiveId]) {
        lastInspMap[r.hiveId] = { date: r.inspectionDate, strength: r.colonyStrength };
      }
    }
  }

  const todayMs = new Date().setHours(0, 0, 0, 0);

  function daysSince(dateStr: string) {
    return Math.floor((todayMs - new Date(dateStr).getTime()) / 86_400_000);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-farm-600"
          >
            <Leaf className="h-4 w-4 text-white" strokeWidth={1.5} />
          </Link>
          <span className="text-sm font-bold text-farm-900">Zgjojt</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <Settings className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Zgjojt e mia</h1>
            <p className="text-xs text-gray-400">
              {farmHives.length}{" "}
              {farmHives.length === 1 ? "zgjo aktive" : "zgjoje aktive"}
            </p>
          </div>
          <Link
            href="/hives/new"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-farm-600 px-4 text-sm font-semibold text-white hover:bg-farm-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Shto
          </Link>
        </div>

        {farmHives.length === 0 ? (
          <div className="mt-12 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-8 text-center">
            <Flower2 className="mx-auto h-10 w-10 text-amber-400" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-amber-700">
              Nuk keni zgjoje të regjistruara
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Shtoni zgjojen e parë për të filluar.
            </p>
            <Link
              href="/hives/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-farm-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-farm-700"
            >
              <Plus className="h-4 w-4" />
              Shto zgjo
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {farmHives.map((hive) => {
              const last = lastInspMap[hive.id];
              const days = last ? daysSince(last.date) : null;
              const overdue = days === null || days > 14;
              const strength = last?.strength ?? null;

              return (
                <Link
                  key={hive.id}
                  href={`/hives/${hive.id}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:ring-farm-200 hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                    <Flower2 className="h-6 w-6 text-amber-500" strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{hive.hiveCode}</p>
                      {overdue && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 flex-shrink-0 text-red-500"
                          strokeWidth={2}
                        />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {HIVE_TYPE_LABEL[hive.hiveType]}
                      {hive.locationNotes ? ` · ${hive.locationNotes}` : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {strength ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STRENGTH_COLOR[strength]}`}
                        >
                          {STRENGTH_LABEL[strength]}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                          Pa vlerësim
                        </span>
                      )}

                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          days === null
                            ? "bg-red-50 text-red-600"
                            : days > 14
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {days === null
                          ? "Pa inspektim"
                          : days === 0
                          ? "Sot"
                          : days === 1
                          ? "Dje"
                          : `${days} ditë më parë`}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className="h-4 w-4 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
