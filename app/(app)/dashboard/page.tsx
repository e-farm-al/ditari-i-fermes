import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, farms, farmMembers, hives, reminders } from "@/db";
import { eq, and, count } from "drizzle-orm";
import Link from "next/link";
import {
  BookOpen, Beef, Flower2, Bird, Wheat, Bell,
  Plus, Settings, ChevronRight, Leaf,
  Sprout, Sun, Moon, Coffee,
} from "lucide-react";
import LogoutButton from "../LogoutButton";

const FARM_SECTIONS: Record<string, NavCard[]> = {
  livestock: [
    { href: "/animals",   Icon: Beef,     label: "Kafshët",         desc: "Lopë, dele, dhi — gjithë kopeja", color: "bg-amber-50 text-amber-700" },
    { href: "/reminders", Icon: Bell,     label: "Detyrat",       desc: "Vaksinat dhe detyrat e ardhshme", color: "bg-sky-50 text-sky-700" },
    { href: "/diary",     Icon: BookOpen, label: "Ditari",          desc: "Shëno aktivitetin e sotëm",       color: "bg-emerald-50 text-emerald-700" },
    { href: "/diary",     Icon: Plus,     label: "Shënim i ri",     desc: "Shto regjistrim të shpejtë",      color: "bg-farm-50 text-farm-700" },
  ],
  bees: [
    { href: "/hives",     Icon: Flower2,  label: "Zgjojt",          desc: "Shiko të gjitha bletaret",        color: "bg-amber-50 text-amber-700" },
    { href: "/reminders", Icon: Bell,     label: "Detyrat",       desc: "Inspektimet e planifikuara",      color: "bg-sky-50 text-sky-700" },
    { href: "/diary",     Icon: BookOpen, label: "Ditari",          desc: "Shëno aktivitetin e sotëm",       color: "bg-emerald-50 text-emerald-700" },
    { href: "/hives/new", Icon: Plus,     label: "Zgjo e re",       desc: "Regjistro zgjo të re",            color: "bg-farm-50 text-farm-700" },
  ],
  poultry: [
    { href: "/poultry",   Icon: Bird,     label: "Shpeza",          desc: "Tufat, vezët dhe prodhimi",       color: "bg-amber-50 text-amber-700" },
    { href: "/reminders", Icon: Bell,     label: "Detyrat",       desc: "Vaksinat dhe detyrat e ardhshme", color: "bg-sky-50 text-sky-700" },
    { href: "/diary",     Icon: BookOpen, label: "Ditari",          desc: "Shëno aktivitetin e sotëm",       color: "bg-emerald-50 text-emerald-700" },
    { href: "/diary",     Icon: Plus,     label: "Regjistrim ditor",desc: "Vezë, ushqim, ngordhje",          color: "bg-farm-50 text-farm-700" },
  ],
  crops: [
    { href: "/crops",     Icon: Wheat,    label: "Kulturat",        desc: "Arat dhe sezoni aktiv",           color: "bg-amber-50 text-amber-700" },
    { href: "/reminders", Icon: Bell,     label: "Detyrat",       desc: "Ujitja dhe plehërimi",            color: "bg-sky-50 text-sky-700" },
    { href: "/diary",     Icon: BookOpen, label: "Ditari",          desc: "Shëno aktivitetin e sotëm",       color: "bg-emerald-50 text-emerald-700" },
    { href: "/diary",     Icon: Plus,     label: "Aktivitet i ri",  desc: "Regjistro punën në arë",          color: "bg-farm-50 text-farm-700" },
  ],
  mixed: [
    { href: "/animals",   Icon: Beef,     label: "Kafshët",         desc: "Lopë, dele, dhi...",              color: "bg-amber-50 text-amber-700" },
    { href: "/hives",     Icon: Flower2,  label: "Zgjojt",          desc: "Bletët dhe mjalti",               color: "bg-yellow-50 text-yellow-700" },
    { href: "/crops",     Icon: Wheat,    label: "Kulturat",        desc: "Arat dhe aktivitetet",            color: "bg-lime-50 text-lime-700" },
    { href: "/poultry",   Icon: Bird,     label: "Shpeza",          desc: "Tufat dhe vezët",                 color: "bg-orange-50 text-orange-700" },
    { href: "/diary",     Icon: BookOpen, label: "Ditari",          desc: "Shëno aktivitetin e sotëm",       color: "bg-emerald-50 text-emerald-700" },
    { href: "/reminders", Icon: Bell,     label: "Detyrat",       desc: "Detyrat e ardhshme",              color: "bg-sky-50 text-sky-700" },
  ],
};

type NavCard = { href: string; Icon: React.ElementType; label: string; desc: string; color: string };

const FARM_TYPE_LABEL: Record<string, string> = {
  livestock: "Blegtori",
  bees:      "Bletari",
  poultry:   "Shpezari",
  crops:     "Bujqësi",
  mixed:     "Fermë e përzier",
};

const FARM_TYPE_ICON: Record<string, React.ElementType> = {
  livestock: Beef,
  bees:      Flower2,
  poultry:   Bird,
  crops:     Wheat,
  mixed:     Sprout,
};

