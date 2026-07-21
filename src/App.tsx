import React, { useEffect, useState } from "react";

import AdminLoginPage from "./components/AdminLoginPage.tsx";
import AdminPanel from "./components/AdminPanel.tsx";
import CompleteProfile from "./components/CompleteProfile.tsx";
import NotificationConsole from "./components/NotificationConsole.tsx";
import PublicLanding from "./components/PublicLanding.tsx";
import SessionManager from "./components/SessionManager.tsx";
import VoterDashboard from "./components/VoterDashboard.tsx";
import { CandidateDashboard } from "./components/CandidateDashboard.tsx";
import Toast from "./components/common/Toast.tsx";
import { useBrowserPath } from "./hooks/useBrowserPath.ts";
import { usePersistentTheme } from "./hooks/usePersistentTheme.ts";
import { useToast } from "./hooks/useToast.ts";
import {
  getCurrentUser,
  loginAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
} from "./services/authService.ts";
import type {
  ForgotPasswordForm,
  ForgotPasswordStep,
  LoginForm,
  PresetLoginRole,
  RegisterForm,
} from "./types/auth.ts";
import type { User } from "./types.js";

const TOKEN_STORAGE_KEY = "votex_token";
const LOGOUT_REASON_KEY = "votex_logout_reason";

const emptyRegisterForm: RegisterForm = {
  fullName: "",
  username: "",
  email: "",
  mobile: "",
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

const demoCredentials: Record<PresetLoginRole, LoginForm> = {
  super: { email: "admin@vote.com", password: "admin123" },
  officer: { email: "officer@vote.com", password: "officer123" },
  voter: { email: "voter@vote.com", password: "voter123" },
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

export default function App() {
  const { currentPath, setCurrentPath } = useBrowserPath();
  const { theme, setTheme } = usePersistentTheme();
  const { toast, showToast } = useToast();

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

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
    localStorage.removeItem("votex_user");
    setToken(null);
    setCurrentUser(null);

    if (reason) {
      localStorage.setItem(LOGOUT_REASON_KEY, reason);
    }
  };

  const saveSession = (newToken: string, user: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem("votex_user", JSON.stringify(user));
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
      window.location.reload();
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

    if (token) {
      syncSession();
    }
  }, [token]);

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent("trigger_votex_logout_confirm"));
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (regForm.password !== regForm.confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    try {
      setLoading(true);
      await registerAccount(regForm);
      showToast("Account created. Please sign in.");
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
      const data = await loginAccount(loginForm);
      showToast("Signed in successfully.");
      saveSession(data.token, data.user);
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

  const loginAsPresetUser = async (rolePreset: PresetLoginRole) => {
    if (Boolean((import.meta as any).env?.PROD)) {
      showToast("Demo login is disabled in production.", "error");
      return;
    }

    try {
      setLoading(true);
      const data = await loginAccount(demoCredentials[rolePreset]);
      showToast(`Signed in as ${rolePreset}.`);
      saveSession(data.token, data.user);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-900 font-sans leading-relaxed text-slate-100">
      <Toast toast={toast} />

      {currentUser && token ? (
        currentUser.role === "Voter" && !currentUser.isProfileComplete ? (
          <CompleteProfile
            token={token}
            user={currentUser}
            onLogout={handleLogout}
            onComplete={setCurrentUser}
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
        />
      )}

      <SessionManager
        token={token}
        onLogout={(reason) => clearSession(reason)}
        onExtendSession={async () => {
          if (token) {
            await getCurrentUser(token);
          }
        }}
      />

      <NotificationConsole />
    </div>
  );
}
