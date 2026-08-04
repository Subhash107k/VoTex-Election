import React, { lazy, Suspense, useEffect, useState } from "react";

import ErrorBoundary from "./components/common/ErrorBoundary.tsx";
import NotificationConsole from "./components/dashboard/NotificationConsole.tsx";
import SessionManager from "./components/dashboard/SessionManager.tsx";
import Toast from "./components/common/Toast.tsx";
import { useBrowserPath } from "./hooks/useBrowserPath.ts";
import { usePersistentTheme } from "./hooks/usePersistentTheme.ts";
import { useToast } from "./hooks/useToast.ts";
import {
  getCurrentUser,
  getUserPreferences,
  loginAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
  updateUserPreferences,
} from "./services/authService.ts";
import type {
  ForgotPasswordForm,
  ForgotPasswordStep,
  LoginForm,
  RegisterForm,
} from "./types/auth.ts";
import type { User } from "./types.js";

const AdminLoginPage = lazy(
  () => import("./components/Admin/AdminLoginPage.tsx"),
);
const AdminPanel = lazy(() => import("./components/Admin/AdminPanel.tsx"));
const PublicLanding = lazy(
  () => import("./components/dashboard/PublicLanding.tsx"),
);
const LoginPage = lazy(() => import("./components/auth/LoginPage.tsx"));
const RegisterPage = lazy(() => import("./components/auth/RegisterPage.tsx"));
const ForgotPasswordPage = lazy(
  () => import("./components/auth/ForgotPasswordPage.tsx"),
);
const VoterDashboard = lazy(
  () => import("./components/dashboard/VoterDashboard.tsx"),
);
const CandidateDashboard = lazy(() =>
  import("./components/dashboard/CandidateDashboard.tsx").then((module) => ({
    default: module.CandidateDashboard,
  })),
);
const CompleteProfile = lazy(
  () => import("./components/dashboard/CompleteProfile.tsx"),
);

const TOKEN_STORAGE_KEY = "votex_token";
const LOGOUT_REASON_KEY = "votex_logout_reason";

const emptyRegisterForm: RegisterForm = {
  fullName: "",
  username: "",
  email: "",
  mobile: "",
  nationalID: "",
  citizenshipNumber: "",
  dob: "",
  gender: "Male",
  occupation: "",
  password: "",
  confirmPassword: "",
  role: "Voter",
};

const emptyLoginForm: LoginForm = {
  email: "",
  password: "",
};

const emptyForgotPasswordForm: ForgotPasswordForm = {
  email: "",
  code: "",
  newPassword: "",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function isSessionErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes("expired") ||
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("error")
  );
}

