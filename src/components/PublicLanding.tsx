import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Vote,
  User,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  MapPin,
  UserCheck,
  AlertTriangle,
  Key,
  Calendar,
  ArrowRight,
  UserCheck2,
  RefreshCw,
  Sun,
  Moon,
  Shield,
  Info,
  ChevronDown,
  Send,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Star,
  MessageSquare,
  Terminal,
  Eye,
  EyeOff,
  Menu,
  X,
  Award,
  Check,
  Activity,
} from "lucide-react";
import BiometricScanner from "./BiometricScanner.tsx";
import ElectionResults from "./ElectionResults.tsx";

// Helper Interface
interface PublicLandingProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  loading: boolean;
  loginForm: any;
  setLoginForm: (form: any) => void;
  handleLoginSubmit: (e: React.FormEvent) => void;
  regForm: any;
  setRegForm: (form: any) => void;
  regFaceImage: string;
  setRegFaceImage: (img: string) => void;
  regFaceTemplate: number[] | null;
  setRegFaceTemplate: (tpl: number[] | null) => void;
  handleRegisterSubmit: (e: React.FormEvent) => void;
  forgotForm: any;
  setForgotForm: (form: any) => void;
  forgotStep: "request" | "verify";
  setForgotStep: (step: "request" | "verify") => void;
  handleForgotPasswordSubmit: (e: React.FormEvent) => void;
  handleResetPasswordSubmit: (e: React.FormEvent) => void;
  loginAsPresetUser: (role: "super" | "officer" | "voter") => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  passwordStrengthComponent: React.ReactNode;
}

