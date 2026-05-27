import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db, farmMembers, hives, hiveInspections, hiveHarvests, hiveSwarms } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import type { HiveInspection, HiveHarvest, HiveSwarm } from "@/db";
import Link from "next/link";
import {
  ArrowLeft, Flower2, Search, Wheat, Wind,
  CheckCircle2, XCircle, AlertCircle, Leaf,
} from "lucide-react";

// ── Label maps ────────────────────────────────────────────────────────────────

const HIVE_TYPE_LABEL: Record<string, string> = {
  langstroth: "Langstroth", dadant: "Dadant",
  top_bar: "Top Bar", warre: "Warré", other: "Tjetër",
};

const STRENGTH_LABEL: Record<string, string> = {
  very_weak: "Shumë e dobët", weak: "E dobët",
  moderate: "Mesatare", strong: "E fortë", very_strong: "Shumë e fortë",
};

const STRENGTH_COLOR: Record<string, string> = {
  very_weak: "text-red-600", weak: "text-orange-600",
  moderate: "text-yellow-600", strong: "text-emerald-600", very_strong: "text-green-600",
};

const HONEY_STORES_LABEL: Record<string, string> = {
  empty: "Bosh", low: "E ulët", adequate: "E mjaftueshme", full: "E plotë",
};

const TEMPERAMENT_LABEL: Record<string, string> = {
  calm: "E qetë", nervous: "Nervose", aggressive: "Agresive",
};

const QUEEN_STATUS_LABEL: Record<string, string> = {
  healthy: "E shëndetshme", laying: "Duke pjellur", unmated: "E pamartuar",
  missing: "Mungon", replaced: "E zëvendësuar",
};

const QUEEN_SOURCE_LABEL: Record<string, string> = {
  bred_on_farm: "Rritur në fermë", purchased: "Blerë", caught_swarm: "Kapur nga roj",
};

