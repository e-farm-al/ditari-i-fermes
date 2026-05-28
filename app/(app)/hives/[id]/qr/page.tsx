import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db, farms, farmMembers, hives, qrCodes } from "@/db";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Flower2 } from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";

const HIVE_TYPE_LABEL: Record<string, string> = {
  langstroth: "Langstroth", dadant: "Dadant",
  top_bar: "Top Bar", warre: "Warré", other: "Tjetër",
};

// Unambiguous chars only — no 0/O, 1/I/L
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

async function getOrCreateCode(entityType: string, entityId: string, farmId: string): Promise<string> {
  const [existing] = await db
    .select({ code: qrCodes.code })
    .from(qrCodes)
    .where(and(eq(qrCodes.entityType, entityType), eq(qrCodes.entityId, entityId)))
    .limit(1);

  if (existing) return existing.code;

  // Generate a unique 6-char code with collision retry
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Array.from(
      { length: 6 },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join("");

    try {
      await db.insert(qrCodes).values({ code, entityType, entityId, farmId });
      return code;
    } catch {
      // Primary key collision — retry with a new code
    }
  }
  throw new Error("Could not generate unique QR code");
}

function fmt(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("sq-AL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default async function HiveQRPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ farmId: farmMembers.farmId })
    .from(farmMembers)
    .where(eq(farmMembers.userId, session.userId))
    .limit(1);

  if (!membership) redirect("/dashboard");

  const [[hive], [farm]] = await Promise.all([
    db.select().from(hives)
      .where(and(eq(hives.id, params.id), eq(hives.farmId, membership.farmId)))
      .limit(1),
    db.select({ name: farms.name }).from(farms)
      .where(eq(farms.id, membership.farmId))
      .limit(1),
  ]);

  if (!hive) notFound();

  const shortCode = await getOrCreateCode("hive", hive.id, membership.farmId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://farmdiary.al";
  const qrUrl = `${appUrl}/q/${shortCode}`;

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Header — hidden when printing */}
      <header className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <Link
          href={`/hives/${hive.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 active:scale-95"
          aria-label="Kthehu"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </Link>
        <span className="text-base font-bold text-farm-900">
          Etiketa e kosheresë — {hive.hiveCode}
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8">
        {/* Print guidance — hidden when printing */}
        <p className="no-print mb-6 text-center text-sm text-gray-500">
          Printoni këtë etiketë dhe vendoseni mbi koshere.
        </p>

        {/* ── A6 label card ── */}
        <div className="w-full max-w-[340px] rounded-3xl bg-white p-8 shadow-lg ring-1 ring-gray-100 flex flex-col items-center gap-5 print:shadow-none print:ring-0 print:rounded-none print:p-6">

          {/* Farm name */}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
            {farm?.name ?? "Ditari i Fermës"}
          </p>

          {/* Hive identity — the main visual on the label */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50">
              <Flower2 className="h-10 w-10 text-amber-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-gray-900">
                {hive.hiveCode}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Lloji : {HIVE_TYPE_LABEL[hive.hiveType] ?? hive.hiveType}
                <br />
                Vendodhja : {hive.locationNotes ? ` · ${hive.locationNotes}` : ""}
              </p>
              {hive.installationDate && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Instaluar {fmt(hive.installationDate)}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-dashed border-gray-200" />

          {/* QR code + print button (client component) */}
          <QRCodeDisplay url={qrUrl} />

          {/* App watermark */}
          <p className="text-[10px] text-gray-300">farmdiary.al</p>
        </div>
      </main>
    </div>
  );
}
