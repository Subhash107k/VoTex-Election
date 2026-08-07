import React from "react";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";

export interface DetectionChecks {
  faceDetected: boolean;
  leftEye: boolean;
  rightEye: boolean;
  nose: boolean;
  mouth: boolean;
  leftEar: boolean;
  rightEar: boolean;
  faceCentered: boolean;
  blinkDetected: boolean;
  headTurnLeft: boolean;
  headTurnRight: boolean;
  returnedToCenter: boolean;
  imageQualityGood: boolean;
}

const statusItems: Array<[keyof DetectionChecks, string]> = [
  ["faceDetected", "Face Detected"],
  ["leftEye", "Left Eye Visible"],
  ["rightEye", "Right Eye Visible"],
  ["nose", "Nose Landmark"],
  ["mouth", "Mouth Landmark"],
  ["faceCentered", "Face Centered"],
  ["blinkDetected", "Blink Liveness Passed"],
  ["headTurnLeft", "Head Turn Left"],
  ["headTurnRight", "Head Turn Right"],
  ["returnedToCenter", "Return Center"],
  ["imageQualityGood", "Lighting & Clarity Good"],
];

export default function DetectionStatus({
  checks,
}: {
  checks: DetectionChecks;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-sm backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Live Biometric Checks
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
          <ShieldCheck className="h-3.5 w-3.5" /> Security Sealed
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {statusItems.map(([key, label]) => {
          const passed = checks[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                passed
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-500"
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
              )}
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
