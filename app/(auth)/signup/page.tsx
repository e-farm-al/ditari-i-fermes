"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Leaf, User, Phone, Mail, Lock, Eye, EyeOff,
  ChevronRight, ChevronLeft, AlertCircle,
  Beef, Bird, Flower2, Wheat, Sprout, MapPin,
} from "lucide-react";

const FARM_TYPES = [
  { value: "livestock", Icon: Beef,    label: "Blegtori",   hint: "Lopë, dele, dhi, kuaj" },
  { value: "poultry",   Icon: Bird,    label: "Shpezari",   hint: "Pula, rosë, gjelinë" },
  { value: "bees",      Icon: Flower2, label: "Bletari",    hint: "Zgjoje dhe mjaltë" },
  { value: "crops",     Icon: Wheat,   label: "Bujqësi",    hint: "Grurë, misër, perime" },
  { value: "mixed",     Icon: Sprout,  label: "E përzier",  hint: "Kafshë dhe bujqësi" },
] as const;

const REGIONS = [
  "Berat","Dibër","Durrës","Elbasan","Fier",
  "Gjirokastër","Korçë","Kukës","Lezhë",
  "Shkodër","Tiranë","Vlorë",
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [farmName, setFarmName] = useState("");
  const [farmType, setFarmType] = useState("mixed");
  const [region, setRegion] = useState("");

  function validateStep1() {
    if (!name.trim()) return "Emri është i detyrueshëm";
    if (!phone.trim() || !/^[0-9+\s]{7,15}$/.test(phone.trim()))
      return "Numri i telefonit nuk është i vlefshëm";
    if (username && !/^[a-z0-9._]{3,30}$/.test(username.toLowerCase()))
      return "Emri i përdoruesit mund të ketë vetëm shkronja, numra, pikë dhe nënvizë (3-30 karaktere)";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Adresa email nuk është e vlefshme";
    if (password.length < 6) return "Fjalëkalimi duhet të ketë të paktën 6 karaktere";
    return null;
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!farmName.trim()) { setError("Emri i fermës është i detyrueshëm"); return; }
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username: username || undefined, phone, email: email || undefined, password, farmName, farmType, region: region || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      if (data.error?.includes("telefon") || data.error?.includes("përdorues")) setStep(1);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-farm-50 to-white">
      <div className="h-2 w-full bg-farm-600" />

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-farm-600 shadow-lg shadow-farm-600/30">
            <Leaf className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-farm-900">Ditari i Fermës</h1>
            <p className="mt-0.5 text-sm text-gray-500">Regjistrim falas</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="mb-6 flex w-full max-w-sm items-center gap-3">
          <StepBadge n={1} active={step === 1} done={step === 2} label="Rreth jush" />
          <div className="flex-1 h-0.5 rounded-full bg-gray-200 overflow-hidden">
            <div className={`h-full bg-farm-500 transition-all duration-500 ${step === 2 ? "w-full" : "w-0"}`} />
          </div>
          <StepBadge n={2} active={step === 2} done={false} label="Ferma" />
        </div>

        <div className="w-full max-w-sm">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <form onSubmit={goToStep2} className="rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/80 ring-1 ring-gray-100 space-y-4">
              <h2 className="text-base font-bold text-gray-800">Rreth jush</h2>

              <InputField
                id="name" label="Emri i plotë" required
                Icon={User} placeholder="Agim Brahimi"
                value={name} onChange={setName}
                autoComplete="name"
              />

              <InputField
                id="phone" label="Numri i telefonit" required
                hint="Do të përdoret për hyrje"
                Icon={Phone} placeholder="0691234567"
                value={phone} onChange={setPhone}
                type="tel" inputMode="tel" autoComplete="tel"
              />

              <InputField
                id="email" label="Email"
                hint="Opsional"
                Icon={Mail} placeholder="agim@email.com"
                value={email} onChange={setEmail}
                type="email" autoComplete="email"
              />

              <InputField
                id="username" label="Emri i përdoruesit"
                hint="Opsional — krijohet automatikisht"
                Icon={User} placeholder="agim.brahimi"
                value={username} onChange={(v) => setUsername(v.toLowerCase())}
                autoComplete="username"
              />
              {username && (
                <p className="mt-[-8px] text-xs text-gray-400">
                  Do të hyni me: <span className="font-medium text-farm-700">{username}</span>
                </p>
              )}

              {/* Password with toggle */}
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Fjalëkalimi</label>
                  <span className="text-xs text-gray-400">Të paktën 6 karaktere</span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required minLength={6}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3.5 text-gray-400 hover:text-gray-600"
                    aria-label={showPass ? "Fshih" : "Shfaq"}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <button type="submit" className={btnCls}>
                Vazhdo
                <ChevronRight className="h-4 w-4" />
              </button>

              <p className="text-center text-sm text-gray-500">
                Keni llogari?{" "}
                <Link href="/login" className="font-semibold text-farm-600 hover:underline">
                  Hyni këtu
                </Link>
              </p>
            </form>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/80 ring-1 ring-gray-100 space-y-5">
              <h2 className="text-base font-bold text-gray-800">Ferma juaj</h2>

              <InputField
                id="farmName" label="Emri i fermës" required
                Icon={Sprout} placeholder='p.sh. "Ferma Brahimi"'
                value={farmName} onChange={setFarmName}
              />

              {/* Farm type grid */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Lloji i fermës
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FARM_TYPES.map(({ value, Icon, label, hint }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFarmType(value)}
                      className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 p-3.5 text-center transition-all duration-150 ${
                        farmType === value
                          ? "border-farm-500 bg-farm-50 shadow-sm shadow-farm-100"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                      }`}
                    >
                      <Icon
                        className={`h-7 w-7 ${farmType === value ? "text-farm-600" : "text-gray-400"}`}
                        strokeWidth={1.5}
                      />
                      <span className={`mt-1.5 text-xs font-bold ${farmType === value ? "text-farm-800" : "text-gray-700"}`}>
                        {label}
                      </span>
                      <span className="mt-0.5 text-[10px] leading-tight text-gray-400">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-1.5">
                  <label htmlFor="region" className="block text-sm font-semibold text-gray-700">Rajoni</label>
                  <span className="text-xs text-gray-400">Opsional</span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <select
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="">-- Zgjidhni rajonin --</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => { setError(""); setStep(1); }}
                  className="flex h-[52px] cursor-pointer items-center justify-center gap-1 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Mbrapa
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 ${btnCls}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Duke u regjistruar...
                    </span>
                  ) : "Regjistrohu"}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}

// ── Shared components ──

function InputField({
  id, label, hint, required, Icon, placeholder,
  value, onChange, type = "text", inputMode, autoComplete,
}: {
  id: string; label: string; hint?: string; required?: boolean;
  Icon: React.ElementType; placeholder: string;
  value: string; onChange: (v: string) => void;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
          {label}{required && <span className="ml-0.5 text-farm-500">*</span>}
        </label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
          <Icon className="h-4 w-4" />
        </div>
        <input
          id={id} type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required} placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={inputCls}
        />
      </div>
    </div>
  );
}

function StepBadge({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
        done ? "bg-farm-500 text-white" : active ? "bg-farm-600 text-white shadow-md shadow-farm-600/30" : "bg-gray-100 text-gray-400"
      }`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-[10px] font-medium ${active ? "text-farm-700" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-100">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const inputCls = "h-[52px] w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-farm-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-farm-500/20";
const btnCls = "flex h-[52px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-farm-600 text-sm font-semibold text-white shadow-md shadow-farm-600/30 transition-all hover:bg-farm-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
