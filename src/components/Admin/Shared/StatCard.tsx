import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  accent?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = "text-blue-600",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon ? <div className={accent}>{icon}</div> : null}
      </div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
      {subtitle ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
