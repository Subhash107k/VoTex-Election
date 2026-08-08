import React, { memo, useMemo, useState } from "react";
import {
  ShieldCheck,
  ChevronLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Fingerprint,
  IdCard,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Printer,
  UserCircle2,
  Users,
  AlertTriangle,
  BadgeCheck,
  Sparkles,
  BookOpen,
  PenTool,
  Heart,
  Briefcase,
  Globe,
  Hash,
  CreditCard,
  Home,
  Building2,
  FileCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  Layers,
} from "lucide-react";
import DocumentViewerModal from "./DocumentViewerModal.tsx";

interface FinalPreviewDashboardProps {
  user: any;
  personal: {
    dob: string;
    gender: string;
    occupation: string;
  };
  permCountry: string;
  permProvince: string;
  permDistrict: string;
  permMunicipality: string;
  permWardNumber: string;
  permTole: string;
  permStreetAddress: string;
  permPostalCode: string;
  tempCountry: string;
  tempProvince: string;
  tempDistrict: string;
  tempMunicipality: string;
  tempWardNumber: string;
  tempTole: string;
  tempStreetAddress: string;
  tempPostalCode: string;
  sameAsPermanent: boolean;
  fullNameNepali: string;
  maritalStatus: string;
  educationStatus: string;
  bloodGroup: string;
  nationality: string;
  fatherName: string;
  fatherNameNepali: string;
  motherName: string;
  motherNameNepali: string;
  grandfatherName: string;
  grandfatherNameNepali: string;
  spouseName: string;
  spouseNameNepali: string;
  profilePhoto: string;
  profilePhotoPreviewUrl?: string;
  citizenshipNumber: string;
  citizenshipType: string;
  citizenshipIssueDate: string;
  citizenshipCalendar: "AD" | "BS";
  citizenshipBsDate: string;
  citizenshipIssueDistrict: string;
  citizenshipIssueAuthority: string;
  citizenshipFrontImage: string;
  citizenshipBackImage: string;
  citizenshipFrontFileName?: string;
  citizenshipBackFileName?: string;
  citizenshipFrontUploadedAt?: string;
  citizenshipBackUploadedAt?: string;
  nidNumber: string;
  nidIssueDate: string;
  nidStatus: string;
  nidFrontImage: string;
  nidBackImage: string;
  signatureImage: string;
  faceImage: string;
  fingerprintImage: string;
  fingerprintLeftImage?: string;
  fingerprintRightImage?: string;
  fingerprintStatus: "idle" | "checking" | "clear" | "duplicate";
  faceMatchPercent?: number;
  fingerprintMatchPercent?: number;
  isCertified: boolean;
  acceptLegal: boolean;
  onBack: () => void;
  onEditProfile: () => void;
  onSubmit: () => Promise<void> | void;
  onToggleCertified: (value: boolean) => void;
  onToggleLegal: (value: boolean) => void;
  triggerToast: (message: string, isError?: boolean) => void;
  isLoading: boolean;
  isSubmitted?: boolean;
}

