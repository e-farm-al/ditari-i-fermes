import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, farmMembers, hives, hiveInspections, hiveHarvests } from "@/db";
import { eq, and, inArray, desc, gte, ne } from "drizzle-orm";
import Link from "next/link";
import {
  Flower2, Plus, ChevronRight,
  Leaf, Settings, Clock, Archive,
} from "lucide-react";
import LogoutButton from "../LogoutButton";

const STRENGTH_LABEL: Record<string, string> = {
  very_weak: "Shumë e dobët",
  weak:      "E dobët",
  moderate:  "Mesatare",
  strong:    "E fortë",
  very_strong: "Shumë e fortë",
};

const STRENGTH_COLOR: Record<string, string> = {
  very_weak:   "bg-red-100 text-red-700",
  weak:        "bg-orange-100 text-orange-700",
  moderate:    "bg-yellow-100 text-yellow-700",
  strong:      "bg-emerald-100 text-emerald-700",
  very_strong: "bg-green-100 text-green-700",
};

const HIVE_TYPE_LABEL: Record<string, string> = {
  langstroth: "Langstroth",
  dadant:     "Dadant",
  top_bar:    "Top Bar",
  warre:      "Warré",
  other:      "Tjetër",
};

const ARCHIVED_STATUS_LABEL: Record<string, string> = {
  inactive: "Joaktive",
  lost:     "E humbur",
  sold:     "E shitur",
};

const ARCHIVED_STATUS_COLOR: Record<string, string> = {
  inactive: "bg-gray-100 text-gray-500",
  lost:     "bg-red-100 text-red-700",
  sold:     "bg-gray-100 text-gray-500",
};

