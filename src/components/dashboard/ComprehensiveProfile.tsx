import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Fingerprint,
  History,
  LockKeyhole,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  Vote,
} from "lucide-react";
import DocumentPreview from "../common/DocumentPreview.tsx";

interface ComprehensiveProfileProps {
  token: string;
  user: any;
}
type Tone = "success" | "warning" | "danger" | "neutral";
const first = (...values: any[]) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );
const shown = (value: any) => first(value) || "Not Provided";
const date = (value: any) =>
  value ? new Date(value).toLocaleString() : "Not Provided";

function StatusBadge({ value, tone }: { value: string; tone?: Tone }) {
  const lower = String(value || "").toLowerCase();
  const kind =
    tone ||
    (lower.includes("reject")
      ? "danger"
      : lower.includes("pending")
        ? "warning"
        : lower.includes("verif") ||
          lower.includes("approv") ||
          lower.includes("eligible")
          ? "success"
          : "neutral");
  const styles: Record<Tone, string> = {
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    danger: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    neutral: "border-slate-700 bg-slate-800/60 text-slate-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[kind]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {shown(value)}
    </span>
  );
}
function InfoGrid({ entries }: { entries: Array<[string, any]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-3"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-words text-xs font-semibold text-slate-200">
            {shown(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
function Section({
  title,
  icon: Icon,
  children,
  open = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details
      open={open}
      className="group overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl shadow-black/10"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between border-b border-slate-800/70 px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-200">
          <Icon className="h-4 w-4 text-emerald-400" />
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" />
      </summary>
      <div className="p-4">{children}</div>
    </details>
  );
}
function Documents({ items }: { items: any[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-200">
                {item.label}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Number: {shown(item.number)}
              </p>
            </div>
            <StatusBadge
              value={item.status || (item.url ? "Pending" : "Not Uploaded")}
            />
          </div>
          <DocumentPreview
            label={item.label}
            fileUrl={item.url}
            uploadedAt={item.uploadedAt}
            status={
              item.status === "Verified"
                ? "verified"
                : item.url
                  ? "pending"
                  : "idle"
            }
            subtitle={`Issue: ${shown(item.issueDate)} | Expiry: ${shown(item.expiryDate)}`}
            description="Read-only identity document preview."
          />
        </div>
      ))}
    </div>
  );
}

export default function ComprehensiveProfile({
  token,
  user: initialUser,
}: ComprehensiveProfileProps) {
  const [data, setData] = useState<any>({
    user: initialUser,
    profile: null,
    document: null,
    faceVerification: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [light, setLight] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/my-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Unable to load profile dossier");
      setData(await response.json());
    } catch (cause: any) {
      setError(cause.message || "Unable to load profile dossier");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [token]);
  const { user, profile, document, faceVerification } = data;
  const report = user?.verificationReport || {};
  const address = (temporary = false) => {
    const prefix = temporary ? "temp" : "perm";
    return [
      ["Country", profile?.[`${prefix}Country`]],
      [
        "Province",
        profile?.[`${prefix}Province`] ||
        (!temporary ? profile?.province : undefined),
      ],
      [
        "District",
        profile?.[`${prefix}District`] ||
        (!temporary ? profile?.district : undefined),
      ],
      [
        "Municipality",
        profile?.[`${prefix}Municipality`] ||
        (!temporary ? profile?.municipality : undefined),
      ],
      [
        "Ward",
        profile?.[`${prefix}WardNumber`] ||
        (!temporary ? profile?.wardNumber : undefined),
      ],
      [
        "Tole / Street",
        profile?.[`${prefix}Tole`] || profile?.[`${prefix}StreetAddress`],
      ],
      ["House Number", profile?.[`${prefix}HouseNumber`]],
      [
        "Postal Code",
        profile?.[`${prefix}PostalCode`] ||
        (!temporary ? profile?.postalCode : undefined),
      ],
    ] as Array<[string, any]>;
  };
  const documents = useMemo(
    () => [
      {
        label: "Citizenship Front",
        number: profile?.citizenshipNumber || document?.citizenshipNumber,
        issueDate: profile?.citizenshipIssueDate,
        url: profile?.citizenshipFrontImage || document?.citizenshipFrontImage,
        uploadedAt: document?.createdAt,
        status: profile?.citizenshipFrontImage ? "Verified" : "Pending",
      },
      {
        label: "Citizenship Back",
        number: profile?.citizenshipNumber || document?.citizenshipNumber,
        issueDate: profile?.citizenshipIssueDate,
        url: profile?.citizenshipBackImage || document?.citizenshipBackImage,
        uploadedAt: document?.createdAt,
        status: profile?.citizenshipBackImage ? "Verified" : "Pending",
      },
      {
        label: "National ID Front",
        number: profile?.nidNumber,
        issueDate: profile?.nidIssueDate,
        url: profile?.nidFrontImage,
        status: profile?.nidStatus,
      },
      {
        label: "National ID Back",
        number: profile?.nidNumber,
        issueDate: profile?.nidIssueDate,
        url: profile?.nidBackImage,
        status: profile?.nidStatus,
      },
      {
        label: "Signature",
        url: document?.signatureImage || profile?.signatureImage,
        uploadedAt: document?.createdAt,
        status: document?.signatureImage ? "Verified" : "Pending",
      },
    ],
    [profile, document],
  );
  const timeline = [
    ["Registration", user?.registrationTimestamp || user?.createdAt],
    ["Email Verified", user?.emailVerifiedAt],
    ["Phone Verified", user?.mobileVerifiedAt],
    [
      "Profile Completed",
      user?.isProfileComplete ? user?.updatedAt || user?.createdAt : undefined,
    ],
    ["Documents Uploaded", document?.createdAt],
    ["Face Verified", faceVerification?.verificationTimestamp],
    [
      "Fingerprint Verified",
      user?.fingerprintImage ? report?.submissionTimestamp : undefined,
    ],
    ["Admin Approved", user?.isApproved ? user?.updatedAt : undefined],
    [
      "Eligible to Vote",
      user?.isApproved && user?.isVerified ? user?.updatedAt : undefined,
    ],
  ] as Array<[string, any]>;
  const canvas = light
    ? "bg-slate-50 text-slate-900"
    : "bg-slate-950 text-slate-100";
  if (loading)
    return (
      <div
        className={`flex min-h-[420px] items-center justify-center ${canvas}`}
      >
        <RefreshCw className="h-7 w-7 animate-spin text-emerald-400" />
      </div>
    );
  return (
    <div className={`rounded-3xl border border-slate-800 p-2 ${canvas}`}>
      <header className="sticky top-0 z-10 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
            User Profile Details
          </p>
          <h2 className="mt-1 text-lg font-black">{shown(user?.fullName)}</h2>
          <p className="text-[10px] text-slate-500">ID: {shown(user?.id)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={user?.accountStatus || "Pending"} />
          <button
            type="button"
            onClick={() => setLight((current) => !current)}
            className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-slate-300"
          >
            {light ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            onClick={load}
            title="Refresh profile"
            className="rounded-lg border border-slate-700 p-2 text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      {error && (
        <div className="mb-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}
      <div className="space-y-3">
        <Section title="Basic Information" icon={User}>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <img
              src={
                first(
                  user?.profilePicture,
                  profile?.profilePhoto,
                  user?.faceImage,
                ) || ""
              }
              alt="Profile"
              loading="lazy"
              className="h-20 w-20 rounded-2xl border-2 border-emerald-400/60 bg-slate-900 object-cover"
            />
            <InfoGrid
              entries={[
                ["Full Name", user?.fullName],
                ["Username", user?.username],
                ["Email", user?.email],
                ["Phone Number", user?.mobile],
                ["User ID", user?.id],
                [
                  "Registration Date",
                  date(user?.registrationTimestamp || user?.createdAt),
                ],
                ["Role", user?.role],
                ["Account Status", user?.accountStatus],
              ]}
            />
          </div>
          <InfoGrid
            entries={[
              ["Date of Birth", user?.dob || profile?.dob],
              ["Gender", user?.gender || profile?.gender],
              ["Nationality", profile?.nationality],
              ["Marital Status", profile?.maritalStatus],
              ["Blood Group", profile?.bloodGroup],
              ["Occupation", user?.occupation || profile?.occupation],
              ["Education", profile?.educationStatus],
              [
                "Citizenship Number",
                profile?.citizenshipNumber || user?.citizenshipNumber,
              ],
            ]}
          />
        </Section>
        <Section title="Permanent Address" icon={MapPin}>
          <InfoGrid entries={address()} />
        </Section>
        <Section title="Temporary Address" icon={MapPin}>
          <InfoGrid
            entries={
              profile?.isTemporarySameAsPermanent
                ? [["Address", "Same as Permanent Address"]]
                : address(true)
            }
          />
        </Section>
        <Section title="Contact Information" icon={Phone}>
          <InfoGrid
            entries={[
              ["Primary Phone", user?.mobile],
              ["Secondary Phone", profile?.secondaryPhone],
              ["Email", user?.email],
              ["Emergency Contact Name", profile?.emergencyContactName],
              ["Emergency Contact Number", profile?.emergencyContactNumber],
              ["Relationship", profile?.emergencyContactRelationship],
            ]}
          />
        </Section>
        <Section title="Family Information" icon={Users}>
          <InfoGrid
            entries={[
              ["Father", profile?.fatherName],
              ["Father Local Name", profile?.fatherNameNepali],
              ["Mother", profile?.motherName],
              ["Mother Local Name", profile?.motherNameNepali],
              ["Grandfather", profile?.grandfatherName],
              ["Grandfather Local Name", profile?.grandfatherNameNepali],
              ["Grandmother", profile?.grandmotherName],
              ["Spouse", profile?.spouseName],
              ["Spouse Local Name", profile?.spouseNameNepali],
              ["Guardian", profile?.guardianName],
              ["Family Members", profile?.familyMembers],
            ]}
          />
        </Section>
        <Section title="Identity Documents" icon={FileText}>
          <Documents items={documents} />
        </Section>
        <Section title="Verification Information" icon={ShieldCheck}>
          <InfoGrid
            entries={[
              [
                "Email Verification",
                user?.isEmailVerified ? "Verified" : "Pending",
              ],
              [
                "Phone Verification",
                user?.isMobileVerified ? "Verified" : "Pending",
              ],
              [
                "Face Verification",
                faceVerification?.verificationStatus ||
                (user?.isVerified ? "Verified" : "Pending"),
              ],
              [
                "Fingerprint Verification",
                user?.fingerprintImage ? "Verified" : "Pending",
              ],
              [
                "Document Verification",
                report?.documentScore ? "Verified" : "Pending",
              ],
              ["Admin Approval", user?.isApproved ? "Approved" : "Pending"],
              ["KYC Status", user?.accountStatus],
              [
                "Registration Status",
                user?.isProfileComplete ? "Completed" : "Pending",
              ],
              [
                "Election Eligibility",
                user?.isApproved && user?.isVerified ? "Eligible" : "Pending",
              ],
            ]}
          />
        </Section>
        <Section title="Biometric Information" icon={Fingerprint}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Face Image", user?.faceImage, "object-cover"],
              ["Live Capture", faceVerification?.faceImage, "object-cover"],
              [
                "Left Fingerprint",
                user?.fingerprintLeftImage,
                "object-contain",
              ],
              [
                "Right Fingerprint",
                user?.fingerprintRightImage,
                "object-contain",
              ],
            ].map(([label, url, fit]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2"
              >
                <p className="mb-2 text-[9px] font-bold uppercase text-slate-500">
                  {label}
                </p>
                {url ? (
                  <img
                    src={String(url)}
                    alt={String(label)}
                    loading="lazy"
                    className={`h-28 w-full rounded-lg border border-slate-800 bg-white ${fit}`}
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-600">
                    Not Provided
                  </div>
                )}
              </div>
            ))}
          </div>
          <InfoGrid
            entries={[
              ["Face Match Score", report?.faceMatchScore],
              ["Fingerprint Match Score", report?.fingerprintQuality],
              ["Liveness Detection", faceVerification?.verificationStatus],
              [
                "Verification Timestamp",
                date(
                  faceVerification?.verificationTimestamp ||
                  report?.submissionTimestamp,
                ),
              ],
            ]}
          />
        </Section>
        <Section title="Election Information" icon={Vote}>
          <InfoGrid
            entries={[
              ["Voter ID", user?.voterId],
              ["Constituency", profile?.constituency],
              ["Province", profile?.permProvince || profile?.province],
              ["District", profile?.permDistrict || profile?.district],
              [
                "Municipality",
                profile?.permMunicipality || profile?.municipality,
              ],
              ["Ward", profile?.permWardNumber || profile?.wardNumber],
              ["Polling Station", profile?.pollingStation],
              [
                "Election Eligibility",
                user?.isApproved && user?.isVerified ? "Eligible" : "Pending",
              ],
              ["Voting Status", profile?.votingStatus],
              ["Last Vote Time", date(profile?.lastVoteTime)],
            ]}
          />
        </Section>
        <Section title="Account Information" icon={LockKeyhole}>
          <InfoGrid
            entries={[
              ["Username", user?.username],
              ["Role", user?.role],
              ["Login Method", user?.loginMethod || "Password"],
              ["Created At", date(user?.createdAt)],
              ["Updated At", date(profile?.updatedAt || user?.updatedAt)],
              ["Last Login", date(user?.lastLoginAt)],
              [
                "Active Session",
                user?.activeSession ? "Active" : "Not Available",
              ],
              ["Device Information", report?.deviceInformation],
            ]}
          />
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <History className="h-4 w-4" />
            Login history: {shown(user?.loginHistory)}
          </div>
        </Section>
        <Section title="Activity Timeline" icon={Activity}>
          <div className="relative ml-2 space-y-4 border-l border-slate-800 pl-5">
            {timeline.map(([label, timestamp], index) => (
              <div key={label} className="relative">
                <span
                  className={`absolute -left-[1.65rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${timestamp ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-slate-700 bg-slate-900 text-slate-600"}`}
                >
                  {timestamp ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Clock3 className="h-3 w-3" />
                  )}
                </span>
                <p className="text-xs font-bold text-slate-200">
                  {index + 1}. {label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {date(timestamp)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}