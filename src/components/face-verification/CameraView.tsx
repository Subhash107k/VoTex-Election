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
    <div className="relative aspect-[4/3] min-h-[360px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />

      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Camera className="h-10 w-10 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Camera is closed
          </span>
        </div>
      )}

      {cameraActive && (
        <>
          <FaceGuide centered={centered} distanceGood={distanceGood} />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="rounded-full bg-slate-950/80 px-3 py-1 text-emerald-300 ring-1 ring-white/10">
              Quality {qualityLabel}
            </span>
            <span className="rounded-full bg-slate-950/80 px-3 py-1 text-blue-200 ring-1 ring-white/10">
              Light {brightnessLabel}
            </span>
            <span className="rounded-full bg-slate-950/80 px-3 py-1 text-amber-200 ring-1 ring-white/10">
              Distance {distanceLabel}
            </span>
          </div>
        </>
      )}

      {children}
    </div>
  );
}
