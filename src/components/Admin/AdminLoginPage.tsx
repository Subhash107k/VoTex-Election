import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import type { ThemeMode } from "../../types/auth.ts";

interface AdminLoginPageProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export default function AdminLoginPage({
  currentPath,
  setCurrentPath,
  theme,
  setTheme,
}: AdminLoginPageProps) {
  const [adminLoginForm, setAdminLoginForm] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [adminForgotStep, setAdminForgotStep] = useState<
    "login" | "request" | "verify"
  >("login");
  const [adminResetForm, setAdminResetForm] = useState({
    email: "",
    code: "",
    newPassword: "",
  });
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [adminLocalLoading, setAdminLocalLoading] = useState(false);
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [adminResetOtpCountdown, setAdminResetOtpCountdown] = useState(0);

  useEffect(() => {
    if (adminResetOtpCountdown > 0) {
      const interval = setInterval(() => {
        setAdminResetOtpCountdown((current) => current - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [adminResetOtpCountdown]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");
    setAdminLocalLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminLoginForm.usernameOrEmail,
          password: adminLoginForm.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Administrative credentials invalid.");
      }

      if (data.user.role === "Voter") {
        throw new Error(
          "Access denied. This login is reserved for administrative accounts.",
        );
      }

      setAdminSuccess(
        "Administrative authorization established. Redirecting to the command panel.",
      );
      localStorage.setItem("votex_token", data.token);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminLocalLoading(false);
    }
  };

  const handleAdminForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");
    setAdminLocalLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminResetForm.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed secure reset dispatch.");
      }

      setAdminSuccess("Recovery code dispatched successfully.");
      setAdminForgotStep("verify");
      setAdminResetOtpCountdown(60);
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminLocalLoading(false);
    }
  };

  const handleAdminResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");
    setAdminLocalLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminResetForm.email,
          code: adminResetForm.code,
          newPassword: adminResetForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password update failed.");
      }

      setAdminSuccess(
        "Password updated. Sign in again with the new credentials.",
      );
      setTimeout(() => {
        setAdminForgotStep("login");
        setAdminResetForm({ email: "", code: "", newPassword: "" });
        setAdminLoginForm((prev) => ({ ...prev, password: "" }));
      }, 1200);
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminLocalLoading(false);
    }
  };

  const isLight = theme === "light";
  const bgMain = isLight
    ? "bg-[radial-gradient(circle_at_top,_#eff6ff,_#ffffff_55%,_#f8fafc_100%)] text-slate-800"
    : "bg-[radial-gradient(circle_at_top,_rgba(15,23,42,1),_rgba(2,6,23,1)_60%,_rgba(3,7,18,1)_100%)] text-slate-100";
  const cardBg = isLight
    ? "bg-white/90 border-slate-200 shadow-xl shadow-slate-200/50"
    : "bg-slate-950/80 border-slate-800 shadow-2xl shadow-black/30";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div
      className={`min-h-screen ${bgMain} flex items-center justify-center px-4 py-10 transition-colors duration-300`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 w-full max-w-xl rounded-3xl border ${cardBg} backdrop-blur-xl overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <button
            type="button"
            onClick={() => setCurrentPath("/")}
            className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${textMuted} hover:text-emerald-500 transition-colors`}
          >
            <ShieldCheck className="w-4 h-4" />
            Public portal
          </button>

          <button
            type="button"
            onClick={() => setTheme(isLight ? "dark" : "light")}
            className={`rounded-xl border px-3 py-2 text-xs font-bold ${isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-800 bg-slate-900 text-slate-200"}`}
          >
            {isLight ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 md:px-8 md:pb-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl bg-linear-to-br from-emerald-500 to-blue-600 p-3 text-slate-950 shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <p
                className={`text-[10px] font-mono font-black uppercase tracking-[0.35em] ${textMuted}`}
              >
                Administrative Control Center
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
                Separate Admin Login
              </h1>
              <p className={`mt-1 text-sm ${textMuted}`}>
                Use administrative credentials only. Voter login lives on the
                public portal.
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setAdminForgotStep("login")}
              className={`rounded-full border px-3 py-1.5 ${adminForgotStep === "login" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : isLight ? "border-slate-200 text-slate-600" : "border-slate-800 text-slate-400"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAdminForgotStep("request")}
              className={`rounded-full border px-3 py-1.5 ${adminForgotStep === "request" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : isLight ? "border-slate-200 text-slate-600" : "border-slate-800 text-slate-400"}`}
            >
              Reset Password
            </button>
          </div>

          {(adminError || adminSuccess) && (
            <div className="mb-5 space-y-3">
              {adminError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {adminError}
                </div>
              )}
              {adminSuccess && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
                  {adminSuccess}
                </div>
              )}
            </div>
          )}

          {adminForgotStep === "login" && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label
                  className={`mb-2 block text-xs font-bold uppercase tracking-widest ${textMuted}`}
                >
                  Email or username
                </label>
                <input
                  type="text"
                  value={adminLoginForm.usernameOrEmail}
                  onChange={(e) =>
                    setAdminLoginForm({
                      ...adminLoginForm,
                      usernameOrEmail: e.target.value,
                    })
                  }
                  placeholder="admin or admin@vote.com"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${isLight ? "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500" : "border-slate-800 bg-slate-900 text-slate-100 focus:border-emerald-500"}`}
                />
              </div>

              <div>
                <label
                  className={`mb-2 block text-xs font-bold uppercase tracking-widest ${textMuted}`}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={adminShowPassword ? "text" : "password"}
                    value={adminLoginForm.password}
                    onChange={(e) =>
                      setAdminLoginForm({
                        ...adminLoginForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border px-4 py-3 pr-12 outline-none transition-colors ${isLight ? "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500" : "border-slate-800 bg-slate-900 text-slate-100 focus:border-emerald-500"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setAdminShowPassword(!adminShowPassword)}
                    className={`absolute inset-y-0 right-0 flex items-center px-4 ${textMuted} hover:text-emerald-500`}
                  >
                    {adminShowPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLocalLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-500 to-blue-600 px-4 py-3 text-sm font-extrabold uppercase tracking-wider text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {adminLocalLoading ? "Verifying..." : "Enter Admin Console"}
                </span>
                {!adminLocalLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div
                className={`flex flex-wrap items-center justify-between gap-3 text-xs ${textMuted}`}
              >
                <button
                  type="button"
                  onClick={() => setCurrentPath("/login")}
                  className="font-bold text-emerald-500 hover:underline"
                >
                  Go to voter login
                </button>
                <button
                  type="button"
                  onClick={() => setAdminForgotStep("request")}
                  className="font-bold text-blue-500 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {adminForgotStep === "request" && (
            <form
              onSubmit={handleAdminForgotPasswordSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  className={`mb-2 block text-xs font-bold uppercase tracking-widest ${textMuted}`}
                >
                  Admin email
                </label>
                <input
                  type="email"
                  value={adminResetForm.email}
                  onChange={(e) =>
                    setAdminResetForm({
                      ...adminResetForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="admin@vote.com"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${isLight ? "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500" : "border-slate-800 bg-slate-900 text-slate-100 focus:border-emerald-500"}`}
                />
              </div>

              <button
                type="submit"
                disabled={adminLocalLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-extrabold uppercase tracking-wider text-emerald-500 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {adminLocalLoading ? "Sending..." : "Request reset OTP"}
              </button>

              <button
                type="button"
                onClick={() => setAdminForgotStep("login")}
                className={`w-full text-center text-xs font-bold uppercase tracking-widest ${textMuted} hover:text-emerald-500`}
              >
                Back to login
              </button>
            </form>
          )}

          {adminForgotStep === "verify" && (
            <form
              onSubmit={handleAdminResetPasswordSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  className={`mb-2 block text-xs font-bold uppercase tracking-widest ${textMuted}`}
                >
                  Verification code
                </label>
                <input
                  type="text"
                  value={adminResetForm.code}
                  onChange={(e) =>
                    setAdminResetForm({
                      ...adminResetForm,
                      code: e.target.value,
                    })
                  }
                  placeholder="Enter the 6-digit code"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${isLight ? "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500" : "border-slate-800 bg-slate-900 text-slate-100 focus:border-emerald-500"}`}
                />
              </div>

              <div>
                <label
                  className={`mb-2 block text-xs font-bold uppercase tracking-widest ${textMuted}`}
                >
                  New password
                </label>
                <input
                  type="password"
                  value={adminResetForm.newPassword}
                  onChange={(e) =>
                    setAdminResetForm({
                      ...adminResetForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Create a new password"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${isLight ? "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500" : "border-slate-800 bg-slate-900 text-slate-100 focus:border-emerald-500"}`}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={async () => {
                    if (adminResetOtpCountdown === 0) {
                      await handleAdminForgotPasswordSubmit({
                        preventDefault: () => undefined,
                      } as React.FormEvent);
                    }
                  }}
                  disabled={adminResetOtpCountdown > 0 || adminLocalLoading}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-600 transition-colors hover:border-emerald-500 hover:text-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:text-slate-300"
                >
                  {adminResetOtpCountdown > 0
                    ? `Resend (${adminResetOtpCountdown}s)`
                    : "Resend code"}
                </button>

                <button
                  type="submit"
                  disabled={adminLocalLoading}
                  className="flex-1 rounded-2xl bg-linear-to-r from-emerald-500 to-blue-600 px-4 py-3 text-sm font-extrabold uppercase tracking-wider text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {adminLocalLoading ? "Updating..." : "Update password"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAdminForgotStep("login")}
                className={`w-full text-center text-xs font-bold uppercase tracking-widest ${textMuted} hover:text-emerald-500`}
              >
                Back to login
              </button>
            </form>
          )}

          <div
            className={`mt-8 rounded-2xl border px-4 py-4 text-xs ${isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-slate-800 bg-slate-900/70 text-slate-400"}`}
          >
            Route:{" "}
            <span className="font-bold text-emerald-500">{currentPath}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
