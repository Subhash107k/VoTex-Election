import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

export default function CaptureOverlay({
  state,
}: {
  state: "idle" | "capturing" | "matching" | "success";
}) {
  if (state === "idle") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm">
      <div className="rounded-2xl border border-white/10 bg-slate-950/90 px-5 py-4 text-center text-white shadow-2xl">
        {state === "success" ? (
          <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
        ) : (
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-400" />
        )}
        <div className="text-xs font-black uppercase tracking-widest">
          {state === "capturing"
            ? "Capturing best frame"
            : state === "matching"
              ? "Matching on server"
              : "Verification passed"}
        </div>
      </div>
    </div>
  );
}
