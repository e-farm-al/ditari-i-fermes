"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SettingsLogout() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 active:scale-[0.98]"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
      Dil nga llogaria
    </button>
  );
}
