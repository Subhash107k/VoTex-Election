import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Edit3,
  Download,
  MapPin,
  Vote,
  ChevronRight,
  ChevronDown,
  User,
  Mail,
  Phone,
  Camera,
  Fingerprint,
  FileText,
  Activity,
  Calendar,
  Shield,
  BadgeCheck,
  BarChart3,
  ExternalLink,
  MoreVertical,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const config = {
    verified: {
      icon: CheckCircle2,
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      label: "Verified",
    },
    pending: {
      icon: Clock,
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      label: "Pending",
    },
    failed: {
      icon: XCircle,
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      label: "Failed",
    },
  };

  const statusKey = status?.toLowerCase() || "";
  const {
    icon: Icon,
    bg,
    text,
    border,
    label,
  } = statusKey.includes("verified") || statusKey.includes("true")
    ? config.verified
    : statusKey.includes("pending") || statusKey.includes("process")
      ? config.pending
      : config.failed;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">{label}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {value}%
          </span>
        </div>
      )}
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            value >= 80
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : value >= 50
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-red-500 to-red-400"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-lg font-bold text-slate-800 dark:text-white">
          {value}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function SummarySidebar({
  profile,
  onEdit,
  onDownloadAll,
}: {
  profile: any;
  onEdit?: () => void;
  onDownloadAll?: () => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["profile", "election"]),
  );
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const user = profile?.user || {};
  const completion = profile?.completion || 0;
  const verificationChecks = [
    {
      label: "Email",
      icon: Mail,
      status: user?.isEmailVerified ? "Verified" : "Pending",
    },
    {
      label: "Phone",
      icon: Phone,
      status: user?.isPhoneVerified ? "Verified" : "Pending",
    },
    {
      label: "Face ID",
      icon: Camera,
      status: profile?.biometric?.face?.status || "Pending",
    },
    {
      label: "Fingerprint",
      icon: Fingerprint,
      status: profile?.biometric?.fingerprint?.status || "Pending",
    },
    {
      label: "Documents",
      icon: FileText,
      status: profile?.documents?.length > 0 ? "Verified" : "Pending",
    },
  ];

  // Mobile action bar
  const MobileActionBar = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-800/90">
      <div className="flex gap-2 max-w-7xl mx-auto">
        <button
          onClick={() => onEdit?.()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 active:scale-95"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </button>
        <button
          onClick={() => onDownloadAll?.()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all hover:border-slate-300 dark:hover:border-slate-500 active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-slate-300 dark:hover:border-slate-500 transition-all"
        >
          <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Profile Summary Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection("profile")}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-slate-800 dark:text-white">
                Profile Summary
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completion}% complete
              </p>
            </div>
          </div>
          {expandedSections.has("profile") ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expandedSections.has("profile") && (
          <div className="px-5 pb-5 space-y-4">
            {/* Progress Bar */}
            <ProgressBar value={completion} label="Profile Completion" />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={BadgeCheck}
                label="Status"
                value={profile?.status || "N/A"}
              />
              <StatCard
                icon={FileText}
                label="Documents"
                value={profile?.documents?.length || 0}
              />
            </div>

            {/* Verification Checklist */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Verification Status
              </p>
              {verificationChecks.map((check, index) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <check.icon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {check.label}
                    </span>
                  </div>
                  <StatusBadge status={check.status} />
                </div>
              ))}
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden lg:flex flex-col gap-2 pt-2">
              <button
                onClick={() => onEdit?.()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={() => onDownloadAll?.()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all border border-slate-200 dark:border-slate-600"
              >
                <Download className="w-4 h-4" />
                Download All Documents
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Election Info Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection("election")}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-slate-800 dark:text-white">
                Election Information
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Voting eligibility & details
              </p>
            </div>
          </div>
          {expandedSections.has("election") ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expandedSections.has("election") && (
          <div className="px-5 pb-5 space-y-3">
            {/* Eligibility Card */}
            <div
              className={`p-4 rounded-xl border-2 ${
                profile?.election?.eligible
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    profile?.election?.eligible
                      ? "bg-emerald-100 dark:bg-emerald-800"
                      : "bg-red-100 dark:bg-red-800"
                  }`}
                >
                  {profile?.election?.eligible ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <p
                    className={`font-semibold ${
                      profile?.election?.eligible
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {profile?.election?.eligible
                      ? "Eligible to Vote"
                      : "Not Eligible"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {profile?.election?.eligible
                      ? "You can participate in elections"
                      : "Please complete verification"}
                  </p>
                </div>
              </div>
            </div>

            {/* Ward Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assigned Ward
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {profile?.election?.ward || "Not Assigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Next Election
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {profile?.election?.nextElection || "TBD"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Voter ID Status
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {profile?.election?.voterIdStatus || "Pending"}
                  </p>
                </div>
                <StatusBadge
                  status={profile?.election?.voterIdStatus || "Pending"}
                />
              </div>
            </div>

            {/* Voter Information Link */}
            <button className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
              <ExternalLink className="w-4 h-4" />
              View Voting Guidelines
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions - Always Visible */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hidden lg:block">
        <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group">
            <Shield className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
              Security Settings
            </span>
          </button>
          <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group">
            <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
              Activity Report
            </span>
          </button>
          <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group">
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
              Download Certificates
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block sticky top-24">{sidebarContent}</aside>

      {/* Mobile/Tablet View */}
      <div className="lg:hidden">
        {sidebarContent}
        <MobileActionBar />
      </div>
    </>
  );
}
