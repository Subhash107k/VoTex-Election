import { AlertTriangle, ShieldCheck } from "lucide-react";

import type { ToastMessage } from "../../hooks/useToast.ts";

interface ToastProps {
  toast: ToastMessage | null;
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  const isError = toast.type === "error";
  const Icon = isError ? AlertTriangle : ShieldCheck;

  return (
    <div
      className={`fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium text-white shadow-2xl transition-all sm:right-6 sm:top-6 ${
        isError
          ? "border-red-500 bg-red-600"
          : "border-emerald-500 bg-emerald-600"
      }`}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{toast.text}</span>
    </div>
  );
}
