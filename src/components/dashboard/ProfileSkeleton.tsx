import React from "react";
import Skeleton from "../ui/Skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="rounded-2xl p-6 bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="w-28 h-28 rounded-full shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <Skeleton className="h-6 w-1/3 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>
      </div>

      {/* Grid Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-4">
          <Skeleton className="h-5 w-1/2 rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-4">
          <Skeleton className="h-5 w-1/2 rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
