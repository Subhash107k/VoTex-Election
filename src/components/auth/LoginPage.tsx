import React from "react";
import {
  Lock,
  Mail,
  Vote,
  ArrowLeft,
  ShieldCheck,
  Sun,
  Moon,
  Fingerprint,
  KeyRound,
  Landmark,
  ArrowRight,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import PasswordField from "./PasswordField.tsx";
import type { LoginForm, ThemeMode } from "../../types/auth.ts";

interface LoginPageProps {
  setCurrentPath: (path: string) => void;
  loading: boolean;
  loginForm: LoginForm;
  setLoginForm: (form: LoginForm) => void;
  handleLoginSubmit: (event: React.FormEvent) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const getDomainTypoSuggestion = (emailStr: string): string | null => {
  const trimmed = emailStr.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2) return null;
  const [local, domain] = parts;

  const typoMap: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmai.com": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahooo.com": "yahoo.com",
    "hotmial.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "outlok.com": "outlook.com",
    "icoud.com": "icloud.com",
  };

  if (typoMap[domain]) {
    return `${local}@${typoMap[domain]}`;
  }
  return null;
};

export default function LoginPage({
  setCurrentPath,
  loading,
  loginForm,
  setLoginForm,
  handleLoginSubmit,
  theme,
  setTheme,
}: LoginPageProps) {
  const isLight = theme === "light";
  const emailSuggestion = getDomainTypoSuggestion(loginForm.email);

  const bgMain = isLight
    ? "bg-slate-50 text-slate-800"
    : "bg-[#06110f] text-slate-100";
  const bgCard = isLight
    ? "bg-white border-slate-200 shadow-xl shadow-slate-200/70"
    : "bg-[#0b1714]/95 border-emerald-900/50 shadow-2xl shadow-black/40 backdrop-blur-xl";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const textMuted = isLight ? "text-slate-600" : "text-slate-400";
  const inputBg = isLight
    ? "bg-white text-slate-900 border-slate-300 shadow-sm transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none placeholder:text-slate-400"
    : "bg-[#08110f] text-white border-emerald-950 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none placeholder:text-slate-500";

  return (
    <div
      className={`min-h-screen ${bgMain} flex flex-col justify-between relative overflow-hidden transition-colors duration-300 font-sans`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(90deg,rgba(16,185,129,0.12),rgba(14,165,233,0.10),rgba(245,158,11,0.08))]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-[linear-gradient(0deg,rgba(16,185,129,0.10),transparent)]" />
      </div>

      {/* Top Header / Branding */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentPath("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Vote className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <h1
              className={`font-black text-base ${textTitle} leading-none`}
            >
              VoTex Platform
            </h1>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5 uppercase font-bold">
              Secure Civic Sign In
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(isLight ? "dark" : "light")}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-lg border border-slate-200 dark:border-emerald-950 bg-white/80 dark:bg-[#0b1714]/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            {isLight ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPath("/")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden min-h-[560px] overflow-hidden rounded-lg border border-emerald-900/30 lg:block">
            <img
              src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1400"
              alt="Nepal civic landscape"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.84),rgba(3,7,18,0.42),rgba(3,7,18,0.18))]" />
            <div className="relative flex h-full flex-col justify-between p-8 text-white">
              <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Voter & Candidate Access
              </div>

              <div className="max-w-xl">
                <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-emerald-100">
                  <span className="h-px w-10 bg-emerald-300" />
                  Encrypted identity session
                </div>
                <h2 className="text-4xl font-black leading-tight">
                  Continue to your secure voting or candidate workspace.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
                  Sign in to review your profile status, active elections, or candidate campaign dashboard from one verified account.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Identity", value: "Verified", icon: Fingerprint },
                  { label: "Session", value: "Encrypted", icon: KeyRound },
                  { label: "Ballot", value: "Protected", icon: Landmark },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-white/15 bg-black/25 p-3 backdrop-blur-md"
                  >
                    <item.icon className="mb-3 h-4 w-4 text-emerald-300" />
                    <div className="text-[10px] uppercase text-slate-300">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs font-bold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className={`relative w-full self-center rounded-lg border p-5 sm:p-7 ${bgCard}`}
          >
          {loading && (
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 animate-pulse rounded-t-lg" />
          )}

          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Lock className="h-5 w-5" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Secure gateway
              </div>
            </div>
            <h2 className={`text-3xl font-black ${textTitle}`}>
              Welcome back
            </h2>
            <p className={`text-sm ${textMuted} mt-2 leading-6`}>
              Access your voter or candidate dashboard with your registered email address or username.
            </p>
          </div>

          <form
            onSubmit={handleLoginSubmit}
            className="flex flex-col gap-4 text-xs font-sans"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Email or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter your email or username"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  onBlur={() => {
                    if (loginForm.email !== loginForm.email.trim()) {
                      setLoginForm({
                        ...loginForm,
                        email: loginForm.email.trim(),
                      });
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-3 text-sm ${inputBg}`}
                />
              </div>
              {emailSuggestion && (
                <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-2 rounded-lg">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Did you mean <strong>{emailSuggestion}</strong>?
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLoginForm({ ...loginForm, email: emailSuggestion })
                    }
                    className="underline font-bold text-amber-600 dark:text-amber-300 hover:text-amber-400 cursor-pointer ml-auto shrink-0"
                  >
                    Fix typo
                  </button>
                </div>
              )}
            </div>

            <PasswordField
              label="Password"
              value={loginForm.password}
              onChange={(password) => setLoginForm({ ...loginForm, password })}
              inputBg={inputBg}
              autoComplete="current-password"
              rightAction={
                <button
                  type="button"
                  onClick={() => setCurrentPath("/forgot_password")}
                  className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 py-3.5 text-xs font-extrabold uppercase text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{loading ? "Signing In..." : "Sign In"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 dark:border-emerald-950 dark:bg-[#08110f] dark:text-slate-400 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-emerald-500" />
                <span>Biometric checks enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-500" />
                <span>Session protection active</span>
              </div>
            </div>

            <div className="text-center pt-1">
              <p className={`text-xs ${textMuted}`}>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setCurrentPath("/register")}
                  className="text-emerald-500 font-bold hover:underline cursor-pointer"
                >
                  Create now
                </button>
              </p>
              <button
                type="button"
                onClick={() => setCurrentPath("/admin/login")}
                className="mt-3 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white"
              >
                Administrator access
              </button>
            </div>
          </form>
          </section>
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-500 border-t border-slate-200/60 dark:border-emerald-950/60">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Encrypted Session • VoTex Cryptographic Voting Protocol</span>
        </div>
      </footer>
    </div>
  );
}
