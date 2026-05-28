"use client";

import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

export default function QRCodeDisplay({ url }: { url: string }) {
  return (
    <>
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-200">
        <QRCodeSVG value={url} size={200} level="M" />
      </div>

      <button
        onClick={() => window.print()}
        className="no-print flex h-[52px] items-center gap-2 rounded-xl bg-farm-600 px-8 text-sm font-semibold text-white shadow-md shadow-farm-600/30 transition-all hover:bg-farm-700 active:scale-[0.98]"
      >
        <Printer className="h-4 w-4" strokeWidth={1.5} />
        Printo etiketën
      </button>
    </>
  );
}
