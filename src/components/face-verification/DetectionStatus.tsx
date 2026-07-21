import React from "react";
import { Check, X } from "lucide-react";

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
  ["leftEye", "Left Eye"],
  ["rightEye", "Right Eye"],
  ["nose", "Nose"],
  ["mouth", "Mouth"],
  ["faceCentered", "Face Centered"],
  ["blinkDetected", "Blink Detected"],
  ["headTurnLeft", "Head Turn Left"],
  ["headTurnRight", "Head Turn Right"],
  ["returnedToCenter", "Return Center"],
  ["imageQualityGood", "Image Quality Good"],
];

export default function DetectionStatus({
  checks,
}: {
  checks: DetectionChecks;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
        Face Status
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {statusItems.map(([key, label]) => {
          const passed = checks[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold ${
                passed
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              {passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              {label}
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500">
        <span>Left ear: {checks.leftEar ? "visible" : "optional"}</span>
        <span>Right ear: {checks.rightEar ? "visible" : "optional"}</span>
      </div>
    </div>
  );
}
