import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  User,
  Fingerprint,
  FileText,
  UserCheck,
  Shield,
  ChevronRight,
} from "lucide-react";

export default function VerificationCard({
  biometric,
  verificationReport,
}: any) {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "";

    if (
      normalizedStatus.includes("verified") ||
      normalizedStatus.includes("complete")
    ) {
      return {
        icon: CheckCircle2,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        label: "Verified",
      };
    }
    if (
      normalizedStatus.includes("pending") ||
      normalizedStatus.includes("process")
    ) {
      return {
        icon: Clock,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
        label: "Pending",
      };
    }
    if (
      normalizedStatus.includes("failed") ||
      normalizedStatus.includes("error")
    ) {
      return {
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        label: "Failed",
      };
    }
    return {
      icon: AlertTriangle,
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-800",
      border: "border-slate-200 dark:border-slate-700",
      label: "Unknown",
    };
  };

  const verificationSteps = [
    {
      id: "face",
      label: "Facial Recognition",
      icon: User,
      status:
        biometric?.face?.status ||
        (verificationReport?.faceMatchScore ? "Verified" : "Pending"),
      detail: verificationReport?.faceMatchScore
        ? `${Math.round(verificationReport.faceMatchScore * 100)}% match`
        : undefined,
      timestamp:
        biometric?.face?.verifiedAt || verificationReport?.faceVerifiedAt,
    },
    {
      id: "fingerprint",
      label: "Fingerprint",
      icon: Fingerprint,
      status: biometric?.fingerprint?.status || "Pending",
      detail: biometric?.fingerprint?.score
        ? `${Math.round(biometric.fingerprint.score * 100)}% match`
        : undefined,
      timestamp: biometric?.fingerprint?.verifiedAt,
    },
    {
      id: "document",
      label: "Document Verification",
      icon: FileText,
      status: verificationReport?.documentScore ? "Verified" : "Pending",
      detail: verificationReport?.documentScore
        ? `${Math.round(verificationReport.documentScore * 100)}% match`
        : undefined,
      timestamp: verificationReport?.documentVerifiedAt,
    },
    {
      id: "profile",
      label: "Profile Status",
      icon: UserCheck,
      status: verificationReport?.profileStatus || "Pending",
      detail: verificationReport?.profileCompletion
        ? `${verificationReport.profileCompletion}% complete`
        : undefined,
      timestamp: verificationReport?.profileLastUpdated,
    },
  ];

  const overallStatus = verificationSteps.every((step) =>
    step.status?.toLowerCase().includes("verified"),
  )
    ? "verified"
    : "partial";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                overallStatus === "verified"
                  ? "bg-emerald-50 dark:bg-emerald-900/20"
                  : "bg-amber-50 dark:bg-amber-900/20"
              }`}
            >
              <Shield
                className={`w-5 h-5 ${
                  overallStatus === "verified"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">
                Verification Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Identity verification progress
              </p>
            </div>
          </div>

          {/* Overall Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              overallStatus === "verified"
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                overallStatus === "verified" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {overallStatus === "verified" ? "Verified" : "In Progress"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Overall Progress
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-semibold">
              {
                verificationSteps.filter((step) =>
                  step.status?.toLowerCase().includes("verified"),
                ).length
              }
              /{verificationSteps.length}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallStatus === "verified"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-r from-amber-500 to-amber-400"
              }`}
              style={{
                width: `${
                  (verificationSteps.filter((step) =>
                    step.status?.toLowerCase().includes("verified"),
                  ).length /
                    verificationSteps.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Verification Steps */}
      <div className="p-2">
        {verificationSteps.map((step, index) => {
          const statusConfig = getStatusConfig(step.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div key={step.id} className="relative group">
              <button className="w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200">
                <div className="flex items-center gap-3">
                  {/* Step Icon */}
                  <div
                    className={`p-2 rounded-lg ${statusConfig.bg} border ${statusConfig.border} transition-colors group-hover:scale-105`}
                  >
                    <step.icon className={`w-4 h-4 ${statusConfig.color}`} />
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {step.label}
                      </p>
                      <StatusIcon
                        className={`w-4 h-4 flex-shrink-0 ${statusConfig.color}`}
                      />
                    </div>

                    {/* Detail & Timestamp */}
                    <div className="flex items-center justify-between mt-1">
                      {step.detail && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {step.detail}
                        </span>
                      )}
                      {step.timestamp && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(step.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Connector Line */}
              {index < verificationSteps.length - 1 && (
                <div className="absolute left-7 top-[52px] bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50">
        <button className="w-full text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center justify-center gap-1">
          View Detailed Report
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
