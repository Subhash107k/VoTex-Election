import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  UserCheck,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Calendar,
  Briefcase,
  Vote,
  ArrowLeft,
  ShieldCheck,
  Sun,
  Moon,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import PasswordField from "./PasswordField.tsx";
import PasswordStrength from "../common/PasswordStrength.tsx";
import type { RegisterForm, ThemeMode } from "../../types/auth.ts";
import { checkAvailability } from "../../services/authService.ts";

interface RegisterPageProps {
  setCurrentPath: (path: string) => void;
  loading: boolean;
  regForm: RegisterForm;
  setRegForm: (form: RegisterForm) => void;
  regFaceImage: string;
  setRegFaceImage: (image: string) => void;
  regFaceTemplate: number[] | null;
  setRegFaceTemplate: (template: number[] | null) => void;
  handleRegisterSubmit: (event: React.FormEvent) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

function VisualCaptchaComponent({
  onVerifyChange,
  inputBg,
}: {
  onVerifyChange: (isValid: boolean) => void;
  inputBg: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captchaCode, setCaptchaCode] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isValid, setIsValid] = useState(false);

  const generateCaptcha = useCallback(() => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserInput("");
    setIsValid(false);
    onVerifyChange(false);
  }, [onVerifyChange]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const drawCaptchaOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captchaCode) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, "#0f172a");
    bgGradient.addColorStop(1, "#1e293b");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.25 + Math.random() * 0.3})`;
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 1.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.font = "bold 20px monospace";
    ctx.textBaseline = "middle";

    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];
    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      ctx.save();
      const x = 16 + i * 22;
      const y = canvas.height / 2 + (Math.random() * 4 - 2);
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180);
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 3;
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, [captchaCode]);

  useEffect(() => {
    drawCaptchaOnCanvas();
  }, [captchaCode, drawCaptchaOnCanvas]);

  const handleInputChange = (val: string) => {
    setUserInput(val);
    const valid = val.trim().toUpperCase() === captchaCode.toUpperCase();
    setIsValid(valid);
    onVerifyChange(valid);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-inner flex items-center shrink-0">
        <canvas
          ref={canvasRef}
          width={130}
          height={38}
          className="block cursor-pointer"
          onClick={generateCaptcha}
          title="Click to refresh Visual CAPTCHA"
        />
        <button
          type="button"
          onClick={generateCaptcha}
          title="Refresh Visual CAPTCHA"
          className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-800/80 border-l border-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        type="text"
        required
        placeholder="Answer"
        value={userInput}
        onChange={(e) => handleInputChange(e.target.value)}
        className={`w-36 px-3 py-2 rounded-xl border text-xs font-mono font-bold tracking-wider uppercase ${inputBg}`}
      />

      {userInput.trim() !== "" && (
        <span className="text-[11px] font-mono font-bold">
          {isValid ? (
            <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              ✔ Verified Human
            </span>
          ) : (
            <span className="text-rose-500 dark:text-rose-400">
              ❌ Incorrect CAPTCHA
            </span>
          )}
        </span>
      )}
    </div>
  );
}

interface FieldCheckState {
  status: "idle" | "checking" | "available" | "taken" | "invalid";
  message?: string;
}

export default function RegisterPage({
  setCurrentPath,
  loading,
  regForm,
  setRegForm,
  regFaceImage,
  setRegFaceImage,
  regFaceTemplate,
  setRegFaceTemplate,
  handleRegisterSubmit,
  theme,
  setTheme,
}: RegisterPageProps) {
  const isLight = theme === "light";

  const bgMain = isLight
    ? "bg-slate-50 text-slate-800"
    : "bg-slate-950 text-slate-100";
  const bgCard = isLight
    ? "bg-white border-slate-200/90 shadow-xl"
    : "bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";
  const inputBg = isLight
    ? "bg-slate-100 text-slate-900 border-slate-200 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none placeholder:text-slate-400"
    : "bg-slate-950/80 text-white border-slate-800 focus:border-emerald-500 focus:bg-slate-950 focus:outline-none";

  // Date of birth age calculation
  const maxRegisterDob = new Date();
  maxRegisterDob.setFullYear(maxRegisterDob.getFullYear() - 18);
  const maxRegisterDobString = maxRegisterDob.toISOString().slice(0, 10);

  const getDobAge = (dobValue: string) => {
    const date = new Date(dobValue);
    if (Number.isNaN(date.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age -= 1;
    }
    return age;
  };

  const dobAge = regForm.dob ? getDobAge(regForm.dob) : null;
  const dobAgeMessage = regForm.dob
    ? dobAge !== null && dobAge >= 18
      ? `Selected age: ${dobAge}. You may register.`
      : `Underage: ${dobAge}. You must be at least 18 years old to register.`
    : "Must be at least 18 years old.";

  // OTP & verification states
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerifiedLocal, setIsEmailVerifiedLocal] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [smsVerificationCode, setSmsVerificationCode] = useState("");
  const [isSmsOtpSent, setIsSmsOtpSent] = useState(false);
  const [isSmsVerifiedLocal, setIsSmsVerifiedLocal] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsOtpLoading, setSmsOtpLoading] = useState(false);
  const [smsVerifyLoading, setSmsVerifyLoading] = useState(false);
  const [smsError, setSmsError] = useState("");

  // Anti-Bot & Single Account Guard States
  const [hpWebsite, setHpWebsite] = useState("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [alreadyHasAccount] = useState(() => {
    try {
      return localStorage.getItem("votex_account_created") === "true";
    } catch {
      return false;
    }
  });

  const handleCaptchaVerifyChange = useCallback((valid: boolean) => {
    setIsCaptchaVerified(valid);
  }, []);

  useEffect(() => {
    setIsEmailVerifiedLocal(false);
    setEmailVerificationCode("");
    setIsEmailOtpSent(false);
    setEmailCountdown(0);
    setEmailError("");
  }, [regForm.email]);

  useEffect(() => {
    setIsSmsVerifiedLocal(false);
    setSmsVerificationCode("");
    setIsSmsOtpSent(false);
    setSmsCountdown(0);
    setSmsError("");
  }, [regForm.mobile]);

  // Countdown timers
  useEffect(() => {
    let timer: any;
    if (emailCountdown > 0) {
      timer = setInterval(() => setEmailCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emailCountdown]);

  useEffect(() => {
    let timer: any;
    if (smsCountdown > 0) {
      timer = setInterval(() => setSmsCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [smsCountdown]);

  const isValidEmailAddress = (value: string) => {
    const trimmed = String(value || "").trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed);
  };

  const isValidNepaliMobile = (value: string) => {
    const raw = String(value || "").trim();
    const digits = raw.replace(/\D/g, "");
    return /^9\d{9}$/.test(digits) || /^9779\d{9}$/.test(digits);
  };

  // Real-time identity field availability check
  const [identityStatus, setIdentityStatus] = useState<{
    email: FieldCheckState;
    username: FieldCheckState;
    phone: FieldCheckState;
    nid: FieldCheckState;
    citizenship: FieldCheckState;
  }>({
    email: { status: "idle" },
    username: { status: "idle" },
    phone: { status: "idle" },
    nid: { status: "idle" },
    citizenship: { status: "idle" },
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      const nextStatus = { ...identityStatus };
      const queryParams: {
        email?: string;
        username?: string;
        phone?: string;
        nid?: string;
        citizenship?: string;
      } = {};

      if (!regForm.email) {
        nextStatus.email = { status: "idle" };
      } else if (!isValidEmailAddress(regForm.email)) {
        nextStatus.email = { status: "invalid", message: "Invalid email format. Must be e.g. name@domain.com" };
      } else {
        nextStatus.email = { status: "checking" };
        queryParams.email = regForm.email;
      }

      if (!regForm.username) {
        nextStatus.username = { status: "idle" };
      } else if (regForm.username.length < 3) {
        nextStatus.username = { status: "invalid", message: "Username must be at least 3 characters." };
      } else if (!/^[a-zA-Z0-9]+$/.test(regForm.username)) {
        nextStatus.username = { status: "invalid", message: "Username must contain only letters and numbers (no special characters)." };
      } else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(regForm.username)) {
        nextStatus.username = { status: "invalid", message: "Username must contain both letters and numbers (e.g. voter123)." };
      } else {
        nextStatus.username = { status: "checking" };
        queryParams.username = regForm.username;
      }

      if (!regForm.mobile) {
        nextStatus.phone = { status: "idle" };
      } else if (!isValidNepaliMobile(regForm.mobile)) {
        nextStatus.phone = { status: "invalid", message: "Invalid Nepali mobile number." };
      } else {
        nextStatus.phone = { status: "checking" };
        queryParams.phone = regForm.mobile;
      }

      if (!regForm.nationalID) {
        nextStatus.nid = { status: "idle" };
      } else if (regForm.nationalID.trim().length < 5) {
        nextStatus.nid = { status: "invalid", message: "National ID must be at least 5 characters." };
      } else {
        nextStatus.nid = { status: "checking" };
        queryParams.nid = regForm.nationalID;
      }

      if (!regForm.citizenshipNumber) {
        nextStatus.citizenship = { status: "idle" };
      } else if (regForm.citizenshipNumber.trim().length < 5) {
        nextStatus.citizenship = { status: "invalid", message: "Citizenship number must be at least 5 characters." };
      } else {
        nextStatus.citizenship = { status: "checking" };
        queryParams.citizenship = regForm.citizenshipNumber;
      }

      setIdentityStatus({ ...nextStatus });

      if (Object.keys(queryParams).length === 0) {
        return;
      }

      try {
        const res = await checkAvailability(queryParams);
        if (res && res.success) {
          setIdentityStatus((prev) => {
            const updated = { ...prev };
            if (queryParams.email) {
              updated.email = res.available.email
                ? { status: "available", message: "Email available" }
                : { status: "taken", message: res.message?.email || "Email already registered." };
            }
            if (queryParams.username) {
              updated.username = res.available.username
                ? { status: "available", message: "Username available" }
                : { status: "taken", message: res.message?.username || "Username already taken." };
            }
            if (queryParams.phone) {
              updated.phone = res.available.phone
                ? { status: "available", message: "Phone number available" }
                : { status: "taken", message: res.message?.phone || "Phone number already registered." };
            }
            if (queryParams.nid) {
              updated.nid = res.available.nid
                ? { status: "available", message: "National ID available" }
                : { status: "taken", message: res.message?.nid || "National ID already exists." };
            }
            if (queryParams.citizenship) {
              updated.citizenship = res.available.citizenship
                ? { status: "available", message: "Citizenship number available" }
                : { status: "taken", message: res.message?.citizenship || "Citizenship number already exists." };
            }
            return updated;
          });
        }
      } catch (err) {
        console.error("Availability check failed:", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    regForm.email,
    regForm.username,
    regForm.mobile,
    regForm.nationalID,
    regForm.citizenshipNumber,
  ]);

  const sendEmailCode = async () => {
    if (!regForm.email || !isValidEmailAddress(regForm.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setEmailOtpLoading(true);
    setIsEmailOtpSent(false);
    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regForm.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsEmailOtpSent(false);
        if (data?.remainingSec) {
          setEmailCountdown(data.remainingSec);
        }
        throw new Error(data.error || "Could not send the email code.");
      }
      if (data?.alreadyRegistered) {
        setEmailError(
          data.message ||
            "This email is already registered. Please sign in or reset your password.",
        );
        setIsEmailOtpSent(false);
        setEmailCountdown(0);
        return;
      }
      setIsEmailOtpSent(true);
      setEmailCountdown(60);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!emailVerificationCode) {
      setEmailError("Enter the email code.");
      return;
    }
    setEmailError("");
    setEmailVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regForm.email,
          code: emailVerificationCode,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "The email code is not correct.");
      setIsEmailVerifiedLocal(true);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const sendSmsOtp = async () => {
    if (!regForm.mobile || !isValidNepaliMobile(regForm.mobile)) {
      setSmsError(
        "Please enter a valid Nepali mobile number like +97798XXXXXXXX.",
      );
      return;
    }
    setSmsError("");
    setSmsOtpLoading(true);
    setIsSmsOtpSent(false);
    try {
      const res = await fetch("/api/auth/send-sms-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: regForm.mobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsSmsOtpSent(false);
        if (data?.remainingSec) {
          setSmsCountdown(data.remainingSec);
        }
        throw new Error(data.error || "Could not send the SMS code.");
      }
      if (data?.alreadyRegistered) {
        setSmsError(
          data.message ||
            "This mobile number is already registered. Please sign in or recover your account.",
        );
        setIsSmsOtpSent(false);
        setSmsCountdown(0);
        return;
      }
      setIsSmsOtpSent(true);
      setSmsCountdown(60);
    } catch (err: any) {
      setSmsError(err.message);
    } finally {
      setSmsOtpLoading(false);
    }
  };

  const verifySmsOtp = async () => {
    if (!smsVerificationCode) {
      setSmsError("Enter the SMS code.");
      return;
    }
    setSmsError("");
    setSmsVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify-sms-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: regForm.mobile,
          code: smsVerificationCode,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "The SMS code is not correct.");
      setIsSmsVerifiedLocal(true);
    } catch (err: any) {
      setSmsError(err.message);
    } finally {
      setSmsVerifyLoading(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    if (!isEmailVerifiedLocal || !isSmsVerifiedLocal || !isIdentityAllAvailable) {
      event.preventDefault();
      if (!isEmailVerifiedLocal) setEmailError("Please verify your email before registering.");
      if (!isSmsVerifiedLocal) setSmsError("Please verify your mobile number before registering.");
      return;
    }
    handleRegisterSubmit(event);
  };

  const renderFieldStatus = (
    fieldKey: "email" | "username" | "phone" | "nid" | "citizenship",
    labelName: string,
  ) => {
    const state = identityStatus[fieldKey];
    if (state.status === "idle") return null;

    if (state.status === "checking") {
      return (
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-medium text-amber-500">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Checking {labelName} availability...</span>
        </div>
      );
    }

    if (state.status === "available") {
      return (
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>✔ {labelName} available</span>
        </div>
      );
    }

    if (state.status === "taken" || state.status === "invalid") {
      return (
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-rose-500 dark:text-rose-400">
          <XCircle className="h-3.5 w-3.5 text-rose-500" />
          <span>{state.message || `${labelName} is unavailable.`}</span>
        </div>
      );
    }

    return null;
  };

  const isBotChallengePassed =
    isCaptchaVerified &&
    !hpWebsite &&
    !alreadyHasAccount;

  const isIdentityAllAvailable =
    identityStatus.email.status === "available" &&
    identityStatus.username.status === "available" &&
    identityStatus.phone.status === "available" &&
    identityStatus.nid.status === "available" &&
    identityStatus.citizenship.status === "available" &&
    regForm.password.length >= 12 &&
    regForm.password === regForm.confirmPassword &&
    dobAge !== null &&
    dobAge >= 18 &&
    isBotChallengePassed;

  return (
    <div className={`min-h-screen ${bgMain} flex flex-col justify-between relative transition-colors duration-300 font-sans`}>
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentPath("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Vote className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <h1 className={`font-black text-base ${textTitle} leading-none tracking-tight`}>
              VoTex Registration
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-0.5 uppercase font-bold">
              Citizen Identity Onboarding
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(isLight ? "dark" : "light")}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPath("/")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Registration Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className={`w-full max-w-2xl p-6 sm:p-8 rounded-3xl border ${bgCard} relative`}>
          
          {loading && (
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 animate-pulse rounded-t-3xl" />
          )}

          <div className="mb-6 text-left">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
              <UserCheck className="h-5 w-5" />
            </div>
            <h2 className={`text-2xl font-black ${textTitle} tracking-tight`}>
              Create Your Verified Voter Profile
            </h2>
            <p className={`text-xs ${textMuted} mt-1`}>
              Provide your details and verify your contact information to participate in digital elections.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5 text-xs font-sans">
            
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/80 bg-slate-100/90 p-1.5 shadow-sm dark:border-slate-850 dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => setRegForm({ ...regForm, role: "Voter" })}
                  className={`py-2.5 rounded-xl text-center font-bold transition-all cursor-pointer text-xs ${
                    regForm.role === "Voter" || !regForm.role
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  Voter Account
                </button>
                <button
                  type="button"
                  onClick={() => setRegForm({ ...regForm, role: "Candidate" })}
                  className={`py-2.5 rounded-xl text-center font-bold transition-all cursor-pointer text-xs ${
                    regForm.role === "Candidate"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  Candidate Account
                </button>
              </div>
            </div>

            {/* Full Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className={`w-full px-3 py-2.5 rounded-xl border ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="username"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  aria-invalid={identityStatus.username.status === "taken" || identityStatus.username.status === "invalid"}
                  className={`w-full px-3 py-2.5 rounded-xl border ${inputBg}`}
                />
                {renderFieldStatus("username", "Username")}
              </div>
            </div>

            {/* National ID & Citizenship */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  National ID
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Entre your NID Number "
                    value={regForm.nationalID}
                    onChange={(e) => setRegForm({ ...regForm, nationalID: e.target.value })}
                    aria-invalid={identityStatus.nid.status === "taken" || identityStatus.nid.status === "invalid"}
                    className={`w-full rounded-xl border px-3 py-2 pl-9 text-xs ${inputBg}`}
                  />
                </div>
                {renderFieldStatus("nid", "National ID")}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Citizenship Number
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your Citizenship Number"
                    value={regForm.citizenshipNumber}
                    onChange={(e) => setRegForm({ ...regForm, citizenshipNumber: e.target.value })}
                    aria-invalid={identityStatus.citizenship.status === "taken" || identityStatus.citizenship.status === "invalid"}
                    className={`w-full rounded-xl border px-3 py-2 pl-9 text-xs ${inputBg}`}
                  />
                </div>
                {renderFieldStatus("citizenship", "Citizenship number")}
              </div>
            </div>

            {/* DOB, Gender, Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="date"
                    required
                    max={maxRegisterDobString}
                    value={regForm.dob}
                    onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2 pl-9 text-xs ${inputBg}`}
                  />
                </div>
                <p className={`mt-1 text-[10px] ${regForm.dob ? (dobAge !== null && dobAge >= 18 ? "text-emerald-400 font-semibold" : "text-rose-400") : "text-slate-400"}`}>
                  {dobAgeMessage}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Gender
                </label>
                <select
                  required
                  value={regForm.gender}
                  onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2 text-xs ${inputBg}`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Occupation
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineer"
                    value={regForm.occupation}
                    onChange={(e) => setRegForm({ ...regForm, occupation: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2 pl-9 text-xs ${inputBg}`}
                  />
                </div>
              </div>
            </div>

            {/* Email OTP verification block */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-bold text-xs text-slate-800 dark:text-slate-200">
                  Email Verification OTP
                </label>
                {isEmailVerifiedLocal ? (
                  <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold font-mono">
                    ✔ Email Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold font-mono">
                    Awaiting Email Verification
                  </span>
                )}
              </div>

              {!isEmailVerifiedLocal ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email "
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      disabled={isEmailVerifiedLocal}
                      aria-invalid={identityStatus.email.status === "taken" || identityStatus.email.status === "invalid"}
                      className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={sendEmailCode}
                      disabled={emailOtpLoading || emailCountdown > 0 || identityStatus.email.status === "taken"}
                      className="px-3 bg-slate-800 text-slate-200 font-bold hover:text-white rounded-xl text-[10px] uppercase border border-slate-700 cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      {emailOtpLoading ? "Sending..." : emailCountdown > 0 ? `Resend (${emailCountdown}s)` : "Send OTP"}
                    </button>
                  </div>
                  {renderFieldStatus("email", "Email")}
                  {emailError && <p className="text-[10px] text-rose-500 font-mono">{emailError}</p>}

                  {(emailOtpLoading || isEmailOtpSent || emailCountdown > 0) && !isEmailVerifiedLocal && (
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit email code"
                        value={emailVerificationCode}
                        onChange={(e) => setEmailVerificationCode(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={verifyEmailCode}
                        disabled={emailVerifyLoading}
                        className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-[10px] font-bold uppercase text-slate-950 transition hover:bg-emerald-600 cursor-pointer"
                      >
                        {emailVerifyLoading ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-emerald-400 font-mono">
                  Email verification completed successfully.
                </p>
              )}
            </div>

            {/* Mobile OTP verification block */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-bold text-xs text-slate-800 dark:text-slate-200">
                  Mobile SMS Verification OTP
                </label>
                {isSmsVerifiedLocal ? (
                  <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold font-mono">
                    ✔ Mobile Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold font-mono">
                    Awaiting Mobile Verification
                  </span>
                )}
              </div>

              {!isSmsVerifiedLocal ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      required
                      placeholder="+977 98XXXXXXXX"
                      value={regForm.mobile}
                      onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                      disabled={isSmsVerifiedLocal}
                      aria-invalid={identityStatus.phone.status === "taken" || identityStatus.phone.status === "invalid"}
                      className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={sendSmsOtp}
                      disabled={smsOtpLoading || smsCountdown > 0 || identityStatus.phone.status === "taken"}
                      className="px-3 bg-slate-800 text-slate-200 font-bold hover:text-white rounded-xl text-[10px] uppercase border border-slate-700 cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      {smsOtpLoading ? "Sending..." : smsCountdown > 0 ? `Resend (${smsCountdown}s)` : "Send OTP"}
                    </button>
                  </div>
                  {renderFieldStatus("phone", "Phone number")}
                  {smsError && <p className="text-[10px] text-rose-500 font-mono">{smsError}</p>}

                  {isSmsOtpSent && !isSmsVerifiedLocal && (
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit SMS code"
                        value={smsVerificationCode}
                        onChange={(e) => setSmsVerificationCode(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={verifySmsOtp}
                        disabled={smsVerifyLoading}
                        className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-[10px] font-bold uppercase text-slate-950 transition hover:bg-emerald-600 cursor-pointer"
                      >
                        {smsVerifyLoading ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-emerald-400 font-mono">
                  Mobile verification completed successfully.
                </p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordField
                label="Password"
                value={regForm.password}
                onChange={(password) => setRegForm({ ...regForm, password })}
                inputBg={inputBg}
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm Password"
                value={regForm.confirmPassword}
                onChange={(confirmPassword) => setRegForm({ ...regForm, confirmPassword })}
                inputBg={inputBg}
                autoComplete="new-password"
              />
            </div>

            <PasswordStrength password={regForm.password} />

            {/* Honeypot hidden input to trap automated spam bots */}
            <div className="hidden opacity-0 pointer-events-none absolute -left-[9999px]" aria-hidden="true">
              <input
                type="text"
                name="b_website"
                tabIndex={-1}
                autoComplete="off"
                value={hpWebsite}
                onChange={(e) => setHpWebsite(e.target.value)}
              />
            </div>

            {/* Bot Prevention & Single Account Security Check */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Bot Prevention & Single Account Guard
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold font-mono">
                  Visual CAPTCHA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                To block automated bots and enforce 1-time account registration per user, complete the security check.
              </p>

              {alreadyHasAccount ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                  <span>⚠️ An account has already been registered on this browser. Multiple account creations from the same session are blocked to prevent bot spam.</span>
                </div>
              ) : (
                <VisualCaptchaComponent
                  onVerifyChange={handleCaptchaVerifyChange}
                  inputBg={inputBg}
                />
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading ||
                !isEmailVerifiedLocal ||
                !isSmsVerifiedLocal ||
                !isIdentityAllAvailable
              }
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 py-3.5 font-extrabold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              {loading
                ? "Creating Account..."
                : !isEmailVerifiedLocal || !isSmsVerifiedLocal
                  ? "Verify Email & Mobile OTP First"
                  : !isIdentityAllAvailable
                    ? "Complete All Required Validations"
                    : "Complete & Register Account"}
            </button>

            <p className={`text-xs text-center mt-2 ${textMuted}`}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setCurrentPath("/login")}
                className="text-emerald-500 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </form>

        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-200/60 dark:border-slate-900">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Encrypted Session • VoTex Identity & Liveness Protocol</span>
        </div>
      </footer>
    </div>
  );
}
