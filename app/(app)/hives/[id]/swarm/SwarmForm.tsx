"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wind, AlertCircle } from "lucide-react";

type HiveOption = { id: string; hiveCode: string };
type Props = {
  farmId: string;
  hiveId: string;
  hiveCode: string;
  allHives: HiveOption[];
};

export default function SwarmForm({ farmId, hiveId, hiveCode, allHives }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [swarmDate, setSwarmDate] = useState(today);
  const [caught, setCaught] = useState(false);
  const [newHiveId, setNewHiveId] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!swarmDate) { setError("Data e rojit është e detyrueshme"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/farms/${farmId}/hives/${hiveId}/swarms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            swarmDate,
            caught,
            newHiveId: caught && newHiveId ? newHiveId : undefined,
            notes:     notes.trim() || undefined,
          }),
        }
      );

      const json = await res.json();
      if (!json.ok) { setError(json.error?.message ?? "Gabim i panjohur"); return; }
      router.push(`/hives/${hiveId}`);
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
          href={`/hives/${hiveId}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-sky-500" strokeWidth={1.5} />
          <span className="text-sm font-bold text-farm-900">Roj · {hiveCode}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Data e rojit <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={swarmDate}
              onChange={(e) => setSwarmDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
            />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Roji u kap?
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCaught(true)}
                className={`flex h-14 flex-col items-center justify-center rounded-xl transition-all ${
                  caught
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <span className="text-lg">✓</span>
                <span className="text-xs font-semibold">Po, u kap</span>
              </button>
              <button
                type="button"
                onClick={() => { setCaught(false); setNewHiveId(""); }}
                className={`flex h-14 flex-col items-center justify-center rounded-xl transition-all ${
                  !caught
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <span className="text-lg">✗</span>
                <span className="text-xs font-semibold">Jo, u humba</span>
              </button>
            </div>

            {caught && allHives.length > 0 && (
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Vendosur në koshere{" "}
                  <span className="text-gray-400 font-normal text-xs">opsionale</span>
                </label>
                <select
                  value={newHiveId}
                  onChange={(e) => setNewHiveId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                >
                  <option value="">— Zgjidhni kosherën —</option>
                  {allHives.map((h) => (
                    <option key={h.id} value={h.id}>{h.hiveCode}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Shënime</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Vërejtje shtesë për këtë roj..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
            />
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
            {loading ? "Duke ruajtur..." : "Ruaj rojin"}
          </button>
        </form>
      </main>
    </div>
  );
}
