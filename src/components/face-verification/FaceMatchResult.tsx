import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface FaceMatchResultProps {
  status: "idle" | "success" | "failed" | "processing";
  score?: number;
  threshold?: number;
  message?: string;
}

export default function FaceMatchResult({
  status,
  score,
  threshold,
  message,
}: FaceMatchResultProps) {
  if (status === "idle") return null;

  const ok = status === "success";
  return (
    <div
      className={`rounded-2xl border p-4 ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : status === "processing"
            ? "border-blue-200 bg-blue-50 text-blue-800"
            : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-start gap-3">
        {ok ? (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <div>
          <div className="text-sm font-black">
            {ok
              ? "Verification Successful"
              : status === "processing"
                ? "Verification Processing"
                : "Verification Failed"}
          </div>
          <p className="mt-1 text-xs font-medium">{message}</p>
          {score !== undefined && threshold !== undefined && (
            <p className="mt-2 text-[11px] font-bold">
              Similarity: {Math.round(score * 100)}% | Threshold:{" "}
              {Math.round(threshold * 100)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
