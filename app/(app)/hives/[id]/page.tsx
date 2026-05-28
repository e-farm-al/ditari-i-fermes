import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db, farmMembers, hives, hiveInspections, hiveHarvests, hiveSwarms } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import type { HiveInspection, HiveHarvest, HiveSwarm } from "@/db";
import Link from "next/link";
import {
  ArrowLeft, Flower2, Search, Wheat, Wind,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight, Pencil, QrCode,
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

const STRENGTH_BG: Record<string, string> = {
  very_weak: "bg-red-50 ring-red-200", weak: "bg-orange-50 ring-orange-200",
  moderate: "bg-yellow-50 ring-yellow-200",
  strong: "bg-emerald-50 ring-emerald-200", very_strong: "bg-green-50 ring-green-200",
};

const QUEEN_COLOR_LABEL: Record<number, { label: string; dot: string }> = {
  0: { label: "Blu",       dot: "bg-blue-500" },
  1: { label: "E bardhë",  dot: "bg-white border border-gray-300" },
  2: { label: "E verdhë",  dot: "bg-yellow-400" },
  3: { label: "E kuqe",    dot: "bg-red-500" },
  4: { label: "Jeshile",   dot: "bg-green-500" },
};

const QUEEN_SOURCE_LABEL: Record<string, string> = {
  bred_on_farm: "Rritur në fermë", purchased: "Blerë", caught_swarm: "Kapur nga roj",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("sq-AL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("sq-AL", {
    day: "numeric", month: "long",
  });
}

