import React, { useState, useEffect } from "react";
import zxcvbn from "zxcvbn";
import {
  Vote,
  User,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  MapPin,
  UserCheck,
  AlertTriangle,
  Key,
  Calendar,
  ArrowRight,
  UserCheck2,
  RefreshCw,
} from "lucide-react";
import BiometricScanner from "./components/BiometricScanner.tsx";
import AdminPanel from "./components/AdminPanel.tsx";
import VoterDashboard from "./components/VoterDashboard.tsx";
import { CandidateDashboard } from "./components/CandidateDashboard.tsx";
import NotificationConsole from "./components/NotificationConsole.tsx";
import PublicLanding from "./components/PublicLanding.tsx";
import AdminLoginPage from "./components/AdminLoginPage.tsx";
import CompleteProfile from "./components/CompleteProfile.tsx";
import SessionManager from "./components/SessionManager.tsx";
import { User as UserType } from "./types.js";

type AuthTab = "login" | "register" | "forgot_password";

export default function App() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname || "/",
  );
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("votex_theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    localStorage.setItem("votex_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    // Keep browser URL synchronized with active path
    if (window.location.pathname !== currentPath) {
      window.history.pushState(null, "", currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("votex_token"),
  );
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "Voter",
  });
  const [regFaceImage, setRegFaceImage] = useState<string>("");
  const [regFaceTemplate, setRegFaceTemplate] = useState<number[] | null>(null);

  // Login Form States
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Forgot password form states
  const [forgotForm, setForgotForm] = useState({
    email: "",
    code: "",
    newPassword: "",
  });
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");

  // System status alerts
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const triggerToast = (msgString: string, isError = false) => {
    if (isError) {
      setErrorMsg(msgString);
      setTimeout(() => setErrorMsg(""), 4500);
    } else {
      setSuccessMsg(msgString);
      setTimeout(() => setSuccessMsg(""), 4500);
    }
  };

  // Check self session on mount and load logout warnings
  useEffect(() => {
    // 1. Read and display any secure session warnings/reasons
    const logoutReason = localStorage.getItem("votex_logout_reason");
    if (logoutReason) {
      const isError =
        logoutReason.toLowerCase().includes("expired") ||
        logoutReason.toLowerCase().includes("invalid") ||
        logoutReason.toLowerCase().includes("error");
      triggerToast(logoutReason, isError);
      localStorage.removeItem("votex_logout_reason");
    }

    // 2. Fetch session if token exists
    if (token) {
      syncSession();
    }
  }, [token]);

  const syncSession = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        // Token expired/invalid - do dynamic logout trigger
        localStorage.removeItem("votex_token");
        setToken(null);
        setCurrentUser(null);
        localStorage.setItem(
          "votex_logout_reason",
          "Your token has expired or is invalid. Please log in again.",
        );
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      localStorage.removeItem("votex_token");
      setToken(null);
      setCurrentUser(null);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent("trigger_votex_logout_confirm"));
  };

  // ----------------------------------------------------
  // FORM HANDLING DISPATCHERS
  // ----------------------------------------------------

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (regForm.password !== regForm.confirmPassword) {
      return triggerToast("Passwords do not match.", true);
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete onboarding.");
      }

      triggerToast(
        `${regForm.role} account successfully registered! Please sign in using your credentials.`,
      );
      setActiveTab("login"); // Switches view to Login tab
      setCurrentPath("/login");
      setRegForm({
        fullName: "",
        username: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        role: "Voter",
      });
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication credentials mismatch.");
      }

      triggerToast("Authentication established. Syncing profiles.");
      localStorage.setItem("votex_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setLoading(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotForm.email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process reset request.");
      }

      triggerToast("Reset security OTP code successfully dispatched!");
      setForgotStep("verify");
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotForm.email,
          code: forgotForm.code,
          newPassword: forgotForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to finalize updates.");
      }

      triggerToast(
        "Your password has been changed successfully. Re-credential logins.",
      );
      setActiveTab("login");
      setForgotStep("request");
      setForgotForm({ email: "", code: "", newPassword: "" });
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Helper trigger to log into presets immediately (extremely convenient for developers checking panels)
  const loginAsPresetUser = async (
    rolePreset: "super" | "officer" | "voter",
  ) => {
    if (Boolean((import.meta as any).env?.PROD)) {
      triggerToast("Demo preset login is disabled in production builds.", true);
      return;
    }

    setErrorMsg("");
    const credentials = {
      super: { email: "admin@vote.com", password: "admin123" },
      officer: { email: "officer@vote.com", password: "officer123" },
      voter: { email: "voter@vote.com", password: "voter123" },
    };

    const payload = credentials[rolePreset];

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication error.");

      triggerToast(`Successfully logged in as ${rolePreset.toUpperCase()}`);
      localStorage.setItem("votex_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col relative font-sans leading-relaxed">
      {/* Toast elements */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 border border-emerald-500 font-medium text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span className="text-xs">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 border border-red-500 font-medium text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-xs">{errorMsg}</span>
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO SESSION */}
      {currentUser && token ? (
        currentUser.role === "Voter" && !currentUser.isProfileComplete ? (
          <CompleteProfile
            token={token}
            user={currentUser}
            onLogout={handleLogout}
            onComplete={(updatedUser) => {
              setCurrentUser(updatedUser);
            }}
          />
        ) : currentUser.role === "Voter" ? (
          <VoterDashboard
            token={token}
            user={currentUser}
            onLogout={handleLogout}
            theme={theme}
            setTheme={setTheme}
          />
        ) : currentUser.role === "Candidate" ? (
          <CandidateDashboard
            token={token}
            user={currentUser}
            onLogout={handleLogout}
            theme={theme}
            setTheme={setTheme}
          />
        ) : (
          <AdminPanel
            token={token}
            onLogout={handleLogout}
            theme={theme}
            setTheme={setTheme}
          />
        )
      ) : currentPath === "/admin/login" ? (
        <AdminLoginPage
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          theme={theme}
          setTheme={setTheme}
        />
      ) : (
        <PublicLanding
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          loading={loading}
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          handleLoginSubmit={handleLoginSubmit}
          regForm={regForm}
          setRegForm={setRegForm}
          regFaceImage={regFaceImage}
          setRegFaceImage={setRegFaceImage}
          regFaceTemplate={regFaceTemplate}
          setRegFaceTemplate={setRegFaceTemplate}
          handleRegisterSubmit={handleRegisterSubmit}
          forgotForm={forgotForm}
          setForgotForm={setForgotForm}
          forgotStep={forgotStep}
          setForgotStep={setForgotStep}
          handleForgotPasswordSubmit={handleForgotPasswordSubmit}
          handleResetPasswordSubmit={handleResetPasswordSubmit}
          loginAsPresetUser={loginAsPresetUser}
          theme={theme}
          setTheme={setTheme}
          passwordStrengthComponent={
            regForm.password &&
            (() => {
              const evaluation = zxcvbn(regForm.password);
              const score = evaluation.score; // 0, 1, 2, 3, 4
              const labels = [
                "Extremely Weak",
                "Weak",
                "Moderate / Fair",
                "Strong",
                "Highly Cryptographic / Safe",
              ];
              const colors = [
                "bg-red-500", // 0
                "bg-orange-500", // 1
                "bg-yellow-500", // 2
                "bg-blue-500", // 3
                "bg-emerald-500", // 4
              ];
              const textColors = [
                "text-red-400",
                "text-orange-400",
                "text-yellow-400",
                "text-blue-400",
                "text-emerald-400",
              ];

              return (
                <div className="mt-1 flex flex-col gap-1 text-[10px] bg-slate-950 p-2 rounded-lg border border-slate-850 text-left">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-400">ENTROPY STRENGTH:</span>
                    <span className={`${textColors[score]} font-bold`}>
                      {labels[score].toUpperCase()}
                    </span>
                  </div>

                  {/* Strength track bars */}
                  <div className="flex gap-1 h-1.5 mt-0.5">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full h-full transition-all duration-300 ${
                          idx <= score ? colors[score] : "bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Suggestions feedback warning */}
                  {(evaluation.feedback.warning ||
                    evaluation.feedback.suggestions?.length > 0) && (
                    <div className="text-slate-500 mt-1 flex flex-col gap-0.5 font-mono leading-relaxed text-[9px] border-t border-slate-850 pt-1.5">
                      {evaluation.feedback.warning && (
                        <div className="text-amber-500 font-bold">
                          ⚠️ Warning: {evaluation.feedback.warning}
                        </div>
                      )}
                      {evaluation.feedback.suggestions?.map((item, index) => (
                        <div key={index}>• {item}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          }
        />
      )}

      {/* CENTRALIZED INACTIVITY & LOGOUT SESSION MANAGER */}
      <SessionManager
        token={token}
        onLogout={(reason) => {
          localStorage.removeItem("votex_token");
          setToken(null);
          setCurrentUser(null);
          if (reason) {
            localStorage.setItem("votex_logout_reason", reason);
          }
        }}
        onExtendSession={async () => {
          await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
        }}
      />

      {/* FOOTER WIDGET: SMTP / SMS captured dispatches buffer */}
      <NotificationConsole />
    </div>
  );
}
