import React, { useState } from "react";
import {
  Eye,
  Shield,
  Download,
  FileText,
  Trash2,
  Lock,
  History,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  X,
  FileCheck,
} from "lucide-react";

interface ProfilePrivacySettingsProps {
  token: string;
  user?: any;
  profile?: any;
}

export function ProfilePrivacySettings({ token, user, profile }: ProfilePrivacySettingsProps) {
  const [visibility, setVisibility] = useState<"public" | "voters" | "private">(
    "private"
  );
  const [allowPrecinctRoll, setAllowPrecinctRoll] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const downloadJsonProfile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile || user || {}, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `votex_profile_${user?.id || "dossier"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const auditLogs = profile?.audit || [
    { id: "a-1", action: "Profile Identity Verification Completed", by: "Election Officer #98", at: new Date().toISOString() },
    { id: "a-2", action: "National NID Document Authenticated", by: "Federal NID Service", at: new Date(Date.now() - 86400000).toISOString() },
    { id: "a-3", action: "Voter Registration Dossier Created", by: "System Registration", at: new Date(Date.now() - 86400000 * 7).toISOString() },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Privacy Controls & Data Audit
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Control your identity visibility, audit record access, and download your voter data.
          </p>
        </div>
      </div>

      {/* Visibility Controls */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <Eye className="h-4 w-4 text-blue-500" />
          <h4 className="text-sm font-bold">Profile Visibility Settings</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
              visibility === "private"
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                : "border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span>Confidential (Default)</span>
              {visibility === "private" && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Visible only to authorized Election Officers and verification authorities.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setVisibility("voters")}
            className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
              visibility === "voters"
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                : "border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span>Precinct Voters</span>
              {visibility === "voters" && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Name and precinct visible on local registered voter rolls.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
              visibility === "public"
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                : "border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span>Public Citizen</span>
              {visibility === "public" && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Basic voter status publicly searchable in national digital directory.
            </p>
          </button>
        </div>
      </div>

      {/* Data Download & Export */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-bold">Export Personal Data Dossier</h4>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">GDPR & Data Rights Compliant</span>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          You have the right to download a copy of all personal information, biometric verification logs, and registered credentials associated with your account.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadJsonProfile}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-bold transition-colors"
          >
            <FileCodeIcon className="h-4 w-4 text-blue-500" />
            Export JSON Archive
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-bold transition-colors"
          >
            <FileText className="h-4 w-4 text-emerald-500" />
            Print Official PDF Record
          </button>
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <History className="h-4 w-4 text-blue-500" />
          <h4 className="text-sm font-bold">Account Audit & Access Trail</h4>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {auditLogs.map((log: any) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-[var(--text-primary)]">{log.action}</span>
              </div>
              <div className="text-right text-[var(--text-secondary)] font-mono text-[11px]">
                {log.by} • {new Date(log.at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Termination Request */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-[var(--text-primary)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-rose-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Account Deletion Request
          </h4>
          <p className="text-xs text-[var(--text-secondary)]">
            Permanently remove your digital voter account. Official election records will be archived per law.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shrink-0 shadow-md"
        >
          Request Deletion
        </button>
      </div>

      {/* Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Request Account Deletion
              </h3>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Deleting your account will remove your biometric data, stored documents, and active voter sessions. Type <strong className="text-rose-500 font-mono">DELETE MY ACCOUNT</strong> to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full rounded-xl border border-rose-500/40 bg-[var(--surface-muted)] px-3.5 py-2.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "DELETE MY ACCOUNT"}
                onClick={() => {
                  alert("Account deletion request submitted to Election Registrar.");
                  setShowDeleteModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileCodeIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 13 2 2-2 2" />
    </svg>
  );
}

export default ProfilePrivacySettings;
