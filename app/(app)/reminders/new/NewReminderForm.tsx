"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, AlertCircle } from "lucide-react";

const TEMPLATES = [
  { label: "Inspektim", title: "Inspektim i zgjoit" },
  { label: "Ushqim",    title: "Ushqim i bletëve" },
  { label: "Trajtim",   title: "Trajtim kundër sëmundjeve" },
  { label: "Korrje",    title: "Korrje mjalti" },
];

const REPEAT_OPTIONS = [
  { value: "none",    label: "Asnjëherë" },
  { value: "weekly",  label: "Çdo javë" },
  { value: "monthly", label: "Çdo muaj" },
  { value: "yearly",  label: "Çdo vit" },
];

const inputCls = "h-[52px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-farm-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-500/20";
const labelCls = "block text-sm font-semibold text-gray-700";

export default function NewReminderForm({ farmId }: { farmId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueTime, setDueTime] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function applyTemplate(t: string) {
    setTitle(t);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Titulli është i detyrueshëm"); return; }
    if (!dueDate)       { setError("Data është e detyrueshme"); return; }
    setError("");
    setLoading(true);

    const res = await fetch(`/api/farms/${farmId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        dueTime: dueTime || undefined,
        repeatType,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Gabim gjatë ruajtjes");
      return;
    }

    router.push("/reminders");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/reminders"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-sky-500" strokeWidth={1.5} />
          <span className="text-base font-bold text-gray-900">Kujtesë e re</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5">
        {/* Quick templates */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Modele të shpejta
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t.title)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  title === t.title
                    ? "border-farm-500 bg-farm-50 text-farm-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-farm-300 hover:text-farm-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className={labelCls}>Titulli <span className="text-farm-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="p.sh. Inspektim i zgjoit Nr. 3"
              required
              className={inputCls}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <label className={labelCls}>Shënime</label>
              <span className="text-xs text-gray-400">Opsional</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaje shtesë..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-farm-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-500/20 resize-none"
            />
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Data <span className="text-farm-500">*</span></label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1">
                <label className={labelCls}>Ora</label>
                <span className="text-xs text-gray-400">Opsional</span>
              </div>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Repeat */}
          <div className="space-y-1.5">
            <label className={labelCls}>Përsërit</label>
            <div className="flex flex-wrap gap-2">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRepeatType(opt.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    repeatType === opt.value
                      ? "border-farm-500 bg-farm-50 text-farm-700"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-[52px] w-full items-center justify-center rounded-xl bg-farm-600 text-sm font-semibold text-white shadow-md shadow-farm-600/30 hover:bg-farm-700 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Duke ruajtur..." : "Ruaj kujtesën"}
          </button>
        </form>
      </main>
    </div>
  );
}
