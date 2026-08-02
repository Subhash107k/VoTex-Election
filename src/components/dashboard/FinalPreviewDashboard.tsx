import React, { memo, useMemo } from "react";
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
  Monitor,
  Globe,
  Hash,
  CreditCard,
  Home,
  Building2,
} from "lucide-react";
import DocumentPreview from "../common/DocumentPreview";

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
  profilePhotoPreviewUrl: string;
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
  fingerprintLeftImage: string;
  fingerprintRightImage: string;
  fingerprintStatus: "idle" | "checking" | "clear" | "duplicate";
  faceMatchPercent?: number;
  fingerprintMatchPercent?: number;
  isCertified: boolean;
  acceptLegal: boolean;
  onBack: () => void;
  onEditProfile: () => void;
  onSaveDraft: () => Promise<any> | void;
  onSubmit: () => Promise<void> | void;
  onToggleCertified: (value: boolean) => void;
  onToggleLegal: (value: boolean) => void;
  triggerToast: (message: string, isError?: boolean) => void;
  isLoading: boolean;
  isSubmitted?: boolean;
}

// Professional Card Component
const Card = memo(function Card({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
});

// Professional Info Row
const InfoRow = memo(function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <div className="group p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 pl-6">
        {value || <span className="text-slate-400 italic">Not provided</span>}
      </div>
    </div>
  );
});