export default async function HivesPage({
  searchParams,
}: {
  searchParams?: { archived?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  const showArchived = searchParams?.archived === "1";

  // Active hives
  const farmHives = await db
    .select()
    .from(hives)
    .where(and(eq(hives.farmId, membership.farmId), eq(hives.status, "active")));

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

  const overdueCount = farmHives.filter((h) => {
    const last = lastInspMap[h.id];
    return !last || daysSince(last.date) > 14;
  }).length;

  // Season honey total (current calendar year)
  let seasonHoneyKg = 0;
  if (hiveIds.length > 0) {
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const harvests = await db
      .select({ honeyKg: hiveHarvests.honeyKg })
      .from(hiveHarvests)
      .where(and(
        inArray(hiveHarvests.hiveId, hiveIds),
        gte(hiveHarvests.harvestDate, yearStart),
      ));
    seasonHoneyKg = harvests.reduce((sum, h) => sum + Number(h.honeyKg), 0);
  }

  // Archived hives (only fetched when toggle is on)
  const archivedHives = showArchived
    ? await db
        .select()
        .from(hives)
        .where(and(eq(hives.farmId, membership.farmId), ne(hives.status, "active")))
        .orderBy(hives.hiveCode)
    : [];

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-farm-600"
            aria-label="Kthehu te ballina"
          >
            <Leaf className="h-4 w-4 text-white" strokeWidth={1.5} />
          </Link>
          <span className="text-sm font-bold text-farm-900">Zgjojt</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cilësimet"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5">

        {/* ── Page title + Add button ── */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Zgjojt e mia</h1>
            <p className="mt-0.5 text-sm text-gray-400">
              {farmHives.length}{" "}
              {farmHives.length === 1 ? "zgjo aktive" : "zgjoje aktive"}
            </p>
          </div>
          <Link
            href="/hives/new"
            className="flex h-11 items-center gap-2 rounded-xl bg-farm-600 px-4 text-sm font-semibold text-white hover:bg-farm-700 active:scale-[0.97] transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Shto
          </Link>
        </div>

        {/* ── Stats bar ── */}
        {farmHives.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-3.5 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-2xl font-bold text-gray-900">{farmHives.length}</p>
              <p className="mt-0.5 text-[11px] font-medium text-gray-400">Aktive</p>
            </div>

            <div className={`rounded-2xl p-3.5 text-center shadow-sm ring-1 transition-colors ${
              overdueCount > 0 ? "bg-red-50 ring-red-200" : "bg-white ring-gray-100"
            }`}>
              <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : "text-gray-900"}`}>
                {overdueCount}
              </p>
              <p className={`mt-0.5 text-[11px] font-medium ${overdueCount > 0 ? "text-red-400" : "text-gray-400"}`}>
                Me vonesë
              </p>
            </div>

            <div className="rounded-2xl bg-white p-3.5 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-2xl font-bold text-amber-600">
                {seasonHoneyKg > 0 ? seasonHoneyKg.toFixed(1) : "—"}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                kg mjaltë {new Date().getFullYear()}
              </p>
            </div>
          </div>
        )}

        {/* ── Active hives / empty state ── */}
        {farmHives.length === 0 ? (
          <div className="mt-12 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-8 text-center">
            <Flower2 className="mx-auto h-12 w-12 text-amber-400" strokeWidth={1.5} />
            <p className="mt-3 text-base font-bold text-amber-700">
              Nuk keni zgjoje të regjistruara
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Shtoni zgjojen e parë për të filluar.
            </p>
            <Link
              href="/hives/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-farm-600 px-5 py-3 text-sm font-semibold text-white hover:bg-farm-700"
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
                  className={`group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
                    overdue
                      ? "ring-1 ring-red-200 hover:ring-red-300"
                      : "ring-1 ring-gray-100 hover:ring-farm-200"
                  }`}
                >
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${overdue ? "bg-red-50" : "bg-amber-50"}`}>
                    <Flower2 className={`h-7 w-7 ${overdue ? "text-red-400" : "text-amber-500"}`} strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900">{hive.hiveCode}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {HIVE_TYPE_LABEL[hive.hiveType]}
                      {hive.locationNotes ? ` · ${hive.locationNotes}` : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {strength ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STRENGTH_COLOR[strength]}`}>
                          {STRENGTH_LABEL[strength]}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                          Pa vlerësim
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          overdue ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {days === null
                          ? "Pa inspektim"
                          : days === 0
                          ? "Sot"
                          : days === 1
                          ? "Dje"
                          : `${days} ditë`}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className="h-5 w-5 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Archived hives section ── */}
        {showArchived && (
          <div className="mt-6">
            <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
              Të arkivuara
            </h2>
            {archivedHives.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Nuk ka zgjoje të arkivuara.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {archivedHives.map((hive) => (
                  <Link
                    key={hive.id}
                    href={`/hives/${hive.id}`}
                    className="group flex items-center gap-4 rounded-2xl bg-white p-4 opacity-75 shadow-sm ring-1 ring-gray-100 hover:opacity-100 hover:shadow-md active:scale-[0.98] transition-all"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50">
                      <Flower2 className="h-7 w-7 text-gray-400" strokeWidth={1.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-gray-700">{hive.hiveCode}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {HIVE_TYPE_LABEL[hive.hiveType]}
                        {hive.locationNotes ? ` · ${hive.locationNotes}` : ""}
                      </p>
                      <div className="mt-1.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          ARCHIVED_STATUS_COLOR[hive.status] ?? "bg-gray-100 text-gray-500"
                        }`}>
                          {ARCHIVED_STATUS_LABEL[hive.status] ?? hive.status}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className="h-5 w-5 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Archive toggle ── */}
        <div className="mt-6 flex justify-center">
          <Link
            href={showArchived ? "/hives" : "/hives?archived=1"}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-gray-500 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-gray-700 hover:ring-gray-300"
          >
            <Archive className="h-4 w-4" strokeWidth={1.5} />
            {showArchived ? "Fshih të arkivuarat" : "Shfaq të arkivuarat"}
          </Link>
        </div>

      </main>
    </div>
  );
}
