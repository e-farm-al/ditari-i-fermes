"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wheat, AlertCircle } from "lucide-react";

type Props = { farmId: string; hiveId: string; hiveCode: string };

export default function HarvestForm({ farmId, hiveId, hiveCode }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [harvestDate, setHarvestDate] = useState(today);
  const [honeyKg, setHoneyKg] = useState("");
  const [waxKg, setWaxKg] = useState("");
  const [propolisG, setPropolisG] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!harvestDate) { setError("Data e korjes është e detyrueshme"); return; }
    if (!honeyKg || Number(honeyKg) <= 0) { setError("Sasia e mjaltit është e detyrueshme"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/farms/${farmId}/hives/${hiveId}/harvests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            harvestDate,
            honeyKg:    Number(honeyKg),
            waxKg:      waxKg !== "" ? Number(waxKg) : undefined,
            propolisG:  propolisG !== "" ? Number(propolisG) : undefined,
            notes:      notes.trim() || undefined,
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
          <Wheat className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
          <span className="text-sm font-bold text-farm-900">Korje · {hiveCode}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Data e korjes
            </h2>
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
            />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Produktet
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Mjaltë (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={honeyKg}
                  onChange={(e) => setHoneyKg(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Dyllë (kg) <span className="text-gray-400 font-normal text-xs">opsionale</span>
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={waxKg}
                  onChange={(e) => setWaxKg(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Propolis (g) <span className="text-gray-400 font-normal text-xs">opsionale</span>
                </label>
                <input
                  type="number" min="0" step="0.1"
                  value={propolisG}
                  onChange={(e) => setPropolisG(e.target.value)}
                  placeholder="0.0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Shënime</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Vërejtje shtesë..."
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
            {loading ? "Duke ruajtur..." : "Ruaj korjen"}
          </button>
        </form>
      </main>
    </div>
  );
}
