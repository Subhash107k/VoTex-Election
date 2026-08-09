import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  ShieldCheck,
  Lock,
  Edit3,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  FileText,
  Sun,
  Moon,
  RefreshCw,
  Upload,
  Heart,
  CreditCard,
  Camera,
  Check,
  Sparkles,
  BadgeCheck,
  UserCheck,
  Bell,
  Shield,
} from "lucide-react";
import type { ThemeMode } from "../../types/auth";
import { NEPAL_ADDRESS_DATA, COUNTRIES } from "../../data/nepalAddressData";
import ProfileAvatarUploader from "./ProfileAvatarUploader";
import ProfileSecuritySettings from "./ProfileSecuritySettings";
import ProfileNotificationSettings from "./ProfileNotificationSettings";
import ProfilePrivacySettings from "./ProfilePrivacySettings";
import UnsavedChangesModal from "../ui/UnsavedChangesModal";
import ProfileSkeleton from "./ProfileSkeleton";

interface EditProfileProps {
  token: string;
  user: any;
  onLogout: () => void;
  onUpdateComplete?: (updatedUser: any) => void;
  setCurrentPath: (path: string) => void;
  theme?: ThemeMode;
  setTheme?: (theme: ThemeMode) => void;
}

export default function EditProfile({
  token,
  user,
  onLogout,
  onUpdateComplete,
  setCurrentPath,
  theme = "dark",
  setTheme,
}: EditProfileProps) {
  const isLight = theme === "light";

  const [activeTab, setActiveTab] = useState<"personal" | "documents" | "security" | "notifications" | "privacy">("personal");
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");


  // Verified / Non-editable fields (loaded from backend DB)
  const [verifiedInfo, setVerifiedInfo] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    dob: user?.dob || "",
    gender: user?.gender || "Male",
    citizenshipNumber: user?.citizenshipNumber || "",
    nationalID: user?.nationalID || "",
    voterId: user?.voterIdNumber || "VOT-NEPAL-889102",
    verificationStatus: user?.isVerified ? "Verified" : "Pending",
  });

  // Editable Profile fields
  const [fullNameNepali, setFullNameNepali] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [educationStatus, setEducationStatus] = useState("Bachelor");
  const [occupation, setOccupation] = useState(user?.occupation || "");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [nationality, setNationality] = useState("Nepali");

  // Contact Info
  const [primaryPhone, setPrimaryPhone] = useState(user?.mobile || "");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("Parent");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Permanent Address (Read-only / Verified)
  const [permProvince, setPermProvince] = useState("Bagmati Province");
  const [permDistrict, setPermDistrict] = useState("Kathmandu");
  const [permMunicipality, setPermMunicipality] = useState("Kathmandu Metropolitan City");
  const [permWardNumber, setPermWardNumber] = useState("01");

  // Temporary Address (Editable)
  const [sameAsPermanent, setSameAsPermanent] = useState(true);
  const [tempCountry, setTempCountry] = useState("Nepal");
  const [tempProvince, setTempProvince] = useState("Bagmati Province");
  const [tempDistrict, setTempDistrict] = useState("Kathmandu");
  const [tempMunicipality, setTempMunicipality] = useState("Kathmandu Metropolitan City");
  const [tempWardNumber, setTempWardNumber] = useState("01");
  const [tempTole, setTempTole] = useState("");
  const [tempStreetAddress, setTempStreetAddress] = useState("");

  // Family details
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [spouseName, setSpouseName] = useState("");

  // Profile Photo
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || user?.profilePicture || "");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(user?.profilePhoto || user?.profilePicture || "");

  // Identity Documents Upload State
  const [citizenshipType, setCitizenshipType] = useState("By Descent");
  const [citizenshipIssueDate, setCitizenshipIssueDate] = useState("");
  const [citizenshipIssueDistrict, setCitizenshipIssueDistrict] = useState("Kathmandu");
  const [citizenshipFrontImage, setCitizenshipFrontImage] = useState("");
  const [citizenshipBackImage, setCitizenshipBackImage] = useState("");
  const [nidFrontImage, setNidFrontImage] = useState("");
  const [voterCardImage, setVoterCardImage] = useState("");
  const [signatureImage, setSignatureImage] = useState("");

  // Live Camera Photo Capture
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const startLiveCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      streamRef.current = stream;
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      }, 100);
    } catch (err: any) {
      alert("Camera access failed: " + (err.message || "Please allow camera permissions."));
      setShowCameraModal(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const captureLivePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setProfilePhoto(capturedDataUrl);
      setProfilePhotoPreview(capturedDataUrl);
    }
    stopLiveCamera();
  };

  // Fetch current latest profile from MongoDB backend on component mount
  const fetchLatestProfile = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/profile/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch current profile from database.");
      }

      const data = await res.json();
      const profile = data?.profile || {};

      // Populate verified fields
      setVerifiedInfo({
        fullName: profile.personal?.fullName || user?.fullName || "",
        email: profile.contactInfo?.email || user?.email || "",
        dob: profile.personal?.dob || user?.dob || "",
        gender: profile.personal?.gender || user?.gender || "Male",
        citizenshipNumber: profile.citizenshipNumber || user?.citizenshipNumber || "",
        nationalID: profile.nidNumber || user?.nationalID || "",
        voterId: profile.voterIdNumber || "VOT-NEPAL-889102",
        verificationStatus: user?.isVerified ? "Verified" : "Pending",
      });

      // Populate editable fields
      if (profile.fullNameNepali) setFullNameNepali(profile.fullNameNepali);
      if (profile.maritalStatus) setMaritalStatus(profile.maritalStatus);
      if (profile.educationStatus || profile.educationLevel)
        setEducationStatus(profile.educationStatus || profile.educationLevel);
      if (profile.occupation) setOccupation(profile.occupation);
      if (profile.bloodGroup) setBloodGroup(profile.bloodGroup);
      if (profile.nationality) setNationality(profile.nationality);

      if (profile.primaryPhone) setPrimaryPhone(profile.primaryPhone);
      if (profile.secondaryPhone) setSecondaryPhone(profile.secondaryPhone);
      if (profile.emergencyContact) {
        setEmergencyName(profile.emergencyContact.fullName || "");
        setEmergencyRelation(profile.emergencyContact.relationship || "Parent");
        setEmergencyPhone(profile.emergencyContact.phone || "");
      }

      if (profile.permProvince) setPermProvince(profile.permProvince);
      if (profile.permDistrict) setPermDistrict(profile.permDistrict);
      if (profile.permMunicipality) setPermMunicipality(profile.permMunicipality);
      if (profile.permWardNumber) setPermWardNumber(profile.permWardNumber);

      if (profile.sameAsPermanent !== undefined) setSameAsPermanent(profile.sameAsPermanent);
      if (profile.tempCountry) setTempCountry(profile.tempCountry);
      if (profile.tempProvince) setTempProvince(profile.tempProvince);
      if (profile.tempDistrict) setTempDistrict(profile.tempDistrict);
      if (profile.tempMunicipality) setTempMunicipality(profile.tempMunicipality);
      if (profile.tempWardNumber) setTempWardNumber(profile.tempWardNumber);
      if (profile.tempTole) setTempTole(profile.tempTole);
      if (profile.tempStreetAddress) setTempStreetAddress(profile.tempStreetAddress);

      if (profile.fatherName) setFatherName(profile.fatherName);
      if (profile.motherName) setMotherName(profile.motherName);
      if (profile.spouseName) setSpouseName(profile.spouseName);

      if (profile.profilePhoto) {
        setProfilePhoto(profile.profilePhoto);
        setProfilePhotoPreview(profile.profilePhoto);
      }

      const doc = data?.document || {};
      if (profile.citizenshipType || doc.citizenshipType) setCitizenshipType(profile.citizenshipType || doc.citizenshipType || "By Descent");
      if (profile.citizenshipIssueDate || doc.citizenshipIssueDate || doc.issueDate) setCitizenshipIssueDate(profile.citizenshipIssueDate || doc.citizenshipIssueDate || doc.issueDate || "");
      if (profile.citizenshipIssueDistrict || doc.citizenshipIssueDistrict || doc.issueDistrict) setCitizenshipIssueDistrict(profile.citizenshipIssueDistrict || doc.citizenshipIssueDistrict || doc.issueDistrict || "Kathmandu");
      if (profile.citizenshipFrontImage || doc.citizenshipFrontImage) setCitizenshipFrontImage(profile.citizenshipFrontImage || doc.citizenshipFrontImage || "");
      if (profile.citizenshipBackImage || doc.citizenshipBackImage) setCitizenshipBackImage(profile.citizenshipBackImage || doc.citizenshipBackImage || "");
      if (profile.nidFrontImage || doc.nidFrontImage) setNidFrontImage(profile.nidFrontImage || doc.nidFrontImage || "");
      if (profile.voterCardImage || doc.voterCardImage) setVoterCardImage(profile.voterCardImage || doc.voterCardImage || "");
      if (profile.signatureImage || doc.signatureImage) setSignatureImage(profile.signatureImage || doc.signatureImage || "");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load current profile");
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchLatestProfile();
  }, [fetchLatestProfile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Profile image size must be under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePhoto(base64);
        setProfilePhotoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);

    try {
      const payload = {
        fullName: verifiedInfo.fullName || user?.fullName || "Voter Identity",
        email: verifiedInfo.email || user?.email || "",
        mobile: primaryPhone || user?.mobile || "",
        phone: primaryPhone || user?.mobile || "",
        address: `${permMunicipality}, ${permDistrict}, ${permProvince}`,
        permanentAddress: `${permMunicipality}, ${permDistrict}, ${permProvince}`,
        requireStrict: false,
        fullNameNepali,
        dob: verifiedInfo.dob,
        gender: verifiedInfo.gender,
        maritalStatus,
        educationStatus,
        occupation,
        bloodGroup,
        nationality,
        citizenshipNumber: verifiedInfo.citizenshipNumber,
        nidNumber: verifiedInfo.nationalID,
        primaryPhone,
        secondaryPhone,
        emergencyContact: {
          fullName: emergencyName,
          relationship: emergencyRelation,
          phone: emergencyPhone,
        },
        permProvince,
        permDistrict,
        permMunicipality,
        permWardNumber,
        sameAsPermanent,
        tempCountry,
        tempProvince,
        tempDistrict,
        tempMunicipality,
        tempWardNumber,
        tempTole,
        tempStreetAddress,
        fatherName,
        motherName,
        spouseName,
        profilePhoto,
        citizenshipType,
        citizenshipIssueDate,
        citizenshipIssueDistrict,
        citizenshipFrontImage,
        citizenshipBackImage,
        nidFrontImage,
        voterCardImage,
        signatureImage,
      };

      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error || data.success === false) {
        let msg = data.error || data.message || "Failed to update profile database.";
        if (data.details && typeof data.details === "object") {
          const detailMsgs = Object.values(data.details).join(" ");
          if (detailMsgs) msg = `${msg}: ${detailMsgs}`;
        }
        throw new Error(msg);
      }

      setSuccessMsg("Profile updated successfully in MongoDB database!");

      // Refresh current user identity in app state if callback provided
      if (onUpdateComplete && data.user) {
        onUpdateComplete(data.user);
      }

      setTimeout(() => {
        setCurrentPath("/votexDashboard");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  // Styling theme tokens
  const bgPage = isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-100";
  const bgCard = isLight
    ? "bg-white border-slate-200 shadow-md"
    : "bg-slate-900/80 border-slate-800/80 shadow-2xl backdrop-blur-md";
  const inputBg = isLight
    ? "bg-slate-100 border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white"
    : "bg-slate-950 border-slate-800 text-white focus:border-emerald-500 focus:bg-slate-900";
  const lockedBg = isLight
    ? "bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed"
    : "bg-slate-950/60 border-slate-800/80 text-slate-400 cursor-not-allowed";

  const handleBackToDashboard = () => {
    if (isFormDirty) {
      setPendingPath("/votexDashboard");
      setShowUnsavedModal(true);
      return;
    }
    setCurrentPath("/votexDashboard");
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${bgPage}`}>
        <div className="mx-auto max-w-5xl">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-300 ${bgPage}`}>
      {/* Unsaved Changes Warning Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onStay={() => {
          setShowUnsavedModal(false);
          setPendingPath(null);
        }}
        onDiscard={() => {
          setShowUnsavedModal(false);
          if (pendingPath) setCurrentPath(pendingPath);
        }}
        onSave={() => {
          setShowUnsavedModal(false);
          const form = document.querySelector("form");
          if (form) form.requestSubmit();
        }}
        saving={saving}
      />

      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] backdrop-blur-lg shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-5 w-px bg-[var(--border-subtle)] hidden sm:block" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="font-bold text-sm sm:text-base tracking-tight text-[var(--text-primary)]">
                Voter Profile & Preferences
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {setTheme && (
              <button
                type="button"
                onClick={() => setTheme(isLight ? "dark" : "light")}
                className="p-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
                title="Toggle Dark/Light Mode"
              >
                {isLight ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-amber-400" />}
              </button>
            )}
            <button
              onClick={onLogout}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-sm overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "personal"
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Personal Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "documents"
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Verification Documents</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "security"
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Security & Sessions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "notifications"
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notification Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "privacy"
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Privacy & Data Rights</span>
          </button>
        </div>

        {/* Banner Alert Messages */}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm font-medium text-rose-500 shadow-lg animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-500 shadow-lg animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Tab 1: Personal Details */}
        {activeTab === "personal" && (
          <form
            onSubmit={handleSaveProfile}
            onChange={() => setIsFormDirty(true)}
            className="space-y-6"
          >
            {/* Avatar Management Card */}
            <ProfileAvatarUploader
              currentPhotoUrl={profilePhotoPreview}
              onPhotoChange={(photo) => {
                setProfilePhoto(photo);
                setProfilePhotoPreview(photo);
                setIsFormDirty(true);
              }}
              userName={verifiedInfo.fullName || user?.fullName}
              userRole={user?.role || "Voter"}
            />


          {/* Section 1: Citizen Identity & Verification Credentials (Editable) */}
          <div className={`rounded-3xl border p-6 ${bgCard}`}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Citizen Identity Credentials (Editable)
                </h2>
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Fully Editable
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={verifiedInfo.fullName}
                  onChange={(e) => setVerifiedInfo({ ...verifiedInfo, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className={`w-full rounded-xl px-3 py-2.5 font-semibold transition ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Date of Birth (AD)</label>
                <input
                  type="date"
                  value={verifiedInfo.dob}
                  onChange={(e) => setVerifiedInfo({ ...verifiedInfo, dob: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2.5 font-semibold transition ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Gender</label>
                <select
                  value={verifiedInfo.gender}
                  onChange={(e) => setVerifiedInfo({ ...verifiedInfo, gender: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2.5 font-semibold transition ${inputBg}`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Citizenship Number</label>
                <input
                  type="text"
                  value={verifiedInfo.citizenshipNumber}
                  onChange={(e) => setVerifiedInfo({ ...verifiedInfo, citizenshipNumber: e.target.value })}
                  placeholder="Enter citizenship number"
                  className={`w-full rounded-xl px-3 py-2.5 font-mono font-semibold transition ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">National ID (NID)</label>
                <input
                  type="text"
                  value={verifiedInfo.nationalID}
                  onChange={(e) => setVerifiedInfo({ ...verifiedInfo, nationalID: e.target.value })}
                  placeholder="Enter NID number"
                  className={`w-full rounded-xl px-3 py-2.5 font-mono font-semibold transition ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Registered Voter ID</label>
                <input
                  type="text"
                  value={verifiedInfo.voterId}
                  onChange={(e) => setVerifiedInfo({ ...verifiedInfo, voterId: e.target.value })}
                  placeholder="Enter voter ID"
                  className={`w-full rounded-xl px-3 py-2.5 font-mono font-semibold text-emerald-400 transition ${inputBg}`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Editable Personal & Demographic Information */}
          <div className={`rounded-3xl border p-6 ${bgCard}`}>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Personal & Demographic Details
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Full Name in Nepali (पुरा नाम देवनागरीमा)
                </label>
                <input
                  type="text"
                  placeholder="उदा: रामप्रसाद शर्मा"
                  value={fullNameNepali}
                  onChange={(e) => setFullNameNepali(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Marital Status</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Education Level</label>
                <select
                  value={educationStatus}
                  onChange={(e) => setEducationStatus(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                >
                  <option value="Primary">Primary Education</option>
                  <option value="Secondary">Secondary (SEE / SLC)</option>
                  <option value="Higher Secondary">Higher Secondary (+2 / PCL)</option>
                  <option value="Bachelor">Bachelor Degree</option>
                  <option value="Master">Master Degree</option>
                  <option value="PhD">Doctorate (PhD)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Civil Servant, Engineer, Teacher"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Nationality</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Editable Contact & Emergency Details */}
          <div className={`rounded-3xl border p-6 ${bgCard}`}>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Phone className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Contact & Emergency Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Primary Mobile Number (+977)</label>
                <input
                  type="text"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Secondary Contact Phone</label>
                <input
                  type="text"
                  placeholder="Optional alternate mobile"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Emergency Contact Full Name</label>
                <input
                  type="text"
                  placeholder="Name of emergency contact"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Emergency Relationship</label>
                <select
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Guardian">Guardian / Relative</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">Emergency Mobile Number</label>
                <input
                  type="text"
                  placeholder="+977 98xxxxxxxx"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Address Details (Permanent vs Temporary) */}
          <div className={`rounded-3xl border p-6 ${bgCard}`}>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Voter Residence Address
              </h2>
            </div>

            {/* Permanent Address Summary */}
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-200">Official Permanent Address</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Verified Voting District
                </span>
              </div>
              <p className="text-slate-400 font-medium">
                {permMunicipality}, Ward No. {permWardNumber}, {permDistrict}, {permProvince}, Nepal
              </p>
            </div>

            {/* Temporary Address Update */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white">Current Temporary Address</label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={sameAsPermanent}
                    onChange={(e) => setSameAsPermanent(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Same as Permanent Address</span>
                </label>
              </div>

              {!sameAsPermanent && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Country</label>
                    <select
                      value={tempCountry}
                      onChange={(e) => setTempCountry(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Province</label>
                    <select
                      value={tempProvince}
                      onChange={(e) => setTempProvince(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                    >
                      {Object.keys(NEPAL_ADDRESS_DATA).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">District</label>
                    <input
                      type="text"
                      value={tempDistrict}
                      onChange={(e) => setTempDistrict(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Municipality / Local Body</label>
                    <input
                      type="text"
                      value={tempMunicipality}
                      onChange={(e) => setTempMunicipality(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Ward Number</label>
                    <input
                      type="text"
                      value={tempWardNumber}
                      onChange={(e) => setTempWardNumber(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Tole / Locality</label>
                    <input
                      type="text"
                      placeholder="e.g. New Road"
                      value={tempTole}
                      onChange={(e) => setTempTole(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${inputBg}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>



            {/* Action Buttons */}


            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Updates…</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Verification Documents */}
        {activeTab === "documents" && (
          <form
            onSubmit={handleSaveProfile}
            onChange={() => setIsFormDirty(true)}
            className="space-y-6 animate-fade-in"
          >
            {/* Section: Citizenship Document & Scans */}
            <div className={`rounded-3xl border p-6 ${bgCard}`}>
              <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">
                    Citizenship Card Document & Scans
                  </h2>
                </div>
                <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  Official Verification
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs mb-6">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Citizenship Number</label>
                  <input
                    type="text"
                    value={verifiedInfo.citizenshipNumber}
                    onChange={(e) => setVerifiedInfo({ ...verifiedInfo, citizenshipNumber: e.target.value })}
                    placeholder="Enter citizenship number"
                    className={`w-full rounded-xl px-3 py-2.5 font-mono font-semibold transition ${inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Citizenship Type</label>
                  <select
                    value={citizenshipType}
                    onChange={(e) => setCitizenshipType(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2.5 font-semibold transition ${inputBg}`}
                  >
                    <option value="By Descent">By Descent (वंशज)</option>
                    <option value="By Birth">By Birth (जन्मको आधार)</option>
                    <option value="Naturalized">Naturalized (अङ्गीकृत)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Issue Date (BS/AD)</label>
                  <input
                    type="date"
                    value={citizenshipIssueDate}
                    onChange={(e) => setCitizenshipIssueDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2.5 font-semibold transition ${inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Issue District</label>
                  <input
                    type="text"
                    value={citizenshipIssueDistrict}
                    onChange={(e) => setCitizenshipIssueDistrict(e.target.value)}
                    placeholder="e.g. Kathmandu"
                    className={`w-full rounded-xl px-3 py-2.5 font-semibold transition ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Citizenship Front Page</span>
                    {citizenshipFrontImage ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Missing
                      </span>
                    )}
                  </div>
                  {citizenshipFrontImage ? (
                    <div className="relative aspect-[16/10] w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-950 group">
                      <img src={citizenshipFrontImage} alt="Citizenship Front" className="h-full w-full object-contain" />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer">
                          <span>Replace File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setCitizenshipFrontImage(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCitizenshipFrontImage("")}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-blue-500 bg-slate-950/60 cursor-pointer transition text-center group">
                      <Upload className="h-6 w-6 text-slate-500 group-hover:text-blue-400 transition mb-1" />
                      <span className="text-xs font-semibold text-slate-300">Upload Citizenship Front</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setCitizenshipFrontImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Citizenship Back Page</span>
                    {citizenshipBackImage ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Missing
                      </span>
                    )}
                  </div>
                  {citizenshipBackImage ? (
                    <div className="relative aspect-[16/10] w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-950 group">
                      <img src={citizenshipBackImage} alt="Citizenship Back" className="h-full w-full object-contain" />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer">
                          <span>Replace File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setCitizenshipBackImage(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCitizenshipBackImage("")}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-blue-500 bg-slate-950/60 cursor-pointer transition text-center group">
                      <Upload className="h-6 w-6 text-slate-500 group-hover:text-blue-400 transition mb-1" />
                      <span className="text-xs font-semibold text-slate-300">Upload Citizenship Back</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setCitizenshipBackImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Section: National ID & Voter Card */}
            <div className={`rounded-3xl border p-6 ${bgCard}`}>
              <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">
                    National ID (NID) & Voter Registration Card
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NID Card */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">National ID (NID) Number</label>
                    <input
                      type="text"
                      value={verifiedInfo.nationalID}
                      onChange={(e) => setVerifiedInfo({ ...verifiedInfo, nationalID: e.target.value })}
                      placeholder="Enter NID Number"
                      className={`w-full rounded-xl px-3 py-2.5 font-mono text-xs font-semibold transition ${inputBg}`}
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200">NID Document Scan</span>
                      {nidFrontImage ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Optional</span>
                      )}
                    </div>
                    {nidFrontImage ? (
                      <div className="relative aspect-[16/10] w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-950 group">
                        <img src={nidFrontImage} alt="NID Scan" className="h-full w-full object-contain" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer">
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setNidFrontImage(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setNidFrontImage("")}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-slate-800 hover:border-blue-500 bg-slate-950/60 cursor-pointer transition text-center group">
                        <Upload className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition mb-1" />
                        <span className="text-xs font-semibold text-slate-300">Upload NID Card</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setNidFrontImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Voter Card */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Voter ID Number</label>
                    <input
                      type="text"
                      value={verifiedInfo.voterId}
                      onChange={(e) => setVerifiedInfo({ ...verifiedInfo, voterId: e.target.value })}
                      placeholder="Enter Voter ID Number"
                      className={`w-full rounded-xl px-3 py-2.5 font-mono text-xs font-semibold text-emerald-400 transition ${inputBg}`}
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200">Voter Card Scan</span>
                      {voterCardImage ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Optional</span>
                      )}
                    </div>
                    {voterCardImage ? (
                      <div className="relative aspect-[16/10] w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-950 group">
                        <img src={voterCardImage} alt="Voter Card Scan" className="h-full w-full object-contain" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer">
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setVoterCardImage(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setVoterCardImage("")}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-slate-800 hover:border-blue-500 bg-slate-950/60 cursor-pointer transition text-center group">
                        <Upload className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition mb-1" />
                        <span className="text-xs font-semibold text-slate-300">Upload Voter Card</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setVoterCardImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Official Digital Signature */}
            <div className={`rounded-3xl border p-6 ${bgCard}`}>
              <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-purple-400" />
                  <h2 className="text-base font-bold text-white">
                    Official Specimen Signature
                  </h2>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">Signature Scan Image</span>
                  {signatureImage ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" /> Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">Missing Signature</span>
                  )}
                </div>
                {signatureImage ? (
                  <div className="relative h-32 w-full rounded-xl border border-slate-800 overflow-hidden bg-white p-2 group flex items-center justify-center">
                    <img src={signatureImage} alt="Signature" className="h-full object-contain" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer">
                        <span>Replace Signature</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setSignatureImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setSignatureImage("")}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-blue-500 bg-slate-950/60 cursor-pointer transition text-center group">
                    <Upload className="h-6 w-6 text-slate-500 group-hover:text-blue-400 transition mb-1" />
                    <span className="text-xs font-semibold text-slate-300">Upload Specimen Signature Scan</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Clear image on white background (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setSignatureImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Updates…</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Document Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}


        {/* Tab 2: Security & Credentials */}
        {activeTab === "security" && (
          <ProfileSecuritySettings token={token} user={user} />
        )}

        {/* Tab 3: Notification Alerts */}
        {activeTab === "notifications" && (
          <ProfileNotificationSettings token={token} user={user} />
        )}

        {/* Tab 4: Privacy & Data Rights */}
        {activeTab === "privacy" && (
          <ProfilePrivacySettings token={token} user={user} profile={verifiedInfo} />
        )}
      </main>


      {/* Live Camera Photo Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Camera className="h-5 w-5 text-emerald-400" /> Live Face Photo Capture
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Center your face inside the frame and click capture photo.
                </p>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-2 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full rounded-2xl border-2 border-emerald-500/50 overflow-hidden bg-slate-900 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover transform -scale-x-100"
              />
              {/* Target Face Oval Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-56 w-44 rounded-[50%] border-2 border-dashed border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.3)]" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="py-2.5 px-5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureLivePhoto}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Capture Face Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
