import React from "react";
import { Camera, ShieldAlert } from "lucide-react";

interface CameraPermissionDialogProps {
  error?: string;
  onStart: () => void;
  disabled?: boolean;
}

export default function CameraPermissionDialog({
  error,
  onStart,
  disabled,
}: CameraPermissionDialogProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          {error ? <ShieldAlert className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">
            Start Verification
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Your webcam will open for a short live face check before voting.
          </p>
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Start Verification
      </button>
    </div>
  );
}
