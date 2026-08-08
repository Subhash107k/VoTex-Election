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
} from "lucide-react";
import type { ThemeMode } from "../../types/auth";
import { NEPAL_ADDRESS_DATA, COUNTRIES } from "../../data/nepalAddressData";

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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgPage}`}>
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-slate-800 bg-slate-900/60 text-center shadow-xl">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold tracking-wide">
            Fetching latest database profile dossier...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-300 ${bgPage}`}>
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-900/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPath("/votexDashboard")}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-5 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                Edit Voter Profile
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {setTheme && (
              <button
                type="button"
                onClick={() => setTheme(isLight ? "dark" : "light")}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white transition cursor-pointer"
                title="Toggle Dark/Light Mode"
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
              </button>
            )}
            <button
              onClick={onLogout}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {/* Banner Alert Messages */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm font-medium text-rose-400 shadow-lg animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 shadow-lg animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Header Card */}
          <div className={`rounded-3xl border p-6 ${bgCard}`}>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Photo Avatar */}
              <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
                <div className="relative group">
                  <div className="h-28 w-28 rounded-2xl border-2 border-emerald-500/60 overflow-hidden bg-slate-950 flex items-center justify-center shadow-xl">
                    {profilePhotoPreview ? (
                      <img
                        src={profilePhotoPreview}
                        alt="Profile Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-slate-500" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition cursor-pointer"
                    title="Capture photo using live webcam"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Live Camera</span>
                  </button>

                  <label
                    htmlFor="edit-profile-photo"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                    title="Upload image file from device"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      id="edit-profile-photo"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    {verifiedInfo.fullName || "Voter Identity"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Government Verified
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {verifiedInfo.email} • Citizen ID: {verifiedInfo.citizenshipNumber || "CIT-VERIFIED"}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  🔒 National Electoral Database Synchronized
                </p>
              </div>
            </div>
          </div>

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
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentPath("/votexDashboard")}
              className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving Updates to MongoDB...</span>
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
