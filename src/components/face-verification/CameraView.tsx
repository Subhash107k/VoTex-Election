import React from "react";
import { Camera } from "lucide-react";
import FaceGuide from "./FaceGuide.tsx";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  centered: boolean;
  distanceGood: boolean;
  qualityLabel: string;
  brightnessLabel: string;
  distanceLabel: string;
  children?: React.ReactNode;
}

export default function CameraView({
  videoRef,
  cameraActive,
  centered,
  distanceGood,
  qualityLabel,
  brightnessLabel,
  distanceLabel,
  children,
}: CameraViewProps) {
  return (
    <div className="relative aspect-[4/3] w-full min-h-[220px] sm:min-h-[300px] md:min-h-[360px] max-h-[55vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover -scale-x-100"
      />

      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-slate-400 bg-slate-950/90">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
          </div>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
            Live Camera Ready
          </span>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Press Initialize to launch webcam & biometric scanner
          </p>
        </div>
      )}

      {cameraActive && (
        <>
          <FaceGuide centered={centered} distanceGood={distanceGood} />
          <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 flex flex-wrap gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider z-20">
            <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-emerald-300 ring-1 ring-emerald-500/30 backdrop-blur-md">
              Quality {qualityLabel}
            </span>
            <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-blue-200 ring-1 ring-blue-500/30 backdrop-blur-md">
              Light {brightnessLabel}
            </span>
            <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-amber-200 ring-1 ring-amber-500/30 backdrop-blur-md">
              Distance {distanceLabel}
            </span>
          </div>
        </>
      )}

      {children}
    </div>
  );
}

