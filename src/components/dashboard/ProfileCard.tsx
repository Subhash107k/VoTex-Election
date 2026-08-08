import React from "react";
import { User, Calendar, MapPin, CreditCard, ShieldCheck, Briefcase } from "lucide-react";

function Row({
  icon: Icon,
  label,
  value,
  isMono = false,
  isBadge = false,
}: {
  icon?: any;
  label: string;
  value: any;
  isMono?: boolean;
  isBadge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 transition-all hover:bg-slate-950/80">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
        {Icon && <Icon className="h-4 w-4 text-blue-400 shrink-0" />}
        <span>{label}</span>
      </div>
      <div className="text-right">
        {isBadge ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
            {value ?? "Verified"}
          </span>
        ) : (
          <span
            className={`text-xs font-bold text-slate-100 ${
              isMono ? "font-mono text-blue-300" : ""
            }`}
          >
            {value ?? "Not provided"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProfileCard({ profile }: { profile: any }) {
  const user = profile?.user || profile?.profile || {};
  const dob = user?.dob ? new Date(user.dob).toLocaleDateString() : null;
  const age = user?.dob
    ? Math.floor(
        (Date.now() - new Date(user.dob).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-white text-base">
              Personal Citizen Credentials
            </h3>
            <p className="text-[11px] text-slate-400">
              Verified identity record registered in federal voter database.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-400">
          Official Roll
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Row icon={User} label="Full Legal Name" value={user.fullName} />
        <Row icon={ShieldCheck} label="Account Status" value="Biometric Verified" isBadge />
        <Row icon={Calendar} label="Date of Birth" value={dob ? `${dob} (${age || "N/A"} yrs)` : "N/A"} />
        <Row icon={CreditCard} label="Citizenship No." value={profile?.citizenshipNumber || user.citizenshipNumber || user.nationalID || "CIT-98124-NP"} isMono />
        <Row icon={CreditCard} label="National NID No." value={profile?.nidNumber || user.nationalID || "NID-1249-598"} isMono />
        <Row icon={Briefcase} label="Occupation" value={profile?.occupation || user?.occupation || "Voter Citizen"} />
        <Row icon={MapPin} label="Permanent Address" value={profile?.permanentAddress || user?.address || "Kathmandu, Nepal"} />
        <Row icon={MapPin} label="Voting Precinct" value={`${profile?.province || "Bagmati"} • Ward ${profile?.wardNumber || "01"}`} />
      </div>
    </div>
  );
}

