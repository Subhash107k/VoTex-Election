import React from "react";

interface FaceGuideProps {
  centered: boolean;
  distanceGood: boolean;
}

export default function FaceGuide({ centered, distanceGood }: FaceGuideProps) {
  const isReady = centered && distanceGood;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className={`h-[62%] w-[46%] rounded-[48%] border-4 transition-colors ${
          isReady
            ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.28)]"
            : "border-amber-300 shadow-[0_0_28px_rgba(251,191,36,0.22)]"
        }`}
      />
      <div className="absolute left-1/2 top-[18%] h-[64%] w-px -translate-x-1/2 bg-white/18" />
      <div className="absolute left-[22%] top-1/2 h-px w-[56%] -translate-y-1/2 bg-white/18" />
    </div>
  );
}
