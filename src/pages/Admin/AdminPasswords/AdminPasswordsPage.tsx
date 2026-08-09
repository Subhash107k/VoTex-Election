import { useState } from "react";
import { KeyRound, ShieldCheck, UserCheck, Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";
import PasswordStrength from "../../../components/common/PasswordStrength.tsx";
import type { User } from "../../../types.ts";

interface AdminPasswordsPageProps {
  team: User[];
  onChangeAdminPassword: (adminId: string, newPassword: string) => Promise<void>;
  token: string;
}

export default function AdminPasswordsPage({
  team,
  onChangeAdminPassword,
}: AdminPasswordsPageProps) {
  // Filter team members (non-voter staff)
  const adminStaff = team.filter((member) => member.role !== "Voter");
  
  const [selectedAdminId, setSelectedAdminId] = useState<string>(
    adminStaff.length > 0 ? adminStaff[0].id : ""
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedAdmin = adminStaff.find((member) => member.id === selectedAdminId) || adminStaff[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedAdminId) {
      setFeedback({ type: "error", message: "Please select an administrator account." });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match. Please verify both fields." });
      return;
    }

    setBusy(true);
    try {
      await onChangeAdminPassword(selectedAdminId, newPassword);
      setFeedback({
        type: "success",
        message: `Successfully updated password for ${selectedAdmin?.fullName || "the admin account"}.`,
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update admin password.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Password of Admins"
        description="Securely manage and update login credentials for administrators and system officers."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Admin Selection Column */}
        <div className="lg:col-span-1 space-y-4">
          <SectionCard
            title="Select Administrator"
            description="Choose the admin account you wish to modify credentials for."
          >
            {adminStaff.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                No administrator accounts found.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Admin Accounts ({adminStaff.length})
                </label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => {
                    setSelectedAdminId(e.target.value);
                    setFeedback(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  {adminStaff.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.fullName} ({admin.role})
                    </option>
                  ))}
                </select>

                {selectedAdmin && (
                  <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
                        {selectedAdmin.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedAdmin.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {selectedAdmin.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Role</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        <ShieldCheck className="h-3 w-3" />
                        {selectedAdmin.role}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">Security & Auditing</p>
                <p className="mt-1">
                  Changing admin credentials triggers an automatic entry in the security audit log. Ensure you communicate the updated password securely.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Form Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <SectionCard
              title="Update Credentials"
              description={`Set a new secure password for ${selectedAdmin?.fullName || "selected admin"}.`}
            >
              {feedback && (
                <div
                  className={`mb-5 flex items-center gap-3 rounded-xl p-3.5 text-sm font-medium ${
                    feedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new admin password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      <PasswordStrength password={newPassword} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new admin password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={busy || !newPassword || !confirmPassword}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" />
                    {busy ? "Updating Password..." : "Update Admin Password"}
                  </button>
                </div>
              </div>
            </SectionCard>
          </form>
        </div>
      </div>
    </div>
  );
}
