"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, CameraOff, QrCode, CheckCircle2, AlertCircle } from "lucide-react";

type ScanState = "idle" | "starting" | "scanning" | "success" | "error";

export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const scannerRef = useRef<any>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  async function startScanner() {
    setState("starting");
    setMessage("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (w: number, h: number) => {
            const side = Math.floor(Math.min(w, h) * 0.72);
            return { width: side, height: side };
          },
        },
        async (decodedText: string) => {
          await stopScanner();
          handleDecoded(decodedText);
        },
        () => { /* ongoing scan attempt — ignore */ }
      );

      setState("scanning");
    } catch {
      setState("error");
      setMessage("Nuk mund të hapë kamerën. Kontrolloni lejet e kamerës dhe provoni sërish.");
    }
  }

  function handleDecoded(text: string) {
    try {
      const url = new URL(text);
      const isSameApp =
        url.hostname === window.location.hostname ||
        url.hostname === "farmdiary.al";

      if (isSameApp) {
        setState("success");
        setMessage(`Duke hapur: ${url.pathname}`);
        setTimeout(() => router.push(url.pathname + url.search), 600);
      } else {
        setState("error");
        setMessage(`Ky kod QR nuk i përket aplikacionit (${url.hostname}).`);
      }
    } catch {
      setState("error");
      setMessage("Kodi QR nuk përmban një URL të vlefshme.");
    }
  }

  async function handleStop() {
    await stopScanner();
    setState("idle");
    setMessage("");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800 active:scale-95"
          aria-label="Kthehu"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </Link>
        <span className="text-base font-bold text-white">Skano Kodin QR</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-32">

        {/* Camera viewport */}
        <div className="relative w-full max-w-sm">
          {/* Scan frame corners */}
          {state === "scanning" && (
            <>
              <div className="pointer-events-none absolute left-6 top-6 z-10 h-8 w-8 border-l-2 border-t-2 border-farm-400 rounded-tl-lg" />
              <div className="pointer-events-none absolute right-6 top-6 z-10 h-8 w-8 border-r-2 border-t-2 border-farm-400 rounded-tr-lg" />
              <div className="pointer-events-none absolute bottom-6 left-6 z-10 h-8 w-8 border-b-2 border-l-2 border-farm-400 rounded-bl-lg" />
              <div className="pointer-events-none absolute bottom-6 right-6 z-10 h-8 w-8 border-b-2 border-r-2 border-farm-400 rounded-br-lg" />
            </>
          )}

          {/* QR reader container — html5-qrcode injects video here */}
          <div
            id="qr-reader"
            className="w-full overflow-hidden rounded-2xl bg-gray-900"
            style={{ minHeight: state === "idle" ? "0px" : "300px" }}
          />

          {/* Idle placeholder */}
          {state === "idle" && (
            <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-gray-900">
              <div className="flex flex-col items-center gap-3 text-gray-600">
                <QrCode className="h-16 w-16" strokeWidth={1} />
                <p className="text-sm">Kamera nuk është aktive</p>
              </div>
            </div>
          )}
        </div>

        {/* Status message */}
        {message && (
          <div className={`flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium ${
            state === "success"
              ? "bg-emerald-900/60 text-emerald-300 ring-1 ring-emerald-700"
              : "bg-red-900/60 text-red-300 ring-1 ring-red-700"
          }`}>
            {state === "success"
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
              : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            }
            {message}
          </div>
        )}

        {/* Instruction text */}
        {state === "scanning" && (
          <p className="text-center text-sm text-gray-400">
            Vendoseni kodin QR brenda kuadratit
          </p>
        )}

        {/* Action buttons */}
        <div className="flex w-full max-w-sm flex-col gap-3">
          {(state === "idle" || state === "error") && (
            <button
              onClick={startScanner}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-farm-600 text-sm font-bold text-white shadow-lg shadow-farm-600/30 transition-all hover:bg-farm-700 active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" strokeWidth={1.5} />
              Hap kamerën
            </button>
          )}

          {state === "starting" && (
            <div className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-farm-600/60 text-sm font-bold text-white">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Duke hapur kamerën...
            </div>
          )}

          {state === "scanning" && (
            <button
              onClick={handleStop}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-gray-800 text-sm font-bold text-gray-300 transition-all hover:bg-gray-700 active:scale-[0.98]"
            >
              <CameraOff className="h-5 w-5" strokeWidth={1.5} />
              Ndalo kamerën
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
