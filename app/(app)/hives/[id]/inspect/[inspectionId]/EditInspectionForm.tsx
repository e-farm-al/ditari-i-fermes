"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, AlertCircle, Trash2, AlertTriangle } from "lucide-react";
import type { HiveInspection } from "@/db";

const COLONY_STRENGTH = [
  { value: "",            label: "— Zgjidhni —" },
  { value: "very_weak",   label: "Shumë e dobët" },
  { value: "weak",        label: "E dobët" },
  { value: "moderate",    label: "Mesatare" },
  { value: "strong",      label: "E fortë" },
  { value: "very_strong", label: "Shumë e fortë" },
];

const QUEEN_STATUS = [
  { value: "",          label: "— Zgjidhni —" },
  { value: "healthy",   label: "E shëndetshme" },
  { value: "laying",    label: "Duke pjellur" },
  { value: "unmated",   label: "E pamartuar" },
  { value: "missing",   label: "Mungon" },
  { value: "replaced",  label: "E zëvendësuar" },
];

const HONEY_STORES = [
  { value: "",          label: "— Zgjidhni —" },
  { value: "empty",     label: "Bosh" },
  { value: "low",       label: "E ulët" },
  { value: "adequate",  label: "E mjaftueshme" },
  { value: "full",      label: "E plotë" },
];

const TEMPERAMENT = [
  { value: "",            label: "— Zgjidhni —" },
  { value: "calm",        label: "E qetë" },
  { value: "nervous",     label: "Nervose" },
  { value: "aggressive",  label: "Agresive" },
];

type Props = {
  farmId: string;
  hiveId: string;
  hiveCode: string;
  inspection: HiveInspection;
};