const QUEEN_COLOR_LABEL: Record<number, { label: string; dot: string }> = {
  0: { label: "Blu", dot: "bg-blue-500" },
  1: { label: "E bardhë", dot: "bg-white border border-gray-300" },
  2: { label: "E verdhë", dot: "bg-yellow-400" },
  3: { label: "E kuqe", dot: "bg-red-500" },
  4: { label: "Jeshile", dot: "bg-green-500" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("sq-AL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── Timeline item types ───────────────────────────────────────────────────────

type TLItem =
  | { kind: "inspection"; date: string; data: HiveInspection }
  | { kind: "harvest";    date: string; data: HiveHarvest }
  | { kind: "swarm";      date: string; data: HiveSwarm };

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HiveDetailPage({
  params,
}: {
  params: { id: string };
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

  const [inspections, harvests, swarmList] = await Promise.all([
    db
      .select()
      .from(hiveInspections)
      .where(eq(hiveInspections.hiveId, hive.id))
      .orderBy(desc(hiveInspections.inspectionDate)),
    db
      .select()
      .from(hiveHarvests)
      .where(eq(hiveHarvests.hiveId, hive.id))
      .orderBy(desc(hiveHarvests.harvestDate)),
    db
      .select()
      .from(hiveSwarms)
      .where(eq(hiveSwarms.hiveId, hive.id))
      .orderBy(desc(hiveSwarms.swarmDate)),
  ]);

  // Build sorted timeline
  const timeline: TLItem[] = [
    ...inspections.map((d) => ({ kind: "inspection" as const, date: d.inspectionDate, data: d })),
    ...harvests.map((d) => ({ kind: "harvest" as const, date: d.harvestDate, data: d })),
    ...swarmList.map((d) => ({ kind: "swarm" as const, date: d.swarmDate, data: d })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const lastInsp = inspections[0] ?? null;
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const daysSince = lastInsp
    ? Math.floor((todayMs - new Date(lastInsp.inspectionDate).getTime()) / 86_400_000)
    : null;
  const overdue = daysSince === null || daysSince > 14;

  const queenColor = hive.queenYearColor != null ? QUEEN_COLOR_LABEL[hive.queenYearColor] : null;

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/hives"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Flower2 className="h-4 w-4 flex-shrink-0 text-amber-500" strokeWidth={1.5} />
          <span className="truncate text-sm font-bold text-farm-900">{hive.hiveCode}</span>
          {overdue && (
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" strokeWidth={2} />
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 pt-5">

        {/* ── Hive info card ── */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Flower2 className="h-7 w-7 text-amber-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900">{hive.hiveCode}</p>
              <p className="text-sm text-gray-500">
                {HIVE_TYPE_LABEL[hive.hiveType]}
                {hive.locationNotes ? ` · ${hive.locationNotes}` : ""}
              </p>
              {hive.installationDate && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Instaluar {formatDate(hive.installationDate)}
                </p>
              )}
            </div>
          </div>

          {/* Last inspection badge */}
          {lastInsp && (
            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Inspektimi i fundit
              </p>
              <div className="flex items-center gap-3">
                {lastInsp.colonyStrength && (
                  <p className={`text-sm font-bold ${STRENGTH_COLOR[lastInsp.colonyStrength]}`}>
                    {STRENGTH_LABEL[lastInsp.colonyStrength]}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {daysSince === 0 ? "Sot" : daysSince === 1 ? "Dje" : `${daysSince} ditë më parë`}
                </p>
              </div>
            </div>
          )}

          {/* Queen info */}
          {(hive.queenIntroduced || queenColor || hive.queenSource) && (
            <div className="mt-3 rounded-xl bg-amber-50/60 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Mbretëresha
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                {hive.queenIntroduced && (
                  <span>Vendosur {formatDate(hive.queenIntroduced)}</span>
                )}
                {queenColor && (
                  <span className="flex items-center gap-1">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${queenColor.dot}`} />
                    {queenColor.label}
                  </span>
                )}
                {hive.queenSource && (
                  <span>{QUEEN_SOURCE_LABEL[hive.queenSource] ?? hive.queenSource}</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Action buttons ── */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <Link
            href={`/hives/${hive.id}/inspect`}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-4 shadow-sm ring-1 ring-gray-100 hover:ring-farm-200 hover:shadow-md active:scale-[0.97] transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Search className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Inspektim</span>
          </Link>

          <Link
            href={`/hives/${hive.id}/harvest`}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-4 shadow-sm ring-1 ring-gray-100 hover:ring-farm-200 hover:shadow-md active:scale-[0.97] transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Wheat className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Korje</span>
          </Link>

          <Link
            href={`/hives/${hive.id}/swarm`}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-4 shadow-sm ring-1 ring-gray-100 hover:ring-farm-200 hover:shadow-md active:scale-[0.97] transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <Wind className="h-5 w-5 text-sky-600" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Roj</span>
          </Link>
        </div>

        {/* ── Timeline ── */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Historiku
          </h2>

          {timeline.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
              <Leaf className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
              <p className="mt-2 text-sm font-medium text-gray-400">
                Nuk ka veprime të regjistruara
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Filloni me një inspektim.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {timeline.map((item, i) => (
                <TimelineCard key={i} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ── Timeline card components ──────────────────────────────────────────────────

function TimelineCard({ item }: { item: TLItem }) {
  if (item.kind === "inspection") return <InspectionCard data={item.data} />;
  if (item.kind === "harvest")    return <HarvestCard data={item.data} />;
  return <SwarmCard data={item.data} />;
}

const STRENGTH_LABEL2: Record<string, string> = {
  very_weak: "Shumë e dobët", weak: "E dobët",
  moderate: "Mesatare", strong: "E fortë", very_strong: "Shumë e fortë",
};
const STRENGTH_COLOR2: Record<string, string> = {
  very_weak: "bg-red-100 text-red-700", weak: "bg-orange-100 text-orange-700",
  moderate: "bg-yellow-100 text-yellow-700",
  strong: "bg-emerald-100 text-emerald-700", very_strong: "bg-green-100 text-green-700",
};

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("sq-AL", {
    day: "numeric", month: "long",
  });
}

function InspectionCard({ data }: { data: HiveInspection }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50">
          <Search className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inspektim</p>
            <p className="text-xs text-gray-400">{formatDateShort(data.inspectionDate)}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.colonyStrength && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STRENGTH_COLOR2[data.colonyStrength]}`}>
                {STRENGTH_LABEL2[data.colonyStrength]}
              </span>
            )}
            {data.framesWithBees != null && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {data.framesWithBees} korniza
              </span>
            )}
            {(data.supersCount ?? 0) > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                {data.supersCount} superë
              </span>
            )}
            {data.diseaseSigns && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                Shenja sëmundjeje
              </span>
            )}
            {!data.queenPresent && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                Mbretëresha mungon
              </span>
            )}
          </div>

          {data.notes && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">{data.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function HarvestCard({ data }: { data: HiveHarvest }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50">
          <Wheat className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Korje</p>
            <p className="text-xs text-gray-400">{formatDateShort(data.harvestDate)}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {Number(data.honeyKg).toFixed(2)} kg mjaltë
            </span>
            {data.waxKg && Number(data.waxKg) > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {Number(data.waxKg).toFixed(2)} kg dyllë
              </span>
            )}
            {data.propolisG && Number(data.propolisG) > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {Number(data.propolisG).toFixed(0)} g propolis
              </span>
            )}
          </div>

          {data.notes && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">{data.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SwarmCard({ data }: { data: HiveSwarm }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50">
          <Wind className="h-4 w-4 text-sky-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Roj</p>
            <p className="text-xs text-gray-400">{formatDateShort(data.swarmDate)}</p>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            {data.caught ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                E kapur
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                <XCircle className="h-3 w-3" strokeWidth={2} />
                E humbur
              </span>
            )}
          </div>

          {data.notes && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">{data.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
