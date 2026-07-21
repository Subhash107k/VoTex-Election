import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface VerificationFailedDialogProps {
  message: string;
  onRetry: () => void;
}

export default function VerificationFailedDialog({
  message,
  onRetry,
}: VerificationFailedDialogProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-black">Verification failed</div>
          <p className="mt-1 text-xs font-semibold">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Verification
          </button>
        </div>
      </div>
    </div>
  );
}
