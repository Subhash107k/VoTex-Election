import React from "react";

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-2 border-b border-[var(--border-subtle)]">
      <div className="text-[12px] text-[var(--text-secondary)] font-mono">
        {label}
      </div>
      <div className="text-sm font-semibold text-[var(--text-primary)]">
        {value ?? "Not provided"}
      </div>
    </div>
  );
}

export default function ProfileCard({ profile }: { profile: any }) {
  const user = profile?.user || {};
  const dob = user?.dob ? new Date(user.dob).toLocaleDateString() : null;
  const age = user?.dob
    ? Math.floor(
        (Date.now() - new Date(user.dob).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-sm">
      <h3 className="font-black text-[var(--text-primary)] mb-3">
        Personal Information
      </h3>
      <Row label="Full Name" value={user.fullName} />
      <Row label="Username" value={user.username || user.email} />
      <Row label="Gender" value={user.gender} />
      <Row label="Date of Birth" value={dob} />
      <Row label="Age" value={age} />
      <Row
        label="Nationality"
        value={profile?.nationality || user?.nationality || "Nepali"}
      />
      <Row label="Occupation" value={profile?.occupation || user?.occupation} />
      <Row label="Email" value={user.email} />
      <Row label="Primary Phone" value={user.mobile} />
      <Row
        label="Citizenship Number"
        value={profile?.citizenshipNumber || user.nationalID}
      />
    </div>
  );
}
