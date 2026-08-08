import React from "react";
import { AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

interface FaceMatchResultProps {
  status: "idle" | "success" | "failed" | "processing";
  score?: number;
  threshold?: number;
  message?: string;
}

export default function FaceMatchResult({
  status,
  score,
  threshold,
  message,
}: FaceMatchResultProps) {
  if (status === "idle") return null;

  const ok = status === "success";
  const isProcessing = status === "processing";

  return (
    <div
      className={`rounded-3xl border p-4 shadow-xl backdrop-blur-xl transition-all ${
        ok
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/90 text-emerald-300"
          : isProcessing
            ? "border-blue-500/40 bg-gradient-to-br from-blue-950/40 to-slate-900/90 text-blue-300"
            : "border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-slate-900/90 text-rose-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2.5 rounded-2xl border ${
            ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : isProcessing
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {ok ? (
            <ShieldCheck className="h-6 w-6" />
          ) : isProcessing ? (
            <RefreshCw className="h-6 w-6 animate-spin" />
          ) : (
            <AlertTriangle className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white">
              {ok
                ? "Biometric Match Confirmed!"
                : isProcessing
                  ? "Comparing Live Face Signature..."
                  : "Biometric Verification Failed"}
            </h4>
            {score !== undefined && (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-0.5 text-xs font-black text-emerald-400">
                {Math.round(score * (score <= 1 ? 100 : 1))}% Match Score
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-300 leading-relaxed font-medium">
            {message ||
              (ok
                ? "Live face features cryptographically matched registered voter template."
                : isProcessing
                  ? "Evaluating liveness vectors and facial landmarks against database template."
                  : "Liveness or facial similarity score did not meet security threshold.")}
          </p>

          {score !== undefined && threshold !== undefined && (
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Similarity Score: <strong className="text-white">{Math.round(score * (score <= 1 ? 100 : 1))}%</strong></span>
              <span>Min Security Threshold: <strong className="text-slate-300">{Math.round(threshold * (threshold <= 1 ? 100 : 1))}%</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

