import React from "react";
import {
  Lock,
  Mail,
  Vote,
  ArrowLeft,
  ShieldCheck,
  Sun,
  Moon,
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

  const bgMain = isLight
    ? "bg-slate-50 text-slate-800"
    : "bg-slate-950 text-slate-100";
  const bgCard = isLight
    ? "bg-white border-slate-200/90 shadow-xl"
    : "bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";
  const inputBg = isLight
    ? "bg-slate-100 text-slate-900 border-slate-200 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none placeholder:text-slate-400"
    : "bg-slate-950/80 text-white border-slate-800 focus:border-emerald-500 focus:bg-slate-950 focus:outline-none";

  return (
    <div
      className={`min-h-screen ${bgMain} flex flex-col justify-between relative transition-colors duration-300 font-sans`}
    >
      {/* Top Header / Branding */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentPath("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Vote className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <h1
              className={`font-black text-base ${textTitle} leading-none tracking-tight`}
            >
              VoTex Platform
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-0.5 uppercase font-bold">
              Secure Civic Sign In
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(isLight ? "dark" : "light")}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div
          className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border ${bgCard} relative`}
        >
          {loading && (
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 animate-pulse rounded-t-3xl" />
          )}

          <div className="mb-6 text-center sm:text-left">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className={`text-2xl font-black ${textTitle} tracking-tight`}>
              Sign In to Your Account
            </h2>
            <p className={`text-xs ${textMuted} mt-1`}>
              Enter your registered email address or username to access your
              voter portal.
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
                  className={`w-full px-3 py-2.5 pl-9 rounded-xl border ${inputBg}`}
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              </div>
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
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer mt-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="text-center pt-2">
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
            </div>
          </form>
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-200/60 dark:border-slate-900">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Encrypted Session • VoTex Cryptographic Voting Protocol</span>
        </div>
      </footer>
    </div>
  );
}