export default function PublicLanding({
  currentPath,
  setCurrentPath,
  loading,
  loginForm,
  setLoginForm,
  handleLoginSubmit,
  regForm,
  setRegForm,
  regFaceImage,
  setRegFaceImage,
  regFaceTemplate,
  setRegFaceTemplate,
  handleRegisterSubmit,
  forgotForm,
  setForgotForm,
  forgotStep,
  setForgotStep,
  handleForgotPasswordSubmit,
  handleResetPasswordSubmit,
  loginAsPresetUser,
  theme,
  setTheme,
  passwordStrengthComponent,
}: PublicLandingProps) {
  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Accordion lists state manager
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Dynamic server statistics state
  const [stats, setStats] = useState({
    registeredVoters: 4125,
    verifiedVoters: 3980,
    electionsConducted: 12,
    candidates: 36,
    votesCast: 94520,
  });

  // Dynamic active elections catalog
  const [elections, setElections] = useState<any[]>([]);
  const [electionsLoading, setElectionsLoading] = useState(false);

  // Public Contact state
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Newsletter subscription
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Fetch dynamic stats and active elections
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const statsRes = await fetch("/api/public/stats");
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats(statsJson);
        }
      } catch (e) {
        console.error("Failed to load platform stats:", e);
      }

      try {
        setElectionsLoading(true);
        const electRes = await fetch("/api/elections");
        if (electRes.ok) {
          const electJson = await electRes.json();
          // Filter out Drafts for public viewing
          const publicElections = (electJson.elections || []).filter(
            (el: any) => el.status === "Active" || el.status === "Closed",
          );
          setElections(publicElections);
        }
      } catch (e) {
        console.error("Failed to download active list:", e);
      } finally {
        setElectionsLoading(false);
      }
    };

    fetchPublicData();
  }, [currentPath]);

  // Step-by-step registration wizard state
  const [activeRegStep, setActiveRegStep] = useState<number>(1);

  // Email verification internal state
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerifiedLocal, setIsEmailVerifiedLocal] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Mobile verification internal state
  const [smsVerificationCode, setSmsVerificationCode] = useState("");
  const [isSmsOtpSent, setIsSmsOtpSent] = useState(false);
  const [isSmsVerifiedLocal, setIsSmsVerifiedLocal] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsOtpLoading, setSmsOtpLoading] = useState(false);
  const [smsVerifyLoading, setSmsVerifyLoading] = useState(false);
  const [smsError, setSmsError] = useState("");

  // Password reset OTP countdown timer
  const [resetOtpCountdown, setResetOtpCountdown] = useState(0);

  // Countdown timers for resends
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

  useEffect(() => {
    let timer: any;
    if (resetOtpCountdown > 0) {
      timer = setInterval(() => setResetOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resetOtpCountdown]);

  useEffect(() => {
    if (forgotStep === "verify") {
      setResetOtpCountdown(60);
    }
  }, [forgotStep]);

  useEffect(() => {
    if (currentPath === "/register") {
      setIsEmailOtpSent(false);
      setEmailVerificationCode("");
      setEmailError("");
      setEmailCountdown(0);
      setEmailOtpLoading(false);
      setEmailVerifyLoading(false);
      setIsEmailVerifiedLocal(false);
      setIsSmsOtpSent(false);
      setSmsVerificationCode("");
      setSmsError("");
      setSmsCountdown(0);
      setSmsOtpLoading(false);
      setSmsVerifyLoading(false);
      setIsSmsVerifiedLocal(false);
    }
  }, [currentPath]);

  const isValidEmailAddress = (value: string) => {
    const trimmed = String(value || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  };

  const isValidNepaliMobile = (value: string) => {
    const raw = String(value || "").trim();
    const digits = raw.replace(/\D/g, "");
    return /^9\d{9}$/.test(digits) || /^9779\d{9}$/.test(digits);
  };

  const sendEmailCode = async () => {
    if (!regForm.email || !isValidEmailAddress(regForm.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setEmailOtpLoading(true);
    setIsEmailOtpSent(true);
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
        throw new Error(data.error || "Failed sending SMTP verification code");
      }
      setEmailCountdown(60); // 60s cooldown
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!emailVerificationCode) {
      setEmailError("Verification code is required");
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
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setIsEmailVerifiedLocal(true);
      setTimeout(() => {
        setActiveRegStep(3);
      }, 700);
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
    setIsSmsOtpSent(true);
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
        throw new Error(data.error || "Failed sending Twilio OTP");
      }
      setSmsCountdown(60);
    } catch (err: any) {
      setSmsError(err.message);
    } finally {
      setSmsOtpLoading(false);
    }
  };

  const verifySmsOtp = async () => {
    if (!smsVerificationCode) {
      setSmsError("SMS token is required");
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
      if (!res.ok) throw new Error(data.error || "OTP code invalid");
      setIsSmsVerifiedLocal(true);
      setTimeout(() => {
        setActiveRegStep(4);
      }, 700);
    } catch (err: any) {
      setSmsError(err.message);
    } finally {
      setSmsVerifyLoading(false);
    }
  };

  // Clean form navigation handlers
  const handleNav = (pathStr: string) => {
    setCurrentPath(pathStr);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Safe client contact trigger
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setTimeout(() => {
      setContactSubmitting(false);
      setContactSuccess(true);
      setContactData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setContactSuccess(false), 5000);
    }, 1000);
  };

  // Safe newsletter submission
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  // Dynamic themes styles aliases
  const isLight = theme === "light";
  const bgMain = isLight
    ? "bg-slate-50 text-slate-800"
    : "bg-slate-900 text-slate-100";
  const bgCard = isLight
    ? "bg-white border-slate-200/80 shadow-sm"
    : "bg-slate-950 border-slate-850 shadow-2xl";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";
  const borderCard = isLight ? "border-slate-200" : "border-slate-850";
  const inputBg = isLight
    ? "bg-slate-100 text-slate-900 border-slate-200 focus:border-blue-500 focus:bg-white"
    : "bg-slate-900 text-white border-slate-800 focus:border-emerald-500";

  // Standard interactive QA Accordion Data
  const faqs = [
    {
      q: "How do I register on the VoTex platform?",
      a: "Voters click on 'Register' to fill in passport / National ID numbers, emails, physical demographics, and capture a biometric spatial face model using their browser camera. Once approved, voting access is granted.",
    },
    {
      q: "Is my cast ballot entirely secure and anonymous?",
      a: "Yes. VoTex applies advanced cryptographic hashing structures to separate your identity registration from your cast ballot. No administrator, candidate, or system agent can associate your individual profile with your choices.",
    },
    {
      q: "Can a voter cast their ballot more than once?",
      a: "Absolutely not. The system implements a strict '1 Voter = 1 Choice Limit' using unique anonymous ballot claim tokens. Any second voting attempt under the same profile is blocked instantly by the ledger filters.",
    },
    {
      q: "How does the biometric facial verification work?",
      a: "Our scanner maps geometric face coordinates and simulates liveness cues completely within the sandbox. It does not send raw recordings to third-party databases, ensuring 100% citizen data privacy.",
    },
    {
      q: "When are the official election results published?",
      a: "As soon as the configured election timeline ends, designated election administrators review the cryptographic audit receipts and publish real-time results directly to the citizen dashboards.",
    },
  ];

  return (
    <div
      className={`min-h-screen ${bgMain} flex flex-col relative transition-colors duration-300 font-sans leading-relaxed`}
    >
      {/* 1. STICKY NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-40 w-full backdrop-blur-md border-b ${isLight ? "bg-white/80 border-slate-200" : "bg-slate-950/80 border-slate-850"} transition-colors py-3 px-4 md:px-8`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <button
            type="button"
            onClick={() => handleNav("/")}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <div className="bg-gradient-to-tr from-emerald-500 to-blue-600 p-2 md:p-2.5 rounded-2xl text-slate-950 font-black tracking-wider text-xs md:text-sm shadow shadow-emerald-500/20">
              VoTex
            </div>
            <div className="text-left">
              <h1
                className={`font-black text-sm md:text-base ${textTitle} leading-none tracking-tight`}
              >
                VoTex Public
              </h1>
              <span className="text-[9px] text-slate-500 font-mono tracking-wider block mt-0.5 uppercase font-bold">
                STATE REVOLUTIONARY AUDITS
              </span>
            </div>
          </button>

          {/* Desktop Center Navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => handleNav("/")}
              className={`transition-colors cursor-pointer ${currentPath === "/" ? "text-emerald-500 font-extrabold" : `${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}`}
            >
              Home
            </button>
            <a
              href="#about-section"
              className={`transition-colors ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}
            >
              About
            </a>
            <a
              href="#how-it-works-section"
              className={`transition-colors ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}
            >
              How It Works
            </a>
            <a
              href="#features-section"
              className={`transition-colors ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}
            >
              Features
            </a>
            <button
              onClick={() => handleNav("/elections")}
              className={`transition-colors cursor-pointer ${currentPath === "/elections" ? "text-emerald-500 font-extrabold" : `${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}`}
            >
              Elections
            </button>
            <button
              onClick={() => handleNav("/results")}
              className={`transition-colors cursor-pointer ${currentPath === "/results" ? "text-indigo-500 font-extrabold" : `${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}`}
            >
              Results
            </button>
            <a
              href="#faq-section"
              className={`transition-colors ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}
            >
              FAQ
            </a>
            <a
              href="#contact-section"
              className={`transition-colors ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}
            >
              Contact
            </a>
          </nav>

          {/* Right Action buttons & Theme switch */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(isLight ? "dark" : "light")}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-800" : "bg-slate-900 hover:bg-slate-800 text-yellow-400"}`}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLight ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {/* Login / Register CTAs */}
            <button
              onClick={() => handleNav("/login")}
              className={`hidden sm:inline-block px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLight
                  ? "bg-slate-200/60 text-slate-800 hover:bg-slate-200 border border-slate-300/40"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-850 hover:text-white border border-slate-800"
              }`}
            >
              Login (Voter)
            </button>

            <button
              onClick={() => handleNav("/register")}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 text-xs font-extrabold rounded-xl cursor-pointer shadow-sm"
            >
              Register Now
            </button>

            {/* Mobile hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl cursor-pointer ${isLight ? "bg-slate-100 text-slate-700" : "bg-slate-900 text-slate-400"}`}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-x-0 top-16 z-30 p-5 shadow-2xl border-b flex flex-col gap-4 lg:hidden ${isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-950 border-slate-850 text-white"}`}
          >
            <button
              onClick={() => handleNav("/")}
              className="text-left text-sm font-semibold py-2"
            >
              Home
            </button>
            <a
              href="#about-section"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-sm font-semibold py-2"
            >
              About
            </a>
            <a
              href="#how-it-works-section"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-sm font-semibold py-2"
            >
              How It Works
            </a>
            <a
              href="#features-section"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-sm font-semibold py-2"
            >
              Features
            </a>
            <button
              onClick={() => handleNav("/elections")}
              className="text-left text-sm font-semibold py-2"
            >
              Elections
            </button>
            <button
              onClick={() => {
                handleNav("/results");
                setMobileMenuOpen(false);
              }}
              className="text-left text-sm font-semibold py-2 text-indigo-500 font-bold"
            >
              Results
            </button>
            <a
              href="#faq-section"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-sm font-semibold py-2"
            >
              FAQ
            </a>
            <a
              href="#contact-section"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-sm font-semibold py-2"
            >
              Contact
            </a>

            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex gap-3 mt-2">
              <button
                onClick={() => handleNav("/login")}
                className={`flex-1 text-center py-2.5 px-4 text-xs font-bold rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-900"}`}
              >
                Login
              </button>
              <button
                onClick={() => handleNav("/register")}
                className="flex-1 bg-emerald-500 text-slate-950 text-center py-2.5 px-4 text-xs font-bold rounded-xl"
              >
                Register
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render based on router paths */}
      <main className="flex-grow">
        {/* ==================== A: CORE HOME PAGE ROUTE ==================== */}
        {currentPath === "/" && (
          <div>
            {/* HERO SECTION */}
            <section
              className={`relative pt-12 pb-24 md:py-32 overflow-hidden ${isLight ? "bg-gradient-to-b from-blue-50/70 via-white to-slate-50" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-slate-950"}`}
            >
              {/* Abs grid effect */}
              <div
                className={`absolute inset-0 opacity-10 pointer-events-none ${isLight ? "bg-[radial-gradient(#0f172a_1px,transparent_1px)] bg-[size:30px_30px]" : "bg-[radial-gradient(#38bdf8_1px,transparent_1px)] bg-[size:30px_30px]"}`}
              />
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-emerald-400/10 blur-[8rem] rounded-full pointer-events-none" />

              <div className="max-w-7xl mx-auto px-4 md:px-8 relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Heading Column */}
                <div className="lg:col-span-7 flex flex-col items-start text-left max-w-3xl">
                  {/* Small tag badge */}
                  <div
                    className={`mb-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider ${isLight ? "bg-blue-100/70 text-blue-700" : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/45"}`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>State Audited Certified Platform v1.42</span>
                  </div>

                  <h1
                    className={`text-4xl md:text-5xl lg:text-6xl font-black ${textTitle} leading-[1.1] mb-6 tracking-tight bg-clip-text`}
                  >
                    Secure Digital Voting for a{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                      Transparent
                    </span>{" "}
                    Future
                  </h1>

                  <p
                    className={`text-sm md:text-base ${textMuted} mb-8 leading-relaxed max-w-2xl`}
                  >
                    VoTex is the state-certified digital secure framework
                    combining native hardware biometric capturing with dynamic
                    local validation tokens. Safeguard civic integrity with
                    certified one-vote-per-voter liveness assurance records.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => handleNav("/register")}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 transition-transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <UserCheck2 className="w-4 h-4" />
                      <span>Onboard Register Now</span>
                    </button>

                    <button
                      onClick={() => handleNav("/login")}
                      className={`px-8 py-4 border border-solid rounded-2xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isLight
                          ? "border-slate-300 text-slate-800 bg-white hover:bg-slate-100"
                          : "border-slate-800 text-slate-200 hover:bg-slate-850 hover:text-white"
                      }`}
                    >
                      <span>Voter Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleNav("/results")}
                      className={`px-8 py-4 border border-solid rounded-2xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isLight
                          ? "border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-md"
                          : "border-indigo-900 text-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/50"
                      }`}
                    >
                      <Award className="w-4 h-4 text-indigo-500" />
                      <span>View Results</span>
                    </button>
                  </div>

                  {/* Trust badge tags */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-12 pt-8 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>SECURE VOTING REGISTER</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <UserCheck2 className="w-4 h-4 text-teal-500" />
                      <span>FACE VERIFICATION CHALLENGES</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Award className="w-4 h-4 text-blue-500" />
                      <span>ONE PERSON = ONE BALLOT</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Lock className="w-4 h-4 text-indigo-500" />
                      <span>ENCRYPTED PRIVATE CODES</span>
                    </div>
                  </div>
                </div>

                {/* Right Visual Badge Column */}
                <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
                  <div
                    className={`p-8 rounded-3xl border ${bgCard} max-w-sm w-full relative group transition-all duration-300 hover:border-emerald-500/50`}
                  >
                    {/* Corner shine highlight */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-xl rounded-full" />

                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                      <div className="bg-emerald-500/15 p-2.5 rounded-xl text-emerald-500">
                        <Vote className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`font-black text-sm ${textTitle}`}>
                          Active Ledger Integrity
                        </h4>
                        <span className="text-[9px] font-mono text-slate-400 font-bold block">
                          Status: SECURE MONITOR
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      <div className="bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl flex items-center justify-between">
                        <span>Liveness Simulation:</span>
                        <span className="text-emerald-500 font-extrabold uppercase">
                          OK (100%)
                        </span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl flex items-center justify-between">
                        <span>Duplicate Filters:</span>
                        <span className="text-blue-500 font-extrabold uppercase">
                          ACTIVE
                        </span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl flex items-center justify-between">
                        <span>Database Engines:</span>
                        <span className="text-indigo-400 font-bold">
                          Postgres & JSON
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1 text-[11px]">
                      <span className={`${textTitle} font-bold`}>
                        Platform Public Audit Key
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 break-all select-all py-1.5 px-2.5 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-850">
                        SHA256: 4e9c70b80dfa245cfdbe019
                      </span>
                    </div>

                    {/* Quick navigation anchor info */}
                    <div className="mt-4 flex justify-between text-[10px] font-mono text-slate-400">
                      <span>VO-TEX CERT v1.4</span>
                      <span className="animate-pulse flex items-center gap-1 text-emerald-500">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        ONLINE
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* STATISTICS SECTION */}
            <section
              className={`py-12 border-y ${borderCard} ${isLight ? "bg-slate-100" : "bg-slate-950"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 divide-slate-200 dark:divide-slate-850 divide-y md:divide-y-0 md:divide-x text-center">
                  <div className="pt-4 md:pt-0">
                    <h3 className="text-2xl md:text-3xl font-black text-emerald-500">
                      {stats.registeredVoters.toLocaleString()}
                    </h3>
                    <p
                      className={`text-[10px] md:text-xs font-mono font-bold mt-1 uppercase ${textMuted}`}
                    >
                      Registered Voters
                    </p>
                  </div>

                  <div className="pt-4 md:pt-0">
                    <h3 className="text-2xl md:text-3xl font-black text-blue-500">
                      {stats.verifiedVoters.toLocaleString()}
                    </h3>
                    <p
                      className={`text-[10px] md:text-xs font-mono font-bold mt-1 uppercase ${textMuted}`}
                    >
                      Verified Citizens
                    </p>
                  </div>

                  <div className="pt-4 md:pt-0">
                    <h3 className="text-2xl md:text-3xl font-black text-teal-400">
                      {stats.electionsConducted.toLocaleString()}
                    </h3>
                    <p
                      className={`text-[10px] md:text-xs font-mono font-bold mt-1 uppercase ${textMuted}`}
                    >
                      Elections Conducted
                    </p>
                  </div>

                  <div className="pt-4 md:pt-0">
                    <h3 className="text-2xl md:text-3xl font-black text-indigo-400">
                      {stats.candidates.toLocaleString()}
                    </h3>
                    <p
                      className={`text-[10px] md:text-xs font-mono font-bold mt-1 uppercase ${textMuted}`}
                    >
                      Candidates Registered
                    </p>
                  </div>

                  <div className="pt-4 md:pt-0 col-span-2 md:col-span-1">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-100 bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                      {stats.votesCast.toLocaleString()}
                    </h3>
                    <p
                      className={`text-[10px] md:text-xs font-mono font-bold mt-1 uppercase ${textMuted}`}
                    >
                      Cryptographic Votes Cast
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ABOUT VOTEX SECTION */}
            <section
              id="about-section"
              className={`py-20 md:py-28 ${isLight ? "bg-white" : "bg-slate-900"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                  <div className="flex-1 text-left">
                    <span className="text-[10px] text-blue-500 font-mono font-extrabold uppercase tracking-widest block mb-3">
                      TRUST & DECENTRALIZATION STATEMENT
                    </span>
                    <h2
                      className={`text-3xl md:text-4xl font-black ${textTitle} leading-tight mb-6 tracking-tight`}
                    >
                      Democratizing Civil Voting Safely With Browser Sandbox
                      Biometrics.
                    </h2>
                    <p
                      className={`text-xs md:text-sm ${textMuted} mb-6 leading-relaxed`}
                    >
                      VoTex answers the foundational trust challenges of modern
                      online voting. By eliminating third-party visual reporting
                      databases, the platform executes contour face liveness
                      challenges locally on the client browser. No photos or
                      templates are ever sent to unauthorized cloud networks.
                    </p>
                    <p
                      className={`text-xs md:text-sm ${textMuted} mb-8 leading-relaxed`}
                    >
                      Ideal for academic boards, state administrations,
                      institutional selections, and civil committees requiring
                      secure cryptography, one-person-one-vote rules, and direct
                      public verification structures.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-2xl border ${borderCard} bg-slate-50 dark:bg-slate-950`}
                      >
                        <h4
                          className={`text-xs font-extrabold uppercase ${textTitle} mb-1 flex items-center gap-1.5`}
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span>No Identity Leakage</span>
                        </h4>
                        <p
                          className={`text-[10px] ${textMuted} leading-relaxed`}
                        >
                          Voter credentials are separated from the dynamic
                          ballot hash token, ensuring anonymity.
                        </p>
                      </div>

                      <div
                        className={`p-4 rounded-2xl border ${borderCard} bg-slate-50 dark:bg-slate-950`}
                      >
                        <h4
                          className={`text-xs font-extrabold uppercase ${textTitle} mb-1 flex items-center gap-1.5`}
                        >
                          <User className="w-4 h-4 text-blue-500" />
                          <span>Decentralized Verification</span>
                        </h4>
                        <p
                          className={`text-[10px] ${textMuted} leading-relaxed`}
                        >
                          SMTP codes and Twilio SMS verification secure initial
                          registration.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex justify-center">
                    <div className="relative max-w-md w-full">
                      {/* Decorative elements */}
                      <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div
                        className={`relative p-8 rounded-2xl border ${bgCard}`}
                      >
                        <div className="flex items-center gap-2 text-indigo-500 mb-4 font-mono text-[10px] font-extrabold tracking-wider bg-indigo-500/10 w-fit px-2.5 py-1 rounded-full">
                          <Activity className="w-3.5 h-3.5" />
                          <span>AUTHENTICATED AUDIT CHECKS</span>
                        </div>
                        <ul className="flex flex-col gap-4 text-xs font-sans text-left text-slate-600 dark:text-slate-300">
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                              ✔
                            </span>
                            <div>
                              <strong className="block text-slate-800 dark:text-white">
                                Enterprise Standards compliance
                              </strong>
                              <span className="text-[10px] text-slate-500">
                                Formulated on standard election rules and
                                parameters.
                              </span>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                              ✔
                            </span>
                            <div>
                              <strong className="block text-slate-800 dark:text-white">
                                Responsive Client Control Panels
                              </strong>
                              <span className="text-[10px] text-slate-500">
                                Responsive dashboards for casting ballots on any
                                tablet/mobile.
                              </span>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                              ✔
                            </span>
                            <div>
                              <strong className="block text-slate-800 dark:text-white">
                                Public Verification Ledgers
                              </strong>
                              <span className="text-[10px] text-slate-500">
                                Every ballot generates a receipts SHA lookup
                                hash instantly.
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURES SECTION */}
            <section
              id="features-section"
              className={`py-20 md:py-24 border-y ${borderCard} ${isLight ? "bg-slate-50" : "bg-slate-950"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
                <span className="text-[10px] text-emerald-500 font-mono font-extrabold uppercase tracking-widest block mb-3">
                  CONVENIENT COMPREHENSIVE FEATURES
                </span>
                <h2
                  className={`text-3xl md:text-4xl font-black ${textTitle} leading-tight mb-4 tracking-tight`}
                >
                  Engengineered for Maximum Security & Seamless Flow
                </h2>
                <p
                  className={`text-xs md:text-sm ${textMuted} mb-16 max-w-2xl mx-auto leading-relaxed`}
                >
                  VoTex combines standard security parameters to establish trust
                  and integrity at each phase of the civic decision-making
                  process.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Cards */}
                  {[
                    {
                      title: "Secure Onboard Entry",
                      desc: "Unified citizen information registries with strict national identity verification policies.",
                      icon: <User className="w-5 h-5" />,
                      color: "text-emerald-500",
                    },
                    {
                      title: "Liveness Verification",
                      desc: "Local browser face coordinate matching mapping to assert physical presence.",
                      icon: <ShieldCheck className="w-5 h-5" />,
                      color: "text-blue-500",
                    },
                    {
                      title: "SMTP Authentication",
                      desc: "Email token dispatches that verify active electronic communication channels.",
                      icon: <Mail className="w-5 h-5" />,
                      color: "text-teal-500",
                    },
                    {
                      title: "Twilio SMS Gateway",
                      desc: "One-Time Password keys routed via standard cellular SMS to authenticate logins.",
                      icon: <Phone className="w-5 h-5" />,
                      color: "text-indigo-500",
                    },
                    {
                      title: "Prevent Double-Voting",
                      desc: "Cryptographic allocation matching ensuring exactly one ballot is registered per verified profile.",
                      icon: <Award className="w-5 h-5" />,
                      color: "text-amber-500",
                    },
                    {
                      title: "Live Election Preview",
                      desc: "Access ongoing, upcoming, and finalized election metrics straight from the portal board.",
                      icon: <Calendar className="w-5 h-5" />,
                      color: "text-rose-500",
                    },
                  ].map((feat, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border ${bgCard} text-left flex flex-col justify-between hover:border-emerald-500/20 hover:scale-[1.02] transition-all duration-300`}
                    >
                      <div>
                        <div
                          className={`p-3 bg-slate-100 dark:bg-slate-900 w-fit rounded-xl ${feat.color} mb-4`}
                        >
                          {feat.icon}
                        </div>
                        <h4
                          className={`text-sm font-extrabold uppercase ${textTitle} mb-2`}
                        >
                          {feat.title}
                        </h4>
                        <p
                          className={`text-[11px] leading-relaxed ${textMuted}`}
                        >
                          {feat.desc}
                        </p>
                      </div>
                      <div className="mt-5 text-[10px] font-mono text-slate-400 font-semibold flex items-center gap-1 group-hover:text-emerald-500 cursor-pointer">
                        <span>LEARN MORE PROTOCOLS</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section
              id="how-it-works-section"
              className={`py-20 md:py-28 ${isLight ? "bg-white" : "bg-slate-900"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
                <span className="text-[10px] text-blue-500 font-mono font-extrabold uppercase tracking-widest block mb-3">
                  SIMPLIFIED CITIZEN MANUAL
                </span>
                <h2
                  className={`text-3xl md:text-4xl font-black ${textTitle} leading-tight mb-4 tracking-tight`}
                >
                  How the VoTex Platform Works
                </h2>
                <p
                  className={`text-xs md:text-sm ${textMuted} mb-16 max-w-2xl mx-auto leading-relaxed`}
                >
                  A clean, 5-step transparent guide to casting your vote safely
                  within the secure digital ledger.
                </p>

                <div className="relative mt-12 grid grid-cols-1 md:grid-cols-5 gap-8">
                  {/* Decorative line */}
                  <div className="hidden md:block absolute top-[28%] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 opacity-20 pointer-events-none z-0" />

                  {[
                    {
                      step: "01",
                      title: "Voter Registration",
                      desc: "Submit your basic demographics details and choose your profile credentials.",
                    },
                    {
                      step: "02",
                      title: "Contact Validation",
                      desc: "Complete safety validations with instant e-mail/mobile validation code check.",
                    },
                    {
                      step: "03",
                      title: "Secure Face Map",
                      desc: "Complete an active face scanner challenge using your local device camera.",
                    },
                    {
                      step: "04",
                      title: "Cast Your Ballot",
                      desc: "Sign in, review the candidate profiles list, and cryptographically cast votes.",
                    },
                    {
                      step: "05",
                      title: "Live Review Results",
                      desc: "Examine real-time audit logs and compiled bar statistics safely.",
                    },
                  ].map((st, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center relative z-10"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-950 border-2 border-emerald-500/80 text-emerald-500 flex items-center justify-center font-bold font-mono text-sm shadow mb-4">
                        {st.step}
                      </div>

                      <h4
                        className={`text-xs font-extrabold uppercase ${textTitle} mb-2`}
                      >
                        {st.title}
                      </h4>
                      <p
                        className={`text-[10px] leading-relaxed text-center ${textMuted} max-w-[180px]`}
                      >
                        {st.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ACTIVE ELECTIONS PREVIEW */}
            <section
              className={`py-20 md:py-24 border-y ${borderCard} ${isLight ? "bg-slate-50" : "bg-slate-950"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-12">
                  <div className="text-left">
                    <span className="text-[10px] text-teal-500 font-mono font-extrabold uppercase tracking-widest block mb-2">
                      LIVE PLATFORM TELEMETRY
                    </span>
                    <h2
                      className={`text-3xl font-black ${textTitle} tracking-tight`}
                    >
                      Active Elections Board
                    </h2>
                    <p className={`text-xs ${textMuted} mt-2`}>
                      Review running elections, candidates lists, and ongoing
                      audit statistics.
                    </p>
                  </div>

                  <button
                    onClick={() => handleNav("/elections")}
                    className={`px-4 py-2 text-xs font-bold font-mono rounded-xl border border-solid hover:opacity-90 flex items-center gap-1 transition-all cursor-pointer ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-700"
                        : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    <span>VIEW ALL PORTAL ELECTIONS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {electionsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                    <span className="text-xs text-slate-500 font-mono">
                      LOADING CENTRAL LEDGER COGNITIONS...
                    </span>
                  </div>
                ) : elections.length === 0 ? (
                  <div
                    className={`p-8 rounded-2xl border text-center ${bgCard}`}
                  >
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                    <h4 className={`font-semibold text-sm ${textTitle}`}>
                      No Active Elections Found
                    </h4>
                    <p className={`text-xs ${textMuted} mt-1 max-w-sm mx-auto`}>
                      There are currently no active public election directories
                      pending. Administrators will publish records soon.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {elections.slice(0, 3).map((el: any) => {
                      const isActive = el.status === "Active";
                      return (
                        <div
                          key={el.id}
                          className={`p-6 rounded-2xl border ${bgCard} flex flex-col justify-between hover:scale-[1.01] hover:border-emerald-500/25 transition-all duration-300`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-4">
                              <span
                                className={`px-2.5 py-1 text-[9px] font-bold font-mono rounded-full uppercase leading-none ${
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-slate-500/10 text-slate-400"
                                }`}
                              >
                                {el.status}
                              </span>
                              <span
                                className={`text-[9px] font-mono font-bold ${textMuted} uppercase`}
                              >
                                {el.type}
                              </span>
                            </div>

                            <h4
                              className={`font-extrabold text-sm ${textTitle} leading-snug mb-2`}
                            >
                              {el.title}
                            </h4>
                            <p
                              className={`text-[10px] leading-relaxed mb-4 ${textMuted} line-clamp-2`}
                            >
                              {el.description}
                            </p>
                          </div>

                          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-2">
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-4">
                              <span>
                                Starts:{" "}
                                {el.startDate
                                  ? new Date(el.startDate).toLocaleDateString()
                                  : "TBD"}
                              </span>
                              <span>
                                Ends:{" "}
                                {el.endDate
                                  ? new Date(el.endDate).toLocaleDateString()
                                  : "TBD"}
                              </span>
                            </div>

                            <button
                              onClick={() => handleNav("/elections")}
                              className="w-full py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              View Details & Cast
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* SECURITY PROTOCOLS SECTION */}
            <section
              id="security-section"
              className={`py-20 md:py-24 ${isLight ? "bg-white" : "bg-slate-900"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-5 relative flex justify-center">
                    <div
                      className={`p-8 rounded-3xl border ${bgCard} max-w-sm w-full relative z-10`}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-xl" />

                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          HARDWARE LEDGER CHECKS
                        </span>
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                      </div>

                      <div className="flex flex-col gap-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>Auth Strategy:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold uppercase">
                            JWT Signatures
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Blowfish Crypt:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold uppercase">
                            Bcrypt Salts
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Biometrics Challenges:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold uppercase">
                            Contour Mesh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mails Dispatch:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold uppercase">
                            SMTP Secure
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>SMS Integrations:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold uppercase">
                            Twilio OTP API
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>System Ledgers:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">
                            Local JSON Files
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1 text-[11px] text-left">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                          Audit Security Signature
                        </span>
                        <span className="text-[10px] text-emerald-500 font-mono font-bold break-all bg-emerald-500/5 p-2 rounded">
                          VoTex-Security-Verified-Enterprise-2026
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 text-left">
                    <span className="text-[10px] text-indigo-500 font-mono font-extrabold uppercase tracking-widest block mb-3">
                      STATE INDUSTRIAL CRYPTOGRAPHY
                    </span>
                    <h2
                      className={`text-3xl md:text-4xl font-black ${textTitle} leading-tight mb-6 tracking-tight`}
                    >
                      Enterprise Cryptography Restoring Integrity
                    </h2>
                    <p
                      className={`text-xs md:text-sm ${textMuted} mb-6 leading-relaxed`}
                    >
                      VoTex constructs state-verified, tamper-proof ballot
                      receipts. When voters execute candidates selections, the
                      system records logs fully insulated using bcrypt
                      encryption frameworks and client-auth secrets.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-xs">
                      <div>
                        <h4
                          className={`font-extrabold uppercase ${textTitle} mb-1.5`}
                        >
                          🔒 Secure SSL Layers
                        </h4>
                        <p
                          className={`text-[10px] leading-relaxed ${textMuted}`}
                        >
                          HTTPS end-to-end transmissions preventing any
                          possibility of man-in-the-middle network tampering.
                        </p>
                      </div>

                      <div>
                        <h4
                          className={`font-extrabold uppercase ${textTitle} mb-1.5`}
                        >
                          💾 Secure Local Storage
                        </h4>
                        <p
                          className={`text-[10px] leading-relaxed ${textMuted}`}
                        >
                          Session signatures are fully insulated inside standard
                          HTML5 localStorage and destroyed cleanly on sign out.
                        </p>
                      </div>

                      <div>
                        <h4
                          className={`font-extrabold uppercase ${textTitle} mb-1.5`}
                        >
                          👀 Full Audit Trail
                        </h4>
                        <p
                          className={`text-[10px] leading-relaxed ${textMuted}`}
                        >
                          Administrative, candidate registration, and system
                          updates are compiled inside irreversible audit lists.
                        </p>
                      </div>

                      <div>
                        <h4
                          className={`font-extrabold uppercase ${textTitle} mb-1.5`}
                        >
                          🚫 Double Voting Filters
                        </h4>
                        <p
                          className={`text-[10px] leading-relaxed ${textMuted}`}
                        >
                          Rigid algorithmic constraints prevent voter identity
                          profiles from registering multiple ballots.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECURITY RECOMMENDATIONS & DIAGRAM SECTION */}
            <section
              id="security-roadmap-section"
              className={`py-20 md:py-24 border-y ${borderCard} ${isLight ? "bg-white" : "bg-slate-900"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                  <span className="text-[10px] text-emerald-500 font-mono font-extrabold uppercase tracking-widest block mb-3">
                    PRODUCTION ARCHITECTURE & BLUEPRINT
                  </span>
                  <h2
                    className={`text-3xl md:text-4xl font-black ${textTitle} leading-tight mb-4 tracking-tight`}
                  >
                    Recommended Security Blueprint & DB Resilience
                  </h2>
                  <p
                    className={`text-xs md:text-sm ${textMuted} max-w-2xl mx-auto leading-relaxed`}
                  >
                    A complete overview of enterprise-grade security structures
                    recommended for real-world municipal deployments, alongside
                    our hybrid local-cloud connection topology.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                  {/* Left Column: Security Recommendations */}
                  <div
                    className={`p-8 rounded-3xl border ${bgCard} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h3
                            className={`font-black uppercase text-sm ${textTitle}`}
                          >
                            Recommended Security Features
                          </h3>
                          <p className="text-[10px] text-slate-500">
                            Essential election-grade parameters for true
                            sovereign integrity
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          {
                            title: "AES-256 Encryption",
                            desc: "For secure resting database state of all sensitive credentials.",
                          },
                          {
                            title: "Argon2id Password Hashing",
                            desc: "Top-tier cryptographic resistance to GPU-brute force attacks.",
                          },
                          {
                            title: "JWT Access & Refresh",
                            desc: "Dual token rotation lifecycle prevent session hijacking.",
                          },
                          {
                            title: "Multi-Factor Auth (MFA)",
                            desc: "Out-of-band second-factor email/SMS verification channels.",
                          },
                          {
                            title: "Encrypted Ballot Storage",
                            desc: "Blind homomorphic receipts masking vote context entirely.",
                          },
                          {
                            title: "Immutable Audit Logs",
                            desc: "Chained ledger tracking system edits cryptographically.",
                          },
                          {
                            title: "Digital Signatures",
                            desc: "Individual cryptographic seal assigned to each cast ballot.",
                          },
                          {
                            title: "IP/Device Fingerprinting",
                            desc: "Behavioral and network fingerprint risk scoring.",
                          },
                          {
                            title: "Strict Rate Limiting",
                            desc: "Mitigates brute-force scripts and automated vectors.",
                          },
                          {
                            title: "Account Lockout Policy",
                            desc: "Anti-spray temporary lockouts on successive failed auth.",
                          },
                          {
                            title: "End-to-End TLS",
                            desc: "Enforce active SSL sessions and strict transport header safety.",
                          },
                          {
                            title: "Database Backups",
                            desc: "Periodic automated snapshots with multi-region redundancy.",
                          },
                          {
                            title: "Automatic Failover",
                            desc: "Ensures seamless state migration when primary clouds fail.",
                          },
                          {
                            title: "RBAC Controls",
                            desc: "Granular administrative views ensuring strict separation of powers.",
                          },
                          {
                            title: "Secure File Storage",
                            desc: "Dedicated cloud storage pools with dynamic read tokens for documents.",
                          },
                          {
                            title: "Biometric Liveness check",
                            desc: "3D visual depth/texture verification for true human detection.",
                          },
                        ].map((feat, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-500/5 hover:bg-slate-500/10 transition-colors flex items-start gap-2.5"
                          >
                            <span className="text-emerald-500 font-bold text-xs mt-0.5">
                              ✓
                            </span>
                            <div>
                              <h4
                                className={`text-[11px] font-bold ${textTitle}`}
                              >
                                {feat.title}
                              </h4>
                              <p
                                className={`text-[10px] ${textMuted} leading-tight mt-0.5`}
                              >
                                {feat.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Database Connection Flow diagram */}
                  <div
                    className={`p-8 rounded-3xl border ${bgCard} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                          <Activity className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h3
                            className={`font-black uppercase text-sm ${textTitle}`}
                          >
                            Database Connection Flow
                          </h3>
                          <p className="text-[10px] text-slate-500">
                            Visual topology of the high-resilience local-cloud
                            fallback
                          </p>
                        </div>
                      </div>

                      {/* Visual Flow diagram */}
                      <div className="relative p-6 rounded-2xl bg-slate-500/5 border border-slate-500/10 my-4 text-xs font-mono">
                        <div className="flex flex-col items-center gap-4">
                          {/* Node 1: Application */}
                          <div className="w-48 py-2.5 px-4 rounded-xl border border-blue-500/30 bg-blue-500/5 text-center shadow-sm relative z-10 transition-all hover:scale-[1.02]">
                            <span className="text-blue-400 font-bold block text-[10px]">
                              APPLICATION STARTUP
                            </span>
                            <span className="text-slate-400 text-[9px]">
                              Server Initialization
                            </span>
                          </div>

                          {/* Arrow down */}
                          <div className="h-6 w-0.5 bg-gradient-to-b from-blue-500 to-indigo-500 relative">
                            <div className="absolute bottom-0 -left-1 w-2.5 h-2.5 border-b-2 border-r-2 border-indigo-500 rotate-45" />
                          </div>

                          {/* Node 2: Try Connection */}
                          <div className="w-52 py-2.5 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 text-center shadow-sm relative z-10 transition-all hover:scale-[1.02]">
                            <span className="text-indigo-400 font-bold block text-[10px]">
                              TRY MONGODB CONNECTION
                            </span>
                            <span className="text-slate-400 text-[9px]">
                              Check MONGODB_URI Context
                            </span>
                          </div>

                          {/* Branch indicator */}
                          <div className="w-full max-w-[280px] h-10 border-x-2 border-t-2 border-slate-500/30 rounded-t-lg relative mt-1">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[8px] text-slate-400 font-semibold uppercase">
                              Branching Strategy
                            </div>

                            {/* Left Line Label (Success) */}
                            <span className="absolute -top-5 left-2 text-[9px] text-emerald-500 font-bold">
                              ✓ Connected
                            </span>

                            {/* Right Line Label (Failed) */}
                            <span className="absolute -top-5 right-2 text-[9px] text-red-500 font-bold">
                              ✗ Host Unreachable
                            </span>
                          </div>

                          {/* Leaf Nodes */}
                          <div className="grid grid-cols-2 gap-4 w-full">
                            {/* Success flow */}
                            <div className="flex flex-col items-center">
                              <div className="w-full p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 text-center transition-all hover:scale-[1.02]">
                                <span className="text-emerald-400 font-bold block text-[10px]">
                                  USE VOTEX_DB
                                </span>
                                <span className="text-slate-400 text-[9px] leading-normal">
                                  Fast, production-scale state engine in MongoDB
                                  cloud
                                </span>
                              </div>
                            </div>

                            {/* Failed flow */}
                            <div className="flex flex-col items-center">
                              <div className="w-full p-3 rounded-xl border border-amber-500/45 bg-amber-500/5 text-center transition-all hover:scale-[1.02]">
                                <span className="text-amber-400 font-bold block text-[10px]">
                                  LOAD LOCAL JSON
                                </span>
                                <span className="text-slate-400 text-[9px] leading-normal">
                                  Fallback to src/db/data/*.json records
                                  natively
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Join back */}
                          <div className="grid grid-cols-2 gap-4 w-full h-[15px] border-x-2 border-b-2 border-slate-500/20 rounded-b-lg -mt-3"></div>

                          {/* Arrow down */}
                          <div className="h-6 w-0.5 bg-slate-500/30 relative -mt-[1px]">
                            <div className="absolute bottom-0 -left-1 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-400 rotate-45" />
                          </div>

                          {/* Node 5: Continue running */}
                          <div className="w-60 py-2.5 px-4 rounded-xl border border-teal-500/30 bg-teal-500/5 text-center shadow-lg transition-all hover:scale-[1.02]">
                            <span className="text-teal-400 font-bold block text-[10px]">
                              CONTINUE ACTIVE AND RUNNING
                            </span>
                            <span className="text-slate-400 text-[9px]">
                              Graceful runtime insulation from loss-of-signal
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Summary Block */}
                <div
                  className={`mt-10 p-6 rounded-2xl border ${bgCard} text-xs leading-relaxed text-left max-w-7xl mx-auto`}
                >
                  <p className={`${textMuted}`}>
                    <strong className={`${textTitle} font-bold mr-1`}>
                      Architecture Assessment:
                    </strong>
                    Overall, this is a solid architecture for an online voting
                    platform. The combination of a primary MongoDB database with
                    a local JSON fallback improves resilience, and with the
                    additional security measures outlined above, it can form the
                    basis of a robust, production-oriented system. For a
                    real-world deployment, ensure the system also complies with
                    the legal, regulatory, and security requirements applicable
                    to elections in the jurisdiction where it will be used.
                  </p>
                </div>
              </div>
            </section>

            {/* TESTIMONIALS */}
            <section
              className={`py-20 md:py-24 border-y ${borderCard} ${isLight ? "bg-slate-50" : "bg-slate-950"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
                <span className="text-[10px] text-indigo-500 font-mono font-extrabold uppercase tracking-widest block mb-3">
                  RECOMMENDED CITIZEN RECOGNITIONS
                </span>
                <h2
                  className={`text-3xl md:text-4xl font-black ${textTitle} leading-tight mb-4 tracking-tight`}
                >
                  Trusted by Institutions Worldwide
                </h2>
                <p
                  className={`text-xs md:text-sm ${textMuted} mb-16 max-w-2xl mx-auto leading-relaxed`}
                >
                  See why universities, city councils, and creative corporations
                  choose VoTex as their secure democratic engine.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      name: "Dean Arthur Pendelton",
                      org: "Cambridge High Science Department",
                      review:
                        "VoTex changed how we conduct student council selections. The liveness face scan simulated complete in-browser trust. No complaints from over 4,000 active student voters.",
                      stars: 5,
                      img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
                    },
                    {
                      name: "Elena Rostova",
                      org: "Vanguard Tech Association Chair",
                      review:
                        "The administrative dashboard makes creating dynamic candidate manifests and reviewing audit signatures incredibly simple. Biometric scanning was lightning fast and 100% stable.",
                      stars: 5,
                      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
                    },
                    {
                      name: "Marcus Aurelius Jr.",
                      org: "Stoico Municipal Council Lead",
                      review:
                        "Exactly what a modern democratic system requires: strict visual privacy, one person one vote lock policies, and beautiful real-time results publishing on voter panels.",
                      stars: 5,
                      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
                    },
                  ].map((test, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border ${bgCard} text-left flex flex-col justify-between hover:scale-[1.01] transition-transform`}
                    >
                      <div>
                        {/* Stars icon */}
                        <div className="flex gap-1 mb-4 text-amber-500">
                          {Array.from({ length: test.stars }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-current shrink-0"
                            />
                          ))}
                        </div>

                        <p
                          className={`text-[11px] leading-relaxed italic ${textMuted} mb-6`}
                        >
                          "{test.review}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-2">
                        <img
                          src={test.img}
                          alt="avatar"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-800"
                        />
                        <div>
                          <h4 className={`font-extrabold text-xs ${textTitle}`}>
                            {test.name}
                          </h4>
                          <span className="text-[9px] font-mono font-semibold text-slate-500 block uppercase tracking-wider">
                            {test.org}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section
              id="faq-section"
              className={`py-20 md:py-24 ${isLight ? "bg-white" : "bg-slate-900"}`}
            >
              <div className="max-w-4xl mx-auto px-4 md:px-8 text-center text-xs">
                <span className="text-[10px] text-emerald-500 font-mono font-extrabold uppercase tracking-widest block mb-3">
                  RESOLVING CITIZEN QUERY POINTS
                </span>
                <h2
                  className={`text-3xl font-black ${textTitle} tracking-tight mb-4`}
                >
                  Frequently Asked Questions
                </h2>
                <p className={`text-xs ${textMuted} mb-12`}>
                  Got questions? Here are official answers about user
                  verification, voting mechanics, and privacy policies.
                </p>

                <div className="flex flex-col gap-3 font-sans text-left mt-8">
                  {faqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div
                        key={index}
                        className={`rounded-2xl border ${bgCard} transition-all duration-300 overflow-hidden`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          className="w-full p-5 flex items-center justify-between text-left font-extrabold text-slate-800 dark:text-slate-100 transition-colors uppercase text-[11px] tracking-wide"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-emerald-500" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-200/50 dark:border-slate-800/50"
                            >
                              <div
                                className={`p-5 leading-relaxed text-[11px] ${textMuted} bg-slate-50/50 dark:bg-slate-950/20`}
                              >
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* CONTACT SECTION */}
            <section
              id="contact-section"
              className={`py-20 md:py-24 border-t ${borderCard} ${isLight ? "bg-slate-50" : "bg-slate-950"}`}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 text-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left Column Address Info */}
                  <div className="lg:col-span-5 text-left flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-blue-500 font-mono font-extrabold uppercase tracking-widest block mb-3">
                        OFFICIAL OFFICE CHANNELS
                      </span>
                      <h2
                        className={`text-3xl font-black ${textTitle} tracking-tight mb-4`}
                      >
                        Get In Touch
                      </h2>
                      <p
                        className={`text-[11px] leading-relaxed mb-8 ${textMuted}`}
                      >
                        Need administrative support for credentials resetting,
                        system auditing credentials, or mounting internal
                        elections? Our support specialists are prepared to
                        assist daily.
                      </p>

                      <div className="flex flex-col gap-4 font-sans text-slate-600 dark:text-slate-300">
                        <div className="flex items-start gap-3">
                          <Mail className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <div>
                            <strong
                              className={`${textTitle} block font-semibold`}
                            >
                              Security Ops Email
                            </strong>
                            <span>support@votex-system.gov</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                          <div>
                            <strong
                              className={`${textTitle} block font-semibold`}
                            >
                              Citizen Hotline
                            </strong>
                            <span>+1 (800) 555-VTEX (8839)</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <strong
                              className={`${textTitle} block font-semibold`}
                            >
                              HQ Headquarters Office
                            </strong>
                            <span>
                              600 Congress Ave. Suite 1400, Austin, TX 78701
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                          <div>
                            <strong
                              className={`${textTitle} block font-semibold`}
                            >
                              Operational Working Hours
                            </strong>
                            <span>
                              Monday - Friday | 08:00 AM - 05:00 PM CST
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 font-mono text-[10px] text-slate-400">
                      <span>VO-TEX TECHNICAL DESK</span>
                    </div>
                  </div>

                  {/* Right Column Form */}
                  <div className="lg:col-span-7">
                    <div
                      className={`p-6 md:p-8 rounded-3xl border ${bgCard} text-left`}
                    >
                      <h3
                        className={`font-extrabold text-sm ${textTitle} mb-1`}
                      >
                        Submit Secure Support Ticket
                      </h3>
                      <p className={`text-[11px] ${textMuted} mb-6`}>
                        All support inquiries are dispatched to verified
                        officers and logged inside our help queue.
                      </p>

                      <form
                        onSubmit={handleContactSubmit}
                        className="flex flex-col gap-4 text-xs font-sans"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                              Your Full Name
                            </label>
                            <input
                              type="text"
                              required
                              value={contactData.name}
                              onChange={(e) =>
                                setContactData({
                                  ...contactData,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Thomas Anderson"
                              className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${inputBg}`}
                            />
                          </div>

                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                              Valid Email Address
                            </label>
                            <input
                              type="email"
                              required
                              value={contactData.email}
                              onChange={(e) =>
                                setContactData({
                                  ...contactData,
                                  email: e.target.value,
                                })
                              }
                              placeholder="neo@example.com"
                              className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${inputBg}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                            Subject Matter
                          </label>
                          <input
                            type="text"
                            required
                            value={contactData.subject}
                            onChange={(e) =>
                              setContactData({
                                ...contactData,
                                subject: e.target.value,
                              })
                            }
                            placeholder="Reset Biometrics, Enrollment Help, etc..."
                            className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${inputBg}`}
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                            Message Description
                          </label>
                          <textarea
                            required
                            rows={4}
                            value={contactData.message}
                            onChange={(e) =>
                              setContactData({
                                ...contactData,
                                message: e.target.value,
                              })
                            }
                            placeholder="Write your comprehensive description here..."
                            className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${inputBg}`}
                          />
                        </div>

                        {contactSuccess && (
                          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>
                              Successfully dispatched! Support code VTEX-TKT-
                              {Math.floor(Math.random() * 90000) + 10000}{" "}
                              compiled.
                            </span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={contactSubmitting}
                          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-slate-950 font-extrabold uppercase rounded-xl tracking-wider shadow cursor-pointer transition-colors"
                        >
                          {contactSubmitting
                            ? "TRANSMITTING TO OFFICERS..."
                            : "Dispatch Support Ticket"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* NEWSLETTER SUBSCRIPTION */}
            <section
              className={`py-16 ${borderCard} border-t ${isLight ? "bg-white" : "bg-slate-900"}`}
            >
              <div className="max-w-4xl mx-auto px-4 md:px-8 text-center text-xs">
                <h3
                  className={`font-black text-lg ${textTitle} mb-1 tracking-tight`}
                >
                  Subscribe for Election Broadcasts
                </h3>
                <p className={`text-xs ${textMuted} mb-6`}>
                  Receive timely updates regarding upcoming civic rosters,
                  candidate debates, and election result releases.
                </p>

                <form
                  onSubmit={handleNewsletterSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto items-stretch font-sans"
                >
                  <input
                    type="email"
                    required
                    placeholder="name@personal-ledger.org"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className={`flex-grow px-4 py-3 rounded-xl border focus:outline-none ${inputBg}`}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Subscribe
                  </button>
                </form>

                {newsletterSuccess && (
                  <p className="text-emerald-500 font-bold mt-3">
                    ✔ Successfully registered! Check inbox for confirmation.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ==================== B: ALL PUBLIC ELECTIONS LIST ==================== */}
        {currentPath === "/elections" && (
          <section className="py-12 md:py-20 max-w-7xl mx-auto px-4 md:px-8">
            <button
              onClick={() => handleNav("/")}
              className={`mb-6 text-xs font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer ${textMuted}`}
            >
              <span>← RETURN BACK TO LOBBY</span>
            </button>

            <div className="text-left mb-12">
              <span className="text-[10px] text-teal-500 font-mono font-extrabold tracking-widest block uppercase mb-1">
                CENTRAL ELECTION RECORD DECK
              </span>
              <h1
                className={`text-3xl md:text-4xl font-black ${textTitle} tracking-tight`}
              >
                Institutional Elections Registry
              </h1>
              <p className={`text-xs ${textMuted} mt-2 max-w-2xl`}>
                Review current active elections campaigns, finalize votes, and
                inspect published tally results safely.
              </p>
            </div>

            {electionsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                <span className="text-xs text-slate-400 font-mono">
                  RETRIEVING OFF-SITE BALLOT LISTINGS...
                </span>
              </div>
            ) : elections.length === 0 ? (
              <div
                className={`p-12 rounded-2xl text-center border ${bgCard} max-w-md mx-auto`}
              >
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className={`font-extrabold ${textTitle} text-sm`}>
                  No Active Elections On Ledger
                </h3>
                <p className={`text-xs ${textMuted} mt-1`}>
                  No institutional elections are currently registered.
                  Administrators can deploy them directly from the control
                  panel.
                </p>
                <button
                  onClick={() => handleNav("/")}
                  className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-xs font-semibold rounded-lg text-white hover:opacity-90"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {elections.map((el: any) => {
                  const isActive = el.status === "Active";
                  return (
                    <div
                      key={el.id}
                      className={`p-6 rounded-2xl border ${bgCard} flex flex-col justify-between hover:scale-[1.01] hover:border-emerald-500/20 transition-all duration-300`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span
                            className={`px-2.5 py-1 text-[9px] font-bold font-mono rounded-full uppercase leading-none ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-slate-500/10 text-slate-400"
                            }`}
                          >
                            {el.status}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold ${textMuted} uppercase`}
                          >
                            {el.type}
                          </span>
                        </div>

                        <h4
                          className={`font-extrabold text-sm ${textTitle} leading-snug mb-2`}
                        >
                          {el.title}
                        </h4>
                        <p
                          className={`text-[10px] leading-relaxed mb-4 ${textMuted}`}
                        >
                          {el.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-2">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mb-4">
                          <span>
                            Starts:{" "}
                            {el.startDate
                              ? new Date(el.startDate).toLocaleString()
                              : "TBD"}
                          </span>
                          <span>
                            Ends:{" "}
                            {el.endDate
                              ? new Date(el.endDate).toLocaleString()
                              : "TBD"}
                          </span>
                        </div>

                        {isActive ? (
                          <button
                            onClick={() => handleNav("/login")}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs rounded-xl uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Vote className="w-3.5 h-3.5" />
                            <span>Sign In & Cast Ballot</span>
                          </button>
                        ) : (
                          <div className="text-center p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase">
                              ELECTION DISMISSED (ENDED)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ==================== C: CITIZEN SECURE SIGN-IN ROUTE ==================== */}
        {currentPath === "/login" && (
          <section className="py-12 md:py-20 flex justify-center items-center px-4">
            <div
              className={`w-full max-w-md p-6 md:p-8 rounded-3xl border ${bgCard} relative`}
            >
              <button
                onClick={() => handleNav("/")}
                className="mb-4 text-xs hover:underline flex items-center gap-1 text-slate-500"
              >
                <span>← BACK</span>
              </button>

              <h2
                className={`text-xl font-extrabold ${textTitle} mb-1 flex items-center gap-2`}
              >
                <Lock className="w-5 h-5 text-emerald-500" />
                <span>Voter Audits Login</span>
              </h2>
              <p className={`text-xs ${textMuted} mb-6`}>
                Input your registered credentials to sign your ballot securely.
              </p>

              {/* Collapsible active developer login presets */}
              {loading && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 animate-pulse rounded-t-3xl" />
              )}

              <form
                onSubmit={handleLoginSubmit}
                className="flex flex-col gap-4 text-xs font-sans text-left"
              >
                <div>
                  <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase mb-1">
                    Account Mail Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="citizen@domain.org"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      className={`w-full px-3 py-2.5 pl-9 rounded-xl border ${inputBg}`}
                    />
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase">
                      Profile Password
                    </label>
                    <button
                      type="button"
                      onClick={() => handleNav("/forgot_password")}
                      className="text-[10px] text-blue-500 hover:underline font-semibold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      className={`w-full px-3 py-2.5 pl-9 rounded-xl border ${inputBg}`}
                    />
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer mt-2"
                >
                  {loading ? "CHECKING CREDENTIALS..." : "Secure Voter Login"}
                </button>

                <p className={`text-[10px] text-center mt-3 ${textMuted}`}>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => handleNav("/register")}
                    className="text-emerald-500 font-bold hover:underline cursor-pointer"
                  >
                    Onboard & Register Here
                  </button>
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-850/60 flex flex-col items-center gap-1">
                  <p className={`text-[10px] text-center ${textMuted}`}>
                    Need administrative controls?{" "}
                    <button
                      type="button"
                      onClick={() => handleNav("/admin/login")}
                      className="text-blue-500 font-bold hover:underline cursor-pointer"
                    >
                      Administrative Login Center
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ==================== D: CITIZEN SECURE REGISTER ROUTE ==================== */}
        {currentPath === "/register" && (
          <section className="py-12 md:py-20 flex justify-center items-center px-4">
            <div
              className={`w-full max-w-lg p-6 md:p-8 rounded-3xl border ${bgCard} text-left`}
            >
              <button
                onClick={() => handleNav("/")}
                className="mb-4 text-xs hover:underline flex items-center gap-1 text-slate-500"
              >
                <span>← BACK</span>
              </button>

              <h2
                className={`text-xl font-extrabold ${textTitle} mb-1 flex items-center gap-2`}
              >
                <UserCheck className="w-5 h-5 text-emerald-500" />
                <span>Onboard Government Registry</span>
              </h2>
              <p className={`text-xs ${textMuted} mb-6`}>
                Create your citizen account. Verification of email and phone is
                required to finalize.
              </p>

              {loading && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 animate-pulse rounded-t-3xl" />
              )}

              <form
                onSubmit={handleRegisterSubmit}
                className="flex flex-col gap-4 text-[10px] md:text-xs font-sans"
              >
                {/* 0. Registration Role Toggle */}
                <div>
                  <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase mb-1.5">
                    Account Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={() => setRegForm({ ...regForm, role: "Voter" })}
                      className={`py-2 rounded-xl text-center font-bold transition-all cursor-pointer text-[10px] sm:text-xs ${
                        regForm.role === "Voter" || !regForm.role
                          ? "bg-blue-600 dark:bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      Citizen Voter
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRegForm({ ...regForm, role: "Candidate" })
                      }
                      className={`py-2 rounded-xl text-center font-bold transition-all cursor-pointer text-[10px] sm:text-xs ${
                        regForm.role === "Candidate"
                          ? "bg-blue-600 dark:bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      Campaign Candidate
                    </button>
                  </div>
                </div>

                {/* 1. Full Name */}
                <div>
                  <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase mb-1">
                    Full Citizen Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.fullName}
                    onChange={(e) =>
                      setRegForm({ ...regForm, fullName: e.target.value })
                    }
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                  />
                </div>

                {/* 2. Username */}
                <div>
                  <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase mb-1">
                    Username (Choose Unique ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. john_doe_101"
                    value={regForm.username}
                    onChange={(e) =>
                      setRegForm({ ...regForm, username: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                  />
                </div>

                {/* 3. Email & OTP verification widget */}
                <div className="p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase">
                      Email Address
                    </label>
                    {isEmailVerifiedLocal ? (
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">
                        ✔ SMTP EMAIL VERIFIED
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-mono">
                        Awaiting verification
                      </span>
                    )}
                  </div>
                  {!isEmailVerifiedLocal ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          placeholder="citizen@mail.com"
                          value={regForm.email}
                          onChange={(e) =>
                            setRegForm({ ...regForm, email: e.target.value })
                          }
                          disabled={isEmailVerifiedLocal}
                          className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                        />
                        {!isEmailVerifiedLocal && (
                          <button
                            type="button"
                            onClick={sendEmailCode}
                            disabled={emailOtpLoading || emailCountdown > 0}
                            className="px-3 bg-slate-800 text-slate-300 font-bold hover:text-white rounded-xl text-[10px] uppercase border border-slate-700 cursor-pointer shrink-0"
                          >
                            {emailOtpLoading
                              ? "Sending..."
                              : emailCountdown > 0
                                ? `Resend (${emailCountdown}s)`
                                : "Send OTP"}
                          </button>
                        )}
                      </div>
                      {emailError && (
                        <p className="text-[9px] text-red-400 font-mono">
                          {emailError}
                        </p>
                      )}
                      {(emailOtpLoading ||
                        isEmailOtpSent ||
                        emailCountdown > 0) &&
                        !isEmailVerifiedLocal && (
                          <>
                            <p className="text-[9px] text-slate-600 dark:text-slate-300 font-mono">
                              OTP sent to your email. Enter the code below to
                              verify.
                            </p>
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex gap-2">
                              <input
                                type="text"
                                placeholder="6-digit SMTP verification code"
                                value={emailVerificationCode}
                                onChange={(e) =>
                                  setEmailVerificationCode(e.target.value)
                                }
                                className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                              />
                              <button
                                type="button"
                                onClick={verifyEmailCode}
                                disabled={emailVerifyLoading}
                                className="px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-[10px] uppercase cursor-pointer shrink-0"
                              >
                                {emailVerifyLoading ? "Verifying..." : "Verify"}
                              </button>
                            </div>
                          </>
                        )}
                    </>
                  ) : (
                    <p className="text-[10px] text-emerald-400 font-mono">
                      OTP entry is now hidden after successful verification.
                    </p>
                  )}
                </div>

                {/* 4. Mobile & OTP SMS verification widget */}
                <div className="p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase">
                      Mobile Contact No
                    </label>
                    {isSmsVerifiedLocal ? (
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">
                        ✔ SMS CONTACT VERIFIED
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-mono">
                        Awaiting verification
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
                          onChange={(e) =>
                            setRegForm({ ...regForm, mobile: e.target.value })
                          }
                          disabled={isSmsVerifiedLocal}
                          className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                        />
                        {!isSmsVerifiedLocal && (
                          <button
                            type="button"
                            onClick={sendSmsOtp}
                            disabled={smsOtpLoading || smsCountdown > 0}
                            className="px-3 bg-slate-800 text-slate-300 font-bold hover:text-white rounded-xl text-[10px] uppercase border border-slate-700 cursor-pointer shrink-0"
                          >
                            {smsOtpLoading
                              ? "Sending..."
                              : smsCountdown > 0
                                ? `Resend (${smsCountdown}s)`
                                : "Send OTP"}
                          </button>
                        )}
                      </div>
                      {smsError && (
                        <p className="text-[9px] text-red-400 font-mono">
                          {smsError}
                        </p>
                      )}
                      {isSmsOtpSent && !isSmsVerifiedLocal && (
                        <>
                          <p className="text-[9px] text-slate-600 dark:text-slate-300 font-mono">
                            SMS OTP sent. Enter the code below to verify your
                            phone.
                          </p>
                          <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex gap-2">
                            <input
                              type="text"
                              placeholder="6-digit SMS Twilio OTP code"
                              value={smsVerificationCode}
                              onChange={(e) =>
                                setSmsVerificationCode(e.target.value)
                              }
                              className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                            />
                            <button
                              type="button"
                              onClick={verifySmsOtp}
                              disabled={smsVerifyLoading}
                              className="px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-[10px] uppercase cursor-pointer shrink-0"
                            >
                              {smsVerifyLoading ? "Verifying..." : "Verify"}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-emerald-400 font-mono">
                      OTP entry is now hidden after successful verification.
                    </p>
                  )}
                </div>

                {/* 5. Password & Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase mb-1">
                      Passphrase
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={(e) =>
                        setRegForm({ ...regForm, password: e.target.value })
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-550 dark:text-slate-400 font-bold uppercase mb-1">
                      Confirm Passphrase
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regForm.confirmPassword}
                      onChange={(e) =>
                        setRegForm({
                          ...regForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${inputBg}`}
                    />
                  </div>
                </div>

                {passwordStrengthComponent}

                <button
                  type="submit"
                  disabled={
                    loading || !isEmailVerifiedLocal || !isSmsVerifiedLocal
                  }
                  className={`w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 font-extrabold uppercase tracking-wider py-4 rounded-xl cursor-pointer mt-4 leading-none disabled:opacity-40`}
                >
                  {loading
                    ? "TRANSMITTING SIGNATURE REGISTRY..."
                    : !isEmailVerifiedLocal || !isSmsVerifiedLocal
                      ? "Verify Contacts to Unlock Registration"
                      : "Confirm & Setup Onboarding Account"}
                </button>

                <p className={`text-[10px] text-center mt-3 ${textMuted}`}>
                  Have an account already?{" "}
                  <button
                    type="button"
                    onClick={() => handleNav("/login")}
                    className="text-emerald-500 font-bold hover:underline cursor-pointer"
                  >
                    Sign In Instantly
                  </button>
                </p>
              </form>
            </div>
          </section>
        )}

        {/* ==================== E: SECURE PASSWORD RESET CENTRE ==================== */}
        {currentPath === "/forgot_password" && (
          <section className="py-12 md:py-20 flex justify-center items-center px-4">
            <div
              className={`w-full max-w-md p-6 md:p-8 rounded-3xl border ${bgCard} text-left`}
            >
              <button
                onClick={() => handleNav("/login")}
                className="mb-4 text-xs hover:underline flex items-center gap-1 text-slate-500"
              >
                <span>← CANCEL</span>
              </button>

              <h2
                className={`text-xl font-extrabold ${textTitle} mb-1 flex items-center gap-2`}
              >
                <Key className="w-5 h-5 text-emerald-500" />
                <span>Reset Center</span>
              </h2>
              <p className={`text-xs ${textMuted} mb-6`}>
                Recover your platform citizen audit profiles securely via OTP
                verify codes.
              </p>

              {forgotStep === "request" ? (
                <form
                  onSubmit={handleForgotPasswordSubmit}
                  className="flex flex-col gap-4 text-xs font-sans"
                >
                  <div>
                    <label className="block text-slate-550 dark:text-slate-400 font-bold mb-1">
                      ENTER RECONSTRUCT EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="neo@example.com"
                      value={forgotForm.email}
                      onChange={(e) =>
                        setForgotForm({ ...forgotForm, email: e.target.value })
                      }
                      className={`w-full px-3 py-2.5 rounded-xl border ${inputBg}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 font-extrabold uppercase rounded-xl tracking-wider transition-all cursor-pointer"
                  >
                    Send Outbound Security OTP
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleResetPasswordSubmit}
                  className="flex flex-col gap-4 text-xs font-sans"
                >
                  <div className="p-2.5 bg-yellow-500/10 text-yellow-500 border border-dashed border-yellow-500/30 rounded-xl leading-relaxed text-[10px] mb-2 font-mono">
                    <strong>
                      OTP code dispatched! Check your mail boxes or review the
                      SMTP console log at the page footer menu bar.
                    </strong>
                  </div>

                  <div>
                    <label className="block text-slate-550 dark:text-slate-400 font-bold mb-1">
                      6-DIGIT PASSWORD CODES (OTP)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. 581223"
                        value={forgotForm.code}
                        onChange={(e) =>
                          setForgotForm({ ...forgotForm, code: e.target.value })
                        }
                        className={`w-full px-3 py-2.5 pr-28 rounded-xl border ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (resetOtpCountdown === 0) {
                            setResetOtpCountdown(60);
                            await handleForgotPasswordSubmit({
                              preventDefault: () => {},
                            } as any);
                          }
                        }}
                        disabled={resetOtpCountdown > 0}
                        className={`absolute right-2 top-1.5 px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                          resetOtpCountdown > 0
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                        }`}
                      >
                        {resetOtpCountdown > 0
                          ? `Resend (${resetOtpCountdown}s)`
                          : "Resend OTP"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-550 dark:text-slate-400 font-bold mb-1">
                      NEW ACCOUNT PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={forgotForm.newPassword}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          newPassword: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2.5 rounded-xl border ${inputBg}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold uppercase rounded-xl tracking-wider transition-all cursor-pointer"
                  >
                    Confirm & Update Password
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* ==================== F: PUBLIC ELECTION RESULTS ==================== */}
        {currentPath === "/results" && (
          <ElectionResults onBack={() => handleNav("/")} isLight={isLight} />
        )}
      </main>

      {/* 2. ENTERPRISE MULTI-COLUMN FOOTER */}
      <footer
        className={`py-12 border-t ${borderCard} ${isLight ? "bg-slate-100" : "bg-slate-950"} text-left transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Logo column */}
            <div className="col-span-2 flex flex-col justify-between max-w-sm">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="bg-gradient-to-tr from-emerald-500 to-blue-600 p-2 rounded-xl text-slate-950 font-black">
                    VX
                  </div>
                  <div>
                    <h3 className={`font-black tracking-tight ${textTitle}`}>
                      VoTex
                    </h3>
                    <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                      Enterprise Audit Bureau
                    </span>
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed mb-6 ${textMuted}`}>
                  Certified digital voting platforms designed to secure
                  electoral trust, prevent duplicate casts, and support locally
                  validated camera biometric challenges seamlessly.
                </p>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                <span>SYSTEM VERSION 1.42 (STABLE)</span>
              </div>
            </div>

            {/* Resources Column */}
            <div>
              <h4
                className={`font-extrabold uppercase mb-4 tracking-wider text-[10px] ${textTitle}`}
              >
                Company
              </h4>
              <ul
                className={`flex flex-col gap-2.5 text-[11px] ${textMuted} font-medium`}
              >
                <li>
                  <a
                    href="#about-section"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    About VoTex
                  </a>
                </li>
                <li>
                  <a
                    href="#features-section"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Platform Features
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => handleNav("/elections")}
                    className="hover:text-emerald-500 text-left transition-colors cursor-pointer"
                  >
                    Elections Registry
                  </button>
                </li>
                <li>
                  <a
                    href="#contact-section"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4
                className={`font-extrabold uppercase mb-4 tracking-wider text-[10px] ${textTitle}`}
              >
                Resources
              </h4>
              <ul
                className={`flex flex-col gap-2.5 text-[11px] ${textMuted} font-medium`}
              >
                <li>
                  <a
                    href="#faq-section"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Help Center / FAQ
                  </a>
                </li>
                <li>
                  <span className="cursor-not-allowed opacity-60">
                    Documentation
                  </span>
                </li>
                <li>
                  <span className="cursor-not-allowed opacity-60">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="cursor-not-allowed opacity-60">
                    Terms & Conditions
                  </span>
                </li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div>
              <h4
                className={`font-extrabold uppercase mb-4 tracking-wider text-[10px] ${textTitle}`}
              >
                Voters Desk
              </h4>
              <ul
                className={`flex flex-col gap-2.5 text-[11px] ${textMuted} font-medium`}
              >
                <li>
                  <button
                    onClick={() => handleNav("/register")}
                    className="hover:text-emerald-500 text-left transition-colors cursor-pointer font-bold text-emerald-500"
                  >
                    Register Citizen
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav("/login")}
                    className="hover:text-emerald-500 text-left transition-colors cursor-pointer"
                  >
                    Voter Sign-In
                  </button>
                </li>
                <li>
                  <a
                    href="#about-section"
                    className="hover:text-emerald-500 transition-colors"
                  >
                    Digital Identity Map
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => handleNav("/admin/login")}
                    className="hover:text-emerald-500 text-left transition-colors cursor-pointer"
                  >
                    Administrative Login
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200/50 dark:border-slate-800/50 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-slate-400">
            <div>
              <span>© 2026 VoTex Bureau. All Rights Reserved.</span>
            </div>
            <div className="flex gap-4">
              <span>Built with React 19 + Node.js + local JSON Storage</span>
              <span>•</span>
              <span className="text-emerald-500">
                STATE SECURE ENGINE v1.42
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
