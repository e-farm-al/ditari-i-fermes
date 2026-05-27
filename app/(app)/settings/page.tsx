import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Settings, User, Bell, Shield, Info, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import SettingsLogout from "./SettingsLogout";

export const metadata: Metadata = {
  title: "Cilësimet — Ditari i Fermës",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const firstName = session.name.split(" ")[0];

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
          <Settings className="h-4 w-4 text-gray-600" strokeWidth={1.5} />
        </div>
        <span className="text-base font-bold text-gray-900">Cilësimet</span>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5 space-y-4">
        {/* Profile card */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-farm-100">
              <User className="h-7 w-7 text-farm-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{session.name}</p>
              <p className="text-sm text-gray-500">Bletari</p>
            </div>
          </div>
        </div>

        {/* Settings sections */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden divide-y divide-gray-50">
          <SettingRow icon={Bell} label="Njoftimet" desc="Menaxho njoftimet e aplikacionit" href="#" comingSoon />
          <SettingRow icon={Shield} label="Privatësia" desc="Të dhënat dhe siguria e llogarisë" href="#" comingSoon />
          <SettingRow icon={Info} label="Rreth aplikacionit" desc="Versioni 1.0 — Ditari i Fermës" href="#" comingSoon />
        </div>

        {/* Logout */}
        <SettingsLogout />

        <p className="text-center text-xs text-gray-300 pt-2">
          farmdiary.al · v1.0 · © 2026
        </p>
      </main>
    </div>
  );
}

function SettingRow({
  icon: Icon, label, desc, href, comingSoon,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  href: string;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
        <Icon className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      {comingSoon ? (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">Shpejt</span>
      ) : (
        <ChevronRight className="h-4 w-4 text-gray-300" />
      )}
    </div>
  );
}
