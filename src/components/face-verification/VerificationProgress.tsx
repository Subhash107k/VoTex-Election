import React from "react";
import { CheckCircle, Loader2 } from "lucide-react";

export interface ProgressStep {
  label: string;
  status: "waiting" | "processing" | "complete" | "failed";
}

export default function VerificationProgress({
  percent,
  steps,
}: {
  percent: number;
  steps: ProgressStep[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Verification Progress
        </span>
        <span className="text-xs font-black text-slate-700">{percent}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className="flex items-center justify-between text-xs text-slate-600"
          >
            <span className="font-semibold">
              Step {index + 1}: {step.label}
            </span>
            <span
              className={`flex items-center gap-1 font-bold ${
                step.status === "complete"
                  ? "text-emerald-600"
                  : step.status === "processing"
                    ? "text-blue-600"
                    : step.status === "failed"
                      ? "text-red-600"
                      : "text-slate-400"
              }`}
            >
              {step.status === "complete" && <CheckCircle className="h-3.5 w-3.5" />}
              {step.status === "processing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {step.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