function queenAge(dateStr: string): { text: string; old: boolean } {
  const months = Math.floor(
    (Date.now() - new Date(dateStr + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  let text: string;
  if (months < 1)  text = "Muaj i parë";
  else if (months < 12) text = `${months} muaj`;
  else if (rem === 0)   text = `${years} vit${years > 1 ? "e" : ""}`;
  else                  text = `${years} vit${years > 1 ? "e" : ""} e ${rem} muaj`;
  return { text, old: years >= 2 };
}

const HIVE_STATUS_BANNER: Record<string, { label: string; style: string }> = {
  inactive: { label: "Joaktive — kjo koshere nuk është në përdorim aktiv.", style: "bg-gray-100 text-gray-600 ring-gray-200" },
  lost:     { label: "E humbur — kjo koloni është humbur.",                style: "bg-red-50 text-red-700 ring-red-200" },
  sold:     { label: "E shitur — kjo koshere nuk është më në fermë.",      style: "bg-gray-100 text-gray-600 ring-gray-200" },
};

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
    db.select().from(hiveInspections).where(eq(hiveInspections.hiveId, hive.id)).orderBy(desc(hiveInspections.inspectionDate)),
    db.select().from(hiveHarvests).where(eq(hiveHarvests.hiveId, hive.id)).orderBy(desc(hiveHarvests.harvestDate)),
    db.select().from(hiveSwarms).where(eq(hiveSwarms.hiveId, hive.id)).orderBy(desc(hiveSwarms.swarmDate)),
  ]);

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
  const strength = lastInsp?.colonyStrength ?? null;

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/hives"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 active:scale-95"
          aria-label="Kthehu te kosheret"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Flower2 className="h-4 w-4 flex-shrink-0 text-amber-500" strokeWidth={1.5} />
          <span className="truncate text-base font-bold text-farm-900">{hive.hiveCode}</span>
        </div>
        <Link
          href={`/hives/${hive.id}/qr`}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 active:scale-95"
          aria-label="Shfaq kodin QR"
        >
          <QrCode className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Link>
        <Link
          href={`/hives/${hive.id}/edit`}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 active:scale-95"
          aria-label="Ndrysho kosherën"
        >
          <Pencil className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Link>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">

        {/* ── Inactive / lost / sold banner ── */}
        {hive.status !== "active" && HIVE_STATUS_BANNER[hive.status] && (
          <div className={`mb-4 flex items-center gap-3 rounded-2xl px-4 py-3.5 ring-1 ${HIVE_STATUS_BANNER[hive.status].style}`}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
            <p className="text-sm font-semibold">{HIVE_STATUS_BANNER[hive.status].label}</p>
          </div>
        )}

        {/* ── Overdue warning banner (active hives only) ── */}
        {hive.status === "active" && overdue && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-4 ring-1 ring-red-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" strokeWidth={2} />
            <div>
              <p className="text-sm font-bold text-red-700">Inspektim i vonuar</p>
              <p className="mt-0.5 text-xs text-red-500">
                {daysSince === null
                  ? "Kjo koshere nuk ka inspektim të regjistruar akoma."
                  : `Inspektimi i fundit ishte ${daysSince} ditë më parë — rekomandohet çdo 14 ditë.`}
              </p>
            </div>
          </div>
        )}

        {/* ── Hive info card ── */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50">
              <Flower2 className="h-8 w-8 text-amber-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-900">{hive.hiveCode}</p>
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

          {/* Colony strength from last inspection */}
          {lastInsp && strength && (
            <div className={`mt-4 rounded-xl px-4 py-3 ring-1 ${STRENGTH_BG[strength]}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Gjendja e kolonisë
              </p>
              <div className="flex items-center justify-between">
                <p className={`text-base font-bold ${STRENGTH_COLOR[strength]}`}>
                  {STRENGTH_LABEL[strength]}
                </p>
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
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600">
                {hive.queenIntroduced && (() => {
                  const age = queenAge(hive.queenIntroduced!);
                  return (
                    <>
                      <span>Vendosur {formatDate(hive.queenIntroduced)}</span>
                      <span className={`font-semibold ${age.old ? "text-orange-500" : "text-gray-400"}`}>
                        {age.text}{age.old ? " ⚠" : ""}
                      </span>
                    </>
                  );
                })()}
                {queenColor && (
                  <span className="flex items-center gap-1.5">
                    <span className={`inline-block h-3 w-3 rounded-full ${queenColor.dot}`} />
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

        {/* ── Action buttons — full-width rows, clearly labeled ── */}
        <section className="mb-5">
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
            Çfarë doni të regjistroni?
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/hives/${hive.id}/inspect`}
              className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-100 hover:ring-emerald-200 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Search className="h-6 w-6 text-emerald-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Bëni inspektim</p>
                <p className="mt-0.5 text-xs text-gray-400">Shënoni gjendjen e kolonisë sot</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={2} />
            </Link>

            <Link
              href={`/hives/${hive.id}/harvest`}
              className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-100 hover:ring-amber-200 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <Wheat className="h-6 w-6 text-amber-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Regjistroni vjeljen</p>
                <p className="mt-0.5 text-xs text-gray-400">Sasi mjaltë, dyllë e propolis</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={2} />
            </Link>

            <Link
              href={`/hives/${hive.id}/swarm`}
              className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-100 hover:ring-sky-200 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50">
                <Wind className="h-6 w-6 text-sky-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Shënoni rojën</p>
                <p className="mt-0.5 text-xs text-gray-400">Ka dalë rojë — e kapur apo e humbur?</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={2} />
            </Link>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section>
          <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
            Historiku
          </h2>

          {timeline.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
              <Flower2 className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold text-gray-400">
                Nuk ka veprime të regjistruara
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Filloni me një inspektim të parë.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {timeline.map((item) => (
                <TimelineCard key={item.data.id} item={item} hiveId={hive.id} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ── Timeline card components ──────────────────────────────────────────────────

function TimelineCard({ item, hiveId }: { item: TLItem; hiveId: string }) {
  if (item.kind === "inspection") return <InspectionCard data={item.data} hiveId={hiveId} />;
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

function InspectionCard({ data, hiveId }: { data: HiveInspection; hiveId: string }) {
  return (
    <Link
      href={`/hives/${hiveId}/inspect/${data.id}`}
      className="group block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-emerald-200 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Search className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-700">Inspektim</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">{formatDateShort(data.inspectionDate)}</p>
              <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.colonyStrength && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STRENGTH_COLOR2[data.colonyStrength]}`}>
                {STRENGTH_LABEL2[data.colonyStrength]}
              </span>
            )}
            {data.framesWithBees != null && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {data.framesWithBees} korniza
              </span>
            )}
            {(data.supersCount ?? 0) > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                {data.supersCount} superë
              </span>
            )}
            {data.diseaseSigns && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                Shenja sëmundjeje
              </span>
            )}
            {!data.queenPresent && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                Mbretëresha mungon
              </span>
            )}
          </div>

          {data.notes && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">{data.notes}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function HarvestCard({ data }: { data: HiveHarvest }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <Wheat className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-700">Vjelje</p>
            <p className="text-xs text-gray-400">{formatDateShort(data.harvestDate)}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {Number(data.honeyKg).toFixed(2)} kg mjaltë
            </span>
            {data.waxKg && Number(data.waxKg) > 0 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {Number(data.waxKg).toFixed(2)} kg dyllë
              </span>
            )}
            {data.propolisG && Number(data.propolisG) > 0 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {Number(data.propolisG).toFixed(0)} g propolis
              </span>
            )}
          </div>

          {data.notes && (
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{data.notes}</p>
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
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50">
          <Wind className="h-5 w-5 text-sky-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-700">Roj</p>
            <p className="text-xs text-gray-400">{formatDateShort(data.swarmDate)}</p>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            {data.caught ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                E kapur
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
                E humbur
              </span>
            )}
          </div>

          {data.notes && (
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{data.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
