import React from "react";
import {
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Fingerprint,
  ScanFace,
} from "lucide-react";

const VOTE_THRESHOLD = 60; // 60% minimum for voting

interface FaceMatchResultProps {
  status: "idle" | "success" | "failed" | "processing";
  score?: number;
  threshold?: number;
  message?: string;
  registeredImage?: string;
  liveImage?: string;
}

export default function FaceMatchResult({
  status,
  score,
  threshold,
  message,
  registeredImage,
  liveImage,
}: FaceMatchResultProps) {
  if (status === "idle") return null;

  const ok = status === "success";
  const isProcessing = status === "processing";

  // Normalise to percentage (handle both 0-1 and 0-100 ranges)
  const scorePercent =
    score !== undefined ? Math.round(score <= 1 ? score * 100 : score) : undefined;
  const thresholdPercent =
    threshold !== undefined
      ? Math.round(threshold <= 1 ? threshold * 100 : threshold)
      : VOTE_THRESHOLD;

  const aboveThreshold = scorePercent !== undefined && scorePercent >= VOTE_THRESHOLD;
  const emptyRegisteredLabel = registeredImage
    ? "Registered biometric capture"
    : "No registered capture on file";
  const emptyLiveLabel = liveImage
    ? "Live biometric capture"
    : "Awaiting live biometric capture";

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-5 shadow-xl backdrop-blur-xl transition-all space-y-4 ${
        ok
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/90"
          : isProcessing
            ? "border-blue-500/40 bg-gradient-to-br from-blue-950/40 to-slate-900/90"
            : "border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-slate-900/90"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`p-2.5 rounded-2xl border shrink-0 ${
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

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-black text-white">
              {ok
                ? "✓ Identity Verified"
                : isProcessing
                  ? "Comparing Live Face Signature…"
                  : "✕ Identity Verification Failed"}
            </h4>
            {scorePercent !== undefined && (
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-black shrink-0 ${
                  aboveThreshold
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                    : "border-rose-500/40 bg-rose-500/20 text-rose-400"
                }`}
              >
                {scorePercent}% Match Score
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-300 leading-relaxed font-medium">
            {message ||
              (ok
                ? "Your identity has been successfully verified. You may continue to the voter confirmation step."
                : isProcessing
                  ? "Evaluating liveness vectors and facial landmarks against database template."
                  : "You cannot continue to voting until identity verification is successfully completed.")}
          </p>
        </div>
      </div>

      {/* Match Status Rows */}
      {!isProcessing && scorePercent !== undefined && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 px-3 py-2 border border-slate-800">
            {ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            )}
            <span className="text-slate-400 font-semibold truncate">Registered Capture:</span>
            <span className={`font-black ml-auto shrink-0 ${ok ? "text-emerald-400" : "text-rose-400"}`}>
              {ok ? "Matched" : "No Match"}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 px-3 py-2 border border-slate-800">
            {ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            )}
            <span className="text-slate-400 font-semibold truncate">Live Capture:</span>
            <span className={`font-black ml-auto shrink-0 ${ok ? "text-emerald-400" : "text-rose-400"}`}>
              {ok ? "Matched" : "No Match"}
            </span>
          </div>
        </div>
      )}

      {/* Score Bar */}
      {scorePercent !== undefined && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">
              Face Match Score:{" "}
              <strong className={aboveThreshold ? "text-emerald-300" : "text-rose-300"}>
                {scorePercent}%
              </strong>
            </span>
            <span className="text-slate-500">
              Minimum Required:{" "}
              <strong className="text-slate-300">{thresholdPercent}%</strong>
            </span>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                aboveThreshold
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-rose-600 to-rose-400"
              }`}
              style={{ width: `${Math.min(100, scorePercent)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-white/50"
              style={{ left: `${Math.min(100, thresholdPercent)}%` }}
            />
          </div>

          <p className={`text-[11px] font-bold ${aboveThreshold ? "text-emerald-400" : "text-rose-400"}`}>
            {aboveThreshold
              ? `✓ Face Matched — ${scorePercent}% ≥ ${thresholdPercent}% required`
              : `✕ Face Not Matched — ${scorePercent}% < ${thresholdPercent}% required`}
          </p>
        </div>
      )}

      {/* Side-by-Side Biometric Image Comparison */}
      {!isProcessing && (
        <div className="grid grid-cols-2 gap-3">
          {/* Registered Biometric */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
              Registered Biometric
            </p>
            <div
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-slate-900 ${
                ok ? "border-emerald-500/40" : "border-slate-700/50"
              }`}
            >
              {registeredImage ? (
                <img
                  src={registeredImage}
                  alt="Registered Biometric Capture"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/80">
                    <ScanFace className="h-10 w-10 text-slate-500" />
                    <Fingerprint className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-slate-900 p-1 text-blue-400 ring-1 ring-blue-500/30" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Biometric Image
                  </span>
                  <span className="max-w-[8rem] text-[10px] leading-snug text-slate-500">
                    {emptyRegisteredLabel}
                  </span>
                </div>
              )}
              <div
                className={`absolute bottom-0 left-0 right-0 py-1 text-center text-[9px] font-black uppercase tracking-widest ${
                  ok ? "bg-emerald-500/80 text-white" : "bg-slate-900/80 text-slate-400"
                }`}
              >
                {ok ? "✓ Verified" : "Enrolled"}
              </div>
            </div>
          </div>

          {/* Live Verification Capture */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
              Live Verification
            </p>
            <div
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-slate-900 ${
                ok ? "border-blue-500/40" : "border-rose-500/30"
              }`}
            >
              {liveImage ? (
                <img
                  src={liveImage}
                  alt="Live Verification Capture"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/80">
                    <ScanFace className="h-10 w-10 text-slate-500" />
                    <Fingerprint className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-slate-900 p-1 text-blue-400 ring-1 ring-blue-500/30" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Biometric Image
                  </span>
                  <span className="max-w-[8rem] text-[10px] leading-snug text-slate-500">
                    {emptyLiveLabel}
                  </span>
                </div>
              )}
              <div
                className={`absolute bottom-0 left-0 right-0 py-1 text-center text-[9px] font-black uppercase tracking-widest ${
                  liveImage
                    ? ok
                      ? "bg-blue-500/80 text-white"
                      : "bg-rose-600/80 text-white"
                    : "bg-slate-900/80 text-slate-400"
                }`}
              >
                {liveImage ? (ok ? "✓ Matched" : "✕ No Match") : "Not Captured"}
              </div>
            </div>
          </div>
        </div>
        )}
    </div>
  );
}