// Professional Card Shell
const Card = memo(function Card({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
  headerAction,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
});

// Professional Data Item Cell
const DataCell = memo(function DataCell({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors">
      <div className="p-2 bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
          {label}
        </div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
          {value || <span className="text-slate-400 font-normal italic">Not provided</span>}
        </div>
      </div>
    </div>
  );
});

// Address Block
const AddressBlock = memo(function AddressBlock({
  type,
  lines,
  badge,
}: {
  type: "permanent" | "temporary";
  lines: string[];
  badge?: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {type === "permanent" ? (
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <Home className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
            )}
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
              {type} Address
            </span>
          </div>
          {badge && (
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="space-y-1.5 pl-1">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Family Member Item
const FamilyItem = memo(function FamilyItem({
  relation,
  name,
}: {
  relation: string;
  name: string;
}) {
  return (
    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 font-bold">
        <Users className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {relation}
        </div>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
          {name || <span className="text-slate-400 font-normal italic">Not provided</span>}
        </div>
      </div>
    </div>
  );
});

export default function FinalPreviewDashboard(props: FinalPreviewDashboardProps) {
  const {
    user,
    personal,
    permCountry,
    permProvince,
    permDistrict,
    permMunicipality,
    permWardNumber,
    permTole,
    permStreetAddress,
    permPostalCode,
    tempCountry,
    tempProvince,
    tempDistrict,
    tempMunicipality,
    tempWardNumber,
    tempTole,
    tempStreetAddress,
    tempPostalCode,
    sameAsPermanent,
    fullNameNepali,
    maritalStatus,
    educationStatus,
    bloodGroup,
    nationality,
    fatherName,
    fatherNameNepali,
    motherName,
    motherNameNepali,
    grandfatherName,
    grandfatherNameNepali,
    spouseName,
    spouseNameNepali,
    profilePhoto,
    profilePhotoPreviewUrl,
    citizenshipNumber,
    citizenshipType,
    citizenshipIssueDate,
    citizenshipCalendar,
    citizenshipBsDate,
    citizenshipIssueDistrict,
    citizenshipIssueAuthority,
    citizenshipFrontImage,
    citizenshipBackImage,
    nidNumber,
    nidIssueDate,
    nidFrontImage,
    nidBackImage,
    signatureImage,
    faceImage,
    fingerprintImage,
    fingerprintStatus,
    faceMatchPercent = 98.4,
    fingerprintMatchPercent = 96.2,
    isCertified,
    acceptLegal,
    onBack,
    onEditProfile,
    onSubmit,
    onToggleCertified,
    onToggleLegal,
    isLoading,
    isSubmitted,
  } = props;

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const fullName =
    user?.fullName ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Not provided";

  const photoDisplay =
    profilePhotoPreviewUrl || profilePhoto || faceImage || user?.faceImage || "";

  const age = useMemo(() => {
    if (!personal.dob) return null;
    const dob = new Date(personal.dob);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let ageValue = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      ageValue -= 1;
    }
    return ageValue;
  }, [personal.dob]);

  const permanentAddress = useMemo(() => {
    const parts =
      permCountry === "Nepal"
        ? [
            permProvince,
            permDistrict,
            permMunicipality,
            permWardNumber ? `Ward ${permWardNumber}` : "",
            permTole,
          ]
        : [permProvince, permMunicipality, permStreetAddress];

    const address = parts.filter(Boolean).join(", ");
    const extras = [
      permCountry && permCountry !== "Nepal" ? permCountry : null,
      permPostalCode ? `Postal Code: ${permPostalCode}` : null,
    ].filter(Boolean);

    return [address, ...extras].filter(Boolean);
  }, [
    permCountry,
    permProvince,
    permDistrict,
    permMunicipality,
    permWardNumber,
    permTole,
    permStreetAddress,
    permPostalCode,
  ]);

  const temporaryAddress = useMemo(() => {
    if (sameAsPermanent) return ["Same as permanent address"];

    const parts =
      tempCountry === "Nepal"
        ? [
            tempProvince,
            tempDistrict,
            tempMunicipality,
            tempWardNumber ? `Ward ${tempWardNumber}` : "",
            tempTole,
          ]
        : [tempProvince, tempMunicipality, tempStreetAddress];

    const address = parts.filter(Boolean).join(", ");
    const extras = [
      tempCountry && tempCountry !== "Nepal" ? tempCountry : null,
      tempPostalCode ? `Postal Code: ${tempPostalCode}` : null,
    ].filter(Boolean);

    return [address, ...extras].filter(Boolean);
  }, [
    sameAsPermanent,
    tempCountry,
    tempProvince,
    tempDistrict,
    tempMunicipality,
    tempWardNumber,
    tempTole,
    tempStreetAddress,
    tempPostalCode,
  ]);

  const completionPercent = useMemo(() => {
    const checks = [
      fullName !== "Not provided",
      personal.dob,
      personal.gender,
      citizenshipNumber,
      citizenshipFrontImage,
      citizenshipBackImage,
      nidNumber,
      photoDisplay,
      signatureImage,
      faceImage,
      props.fingerprintLeftImage && props.fingerprintRightImage,
      fullNameNepali,
      fatherName || motherName || spouseName,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [
    fullName,
    personal,
    citizenshipNumber,
    citizenshipFrontImage,
    citizenshipBackImage,
    nidNumber,
    photoDisplay,
    signatureImage,
    faceImage,
    props.fingerprintLeftImage,
    props.fingerprintRightImage,
    fullNameNepali,
    fatherName,
    motherName,
    spouseName,
  ]);

  // Clean document list WITHOUT showing raw document file names (as requested: "Remove show document name")
  const documents = useMemo(
    () => [
      {
        label: "Citizenship Document (Front)",
        fileUrl: citizenshipFrontImage,
        status: citizenshipFrontImage ? ("verified" as const) : ("pending" as const),
      },
      {
        label: "Citizenship Document (Back)",
        fileUrl: citizenshipBackImage,
        status: citizenshipBackImage ? ("verified" as const) : ("pending" as const),
      },
      {
        label: "National ID (Front)",
        fileUrl: nidFrontImage,
        status: nidFrontImage ? ("verified" as const) : ("pending" as const),
      },
      {
        label: "National ID (Back)",
        fileUrl: nidBackImage,
        status: nidBackImage ? ("verified" as const) : ("pending" as const),
      },
      {
        label: "Digital Signature",
        fileUrl: signatureImage,
        status: signatureImage ? ("verified" as const) : ("pending" as const),
      },
    ],
    [
      citizenshipFrontImage,
      citizenshipBackImage,
      nidFrontImage,
      nidBackImage,
      signatureImage,
    ],
  );

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Voter Verification Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-500/20 overflow-hidden">
          {/* Subtle Background Lighting Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              {/* Profile Photo Avatar */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 flex items-center justify-center shrink-0">
                  {photoDisplay ? (
                    <img
                      src={photoDisplay}
                      alt="Voter Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="w-16 h-16 text-slate-500" />
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-white rounded-full shadow-lg border border-slate-900"
                  title="Profile Photo Verified"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Title & Identity Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Electoral Registration Dossier
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {completionPercent}% Verified
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {fullName}
                </h1>
                {fullNameNepali && (
                  <p className="text-base text-slate-300 font-medium">
                    {fullNameNepali}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-400">
                  {user?.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Header Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={onEditProfile}
                disabled={isSubmitted}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <PenTool className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Print Preview
              </button>
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/30"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2-Column Information Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information Card */}
            <Card
              title="Personal Information"
              subtitle="Verified demographics and personal attributes"
              icon={UserCircle2}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DataCell label="Full Name (English)" value={fullName} icon={UserCircle2} />
                <DataCell label="Full Name (Nepali)" value={fullNameNepali} icon={UserCircle2} />
                <DataCell label="Gender" value={personal.gender} icon={Users} />
                <DataCell label="Date of Birth" value={personal.dob} icon={CalendarDays} />
                <DataCell label="Calculated Age" value={age ? `${age} years old` : null} icon={CalendarDays} />
                <DataCell label="Nationality" value={nationality || "Nepali"} icon={Globe} />
                <DataCell label="Marital Status" value={maritalStatus} icon={Heart} />
                <DataCell label="Educational Attainment" value={educationStatus} icon={BookOpen} />
                <DataCell label="Occupation" value={personal.occupation} icon={Briefcase} />
                <DataCell label="Blood Group" value={bloodGroup} icon={Heart} />
              </div>
            </Card>

            {/* Identity & Citizenship Documents Card */}
            <Card
              title="Identity & Citizenship Credentials"
              subtitle="Official government registration details"
              icon={IdCard}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DataCell label="Citizenship Number" value={citizenshipNumber} icon={Hash} />
                <DataCell label="Citizenship Type" value={citizenshipType} icon={CreditCard} />
                <DataCell
                  label="Issue Date"
                  value={
                    citizenshipCalendar === "BS"
                      ? citizenshipBsDate || citizenshipIssueDate
                      : citizenshipIssueDate
                  }
                  icon={CalendarDays}
                />
                <DataCell label="Issuing District" value={citizenshipIssueDistrict} icon={MapPin} />
                <DataCell label="Issuing Authority" value={citizenshipIssueAuthority} icon={Landmark} />
                <DataCell label="National ID (NID)" value={nidNumber} icon={Hash} />
                <DataCell label="NID Issue Date" value={nidIssueDate} icon={CalendarDays} />
              </div>
            </Card>

            {/* Biometric Verification Suite Card */}
            <Card
              title="Biometric Authentication Suite"
              subtitle="Facial recognition and fingerprint matching integrity"
              icon={Fingerprint}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Face Verification Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-4">
                  <div className="relative">
                    {faceImage ? (
                      <img
                        src={faceImage}
                        alt="Face Scan"
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Camera className="w-7 h-7" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Camera className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Facial Recognition
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {faceMatchPercent}% Match
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full"
                        style={{ width: `${faceMatchPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Fingerprint Verification Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-4">
                  <div className="relative">
                    {fingerprintImage ? (
                      <img
                        src={fingerprintImage}
                        alt="Fingerprint Scan"
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-md bg-white p-1"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Fingerprint className="w-7 h-7" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Fingerprint className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Fingerprint Scan
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {fingerprintMatchPercent}% Match
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full"
                        style={{ width: `${fingerprintMatchPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Address Information Card */}
            <Card
              title="Electoral Address Verification"
              subtitle="Registered permanent and temporary residency details"
              icon={MapPin}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AddressBlock
                  type="permanent"
                  lines={permanentAddress.filter(Boolean) as string[]}
                  badge={permCountry === "Nepal" ? "Nepal" : "International"}
                />
                <AddressBlock
                  type="temporary"
                  lines={temporaryAddress.filter(Boolean) as string[]}
                  badge={sameAsPermanent ? "Same as Permanent" : "Current"}
                />
              </div>
            </Card>

            {/* Family Tree Card */}
            <Card
              title="Family Relationship Record"
              subtitle="Verified lineage and relationship entries"
              icon={Users}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FamilyItem relation="Father" name={fatherName || fatherNameNepali} />
                <FamilyItem relation="Mother" name={motherName || motherNameNepali} />
                <FamilyItem relation="Grandfather" name={grandfatherName || grandfatherNameNepali} />
                <FamilyItem relation="Spouse" name={spouseName || spouseNameNepali} />
              </div>
            </Card>

            {/* Uploaded Documents Vault Card - NO RAW FILENAME TEXT SHOWN */}
            <Card
              title="Uploaded Documents Vault"
              subtitle="Verified official identity scans (Click thumbnail to inspect document)"
              icon={FileText}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, index) => {
                  const isUploaded = !!doc.fileUrl;
                  return (
                    <div
                      key={index}
                      className="group relative p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {doc.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                              isUploaded
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {isUploaded ? "Verified" : "Pending"}
                          </span>
                        </div>

                        {/* Thumbnail Container - NO FILENAME DISPLAYED */}
                        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center mb-3">
                          {isUploaded ? (
                            <>
                              <img
                                src={doc.fileUrl}
                                alt={doc.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setViewerUrl(doc.fileUrl)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Inspect
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-slate-400 text-center">
                              <FileText className="w-8 h-8 mb-1 opacity-50" />
                              <span className="text-[11px]">Not uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Direct Inspection Action Button */}
                      {isUploaded && (
                        <button
                          type="button"
                          onClick={() => setViewerUrl(doc.fileUrl)}
                          className="w-full py-2 bg-slate-200/60 dark:bg-slate-800/80 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Document
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Sidebar Action & Compliance Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Progress & Integrity Status */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Overall Progress
                    </span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {completionPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        completionPercent >= 80
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : completionPercent >= 50
                          ? "bg-gradient-to-r from-amber-500 to-amber-400"
                          : "bg-gradient-to-r from-red-500 to-red-400"
                      }`}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs font-medium">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Facial Match</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {faceMatchPercent}% Verified
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Fingerprint Match</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {fingerprintMatchPercent}% Verified
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Documents Vault</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {documents.filter((d) => d.fileUrl).length} / {documents.length} Items
                    </span>
                  </div>
                </div>

                {/* Legal Certification Checkboxes */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                    <input
                      type="checkbox"
                      checked={isCertified}
                      onChange={(e) => onToggleCertified(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      I certify that all information provided is authentic, accurate, and complete.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                    <input
                      type="checkbox"
                      checked={acceptLegal}
                      onChange={(e) => onToggleLegal(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      I understand that false declarations carry legal consequences under electoral laws.
                    </span>
                  </label>
                </div>

                {/* Submission Actions */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isLoading || !isCertified || !acceptLegal || isSubmitted}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-blue-500/25 active:scale-98"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting Registration...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Submit Voter Registration
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onEditProfile}
                    disabled={isSubmitted}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <PenTool className="w-4 h-4" />
                    Edit Profile Details
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Registration Dossier
                  </button>

                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-2xl font-semibold text-xs transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Step 5
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal - NO DOCUMENT NAME DISPLAYED */}
      <DocumentViewerModal
        open={!!viewerUrl}
        url={viewerUrl || undefined}
        onClose={() => setViewerUrl(null)}
      />
    </div>
  );
}