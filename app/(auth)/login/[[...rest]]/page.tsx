"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, User, Lock, Leaf, Eye, EyeOff, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isPhone = /^[0-9+\s]/.test(identifier);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error); return; }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-farm-50 to-white">
      <div className="h-2 w-full bg-farm-600" />

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-farm-600 shadow-lg shadow-farm-600/30">
            <Leaf className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-farm-900">Ditari i Fermës</h1>
            <p className="mt-0.5 text-sm text-gray-500">Hyrja në llogari</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/80 ring-1 ring-gray-100 space-y-4">

            <div className="space-y-1.5">
              <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700">
                Emri i përdoruesit ose telefoni
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  {isPhone && identifier.length > 0
                    ? <Phone className="h-4 w-4" />
                    : <User className="h-4 w-4" />
                  }
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="agim.brahimi ose 0691234567"
                  autoComplete="username"
                  inputMode="text"
                  className="h-[52px] w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-farm-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-500/20"
                />
              </div>
              <p className="text-xs text-gray-400">
                Shkruani emrin e përdoruesit ose numrin e telefonit
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Fjalëkalimi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-[52px] w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-12 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-farm-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3.5 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[52px] w-full cursor-pointer items-center justify-center rounded-xl bg-farm-600 text-sm font-semibold text-white shadow-md shadow-farm-600/30 transition-all hover:bg-farm-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Duke hyrë...
                </span>
              ) : "Hyr"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Nuk keni llogari?{" "}
              <Link href="/signup" className="font-semibold text-farm-600 hover:underline">
                Regjistrohuni falas
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
