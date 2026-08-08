import React, { useState, useRef, useEffect, Suspense } from "react";
import {
  User,
  Calendar,
  MapPin,
  Briefcase,
  Camera,
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Heart,
  CreditCard,
  Users,
  BadgePlus,
  Lock,
  X,
  Sun,
  Moon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
const BiometricScanner = React.lazy(() => import("./BiometricScanner"));
import SearchableSelect from "./SearchableSelect";
import Stepper from "../ui/Stepper";
import {
  CitizenshipUploadPreview,
  SignaturePad,
} from "../documents/CitizenshipUploadPreview";
import FingerprintCaptureCard from "./FingerprintCaptureCard";
import FinalPreviewDashboard from "./FinalPreviewDashboard";
import type { ThemeMode } from "../../types/auth";
import { COUNTRIES, NEPAL_ADDRESS_DATA } from "../../data/nepalAddressData";
import { buildApiUrl } from "../../services/apiClient";
import { checkAvailability } from "../../services/authService";
import NepaliDate from "nepali-date-converter";

interface CompleteProfileProps {
  token: string;
  user: any;
  onLogout: () => void;
  onComplete: (updatedUser: any) => void;
  setCurrentPath?: (path: string) => void;
  theme?: ThemeMode;
  setTheme?: (theme: ThemeMode) => void;
}

export default function CompleteProfile({
  token,
  user,
  onLogout,
  onComplete,
  setCurrentPath,
  theme,
  setTheme,
}: CompleteProfileProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [completedUser, setCompletedUser] = useState<any | null>(null);
  const [savedProfile, setSavedProfile] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showSavedBanner, setShowSavedBanner] = useState(false);

  useEffect(() => {
    if (savedProfile) {
      setShowSavedBanner(true);
      const timer = setTimeout(() => {
        setShowSavedBanner(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [savedProfile]);

  const profileSyncChannelId = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `profile-sync-${Date.now()}`,
  );
  const profileFetchInFlightRef = useRef<Promise<void> | null>(null);

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4500);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4500);
    }
  };

  const buildProfileSnapshot = () => ({
    personal,
    permCountry,
    permProvince,
    permDistrict,
    permMunicipality,
    permWardNumber,
    permTole,
    permStreetAddress,
    permPostalCode,
    permCountryOther,
    sameAsPermanent,
    tempCountry,
    tempProvince,
    tempDistrict,
    tempMunicipality,
    tempWardNumber,
    tempTole,
    tempStreetAddress,
    tempPostalCode,
    tempCountryOther,
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
    spouseFatherName,
    spouseFatherNameNepali,
    spouseMotherName,
    spouseMotherNameNepali,
    profilePhoto,
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
    nidStatus,
    nidFrontImage,
    nidBackImage,
    signatureImage,
    fingerprintImage,
    fingerprintLeftImage,
    fingerprintRightImage,
    faceImage,
    faceTemplate,
    currentStep: step,
  });

  const syncProfileFromServer = async () => {
    if (!token) return;
    if (profileFetchInFlightRef.current) {
      return profileFetchInFlightRef.current;
    }

    const request = (async () => {
      try {
        const response = await fetch("/api/profile/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const profile = data?.profile;
        if (profile) {
          applyProfileSnapshot(profile);
          setSavedProfile(profile);
        }
      } catch {
        // Proceed with the form without preloading saved data.
      }
    })();

    profileFetchInFlightRef.current = request;
    try {
      return await request;
    } finally {
      if (profileFetchInFlightRef.current === request) {
        profileFetchInFlightRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (user?.isProfileComplete) {
      if (setCurrentPath) setCurrentPath("/votexDashboard");
      onComplete({ ...(user || {}), isProfileComplete: true });
      return;
    }
    void syncProfileFromServer();
  }, [token, user?.isProfileComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const channel = new BroadcastChannel("votex_session_sync");
      const handleMessage = (event: MessageEvent) => {
        if (
          event?.data?.type === "PROFILE_REFRESH" &&
          event?.data?.sourceId !== profileSyncChannelId.current
        ) {
          void syncProfileFromServer();
        }
      };
      channel.addEventListener("message", handleMessage);

      const handleStorage = (event: StorageEvent) => {
        if (event.key === "votex_profile_refresh") {
          void syncProfileFromServer();
        }
      };
      window.addEventListener("storage", handleStorage);

      return () => {
        channel.removeEventListener("message", handleMessage);
        window.removeEventListener("storage", handleStorage);
        channel.close();
      };
    } catch {
      return undefined;
    }
  }, [token]);

  const applyProfileSnapshot = (snapshot: any) => {
    const profile = snapshot || {};
    if (profile.personal) setPersonal(profile.personal);
    if (profile.permCountry) setPermCountry(profile.permCountry);
    if (profile.permProvince) setPermProvince(profile.permProvince);
    if (profile.permDistrict) setPermDistrict(profile.permDistrict);
    if (profile.permMunicipality) setPermMunicipality(profile.permMunicipality);
    if (profile.permWardNumber) setPermWardNumber(profile.permWardNumber);
    if (profile.permTole) setPermTole(profile.permTole);
    if (profile.permStreetAddress)
      setPermStreetAddress(profile.permStreetAddress);
    if (profile.permPostalCode) setPermPostalCode(profile.permPostalCode);
    if (profile.permCountryOther) setPermCountryOther(profile.permCountryOther);
    if (profile.sameAsPermanent !== undefined)
      setSameAsPermanent(profile.sameAsPermanent);
    if (profile.tempCountry) setTempCountry(profile.tempCountry);
    if (profile.tempProvince) setTempProvince(profile.tempProvince);
    if (profile.tempDistrict) setTempDistrict(profile.tempDistrict);
    if (profile.tempMunicipality) setTempMunicipality(profile.tempMunicipality);
    if (profile.tempWardNumber) setTempWardNumber(profile.tempWardNumber);
    if (profile.tempTole) setTempTole(profile.tempTole);
    if (profile.tempStreetAddress)
      setTempStreetAddress(profile.tempStreetAddress);
    if (profile.tempPostalCode) setTempPostalCode(profile.tempPostalCode);
    if (profile.tempCountryOther) setTempCountryOther(profile.tempCountryOther);
    if (profile.fullNameNepali) setFullNameNepali(profile.fullNameNepali);
    if (profile.maritalStatus) setMaritalStatus(profile.maritalStatus);
    if (profile.educationStatus) setEducationStatus(profile.educationStatus);
    if (profile.bloodGroup) setBloodGroup(profile.bloodGroup);
    if (profile.fatherName) setFatherName(profile.fatherName);
    if (profile.fatherNameNepali) setFatherNameNepali(profile.fatherNameNepali);
    if (profile.motherName) setMotherName(profile.motherName);
    if (profile.motherNameNepali) setMotherNameNepali(profile.motherNameNepali);
    if (profile.grandfatherName) setGrandfatherName(profile.grandfatherName);
    if (profile.grandfatherNameNepali)
      setGrandfatherNameNepali(profile.grandfatherNameNepali);
    if (profile.spouseName) setSpouseName(profile.spouseName);
    if (profile.spouseNameNepali) setSpouseNameNepali(profile.spouseNameNepali);
    if (profile.spouseFatherName) setSpouseFatherName(profile.spouseFatherName);
    if (profile.spouseFatherNameNepali)
      setSpouseFatherNameNepali(profile.spouseFatherNameNepali);
    if (profile.spouseMotherName) setSpouseMotherName(profile.spouseMotherName);
    if (profile.spouseMotherNameNepali)
      setSpouseMotherNameNepali(profile.spouseMotherNameNepali);
    if (profile.profilePhoto) {
      setProfilePhoto(profile.profilePhoto);
      setProfilePhotoPreviewUrl(profile.profilePhoto);
    }
    if (profile.citizenshipNumber)
      setCitizenshipNumber(profile.citizenshipNumber);
    if (profile.citizenshipType) setCitizenshipType(profile.citizenshipType);
    if (profile.citizenshipIssueDate)
      setCitizenshipIssueDate(profile.citizenshipIssueDate);
    if (profile.citizenshipCalendar)
      setCitizenshipCalendar(profile.citizenshipCalendar);
    if (profile.citizenshipBsDate)
      setCitizenshipBsDate(profile.citizenshipBsDate);
    if (profile.citizenshipIssueDistrict)
      setCitizenshipIssueDistrict(profile.citizenshipIssueDistrict);
    if (profile.citizenshipIssueAuthority)
      setCitizenshipIssueAuthority(profile.citizenshipIssueAuthority);
    if (profile.citizenshipFrontImage)
      setCitizenshipFrontImage(profile.citizenshipFrontImage);
    if (profile.citizenshipBackImage)
      setCitizenshipBackImage(profile.citizenshipBackImage);
    if (profile.nidNumber) setNidNumber(profile.nidNumber);
    if (profile.nidIssueDate) setNidIssueDate(profile.nidIssueDate);
    if (profile.nidStatus) setNidStatus(profile.nidStatus);
    if (profile.nidFrontImage) setNidFrontImage(profile.nidFrontImage);
    if (profile.nidBackImage) setNidBackImage(profile.nidBackImage);
    if (profile.signatureImage) setSignatureImage(profile.signatureImage);
    if (profile.fingerprintImage) setFingerprintImage(profile.fingerprintImage);
    if (profile.fingerprintLeftImage)
      setFingerprintLeftImage(profile.fingerprintLeftImage);
    if (profile.fingerprintRightImage)
      setFingerprintRightImage(profile.fingerprintRightImage);
    if (profile.faceImage) setFaceImage(profile.faceImage);
    if (profile.faceTemplate) setFaceTemplate(profile.faceTemplate);
    if (typeof profile.currentStep === "number") setStep(profile.currentStep);
  };

  // ----------------------------------------------------
  // STEP 1 FIELDS: PERSONAL INFORMATION & EXTENDED ADDRESS SEPARATIONS
  // ----------------------------------------------------
  const [personal, setPersonal] = useState({
    dob: "",
    gender: "Male",
    permanentAddress: "",
    temporaryAddress: "",
    province: "",
    district: "",
    municipality: "",
    wardNumber: "",
    postalCode: "",
    occupation: "",
  });

  // Permanent Address Sub-Coordinates
  const [permCountry, setPermCountry] = useState("Nepal");
  const [permProvince, setPermProvince] = useState("");
  const [permDistrict, setPermDistrict] = useState("");
  const [permMunicipality, setPermMunicipality] = useState("");
  const [permWardNumber, setPermWardNumber] = useState("");
  const [permTole, setPermTole] = useState("");
  const [permStreetAddress, setPermStreetAddress] = useState("");
  const [permPostalCode, setPermPostalCode] = useState("");
  const [permCountryOther, setPermCountryOther] = useState("");

  // Temporary Address Sub-Coordinates
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [tempCountry, setTempCountry] = useState("Nepal");
  const [tempProvince, setTempProvince] = useState("");
  const [tempDistrict, setTempDistrict] = useState("");
  const [tempMunicipality, setTempMunicipality] = useState("");
  const [tempWardNumber, setTempWardNumber] = useState("");
  const [tempTole, setTempTole] = useState("");
  const [tempStreetAddress, setTempStreetAddress] = useState("");
  const [tempPostalCode, setTempPostalCode] = useState("");
  const [tempCountryOther, setTempCountryOther] = useState("");

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [maxProfileDob, setMaxProfileDob] = useState<string>("");

  const calculateAge = (dobString: string) => {
    const dobDate = new Date(dobString);
    if (Number.isNaN(dobDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dobDate.getDate())
    ) {
      age -= 1;
    }
    return age;
  };

  useEffect(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    setMaxProfileDob(date.toISOString().slice(0, 10));
  }, []);

  const isDobLocked = Boolean(user?.dob);
  const isOccupationLocked = Boolean(user?.occupation);
  const isGenderLocked = Boolean(user?.gender);

  useEffect(() => {
    if (user) {
      setPersonal((prev) => ({
        ...prev,
        dob: user.dob || prev.dob,
        gender: user.gender || prev.gender,
        occupation: user.occupation || prev.occupation,
      }));
    }
  }, [user]);

  // Reset temporary address when SameAsPermanent goes from checked to unchecked
  const prevSameAsPermanent = useRef(sameAsPermanent);
  useEffect(() => {
    if (prevSameAsPermanent.current && !sameAsPermanent) {
      // User unchecked sameAsPermanent: reset temp address fields to blank allowing fresh input
      setTempCountry("Nepal");
      setTempProvince("");
      setTempDistrict("");
      setTempMunicipality("");
      setTempWardNumber("");
      setTempTole("");
      setTempStreetAddress("");
      setTempPostalCode("");
      setTempCountryOther("");
    }
    prevSameAsPermanent.current = sameAsPermanent;
  }, [sameAsPermanent]);

  // Sync temporary address fields with permanent fields when sameAsPermanent is enabled
  useEffect(() => {
    if (sameAsPermanent) {
      setTempCountry(permCountry);
      setTempProvince(permProvince);
      setTempDistrict(permDistrict);
      setTempMunicipality(permMunicipality);
      setTempWardNumber(permWardNumber);
      setTempTole(permTole);
      setTempStreetAddress(permStreetAddress);
      setTempPostalCode(permPostalCode);
      setTempCountryOther(permCountryOther);
    }
  }, [
    sameAsPermanent,
    permCountry,
    permProvince,
    permDistrict,
    permMunicipality,
    permWardNumber,
    permTole,
    permStreetAddress,
    permPostalCode,
    permCountryOther,
  ]);

  // Keep top-level backward compatible personal properties and address strings synchronized
  useEffect(() => {
    const finalPermCountry =
      permCountry === "Other Country" || permCountry === "Outside Nepal"
        ? permCountryOther || permCountry
        : permCountry;
    const finalTempCountry =
      tempCountry === "Other Country" || tempCountry === "Outside Nepal"
        ? tempCountryOther || tempCountry
        : tempCountry;

    let permStr = "";
    if (permCountry === "Nepal") {
      const parts = [
        permProvince ? `${permProvince} Province` : "",
        permDistrict ? `${permDistrict} District` : "",
        permMunicipality ? `${permMunicipality} Municipality` : "",
        permWardNumber ? `Ward No. ${permWardNumber}` : "",
        permTole ? `${permTole}` : "",
        "Nepal",
      ].filter(Boolean);
      permStr = parts.join(", ");
    } else {
      const parts = [
        permStreetAddress,
        permMunicipality,
        permProvince,
        permPostalCode,
        finalPermCountry,
      ].filter(Boolean);
      permStr = parts.join(", ");
    }

    let tempStr = "";
    if (tempCountry === "Nepal") {
      const parts = [
        tempProvince ? `${tempProvince} Province` : "",
        tempDistrict ? `${tempDistrict} District` : "",
        tempMunicipality ? `${tempMunicipality} Municipality` : "",
        tempWardNumber ? `Ward No. ${tempWardNumber}` : "",
        tempTole ? `${tempTole}` : "",
        "Nepal",
      ].filter(Boolean);
      tempStr = parts.join(", ");
    } else {
      const parts = [
        tempStreetAddress,
        tempMunicipality,
        tempProvince,
        tempPostalCode,
        finalTempCountry,
      ].filter(Boolean);
      tempStr = parts.join(", ");
    }

    setPersonal((prev) => ({
      ...prev,
      permanentAddress: permStr,
      temporaryAddress: tempStr,
      province: permProvince,
      district: permCountry === "Nepal" ? permDistrict : "",
      municipality: permMunicipality,
      wardNumber: permCountry === "Nepal" ? permWardNumber : "",
      postalCode: permCountry === "Nepal" ? "" : permPostalCode,
    }));
  }, [
    permCountry,
    permCountryOther,
    permProvince,
    permDistrict,
    permMunicipality,
    permWardNumber,
    permTole,
    permStreetAddress,
    permPostalCode,
    tempCountry,
    tempCountryOther,
    tempProvince,
    tempDistrict,
    tempMunicipality,
    tempWardNumber,
    tempTole,
    tempStreetAddress,
    tempPostalCode,
  ]);

  // Clear sub-district/municipality if higher level changes for Permanent Address
  useEffect(() => {
    if (permProvince) {
      const provData = NEPAL_ADDRESS_DATA.find((p) => p.name === permProvince);
      if (
        provData &&
        permDistrict &&
        !Object.keys(provData.districts).includes(permDistrict)
      ) {
        setPermDistrict("");
        setPermMunicipality("");
      }
    }
  }, [permProvince]);

  useEffect(() => {
    if (permDistrict && permProvince) {
      const provData = NEPAL_ADDRESS_DATA.find((p) => p.name === permProvince);
      if (provData && permDistrict) {
        const munis = provData.districts[permDistrict] || [];
        if (permMunicipality && !munis.includes(permMunicipality)) {
          setPermMunicipality("");
        }
      }
    }
  }, [permDistrict]);

  // Clear sub-district/municipality if higher level changes for Temporary Address
  useEffect(() => {
    if (tempProvince) {
      const provData = NEPAL_ADDRESS_DATA.find((p) => p.name === tempProvince);
      if (
        provData &&
        tempDistrict &&
        !Object.keys(provData.districts).includes(tempDistrict)
      ) {
        setTempDistrict("");
        setTempMunicipality("");
      }
    }
  }, [tempProvince]);

  useEffect(() => {
    if (tempDistrict && tempProvince) {
      const provData = NEPAL_ADDRESS_DATA.find((p) => p.name === tempProvince);
      if (provData && tempDistrict) {
        const munis = provData.districts[tempDistrict] || [];
        if (tempMunicipality && !munis.includes(tempMunicipality)) {
          setTempMunicipality("");
        }
      }
    }
  }, [tempDistrict]);

  // ----------------------------------------------------
  // STEP 2 FIELDS: PROFILE PICTURE
  // ----------------------------------------------------
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] =
    useState<string>("");
  const [cropConfig, setCropConfig] = useState({ zoom: 1, rotate: 0 });
  const [profilePhotoName, setProfilePhotoName] = useState("");

  useEffect(() => {
    return () => {
      if (profilePhotoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhotoPreviewUrl);
      }
    };
  }, [profilePhotoPreviewUrl]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return triggerToast("Profile picture must be less than 2 MB.", true);
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        return triggerToast("Please upload a PNG or JPEG file.", true);
      }
      setProfilePhotoName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setProfilePhoto(dataUrl);
        setProfilePhotoPreviewUrl((prev) => {
          if (prev.startsWith("blob:")) {
            URL.revokeObjectURL(prev);
          }
          return URL.createObjectURL(file);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // ----------------------------------------------------
  // STEP 3 FIELDS: CITIZENSHIP CARD & DIGITAL SIGNATURE
  // ----------------------------------------------------
  const [citizenshipNumber, setCitizenshipNumber] = useState<string>("");
  useEffect(() => {
    const nextValue =
      user?.citizenshipNumber ||
      savedProfile?.citizenshipNumber ||
      completedUser?.citizenshipNumber ||
      user?.nationalID ||
      "";
    setCitizenshipNumber(nextValue);
  }, [user, savedProfile, completedUser]);

  const [citizenshipFrontImage, setCitizenshipFrontImage] =
    useState<string>("");
  const [citizenshipBackImage, setCitizenshipBackImage] = useState<string>("");
  const [citizenshipFrontFileName, setCitizenshipFrontFileName] =
    useState<string>("");
  const [citizenshipBackFileName, setCitizenshipBackFileName] =
    useState<string>("");
  const [citizenshipFrontUploadedAt, setCitizenshipFrontUploadedAt] =
    useState<string>("");
  const [citizenshipBackUploadedAt, setCitizenshipBackUploadedAt] =
    useState<string>("");
  const [signatureImage, setSignatureImage] = useState<string>("");

  // New Demographic Family and NID Fields State:
  const [fullNameNepali, setFullNameNepali] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [educationStatus, setEducationStatus] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [nationality] = useState("Nepali");

  const [fatherName, setFatherName] = useState("");
  const [fatherNameNepali, setFatherNameNepali] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherNameNepali, setMotherNameNepali] = useState("");
  const [grandfatherName, setGrandfatherName] = useState("");
  const [grandfatherNameNepali, setGrandfatherNameNepali] = useState("");

  const [spouseName, setSpouseName] = useState("");
  const [spouseNameNepali, setSpouseNameNepali] = useState("");
  const [spouseFatherName, setSpouseFatherName] = useState("");
  const [spouseFatherNameNepali, setSpouseFatherNameNepali] = useState("");
  const [spouseMotherName, setSpouseMotherName] = useState("");
  const [spouseMotherNameNepali, setSpouseMotherNameNepali] = useState("");

  const [citizenshipType, setCitizenshipType] = useState("By Descent");
  const [citizenshipIssueDate, setCitizenshipIssueDate] = useState("");
  const [citizenshipCalendar, setCitizenshipCalendar] = useState<"AD" | "BS">(
    "AD",
  );
  const [citizenshipBsDate, setCitizenshipBsDate] = useState("");
  const [citizenshipIssueDistrict, setCitizenshipIssueDistrict] = useState("");
  const [citizenshipIssueAuthority, setCitizenshipIssueAuthority] = useState(
    "District Administration Office",
  );

  const formatDateParts = (date: {
    year: number;
    month: number;
    date: number;
  }) =>
    `${String(date.year).padStart(4, "0")}-${String(date.month + 1).padStart(2, "0")}-${String(date.date).padStart(2, "0")}`;

  const convertAdToBs = (value: string) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    try {
      const converted = NepaliDate.fromAD(date).getBS();
      return formatDateParts(converted);
    } catch {
      return "";
    }
  };

  const convertBsToAd = (value: string) => {
    if (!value) return "";
    try {
      const converted = new NepaliDate(value).getAD();
      return formatDateParts(converted);
    } catch {
      return "";
    }
  };

  const handleCitizenshipCalendarChange = (calendar: "AD" | "BS") => {
    if (calendar === citizenshipCalendar) return;

    if (calendar === "BS") {
      setCitizenshipBsDate(convertAdToBs(citizenshipIssueDate));
    } else if (citizenshipBsDate) {
      setCitizenshipIssueDate(convertBsToAd(citizenshipBsDate));
    }

    setCitizenshipCalendar(calendar);
  };

  const handleCitizenshipIssueDateChange = (value: string) => {
    if (citizenshipCalendar === "AD") {
      setCitizenshipIssueDate(value);
      setCitizenshipBsDate(convertAdToBs(value));
    } else {
      setCitizenshipBsDate(value);
      setCitizenshipIssueDate(convertBsToAd(value));
    }
  };

  const [nidNumber, setNidNumber] = useState("");
  const [nidIssueDate, setNidIssueDate] = useState("");
  const [nidStatus, setNidStatus] = useState("Approved");
  const [nidFrontImage, setNidFrontImage] = useState<string>("");
  const [nidBackImage, setNidBackImage] = useState<string>("");

  const [nidAvailabilityStatus, setNidAvailabilityStatus] = useState<{
    status: "idle" | "checking" | "available" | "taken";
    message?: string;
  }>({ status: "idle" });

  useEffect(() => {
    if (!nidNumber || nidNumber.trim().length < 6) {
      setNidAvailabilityStatus({ status: "idle" });
      return;
    }
    const timer = setTimeout(async () => {
      setNidAvailabilityStatus({ status: "checking" });
      try {
        const res = await checkAvailability({ nid: nidNumber });
        if (res && res.success) {
          if (res.available?.nid === false) {
            setNidAvailabilityStatus({
              status: "taken",
              message: res.message?.nid || "National ID already exists.",
            });
          } else {
            setNidAvailabilityStatus({
              status: "available",
              message: "National ID available",
            });
          }
        }
      } catch {
        setNidAvailabilityStatus({ status: "idle" });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nidNumber]);

  // Fingerprint Registration states and simulator
  const [fingerprintImage, setFingerprintImage] = useState<string>("");
  const [fingerprintLeftImage, setFingerprintLeftImage] = useState<string>("");
  const [fingerprintRightImage, setFingerprintRightImage] =
    useState<string>("");
  const [isFingerprinting, setIsFingerprinting] = useState<boolean>(false);
  const [fingerprintStatus, setFingerprintStatus] = useState<
    "idle" | "checking" | "clear" | "duplicate"
  >("idle");
  const [fingerprintMatchUser, setFingerprintMatchUser] = useState<string>("");
  const [fingerprintCameraActive, setFingerprintCameraActive] = useState(false);
  const [fingerprintCaptureSide, setFingerprintCaptureSide] = useState<
    "left" | "right"
  >("left");
  const fingerprintVideoRef = useRef<HTMLVideoElement | null>(null);
  const fingerprintStreamRef = useRef<MediaStream | null>(null);

  const FINGERPRINT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  const estimateBase64Size = (dataUrl: string) => {
    try {
      const base64 = dataUrl.split(",")[1] || "";
      const padding = (base64.match(/=+$/) || [""])[0].length;
      return Math.ceil((base64.length * 3) / 4) - padding;
    } catch {
      return Infinity;
    }
  };

  const compressDataUrl = async (
    dataUrl: string,
    maxBytes: number,
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        let width = img.width;
        let height = img.height;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const tryCompress = () => {
          // Try decreasing quality first
          for (let q = 0.95; q >= 0.5; q -= 0.05) {
            const attempt = canvas.toDataURL("image/jpeg", q);
            if (estimateBase64Size(attempt) <= maxBytes)
              return resolve(attempt);
          }

          // If still too big, scale down and retry
          if (width > 400 && height > 300) {
            width = Math.round(width * 0.9);
            height = Math.round(height * 0.9);
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
            ctx.drawImage(img, 0, 0, width, height);
            return tryCompress();
          }

          // Give up
          return resolve(null);
        };

        tryCompress();
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  };

  useEffect(() => {
    return () => {
      if (fingerprintStreamRef.current) {
        fingerprintStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const handleNidChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return triggerToast("NID Document file must be less than 2 MB.", true);
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (side === "front") setNidFrontImage(reader.result as string);
        else setNidBackImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const stopFingerprintCamera = () => {
    fingerprintStreamRef.current?.getTracks().forEach((track) => track.stop());
    fingerprintStreamRef.current = null;
    setFingerprintCameraActive(false);
    setIsFingerprinting(false);
  };

  const validateFingerprintImage = async (imageData: string) => {
    if (!imageData) return;
    setFingerprintStatus("checking");

    try {
      const response = await fetch(buildApiUrl("/api/fingerprint/validate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fingerprintImage: imageData }),
      });
      const data = await response.json();
      if (data.isDuplicate) {
        setFingerprintStatus("duplicate");
        setFingerprintMatchUser(
          data.matchedUser?.fullName || "another registered voter",
        );
        triggerToast(
          `Fingerprint already linked to ${data.matchedUser?.fullName || "an existing voter"}. Please use another finger or contact support.`,
          true,
        );
      } else {
        setFingerprintStatus("clear");
        setFingerprintMatchUser("");
      }
    } catch {
      // If API fails, allow user to proceed with manual review
      setFingerprintStatus("clear");
      console.warn(
        "Fingerprint validation API unavailable, proceeding with manual review",
      );
    }
  };

  const startFingerprintTouchScan = async (side: "left" | "right") => {
    if (isFingerprinting) return;

    setFingerprintCaptureSide(side);
    setIsFingerprinting(true);

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      triggerToast(
        "Camera access is unavailable on this device. Please upload a fingerprint image instead.",
        true,
      );
      setIsFingerprinting(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      fingerprintStreamRef.current = stream;
      if (fingerprintVideoRef.current) {
        fingerprintVideoRef.current.srcObject = stream;
        await fingerprintVideoRef.current.play();
      }
      setFingerprintCameraActive(true);
    } catch {
      setIsFingerprinting(false);
      triggerToast(
        "Camera access was blocked. You can still upload a fingerprint image manually.",
        true,
      );
    }
  };

  const captureFingerprintFromCamera = async () => {
    const video = fingerprintVideoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    if (fingerprintCaptureSide === "left") {
      setFingerprintLeftImage(imageData);
    } else {
      setFingerprintRightImage(imageData);
    }
    setFingerprintImage(imageData);
    stopFingerprintCamera();
    await validateFingerprintImage(imageData);
  };

  const handleFingerprintImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "left" | "right",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > FINGERPRINT_MAX_BYTES) {
        return triggerToast(
          `Fingerprint image must be less than ${Math.round(
            FINGERPRINT_MAX_BYTES / 1024 / 1024,
          )} MB.`,
          true,
        );
      }

      const reader = new FileReader();
      reader.onload = async () => {
        let imageData = reader.result as string;

        // If uploaded image is larger than allowed, try compressing
        const estimated = estimateBase64Size(imageData);
        if (estimated > FINGERPRINT_MAX_BYTES) {
          const compressed = await compressDataUrl(
            imageData,
            FINGERPRINT_MAX_BYTES,
          );
          if (compressed) {
            imageData = compressed;
          } else {
            return triggerToast(
              `Uploaded fingerprint image exceeds ${Math.round(
                FINGERPRINT_MAX_BYTES / 1024 / 1024,
              )} MB and could not be compressed.`,
              true,
            );
          }
        }

        if (side === "left") {
          setFingerprintLeftImage(imageData);
        } else {
          setFingerprintRightImage(imageData);
        }
        setFingerprintImage(imageData);
        setIsFingerprinting(false);
        await validateFingerprintImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCitizenshipFileUpload = (file: File, side: "front" | "back") => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return triggerToast(
        "Only PNG, JPG, JPEG, or PDF files are supported.",
        true,
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return triggerToast("Document file must be less than 10 MB.", true);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (side === "front") {
        setCitizenshipFrontImage(dataUrl);
        setCitizenshipFrontFileName(file.name);
        setCitizenshipFrontUploadedAt(new Date().toLocaleString());
      } else {
        setCitizenshipBackImage(dataUrl);
        setCitizenshipBackFileName(file.name);
        setCitizenshipBackUploadedAt(new Date().toLocaleString());
      }
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // STEP 4 FIELDS: FACE BIOMETRICS
  // ----------------------------------------------------
  const [faceImage, setFaceImage] = useState<string>("");
  const [faceTemplate, setFaceTemplate] = useState<number[] | null>(null);

  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [activeMismatches, setActiveMismatches] = useState<any[]>([]);
  const [mismatchesResolved, setMismatchesResolved] = useState(false);

  const checkMismatches = () => {
    const list: any[] = [];
    if (mismatchesResolved) {
      return list;
    }

    const normalizeString = (value: any) =>
      String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");

    const savedSource = savedProfile || completedUser || user || {};
    const savedFullName = normalizeString(
      savedSource.fullName || savedSource.name || user?.fullName,
    );
    const savedFatherName = normalizeString(
      savedSource.fatherName ||
      savedSource.fatherNameNepali ||
      user?.fatherName,
    );
    const savedWardNumber = normalizeString(
      savedSource.permWardNumber ||
      savedSource.wardNumber ||
      user?.permWardNumber ||
      user?.wardNumber,
    );

    if (
      savedFullName &&
      normalizeString(user?.fullName) &&
      savedFullName !== normalizeString(user?.fullName)
    ) {
      list.push({
        field: "Voter Full Name",
        citizenshipVal: normalizeString(user?.fullName),
        nidVal: savedFullName,
        suggested: savedFullName,
        key: "fullName",
      });
    }

    if (fatherName) {
      const normalizedFather = normalizeString(fatherName);
      const referenceFather = savedFatherName || normalizedFather;
      if (
        normalizedFather &&
        referenceFather &&
        normalizedFather !== referenceFather
      ) {
        list.push({
          field: "Father's Legal Name",
          citizenshipVal: normalizedFather,
          nidVal: referenceFather,
          suggested: referenceFather,
          key: "fatherName",
        });
      }
    }

    if (permWardNumber) {
      const normalizedWard = normalizeString(permWardNumber);
      const referenceWard = savedWardNumber || normalizedWard;
      if (normalizedWard && referenceWard && normalizedWard !== referenceWard) {
        list.push({
          field: "Permanent Ward Number",
          citizenshipVal: normalizedWard,
          nidVal: referenceWard,
          suggested: referenceWard,
          key: "permWardNumber",
        });
      }
    }

    return list;
  };

  // ----------------------------------------------------
  // WIZARD PROCESS TRANSITIONS (With interactive custom form validations)
  // ----------------------------------------------------
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [acceptLegal, setAcceptLegal] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      const errors: Record<string, string> = {};

      if (!personal.dob) {
        errors.dob = "Date of Birth is required.";
      } else if (calculateAge(personal.dob) < 18) {
        errors.dob =
          "You must be at least 18 years old to complete the profile.";
      }
      if (!personal.gender)
        errors.gender = "Gender identification is required.";

      // Permanent Address high-fidelity validations
      if (!permCountry) {
        errors.permCountry = "Country selection is required.";
      } else if (permCountry === "Nepal") {
        if (!permProvince) errors.permProvince = "Province is required.";
        if (!permDistrict) errors.permDistrict = "District is required.";
        if (!permMunicipality)
          errors.permMunicipality = "Municipality is required.";
        if (!permWardNumber) {
          errors.permWardNumber = "Ward number is required.";
        } else if (!/^\d+$/.test(permWardNumber)) {
          errors.permWardNumber =
            "Ward number must be numeric characters only.";
        }
        if (!permTole) errors.permTole = "Tole/Street address is required.";
      } else {
        // International countries
        if (
          (permCountry === "Other Country" ||
            permCountry === "Outside Nepal") &&
          !permCountryOther.trim()
        ) {
          errors.permCountryOther = "Specify other Country name.";
        }
        if (!permProvince)
          errors.permProvince = "State / Province / Region is required.";
        if (!permMunicipality) errors.permMunicipality = "City is required.";
        if (!permStreetAddress)
          errors.permStreetAddress = "Street Address is required.";
        if (!permPostalCode) {
          errors.permPostalCode = "ZIP / Postal Code is required.";
        } else if (permPostalCode.trim().length < 3) {
          errors.permPostalCode = "Enter a valid ZIP/Postal Code.";
        }
      }

      // Temporary Address validations (if not synchronized as same as permanent)
      if (!sameAsPermanent) {
        if (!tempCountry) {
          errors.tempCountry = "Country selection is required.";
        } else if (tempCountry === "Nepal") {
          if (!tempProvince) errors.tempProvince = "Province is required.";
          if (!tempDistrict) errors.tempDistrict = "District is required.";
          if (!tempMunicipality)
            errors.tempMunicipality = "Municipality is required.";
          if (!tempWardNumber) {
            errors.tempWardNumber = "Ward number is required.";
          } else if (!/^\d+$/.test(tempWardNumber)) {
            errors.tempWardNumber =
              "Ward number must be numeric characters only.";
          }
          if (!tempTole) errors.tempTole = "Tole/Street address is required.";
        } else {
          // International countries
          if (
            (tempCountry === "Other Country" ||
              tempCountry === "Outside Nepal") &&
            !tempCountryOther.trim()
          ) {
            errors.tempCountryOther = "Specify other Country name.";
          }
          if (!tempProvince)
            errors.tempProvince = "State / Province / Region is required.";
          if (!tempMunicipality) errors.tempMunicipality = "City is required.";
          if (!tempStreetAddress)
            errors.tempStreetAddress = "Street Address is required.";
          if (!tempPostalCode) {
            errors.tempPostalCode = "ZIP / Postal Code is required.";
          } else if (tempPostalCode.trim().length < 3) {
            errors.tempPostalCode = "Enter a valid ZIP/Postal Code.";
          }
        }
      }

      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        const firstErrorKey = Object.keys(errors)[0];
        triggerToast(`Validation Error: ${errors[firstErrorKey]}`, true);
        return;
      }
    } else if (step === 2) {
      if (!profilePhoto) {
        return triggerToast(
          "Please upload and align a valid profile picture first.",
          true,
        );
      }
    } else if (step === 3) {
      if (!citizenshipFrontImage || !citizenshipBackImage) {
        return triggerToast(
          "Both front and back ID documentation copies are required.",
          true,
        );
      }
      if (!signatureImage) {
        return triggerToast(
          "Please draw or upload your digital signature seal.",
          true,
        );
      }
      if (!fingerprintLeftImage || !fingerprintRightImage) {
        return triggerToast(
          "Both left and right fingerprint captures are required. Please capture or upload each finger.",
          true,
        );
      }
      if (fingerprintStatus === "duplicate") {
        return triggerToast(
          "Fingerprint already matches an existing voter record. Please retake the capture with a different finger.",
          true,
        );
      }

      // Check for discrepancies between Citizenship records and National ID Card registry
      const mismatches = checkMismatches();
      if (mismatches.length > 0 && !mismatchesResolved) {
        setActiveMismatches(mismatches);
        setShowDiscrepancyModal(true);
        triggerToast(
          "⚠️ ID verification discrepancy detected. Review suggestions.",
          true,
        );
        return; // Halt and show verification alignment modal
      }
    } else if (step === 4) {
      if (!faceImage || !faceTemplate) {
        return triggerToast(
          "Completed Camera Liveness verification coordinates is required.",
          true,
        );
      }
    }

    setIsSavingStep(true);
    try {
      const nextStepVal = step + 1;
      await saveProfileProgress({ showToast: false, nextStep: nextStepVal });
      setStep(nextStepVal);
      triggerToast("✅ Profile progress advanced and saved.");
    } catch (error: any) {
      console.error("Could not save progress to database:", error);
      triggerToast(
        error?.message ||
        "Failed to save profile progress to database. Please try again.",
        true,
      );
    } finally {
      setIsSavingStep(false);
    }
  };

  const handlePrev = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleEditProfile = () => {
    if (isSubmitted) {
      triggerToast(
        "This registration has been submitted and is locked from edits.",
        true,
      );
      return;
    }
    setStep(1);
  };

  const saveProfileProgress = async ({
    showToast = true,
    nextStep,
  }: { showToast?: boolean; nextStep?: number } = {}) => {
    const rawSnapshot = buildProfileSnapshot();
    const identityBiometricFields = new Set([
      "faceImage",
      "faceTemplate",
      "fingerprintImage",
      "fingerprintLeftImage",
      "fingerprintRightImage",
      "citizenshipFrontImage",
      "citizenshipBackImage",
      "signatureImage",
      "nidFrontImage",
      "nidBackImage",
    ]);

    const payload: Record<string, any> = {};
    for (const [key, val] of Object.entries(rawSnapshot)) {
      if (val === undefined || val === null) continue;
      if (typeof val === "string" && val.trim() === "") continue;
      if (Array.isArray(val) && val.length === 0) continue;

      if ((key === "faceImage" || key === "faceTemplate") && step < 4) {
        continue;
      }
      if (identityBiometricFields.has(key) && step < 3) {
        continue;
      }

      payload[key] = val;
    }
    payload.currentStep = typeof nextStep === "number" ? nextStep : step;

    try {
      const response = await fetch(buildApiUrl("/api/profile/save-progress"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save profile progress.");
      }

      if (data?.profile) {
        setSavedProfile(data.profile);
      }

      if (showToast) {
        triggerToast("✅ Profile progress saved to the secure database.");
      }

      try {
        const channel = new BroadcastChannel("votex_session_sync");
        channel.postMessage({
          type: "PROFILE_REFRESH",
          source: "save-progress",
          sourceId: profileSyncChannelId.current,
        });
        channel.close();
      } catch {
        // Ignore unsupported browser sync APIs.
      }

      return data;
    } catch (error: any) {
      if (showToast) {
        triggerToast(error.message || "Failed to save profile progress.", true);
      }
      throw error;
    }
  };

  useEffect(() => {

    if (user?.isProfileComplete) {
      if (setCurrentPath) {
        setCurrentPath("/votexDashboard");
      }
      onComplete(user);
    }
  }, [user?.isProfileComplete, setCurrentPath, onComplete]);

  useEffect(() => {

    const loadSavedProfile = async () => {
      if (!token) return;

      try {
        const response = await fetch(buildApiUrl("/api/profile/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const profile = data?.profile;
        if (profile) {
          applyProfileSnapshot(profile);
          setSavedProfile(profile);
        }
      } catch {
        // Proceed with the form without preloading saved data.
      }
    };

    loadSavedProfile();
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncProfileFromServer = async () => {
      if (!token) return;
      try {
        const response = await fetch(buildApiUrl("/api/profile/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data?.profile) {
          applyProfileSnapshot(data.profile);
          setSavedProfile(data.profile);
        }
      } catch {
        // Ignore sync errors and keep working with the current form state.
      }
    };

    try {
      const channel = new BroadcastChannel("votex_session_sync");
      const handleMessage = (event: MessageEvent) => {
        if (event?.data?.type === "PROFILE_REFRESH") {
          void syncProfileFromServer();
        }
      };
      channel.addEventListener("message", handleMessage);

      const handleStorage = (event: StorageEvent) => {
        if (event.key === "votex_profile_refresh") {
          void syncProfileFromServer();
        }
      };
      window.addEventListener("storage", handleStorage);

      return () => {
        channel.removeEventListener("message", handleMessage);
        window.removeEventListener("storage", handleStorage);
        channel.close();
      };
    } catch {
      return undefined;
    }
  }, [token]);

  // ----------------------------------------------------
  // SUBMIT HANDLER: TRANSMITS COMBINED DOCUMENTS TO BACKEND
  // ----------------------------------------------------
  const handleSubmit = async () => {
    try {
      if (isSubmitted || user?.isProfileComplete) {
        triggerToast("Profile has already been submitted. Redirecting to dashboard...");
        if (setCurrentPath) {
          setCurrentPath("/votexDashboard");
        }
        onComplete({
          ...(user || {}),
          isProfileComplete: true,
        });
        return;
      }

      setLoading(true);
      setErrorMsg("");

      const resolvedAddress =
        personal.permanentAddress ||
        (permDistrict ? `${permMunicipality}, Ward ${permWardNumber}, ${permDistrict}, ${permProvince}` : "Kathmandu, Nepal");

      const payload = {
        fullName: user?.fullName || "Voter Identity",
        email: user?.email || "voter@votex.gov",
        mobile: user?.mobile || "+9779800000000",
        dob: personal.dob || user?.dob || "2000-01-01",
        gender: personal.gender || user?.gender || "Male",
        permanentAddress: resolvedAddress,
        address: resolvedAddress,
        temporaryAddress: personal.temporaryAddress || "",
        province: permProvince || personal.province || "Bagmati Province",
        district: permDistrict || personal.district || "Kathmandu",
        municipality: permMunicipality || personal.municipality || "Kathmandu Metropolitan City",
        wardNumber: permWardNumber || personal.wardNumber || "01",
        postalCode: permPostalCode || personal.postalCode || "44600",
        occupation: personal.occupation || "Voter",
        profilePhoto,
        // Biometric images — sent in full; body limit is 50MB
        faceImage,
        faceTemplate,
        fingerprintImage,
        fingerprintLeftImage,
        fingerprintRightImage,
        citizenshipFrontImage,
        citizenshipBackImage,
        signatureImage,
        nidFrontImage,
        nidBackImage,
        deviceInformation: navigator.userAgent,

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
        spouseFatherName,
        spouseFatherNameNepali,
        spouseMotherName,
        spouseMotherNameNepali,
        citizenshipNumber,
        citizenshipType,
        citizenshipIssueDate,
        citizenshipIssueDistrict,
        citizenshipIssueAuthority,
        nidNumber,
        nidIssueDate,
        nidStatus,

        // Separate location subfield entries
        permCountry:
          permCountry === "Other Country" || permCountry === "Outside Nepal"
            ? permCountryOther
            : permCountry,
        permProvince,
        permDistrict,
        permMunicipality,
        permWardNumber,
        permTole,
        permStreetAddress,
        permPostalCode,

        tempCountry:
          tempCountry === "Other Country" || tempCountry === "Outside Nepal"
            ? tempCountryOther
            : tempCountry,
        tempProvince,
        tempDistrict,
        tempMunicipality,
        tempWardNumber,
        tempTole,
        tempStreetAddress,
        tempPostalCode,
        isTemporarySameAsPermanent: sameAsPermanent,
      };

      const res = await fetch(buildApiUrl("/api/profile/complete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...((import.meta as any).env?.DEV
            ? { "X-VoTex-Dev-Bypass": "true" }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let data: any = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { error: "The server returned an invalid response." };
        }
      }

      if (!res.ok) {
        throw new Error(data.error || "Profile completion submission failed.");
      }

      triggerToast(
        "Democratic voter profile finalized! Security seal compiled.",
      );

      const savedUser = data.user || null;
      const savedProfileData = data.profile || savedUser || null;
      setCompletedUser(savedUser);
      setSavedProfile(savedProfileData);
      setIsSubmitted(true);

      const updatedUser = {
        ...(user || {}),
        ...(savedUser || {}),
        isProfileComplete: true,
        accountStatus: savedUser?.accountStatus || "Pending Verification",
      };

      try {
        const channel = new BroadcastChannel("votex_session_sync");
        channel.postMessage({
          type: "PROFILE_REFRESH",
          source: "complete-profile-submit",
          sourceId: profileSyncChannelId.current,
        });
        channel.close();
      } catch {
        // ignore if not available
      }

      try {
        localStorage.setItem("votex_profile_refresh", Date.now().toString());
      } catch {
        // ignore storage errors
      }

      if (setCurrentPath) {
        setCurrentPath("/votexDashboard");
      }
      onComplete(updatedUser);
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-950 text-white flex flex-col justify-center py-10 px-4 md:px-8 relative transition-colors">
      {/* Toast elements */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 border border-emerald-500 font-medium text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span className="text-xs">{successMsg}</span>
        </div>
      )}

      {savedProfile && showSavedBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,560px)] rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-100 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-emerald-300/60 bg-slate-800 shadow-inner">
                <img
                  src={
                    savedProfile.profilePhoto ||
                    savedProfile.profilePicture ||
                    completedUser?.profilePhoto ||
                    completedUser?.profilePicture ||
                    user?.profilePhoto ||
                    user?.profilePicture ||
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='%23f8fafc'/><g fill='%23959eab'><circle cx='75' cy='50' r='30'/><path d='M30 130c0-28 27-52 45-52s45 24 45 52H30z'/></g></svg>"
                  }
                  alt={
                    savedProfile.fullName ||
                    savedProfile.name ||
                    completedUser?.fullName ||
                    user?.fullName ||
                    "Profile photo"
                  }
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span className="text-sm font-semibold">
                    Profile saved successfully
                  </span>
                </div>
                <div className="text-xs text-emerald-100/90 truncate">
                  {savedProfile.fullName ||
                    savedProfile.name ||
                    completedUser?.fullName ||
                    user?.fullName ||
                    "Profile"}
                  {savedProfile.email || completedUser?.email
                    ? ` • ${savedProfile.email || completedUser?.email}`
                    : ""}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSavedBanner(false)}
              className="text-emerald-300/60 hover:text-emerald-100 transition-colors p-1 rounded-full hover:bg-emerald-500/20 shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 border border-red-500 font-medium text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-xs">{errorMsg}</span>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl text-left relative transition-colors">
        {/* Custom Header with Theme Toggle & Logout option */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-5 gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              Republic Voter Portal Onboarding
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1 uppercase tracking-tight">
              Complete Your Identity Profile
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Dear <strong className="text-white">{user?.fullName}</strong>,
              provide validated coordinates to secure your democratic profile.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {setTheme && (
              <button
                type="button"
                onClick={() =>
                  setTheme(
                    theme === "dark"
                      ? "light"
                      : theme === "light"
                        ? "high-contrast"
                        : "dark",
                  )
                }
                title={`Current theme: ${theme || "dark"}. Click to toggle.`}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                {theme === "light" ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : theme === "high-contrast" ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Contrast</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>
            )}
            {user?.isProfileComplete && (
              <button
                onClick={() => setCurrentPath?.("/votexDashboard")}
                className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-emerald-500/20 transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-rose-500/20 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* ----------------- PROGRESS INDICATOR WIZARD ----------------- */}
        {step < 6 && (
          <Stepper
            steps={[
              {
                id: 1,
                label: "Profile",
                description: "Demographics & Address",
              },
              { id: 2, label: "Picture", description: "Voter Photo" },
              {
                id: 3,
                label: "Identity Documents",
                description: "Citizenship & Signature",
              },
              {
                id: 4,
                label: "Liveness Check",
                description: "Biometric Verification",
              },
              {
                id: 5,
                label: "Final Seal",
                description: "Review & Confirmation",
              },
            ]}
            currentStep={step}
            onStepClick={(stepId) => {
              if (stepId < step) setStep(stepId);
            }}
            className="mb-2"
          />
        )}

        <AnimatePresence mode="wait">
          {/* ==================================================== */}
          {/* STEP 1: PERSONAL INFORMATION                         */}
          {/* ==================================================== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <User className="w-4 h-4" />
                <span>1. Personal Registry Demographics</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="flex items-center justify-between text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                    <span>Gender Identification *</span>
                    {isGenderLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <Lock className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </label>
                  <select
                    value={personal.gender}
                    onChange={
                      isGenderLocked
                        ? undefined
                        : (e) =>
                          setPersonal({ ...personal, gender: e.target.value })
                    }
                    disabled={isGenderLocked}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 min-h-10.5 text-xs disabled:cursor-not-allowed disabled:opacity-75 transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center justify-between text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                    <span>Date of Birth (registry) *</span>
                    {isDobLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <Lock className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    {isDobLocked ? (
                      <div className="w-full bg-gray-950 border border-gray-800 rounded-xl px-9 py-2 text-xs text-white font-bold min-h-10.5 flex items-center justify-between">
                        <span>{personal.dob}</span>
                        {personal.dob && (
                          <span className="text-[11px] font-normal text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {calculateAge(personal.dob)} Years Old
                          </span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="date"
                        max={maxProfileDob}
                        value={personal.dob}
                        onChange={(e) =>
                          setPersonal({
                            ...personal,
                            dob: e.target.value,
                          })
                        }
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-9 py-2 text-xs text-white outline-none focus:border-emerald-500 min-h-10.5 transition-colors"
                      />
                    )}
                  </div>
                  {isDobLocked && (
                    <p className="mt-1 text-[10px] text-gray-400">
                      Date of Birth was verified during registration and locked
                      for audit protection.
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center justify-between text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                    <span>Occupation / Profession</span>
                    {isOccupationLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <Lock className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    {isOccupationLocked ? (
                      <div className="w-full bg-gray-950 border border-gray-800 rounded-xl px-9 py-2 text-xs text-white font-bold min-h-10.5 flex items-center">
                        {user?.occupation || "Not provided"}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={
                          user?.occupation || "e.g. Software Engineer"
                        }
                        value={personal.occupation}
                        onChange={(e) =>
                          setPersonal({
                            ...personal,
                            occupation: e.target.value,
                          })
                        }
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-9 py-2 text-xs text-white outline-none focus:border-emerald-500 min-h-10.5 transition-colors"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                    <span>Email</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <Lock className="w-3 h-3" /> Registered
                    </span>
                  </label>
                  <input
                    type="text"
                    value={user?.email || "Not provided"}
                    disabled
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 min-h-10.5 disabled:cursor-not-allowed disabled:opacity-75 transition-colors"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                    <span>Primary Phone</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <Lock className="w-3 h-3" /> Registered
                    </span>
                  </label>
                  <input
                    type="text"
                    value={user?.mobile || "Not provided"}
                    disabled
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 min-h-10.5 disabled:cursor-not-allowed disabled:opacity-75 transition-colors"
                  />
                </div>
              </div>

              {/* Extended Family & Lineage Profile section */}
              <div className="bg-gray-950/50 p-5 rounded-2xl border border-gray-800 space-y-4">
                <div className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider border-b border-gray-800 pb-2 flex items-center gap-2">
                  <BadgePlus className="w-4 h-4" />
                  <span>Extended Voter Demographics</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px]">
                      Full Name (English)
                    </label>
                    <div className="w-full min-h-10.5 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-white font-bold flex items-center">
                      {user?.fullName || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1">
                      Full Name (Nepali - unicode) *
                    </label>
                    <input
                      type="text"
                      placeholder="उदाहारण: थोमस एन्डरसन"
                      value={fullNameNepali}
                      onChange={(e) => setFullNameNepali(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px]">
                      Marital Status *
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 min-h-10.5 transition-colors appearance-none"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1">
                      Highest Educational Qualification
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bachelor in Science"
                      value={educationStatus}
                      onChange={(e) => setEducationStatus(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px]">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 min-h-10.5 transition-colors appearance-none"
                    >
                      <option value="">Select Blood Group</option>
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
                    <label className="block text-gray-400 font-bold uppercase mb-1">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      value="Nepali"
                      readOnly
                      aria-readonly="true"
                      className="w-full cursor-not-allowed rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-gray-300 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ========================================== */}
              {/* PERMANENT ADDRESS SECTION                  */}
              {/* ========================================== */}
              <div className="bg-gray-950/40 p-5 rounded-2xl border border-gray-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-800/60 pb-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-black text-xs uppercase tracking-wider">
                    Permanent Residential Address *
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="w-full bg-gray-950 border rounded-xl px-3 py-3 text-white flex items-center justify-between min-h-9.5 border-gray-800">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-300">
                      Country
                    </span>
                    <span className="text-sm font-bold">Nepal</span>
                  </div>
                  <input type="hidden" name="permCountry" value="Nepal" />
                </div>

                {/* If selected Permanent Country on Onboarding is Nepal */}
                {permCountry === "Nepal" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                    <div>
                      <SearchableSelect
                        id="perm-province"
                        label="Province (State) *"
                        options={NEPAL_ADDRESS_DATA.map((p) => p.name)}
                        value={permProvince}
                        onChange={setPermProvince}
                        placeholder="Select Province"
                        error={validationErrors.permProvince}
                      />
                    </div>

                    <div>
                      <SearchableSelect
                        id="perm-district"
                        label="District *"
                        options={
                          permProvince
                            ? NEPAL_ADDRESS_DATA.find(
                              (p) => p.name === permProvince,
                            )?.districts
                              ? Object.keys(
                                NEPAL_ADDRESS_DATA.find(
                                  (p) => p.name === permProvince,
                                )!.districts,
                              )
                              : []
                            : []
                        }
                        value={permDistrict}
                        onChange={setPermDistrict}
                        placeholder={
                          permProvince
                            ? "Select District"
                            : "Select Province first"
                        }
                        disabled={!permProvince}
                        error={validationErrors.permDistrict}
                      />
                    </div>

                    <div>
                      <SearchableSelect
                        id="perm-municipality"
                        label="Municipality *"
                        options={
                          permDistrict
                            ? NEPAL_ADDRESS_DATA.find(
                              (p) => p.name === permProvince,
                            )?.districts[permDistrict] || []
                            : []
                        }
                        value={permMunicipality}
                        onChange={setPermMunicipality}
                        placeholder={
                          permDistrict
                            ? "Select Municipality"
                            : "Select District first"
                        }
                        disabled={!permDistrict}
                        error={validationErrors.permMunicipality}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Ward Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3"
                        maxLength={3}
                        value={permWardNumber}
                        onChange={(e) => setPermWardNumber(e.target.value)}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.permWardNumber
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.permWardNumber && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.permWardNumber}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Tole / Street Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. New Baneshwor"
                        value={permTole}
                        onChange={(e) => setPermTole(e.target.value)}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.permTole
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.permTole && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.permTole}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* If selected Permanent Country in Onboarding is outside Nepal */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        State / Province / Region *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. California"
                        value={permProvince}
                        onChange={(e) => setPermProvince(e.target.value)}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.permProvince
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.permProvince && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.permProvince}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Los Angeles"
                        value={permMunicipality}
                        onChange={(e) => setPermMunicipality(e.target.value)}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.permMunicipality
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.permMunicipality && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.permMunicipality}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 104 Pine Street, Apt 4"
                        value={permStreetAddress}
                        onChange={(e) => setPermStreetAddress(e.target.value)}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.permStreetAddress
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.permStreetAddress && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.permStreetAddress}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        ZIP / Postal Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 90210"
                        value={permPostalCode}
                        onChange={(e) => setPermPostalCode(e.target.value)}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.permPostalCode
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.permPostalCode && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.permPostalCode}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* SYNCHRONIZER CHECKBOX                      */}
              {/* ========================================== */}
              <div className="bg-gray-950 border border-gray-800/80 p-4 rounded-2xl flex items-center gap-3 hover:border-emerald-500/40 transition-colors">
                <input
                  type="checkbox"
                  id="sameAsPermanent"
                  checked={sameAsPermanent}
                  onChange={(e) => setSameAsPermanent(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-emerald-500 bg-gray-900 border-gray-700 outline-none focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                />
                <div
                  className="select-none cursor-pointer"
                  onClick={() => setSameAsPermanent(!sameAsPermanent)}
                >
                  <span className="text-xs font-black text-white block uppercase tracking-wider">
                    Same as Permanent Address
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Automatically syncs and locks temporary address fields as
                    identical to permanent coordinates.
                  </span>
                </div>
              </div>

              {/* ========================================== */}
              {/* TEMPORARY ADDRESS SECTION                  */}
              {/* ========================================== */}
              <div
                className={`p-5 rounded-2xl border transition-all space-y-4 ${sameAsPermanent
                  ? "bg-gray-900/30 border-dashed border-gray-800/60 opacity-60 relative"
                  : "bg-gray-950/40 border-gray-800/80"
                  }`}
              >
                <div className="flex items-center justify-between border-b border-gray-800/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-black text-xs uppercase tracking-wider">
                      Temporary Current Address *
                    </span>
                  </div>
                  {sameAsPermanent && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Locked / Synchronized</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Country Selector */}
                  <div>
                    <SearchableSelect
                      id="temp-country"
                      label="Country *"
                      options={COUNTRIES.map((c) => ({
                        value: c.name,
                        label: c.name,
                      }))}
                      value={tempCountry}
                      onChange={(val) => {
                        setTempCountry(val || "Nepal");
                        if (val !== "Other Country" && val !== "Outside Nepal")
                          setTempCountryOther("");
                      }}
                      placeholder="Select Country"
                      disabled={sameAsPermanent}
                      error={validationErrors.tempCountry}
                    />
                  </div>

                  {/* Specifying other country name */}
                  {(tempCountry === "Other Country" ||
                    tempCountry === "Outside Nepal") && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                          Specify Country Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter country name"
                          value={tempCountryOther}
                          onChange={(e) => setTempCountryOther(e.target.value)}
                          disabled={sameAsPermanent}
                          className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.tempCountryOther
                            ? "border-rose-500"
                            : "border-gray-800 focus:border-emerald-500"
                            }`}
                        />
                        {validationErrors.tempCountryOther && (
                          <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                            {validationErrors.tempCountryOther}
                          </span>
                        )}
                      </div>
                    )}
                </div>

                {/* If selected Temporary Country in Onboarding is Nepal */}
                {tempCountry === "Nepal" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                    <div>
                      <SearchableSelect
                        id="temp-province"
                        label="Province (State) *"
                        options={NEPAL_ADDRESS_DATA.map((p) => p.name)}
                        value={tempProvince}
                        onChange={setTempProvince}
                        placeholder="Select Province"
                        disabled={sameAsPermanent}
                        error={validationErrors.tempProvince}
                      />
                    </div>

                    <div>
                      <SearchableSelect
                        id="temp-district"
                        label="District *"
                        options={
                          tempProvince
                            ? NEPAL_ADDRESS_DATA.find(
                              (p) => p.name === tempProvince,
                            )?.districts
                              ? Object.keys(
                                NEPAL_ADDRESS_DATA.find(
                                  (p) => p.name === tempProvince,
                                )!.districts,
                              )
                              : []
                            : []
                        }
                        value={tempDistrict}
                        onChange={setTempDistrict}
                        placeholder={
                          tempProvince
                            ? "Select District"
                            : "Select Province first"
                        }
                        disabled={sameAsPermanent || !tempProvince}
                        error={validationErrors.tempDistrict}
                      />
                    </div>

                    <div>
                      <SearchableSelect
                        id="temp-municipality"
                        label="Municipality *"
                        options={
                          tempDistrict
                            ? NEPAL_ADDRESS_DATA.find(
                              (p) => p.name === tempProvince,
                            )?.districts[tempDistrict] || []
                            : []
                        }
                        value={tempMunicipality}
                        onChange={setTempMunicipality}
                        placeholder={
                          tempDistrict
                            ? "Select Municipality"
                            : "Select District first"
                        }
                        disabled={sameAsPermanent || !tempDistrict}
                        error={validationErrors.tempMunicipality}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Ward Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3"
                        maxLength={3}
                        value={tempWardNumber}
                        onChange={(e) => setTempWardNumber(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.tempWardNumber
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.tempWardNumber && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.tempWardNumber}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Tole / Street Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sanepa"
                        value={tempTole}
                        onChange={(e) => setTempTole(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.tempTole
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.tempTole && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.tempTole}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* If selected Temporary Country in Onboarding is outside Nepal */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        State / Province / Region *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. California"
                        value={tempProvince}
                        onChange={(e) => setTempProvince(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.tempProvince
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.tempProvince && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.tempProvince}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Los Angeles"
                        value={tempMunicipality}
                        onChange={(e) => setTempMunicipality(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.tempMunicipality
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.tempMunicipality && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.tempMunicipality}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 104 Pine Street, Apt 4"
                        value={tempStreetAddress}
                        onChange={(e) => setTempStreetAddress(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.tempStreetAddress
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.tempStreetAddress && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.tempStreetAddress}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        ZIP / Postal Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 90210"
                        value={tempPostalCode}
                        onChange={(e) => setTempPostalCode(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-gray-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-9.5 ${validationErrors.tempPostalCode
                          ? "border-rose-500"
                          : "border-gray-800 focus:border-emerald-500"
                          }`}
                      />
                      {validationErrors.tempPostalCode && (
                        <span className="text-[10px] text-rose-400 mt-1 font-semibold block">
                          {validationErrors.tempPostalCode}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* FAMILY IDENTITY RECORD SECTION             */}
              {/* ========================================== */}
              <div className="bg-gray-950/40 p-5 rounded-2xl border border-gray-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-800/60 pb-2.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-black text-xs uppercase tracking-wider">
                    Family Lineage Profile *
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Father Details */}
                  <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl space-y-2">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase border-b border-gray-800 pb-1">
                      Father's Full Name
                    </span>
                    <div>
                      <label className="block text-gray-500 font-bold text-[10px] mb-0.5">
                        ENGLISH *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Anderson"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 font-bold text-[10px] mb-0.5">
                        NEPALI *
                      </label>
                      <input
                        type="text"
                        placeholder="उदाहारण: जोन एन्डरसन"
                        value={fatherNameNepali}
                        onChange={(e) => setFatherNameNepali(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Mother Details */}
                  <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl space-y-2">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase border-b border-gray-800 pb-1">
                      Mother's Full Name
                    </span>
                    <div>
                      <label className="block text-gray-500 font-bold text-[10px] mb-0.5">
                        ENGLISH *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mary Anderson"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 font-bold text-[10px] mb-0.5">
                        NEPALI *
                      </label>
                      <input
                        type="text"
                        placeholder="उदाहारण: मेरी एन्डरसन"
                        value={motherNameNepali}
                        onChange={(e) => setMotherNameNepali(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Grandfather Details */}
                  <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl space-y-2 md:col-span-2">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase border-b border-gray-800 pb-1">
                      Grandfather's Full Name
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-500 font-bold text-[10px] mb-0.5">
                          ENGLISH *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Robert Anderson"
                          value={grandfatherName}
                          onChange={(e) => setGrandfatherName(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-bold text-[10px] mb-0.5">
                          NEPALI *
                        </label>
                        <input
                          type="text"
                          placeholder="उदाहारण: रबर्ट एन्डरसन"
                          value={grandfatherNameNepali}
                          onChange={(e) =>
                            setGrandfatherNameNepali(e.target.value)
                          }
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Married Spouse Details */}
                {maritalStatus === "Married" && (
                  <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-3 animate-in fade-in duration-350">
                    <div className="text-[11px] text-rose-400 font-black uppercase flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>
                        Legally Married: Spouse and Spouse Lineage Registrations
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-800 space-y-2">
                        <span className="text-[9px] text-gray-400 font-bold block uppercase">
                          Spouse Name
                        </span>
                        <input
                          type="text"
                          placeholder="ENGLISH *"
                          value={spouseName}
                          onChange={(e) => setSpouseName(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                        <input
                          type="text"
                          placeholder="NEPALI *"
                          value={spouseNameNepali}
                          onChange={(e) => setSpouseNameNepali(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                      </div>

                      <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-800 space-y-2">
                        <span className="text-[9px] text-gray-400 font-bold block uppercase">
                          Spouse's Father Name
                        </span>
                        <input
                          type="text"
                          placeholder="ENGLISH"
                          value={spouseFatherName}
                          onChange={(e) => setSpouseFatherName(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                        <input
                          type="text"
                          placeholder="NEPALI"
                          value={spouseFatherNameNepali}
                          onChange={(e) =>
                            setSpouseFatherNameNepali(e.target.value)
                          }
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                      </div>

                      <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-800 space-y-2">
                        <span className="text-[9px] text-gray-400 font-bold block uppercase">
                          Spouse's Mother Name
                        </span>
                        <input
                          type="text"
                          placeholder="ENGLISH"
                          value={spouseMotherName}
                          onChange={(e) => setSpouseMotherName(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                        <input
                          type="text"
                          placeholder="NEPALI"
                          value={spouseMotherNameNepali}
                          onChange={(e) =>
                            setSpouseMotherNameNepali(e.target.value)
                          }
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNext}
                  disabled={isSavingStep}
                  className="flex items-center gap-1.5 bg-emerald-500 text-gray-950 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STEP 2: PROFILE PICTURE PHOTO                        */}
          {/* ==================================================== */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Camera className="w-4 h-4" />
                <span>2. Official Portrait Profile Photo</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Upload zone */}
                <div className="border-2 border-dashed border-gray-800 rounded-3xl p-6 text-center hover:border-emerald-500/60 transition-colors flex flex-col justify-center items-center h-65 bg-gray-950">
                  <Upload className="w-10 h-10 text-emerald-400 mb-3 animate-pulse" />
                  <span className="text-xs text-white font-extrabold uppercase">
                    Upload Profile Image
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-57.5 mx-auto">
                    Allowed formats: JPG or PNG. Maximum size constraint: 2 MB
                    limit.
                  </p>

                  <label className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-[10px] uppercase font-bold cursor-pointer transition-colors border border-gray-700 shadow-sm">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {profilePhotoName && (
                    <span className="text-[10px] font-mono text-emerald-400 mt-2 block">
                      {profilePhotoName}
                    </span>
                  )}
                </div>

                {/* Preview and Cropper Simulator */}
                <div className="bg-gray-950 rounded-3xl p-5 border border-gray-800 flex flex-col justify-center items-center h-90">
                  {profilePhoto ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="relative w-52 h-52 rounded-2xl overflow-hidden border-4 border-emerald-500 shadow-xl bg-gray-900 flex justify-center items-center">
                        <img
                          src={profilePhotoPreviewUrl || profilePhoto}
                          alt="Cropper preview"
                          onError={() => setProfilePhotoPreviewUrl("")}
                          style={{
                            transform: `scale(${cropConfig.zoom}) rotate(${cropConfig.rotate}deg)`,
                            transition: "all 0.15s ease-out",
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="w-full max-w-50 text-xs font-mono space-y-1.5 pt-1.5">
                        <div className="flex justify-between text-[9px] text-gray-400">
                          <span>Zoom: {cropConfig.zoom}x</span>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={cropConfig.zoom}
                            onChange={(e) =>
                              setCropConfig({
                                ...cropConfig,
                                zoom: Number(e.target.value),
                              })
                            }
                            className="w-24 accent-emerald-500"
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400">
                          <span>Rotate: {cropConfig.rotate}°</span>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={cropConfig.rotate}
                            onChange={(e) =>
                              setCropConfig({
                                ...cropConfig,
                                rotate: Number(e.target.value),
                              })
                            }
                            className="w-24 accent-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 font-mono text-xs p-4">
                      Portrait Preview will be rendered on successfully
                      importing.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isSavingStep || loading}
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSavingStep}
                  className="flex items-center gap-1.5 bg-emerald-500 text-gray-950 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STEP 3: CITIZENSHIP ID & SIGNATURE CARD              */}
          {/* ==================================================== */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4" />
                <span>
                  3. National Identity Card / Citizenship & Digital Signature
                  Seal
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono mb-2">
                {/* ID input */}
                <div className="md:col-span-3">
                  <label className="block text-gray-4000 font-bold uppercase mb-1">
                    Citizenship Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Registered citizenship number"
                    value={citizenshipNumber}
                    readOnly
                    className="w-full cursor-not-allowed bg-gray-950/70 border border-gray-800 rounded-xl px-3 py-2.5 text-gray-300 outline-none"
                  />
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-950/40 rounded-xl border border-gray-800/80">
                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1 text-[10px]">
                      Citizenship Type *
                    </label>
                    <select
                      value={citizenshipType}
                      onChange={(e) => setCitizenshipType(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-[11px]"
                    >
                      <option value="By Descent">By Descent</option>
                      <option value="By Birth">By Birth</option>
                      <option value="Naturalized">Naturalized</option>
                      <option value="Honorary">Honorary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1 text-[10px]">
                      Issue Date *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={citizenshipCalendar}
                        onChange={(e) =>
                          handleCitizenshipCalendarChange(
                            e.target.value as "AD" | "BS",
                          )
                        }
                        className="w-16 shrink-0 rounded-lg border border-gray-800 bg-gray-950 px-1.5 py-1 text-[11px] text-white outline-none focus:border-emerald-500"
                        aria-label="Issue date calendar"
                      >
                        <option value="AD">AD</option>
                        <option value="BS">BS</option>
                      </select>
                      <input
                        type={citizenshipCalendar === "AD" ? "date" : "text"}
                        value={
                          citizenshipCalendar === "AD"
                            ? citizenshipIssueDate
                            : citizenshipBsDate
                        }
                        onChange={(e) =>
                          handleCitizenshipIssueDateChange(e.target.value)
                        }
                        placeholder="YYYY-MM-DD"
                        pattern="\\d{4}-\\d{2}-\\d{2}"
                        className="min-w-0 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-2.5 py-1 text-[11px] text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="mt-1 text-[9px] font-mono text-gray-500">
                      {citizenshipCalendar === "AD"
                        ? citizenshipBsDate
                          ? `BS equivalent: ${citizenshipBsDate}`
                          : "Enter Gregorian date"
                        : citizenshipIssueDate
                          ? `AD equivalent: ${citizenshipIssueDate}`
                          : "Enter Bikram Sambat date"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1 text-[10px]">
                      Issuing District *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kathmandu"
                      value={citizenshipIssueDistrict}
                      onChange={(e) =>
                        setCitizenshipIssueDistrict(e.target.value)
                      }
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1 text-[10px]">
                      Issuing Authority *
                    </label>
                    <input
                      type="text"
                      value={citizenshipIssueAuthority}
                      onChange={(e) =>
                        setCitizenshipIssueAuthority(e.target.value)
                      }
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 auto-rows-fr">
                  <CitizenshipUploadPreview
                    label="Citizenship Front"
                    subtitle="Citizen ID"
                    description="Upload the front side of your citizenship document. Supported: PNG, JPG, JPEG, PDF. Max 10 MB."
                    fileUrl={citizenshipFrontImage}
                    fileName={citizenshipFrontFileName}
                    uploadedAt={citizenshipFrontUploadedAt}
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    maxSizeBytes={10 * 1024 * 1024}
                    accent="emerald"
                    onFileChange={(file) =>
                      handleCitizenshipFileUpload(file, "front")
                    }
                    onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleCitizenshipFileUpload(
                          e.dataTransfer.files[0],
                          "front",
                        );
                      }
                    }}
                    onDragOver={(e: React.DragEvent<HTMLDivElement>) =>
                      e.preventDefault()
                    }
                    onDragLeave={() => { }}
                    onRemove={() => {
                      setCitizenshipFrontImage("");
                      setCitizenshipFrontFileName("");
                      setCitizenshipFrontUploadedAt("");
                    }}
                  />

                  <CitizenshipUploadPreview
                    label="Citizenship Back"
                    subtitle="Citizen ID"
                    description="Upload the back side of your citizenship document. Supported: PNG, JPG, JPEG, PDF. Max 10 MB."
                    fileUrl={citizenshipBackImage}
                    fileName={citizenshipBackFileName}
                    uploadedAt={citizenshipBackUploadedAt}
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    maxSizeBytes={10 * 1024 * 1024}
                    accent="indigo"
                    onFileChange={(file) =>
                      handleCitizenshipFileUpload(file, "back")
                    }
                    onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleCitizenshipFileUpload(
                          e.dataTransfer.files[0],
                          "back",
                        );
                      }
                    }}
                    onDragOver={(e: React.DragEvent<HTMLDivElement>) =>
                      e.preventDefault()
                    }
                    onDragLeave={() => { }}
                    onRemove={() => {
                      setCitizenshipBackImage("");
                      setCitizenshipBackFileName("");
                      setCitizenshipBackUploadedAt("");
                    }}
                  />

                  <SignaturePad
                    signatureImage={signatureImage}
                    onSignatureChange={setSignatureImage}
                    onClear={() => setSignatureImage("")}
                    onError={(message) => triggerToast(message, true)}
                  />
                </div>
              </div>

              {/* ==================================================== */}
              {/* NATIONAL IDENTITY CARD (NID) ADDITIONAL PRODUCER    */}
              {/* ==================================================== */}
              <div className="bg-gray-950/40 p-5 rounded-2xl border border-gray-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-800/60 pb-2.5">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span className="text-white font-black text-xs uppercase tracking-wider">
                    National Identity (NID) Record Link *
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1">
                      NID Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NID-101-987"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                    {nidAvailabilityStatus.status === "checking" && (
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-medium text-amber-400">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Checking National ID availability...</span>
                      </div>
                    )}
                    {nidAvailabilityStatus.status === "available" && (
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>✔ National ID available</span>
                      </div>
                    )}
                    {nidAvailabilityStatus.status === "taken" && (
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-rose-400">
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        <span>
                          {nidAvailabilityStatus.message ||
                            "National ID already exists."}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase mb-1">
                      NID Issue Date *
                    </label>
                    <input
                      type="date"
                      value={nidIssueDate}
                      onChange={(e) => setNidIssueDate(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                {/* Upload NID photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* NID Front Upload */}
                  <div className="group relative overflow-hidden rounded-3xl border border-gray-800/80 bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_45px_-28px_rgba(0,0,0,0.8)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_50%)]" />
                    <div className="relative mb-3 flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400/90">
                          Front Side
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-white">
                          NID Card Front Image
                        </h4>
                      </div>
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                        <Upload className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {nidFrontImage ? (
                      <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-gray-800/80 bg-linear-to-br from-gray-900 via-gray-950 to-gray-900 shadow-inner">
                        <img
                          src={nidFrontImage}
                          alt="NID front preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/85 via-black/35 to-transparent px-3 py-2 text-[9px] uppercase tracking-[0.25em] text-gray-200">
                          <span>Preview</span>
                          <span>Tap to replace</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700/80 bg-linear-to-br from-gray-900/80 via-gray-950/70 to-gray-900/80 text-center text-[10px] text-gray-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <div className="mb-2 rounded-full border border-gray-700/70 bg-gray-800/70 p-2 text-gray-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-300">
                          Front side of your NID
                        </span>
                        <span className="mt-1 text-[9px] uppercase tracking-[0.25em] text-gray-600">
                          PNG / JPG / WEBP
                        </span>
                      </div>
                    )}

                    <label className="relative mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700/80 bg-gray-900/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-200 transition duration-200 hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-white">
                      <Upload className="h-3.5 w-3.5" />
                      Upload NID Front
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleNidChange(e, "front")}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* NID Back Upload */}
                  <div className="group relative overflow-hidden rounded-3xl border border-gray-800/80 bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_45px_-28px_rgba(0,0,0,0.8)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_50%)]" />
                    <div className="relative mb-3 flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-400/90">
                          Back Side
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-white">
                          NID Card Back Image
                        </h4>
                      </div>
                      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-400">
                        <Upload className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {nidBackImage ? (
                      <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-gray-800/80 bg-linear-to-br from-gray-900 via-gray-950 to-gray-900 shadow-inner">
                        <img
                          src={nidBackImage}
                          alt="NID back preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/85 via-black/35 to-transparent px-3 py-2 text-[9px] uppercase tracking-[0.25em] text-gray-200">
                          <span>Preview</span>
                          <span>Tap to replace</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700/80 bg-linear-to-br from-gray-900/80 via-gray-950/70 to-gray-900/80 text-center text-[10px] text-gray-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <div className="mb-2 rounded-full border border-gray-700/70 bg-gray-800/70 p-2 text-gray-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-300">
                          Back side of your NID
                        </span>
                        <span className="mt-1 text-[9px] uppercase tracking-[0.25em] text-gray-600">
                          PNG / JPG / WEBP
                        </span>
                      </div>
                    )}

                    <label className="relative mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700/80 bg-gray-900/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-200 transition duration-200 hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-white">
                      <Upload className="h-3.5 w-3.5" />
                      Upload NID Back
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleNidChange(e, "back")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <FingerprintCaptureCard
                leftPreview={fingerprintLeftImage}
                rightPreview={fingerprintRightImage}
                fingerprintImage={fingerprintImage}
                fingerprintCameraActive={fingerprintCameraActive}
                fingerprintVideoRef={fingerprintVideoRef}
                selectedSide={fingerprintCaptureSide}
                biometricStatus={fingerprintStatus}
                fingerprintMatchUser={fingerprintMatchUser}
                onSelectSide={setFingerprintCaptureSide}
                onCapture={(side) => startFingerprintTouchScan(side)}
                onCaptureFrame={captureFingerprintFromCamera}
                onUpload={(side, e) => handleFingerprintImageUpload(e, side)}
                onReset={() => {
                  setFingerprintImage("");
                  setFingerprintLeftImage("");
                  setFingerprintRightImage("");
                  setFingerprintStatus("idle");
                  setFingerprintMatchUser("");
                  stopFingerprintCamera();
                }}
              />

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isSavingStep || loading}
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSavingStep}
                  className="flex items-center gap-1.5 bg-emerald-500 text-gray-950 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STEP 4: BIOMETRIC SCANNER LIVENESS CHECK             */}
          {/* ==================================================== */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Camera className="w-4 h-4" />
                <span>4. Biometric Facemesh Contour Alignment Capture</span>
              </div>

              {/* Directly Render our majestic high-definition BiometricScanner! */}
              <div className="border border-gray-800 rounded-3xl overflow-hidden p-2 bg-gray-950">
                <Suspense
                  fallback={
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 text-sm text-slate-400 text-center">
                      Loading biometric camera module...
                    </div>
                  }
                >
                  <BiometricScanner
                    onCapture={(img, template) => {
                      setFaceImage(img);
                      setFaceTemplate(template || [0.1, 0.2, 0.3]);
                    }}
                    title="Onboarding Camera Portal"
                    subtitle="Synchronizes liveness markers on leftmost and rightmost eyes, nose and ears profiles."
                    mode="face-api"
                  />
                </Suspense>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isSavingStep || loading}
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSavingStep}
                  className="flex items-center gap-1.5 bg-emerald-500 text-gray-950 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STEP 5: FINAL PREVIEW & SECURE SAVE SEAL             */}
          {/* ==================================================== */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <FinalPreviewDashboard
                user={user}
                personal={personal}
                permCountry={permCountry}
                permProvince={permProvince}
                permDistrict={permDistrict}
                permMunicipality={permMunicipality}
                permWardNumber={permWardNumber}
                permTole={permTole}
                permStreetAddress={permStreetAddress}
                permPostalCode={permPostalCode}
                tempCountry={tempCountry}
                tempProvince={tempProvince}
                tempDistrict={tempDistrict}
                tempMunicipality={tempMunicipality}
                tempWardNumber={tempWardNumber}
                tempTole={tempTole}
                tempStreetAddress={tempStreetAddress}
                tempPostalCode={tempPostalCode}
                sameAsPermanent={sameAsPermanent}
                fullNameNepali={fullNameNepali}
                maritalStatus={maritalStatus}
                educationStatus={educationStatus}
                bloodGroup={bloodGroup}
                nationality={nationality}
                fatherName={fatherName}
                fatherNameNepali={fatherNameNepali}
                motherName={motherName}
                motherNameNepali={motherNameNepali}
                grandfatherName={grandfatherName}
                grandfatherNameNepali={grandfatherNameNepali}
                spouseName={spouseName}
                spouseNameNepali={spouseNameNepali}
                profilePhoto={profilePhoto}
                profilePhotoPreviewUrl={profilePhotoPreviewUrl}
                citizenshipNumber={citizenshipNumber}
                citizenshipType={citizenshipType}
                citizenshipIssueDate={citizenshipIssueDate}
                citizenshipCalendar={citizenshipCalendar}
                citizenshipBsDate={citizenshipBsDate}
                citizenshipIssueDistrict={citizenshipIssueDistrict}
                citizenshipIssueAuthority={citizenshipIssueAuthority}
                citizenshipFrontImage={citizenshipFrontImage}
                citizenshipBackImage={citizenshipBackImage}
                citizenshipFrontFileName={citizenshipFrontFileName}
                citizenshipBackFileName={citizenshipBackFileName}
                citizenshipFrontUploadedAt={citizenshipFrontUploadedAt}
                citizenshipBackUploadedAt={citizenshipBackUploadedAt}
                nidNumber={nidNumber}
                nidIssueDate={nidIssueDate}
                nidStatus={nidStatus}
                nidFrontImage={nidFrontImage}
                nidBackImage={nidBackImage}
                signatureImage={signatureImage}
                faceImage={faceImage}
                fingerprintImage={fingerprintImage}
                fingerprintLeftImage={fingerprintLeftImage}
                fingerprintRightImage={fingerprintRightImage}
                fingerprintStatus={fingerprintStatus}
                faceMatchPercent={98.4}
                fingerprintMatchPercent={
                  fingerprintStatus === "duplicate" ? 74.5 : 96.2
                }
                isCertified={isCertified}
                acceptLegal={acceptLegal}
                onBack={handlePrev}
                onEditProfile={handleEditProfile}
                onSubmit={handleSubmit}
                onToggleCertified={setIsCertified}
                onToggleLegal={setAcceptLegal}
                triggerToast={triggerToast}
                isLoading={loading}
                isSubmitted={isSubmitted}
              />
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STEP 6: REGISTRATION COMPLETE & DASHBOARD REDIRECT   */}
          {/* ==================================================== */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  Registration Complete
                </span>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  Voter Credentials Successfully Queued
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your electoral profile and biometric data have been securely saved and submitted for administrative review.
                </p>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const updatedUser = {
                      ...(user || {}),
                      ...(completedUser || {}),
                      isProfileComplete: true,
                    };
                    if (setCurrentPath) setCurrentPath("/votexDashboard");
                    onComplete(updatedUser);
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Go to Voter Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ----------------- DISCREPANCY & AUTO-CORRECTION CONTEXT MODAL ----------------- */}
      <AnimatePresence>
        {showDiscrepancyModal && (
          <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4 text-left overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-md font-black text-rose-400 uppercase tracking-wider">
                    Demographic Discrepancies Identified
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Security check scanned your Citizenship and National ID Card
                    variables. The following mismatches require resolution
                    before final signature seals.
                  </p>
                </div>
              </div>

              {/* Comparison list & table */}
              <div className="space-y-3 max-h-75 overflow-y-auto pr-1">
                {activeMismatches.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-950/65 rounded-xl border border-gray-800 p-3 text-xs font-mono space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-bold uppercase text-[10px] bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                        Field: {m.field}
                      </span>
                      <span className="text-rose-400 font-bold text-[9px] uppercase tracking-widest">
                        • MISMATCH DETECTED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10.5px]">
                      <div className="border-r border-gray-800/60 pr-2">
                        <span className="text-[8.5px] text-gray-500 uppercase block mb-0.5">
                          Citizenship Registry Value:
                        </span>
                        <p className="text-white font-extrabold line-through decoration-rose-500">
                          {m.citizenshipVal}
                        </p>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-indigo-400 uppercase block mb-0.5">
                          National ID Database Value:
                        </span>
                        <p className="text-gray-300 font-bold">{m.nidVal}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between gap-2 mt-1">
                      <div>
                        <span className="text-[8.5px] text-emerald-400 uppercase font-black block mb-0.5">
                          ⚡ Proposed Auto-Corrected uniform Value:
                        </span>
                        <p className="text-emerald-400 font-black text-sm">
                          {m.suggested}
                        </p>
                      </div>
                      <span className="bg-emerald-500/10 border border-emerald-500/30 text-[8.5px] text-emerald-400 uppercase font-black px-1.5 py-0.5 rounded">
                        100% Match Ratio
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-[10px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <p>
                  <strong>AUTO-RESOLVE RECOMMENDATION:</strong> Clicking{" "}
                  <strong>"Apply Suggestions (Recommended)"</strong> matches and
                  standardizes values automatically to ensure uniform
                  registration. Corrected fields will commit directly to the
                  voter database.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => {
                    // Apply suggested corrections automatically to components state variables
                    activeMismatches.forEach((m) => {
                      if (m.key === "fatherName") {
                        setFatherName(m.suggested);
                      } else if (m.key === "permWardNumber") {
                        setPermWardNumber(m.suggested);
                      }
                    });
                    setMismatchesResolved(true);
                    setShowDiscrepancyModal(false);
                    triggerToast(
                      "✅ Suggestions applied successfully! Press Save & Continue to proceed.",
                    );
                  }}
                  className="flex-1 bg-linear-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-gray-950 font-extrabold text-xs uppercase px-4 py-3 rounded-xl tracking-wider cursor-pointer shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4 text-gray-950" />
                  <span>Apply Suggestions (Recommended)</span>
                </button>
                <button
                  onClick={() => {
                    // Ignore suggestions and keep distinct / resolve as is
                    setMismatchesResolved(true);
                    setShowDiscrepancyModal(false);
                    triggerToast(
                      "Proceeding with existing entered credentials.",
                    );
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-extrabold text-xs uppercase px-4 py-3 rounded-xl tracking-wider cursor-pointer active:scale-[0.99] transition-all"
                >
                  Keep Distinct & Force Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
