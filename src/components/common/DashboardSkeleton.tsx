import React from "react";

export function StatsCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-emerald-950/60 dark:bg-[#08110f]">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-emerald-900/40" />
        <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-emerald-900/40" />
      </div>
      <div className="mt-4 h-7 w-20 rounded bg-slate-200 dark:bg-emerald-900/40" />
      <div className="mt-2 h-3 w-32 rounded bg-slate-100 dark:bg-emerald-950/40" />
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-emerald-950/60 dark:bg-[#08110f]">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-emerald-900/40 shrink-0" />
        <div className="flex-1 text-center sm:text-left space-y-2.5 w-full">
          <div className="h-6 w-48 mx-auto sm:mx-0 rounded bg-slate-200 dark:bg-emerald-900/40" />
          <div className="h-4 w-36 mx-auto sm:mx-0 rounded bg-slate-100 dark:bg-emerald-950/40" />
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
            <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-emerald-900/30" />
            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-emerald-900/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-emerald-950/60 dark:bg-[#08110f]"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-emerald-900/40 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-emerald-900/40" />
              <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-emerald-950/40" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-slate-100 dark:bg-emerald-950/40" />
            <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-emerald-950/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-emerald-950/60 dark:bg-[#08110f]">
      <div className="h-5 w-36 rounded bg-slate-200 dark:bg-emerald-900/40 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-emerald-950/30">
          <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-emerald-900/30" />
          <div className="h-4 w-1/4 rounded bg-slate-100 dark:bg-emerald-950/30" />
          <div className="h-4 w-1/6 rounded bg-slate-200 dark:bg-emerald-900/30" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <ProfileHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <CardGridSkeleton count={3} />
    </div>
  );
}
