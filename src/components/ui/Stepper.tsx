import React from "react";
import { Check } from "lucide-react";

export interface StepItem {
  id: number;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export default function Stepper({
  steps,
  currentStep,
  onStepClick,
  className = "",
}: StepperProps) {
  return (
    <div className={`w-full overflow-x-auto py-2 scrollbar-none ${className}`}>
      <div className="flex items-center justify-between min-w-[640px] md:min-w-0 select-none">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => isCompleted && onStepClick && onStepClick(step.id)}
                className={`flex items-center gap-2 transition-all ${
                  isCompleted ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_#10b981]"
                      : isCurrent
                      ? "bg-emerald-500 text-slate-950 font-bold scale-110 shadow-[0_0_12px_#10b981]"
                      : "bg-slate-800/60 text-slate-500 border border-slate-700/50"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-[10px] font-extrabold uppercase hidden md:inline shrink-0 tracking-wide transition-colors ${
                      isCurrent || isCompleted ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 rounded-full transition-all ${
                    step.id < currentStep ? "bg-emerald-500/80" : "bg-slate-800"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