function greeting(): { text: string; Icon: React.ElementType } {
  const h = new Date().getHours();
  if (h < 6)  return { text: "Natën e mirë",  Icon: Moon };
  if (h < 12) return { text: "Mirëmëngjes",   Icon: Coffee };
  if (h < 18) return { text: "Mirëdita",      Icon: Sun };
  return             { text: "Mirëmbrëma",    Icon: Moon };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  const farm = membership
    ? (await db.select().from(farms).where(eq(farms.id, membership.farmId)).limit(1))[0]
    : null;

  const farmType = (farm?.farmType ?? "mixed") as string;
  const cards = FARM_SECTIONS[farmType] ?? FARM_SECTIONS.mixed;
  const FarmIcon = FARM_TYPE_ICON[farmType] ?? Sprout;
  const firstName = session.name.split(" ")[0];
  const { text: greetText, Icon: GreetIcon } = greeting();

  // Beekeeper stats
  let hiveCount = 0;
  let reminderCount = 0;
  if (farmType === "bees" && farm) {
    const [hc] = await db
      .select({ n: count() })
      .from(hives)
      .where(and(eq(hives.farmId, farm.id), eq(hives.status, "active")));
    const [rc] = await db
      .select({ n: count() })
      .from(reminders)
      .where(and(eq(reminders.farmId, farm.id), eq(reminders.status, "pending")));
    hiveCount = hc?.n ?? 0;
    reminderCount = rc?.n ?? 0;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-farm-600">
            <Leaf className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-bold text-farm-900">Ditari i Fermës</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cilësimet"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-5">

        {/* ── Greeting hero ── */}
        <section className="mb-5 rounded-2xl bg-gradient-to-br from-farm-600 to-farm-700 p-5 text-white shadow-lg shadow-farm-700/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-farm-200 text-sm font-medium">
                <GreetIcon className="h-4 w-4" strokeWidth={1.5} />
                {greetText}
              </p>
              <h1 className="mt-1 text-2xl font-bold">{firstName}!</h1>
              {farm && (
                <p className="mt-0.5 text-farm-100 text-sm font-medium">{farm.name}</p>
              )}
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <FarmIcon className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
          </div>

          {farm && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <FarmIcon className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="text-xs font-semibold">{FARM_TYPE_LABEL[farmType]}</span>
              {farm.region && <span className="text-farm-300 text-xs">· {farm.region}</span>}
            </div>
          )}
        </section>

        {/* ── Beekeeper stats strip ── */}
        {farmType === "bees" && farm && (
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Link
              href="/hives"
              className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100 hover:ring-amber-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Flower2 className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 leading-none">{hiveCount}</p>
                <p className="mt-0.5 text-xs font-medium text-amber-600">Zgjoje aktive</p>
              </div>
            </Link>
            <Link
              href="/reminders"
              className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ${
                reminderCount > 0
                  ? "bg-sky-50 ring-sky-100 hover:ring-sky-200"
                  : "bg-gray-50 ring-gray-100 hover:ring-gray-200"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                reminderCount > 0 ? "bg-sky-100" : "bg-gray-100"
              }`}>
                <Bell className={`h-5 w-5 ${reminderCount > 0 ? "text-sky-600" : "text-gray-400"}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className={`text-2xl font-bold leading-none ${reminderCount > 0 ? "text-sky-700" : "text-gray-400"}`}>
                  {reminderCount}
                </p>
                <p className={`mt-0.5 text-xs font-medium ${reminderCount > 0 ? "text-sky-600" : "text-gray-400"}`}>
                  Kujtuese
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* ── Navigation cards ── */}
        <div className={`grid gap-3 ${cards.length > 4 ? "grid-cols-2" : "grid-cols-2"}`}>
          {cards.map(({ href, Icon, label, desc, color }) => (
            <Link
              key={href + label}
              href={href}
              className="group flex cursor-pointer flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all duration-150 hover:ring-farm-200 hover:shadow-md active:scale-[0.97]"
            >
              <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] font-bold text-gray-900 leading-tight">{label}</p>
              <p className="mt-1 text-xs text-gray-500 leading-snug">{desc}</p>
              <ChevronRight className="mt-3 h-4 w-4 self-end text-gray-300 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        {/* ── No farm prompt ── */}
        {!farm && (
          <section className="mt-4 rounded-2xl border-2 border-dashed border-farm-200 bg-farm-50/50 p-6 text-center">
            <Sprout className="mx-auto h-10 w-10 text-farm-400" strokeWidth={1.5} />
            <p className="mt-3 text-base font-bold text-farm-700">Nuk keni fermë të regjistruar</p>
            <p className="mt-1 text-sm text-gray-500">Krijoni fermën tuaj për të filluar.</p>
            <Link
              href="/farms/new"
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-farm-600 px-5 py-3 text-sm font-semibold text-white hover:bg-farm-700"
            >
              <Plus className="h-4 w-4" />
              Krijo fermë
            </Link>
          </section>
        )}

      </main>
    </div>
  );
}
