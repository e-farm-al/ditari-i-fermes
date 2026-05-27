"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Trash2, Pencil, Bell, AlertCircle, Clock, RepeatIcon, ChevronDown, ChevronUp, Plus } from "lucide-react";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  dueTime: string | null;
  repeatType: string;
  status: string;
  updatedAt: string;
};

const REPEAT_LABEL: Record<string, string> = {
  none: "",
  daily: "Çdo ditë",
  weekly: "Çdo javë",
  monthly: "Çdo muaj",
  yearly: "Çdo vit",
};

const MONTHS_ALB = ["Jan","Shk","Mar","Pri","Maj","Qer","Kor","Gus","Sht","Tet","Nën","Dhj"];

function dueDateInfo(dateStr: string): { label: string; overdue: boolean; today: boolean } {
  const todayMs = new Date(new Date().toDateString()).getTime();
  const dueMs   = new Date(dateStr + "T00:00:00").getTime();
  const diffDays = Math.round((dueMs - todayMs) / 86_400_000);

  if (diffDays < 0) return { label: `${Math.abs(diffDays)} ditë vonë`, overdue: true,  today: false };
  if (diffDays === 0) return { label: "Sot",                             overdue: false, today: true  };
  if (diffDays === 1) return { label: "Nesër",                           overdue: false, today: false };
  if (diffDays <= 6)  return { label: `Pas ${diffDays} ditësh`,          overdue: false, today: false };

  const d = new Date(dateStr + "T00:00:00");
  return { label: `${d.getDate()} ${MONTHS_ALB[d.getMonth()]}`, overdue: false, today: false };
}

function ReminderCard({
  reminder,
  farmId,
  onDone,
  onDelete,
}: {
  reminder: Reminder;
  farmId: string;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { label, overdue, today } = dueDateInfo(reminder.dueDate);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const cardBorder = overdue
    ? "border-red-200 bg-red-50"
    : today
    ? "border-amber-200 bg-amber-50"
    : "border-gray-100 bg-white";

  const dateBadge = overdue
    ? "bg-red-100 text-red-700"
    : today
    ? "bg-amber-100 text-amber-700"
    : "bg-gray-100 text-gray-600";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cardBorder}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-gray-900 leading-snug">{reminder.title}</p>
          {reminder.description && (
            <p className="mt-1 text-sm text-gray-500 leading-snug line-clamp-2">{reminder.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${dateBadge}`}>
              {overdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {label}
            </span>
            {reminder.dueTime && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                {reminder.dueTime.slice(0, 5)}
              </span>
            )}
            {reminder.repeatType !== "none" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-600">
                <RepeatIcon className="h-3 w-3" />
                {REPEAT_LABEL[reminder.repeatType]}
              </span>
            )}
          </div>
        </div>
      </div>

      {confirmDelete ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => startTransition(() => onDelete(reminder.id))}
            disabled={isPending}
            className="flex h-10 flex-1 items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? "Duke fshirë..." : "Po, fshije"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Anulo
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => startTransition(() => onDone(reminder.id))}
            disabled={isPending}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-farm-600 text-sm font-semibold text-white hover:bg-farm-700 disabled:opacity-60"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            {isPending ? "..." : "U krye"}
          </button>
          <Link
            href={`/reminders/${reminder.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function RemindersClient({
  farmId,
  pending,
  done,
}: {
  farmId: string;
  pending: Reminder[];
  done: Reminder[];
}) {
  const router = useRouter();
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function markDone(id: string) {
    setBusy(id);
    await fetch(`/api/farms/${farmId}/reminders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setBusy(null);
    router.refresh();
  }

  async function deleteReminder(id: string) {
    setBusy(id);
    await fetch(`/api/farms/${farmId}/reminders/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  const overdue   = pending.filter((r) => dueDateInfo(r.dueDate).overdue);
  const today     = pending.filter((r) => dueDateInfo(r.dueDate).today);
  const upcoming  = pending.filter((r) => { const i = dueDateInfo(r.dueDate); return !i.overdue && !i.today; });

  if (pending.length === 0 && done.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
          <Bell className="h-8 w-8 text-sky-300" strokeWidth={1.5} />
        </div>
        <p className="mt-4 text-base font-bold text-gray-700">Nuk keni kujtesa</p>
        <p className="mt-1 text-sm text-gray-400">Shtoni kujtesa për inspektime dhe aktivitete të fermës</p>
        <Link
          href="/reminders/new"
          className="mt-5 flex h-12 items-center gap-2 rounded-xl bg-farm-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-farm-700"
        >
          <Plus className="h-4 w-4" />
          Shto kujtesë
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {overdue.length > 0 && (
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-red-600">
            <AlertCircle className="h-4 w-4" />
            Vonuara ({overdue.length})
          </p>
          <div className="space-y-3">
            {overdue.map((r) => (
              <ReminderCard key={r.id} reminder={r} farmId={farmId} onDone={markDone} onDelete={deleteReminder} />
            ))}
          </div>
        </section>
      )}

      {today.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-bold text-amber-600">Sot ({today.length})</p>
          <div className="space-y-3">
            {today.map((r) => (
              <ReminderCard key={r.id} reminder={r} farmId={farmId} onDone={markDone} onDelete={deleteReminder} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-bold text-gray-500">Të ardhshme ({upcoming.length})</p>
          <div className="space-y-3">
            {upcoming.map((r) => (
              <ReminderCard key={r.id} reminder={r} farmId={farmId} onDone={markDone} onDelete={deleteReminder} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <button
            onClick={() => setShowDone((p) => !p)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            <span>Të kryera ({done.length})</span>
            {showDone ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showDone && (
            <div className="mt-2 space-y-2">
              {done.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 opacity-60">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 line-through">{r.title}</p>
                    <p className="text-xs text-gray-400">{dueDateInfo(r.dueDate).label}</p>
                  </div>
                  <Check className="h-4 w-4 text-farm-500" strokeWidth={2.5} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
