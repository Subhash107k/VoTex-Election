import React from "react";

interface FaceGuideProps {
  centered: boolean;
  distanceGood: boolean;
}

export default function FaceGuide({ centered, distanceGood }: FaceGuideProps) {
  const isReady = centered && distanceGood;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
      {/* Main Square Detection Frame */}
      <div
        className={`relative aspect-square h-[60%] sm:h-[68%] rounded-3xl border-2 transition-all duration-300 ${
          isReady
            ? "border-emerald-400 bg-emerald-500/5 shadow-[0_0_35px_rgba(52,211,153,0.4)]"
            : "border-cyan-400/80 bg-cyan-500/5 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
        }`}
      >
        {/* High-Tech Square Corner Brackets */}
        {/* Top-Left */}
        <div
          className={`absolute -left-1 -top-1 h-6 w-6 rounded-tl-xl border-l-4 border-t-4 transition-colors ${
            isReady ? "border-emerald-400" : "border-cyan-400"
          }`}
        />
        {/* Top-Right */}
        <div
          className={`absolute -right-1 -top-1 h-6 w-6 rounded-tr-xl border-r-4 border-t-4 transition-colors ${
            isReady ? "border-emerald-400" : "border-cyan-400"
          }`}
        />
        {/* Bottom-Left */}
        <div
          className={`absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-xl border-b-4 border-l-4 transition-colors ${
            isReady ? "border-emerald-400" : "border-cyan-400"
          }`}
        />
        {/* Bottom-Right */}
        <div
          className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-br-xl border-b-4 border-r-4 transition-colors ${
            isReady ? "border-emerald-400" : "border-cyan-400"
          }`}
        />

        {/* Center Target Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="h-4 w-px bg-current" />
          <div className="h-px w-4 bg-current" />
        </div>

        {/* Status Badge Tag */}
        <div className="absolute -bottom-8 inset-x-0 flex justify-center">
          <span
            className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-md ${
              isReady
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50"
                : "bg-slate-950/90 text-cyan-300 border-cyan-500/50"
            }`}
          >
            {isReady ? "Face Aligned" : "Position Face in Square"}
          </span>
        </div>
      </div>
    </div>
  );
}
