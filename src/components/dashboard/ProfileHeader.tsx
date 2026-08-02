import React from "react";

export default function ProfileHeader({ profile }: { profile: any }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-6 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm sm:flex-row sm:items-center">
      <div className="w-28 h-28 rounded-xl overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
        <img
          src={
            profile?.photoUrl ||
            profile?.user?.faceImage ||
            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='%23f8fafc'/><g fill='%23959eab'><circle cx='75' cy='50' r='30'/><path d='M30 130c0-28 27-52 45-52s45 24 45 52H30z'/></g></svg>"
          }
          alt={profile?.user?.fullName || "Profile photo"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex-1">
        <h1 className="text-2xl font-black">{profile?.user?.fullName}</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {profile?.user?.username || profile?.user?.email}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
            {profile?.status || "Unknown"}
          </span>
          <span className="bg-[var(--surface-muted)] text-[var(--text-secondary)] px-3 py-1 rounded-full text-xs">
            Voter ID: {profile?.user?.nationalID || "Not provided"}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        <div className="text-right text-sm text-[var(--text-secondary)]">
          Registered:{" "}
          {profile?.createdAt
            ? new Date(profile.createdAt).toLocaleString()
            : "—"}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 bg-[var(--surface-muted)] text-[var(--text-primary)] rounded-md font-semibold">
            Download PDF
          </button>
          <button className="px-3 py-2 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md">
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
