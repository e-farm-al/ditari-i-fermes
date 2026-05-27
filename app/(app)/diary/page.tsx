import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { BookOpen, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ditari — Ditari i Fermës",
};

export default async function DiaryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
          <BookOpen className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
        </div>
        <span className="text-base font-bold text-gray-900">Ditari</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-28 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50">
          <Clock className="h-10 w-10 text-emerald-300" strokeWidth={1.5} />
        </div>
        <h1 className="mt-5 text-xl font-bold text-gray-800">Ditari vjen së shpejti</h1>
        <p className="mt-2 text-base text-gray-500 leading-relaxed max-w-xs">
          Do të mund të regjistroni aktivitetet ditore të fermës tuaj — ushqim, trajtim, vëzhgime dhe më shumë.
        </p>
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-sm text-emerald-700 font-medium">
            Ndërkohë, përdorni <strong>Kujtueset</strong> për të planifikuar detyrat e fermës.
          </p>
        </div>
      </main>
    </div>
  );
}
