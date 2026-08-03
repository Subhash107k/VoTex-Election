import type { ChangeEvent, RefObject } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  RefreshCw,
} from "lucide-react";

export interface FingerprintCaptureCardProps {
  leftPreview: string;
  rightPreview: string;
  fingerprintImage: string;
  fingerprintCameraActive: boolean;
  fingerprintVideoRef: RefObject<HTMLVideoElement | null>;
  selectedSide: "left" | "right";
  biometricStatus: "idle" | "checking" | "clear" | "duplicate";
  fingerprintMatchUser: string;
  onSelectSide: (side: "left" | "right") => void;
  /** Starts capture for whichever side is currently selected. */
  onCapture: (side: "left" | "right") => void;
  onCaptureFrame: () => void;
  /** Handles a file upload for whichever side is currently selected. */
  onUpload: (side: "left" | "right", e: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

const STATUS_COPY: Record<
  FingerprintCaptureCardProps["biometricStatus"],
  { label: string; detail: string }
> = {
  idle: {
    label: "Standing by",
    detail: "Capture a sharp image of both fingers to begin the check.",
  },
  checking: {
    label: "Cross-referencing",
    detail: "Comparing against the biometric database…",
  },
  clear: {
    label: "No match found",
    detail: "This fingerprint is unique and ready to register.",
  },
  duplicate: {
    label: "Match found",
    detail: "This fingerprint appears to already belong to",
  },
};

const STATUS_STYLE: Record<
  FingerprintCaptureCardProps["biometricStatus"],
  { text: string; dot: string }
> = {
  idle: { text: "text-gray-400", dot: "bg-gray-600" },
  checking: { text: "text-amber-400", dot: "bg-amber-400" },
  clear: { text: "text-teal-300", dot: "bg-teal-300" },
  duplicate: { text: "text-rose-400", dot: "bg-rose-400" },
};

function RidgeWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {[10, 22, 34, 46, 58, 70, 82, 94, 106].map((r) => (
        <circle
          key={r}
          cx="60"
          cy="60"
          r={r}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray={r % 3 === 0 ? "0 1" : "10 3"}
        />
      ))}
    </svg>
  );
}

export default function FingerprintCaptureCard({
  leftPreview,
  rightPreview,
  fingerprintImage,
  fingerprintCameraActive,
  fingerprintVideoRef,
  selectedSide,
  biometricStatus,
  fingerprintMatchUser,
  onSelectSide,
  onCapture,
  onCaptureFrame,
  onUpload,
  onReset,
}: FingerprintCaptureCardProps) {
  const status = STATUS_COPY[biometricStatus];
  const statusStyle = STATUS_STYLE[biometricStatus];
  const hasCapture = Boolean(fingerprintImage);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-950/60 p-5">
      <style>{`
        @keyframes fp-scan {
          0%   { top: 6%; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: 94%; opacity: 0; }
        }
        .fp-scanline {
          animation: fp-scan 2.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-scanline { animation: none; top: 50%; opacity: .6; }
        }
      `}</style>

      <RidgeWatermark className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 text-gray-800/40" />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-gray-800/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-teal-300" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Biometric Fingerprint Compliance Seal *
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">
          FP&nbsp;/&nbsp;01
        </span>
      </div>

      <p className="mt-3 text-[10px] leading-normal text-gray-400">
        Capture each finger separately in good light. Every image is checked
        against existing voter records the moment it's captured.
      </p>

      {/* Side thumbnails */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(
          [
            ["left", "Left finger", leftPreview],
            ["right", "Right finger", rightPreview],
          ] as const
        ).map(([side, label, image]) => (
          <button
            key={side}
            type="button"
            onClick={() => onSelectSide(side)}
            aria-pressed={selectedSide === side}
            className={`relative min-h-28 overflow-hidden rounded-xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70 ${
              selectedSide === side
                ? "border-teal-300/70 bg-teal-300/10"
                : "border-gray-800 bg-gray-950 hover:border-gray-700"
            }`}
          >
            {image ? (
              <img
                src={image}
                alt={`${label} preview`}
                className="h-20.5 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-20.5 items-center justify-center rounded-lg border border-dashed border-gray-800 text-gray-600">
                <Fingerprint className="h-7 w-7" />
              </div>
            )}
            <span className="mt-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-300">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  image ? "bg-teal-300" : "bg-gray-700"
                }`}
              />
              {label} {image ? "captured" : "awaiting capture"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 md:grid-cols-12">
        {/* Live capture panel */}
        <div className="relative flex flex-col items-center rounded-2xl border border-gray-800 bg-gray-950 p-4 md:col-span-4">
          <div className="relative mb-3 aspect-4/3 w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
            {fingerprintCameraActive ? (
              <video
                ref={fingerprintVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            ) : fingerprintImage ? (
              <img
                src={fingerprintImage}
                alt="Fingerprint capture preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center px-4 text-center text-gray-500">
                <Fingerprint className="mb-2 h-9 w-9 text-teal-400/70" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Live preview appears here
                </span>
                <span className="mt-1 text-[8px] text-gray-600">
                  Select a side, then align that finger in the frame
                </span>
              </div>
            )}

            {fingerprintCameraActive && (
              <>
                <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-teal-300/40" />
                <div className="fp-scanline pointer-events-none absolute left-0 right-0 h-px bg-teal-300 shadow-[0_0_8px_2px_rgba(94,234,212,0.6)]" />
              </>
            )}
          </div>

          <div className="flex w-full flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => onCapture(selectedSide)}
              className="min-w-22.5 flex-1 select-none rounded-lg bg-teal-500/90 py-1.5 text-[9px] font-bold uppercase text-gray-950 hover:bg-teal-400"
            >
              {fingerprintCameraActive
                ? "Camera live"
                : `Capture ${selectedSide} finger`}
            </button>
            <button
              type="button"
              onClick={onCaptureFrame}
              disabled={!fingerprintCameraActive}
              className="min-w-22.5 flex-1 select-none rounded-lg border border-gray-800 bg-gray-900 py-1.5 text-[9px] font-bold uppercase text-gray-300 hover:text-white disabled:opacity-40"
            >
              Freeze frame
            </button>
          </div>

          <label className="mt-2 w-full cursor-pointer select-none rounded border border-gray-800 bg-gray-900 px-3 py-1.5 text-center text-[9px] font-bold uppercase text-gray-300 hover:text-white">
            Upload {selectedSide} fingerprint
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onUpload(selectedSide, e)}
              className="hidden"
            />
          </label>
        </div>

        {/* Status readout */}
        <div className="space-y-2 md:col-span-8">
          <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-gray-500">
            Biometrics status
          </span>
          <div className="min-h-25 rounded-xl border border-gray-800 bg-gray-950 p-3">
            <div className={`flex items-center gap-2 ${statusStyle.text}`}>
              {biometricStatus === "checking" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : biometricStatus === "clear" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : biometricStatus === "duplicate" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
              )}
              <span className="text-xs font-semibold">{status.label}</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-normal text-gray-500">
              {status.detail}
              {biometricStatus === "duplicate" && (
                <span className="font-semibold text-rose-300">
                  {" "}
                  {fingerprintMatchUser}.
                </span>
              )}
            </p>
          </div>

          {hasCapture && (
            <button
              type="button"
              onClick={onReset}
              className="select-none rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-[9px] font-bold uppercase text-red-400 hover:bg-gray-800"
            >
              Clear capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
