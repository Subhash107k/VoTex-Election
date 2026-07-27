import React, { useState, useRef, useEffect } from "react";
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
  PenTool,
  RefreshCw,
  AlertTriangle,
  Heart,
  CreditCard,
  Users,
  BadgePlus,
  Fingerprint,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import BiometricScanner from "./BiometricScanner.tsx";
import SearchableSelect from "./SearchableSelect.tsx";
import ThemeToggle from "./ui/ThemeToggle.tsx";
import Stepper from "./ui/Stepper.tsx";
import { usePersistentTheme } from "../hooks/usePersistentTheme.ts";
import type { ThemeMode } from "../types/auth.ts";
import { COUNTRIES, NEPAL_ADDRESS_DATA } from "../data/nepalAddressData.ts";

interface CompleteProfileProps {
  token: string;
  user: any;
  onLogout: () => void;
  onComplete: (updatedUser: any) => void;
  theme?: ThemeMode;
  setTheme?: (theme: ThemeMode) => void;
}

export default function CompleteProfile({
  token,
  user,
  onLogout,
  onComplete,
  theme: propsTheme,
  setTheme: propsSetTheme,
}: CompleteProfileProps) {
  const { theme: localTheme, setTheme: localSetTheme } = usePersistentTheme();
  const currentTheme = propsTheme || localTheme;
  const setCurrentTheme = propsSetTheme || localSetTheme;
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4500);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4500);
    }
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

  const profileDobAge = personal.dob ? calculateAge(personal.dob) : null;
  const profileDobAgeMessage = personal.dob
    ? profileDobAge !== null && profileDobAge >= 18
      ? `Selected age: ${profileDobAge}. You may continue.`
      : `Underage: ${profileDobAge}. You must be at least 18 years old.`
    : "Must be at least 18 years old.";

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
        permProvince ? `${permProvince}` : "",
        permDistrict ? `${permDistrict} District` : "",
        permMunicipality ? `${permMunicipality}` : "",
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
        tempProvince ? `${tempProvince}` : "",
        tempDistrict ? `${tempDistrict} District` : "",
        tempMunicipality ? `${tempMunicipality}` : "",
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
  const [cropConfig, setCropConfig] = useState({ zoom: 1, rotate: 0 });
  const [profilePhotoName, setProfilePhotoName] = useState("");

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
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ----------------------------------------------------
  // STEP 3 FIELDS: CITIZENSHIP CARD & DIGITAL SIGNATURE
  // ----------------------------------------------------
  const [citizenshipNumber, setCitizenshipNumber] = useState("");
  const [citizenshipNumberAutoFilled, setCitizenshipNumberAutoFilled] =
    useState(false);
  const [citizenshipFrontImage, setCitizenshipFrontImage] =
    useState<string>("");
  const [citizenshipBackImage, setCitizenshipBackImage] = useState<string>("");
  const [signatureImage, setSignatureImage] = useState<string>("");

  // New Demographic Family and NID Fields State:
  const [fullNameNepali, setFullNameNepali] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [educationStatus, setEducationStatus] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [nationality, setNationality] = useState("Nepali");

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
  const [citizenshipIssueDateAutoFilled, setCitizenshipIssueDateAutoFilled] =
    useState(false);
  const [citizenshipIssueDistrict, setCitizenshipIssueDistrict] = useState("");
  const [citizenshipIssueAuthority, setCitizenshipIssueAuthority] = useState(
    "District Administration Office",
  );

  const [nidNumber, setNidNumber] = useState("");
  const [nidIssueDate, setNidIssueDate] = useState("");
  const [nidStatus, setNidStatus] = useState("Approved");
  const [nidFrontImage, setNidFrontImage] = useState<string>("");
  const [nidBackImage, setNidBackImage] = useState<string>("");

  // Fingerprint Registration states and simulator
  const [fingerprintImage, setFingerprintImage] = useState<string>("");
  const [isFingerprinting, setIsFingerprinting] = useState<boolean>(false);
  const [fingerprintProgress, setFingerprintProgress] = useState<number>(0);
  const [fingerprintLogs, setFingerprintLogs] = useState<string[]>([]);
  const [fingerprintStatus, setFingerprintStatus] = useState<
    "idle" | "checking" | "clear" | "duplicate"
  >("idle");
  const [fingerprintMatchUser, setFingerprintMatchUser] = useState<string>("");
  const [fingerprintCaptureMode, setFingerprintCaptureMode] = useState<
    "camera" | "upload" | "hardware"
  >("camera");
  const [platformBiometricsAvailable, setPlatformBiometricsAvailable] =
    useState<boolean | null>(null);
  const [externalSensorDetected, setExternalSensorDetected] =
    useState<boolean>(false);
  const [fingerprintCameraActive, setFingerprintCameraActive] = useState(false);
  const fingerprintIntervalRef = useRef<any>(null);
  const fingerprintInputRef = useRef<HTMLInputElement | null>(null);
  const fingerprintVideoRef = useRef<HTMLVideoElement | null>(null);
  const fingerprintStreamRef = useRef<MediaStream | null>(null);

  const FINGERPRINT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  const estimateBase64Size = (dataUrl: string) => {
    try {
      const base64 = dataUrl.split(",")[1] || "";
      const padding = (base64.match(/=+$/) || [""])[0].length;
      return Math.ceil((base64.length * 3) / 4) - padding;
    } catch (e) {
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
    // 1. Detection of high-precision Windows / platform credential capability
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setPlatformBiometricsAvailable(available);
          if (available) {
            setFingerprintLogs((prev) => [
              ...prev,
              "✔ Platform Biometric Authenticator is verified & active (Windows Hello/Touch ID/FaceID).",
            ]);
          } else {
            setFingerprintLogs((prev) => [
              ...prev,
              "ℹ platform security key/biometric module returned idle status.",
            ]);
          }
        })
        .catch(() => {
          setPlatformBiometricsAvailable(false);
          setFingerprintLogs((prev) => [
            ...prev,
            "ℹ Local host platform biometrics module restricted.",
          ]);
        });
    } else {
      setPlatformBiometricsAvailable(false);
      setFingerprintLogs((prev) => [
        ...prev,
        "ℹ WebAuthn Biometrics API unsupported in current iframe sandbox.",
      ]);
    }

    // 2. Detection of external USB or FIDO security keys
    if (navigator.credentials) {
      setExternalSensorDetected(true);
      setFingerprintLogs((prev) => [
        ...prev,
        "✔ Multi-device FIDO/WebAuthn USB keys and external biometrics drivers identified.",
      ]);
    }

    return () => {
      if (fingerprintIntervalRef.current)
        clearInterval(fingerprintIntervalRef.current);
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
    setFingerprintLogs((prev) => [
      ...prev,
      "🔎 Comparing the fresh fingerprint capture with existing voter records...",
    ]);

    try {
      const response = await fetch("/api/fingerprint/validate", {
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
        setFingerprintLogs((prev) => [
          ...prev,
          `⚠️ Duplicate biometric match detected for ${data.matchedUser?.fullName || "an existing voter"}.`,
        ]);
        triggerToast(
          `Fingerprint already linked to ${data.matchedUser?.fullName || "an existing voter"}. Please use another finger or contact support.`,
          true,
        );
      } else {
        setFingerprintStatus("clear");
        setFingerprintMatchUser("");
        setFingerprintLogs((prev) => [
          ...prev,
          "✔ Fingerprint image is unique and clear for voter registration.",
        ]);
      }
    } catch (error) {
      setFingerprintStatus("clear");
      setFingerprintLogs((prev) => [
        ...prev,
        "⚠️ Duplicate fingerprint check could not be completed. Proceeding with manual review.",
      ]);
    }
  };

  const startFingerprintTouchScan = async () => {
    if (fingerprintImage || isFingerprinting) return;

    setIsFingerprinting(true);
    setFingerprintProgress(0);
    setFingerprintLogs((prev) => [
      ...prev,
      "[CAMERA READY]: Opening a live camera preview for a clean dual-finger capture...",
    ]);

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
      setFingerprintCaptureMode("camera");
      setFingerprintLogs((prev) => [
        ...prev,
        "📹 Live camera preview is active. Align both fingers in the frame for a clear capture.",
      ]);
    } catch (error: any) {
      setIsFingerprinting(false);
      setFingerprintLogs((prev) => [
        ...prev,
        `⚠️ Camera preview could not open (${error.message || "permission denied"}). Please use upload instead.`,
      ]);
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
    setFingerprintImage(imageData);
    setFingerprintProgress(100);
    setFingerprintLogs((prev) => [
      ...prev,
      "📸 Fingerprint image captured from the live camera view and queued for verification.",
    ]);
    stopFingerprintCamera();
    await validateFingerprintImage(imageData);
  };

  const cancelFingerprintScan = () => {
    if (fingerprintIntervalRef.current) {
      clearInterval(fingerprintIntervalRef.current);
      fingerprintIntervalRef.current = null;
    }
    stopFingerprintCamera();
    setFingerprintProgress(0);
    setFingerprintLogs((prev) => [
      ...prev,
      "✖ Scan cancelled by user. Biometric verification resets.",
    ]);
  };

  const handleFingerprintImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
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
            setFingerprintLogs((prev) => [
              ...prev,
              "⚙️ Uploaded fingerprint image was large and was automatically compressed.",
            ]);
          } else {
            return triggerToast(
              `Uploaded fingerprint image exceeds ${Math.round(
                FINGERPRINT_MAX_BYTES / 1024 / 1024,
              )} MB and could not be compressed.`,
              true,
            );
          }
        }

        setFingerprintImage(imageData);
        setFingerprintCaptureMode("upload");
        setIsFingerprinting(false);
        setFingerprintProgress(100);
        setFingerprintLogs((prev) => [
          ...prev,
          "📷 Fingerprint image uploaded from the device camera or gallery and queued for verification.",
        ]);
        await validateFingerprintImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom function to process uploaded signature file
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return triggerToast("Signature file must be less than 2 MB.", true);
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSignatureImage(base64);

        // Also render drawing representation onto signature canvas context on next tick
        if (sigCanvasRef.current) {
          const canvas = sigCanvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const img = new Image();
            img.onload = () => {
              const ratio = Math.min(
                (canvas.width - 20) / img.width,
                (canvas.height - 20) / img.height,
              );
              const nw = img.width * ratio;
              const nh = img.height * ratio;
              const x = (canvas.width - nw) / 2;
              const y = (canvas.height - nh) / 2;
              // Make canvas background dark and draw white signature image, or draw directly
              ctx.drawImage(img, x, y, nw, nh);
            };
            img.src = base64;
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature PAD Canvas drawing
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (step === 3 && sigCanvasRef.current) {
      const canvas = sigCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
      }
    }
  }, [step]);

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!sigCanvasRef.current) return;
    setIsDrawing(true);
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      ctx.moveTo(clientX - rect.left, clientY - rect.top);
    }
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing || !sigCanvasRef.current) return;
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      ctx.lineTo(clientX - rect.left, clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Save drawn canvas state as base64
    if (sigCanvasRef.current) {
      setSignatureImage(sigCanvasRef.current.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      const canvas = sigCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureImage("");
      }
    }
  };

  const normalizeCitizenshipNumber = (value: string) => {
    const match = value.match(/[A-Za-z]{1,3}-\d{2,6}-\d{2,6}/);
    return match ? match[0].toUpperCase() : value.trim();
  };

  const normalizeIssueDate = (value: string) => {
    const dateMatch = value.match(
      /\b(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4})\b/,
    );
    if (!dateMatch) return "";
    const raw = dateMatch[0];
    if (/^\d{4}[-\/]/.test(raw)) {
      return raw.replace(/\//g, "-");
    }
    const [day, month, year] = raw.split(/[-\/]/);
    if (!day || !month || !year) return "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const parseCitizenshipFileHints = (fileName: string) => {
    const normalized = fileName.replace(/[_\s]+/g, " ");
    return {
      number: normalizeCitizenshipNumber(normalized),
      issueDate: normalizeIssueDate(normalized),
    };
  };

  const handleCitizenshipNumberChange = (value: string) => {
    const parsedNumber = normalizeCitizenshipNumber(value);
    const parsedDate = normalizeIssueDate(value);
    setCitizenshipNumber(parsedNumber);
    if (
      parsedDate &&
      (!citizenshipIssueDate || citizenshipIssueDateAutoFilled)
    ) {
      setCitizenshipIssueDate(parsedDate);
      setCitizenshipIssueDateAutoFilled(true);
    }
    if (!parsedDate && citizenshipIssueDateAutoFilled) {
      setCitizenshipIssueDateAutoFilled(false);
    }
  };

  const handleDocumentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return triggerToast("Document file must be less than 2 MB.", true);
      }

      const hints = parseCitizenshipFileHints(file.name);
      if (hints.number && !citizenshipNumber) {
        setCitizenshipNumber(hints.number);
        setCitizenshipNumberAutoFilled(true);
      }
      if (
        hints.issueDate &&
        (!citizenshipIssueDate || citizenshipIssueDateAutoFilled)
      ) {
        setCitizenshipIssueDate(hints.issueDate);
        setCitizenshipIssueDateAutoFilled(true);
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (side === "front") setCitizenshipFrontImage(reader.result as string);
        else setCitizenshipBackImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ----------------------------------------------------
  // STEP 4 FIELDS: FACE BIOMETRICS
  // ----------------------------------------------------
  const [faceImage, setFaceImage] = useState<string>("");
  const [faceTemplate, setFaceTemplate] = useState<number[] | null>(null);

  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [activeMismatches, setActiveMismatches] = useState<any[]>([]);
  const [mismatchesResolved, setMismatchesResolved] = useState(false);
  const [mismatchResolvingOption, setMismatchResolvingOption] =
    useState<string>("");

  const serializeStates = () => {
    return {
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
      profilePhotoName,
      cropConfig,
      citizenshipNumber,
      citizenshipNumberAutoFilled,
      citizenshipType,
      citizenshipIssueDate,
      citizenshipIssueDateAutoFilled,
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
      faceImage,
      faceTemplate,
    };
  };

  const deserializeStates = (data: any) => {
    if (!data) return;
    if (data.personal) setPersonal(data.personal);
    if (data.permCountry !== undefined) setPermCountry(data.permCountry);
    if (data.permProvince !== undefined) setPermProvince(data.permProvince);
    if (data.permDistrict !== undefined) setPermDistrict(data.permDistrict);
    if (data.permMunicipality !== undefined)
      setPermMunicipality(data.permMunicipality);
    if (data.permWardNumber !== undefined)
      setPermWardNumber(data.permWardNumber);
    if (data.permTole !== undefined) setPermTole(data.permTole);
    if (data.permStreetAddress !== undefined)
      setPermStreetAddress(data.permStreetAddress);
    if (data.permPostalCode !== undefined)
      setPermPostalCode(data.permPostalCode);
    if (data.permCountryOther !== undefined)
      setPermCountryOther(data.permCountryOther);
    if (data.sameAsPermanent !== undefined)
      setSameAsPermanent(data.sameAsPermanent);
    if (data.tempCountry !== undefined) setTempCountry(data.tempCountry);
    if (data.tempProvince !== undefined) setTempProvince(data.tempProvince);
    if (data.tempDistrict !== undefined) setTempDistrict(data.tempDistrict);
    if (data.tempMunicipality !== undefined)
      setTempMunicipality(data.tempMunicipality);
    if (data.tempWardNumber !== undefined)
      setTempWardNumber(data.tempWardNumber);
    if (data.tempTole !== undefined) setTempTole(data.tempTole);
    if (data.tempStreetAddress !== undefined)
      setTempStreetAddress(data.tempStreetAddress);
    if (data.tempPostalCode !== undefined)
      setTempPostalCode(data.tempPostalCode);
    if (data.tempCountryOther !== undefined)
      setTempCountryOther(data.tempCountryOther);

    if (data.fullNameNepali !== undefined)
      setFullNameNepali(data.fullNameNepali);
    if (data.maritalStatus !== undefined) setMaritalStatus(data.maritalStatus);
    if (data.educationStatus !== undefined)
      setEducationStatus(data.educationStatus);
    if (data.bloodGroup !== undefined) setBloodGroup(data.bloodGroup);
    if (data.nationality !== undefined) setNationality(data.nationality);
    if (data.fatherName !== undefined) setFatherName(data.fatherName);
    if (data.fatherNameNepali !== undefined)
      setFatherNameNepali(data.fatherNameNepali);
    if (data.motherName !== undefined) setMotherName(data.motherName);
    if (data.motherNameNepali !== undefined)
      setMotherNameNepali(data.motherNameNepali);
    if (data.grandfatherName !== undefined)
      setGrandfatherName(data.grandfatherName);
    if (data.grandfatherNameNepali !== undefined)
      setGrandfatherNameNepali(data.grandfatherNameNepali);
    if (data.spouseName !== undefined) setSpouseName(data.spouseName);
    if (data.spouseNameNepali !== undefined)
      setSpouseNameNepali(data.spouseNameNepali);
    if (data.spouseFatherName !== undefined)
      setSpouseFatherName(data.spouseFatherName);
    if (data.spouseFatherNameNepali !== undefined)
      setSpouseFatherNameNepali(data.spouseFatherNameNepali);
    if (data.spouseMotherName !== undefined)
      setSpouseMotherName(data.spouseMotherName);
    if (data.spouseMotherNameNepali !== undefined)
      setSpouseMotherNameNepali(data.spouseMotherNameNepali);

    if (data.profilePhoto !== undefined) setProfilePhoto(data.profilePhoto);
    if (data.profilePhotoName !== undefined)
      setProfilePhotoName(data.profilePhotoName);
    if (data.cropConfig !== undefined) setCropConfig(data.cropConfig);

    if (data.citizenshipNumber !== undefined) {
      setCitizenshipNumber(data.citizenshipNumber);
      setCitizenshipNumberAutoFilled(false);
    }
    if (data.citizenshipType !== undefined)
      setCitizenshipType(data.citizenshipType);
    if (data.citizenshipIssueDate !== undefined) {
      setCitizenshipIssueDate(data.citizenshipIssueDate);
      setCitizenshipIssueDateAutoFilled(false);
    }
    if (data.citizenshipIssueDistrict !== undefined)
      setCitizenshipIssueDistrict(data.citizenshipIssueDistrict);
    if (data.citizenshipIssueAuthority !== undefined)
      setCitizenshipIssueAuthority(data.citizenshipIssueAuthority);
    if (data.citizenshipFrontImage !== undefined)
      setCitizenshipFrontImage(data.citizenshipFrontImage);
    if (data.citizenshipBackImage !== undefined)
      setCitizenshipBackImage(data.citizenshipBackImage);

    if (data.nidNumber !== undefined) setNidNumber(data.nidNumber);
    if (data.nidIssueDate !== undefined) setNidIssueDate(data.nidIssueDate);
    if (data.nidStatus !== undefined) setNidStatus(data.nidStatus);
    if (data.nidFrontImage !== undefined) setNidFrontImage(data.nidFrontImage);
    if (data.nidBackImage !== undefined) setNidBackImage(data.nidBackImage);

    if (data.signatureImage !== undefined)
      setSignatureImage(data.signatureImage);
    if (data.fingerprintImage !== undefined)
      setFingerprintImage(data.fingerprintImage);
    if (data.faceImage !== undefined) setFaceImage(data.faceImage);
    if (data.faceTemplate !== undefined) setFaceTemplate(data.faceTemplate);
  };

  // Draft persistence has been disabled entirely for this workflow.

  // 4. Real-time USB connect/disconnect event listener simulation
  useEffect(() => {
    if (typeof navigator !== "undefined" && "usb" in navigator) {
      const handleConnect = (e: any) => {
        setExternalSensorDetected(true);
        setFingerprintLogs((prev) => [
          ...prev,
          `🔌 External Fingerprint Sensor connected: ${e?.device?.productName || "SecuGen Hamster Pro 20"}`,
        ]);
      };
      const handleDisconnect = () => {
        setExternalSensorDetected(false);
        setFingerprintLogs((prev) => [
          ...prev,
          "❌ External USB Fingerprint Sensor disconnected.",
        ]);
      };
      (navigator as any).usb.addEventListener("connect", handleConnect);
      (navigator as any).usb.addEventListener("disconnect", handleDisconnect);

      return () => {
        (navigator as any).usb.removeEventListener("connect", handleConnect);
        (navigator as any).usb.removeEventListener(
          "disconnect",
          handleDisconnect,
        );
      };
    }
  }, []);

  const checkMismatches = () => {
    const list = [];
    if (mismatchesResolved) {
      return [];
    }

    // A. Full name comparison vs. mock NID Registry scanned data
    const expectedNidName = user?.fullName
      ? user.fullName.includes("Anderson")
        ? "Thomas A. Anderson"
        : user.fullName
      : "Thomas Anderson";
    if (user?.fullName && user.fullName !== expectedNidName) {
      list.push({
        field: "Voter Full Name",
        citizenshipVal: user.fullName,
        nidVal: expectedNidName,
        suggested: user.fullName,
        key: "fullName",
      });
    }

    // B. Father's Name
    if (fatherName) {
      const expectedNidFather = fatherName.endsWith("Sr.")
        ? fatherName
        : fatherName + " Sr.";
      if (fatherName !== expectedNidFather) {
        list.push({
          field: "Father's Legal Name",
          citizenshipVal: fatherName,
          nidVal: expectedNidFather,
          suggested: fatherName,
          key: "fatherName",
        });
      }
    }

    // C. Permanent Ward Number
    if (permWardNumber) {
      const wrongWard = String(parseInt(permWardNumber) + 1);
      if (permWardNumber !== wrongWard) {
        list.push({
          field: "Permanent Ward Number",
          citizenshipVal: permWardNumber,
          nidVal: wrongWard,
          suggested: permWardNumber,
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
      if (!citizenshipNumber) {
        return triggerToast(
          "Citizenship/National Identification ID Number is mandatory.",
          true,
        );
      }
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
      if (!fingerprintImage) {
        return triggerToast(
          "Fingerprint biometric registration is required. Please touch & scan.",
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

    // Save & Continue Action: draft persistence removed, proceed directly.
    setIsSavingStep(true);
    const nextStepVal = step + 1;
    setStep(nextStepVal);
    triggerToast("✅ Profile progress advanced.");
    setIsSavingStep(false);
  };

  const handlePrev = () => {
    setStep((s) => s - 1);
  };

  // ----------------------------------------------------
  // SUBMIT HANDLER: TRANSMITS COMBINED DOCUMENTS TO SIMULATED MONGO
  // ----------------------------------------------------
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const payload = {
        dob: personal.dob,
        gender: personal.gender,
        fingerprintImage,
        fingerprintCaptureMethod:
          platformBiometricsAvailable &&
          typeof window !== "undefined" &&
          !!window.PublicKeyCredential
            ? "platform-authenticator"
            : externalSensorDetected
              ? "external-sensor"
              : "mobile-fallback",
        permanentAddress: personal.permanentAddress,
        temporaryAddress: personal.temporaryAddress,
        province: personal.province,
        district: personal.district,
        municipality: personal.municipality,
        wardNumber: personal.wardNumber,
        postalCode: personal.postalCode,
        occupation: personal.occupation,
        profilePhoto,
        citizenshipFrontImage,
        citizenshipBackImage,
        citizenshipNumber,
        signatureImage,
        faceImage,
        faceTemplate,
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
        citizenshipType,
        citizenshipIssueDate,
        citizenshipIssueDistrict,
        citizenshipIssueAuthority,
        nidNumber,
        nidIssueDate,
        nidStatus,
        nidFrontImage,
        nidBackImage,

        // Separate location subfield entries saved in DB securely
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

      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profile completion submission failed.");
      }

      triggerToast(
        "Democratic voter profile finalized! Security seal compiled.",
      );

      // Navigate to step 6 (Success confirmation page)
      setStep(6);
      setTimeout(() => {
        onComplete(data.user);
      }, 3500);
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[var(--surface-page)] text-[var(--text-primary)] flex flex-col justify-center py-10 px-4 md:px-8 relative transition-colors">
      {/* Toast elements */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 border border-emerald-500 font-medium text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span className="text-xs">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 border border-red-500 font-medium text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-xs">{errorMsg}</span>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl text-left relative transition-colors">
        {/* Custom Header with Theme Toggle & Logout option */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--border-subtle)] pb-5 gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 dark:text-emerald-400 uppercase">
              Republic Voter Portal Onboarding
            </span>
            <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mt-1 uppercase tracking-tight">
              Complete Your Identity Profile
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Dear{" "}
              <strong className="text-[var(--text-primary)]">
                {user?.fullName}
              </strong>
              , provide validated coordinates to secure your democratic profile.
            </p>
            </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={currentTheme} setTheme={setCurrentTheme} />
            <button
              onClick={onLogout}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-rose-500/20 transition-colors cursor-pointer"
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
              exit={{ opacity: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <User className="w-4 h-4" />
                <span>1. Personal Registry Demographics</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-[var(--text-secondary)] font-bold uppercase mb-1 text-[11px] tracking-wide flex items-center justify-between">
                    <span>Gender Identification *</span>
                    {isGenderLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-mono">
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
                    className="w-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-[var(--text-primary)] outline-none focus:border-emerald-500 min-h-[42px] text-xs disabled:cursor-not-allowed disabled:opacity-75 transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-bold uppercase mb-1 text-[11px] tracking-wide flex items-center justify-between">
                    <span>Date of Birth (registry) *</span>
                    {isDobLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-mono">
                        <Lock className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    {isDobLocked ? (
                      <div className="w-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-xl px-9 py-2 text.xs text-[var(--text-primary)] font-bold min-h-[42px] flex items-center justify-between">
                        <span>{personal.dob}</span>
                        {personal.dob && (
                          <span className="text-[11px] font-normal text-emerald-500 dark:text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
                        className="w-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-xl px-9 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-emerald-500 min-h-[42px] transition-colors"
                      />
                    )}
                  </div>
                  {isDobLocked && (
                    <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                      Date of Birth was verified during registration and locked
                      for audit protection.
                    </p>
                  )}
                  {!isDobLocked && personal.dob && (
                    <p className="mt-1 text-[10px] text-emerald-500 font-mono font-bold">
                      Selected age: {calculateAge(personal.dob)} years.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-bold uppercase mb-1 text-[11px] tracking-wide flex items-center justify-between">
                    <span>Occupation / Profession</span>
                    {isOccupationLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-mono">
                        <Lock className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    {isOccupationLocked ? (
                      <div className="w-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-xl px-9 py-2 text-xs text-[var(--text-primary)] font-bold min-h-[42px] flex items-center">
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
                        className="w-full bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-xl px-9 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-emerald-500 min-h-[42px] transition-colors"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Extended Family & Lineage Profile section */}
              <div className="bg-[var(--surface-muted)]/50 p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
                <div className="text-xs text-emerald-500 dark:text-emerald-400 font-extrabold uppercase tracking-wider border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
                  <BadgePlus className="w-4 h-4" />
                  <span>Extended Voter Demographics</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold uppercase mb-1 text-[11px]">
                      Full Name (English)
                    </label>
                    <div className="w-full min-h-[42px] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-xs text-[var(--text-primary)] font-bold flex items-center">
                      {user?.fullName || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      Full Name (Nepali - unicode) *
                    </label>
                    <input
                      type="text"
                      placeholder="उदाहारण: थोमस एन्डरसन"
                      value={fullNameNepali}
                      onChange={(e) => setFullNameNepali(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      Marital Status *
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 h-[34px]"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      Highest Educational Qualification
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bachelor in Science"
                      value={educationStatus}
                      onChange={(e) => setEducationStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 h-[34px]"
                    >
                      <option value="">Select Blood Group (Optional)</option>
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
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="e.g. Nepali"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* ========================================== */}
              {/* PERMANENT ADDRESS SECTION                  */}
              {/* ========================================== */}
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-black text-xs uppercase tracking-wider">
                    Permanent Residential Address *
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="w-full bg-slate-950 border rounded-xl px-3 py-3 text-white flex items-center justify-between min-h-[38px] border-slate-800">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-300">
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
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Ward Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3"
                        maxLength={3}
                        value={permWardNumber}
                        onChange={(e) => setPermWardNumber(e.target.value)}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.permWardNumber
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.permWardNumber && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.permWardNumber}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Tole / Street Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. New Baneshwor"
                        value={permTole}
                        onChange={(e) => setPermTole(e.target.value)}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.permTole
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.permTole && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.permTole}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* If selected Permanent Country in Onboarding is outside Nepal */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        State / Province / Region *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. California"
                        value={permProvince}
                        onChange={(e) => setPermProvince(e.target.value)}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.permProvince
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.permProvince && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.permProvince}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Los Angeles"
                        value={permMunicipality}
                        onChange={(e) => setPermMunicipality(e.target.value)}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.permMunicipality
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.permMunicipality && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.permMunicipality}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 104 Pine Street, Apt 4"
                        value={permStreetAddress}
                        onChange={(e) => setPermStreetAddress(e.target.value)}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.permStreetAddress
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.permStreetAddress && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.permStreetAddress}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        ZIP / Postal Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 90210"
                        value={permPostalCode}
                        onChange={(e) => setPermPostalCode(e.target.value)}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.permPostalCode
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.permPostalCode && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
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
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 hover:border-emerald-500/40 transition-colors">
                <input
                  type="checkbox"
                  id="sameAsPermanent"
                  checked={sameAsPermanent}
                  onChange={(e) => setSameAsPermanent(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-emerald-500 bg-slate-900 border-slate-700 outline-none focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                />
                <div
                  className="select-none cursor-pointer"
                  onClick={() => setSameAsPermanent(!sameAsPermanent)}
                >
                  <span className="text-xs font-black text-white block uppercase tracking-wider">
                    Same as Permanent Address
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Automatically syncs and locks temporary address fields as
                    identical to permanent coordinates.
                  </span>
                </div>
              </div>

              {/* ========================================== */}
              {/* TEMPORARY ADDRESS SECTION                  */}
              {/* ========================================== */}
              <div
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  sameAsPermanent
                    ? "bg-slate-900/30 border-dashed border-slate-800/60 opacity-60 relative"
                    : "bg-slate-950/40 border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
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
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Specify Country Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter country name"
                        value={tempCountryOther}
                        onChange={(e) => setTempCountryOther(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.tempCountryOther
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.tempCountryOther && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
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
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Ward Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3"
                        maxLength={3}
                        value={tempWardNumber}
                        onChange={(e) => setTempWardNumber(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.tempWardNumber
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.tempWardNumber && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.tempWardNumber}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Tole / Street Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sanepa"
                        value={tempTole}
                        onChange={(e) => setTempTole(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.tempTole
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.tempTole && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.tempTole}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* If selected Temporary Country in Onboarding is outside Nepal */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        State / Province / Region *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. California"
                        value={tempProvince}
                        onChange={(e) => setTempProvince(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.tempProvince
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.tempProvince && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.tempProvince}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Los Angeles"
                        value={tempMunicipality}
                        onChange={(e) => setTempMunicipality(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.tempMunicipality
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.tempMunicipality && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.tempMunicipality}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 104 Pine Street, Apt 4"
                        value={tempStreetAddress}
                        onChange={(e) => setTempStreetAddress(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.tempStreetAddress
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.tempStreetAddress && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
                          {validationErrors.tempStreetAddress}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
                        ZIP / Postal Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 90210"
                        value={tempPostalCode}
                        onChange={(e) => setTempPostalCode(e.target.value)}
                        disabled={sameAsPermanent}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] ${
                          validationErrors.tempPostalCode
                            ? "border-rose-500"
                            : "border-slate-800 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors.tempPostalCode && (
                        <span className="text-[10px] text-rose-450 mt-1 font-semibold block">
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
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-black text-xs uppercase tracking-wider">
                    Family Lineage Profile *
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Father Details */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase border-b border-slate-800 pb-1">
                      Father's Full Name
                    </span>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] mb-0.5">
                        ENGLISH *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Anderson"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] mb-0.5">
                        NEPALI *
                      </label>
                      <input
                        type="text"
                        placeholder="उदाहारण: जोन एन्डरसन"
                        value={fatherNameNepali}
                        onChange={(e) => setFatherNameNepali(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Mother Details */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase border-b border-slate-800 pb-1">
                      Mother's Full Name
                    </span>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] mb-0.5">
                        ENGLISH *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mary Anderson"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] mb-0.5">
                        NEPALI *
                      </label>
                      <input
                        type="text"
                        placeholder="उदाहारण: मेरी एन्डरसन"
                        value={motherNameNepali}
                        onChange={(e) => setMotherNameNepali(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-855 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Grandfather Details */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 md:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase border-b border-slate-800 pb-1">
                      Grandfather's Full Name
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold text-[10px] mb-0.5">
                          ENGLISH *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Robert Anderson"
                          value={grandfatherName}
                          onChange={(e) => setGrandfatherName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold text-[10px] mb-0.5">
                          NEPALI *
                        </label>
                        <input
                          type="text"
                          placeholder="उदाहारण: रबर्ट एन्डरसन"
                          value={grandfatherNameNepali}
                          onChange={(e) =>
                            setGrandfatherNameNepali(e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-white outline-none focus:border-purple-400"
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
                      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 space-y-2">
                        <span className="text-[9px] text-slate-450 font-bold block uppercase">
                          Spouse Name
                        </span>
                        <input
                          type="text"
                          placeholder="ENGLISH *"
                          value={spouseName}
                          onChange={(e) => setSpouseName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                        <input
                          type="text"
                          placeholder="NEPALI *"
                          value={spouseNameNepali}
                          onChange={(e) => setSpouseNameNepali(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                      </div>

                      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 space-y-2">
                        <span className="text-[9px] text-slate-450 font-bold block uppercase">
                          Spouse's Father Name
                        </span>
                        <input
                          type="text"
                          placeholder="ENGLISH"
                          value={spouseFatherName}
                          onChange={(e) => setSpouseFatherName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                        <input
                          type="text"
                          placeholder="NEPALI"
                          value={spouseFatherNameNepali}
                          onChange={(e) =>
                            setSpouseFatherNameNepali(e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                      </div>

                      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 space-y-2">
                        <span className="text-[9px] text-slate-450 font-bold block uppercase">
                          Spouse's Mother Name
                        </span>
                        <input
                          type="text"
                          placeholder="ENGLISH"
                          value={spouseMotherName}
                          onChange={(e) => setSpouseMotherName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
                        />
                        <input
                          type="text"
                          placeholder="NEPALI"
                          value={spouseMotherNameNepali}
                          onChange={(e) =>
                            setSpouseMotherNameNepali(e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-white outline-none text-[11px] focus:border-rose-400"
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
                  className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Saving Draft...</span>
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
              exit={{ opacity: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Camera className="w-4 h-4" />
                <span>2. Official Portrait Profile Photo</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Upload zone */}
                <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-3xl p-6 text-center hover:border-emerald-500/60 transition-colors flex flex-col justify-center items-center h-[260px] bg-[var(--surface-muted)]">
                  <Upload className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mb-3 animate-pulse" />
                  <span className="text-xs text-[var(--text-primary)] font-extrabold uppercase">
                    Upload Profile Image
                  </span>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1 max-w-[230px] mx-auto">
                    Allowed formats: JPG or PNG. Maximum size constraint: 2 MB
                    limit.
                  </p>

                  <label className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] uppercase font-bold cursor-pointer transition-colors border border-slate-700 shadow-sm">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {profilePhotoName && (
                    <span className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400 mt-2 block">
                      {profilePhotoName}
                    </span>
                  )}
                </div>

                {/* Preview and Cropper Simulator */}
                <div className="bg-[var(--surface-muted)] rounded-3xl p-5 border border-[var(--border-subtle)] flex flex-col justify-center items-center h-[260px]">
                  {profilePhoto ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-[var(--surface-card)] flex justify-center items-center">
                        <img
                          src={profilePhoto}
                          alt="Cropper preview"
                          style={{
                            transform: `scale(${cropConfig.zoom}) rotate(${cropConfig.rotate}deg)`,
                            transition: "all 0.15s ease-out",
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Interactive portrait controls */}
                      <div className="w-full max-w-[200px] text-xs font-mono space-y-1.5 pt-1.5">
                        <div className="flex justify-between text-[9px] text-[var(--text-secondary)]">
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
                        <div className="flex justify-between text-[9px] text-[var(--text-secondary)]">
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
                    <div className="text-center text-[var(--text-secondary)] font-mono text-xs p-4">
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
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSavingStep}
                  className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Saving Draft...</span>
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
              exit={{ opacity: -20 }}
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
                  <label className="block text-slate-400 font-bold uppercase mb-1">
                    Citizenship / National ID Card ID Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CZ-9018-0918"
                    value={citizenshipNumber}
                    onChange={(e) =>
                      handleCitizenshipNumberChange(e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1 text-[10px]">
                      Citizenship Type *
                    </label>
                    <select
                      value={citizenshipType}
                      onChange={(e) => setCitizenshipType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-[11px]"
                    >
                      <option value="By Descent">By Descent</option>
                      <option value="By Birth">By Birth</option>
                      <option value="Naturalized">Naturalized</option>
                      <option value="Honorary">Honorary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1 text-[10px]">
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      value={citizenshipIssueDate}
                      onChange={(e) => {
                        setCitizenshipIssueDate(e.target.value);
                        setCitizenshipIssueDateAutoFilled(false);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white outline-none focus:border-emerald-500 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1 text-[10px]">
                      Issuing District *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kathmandu"
                      value={citizenshipIssueDistrict}
                      onChange={(e) =>
                        setCitizenshipIssueDistrict(e.target.value)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1 text-[10px]">
                      Issuing Authority *
                    </label>
                    <input
                      type="text"
                      value={citizenshipIssueAuthority}
                      onChange={(e) =>
                        setCitizenshipIssueAuthority(e.target.value)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-[11px]"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-black text-xs uppercase tracking-wider">
                      Citizenship Document Uploads *
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex min-h-[220px] flex-col justify-between items-center text-center gap-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        Citizenship Front Image
                      </span>
                      {citizenshipFrontImage ? (
                        <img
                          src={citizenshipFrontImage}
                          alt="Citizenship front preview"
                          loading="lazy"
                          className="w-full h-[110px] object-contain rounded-lg border border-slate-800 mb-2"
                        />
                      ) : (
                        <div className="h-[110px] w-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-850 text-slate-600 mb-2 text-[10px] px-2">
                          Front side preview will appear here
                        </div>
                      )}
                      <label className="mt-auto w-full px-3 py-2 bg-slate-900 border border-slate-850 text-[9px] uppercase font-bold text-slate-300 rounded transition-colors duration-150 hover:border-emerald-500 hover:text-white cursor-pointer select-none text-center">
                        Upload Front
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleDocumentChange(e, "front")}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex min-h-[220px] flex-col justify-between items-center text-center gap-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        Citizenship Back Image
                      </span>
                      {citizenshipBackImage ? (
                        <img
                          src={citizenshipBackImage}
                          alt="Citizenship back preview"
                          loading="lazy"
                          className="w-full h-[110px] object-contain rounded-lg border border-slate-800 mb-2"
                        />
                      ) : (
                        <div className="h-[110px] w-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-850 text-slate-600 mb-2 text-[10px] px-2">
                          Back side preview will appear here
                        </div>
                      )}
                      <label className="mt-auto w-full px-3 py-2 bg-slate-900 border border-slate-850 text-[9px] uppercase font-bold text-slate-300 rounded transition-colors duration-150 hover:border-emerald-500 hover:text-white cursor-pointer select-none text-center">
                        Upload Back
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleDocumentChange(e, "back")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <PenTool className="w-3 h-3 text-emerald-400" />
                      Signature Pad
                    </span>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[9px] text-red-400 hover:underline uppercase font-bold"
                    >
                      Clear
                    </button>
                  </div>

                  <canvas
                    ref={sigCanvasRef}
                    width={220}
                    height={90}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="bg-slate-900 border border-dashed border-slate-850 rounded-lg cursor-crosshair w-full h-[90px] mb-2"
                  />

                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500">
                      Draw above or
                    </span>
                    <label className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-[9px] uppercase font-bold text-sky-400 hover:text-white rounded cursor-pointer select-none">
                      Upload Signature Card
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* NATIONAL IDENTITY CARD (NID) ADDITIONAL PRODUCER    */}
              {/* ==================================================== */}
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span className="text-white font-black text-xs uppercase tracking-wider">
                    National Identity (NID) Record Link *
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      NID Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NID-101-987"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      NID Issue Date *
                    </label>
                    <input
                      type="date"
                      value={nidIssueDate}
                      onChange={(e) => setNidIssueDate(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-1.5 text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                {/* Upload NID photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* NID Front Upload */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-2">
                      NID Card FRONT Image
                    </span>
                    {nidFrontImage ? (
                      <img
                        src={nidFrontImage}
                        className="max-h-[85px] border border-slate-800 rounded-lg object-contain mb-2"
                      />
                    ) : (
                      <div className="h-[85px] w-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-850 text-slate-600 mb-2 text-[10px]">
                        NID Front Side Document
                      </div>
                    )}
                    <label className="px-3 py-1 bg-slate-900 border border-slate-850 text-[9px] uppercase font-bold text-slate-300 rounded hover:text-white cursor-pointer select-none">
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
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-2">
                      NID Card BACK Image
                    </span>
                    {nidBackImage ? (
                      <img
                        src={nidBackImage}
                        className="max-h-[85px] border border-slate-800 rounded-lg object-contain mb-2"
                      />
                    ) : (
                      <div className="h-[85px] w-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-850 text-slate-600 mb-2 text-[10px]">
                        NID Back Side Document
                      </div>
                    )}
                    <label className="px-3 py-1 bg-slate-900 border border-slate-850 text-[9px] uppercase font-bold text-slate-300 rounded hover:text-white cursor-pointer select-none">
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

              {/* ==================================================== */}
              {/* BIOMETRIC FINGERPRINT IDENTIFICATION PORTAL          */}
              {/* ==================================================== */}
              <div className="bg-slate-955/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-black text-xs uppercase tracking-wider">
                      Biometric Fingerprint Compliance Seal *
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {platformBiometricsAvailable ? (
                      <span className="bg-emerald-500/10 border border-emerald-500/30 text-[9px] text-emerald-400 font-extrabold uppercase px-2 py-0.5 rounded font-mono">
                        Hardware Scanner Available
                      </span>
                    ) : (
                      <span className="bg-blue-500/10 border border-blue-500/30 text-[9px] text-blue-400 font-extrabold uppercase px-2 py-0.5 rounded font-mono">
                        Simulated WebAuthn Enclave
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Place both fingers clearly in the live camera frame for a
                  clean capture. The image is verified instantly against
                  existing voter records to reduce duplicate registrations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Fingerprint Touch Sensor Module */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-950 border border-slate-850 p-4 rounded-2xl relative overflow-hidden select-none">
                    {isFingerprinting && (
                      <div className="absolute inset-0 bg-emerald-500/5 animate-[pulse_1.5s_infinite] pointer-events-none" />
                    )}

                    <div className="relative w-full aspect-[4/3] rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden mb-3">
                      {fingerprintCameraActive ? (
                        <video
                          ref={fingerprintVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : fingerprintImage ? (
                        <img
                          src={fingerprintImage}
                          alt="Fingerprint capture preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 text-slate-500">
                          <Fingerprint className="w-9 h-9 mb-2 text-emerald-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Live preview will appear here
                          </span>
                          <span className="text-[8px] mt-1 text-slate-600">
                            Open the camera and align both fingers in the frame
                          </span>
                        </div>
                      )}
                      {fingerprintCameraActive && (
                        <div className="absolute inset-3 border-2 border-emerald-400/50 rounded-2xl pointer-events-none" />
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={startFingerprintTouchScan}
                        className="flex-1 min-w-[90px] py-1.5 bg-emerald-600/90 text-[9px] text-white font-bold uppercase rounded-lg hover:bg-emerald-500 cursor-pointer select-none"
                      >
                        {fingerprintCameraActive
                          ? "Camera Live"
                          : "Open Live Camera"}
                      </button>
                      <button
                        type="button"
                        onClick={captureFingerprintFromCamera}
                        disabled={!fingerprintCameraActive}
                        className="flex-1 min-w-[90px] py-1.5 bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-bold uppercase rounded-lg hover:text-white cursor-pointer select-none disabled:opacity-40"
                      >
                        Capture Frame
                      </button>
                    </div>

                    <label className="mt-2 w-full px-3 py-1.5 bg-slate-900 border border-slate-800 text-[9px] uppercase font-bold text-slate-300 rounded hover:text-white cursor-pointer select-none text-center">
                      Upload Fingerprint Image
                      <input
                        ref={fingerprintInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFingerprintImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Cryptographic Biometrics Output Log Console */}
                  <div className="md:col-span-8 flex flex-col justify-between h-full space-y-3">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Biometrics Enclave Handshake Logs:
                      </span>
                      <></>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={startFingerprintTouchScan}
                        disabled={!!fingerprintImage || isFingerprinting}
                        className="flex-1 py-1.5 bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-bold uppercase rounded-lg hover:text-white cursor-pointer select-none disabled:opacity-50"
                      >
                        {fingerprintCameraActive
                          ? "Camera Active"
                          : "Open Camera"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !externalSensorDetected;
                          setExternalSensorDetected(nextState);
                          setFingerprintLogs((prev) => [
                            ...prev,
                            nextState
                              ? "🔌 [SIMULATOR]: External USB Fingerprint Sensor connected successfully."
                              : "❌ [SIMULATOR]: External USB Fingerprint Sensor disconnected.",
                          ]);
                        }}
                        className={`px-3 py-1.5 border text-[9px] font-bold uppercase rounded-lg cursor-pointer select-none transition-colors ${
                          externalSensorDetected
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30"
                            : "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-900/30"
                        }`}
                      >
                        {externalSensorDetected
                          ? "🔌 Unplug Ext Sensor"
                          : "🔌 Plug Ext Sensor"}
                      </button>

                      {fingerprintImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setFingerprintImage("");
                            setFingerprintStatus("idle");
                            setFingerprintMatchUser("");
                            setFingerprintLogs([]);
                            stopFingerprintCamera();
                          }}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-[9px] text-red-400 font-bold uppercase rounded-lg hover:bg-slate-850 cursor-pointer select-none"
                        >
                          Reset Biometric
                        </button>
                      )}
                    </div>

                    <div className="text-[9px] font-mono text-slate-400">
                      {fingerprintStatus === "checking" &&
                        "Checking biometric database…"}
                      {fingerprintStatus === "clear" &&
                        "Fingerprint appears unique and ready for registration."}
                      {fingerprintStatus === "duplicate" &&
                        `Potential duplicate fingerprint match for ${fingerprintMatchUser}.`}
                      {fingerprintStatus === "idle" &&
                        "Capture a sharp image of both fingers for a clean registration."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSavingStep}
                  className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Saving Draft...</span>
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
              exit={{ opacity: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Camera className="w-4 h-4" />
                <span>4. Biometric Facemesh Contour Alignment Capture</span>
              </div>

              {/* Directly Render our majestic high-definition BiometricScanner! */}
              <div className="border border-slate-800 rounded-3xl overflow-hidden p-2 bg-slate-950">
                <BiometricScanner
                  onCapture={(img, template) => {
                    setFaceImage(img);
                    setFaceTemplate(template || [0.1, 0.2, 0.3]);
                  }}
                  title="Onboarding Camera Portal"
                  subtitle="Synchronizes liveness markers on leftmost and rightmost eyes, nose and ears profiles."
                  mode="face-api"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSavingStep}
                  className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingStep ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Saving Draft...</span>
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
              exit={{ opacity: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>5. Final Demographics & Security Seals Verification</span>
              </div>

              <p className="text-[11px] text-slate-400">
                Ensure all parameters align with official credentials. Upon
                confirmation, keys will compile your digital voting pass
                signature.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-slate-950 p-5 rounded-2xl border border-slate-800">
                {/* Text summary info */}
                <div className="space-y-2">
                  <div className="border-b border-slate-850 pb-2">
                    <span className="text-[10px] text-slate-500 uppercase">
                      Voter Registration Name:
                    </span>
                    <p className="text-white font-extrabold uppercase block">
                      {user?.fullName}
                    </p>
                  </div>
                  <div className="border-b border-slate-850 pb-2">
                    <span className="text-[10px] text-slate-500 uppercase">
                      National ID Number:
                    </span>
                    <p className="text-white font-extrabold uppercase block">
                      {citizenshipNumber}
                    </p>
                  </div>
                  <div className="border-b border-slate-850 pb-2">
                    <span className="text-[10px] text-slate-500 uppercase">
                      Date of Birth & Gender:
                    </span>
                    <p className="text-white block">
                      {personal.dob} ({personal.gender})
                    </p>
                  </div>
                  <div className="border-b border-slate-850 pb-2">
                    <span className="text-[10px] text-slate-500 uppercase">
                      Permanent Residential Address:
                    </span>
                    <p className="text-slate-300 block leading-relaxed">
                      {personal.permanentAddress}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">
                      Temporary Current Address:
                    </span>
                    <p className="text-slate-300 block leading-relaxed">
                      {sameAsPermanent
                        ? "Same as Permanent Address"
                        : personal.temporaryAddress}
                    </p>
                  </div>
                </div>

                {/* Thumbnails grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Portrait photo */}
                  <div className="flex flex-col items-center bg-slate-900 p-2 rounded-lg border border-slate-850 text-center">
                    <span className="text-[8px] text-slate-400 font-bold block mb-1">
                      PORTRAIT SEAL
                    </span>
                    <img
                      src={profilePhoto}
                      className="w-12 h-12 rounded-full border border-emerald-500 object-cover"
                    />
                  </div>

                  {/* Face capture */}
                  <div className="flex flex-col items-center bg-slate-900 p-2 rounded-lg border border-slate-850 text-center">
                    <span className="text-[8px] text-slate-400 font-bold block mb-1">
                      FACIAL METRIC
                    </span>
                    <img
                      src={faceImage}
                      className="w-12 h-12 border border-blue-500 object-contain rounded"
                    />
                  </div>

                  {/* Signature */}
                  <div className="flex flex-col items-center bg-slate-900 p-2 rounded-lg border border-slate-850 text-center">
                    <span className="text-[8px] text-slate-400 font-bold block mb-1">
                      SIGNATURE
                    </span>
                    <img
                      src={signatureImage}
                      className="w-12 h-12 bg-white object-contain border border-slate-350 rounded"
                    />
                  </div>

                  {/* Fingerprint */}
                  <div className="flex flex-col items-center bg-slate-900 p-2 rounded-lg border border-slate-850 text-center">
                    <span className="text-[8px] text-slate-400 font-bold block mb-1">
                      FINGERPRINT
                    </span>
                    <img
                      src={fingerprintImage}
                      className="w-12 h-12 object-contain border border-slate-805 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  disabled={loading}
                  onClick={handlePrev}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 px-6 py-3 rounded-xl font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Transmitting profiles registry...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-slate-950" />
                      <span>Validate & Compile Security Seal</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STEP 6: VERIFICATION COMPLETED AND AUTO-TRANSITION   */}
          {/* ==================================================== */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col justify-center items-center text-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-bounce shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                Profile Completed Successfully
              </h3>

              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Your account is now{" "}
                <strong className="text-emerald-400 uppercase font-bold text-xs">
                  fully activated
                </strong>
                , and you are eligible to participate in elections. Bridging
                securely into the Voter Dashboard blocks...
              </p>

              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold uppercase mt-6 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-900">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Routing to Active Dashboard Block...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* ----------------- DISCREPANCY & AUTO-CORRECTION CONTEXT MODAL ----------------- */}
      <AnimatePresence>
        {showDiscrepancyModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4 text-left overflow-hidden animate-[pulse_3s_infinite]"
            >
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-md font-black text-rose-450 uppercase tracking-wider">
                    Demographic Discrepancies Identified
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Security check scanned your Citizenship and National ID Card
                    variables. The following mismatches require resolution
                    before final signature seals.
                  </p>
                </div>
              </div>

              {/* Comparison list & table */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {activeMismatches.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/65 rounded-xl border border-slate-850 p-3 text-xs font-mono space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold uppercase text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Field: {m.field}
                      </span>
                      <span className="text-rose-400 font-bold text-[9px] uppercase tracking-widest">
                        • MISMATCH DETECTED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10.5px]">
                      <div className="border-r border-slate-850/60 pr-2">
                        <span className="text-[8.5px] text-slate-500 uppercase block mb-0.5">
                          Citizenship Registry Value:
                        </span>
                        <p className="text-white font-extrabold line-through decoration-rose-500">
                          {m.citizenshipVal}
                        </p>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-indigo-455 uppercase block mb-0.5">
                          National ID Database Value:
                        </span>
                        <p className="text-slate-350 font-bold">{m.nidVal}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between gap-2 mt-1">
                      <div>
                        <span className="text-[8.5px] text-emerald-405 uppercase font-black block mb-0.5">
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
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 font-extrabold text-xs uppercase px-4 py-3 rounded-xl tracking-wider cursor-pointer shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4 text-slate-950" />
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
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-extrabold text-xs uppercase px-4 py-3 rounded-xl tracking-wider cursor-pointer active:scale-[0.99] transition-all"
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