// Status Badge
const StatusBadge = memo(function StatusBadge({
  status,
}: {
  status: "verified" | "pending" | "warning" | "error";
}) {
  const config = {
    verified: {
      icon: CheckCircle2,
      className: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      label: "Verified"
    },
    pending: {
      icon: Clock3,
      className: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      label: "Pending"
    },
    warning: {
      icon: AlertTriangle,
      className: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      label: "Review Needed"
    },
    error: {
      icon: AlertTriangle,
      className: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      label: "Failed"
    }
  };

  const { icon: Icon, className, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
});

// Biometric Card
const BiometricCard = memo(function BiometricCard({
  type,
  image,
  matchPercent,
  status,
}: {
  type: "face" | "fingerprint";
  image?: string;
  matchPercent: number;
  status: string;
}) {
  const Icon = type === "face" ? Camera : Fingerprint;
  
  return (
    <div className="p-4 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
      <div className="flex items-start gap-4">
        <div className="relative">
          {image ? (
            <img
              src={image}
              alt={`${type} verification`}
              className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Icon className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
              {type} Verification
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
            {matchPercent}%
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: `${matchPercent}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">match</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Address Card
const AddressCard = memo(function AddressCard({
  type,
  lines,
  badge,
}: {
  type: "permanent" | "temporary";
  lines: string[];
  badge?: string;
}) {
  return (
    <div className="p-4 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {type === "permanent" ? (
            <Home className="w-4 h-4 text-blue-500" />
          ) : (
            <Building2 className="w-4 h-4 text-purple-500" />
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
            {type} Address
          </span>
        </div>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
        {lines.map((line, index) => (
          <div key={index} className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Family Member Card
const FamilyMemberCard = memo(function FamilyMemberCard({
  relation,
  name,
}: {
  relation: string;
  name: string;
}) {
  return (
    <div className="p-3 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
            {relation}
          </div>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {name || "Not provided"}
          </div>
        </div>
      </div>
    </div>
  );
});

// Sidebar Component
const Sidebar = memo(function Sidebar({
  completionPercent,
  isCertified,
  acceptLegal,
  isLoading,
  isSubmitted,
  onBack,
  onEditProfile,
  onSaveDraft,
  onSubmit,
  onToggleCertified,
  onToggleLegal,
  faceMatchPercent,
  fingerprintMatchPercent,
  documentsCount,
}: {
  completionPercent: number;
  isCertified: boolean;
  acceptLegal: boolean;
  isLoading: boolean;
  isSubmitted?: boolean;
  onBack: () => void;
  onEditProfile: () => void;
  onSaveDraft: () => Promise<any> | void;
  onSubmit: () => Promise<void> | void;
  onToggleCertified: (value: boolean) => void;
  onToggleLegal: (value: boolean) => void;
  faceMatchPercent: number;
  fingerprintMatchPercent: number;
  documentsCount: number;
}) {
  return (
    <div className="lg:sticky lg:top-4 space-y-4">
      {/* Progress Card */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Registration Progress
        </h4>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">Completion</span>
            <span className="font-bold text-slate-800 dark:text-white">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
            <span className="text-sm text-slate-600 dark:text-slate-400">Face Match</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{faceMatchPercent}%</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
            <span className="text-sm text-slate-600 dark:text-slate-400">Fingerprint</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fingerprintMatchPercent}%</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
            <span className="text-sm text-slate-600 dark:text-slate-400">Documents</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white">{documentsCount} Uploaded</span>
          </div>
        </div>

        {/* Certifications */}
        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={isCertified}
              onChange={(e) => onToggleCertified(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              I certify that all information provided is accurate and complete to the best of my knowledge.
            </span>
          </label>
          
          <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={acceptLegal}
              onChange={(e) => onToggleLegal(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              I understand that providing false information may result in legal consequences and disqualification.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !isCertified || !acceptLegal || isSubmitted}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Submit Registration
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onEditProfile}
            disabled={isSubmitted}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
          >
            <PenTool className="w-4 h-4" />
            Edit Profile
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSubmitted}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Preview
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-400 rounded-xl font-medium text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Registration
          </button>
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
    citizenshipNumber,
    citizenshipType,
    citizenshipIssueDate,
    citizenshipCalendar,
    citizenshipBsDate,
    citizenshipIssueDistrict,
    citizenshipIssueAuthority,
    citizenshipFrontImage,
    citizenshipBackImage,
    citizenshipFrontFileName,
    citizenshipBackFileName,
    citizenshipFrontUploadedAt,
    citizenshipBackUploadedAt,
    nidNumber,
    nidIssueDate,
    nidStatus,
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
    onSaveDraft,
    onSubmit,
    onToggleCertified,
    onToggleLegal,
    isLoading,
  } = props;

  const fullName = user?.fullName || user?.name || 
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Not provided";

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
    const parts = permCountry === "Nepal"
      ? [permProvince, permDistrict, permMunicipality, `Ward ${permWardNumber}`, permTole]
      : [permProvince, permMunicipality, permStreetAddress];
    
    const address = parts.filter(Boolean).join(", ");
    const extras = [
      permCountry && permCountry !== "Nepal" ? permCountry : null,
      permPostalCode ? `Postal Code: ${permPostalCode}` : null,
    ].filter(Boolean);

    return [address, ...extras].filter(Boolean);
  }, [permCountry, permProvince, permDistrict, permMunicipality, permWardNumber, permTole, permStreetAddress, permPostalCode]);

  const temporaryAddress = useMemo(() => {
    if (sameAsPermanent) return ["Same as permanent address"];
    
    const parts = tempCountry === "Nepal"
      ? [tempProvince, tempDistrict, tempMunicipality, `Ward ${tempWardNumber}`, tempTole]
      : [tempProvince, tempMunicipality, tempStreetAddress];
    
    const address = parts.filter(Boolean).join(", ");
    const extras = [
      tempCountry && tempCountry !== "Nepal" ? tempCountry : null,
      tempPostalCode ? `Postal Code: ${tempPostalCode}` : null,
    ].filter(Boolean);

    return [address, ...extras].filter(Boolean);
  }, [sameAsPermanent, tempCountry, tempProvince, tempDistrict, tempMunicipality, tempWardNumber, tempTole, tempStreetAddress, tempPostalCode]);

  const completionPercent = useMemo(() => {
    const checks = [
      fullName !== "Not provided",
      personal.dob,
      personal.gender,
      citizenshipNumber,
      citizenshipFrontImage,
      citizenshipBackImage,
      nidNumber,
      props.profilePhoto,
      signatureImage,
      faceImage,
      props.fingerprintLeftImage && props.fingerprintRightImage,
      fullNameNepali,
      fatherName || motherName || spouseName,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [fullName, personal, citizenshipNumber, citizenshipFrontImage, citizenshipBackImage, nidNumber, props.profilePhoto, signatureImage, faceImage, props.fingerprintLeftImage, props.fingerprintRightImage, fullNameNepali, fatherName, motherName, spouseName]);

  const documents = useMemo(() => [
    {
      label: "Citizenship Front",
      fileUrl: citizenshipFrontImage,
      fileName: citizenshipFrontFileName || "Citizenship Front",
      uploadedAt: citizenshipFrontUploadedAt,
      status: citizenshipFrontImage ? "verified" as const : "pending" as const,
    },
    {
      label: "Citizenship Back",
      fileUrl: citizenshipBackImage,
      fileName: citizenshipBackFileName || "Citizenship Back",
      uploadedAt: citizenshipBackUploadedAt,
      status: citizenshipBackImage ? "verified" as const : "pending" as const,
    },
    {
      label: "National ID Front",
      fileUrl: nidFrontImage,
      fileName: "National ID Front",
      uploadedAt: nidFrontImage ? "Uploaded" : undefined,
      status: nidFrontImage ? "verified" as const : "pending" as const,
    },
    {
      label: "National ID Back",
      fileUrl: nidBackImage,
      fileName: "National ID Back",
      uploadedAt: nidBackImage ? "Uploaded" : undefined,
      status: nidBackImage ? "verified" as const : "pending" as const,
    },
    {
      label: "Signature",
      fileUrl: signatureImage,
      fileName: "Digital Signature",
      uploadedAt: signatureImage ? "Captured" : undefined,
      status: signatureImage ? "verified" as const : "pending" as const,
    },
  ], [citizenshipFrontImage, citizenshipBackImage, nidFrontImage, nidBackImage, signatureImage, citizenshipFrontFileName, citizenshipBackFileName, citizenshipFrontUploadedAt, citizenshipBackUploadedAt]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                Registration Preview
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Review your voter registration details before submission
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card title="Personal Information" icon={UserCircle2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <InfoRow label="Full Name" value={fullName} icon={UserCircle2} />
                <InfoRow label="Name (Nepali)" value={fullNameNepali} icon={UserCircle2} />
                <InfoRow label="Gender" value={personal.gender} icon={Users} />
                <InfoRow label="Date of Birth" value={personal.dob} icon={CalendarDays} />
                <InfoRow label="Age" value={age ? `${age} years` : null} icon={CalendarDays} />
                <InfoRow label="Nationality" value={nationality || "Nepali"} icon={Globe} />
                <InfoRow label="Marital Status" value={maritalStatus} icon={Heart} />
                <InfoRow label="Education" value={educationStatus} icon={BookOpen} />
                <InfoRow label="Occupation" value={personal.occupation} icon={Briefcase} />
                <InfoRow label="Blood Group" value={bloodGroup} icon={Heart} />
                <InfoRow label="Email" value={user?.email} icon={Mail} />
                <InfoRow label="Phone" value={user?.phone} icon={Phone} />
              </div>
            </Card>

            {/* Identity Documents */}
            <Card title="Identity & Citizenship" icon={IdCard}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <InfoRow label="Citizenship Number" value={citizenshipNumber} icon={Hash} />
                <InfoRow label="Citizenship Type" value={citizenshipType} icon={CreditCard} />
                <InfoRow 
                  label="Issue Date" 
                  value={citizenshipCalendar === "BS" ? citizenshipBsDate || citizenshipIssueDate : citizenshipIssueDate} 
                  icon={CalendarDays} 
                />
                <InfoRow label="Issue District" value={citizenshipIssueDistrict} icon={MapPin} />
                <InfoRow label="Issuing Authority" value={citizenshipIssueAuthority} icon={Landmark} />
                <InfoRow label="National ID Number" value={nidNumber} icon={Hash} />
                <InfoRow label="NID Issue Date" value={nidIssueDate} icon={CalendarDays} />
              </div>
            </Card>

            {/* Biometric Verification */}
            <Card title="Biometric Verification" icon={Fingerprint}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BiometricCard
                  type="face"
                  image={faceImage}
                  matchPercent={faceMatchPercent}
                  status="verified"
                />
                <BiometricCard
                  type="fingerprint"
                  image={fingerprintImage}
                  matchPercent={fingerprintMatchPercent}
                  status={fingerprintStatus}
                />
              </div>
            </Card>

            {/* Address Information */}
            <Card title="Address Information" icon={MapPin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AddressCard
                  type="permanent"
                  lines={permanentAddress.filter(Boolean) as string[]}
                  badge={permCountry === "Nepal" ? "Nepal" : "International"}
                />
                <AddressCard
                  type="temporary"
                  lines={temporaryAddress.filter(Boolean) as string[]}
                  badge={sameAsPermanent ? "Same as Permanent" : "Current"}
                />
              </div>
            </Card>

            {/* Family Information */}
            <Card title="Family Information" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FamilyMemberCard relation="Father" name={fatherName || fatherNameNepali} />
                <FamilyMemberCard relation="Mother" name={motherName || motherNameNepali} />
                <FamilyMemberCard relation="Grandfather" name={grandfatherName || grandfatherNameNepali} />
                <FamilyMemberCard relation="Spouse" name={spouseName || spouseNameNepali} />
              </div>
            </Card>

            {/* Documents */}
            <Card title="Uploaded Documents" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, index) => (
                  <DocumentPreview
                    key={`${doc.label}-${index}`}
                    label={doc.label}
                    fileUrl={doc.fileUrl}
                    fileName={doc.fileName}
                    uploadedAt={doc.uploadedAt}
                    status={doc.status}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar
              completionPercent={completionPercent}
              isCertified={isCertified}
              acceptLegal={acceptLegal}
              isLoading={isLoading}
              isSubmitted={props.isSubmitted}
              onBack={onBack}
              onEditProfile={onEditProfile}
              onSaveDraft={onSaveDraft}
              onSubmit={onSubmit}
              onToggleCertified={onToggleCertified}
              onToggleLegal={onToggleLegal}
              faceMatchPercent={faceMatchPercent}
              fingerprintMatchPercent={fingerprintMatchPercent}
              documentsCount={documents.filter(d => d.fileUrl).length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}