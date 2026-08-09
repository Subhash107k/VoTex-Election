import React from "react";
import {
  Camera,
  Cpu,
  Loader2,
  ShieldCheck,
  Sparkles,
  Lock,
  ScanLine,
} from "lucide-react";

export default function CaptureOverlay({
  state,
}: {
  state: "idle" | "capturing" | "matching" | "success";
}) {
  if (state === "idle") return null;

  const isSuccess = state === "success";
  const isCapturing = state === "capturing";
  const isMatching = state === "matching";

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-md transition-all duration-300 p-4">
      {/* Laser Scanning Line Animation (during capture/match) */}
      {(isCapturing || isMatching) && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse" />
      )}

      {/* Main Glassmorphic Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/90 p-6 text-center shadow-2xl shadow-blue-950/50 backdrop-blur-xl max-w-xs sm:max-w-sm w-full transition-all transform scale-100">
        {/* Ambient Glow Background */}
        <div
          className={`absolute -top-12 -left-12 h-32 w-32 rounded-full blur-3xl opacity-30 ${
            isSuccess
              ? "bg-emerald-500"
              : isMatching
                ? "bg-purple-500"
                : "bg-blue-500"
          }`}
        />
        <div
          className={`absolute -bottom-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-30 ${
            isSuccess
              ? "bg-teal-500"
              : isMatching
                ? "bg-indigo-500"
                : "bg-cyan-500"
          }`}
        />

        {/* Central Animated Icon Ring */}
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          {/* Pulsing ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 opacity-40 animate-ping ${
              isSuccess
                ? "border-emerald-400"
                : isMatching
                  ? "border-purple-400"
                  : "border-cyan-400"
            }`}
          />

          {/* Rotating outer spinner ring */}
          {!isSuccess && (
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-indigo-500 animate-spin" />
          )}

          {/* Icon Badge Container */}
          <div
            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border shadow-inner transition-all ${
              isSuccess
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-emerald-950/50"
                : isMatching
                  ? "border-purple-500/40 bg-purple-500/10 text-purple-300 shadow-purple-950/50"
                  : "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-cyan-950/50"
            }`}
          >
            {isSuccess ? (
              <ShieldCheck className="h-7 w-7 text-emerald-400 animate-bounce" />
            ) : isMatching ? (
              <Cpu className="h-7 w-7 text-purple-300 animate-pulse" />
            ) : (
              <Camera className="h-7 w-7 text-cyan-400 animate-pulse" />
            )}
          </div>
        </div>

        {/* Main Status Text */}
        <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
          {isCapturing ? (
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Capturing Optimal Frame
            </span>
          ) : isMatching ? (
            <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
              Verifying Face Embeddings
            </span>
          ) : (
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-green-400 bg-clip-text text-transparent">
              Verification Successful
            </span>
          )}
        </h4>

        {/* Descriptive Subtitle */}
        <p className="mt-1 text-[11px] font-medium text-slate-400">
          {isCapturing
            ? "Extracting high-resolution facial geometry..."
            : isMatching
              ? "Comparing live facial vectors with registered ballot dossier..."
              : "Identity confirmed. Generating cryptographic vote token."}
        </p>

        {/* Security Badge Pill */}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[10px] font-mono text-slate-300 backdrop-blur-sm">
          <Lock className="h-3 w-3 text-cyan-400 shrink-0" />
          <span>
            {isSuccess
              ? "AES-256 SESSION VERIFIED"
              : isMatching
                ? "NEURAL VECTOR MATCHING"
                : "BIOMETRIC SHUTTER ACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
