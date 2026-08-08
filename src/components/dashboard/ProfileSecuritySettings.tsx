import React, { useState } from "react";
import {
  Lock,
  ShieldCheck,
  Smartphone,
  KeyRound,
  History,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Laptop,
  Globe,
  RefreshCw,
} from "lucide-react";
import PasswordStrength from "../common/PasswordStrength";

interface ProfileSecuritySettingsProps {
  token: string;
  user?: any;
}

export function ProfileSecuritySettings({ token, user }: ProfileSecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [tfaEnabled, setTfaEnabled] = useState(user?.twoFactorEnabled || false);
  const [tfaLoading, setTfaLoading] = useState(false);

  const [sessions, setSessions] = useState([
    {
      id: "sess-1",
      device: "Windows Chrome Browser",
      ip: "103.120.201.44 (Kathmandu, NP)",
      lastActive: "Active Now (Current Session)",
      current: true,
    },
    {
      id: "sess-2",
      device: "iPhone 15 Pro • Safari",
      ip: "27.111.14.90 (Pokhara, NP)",
      lastActive: "2 hours ago",
      current: false,
    },
  ]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Please enter your current password." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update password.");
      }

      setPasswordMsg({ type: "success", text: "Password changed successfully! Keep your credentials safe." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Could not change password." });
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleTwoFactor = async () => {
    setTfaLoading(true);
    try {
      const nextState = !tfaEnabled;
      setTfaEnabled(nextState);
    } finally {
      setTfaLoading(false);
    }
  };

  const revokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-500" />
            Security & Credential Management
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Manage your account security, authentication methods, and active voter sessions.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-4 w-4" /> Account Protected
        </span>
      </div>

      {/* Password Change Form Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <KeyRound className="h-4 w-4 text-blue-500" />
          <h4 className="text-sm font-bold">Change Password</h4>
        </div>

        {passwordMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
              passwordMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}
          >
            {passwordMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3.5 py-2.5 pr-10 text-xs font-medium text-[var(--text-primary)] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3.5 py-2.5 pr-10 text-xs font-medium text-[var(--text-primary)] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3.5 py-2.5 pr-10 text-xs font-medium text-[var(--text-primary)] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
            >
              {savingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Updating…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-500" />
            <h4 className="text-sm font-bold">Two-Factor Authentication (2FA)</h4>
            {tfaEnabled ? (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                Disabled
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Add an extra layer of security to your voter account by requiring an OTP code upon sign in.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleTwoFactor}
          disabled={tfaLoading}
          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
            tfaEnabled
              ? "border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          }`}
        >
          {tfaEnabled ? "Disable 2FA" : "Enable 2FA Protection"}
        </button>
      </div>

      {/* Active Login Sessions */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-bold">Active Browser Sessions</h4>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {sessions.length} Authorized Devices
          </span>
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                    {sess.device}
                    {sess.current && (
                      <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[9px] font-bold text-blue-500">
                        This Device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                    {sess.ip} • {sess.lastActive}
                  </p>
                </div>
              </div>

              {!sess.current && (
                <button
                  type="button"
                  onClick={() => revokeSession(sess.id)}
                  className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold"
                  title="Revoke session access"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProfileSecuritySettings;
