"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      aria-label="Dil"
    >
      <LogOut className="h-3.5 w-3.5" />
      Dil
    </button>
  );
}
