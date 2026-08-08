import React from "react";
import { Download, Printer, Edit3, ShieldCheck, User } from "lucide-react";

export default function ProfileHeader({
  profile,
  onEditProfile,
  onDownloadPdf,
  onPrint,
}: {
  profile: any;
  onEditProfile?: () => void;
  onDownloadPdf?: () => void;
  onPrint?: () => void;
}) {
  const user = profile?.user || profile?.profile || {};
  const fullName = user?.fullName || profile?.fullName || "Voter Citizen";
  const email = user?.email || user?.username || "No email available";
  const voterId = user?.nationalID || profile?.citizenshipNumber || "Not provided";
  const status = profile?.status || user?.accountStatus || "Verified";

  const handleDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile || {}, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `votex_profile_${voterId}.json`;
    a.click();
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  return (
    <div className="rounded-2xl p-5 sm:p-6 flex flex-col gap-5 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-md sm:flex-row sm:items-center justify-between transition-colors">
      <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        {/* Profile Avatar Frame */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[var(--surface-muted)] border-2 border-[var(--border-subtle)] shadow-inner flex items-center justify-center">
            {profile?.photoUrl ||
            profile?.profilePhoto ||
            profile?.profilePicture ||
            user?.profilePhoto ||
            user?.profilePicture ||
            user?.faceImage ? (
              <img
                src={
                  profile?.photoUrl ||
                  profile?.profilePhoto ||
                  profile?.profilePicture ||
                  user?.profilePhoto ||
                  user?.profilePicture ||
                  user?.faceImage
                }
                alt={fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[var(--text-secondary)] font-black text-2xl">
                {fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || <User className="w-10 h-10" />}
              </div>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-[var(--surface-card)]" title="Verified Biometric Profile">
            <ShieldCheck className="h-4 w-4" />
          </span>
        </div>

        {/* User Info */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">{fullName}</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
            {email}
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                status === "Verified" || status === "Approved"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === "Verified" || status === "Approved"
                    ? "bg-emerald-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              />
              {status}
            </span>
            <span className="bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-3 py-0.5 rounded-full text-xs font-mono font-medium">
              Voter NID: {voterId}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons & Reg Date */}
      <div className="flex flex-col items-center sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
        <div className="text-xs text-[var(--text-tertiary)] font-medium">
          Registered:{" "}
          <span className="text-[var(--text-secondary)] font-mono font-semibold">
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString()
              : "Active Record"}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" /> Export Dossier
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-500" /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

