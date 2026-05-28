"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flower2, BookOpen, Bell, Beef, Wheat, Bird, Sprout, QrCode } from "lucide-react";

type Tab = { href: string; Icon: React.ElementType; label: string };

const SECTION_TAB: Record<string, Tab> = {
  bees:      { href: "/hives",   Icon: Flower2, label: "Zgjojt" },
  livestock: { href: "/animals", Icon: Beef,    label: "Kafshët" },
  poultry:   { href: "/poultry", Icon: Bird,    label: "Shpeza" },
  crops:     { href: "/crops",   Icon: Wheat,   label: "Kulturat" },
  mixed:     { href: "/animals", Icon: Sprout,  label: "Seksionet" },
};

export default function BottomNav({ farmType }: { farmType: string }) {
  const pathname = usePathname();
  const section = SECTION_TAB[farmType] ?? SECTION_TAB.bees;

  const leftTabs: Tab[] = [
    { href: "/dashboard", Icon: Home,     label: "Ballina" },
    section,
  ];

  const rightTabs: Tab[] = [
    { href: "/diary",     Icon: BookOpen, label: "Ditari" },
    { href: "/reminders", Icon: Bell,     label: "Kujtesa" },
  ];

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");
  }

  const scanActive = pathname === "/scan";

  return (
    <nav
      className="no-print fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-end">
        {/* Left tabs */}
        {leftTabs.map(({ href, Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                active ? "text-farm-600" : "text-gray-400"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2 : 1.5} />
              <span className={`text-[11px] font-semibold leading-none ${active ? "text-farm-600" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Center scan button — raised above the nav */}
        <div className="relative flex flex-1 flex-col items-center justify-end pb-1.5">
          <Link
            href="/scan"
            aria-label="Skano QR"
            className={`absolute -top-6 flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
              scanActive
                ? "bg-farm-700 shadow-farm-700/40"
                : "bg-farm-600 shadow-farm-600/40"
            }`}
          >
            <QrCode className="h-6 w-6 text-white" strokeWidth={scanActive ? 2 : 1.5} />
          </Link>
          <span className={`mt-auto pt-8 text-[11px] font-semibold leading-none ${
            scanActive ? "text-farm-600" : "text-gray-400"
          }`}>
            Skano
          </span>
        </div>

        {/* Right tabs */}
        {rightTabs.map(({ href, Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                active ? "text-farm-600" : "text-gray-400"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2 : 1.5} />
              <span className={`text-[11px] font-semibold leading-none ${active ? "text-farm-600" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
