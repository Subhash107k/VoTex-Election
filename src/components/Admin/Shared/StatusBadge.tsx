import { useEffect, useState } from "react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const [currentStatus, setCurrentStatus] = useState(
    (status?.toLowerCase() ?? "pending").trim(),
  );

  useEffect(() => {
    setCurrentStatus((status?.toLowerCase() ?? "pending").trim());
  }, [status]);

  const normalized = currentStatus;
  const displayLabel =
    normalized === "approved"
      ? "Approved"
      : normalized === "disapproved"
        ? "Disapproved"
        : status;
  const styles: Record<string, string> = {
    active:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    approved:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    disapproved:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    verified: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    pending:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    rejected: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    draft:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  };

  const handleClick = () => {
    setCurrentStatus((prev) =>
      prev === "approved"
        ? "disapproved"
        : prev === "disapproved"
          ? "approved"
          : "approved",
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${styles[normalized] ?? styles.pending}`}
    >
      {displayLabel}
    </button>
  );
}
