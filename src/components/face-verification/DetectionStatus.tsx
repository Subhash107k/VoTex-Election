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
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
          Live Biometric Checks
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Security Sealed
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-2">
        {statusItems.map(([key, label]) => {
          const passed = checks[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                passed
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border border-slate-800 bg-slate-950/60 text-slate-400"
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              )}
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

