import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
      <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-blue-600" />
      <div className="text-xs font-black uppercase tracking-wider text-slate-700">
        {label}
      </div>
    </div>
  );
}
