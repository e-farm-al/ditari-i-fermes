"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flower2, AlertCircle, AlertTriangle } from "lucide-react";
import type { Hive } from "@/db";

const HIVE_TYPES = [
  { value: "langstroth", label: "Langstroth" },
  { value: "dadant",     label: "Dadant" },
  { value: "top_bar",    label: "Top Bar" },
  { value: "warre",      label: "Warré" },
  { value: "other",      label: "Tjetër" },
];

const QUEEN_SOURCES = [
  { value: "",              label: "— Zgjidhni —" },
  { value: "bred_on_farm",  label: "Rritur në fermë" },
  { value: "purchased",     label: "Blerë" },
  { value: "caught_swarm",  label: "Kapur nga roj" },
];

const QUEEN_COLORS = [
  { value: "",  label: "— Pa ngjyrë —" },
  { value: "0", label: "Blu (0, 5)" },
  { value: "1", label: "E bardhë (1, 6)" },
  { value: "2", label: "E verdhë (2, 7)" },
  { value: "3", label: "E kuqe (3, 8)" },
  { value: "4", label: "Jeshile (4, 9)" },
];

const STATUSES = [
  { value: "active",   label: "Aktive",     style: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { value: "inactive", label: "Joaktive",   style: "border-gray-300 bg-gray-50 text-gray-600" },
  { value: "lost",     label: "E humbur",   style: "border-red-300 bg-red-50 text-red-700" },
  { value: "sold",     label: "E shitur",   style: "border-gray-300 bg-gray-50 text-gray-600" },
];

export default function EditHiveForm({
  farmId,
  hive,
}: {
  farmId: string;
  hive: Hive;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-populate from existing hive
  const [hiveCode, setHiveCode]             = useState(hive.hiveCode);
  const [hiveType, setHiveType]             = useState(hive.hiveType);
  const [installationDate, setInstDate]     = useState(hive.installationDate ?? "");
  const [locationNotes, setLocationNotes]   = useState(hive.locationNotes ?? "");
  const [queenIntroduced, setQueenIntro]    = useState(hive.queenIntroduced ?? "");
  const [queenYearColor, setQueenColor]     = useState(hive.queenYearColor != null ? String(hive.queenYearColor) : "");
  const [queenSource, setQueenSource]       = useState(hive.queenSource ?? "");
  const [status, setStatus]                 = useState(hive.status);
  const [notes, setNotes]                   = useState(hive.notes ?? "");

  const isDeactivating = status !== "active" && hive.status === "active";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hiveCode.trim()) { setError("Kodi i kosheresë është i detyrueshëm"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/farms/${farmId}/hives/${hive.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hiveCode:        hiveCode.trim().toUpperCase(),
          hiveType,
          installationDate: installationDate || undefined,
          locationNotes:    locationNotes.trim() || undefined,
          queenIntroduced:  queenIntroduced || undefined,
          queenYearColor:   queenYearColor !== "" ? Number(queenYearColor) : null,
          queenSource:      queenSource || undefined,
          status,
          notes:            notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!json.ok) { setError(json.error?.message ?? "Gabim i panjohur"); return; }

      // If deactivated, go back to the list; otherwise detail page
      router.push(status === "active" ? `/hives/${hive.id}` : "/hives");
    } catch {
      setError("Nuk mund të lidhemi me serverin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <Link
          href={`/hives/${hive.id}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <div className="flex items-center gap-2">
          <Flower2 className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
          <span className="text-sm font-bold text-farm-900">Ndrysho · {hive.hiveCode}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Basic info */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Informacioni bazë
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Kodi i kosheresë <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={hiveCode}
                  onChange={(e) => setHiveCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-mono uppercase placeholder-gray-400 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Lloji i kosheresë
                </label>
                <select
                  value={hiveType}
                  onChange={(e) => setHiveType(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                >
                  {HIVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Data e instalimit
                </label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Vendndodhja
                </label>
                <input
                  type="text"
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  placeholder="p.sh. Kopshti i veriut"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                />
              </div>
            </div>
          </section>

          {/* Queen info */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Mbretëresha
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Data e vendosjes
                </label>
                <input
                  type="date"
                  value={queenIntroduced}
                  onChange={(e) => setQueenIntro(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Ngjyra e vitit (ICBB)
                </label>
                <select
                  value={queenYearColor}
                  onChange={(e) => setQueenColor(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                >
                  {QUEEN_COLORS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Burimi i mbretëreshës
                </label>
                <select
                  value={queenSource}
                  onChange={(e) => setQueenSource(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                >
                  {QUEEN_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Shënime
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Shënime shtesë..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
            />
          </section>

          {/* Status — destructive section */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Gjendja e kosheresë
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value as any)}
                  className={`flex h-12 items-center justify-center rounded-xl border-2 text-sm font-semibold transition-all ${
                    status === s.value
                      ? s.style
                      : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {isDeactivating && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={2} />
                <span>
                  Kosherja do të hiqet nga lista aktive. Të dhënat dhe historiku ruhen.
                </span>
              </div>
            )}
          </section>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-14 items-center justify-center rounded-2xl bg-farm-600 text-sm font-bold text-white shadow-md shadow-farm-700/20 hover:bg-farm-700 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Duke ruajtur..." : "Ruaj ndryshimet"}
          </button>
        </form>
      </main>
    </div>
  );
}
