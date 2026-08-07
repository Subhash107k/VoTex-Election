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
  RefreshCw,
  Mail,
  Home,
} from "lucide-react";

const MATCH_THRESHOLD = 0.75;
const SUPPORT_EMAIL = "support@votex.gov.np";
const DASHBOARD_PATH = "/votexDashboard";

export default function VerificationCard({
  biometric,
  verificationReport,
  onRetry,
  onContactAdmin,
  onGoToDashboard,
}: any) {
  const openContactAdmin = () => {
    if (typeof onContactAdmin === "function") {
      onContactAdmin();
      return;
    }

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      "VoTex verification support",
    )}`;
  };

  const goToDashboard = () => {
    if (typeof onGoToDashboard === "function") {
      onGoToDashboard();
      return;
    }

    window.location.href = DASHBOARD_PATH;
  };

  const retryVerification = () => {
    if (typeof onRetry === "function") {
      onRetry();
      return;
    }

    window.location.reload();
  };

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

  const getScoreStatus = (score?: number, status?: string) => {
    if (typeof status === "string" && status.trim()) {
      return status;
    }

    if (typeof score !== "number") {
      return "Pending";
    }

    return score >= MATCH_THRESHOLD ? "Verified" : "Failed";
  };

  const verificationSteps = [
    {
      id: "face",
      label: "Facial Recognition",
      icon: User,
      status: getScoreStatus(
        verificationReport?.faceMatchScore,
        biometric?.face?.status,
      ),
      detail:
        typeof verificationReport?.faceMatchScore === "number"
          ? `${Math.round(verificationReport.faceMatchScore * 100)}% match`
          : undefined,
      timestamp:
        biometric?.face?.verifiedAt || verificationReport?.faceVerifiedAt,
    },
    {
      id: "fingerprint",
      label: "Fingerprint",
      icon: Fingerprint,
      status: getScoreStatus(
        biometric?.fingerprint?.score,
        biometric?.fingerprint?.status,
      ),
      detail:
        typeof biometric?.fingerprint?.score === "number"
          ? `${Math.round(biometric.fingerprint.score * 100)}% match`
          : undefined,
      timestamp: biometric?.fingerprint?.verifiedAt,
    },
    {
      id: "document",
      label: "Document Verification",
      icon: FileText,
      status: getScoreStatus(
        verificationReport?.documentScore,
        verificationReport?.documentStatus,
      ),
      detail:
        typeof verificationReport?.documentScore === "number"
          ? `${Math.round(verificationReport.documentScore * 100)}% match`
          : undefined,
      timestamp: verificationReport?.documentVerifiedAt,
    },
    {
      id: "profile",
      label: "Profile Status",
      icon: UserCheck,
      status:
        verificationReport?.profileStatus ||
        (typeof verificationReport?.profileCompletion === "number"
          ? verificationReport.profileCompletion >= 100
            ? "Verified"
            : "Pending"
          : "Pending"),
      detail:
        typeof verificationReport?.profileCompletion === "number"
          ? `${verificationReport.profileCompletion}% complete`
          : undefined,
      timestamp: verificationReport?.profileLastUpdated,
    },
  ];

  const verifiedStepCount = verificationSteps.filter((step) =>
    step.status?.toLowerCase().includes("verified"),
  ).length;
  const hasFailedStep = verificationSteps.some(
    (step) =>
      step.status?.toLowerCase().includes("failed") ||
      step.status?.toLowerCase().includes("error"),
  );
  const overallStatus = hasFailedStep
    ? "failed"
    : verifiedStepCount === verificationSteps.length
      ? "verified"
      : "partial";
  const progressWidth = (verifiedStepCount / verificationSteps.length) * 100;

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
                    : overallStatus === "failed"
                      ? "text-red-600 dark:text-red-400"
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
                : overallStatus === "failed"
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                overallStatus === "verified"
                  ? "bg-emerald-500"
                  : overallStatus === "failed"
                    ? "bg-red-500"
                    : "bg-amber-500"
              }`}
            />
            {overallStatus === "verified"
              ? "Verified"
              : overallStatus === "failed"
                ? "Verification Failed"
                : "In Progress"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Overall Progress
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-semibold">
              {verifiedStepCount}/{verificationSteps.length}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallStatus === "verified"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : overallStatus === "failed"
                    ? "bg-gradient-to-r from-red-500 to-red-400"
                    : "bg-gradient-to-r from-amber-500 to-amber-400"
              }`}
              style={{
                width: progressWidth + "%",
              }}
            />
          </div>
        </div>
      </div>

      {overallStatus === "failed" && (
        <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-black">Verification failed</div>
              <p className="mt-1 text-xs font-medium text-red-700 dark:text-red-200/80">
                The submitted data did not match. Retry verification, contact
                admin, or return to the dashboard.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={retryVerification}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Verification
                </button>
                <button
                  type="button"
                  onClick={openContactAdmin}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-slate-900/40 dark:text-red-200"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Contact Admin
                </button>
                <button
                  type="button"
                  onClick={goToDashboard}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Home className="h-3.5 w-3.5" />
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        {overallStatus !== "failed" ? (
          <button className="w-full text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center justify-center gap-1">
            View Detailed Report
            <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={retryVerification}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <button
              type="button"
              onClick={goToDashboard}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Home className="w-3.5 h-3.5" />
              Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