function calculateAge(dobString: string) {
  const dobDate = new Date(dobString);
  if (Number.isNaN(dobDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const m = today.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
    age -= 1;
  }
  return age;
}

export default function App() {
  const { currentPath, setCurrentPath } = useBrowserPath();
  const { theme, setTheme } = usePersistentTheme();
  const { toast, showToast } = useToast();

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(token));
  const [preferencesReady, setPreferencesReady] = useState(false);

  const [regForm, setRegForm] = useState<RegisterForm>(emptyRegisterForm);
  const [regFaceImage, setRegFaceImage] = useState("");
  const [regFaceTemplate, setRegFaceTemplate] = useState<number[] | null>(null);

  const [loginForm, setLoginForm] = useState<LoginForm>(emptyLoginForm);

  const [forgotForm, setForgotForm] = useState<ForgotPasswordForm>(
    emptyForgotPasswordForm,
  );
  const [forgotStep, setForgotStep] = useState<ForgotPasswordStep>("request");

  const clearSession = (reason?: string) => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setCurrentUser(null);

    if (reason) {
      localStorage.setItem(LOGOUT_REASON_KEY, reason);
    }
  };

  const saveSession = (newToken: string, user: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setCurrentUser(user);
  };

  const syncSession = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getCurrentUser(token);
      setCurrentUser(data.user);
    } catch (error) {
      console.error(error);
      clearSession("Your session ended. Please sign in again.");
      setCurrentPath("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const logoutReason = localStorage.getItem(LOGOUT_REASON_KEY);

    if (logoutReason) {
      showToast(
        logoutReason,
        isSessionErrorMessage(logoutReason) ? "error" : "success",
      );
      localStorage.removeItem(LOGOUT_REASON_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let active = true;

    const refreshCurrentUser = async () => {
      try {
        const data = await getCurrentUser(token);
        if (!active) return;
        setCurrentUser(data.user);
      } catch (error) {
        console.error(error);
        if (!active) return;
        clearSession("Your session ended. Please sign in again.");
        setCurrentPath("/login");
      }
    };

    refreshCurrentUser();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "votex_profile_refresh") {
        refreshCurrentUser();
      }
      if (event.key === "votex_force_logout_event") {
        clearSession("Session closed on another browser tab.");
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("votex_session_sync");
      channel.onmessage = (e) => {
        if (e.data?.type === "PROFILE_REFRESH") {
          refreshCurrentUser();
        }
        if (e.data?.type === "LOGOUT") {
          clearSession(e.data.reason || "Session synchronized logout.");
          window.location.reload();
        }
      };
    } catch {
      // BroadcastChannel may not be available in all environments
    }

    return () => {
      active = false;
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
    };
  }, [token, currentPath]);

  const getHomePath = (role: User["role"]) => {
    const homeByRole: Record<User["role"], string> = {
      Voter: "/votexDashboard",
      Candidate: "/candidate",
      Administrator: "/admin",
      "Super Administrator": "/admin",
      "Election Officer": "/admin",
      Moderator: "/admin",
      "FAQ Manager": "/admin",
      "Verification Officer": "/admin",
      "Support Staff": "/admin",
    };

    return homeByRole[role] ?? "/login";
  };

  useEffect(() => {
    if (currentUser) {
      const authPages = new Set([
        "/",
        "/login",
        "/register",
        "/forgot_password",
        "/forgot-password",
        "/admin/login",
        "/votexDashboard",
      ]);

      if (authPages.has(currentPath)) {
        setCurrentPath(getHomePath(currentUser.role));
      }
      return;
    }

    if (
      !loading &&
      /^(\/admin|\/voter|\/candidate|\/votexDashboard)/.test(currentPath)
    ) {
      setCurrentPath(
        currentPath.startsWith("/admin") ? "/admin/login" : "/login",
      );
    }
  }, [currentUser, currentPath, loading, setCurrentPath]);

  useEffect(() => {
    if (!token || !currentUser) {
      setPreferencesReady(false);
      return;
    }

    let active = true;
    getUserPreferences(token)
      .then(({ preferences }) => {
        if (!active) return;
        setTheme(preferences.theme);
        setPreferencesReady(true);
      })
      .catch(() => active && setPreferencesReady(false));
    return () => {
      active = false;
    };
  }, [token, currentUser?.id]);

  useEffect(() => {
    if (!token || !currentUser || !preferencesReady) return;
    void updateUserPreferences(token, { theme }).catch(() => undefined);
  }, [theme, token, currentUser?.id, preferencesReady]);

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent("trigger_votex_logout_confirm"));
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (regForm.password !== regForm.confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    if (!regForm.dob) {
      showToast("Please provide your Date of Birth.", "error");
      return;
    }

    const age = calculateAge(regForm.dob);
    if (age < 18) {
      showToast("You must be at least 18 years old to register.", "error");
      return;
    }

    if (!regForm.gender) {
      showToast("Please select your gender.", "error");
      return;
    }

    if (!regForm.occupation.trim()) {
      showToast("Occupation is required.", "error");
      return;
    }

    try {
      setLoading(true);
      await registerAccount(regForm);
      try {
        localStorage.setItem("votex_account_created", "true");
      } catch {
        // ignore storage errors
      }
      showToast("Account created successfully. Please sign in.");
      setCurrentPath("/login");
      setRegForm(emptyRegisterForm);
      setRegFaceImage("");
      setRegFaceTemplate(null);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      const authResult = await loginAccount(loginForm);
      const profileResult = await getCurrentUser(authResult.token);
      showToast("Signed in successfully.");
      saveSession(authResult.token, profileResult.user);
      setCurrentPath(
        profileResult.user.role === "Voter"
          ? "/votexDashboard"
          : getHomePath(profileResult.user.role),
      );
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      await requestPasswordReset(forgotForm.email);
      showToast("Reset code sent. Please check your email.");
      setForgotStep("verify");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      await resetPassword(forgotForm);
      showToast("Password changed. Please sign in.");
      setCurrentPath("/login");
      setForgotStep("request");
      setForgotForm(emptyForgotPasswordForm);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-(--surface-page) font-sans leading-relaxed text-(--text-primary)">
      <Toast toast={toast} />

      <ErrorBoundary>
        <Suspense
          fallback={
            <main className="flex min-h-screen items-center justify-center bg-(--surface-page) text-sm font-semibold text-(--text-secondary)">
              Loading application…
            </main>
          }
        >
          {loading && token && !currentUser ? (
            <main className="flex min-h-screen items-center justify-center bg-(--surface-page) px-6 text-(--text-primary)">
              <div className="flex items-center gap-3 rounded-2xl border border-(--border-subtle) bg-(--surface-card) px-5 py-4 shadow-lg">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span className="text-sm font-semibold">
                  Restoring your secure session…
                </span>
              </div>
            </main>
          ) : currentUser && token ? (
            currentUser.role === "Voter" && currentPath === "/profile/edit" ? (
              <CompleteProfile
                token={token}
                user={currentUser}
                onLogout={handleLogout}
                onComplete={setCurrentUser}
                setCurrentPath={setCurrentPath}
                theme={theme}
                setTheme={setTheme}
              />
            ) : currentUser.role === "Voter" ? (
              <VoterDashboard
                token={token}
                user={currentUser}
                onLogout={handleLogout}
                setCurrentPath={setCurrentPath}
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
          ) : currentPath === "/login" ? (
            <LoginPage
              setCurrentPath={setCurrentPath}
              loading={loading}
              loginForm={loginForm}
              setLoginForm={setLoginForm}
              handleLoginSubmit={handleLoginSubmit}
              theme={theme}
              setTheme={setTheme}
            />
          ) : currentPath === "/register" ? (
            <RegisterPage
              setCurrentPath={setCurrentPath}
              loading={loading}
              regForm={regForm}
              setRegForm={setRegForm}
              regFaceImage={regFaceImage}
              setRegFaceImage={setRegFaceImage}
              regFaceTemplate={regFaceTemplate}
              setRegFaceTemplate={setRegFaceTemplate}
              handleRegisterSubmit={handleRegisterSubmit}
              theme={theme}
              setTheme={setTheme}
            />
          ) : currentPath === "/forgot_password" ||
            currentPath === "/forgot-password" ? (
            <ForgotPasswordPage
              setCurrentPath={setCurrentPath}
              loading={loading}
              forgotForm={forgotForm}
              setForgotForm={setForgotForm}
              forgotStep={forgotStep}
              setForgotStep={setForgotStep}
              handleForgotPasswordSubmit={handleForgotPasswordSubmit}
              handleResetPasswordSubmit={handleResetPasswordSubmit}
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
              theme={theme}
              setTheme={setTheme}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      <SessionManager
        token={token}
        onLogout={(reason) => clearSession(reason)}
        onExtendSession={async () => {
          if (token) {
            const data = await getCurrentUser(token);
            setCurrentUser(data.user);
          }
        }}
      />

      <NotificationConsole userRole={currentUser?.role ?? ""} />
    </div>
  );
}
