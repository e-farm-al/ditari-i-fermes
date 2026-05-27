"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (localStorage.getItem("notif_dismissed") === "1") return;
    if (Notification.permission === "granted") return;
    // Small delay so banner doesn't flash on first render
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setVisible(false); return; }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID key missing");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          deviceInfo: navigator.userAgent.slice(0, 200),
        }),
      });

      setDone(true);
      setTimeout(() => setVisible(false), 2000);
    } catch {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    localStorage.setItem("notif_dismissed", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
      {done ? (
        <p className="text-sm font-semibold text-sky-700 text-center">
          Njoftimet u aktivizuan!
        </p>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
            <Bell className="h-5 w-5 text-sky-600" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">Aktivizo njoftimet</p>
            <p className="mt-0.5 text-xs text-gray-500 leading-snug">
              Marr njoftim kur afrohen inspektimet dhe detyrat
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={subscribe}
                disabled={loading}
                className="flex h-9 items-center rounded-xl bg-sky-600 px-4 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {loading ? "Duke u aktivizuar..." : "Aktivizo"}
              </button>
              <button
                onClick={dismiss}
                className="flex h-9 items-center rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                Jo tani
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="shrink-0 text-gray-300 hover:text-gray-500" aria-label="Mbyll">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