export default function EditInspectionForm({ farmId, hiveId, hiveCode, inspection }: Props) {
  const router = useRouter();
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Pre-populate from existing inspection
  const [inspectionDate, setInspectionDate] = useState(inspection.inspectionDate);
  const [queenPresent, setQueenPresent]     = useState(inspection.queenPresent);
  const [queenStatus, setQueenStatus]       = useState(inspection.queenStatus ?? "");
  const [colonyStrength, setColonyStrength] = useState(inspection.colonyStrength ?? "");
  const [framesWithBees, setFramesWithBees] = useState(
    inspection.framesWithBees != null ? String(inspection.framesWithBees) : "",
  );
  const [framesWithBrood, setFramesWithBrood] = useState(
    inspection.framesWithBrood != null ? String(inspection.framesWithBrood) : "",
  );
  const [supersCount, setSupersCount] = useState(
    inspection.supersCount != null ? String(inspection.supersCount) : "",
  );
  const [honeyStores, setHoneyStores]       = useState(inspection.honeyStores ?? "");
  const [temperament, setTemperament]       = useState(inspection.temperament ?? "");
  const [diseaseSigns, setDiseaseSigns]     = useState(inspection.diseaseSigns);
  const [diseaseNotes, setDiseaseNotes]     = useState(inspection.diseaseNotes ?? "");
  const [treatmentApplied, setTreatment]   = useState(inspection.treatmentApplied ?? "");
  const [notes, setNotes]                   = useState(inspection.notes ?? "");

  const apiUrl = `/api/farms/${farmId}/hives/${hiveId}/inspections/${inspection.id}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inspectionDate) { setError("Data e inspektimit është e detyrueshme"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspectionDate,
          queenPresent,
          queenStatus:      queenStatus || null,
          colonyStrength:   colonyStrength || null,
          framesWithBees:   framesWithBees !== "" ? Number(framesWithBees) : null,
          framesWithBrood:  framesWithBrood !== "" ? Number(framesWithBrood) : null,
          supersCount:      supersCount !== "" ? Number(supersCount) : null,
          honeyStores:      honeyStores || null,
          temperament:      temperament || null,
          diseaseSigns,
          diseaseNotes:     diseaseSigns ? diseaseNotes.trim() || null : null,
          treatmentApplied: treatmentApplied.trim() || null,
          notes:            notes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!json.ok) { setError(json.error?.message ?? "Gabim i panjohur"); return; }
      router.push(`/hives/${hiveId}`);
    } catch {
      setError("Nuk mund të lidhemi me serverin");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setError("");
    setDeleting(true);

    try {
      const res = await fetch(apiUrl, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) { setError(json.error?.message ?? "Gabim i panjohur"); return; }
      router.push(`/hives/${hiveId}`);
    } catch {
      setError("Nuk mund të lidhemi me serverin");
    } finally {
      setDeleting(false);
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
          <Search className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
          <span className="text-sm font-bold text-farm-900">
            Ndrysho inspektimin · {hiveCode}
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Date */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
            />
          </section>

          {/* Colony */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Gjendja e kolonisë
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Fuqia e kolonisë
                </label>
                <select
                  value={colonyStrength}
                  onChange={(e) => setColonyStrength(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                >
                  {COLONY_STRENGTH.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Korniza me bletë
                  </label>
                  <input
                    type="number" min="0" max="40"
                    value={framesWithBees}
                    onChange={(e) => setFramesWithBees(e.target.value)}
                    placeholder="—"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center text-sm focus:border-farm-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Korniza me fëmijë
                  </label>
                  <input
                    type="number" min="0" max="40"
                    value={framesWithBrood}
                    onChange={(e) => setFramesWithBrood(e.target.value)}
                    placeholder="—"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center text-sm focus:border-farm-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Superë
                  </label>
                  <input
                    type="number" min="0" max="20"
                    value={supersCount}
                    onChange={(e) => setSupersCount(e.target.value)}
                    placeholder="—"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center text-sm focus:border-farm-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Rezervat e mjaltit
                </label>
                <select
                  value={honeyStores}
                  onChange={(e) => setHoneyStores(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                >
                  {HONEY_STORES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Temperamenti
                </label>
                <select
                  value={temperament}
                  onChange={(e) => setTemperament(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                >
                  {TEMPERAMENT.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Queen */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Mbretëresha
            </h2>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setQueenPresent(!queenPresent)}
                className={`flex h-12 items-center justify-between rounded-xl px-4 transition-colors ${
                  queenPresent
                    ? "bg-emerald-50 ring-1 ring-emerald-200"
                    : "bg-red-50 ring-1 ring-red-200"
                }`}
              >
                <span className={`text-sm font-semibold ${queenPresent ? "text-emerald-700" : "text-red-700"}`}>
                  {queenPresent ? "Mbretëresha është e pranishme" : "Mbretëresha mungon"}
                </span>
                <span className={`h-6 w-6 rounded-full text-center text-sm font-bold leading-6 ${
                  queenPresent ? "bg-emerald-200 text-emerald-700" : "bg-red-200 text-red-700"
                }`}>
                  {queenPresent ? "✓" : "✗"}
                </span>
              </button>

              {queenPresent && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Gjendja e mbretëreshës
                  </label>
                  <select
                    value={queenStatus}
                    onChange={(e) => setQueenStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                  >
                    {QUEEN_STATUS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Health */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Shëndeti
            </h2>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setDiseaseSigns(!diseaseSigns)}
                className={`flex h-12 items-center justify-between rounded-xl px-4 transition-colors ${
                  diseaseSigns
                    ? "bg-red-50 ring-1 ring-red-200"
                    : "bg-gray-50 ring-1 ring-gray-200"
                }`}
              >
                <span className={`text-sm font-semibold ${diseaseSigns ? "text-red-700" : "text-gray-600"}`}>
                  {diseaseSigns ? "Ka shenja sëmundjeje" : "Pa shenja sëmundjeje"}
                </span>
                <span className={`h-6 w-6 rounded-full text-center text-sm font-bold leading-6 ${
                  diseaseSigns ? "bg-red-200 text-red-700" : "bg-gray-200 text-gray-500"
                }`}>
                  {diseaseSigns ? "!" : "✓"}
                </span>
              </button>

              {diseaseSigns && (
                <textarea
                  value={diseaseNotes}
                  onChange={(e) => setDiseaseNotes(e.target.value)}
                  rows={2}
                  placeholder="Përshkruani shenjat e sëmundjes..."
                  className="resize-none rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm placeholder-red-300 focus:border-red-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Trajtim i aplikuar
                </label>
                <input
                  type="text"
                  value={treatmentApplied}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="p.sh. Acid okzalik, Apivar..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:border-farm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-100"
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Shënime
            </label>
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
            disabled={loading || deleting}
            className="flex h-14 items-center justify-center rounded-2xl bg-farm-600 text-sm font-bold text-white shadow-md shadow-farm-700/20 hover:bg-farm-700 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Duke ruajtur..." : "Ruaj ndryshimet"}
          </button>
        </form>

        {/* ── Delete section ── */}
        <div className="mt-5">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={loading || deleting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              Fshi inspektimin
            </button>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="mb-3 flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" strokeWidth={2} />
                <p className="text-sm font-semibold text-red-700">
                  Jeni i sigurt? Ky veprim nuk mund të kthehet mbrapsht.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || loading}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {deleting ? "Duke fshirë..." : "Po, fshi"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-white text-sm font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 active:scale-[0.98]"
                >
                  Anulo
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
