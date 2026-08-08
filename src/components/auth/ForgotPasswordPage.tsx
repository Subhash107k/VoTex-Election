import React, { useState, useEffect } from "react";
import { Key, Mail, Vote, ArrowLeft, ShieldCheck, Sun, Moon } from "lucide-react";
import PasswordField from "./PasswordField.tsx";
import PasswordStrength from "../common/PasswordStrength.tsx";
import type { ForgotPasswordForm, ForgotPasswordStep, ThemeMode } from "../../types/auth.ts";

interface ForgotPasswordPageProps {
  setCurrentPath: (path: string) => void;
  loading: boolean;
  forgotForm: ForgotPasswordForm;
  setForgotForm: (form: ForgotPasswordForm) => void;
  forgotStep: ForgotPasswordStep;
  setForgotStep: (step: ForgotPasswordStep) => void;
  handleForgotPasswordSubmit: (event: React.FormEvent) => void;
  handleResetPasswordSubmit: (event: React.FormEvent) => void;
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

export default function ForgotPasswordPage({
  setCurrentPath,
  loading,
  forgotForm,
  setForgotForm,
  forgotStep,
  setForgotStep,
  handleForgotPasswordSubmit,
  handleResetPasswordSubmit,
  theme,
  setTheme,
}: ForgotPasswordPageProps) {
  const isLight = theme === "light";
  const [confirmPassword, setConfirmPassword] = useState("");
  const emailSuggestion = getDomainTypoSuggestion(forgotForm.email);

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

  const [resetOtpCountdown, setResetOtpCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resetOtpCountdown > 0) {
      timer = setInterval(() => setResetOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resetOtpCountdown]);

  useEffect(() => {
    if (forgotStep === "verify") {
      setResetOtpCountdown(60);
    }
  }, [forgotStep]);

  return (
    <div className={`min-h-screen ${bgMain} flex flex-col justify-between relative transition-colors duration-300 font-sans`}>
      {/* Header */}
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
            <h1 className={`font-black text-base ${textTitle} leading-none tracking-tight`}>
              VoTex Account Recovery
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-0.5 uppercase font-bold">
              Secure Password Reset
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
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPath("/login")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border ${bgCard} relative`}>
          
          {loading && (
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 animate-pulse rounded-t-3xl" />
          )}

          <div className="mb-6 text-left">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
              <Key className="h-5 w-5" />
            </div>
            <h2 className={`text-2xl font-black ${textTitle} tracking-tight`}>
              Reset Your Password
            </h2>
            <p className={`text-xs ${textMuted} mt-1`}>
              {forgotStep === "request"
                ? "Enter your registered email address to receive a secure password reset code."
                : "Enter the 6-digit verification code sent to your email and set a new password."}
            </p>
          </div>

          {forgotStep === "request" ? (
            <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="voter@example.com"
                    value={forgotForm.email}
                    onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                    onBlur={() => {
                      if (forgotForm.email !== forgotForm.email.trim()) {
                        setForgotForm({ ...forgotForm, email: forgotForm.email.trim() });
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border ${inputBg}`}
                  />
                </div>
                {emailSuggestion && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    <span>💡 Did you mean <strong>{emailSuggestion}</strong>?</span>
                    <button
                      type="button"
                      onClick={() => setForgotForm({ ...forgotForm, email: emailSuggestion })}
                      className="underline font-bold text-amber-600 dark:text-amber-300 hover:text-amber-400 cursor-pointer ml-auto shrink-0"
                    >
                      Fix typo
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold uppercase rounded-xl tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? "Sending Code..." : "Send Reset Code"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentPath("/login")}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold"
                >
                  Cancel & Return to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4 text-xs font-sans">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl leading-relaxed text-xs font-mono">
                Code sent to <strong>{forgotForm.email}</strong>. Check your inbox or local notification console.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 581223"
                    value={forgotForm.code}
                    onChange={(e) => setForgotForm({ ...forgotForm, code: e.target.value })}
                    className={`w-full px-3 py-2.5 pr-28 rounded-xl border ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (resetOtpCountdown === 0) {
                        setResetOtpCountdown(60);
                        await handleForgotPasswordSubmit({
                          preventDefault: () => {},
                        } as any);
                      }
                    }}
                    disabled={resetOtpCountdown > 0}
                    className={`absolute right-2 top-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
                      resetOtpCountdown > 0
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                    }`}
                  >
                    {resetOtpCountdown > 0 ? `Resend (${resetOtpCountdown}s)` : "Resend OTP"}
                  </button>
                </div>
              </div>

              <PasswordField
                label="New Password"
                value={forgotForm.newPassword}
                onChange={(newPassword) => setForgotForm({ ...forgotForm, newPassword })}
                inputBg={inputBg}
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(val) => setConfirmPassword(val)}
                inputBg={inputBg}
                autoComplete="new-password"
              />

              {confirmPassword.length > 0 && confirmPassword !== forgotForm.newPassword && (
                <p className="text-[11px] text-rose-500 font-mono">Passwords do not match.</p>
              )}

              <PasswordStrength password={forgotForm.newPassword} />

              <button
                type="submit"
                disabled={loading || (confirmPassword.length > 0 && confirmPassword !== forgotForm.newPassword)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold uppercase rounded-xl tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? "Resetting Password..." : "Submit New Password"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setForgotStep("request")}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold"
                >
                  ← Change Email Address
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-200/60 dark:border-slate-900">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Encrypted Session • VoTex Security Recovery</span>
        </div>
      </footer>
    </div>
  );
}
