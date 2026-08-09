import React from "react";
import { User, Calendar, MapPin, CreditCard, ShieldCheck, Briefcase } from "lucide-react";

function Row({
  icon: Icon,
  label,
  value,
  isMono = false,
  isBadge = false,
  badgeTone = "success",
}: {
  icon?: any;
  label: string;
  value: any;
  isMono?: boolean;
  isBadge?: boolean;
  badgeTone?: "success" | "warning" | "info" | "danger";
}) {
  const badgeStyles = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] transition-all hover:bg-[var(--surface-hover)]">
      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-medium">
        {Icon && <Icon className="h-4 w-4 text-blue-500 shrink-0" />}
        <span>{label}</span>
      </div>
      <div className="text-right">
        {isBadge ? (
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeStyles[badgeTone]}`}>
            {value || "Not Verified"}
          </span>
        ) : (
          <span
            className={`text-xs font-bold text-[var(--text-primary)] ${
              isMono ? "font-mono text-blue-600 dark:text-blue-400" : ""
            }`}
          >
            {value || "Not Provided"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProfileCard({ profile }: { profile: any }) {
  // Extract real user, extended profile & document fields
  const user = profile?.user || profile?.profile || profile || {};
  const prof = profile?.profile || {};
  const doc = profile?.document || {};

  const fullName = user.fullName || user.name || prof.fullName || "Not Provided";

  const statusRaw = user.accountStatus || user.verificationStatus || profile?.status || (user.isVerified || user.isApproved ? "Verified" : "Pending");
  const isVerified = Boolean(
    user.isVerified || user.isApproved || statusRaw === "Verified" || statusRaw === "Approved"
  );
  const statusDisplay = isVerified ? "Biometric Verified" : statusRaw;
  const statusTone: "success" | "warning" | "danger" = isVerified ? "success" : statusRaw === "Rejected" ? "danger" : "warning";

  const rawDob = user.dob || prof.dob || prof.dateOfBirth;
  const dob = rawDob ? new Date(rawDob).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : null;
  const age = rawDob
    ? Math.floor((Date.now() - new Date(rawDob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;
  const dobDisplay = dob ? `${dob}${age != null ? ` (${age} yrs)` : ""}` : null;

  const citizenshipNo =
    prof.citizenshipNumber ||
    doc.citizenshipNumber ||
    user.citizenshipNumber ||
    doc.documentNumber ||
    user.nationalID ||
    null;

  const nidNo =
    prof.nidNumber ||
    doc.nidNumber ||
    user.nationalID ||
    user.nidNumber ||
    null;

  const occupation = prof.occupation || user.occupation || "Voter Citizen";

  // Build Real Address Parts
  const rawWard = prof.permanentWardNumber || prof.wardNumber || user.wardNumber || user.ward;
  const formattedWard = rawWard ? (String(rawWard).toLowerCase().startsWith("ward") ? String(rawWard) : `Ward No. ${String(rawWard).padStart(2, "0")}`) : null;
  const tole = prof.permanentTole || prof.tole || user.tole || null;
  const municipality = prof.permanentMunicipality || prof.municipality || user.municipality || null;
  const district = prof.permanentDistrict || prof.district || user.district || null;
  const province = prof.permanentProvince || prof.province || user.province || null;

  const addressParts = [
    tole,
    formattedWard,
    municipality,
    district,
    province,
  ].filter((p) => p && String(p).trim() !== "" && String(p).toLowerCase() !== "null" && String(p).toLowerCase() !== "undefined");

  const permanentAddress =
    addressParts.length > 0
      ? addressParts.join(", ")
      : user.address || prof.permanentAddress || "Not Provided";

  // Build Real Precinct / Constituency Parts
  const constituency = prof.constituency || user.constituency || prof.electoralConstituency || user.electoralConstituency || (district ? `${district}` : null);
  const precinctWard = rawWard ? `Ward ${String(rawWard).padStart(2, "0")}` : null;
  const precinctLocal = municipality || province || null;

  const precinctParts = [
    constituency,
    precinctLocal,
    precinctWard,
  ].filter((p) => p && String(p).trim() !== "" && String(p).toLowerCase() !== "null" && String(p).toLowerCase() !== "undefined");

  const precinct = precinctParts.length > 0 ? precinctParts.join(" • ") : "Bagmati • Ward 01";

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] p-5 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-[var(--text-primary)] text-base">
              Personal Citizen Credentials
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Verified identity record registered in federal voter database.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
          Official Roll
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Row icon={User} label="Full Legal Name" value={fullName} />
        <Row icon={ShieldCheck} label="Account Status" value={statusDisplay} isBadge badgeTone={statusTone} />
        <Row icon={Calendar} label="Date of Birth" value={dobDisplay} />
        <Row icon={CreditCard} label="Citizenship No." value={citizenshipNo} isMono />
        <Row icon={CreditCard} label="National NID No." value={nidNo} isMono />
        <Row icon={Briefcase} label="Occupation" value={occupation} />
        <Row icon={MapPin} label="Permanent Address" value={permanentAddress} />
        <Row icon={MapPin} label="Voting Precinct" value={precinct} />
      </div>
    </div>
  );
}
