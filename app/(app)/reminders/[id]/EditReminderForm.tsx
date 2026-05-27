"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, AlertCircle, Trash2 } from "lucide-react";

type ReminderData = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  dueTime: string | null;
  repeatType: string;
  status: string;
};

const REPEAT_OPTIONS = [
  { value: "none",    label: "Asnjëherë" },
  { value: "weekly",  label: "Çdo javë" },
  { value: "monthly", label: "Çdo muaj" },
  { value: "yearly",  label: "Çdo vit" },
];

const STATUS_OPTIONS = [
  { value: "pending",   label: "Në pritje" },
  { value: "completed", label: "E kryer" },
  { value: "dismissed", label: "E injoruar" },
];

const inputCls = "h-[52px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-farm-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-500/20";
const labelCls = "block text-sm font-semibold text-gray-700";

export default function EditReminderForm({
  farmId,
  reminder,
}: {
  farmId: string;
  reminder: ReminderData;
}) {
  const router = useRouter();
  const [title, setTitle]         = useState(reminder.title);
  const [description, setDesc]    = useState(reminder.description ?? "");
  const [dueDate, setDueDate]     = useState(reminder.dueDate as string);
  const [dueTime, setDueTime]     = useState(reminder.dueTime ?? "");
  const [repeatType, setRepeat]   = useState(reminder.repeatType);
  const [status, setStatus]       = useState(reminder.status);
  const [loading, setLoading]     = useState(false);
  const [confirmDel, setConfirm]  = useState(false);
  const [error, setError]         = useState("");

  const baseUrl = `/api/farms/${farmId}/reminders/${reminder.id}`;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Titulli është i detyrueshëm"); return; }
    setError("");
    setLoading(true);

    const res = await fetch(baseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        dueDate,
        dueTime: dueTime || null,
        repeatType,
        status,
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

  async function handleDelete() {
    setLoading(true);
    await fetch(baseUrl, { method: "DELETE" });
    setLoading(false);
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
          <span className="text-base font-bold text-gray-900">Ndrysho detyrën</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5">
        <form onSubmit={handleSave} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Titulli <span className="text-farm-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <label className={labelCls}>Shënime</label>
              <span className="text-xs text-gray-400">Opsional</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-farm-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Data <span className="text-farm-500">*</span></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1">
                <label className={labelCls}>Ora</label>
                <span className="text-xs text-gray-400">Opsional</span>
              </div>
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Përsërit</label>
            <div className="flex flex-wrap gap-2">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRepeat(opt.value)}
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

          <div className="space-y-1.5">
            <label className={labelCls}>Statusi</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    status === opt.value
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
            {loading ? "Duke ruajtur..." : "Ruaj ndryshimet"}
          </button>
        </form>

        {/* Delete section */}
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
          {confirmDel ? (
            <div>
              <p className="mb-3 text-sm font-semibold text-red-700">Jeni i sigurt? Kjo veprim nuk mund të zhbëhet.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {loading ? "Duke fshirë..." : "Po, fshije"}
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Anulo
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Fshi detyrën
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
