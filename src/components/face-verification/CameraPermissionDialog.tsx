import React from "react";
import { Camera, ShieldAlert, ShieldCheck, Play, Video } from "lucide-react";

interface CameraPermissionDialogProps {
  error?: string;
  onStart: () => void;
  disabled?: boolean;
}

export default function CameraPermissionDialog({
  error,
  onStart,
  disabled,
}: CameraPermissionDialogProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 p-6 shadow-2xl backdrop-blur-xl transition-all">
      <div className="flex items-start gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
          {error ? (
            <ShieldAlert className="h-7 w-7 text-rose-300" />
          ) : (
            <Video className="h-7 w-7 text-white animate-pulse" />
          )}
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Mandatory Biometric Gate
          </div>
          <h3 className="mt-2 text-base font-black tracking-tight text-white">
            Live Face Security Verification
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Your webcam will capture a short live face check matching your registered voter profile signature before your ballot is cast.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 px-6 py-4 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-blue-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Camera className="h-5 w-5 transition-transform group-hover:rotate-12" />
          <span>Initialize Live Camera & Verification</span>
          <Play className="h-4 w-4 fill-current transition-transform group-hover:translate-x-1" />
        </button>
      </div>


    </div>
  );
}
