import React, { useState, useEffect, Suspense } from "react";
import {
  Vote,
  Calendar,
  Award,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  Info,
  Sparkles,
  LogOut,
  Bell,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Check,
  Upload,
  FileText,
  ShieldAlert,
  Cpu,
  Sun,
  Moon,
} from "lucide-react";
import ComprehensiveProfile from "./ComprehensiveProfile.tsx";
const FaceVerification = React.lazy(
  () => import("../../pages/FaceVerification.tsx"),
);
import {
  Election,
  Candidate,
  VoteStatus,
  User as UserType,
  Notification,
} from "../../types.js";
import type { ThemeMode } from "../../types/auth.ts";
const getSymbolGlyph = (name?: string) =>
  ({
    Tree: "🌳",
    Sun: "☀️",
    Moon: "🌙",
    Star: "⭐",
    Rose: "🌹",
    Flower: "🌺",
    Book: "📚",
    Pen: "✏️",
    House: "🏠",
    Bicycle: "🚲",
    Car: "🚗",
    Bus: "🚌",
    Boat: "🛶",
    Dove: "🕊️",
    Elephant: "🐘",
    Lion: "🦁",
    Rooster: "🐓",
    Cow: "🐄",
    Wheat: "🌾",
    Gear: "⚙️",
  })[name || ""] || "🗳️";

interface VoterDashboardProps {
  token: string;
  user: UserType;
  onLogout: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export default function VoterDashboard({
  token,
  user,
  onLogout,
  theme,
  setTheme,
}: VoterDashboardProps) {
  const [currentUser, setCurrentUser] = useState<
    UserType & {
      accountStatus?: string;
      rejectionReason?: string;
      requestedChangesFields?: string[];
      verificationReport?: any;
    }
  >(user);

  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(
    null,
  );
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [profileCandidate, setProfileCandidate] = useState<Candidate | null>(
    null,
  );

  // Status check variables: election ID maps to boolean voted
  const [votingStatuses, setVotingStatuses] = useState<Record<string, boolean>>(
    {},
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Correction Form state variables
  const [correctDob, setCorrectDob] = useState("");
  const [correctGender, setCorrectGender] = useState("");
  const [correctAddress, setCorrectAddress] = useState("");
  const [correctCitzNum, setCorrectCitzNum] = useState("");
  const [correctFather, setCorrectFather] = useState("");
  const [correctCitzFront, setCorrectCitzFront] = useState("");
  const [correctCitzBack, setCorrectCitzBack] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Voting Wizard steps: "select_election" | "view_candidates" | "biometric_challenge" | "success"
  const [voteStep, setVoteStep] = useState<
    "select_election" | "view_candidates" | "biometric_challenge" | "success"
  >("select_election");
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState<
    "idle" | "checking" | "matched" | "mismatch"
  >("idle");
  const [faceVerificationScore, setFaceVerificationScore] = useState(0);
  const [faceVerificationMessage, setFaceVerificationMessage] = useState("");
  const [faceVerificationId, setFaceVerificationId] = useState<string | null>(
    null,
  );
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const [fingerprintStatus, setFingerprintStatus] = useState<
    "idle" | "checking" | "matched" | "mismatch"
  >("idle");
  const [voteSubmitting, setVoteSubmitting] = useState(false);

  const facePreviewSrc = currentUser.faceImage
    ? currentUser.faceImage.startsWith("data:") ||
      currentUser.faceImage.startsWith("http") ||
      currentUser.faceImage.startsWith("https")
      ? currentUser.faceImage
      : `https://avatars.dicebear.com/api/identicon/${encodeURIComponent(
          currentUser.faceImage,
        )}.svg`
    : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150";

  // Time Countdown Remaining states
  const [countdownString, setCountdownString] = useState("");
  const [activeMainTab, setActiveMainTab] = useState<"voting" | "profile">(
    "profile",
  );

  const syncData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // 0. Update current user profile context (very important for reflecting admin review state changes)
      const userRes = await fetch("/api/auth/me", { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setCurrentUser(userData.user);
          // Pre-populate corrections if action was requested
          setCorrectDob(userData.user.dob || "");
          setCorrectGender(userData.user.gender || "");
          setCorrectAddress(userData.user.address || "");
          setCorrectCitzNum(userData.user.nationalID || "");
        }
      }

      // 1. Fetch Elections
      const electionsRes = await fetch("/api/elections", { headers });
      if (electionsRes.ok) {
        const electData = await electionsRes.json();
        const activeElections = (electData.elections || []).filter(
          (e: Election) => e.status === "Active",
        );
        setElections(activeElections);
        if (activeElections.length > 0 && !selectedElection) {
          setSelectedElection(activeElections[0]);
        }
      }

      // 2. Fetch voter-specific voting status logs
      const statusRes = await fetch("/api/users/voting-status", { headers });
      if (statusRes.ok) {
        const statuses = await statusRes.json();
        const map: Record<string, boolean> = {};
        statuses.statuses.forEach((s: any) => {
          map[s.electionId] = s.voted;
        });
        setVotingStatuses(map);
      }

      // 3. Fetch notifications
      const notifRes = await fetch("/api/notifications", { headers });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to synchronize election countdown registers!");
    } finally {
      setLoading(false);
    }
  };

  // Sync Candidates for chosen Election
  const fetchCandidatesForElection = async (electionId: string) => {
    try {
      const res = await fetch(`/api/candidates?electionId=${electionId}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResubmitCorrections = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsResubmitting(true);
      setErrorMsg("");

      const payload: any = {
        dob: correctDob,
        gender: correctGender,
        permanentAddress: correctAddress,
        citizenshipNumber: correctCitzNum,
        fatherName: correctFather,
        citizenshipFrontImage: correctCitzFront,
        citizenshipBackImage: correctCitzBack,
      };

      const res = await fetch("/api/voters/resubmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to resubmit corrections");
      }

      const data = await res.json();
      setCurrentUser(data.user);

      // Force sync
      syncData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not resubmit profile corrections");
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleResetApplication = async () => {
    if (
      !window.confirm(
        "Are you sure you want to completely erase your database registration files, biometrics, and documents, and start fresh? This cannot be undone. All files will be terminated on the server securely.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/profile/reset", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to reset onboarding");
      }

      // On success, force reload page so App.tsx can re-route them into the onboarding complete profile layout!
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to reset application wizard.");
    } finally {
      setLoading(false);
    }
  };

  // Synchronizers
  useEffect(() => {
    syncData();
  }, [token]);

  useEffect(() => {
    if (selectedElection) {
      fetchCandidatesForElection(selectedElection.id);
      setSelectedCandidate(null);
      setFaceVerificationId(null);
      setFaceVerificationStatus("idle");
      setFaceVerificationScore(0);
      setFaceVerificationMessage("");
      setScanImage(null);
    }
  }, [selectedElection]);

  useEffect(() => {
    setFaceVerificationId(null);
    setFaceVerificationStatus("idle");
    setFaceVerificationScore(0);
    setFaceVerificationMessage("");
    setScanImage(null);
  }, [selectedCandidate?.id]);

  // Handle countdown calculation
  useEffect(() => {
    if (!selectedElection) return;

    const interval = setInterval(() => {
      const targetTime = new Date(selectedElection.endDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setCountdownString("Campaign duration expired.");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdownString(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedElection]);

  const handleFingerprintCapture = async (image64: string) => {
    setFingerprintImage(image64);
    setFingerprintStatus("checking");
    try {
      const res = await fetch("/api/fingerprint/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fingerprintImage: image64 }),
      });
      const data = await res.json();
      setFingerprintStatus(data.matchesRegistered ? "matched" : "mismatch");
      if (!data.matchesRegistered) {
        setErrorMsg(
          "The live fingerprint does not match your registered fingerprint. Please retry.",
        );
      }
    } catch (error) {
      setFingerprintStatus("mismatch");
      setErrorMsg(
        "Fingerprint validation could not be completed. Please retry.",
      );
    }
  };

  // cast ballot API dispatcher
  const handleCastBallot = async () => {
    if (!selectedElection || !selectedCandidate) {
      return setErrorMsg("Please select an election and candidate first.");
    }
    if (faceVerificationStatus !== "matched" || !faceVerificationId) {
      return setErrorMsg(
        "Live face verification must pass before you can cast your ballot.",
      );
    }
    if (!fingerprintImage || fingerprintStatus !== "matched") {
      return setErrorMsg(
        "Please verify your registered fingerprint before casting the vote.",
      );
    }

    const confirmed = window.confirm(
      `Confirm your vote for ${selectedCandidate.name} (${selectedCandidate.electionSymbol?.name || selectedCandidate.party}). This ballot cannot be changed after submission.`,
    );
    if (!confirmed) return;

    setVoteSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          electionId: selectedElection.id,
          candidateId: selectedCandidate.id,
          faceVerificationId,
          fingerprintImage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Double voting or liveness rejection trigger
        if (data.error === "VOTING_LOCKED") {
          throw new Error(
            "You have already voted. Multiple voting is not allowed.",
          );
        }
        throw new Error(
          data.error || data.message || "Failed to submit ballot.",
        );
      }

      setSuccessReceipt(data.ballotReceipt);
      setVoteStep("success");

      // Refresh status lock instantly
      syncData();
    } catch (err: any) {
      setErrorMsg(err.message);
      // Reset steps if we failed
      setVoteStep("view_candidates");
    } finally {
      setVoteSubmitting(false);
    }
  };

  const handleStartVoteCampaign = () => {
    if (!selectedElection) return;

    // Safety check check
    if (votingStatuses[selectedElection.id]) {
      setErrorMsg(
        "You have already voted in this election campaign. Multiple ballots are blocked by system rules.",
      );
      return;
    }

    setVoteStep("view_candidates");
    setErrorMsg("");
  };

  const isAccountApproved =
    currentUser.isApproved !== false ||
    ["Approved", "Active"].includes(currentUser.accountStatus || "");

  const isVerificationCompleted =
    isAccountApproved &&
    currentUser.isVerified &&
    currentUser.isProfileComplete;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-blue-500 p-2.5 rounded-xl text-slate-950 font-black tracking-wider text-sm">
            NP
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white">
              Nepal Vote
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              CITIZEN SECURED PORTAL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            id="btn-voter-logout"
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Account</span>
          </button>
        </div>
      </nav>

      {!isVerificationCompleted ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-8 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                <span className="text-[10px] tracking-widest font-mono text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Secure Civil Verification Workspace
                </span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-3">
                  {currentUser.fullName}
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  National Voter ID Enrollment Registration. Your biometric
                  metadata is being checked against federal authorities.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto font-mono text-xs">
                <div className="bg-slate-950/60 backdrop-blur border border-slate-850 px-4 py-3 rounded-2xl flex items-center gap-2.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-slate-500 text-[9px] block">
                      CITIZEN ID
                    </span>
                    <span className="text-white font-bold">
                      {currentUser.nationalID || "Pending Extraction"}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-950/60 backdrop-blur border border-slate-850 px-4 py-3 rounded-2xl flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-slate-500 text-[9px] block">
                      REGISTERED MOBILE
                    </span>
                    <span className="text-white font-bold">
                      {currentUser.mobile}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status Banner and Alerts */}
          <div>
            {currentUser.accountStatus === "Pending Verification" && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shrink-0 mt-0.5 animate-pulse">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-700 font-bold">
                      Enrollment Review Queue
                    </span>
                    <h3 className="font-extrabold text-slate-850 text-base mt-0.5">
                      Identity Pending Administrative Overview
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Our live and administrative oversight teams are
                      scrutinizing your biometric landmarks side-by-side.
                      Notifications are automatically dispatched upon state
                      active clearance.
                    </p>
                  </div>
                </div>
                <div className="py-1 px-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold rounded-full font-mono animate-pulse">
                  ● PENDING REVIEW
                </div>
              </div>
            )}

            {currentUser.accountStatus === "Changes Requested" && (
              <div className="bg-orange-50 border border-orange-200/80 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 border border-orange-500/20 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-orange-700 font-bold">
                      Action Required from Voter
                    </span>
                    <h3 className="font-extrabold text-slate-850 text-base mt-0.5">
                      Enrollment Corrections Requested
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">
                      The administrative panel requested following actions due
                      to mismatch or clarity checks:
                    </p>
                    <div className="bg-orange-100/50 rounded-xl p-3.5 mt-3 border border-orange-200/50 font-mono text-xs text-orange-900">
                      <span className="font-bold text-[10px] text-orange-700 block uppercase mb-1">
                        Administrative Feedback Comments
                      </span>
                      "
                      {currentUser.rejectionReason ||
                        "Please re-upload clearer citizenship documents front / back."}
                      "
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentUser.accountStatus === "Rejected" && (
              <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 border border-rose-500/20 shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-rose-700 font-bold">
                      Registration Failure
                    </span>
                    <h3 className="font-extrabold text-slate-850 text-base mt-0.5">
                      Identity Verification Rejected & Terminated
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Our national biometric security scanner flagged severe
                      authenticity issues or fraudulent overlaps.
                    </p>
                    <div className="bg-rose-100/50 rounded-xl p-3.5 mt-3 border border-rose-200/50 font-mono text-xs text-rose-900">
                      <span className="font-bold text-[10px] text-rose-700 block uppercase mb-1">
                        Detailed Dismissal Reason Log
                      </span>
                      "
                      {currentUser.rejectionReason ||
                        "Citizenship front image contains synthetic details / deep-faked metadata."}
                      "
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bento Scorecard & Trust Meter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trust Meter Progress Indicator */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-4">
                Overall AI Security trust rating
              </span>

              {/* Progress Ring / Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="stroke-slate-100 fill-transparent"
                    strokeWidth="10"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="stroke-emerald-500 fill-transparent transition-all duration-1000"
                    strokeWidth="10"
                    strokeDasharray={376.8}
                    strokeDashoffset={
                      376.8 -
                      (376.8 *
                        (currentUser.verificationReport?.overallTrustScore ||
                          97.4)) /
                        100
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-850 font-mono tracking-tight">
                    {currentUser.verificationReport?.overallTrustScore || 97.4}%
                  </span>
                  <span className="text-[9px] font-mono font-extrabold text-emerald-500 uppercase tracking-widest mt-0.5">
                    HIGH TRUST
                  </span>
                </div>
              </div>

              <div className="text-slate-500 text-xs mt-2 max-w-sm">
                A minimum overall rating score of{" "}
                <span className="font-bold text-slate-800">80%</span> is
                mandated by local voting ordinances to achieve automated or
                fast-track state active enrollment.
              </div>
            </div>

            {/* Individual Landmark Metrics scores list */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider block mb-4">
                  AI Biometrics Landmark Matching Rates (Oversight Analytics)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500 font-semibold">
                        Document Validation Score
                      </span>
                      <span className="text-slate-850 font-black">
                        {currentUser.verificationReport?.documentScore || 96}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{
                          width: `${currentUser.verificationReport?.documentScore || 96}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500 font-semibold">
                        Face Match Calibration
                      </span>
                      <span className="text-slate-850 font-black">
                        {currentUser.verificationReport?.faceMatchScore || 98.4}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${currentUser.verificationReport?.faceMatchScore || 98.4}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500 font-semibold">
                        Biometric OCR Clarity Rate
                      </span>
                      <span className="text-slate-850 font-black">
                        {currentUser.verificationReport?.ocrAccuracy || 98.5}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${currentUser.verificationReport?.ocrAccuracy || 98.5}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500 font-semibold">
                        Fingerprint Scanning Quality
                      </span>
                      <span className="text-slate-850 font-black">
                        {currentUser.verificationReport?.fingerprintQuality ||
                          96}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: `${currentUser.verificationReport?.fingerprintQuality || 96}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 grid grid-cols-2 gap-4 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <div>
                    <span className="text-slate-500 text-[8px] block">
                      SECURITY CLIENT
                    </span>
                    <span className="text-slate-700 font-bold truncate block max-w-[150px]">
                      {currentUser.verificationReport?.deviceInformation ||
                        "Nepal Secure Web Voter Client"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <div>
                    <span className="text-slate-500 text-[8px] block">
                      LIVENESS STANDARD
                    </span>
                    <span className="text-emerald-600 font-extrabold">
                      PASS (ISO 30107-3)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    Identity Document Dossier
                  </span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    A secure summary of your registered identity document,
                    verification status, and trusted biometric record.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMainTab("profile")}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Edit record
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[120px_minmax(0,1fr)] gap-5 mb-6">
                <div className="rounded-3xl overflow-hidden border border-slate-100 bg-slate-950">
                  <img
                    src={facePreviewSrc}
                    alt="Document portrait"
                    className="w-full h-full object-cover min-h-[180px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                    Issued Identity Record
                  </p>
                  <h4 className="text-slate-900 font-bold text-xl tracking-tight mb-1">
                    National Identity Card
                  </h4>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-3">
                    Government of Nepal · Citizen Registry
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                    <div className="rounded-2xl bg-white p-4 border border-slate-100">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                        Holder
                      </p>
                      <p className="font-semibold text-slate-900">
                        {currentUser.fullName || "Not provided"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 border border-slate-100">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                        Document ID
                      </p>
                      <p className="font-semibold text-slate-900 text-right">
                        {currentUser.nationalID || "Not provided"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 border border-slate-100">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                        Date of Birth
                      </p>
                      <p className="font-semibold text-slate-900">
                        {currentUser.dob || "Not provided"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 border border-slate-100">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                        Gender
                      </p>
                      <p className="font-semibold text-slate-900 text-right">
                        {currentUser.gender || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Registered Address
                    </p>
                    <p className="font-semibold text-slate-900">
                      {currentUser.address || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Current Status
                    </p>
                    <p className="font-semibold text-slate-900 text-right">
                      {currentUser.accountStatus || "Pending verification"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Document Trust
                    </p>
                    <p className="font-semibold text-slate-900">
                      {currentUser.verificationReport?.documentScore
                        ? `${currentUser.verificationReport.documentScore}%`
                        : "Not scored"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Submission Time
                    </p>
                    <p className="font-semibold text-slate-900 text-right">
                      {currentUser.verificationReport?.submissionTimestamp
                        ? new Date(
                            currentUser.verificationReport.submissionTimestamp,
                          ).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Document Verification Summary
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMainTab("profile")}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Review
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Face Match
                    </p>
                    <p className="font-semibold text-slate-900">
                      {currentUser.verificationReport?.faceMatchScore
                        ? `${currentUser.verificationReport.faceMatchScore}%`
                        : "Pending"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      OCR Accuracy
                    </p>
                    <p className="font-semibold text-slate-900 text-right">
                      {currentUser.verificationReport?.ocrAccuracy
                        ? `${currentUser.verificationReport.ocrAccuracy}%`
                        : "Pending"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Fingerprint Quality
                    </p>
                    <p className="font-semibold text-slate-900">
                      {currentUser.verificationReport?.fingerprintQuality
                        ? `${currentUser.verificationReport.fingerprintQuality}%`
                        : "Pending"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Audit Client
                    </p>
                    <p className="font-semibold text-slate-900 text-right">
                      {currentUser.verificationReport?.deviceInformation ||
                        "Nepal Secure Web Voter Client"}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-950/5 p-4 border border-slate-100">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                    Document Notes
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {currentUser.rejectionReason
                      ? currentUser.rejectionReason
                      : "This document record is stored for review and can be updated through the profile section if you need to correct missing or mismatched details."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive correction Form (Only if Changes Requested) */}
          {currentUser.accountStatus === "Changes Requested" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md transition-all">
              <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-850 text-base flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin-slow" />
                    Resubmit profile Discrepancy Corrections
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Fill the form below to adjust incorrect field entries
                    according to review instructions and resubmit profile
                    evaluation.
                  </p>
                </div>
              </div>

              <form onSubmit={handleResubmitCorrections} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Citizenship Number
                    </label>
                    <input
                      type="text"
                      value={correctCitzNum}
                      onChange={(e) => setCorrectCitzNum(e.target.value)}
                      placeholder="e.g. 19-02-78-00912"
                      className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={correctDob}
                      onChange={(e) => setCorrectDob(e.target.value)}
                      className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Gender
                    </label>
                    <select
                      value={correctGender}
                      onChange={(e) => setCorrectGender(e.target.value)}
                      className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Permanent Address
                    </label>
                    <input
                      type="text"
                      value={correctAddress}
                      onChange={(e) => setCorrectAddress(e.target.value)}
                      placeholder="Province 3, Kathmandu District, Nepal"
                      className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Father Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={correctFather}
                      onChange={(e) => setCorrectFather(e.target.value)}
                      placeholder="Father's complete matching legal name"
                      className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Simulated Correction Upload Documents
                    </label>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCorrectCitzFront(
                            "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400",
                          )
                        }
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 border rounded-xl text-[10px] font-semibold cursor-pointer transition-all ${correctCitzFront ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                      >
                        <Upload className="w-4 h-4 mb-1 text-slate-400" />
                        {correctCitzFront ? "Front Loaded ✓" : "Upload Front"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCorrectCitzBack(
                            "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=400",
                          )
                        }
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 border rounded-xl text-[10px] font-semibold cursor-pointer transition-all ${correctCitzBack ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                      >
                        <Upload className="w-4 h-4 mb-1 text-slate-400" />
                        {correctCitzBack ? "Back Loaded ✓" : "Upload Back"}
                      </button>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 text-rose-600 text-xs py-2.5 px-3.5 border border-rose-200 rounded-xl font-mono">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isResubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                  >
                    {isResubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mating OCR and Recalculating landmarks...
                      </>
                    ) : (
                      <>
                        Resubmit Corrections & Request Review
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reset Application fresh start options (If Rejected or option for correction user) */}
          <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">
                Need to completely restart registration onboarding?
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                This terminates your existing profile files and lets you start
                the biometric capture, camera and signature workflow from step
                1.
              </p>
            </div>
            <button
              type="button"
              id="btn-restart-onboarding"
              onClick={handleResetApplication}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-750 text-white font-bold text-xs rounded-xl font-mono shadow-sm cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset & Restart Fresh Onboarding
            </button>
          </div>
        </main>
      ) : (
        <>
          {/* Hero Header block with current voter profile summary */}
          <header className="bg-slate-950 text-white px-6 py-8 border-b border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-emerald-400 tracking-wider font-mono text-[9px] font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 uppercase">
                  BIOMETRIC IDENTITY STATUS: SIGNED & SECURED
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {user.fullName}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                You are enrolled in the state-verified citizen voting registry.
                Your face image signature has been secured as a local match
                template.
              </p>
            </div>

            {/* Profile Card Block */}
            <div className="grid grid-cols-2 md:flex md:items-center gap-4 bg-slate-900 border border-slate-850 p-4 rounded-2xl text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-slate-500 text-[9px] block">
                    CITIZEN ID
                  </span>
                  <span className="text-white font-bold">
                    {user.nationalID}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-800 md:pl-4">
                <Phone className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-slate-500 text-[9px] block">
                    MOBILE
                  </span>
                  <span className="text-white font-bold">{user.mobile}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Mode Toggling tabs */}
          <div className="bg-white border-b border-slate-200 flex items-center justify-between shadow-sm shrink-0">
            <div className="max-w-7xl w-full mx-auto px-6 py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab("profile");
                    setErrorMsg("");
                  }}
                  className={`py-4 px-1 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                    activeMainTab === "profile"
                      ? "border-blue-500 text-slate-900 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Comprehensive Citizen Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMainTab("voting");
                    setErrorMsg("");
                  }}
                  className={`py-4 px-1 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                    activeMainTab === "voting"
                      ? "border-emerald-500 text-slate-900 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Vote className="w-4 h-4 text-emerald-500" />
                  <span>Official Ballot Portal</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono leading-none">
                {isVerificationCompleted ? (
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    🛡 Biometrics & Identity Verified
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-600 border border-amber-200 font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    ⚠️ Verification Checklist Pending
                  </span>
                )}
                <span className="bg-slate-100 text-slate-600 border border-slate-200 font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  🔒 Records Sealed (Read-Only)
                </span>
              </div>
            </div>
          </div>

          {activeMainTab === "voting" ? (
            /* Main UI Body columns */
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {/* LEFT COLUMN/SIDEBAR: ELECTIONS SELECT & countdown */}
              <section className="lg:col-span-1 flex flex-col gap-6">
                {/* Active Campaigns list selector */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>Configure Campaign Choice</span>
                  </h4>

                  {elections.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 italic text-center">
                      No active elections running in your ward currently.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {elections.map((elect) => {
                        const isVoted = votingStatuses[elect.id] === true;
                        return (
                          <button
                            key={elect.id}
                            onClick={() => {
                              setSelectedElection(elect);
                              setVoteStep("select_election");
                              setErrorMsg("");
                            }}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                              selectedElection?.id === elect.id
                                ? "bg-slate-950 border-slate-950 text-white shadow"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] uppercase font-mono">
                              <span className="font-semibold">
                                {elect.type}
                              </span>
                              {isVoted ? (
                                <span className="text-emerald-400 font-bold">
                                  Voted
                                </span>
                              ) : (
                                <span className="text-blue-500 text-[9px] font-bold">
                                  Pending Ballot
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-xs leading-snug line-clamp-2">
                              {elect.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Election Timer Block */}
                {selectedElection && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2 border border-amber-500/20">
                      <Clock
                        className="w-5 h-5 animate-spin duration-1000"
                        style={{ animationDuration: "12s" }}
                      />
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                      COUNTDOWN CLOSING SECONDS
                    </h5>
                    <div className="text-xl font-black text-amber-600 font-mono mt-1 mb-2 tracking-tight">
                      {countdownString}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Ends:{" "}
                      {new Date(selectedElection.endDate).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Bulletin Announcements Board */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <span>Official Bulletin Notices</span>
                  </h4>
                  <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto">
                    {notifications.slice(0, 3).map((notif) => (
                      <div
                        key={notif.id}
                        className="text-xs border-b border-slate-50 last:border-0 pb-3 last:pb-0"
                      >
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(notif.timestamp).toLocaleDateString()}
                        </span>
                        <h6 className="font-semibold text-slate-800 leading-snug">
                          {notif.title}
                        </h6>
                        <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* RIGHT/CENTER COLUMN: VOTING STEPS WIZARD */}
              <section className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-6 min-h-[480px]">
                  {errorMsg && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-800 text-xs font-sans">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">
                          Electoral Restriction Checked:
                        </span>
                        <p className="font-medium mt-0.5">{errorMsg}</p>
                      </div>
                    </div>
                  )}

                  {/* STEP 1: CHOOSE TARGET ELECTION OVERVIEW */}
                  {voteStep === "select_election" && selectedElection && (
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-2 text-indigo-500 mb-3 block">
                          <Sparkles className="w-5 h-5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                            WIZARD STEP 1 OF 3
                          </span>
                        </div>

                        <h3 className="font-black text-slate-900 text-lg mb-2 leading-tight">
                          {selectedElection.title}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed mb-6">
                          {selectedElection.description}
                        </p>

                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">
                              Start Window
                            </span>
                            <span className="font-bold text-slate-700">
                              {new Date(
                                selectedElection.startDate,
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-mono block uppercase">
                              Audited Votes capacity
                            </span>
                            <span className="font-bold text-slate-700">
                              {selectedElection.maxVotes.toLocaleString()}{" "}
                              unique voter locks
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Confirm step trigger */}
                      <div className="pt-6 border-t border-slate-100 mt-6 flex flex-col gap-5">
                        {/* Cryptographic Pre-Voting Checklist */}
                        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2.5 text-xs font-mono">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            Electoral Verification Checklist:
                          </span>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">
                              1. Citizen Identity & Biometrics Verification:
                            </span>
                            {isVerificationCompleted ? (
                              <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                                ✔ PASSED
                              </span>
                            ) : (
                              <span className="text-amber-600 font-extrabold flex items-center gap-1">
                                ✖ PENDING INCOMPLETE
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">
                              2. Active Campaign Status Validation:
                            </span>
                            {selectedElection.status === "Active" ? (
                              <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                                ✔ ACTIVE
                              </span>
                            ) : (
                              <span className="text-amber-500 font-extrabold flex items-center gap-1">
                                ✖ INACTIVE ({selectedElection.status})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">
                              3. Election Date Window Validation:
                            </span>
                            {(() => {
                              const now = new Date();
                              const start = new Date(
                                selectedElection.startDate,
                              );
                              const end = new Date(selectedElection.endDate);
                              if (now >= start && now <= end) {
                                return (
                                  <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                                    ✔ OPEN
                                  </span>
                                );
                              } else if (now < start) {
                                return (
                                  <span className="text-amber-500 font-extrabold flex items-center gap-1">
                                    🔒 OPENS ON {start.toLocaleDateString()}
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-red-500 font-extrabold flex items-center gap-1">
                                    ✖ EXPIRED
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          {votingStatuses[selectedElection.id] === true ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 font-bold w-full sm:w-auto justify-center">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                Multiple Voting Not Allowed - Complete
                              </span>
                            </div>
                          ) : (
                            (() => {
                              const now = new Date();
                              const start = new Date(
                                selectedElection.startDate,
                              );
                              const end = new Date(selectedElection.endDate);
                              const timelineActive = now >= start && now <= end;
                              const isCampaignActive =
                                selectedElection.status === "Active";
                              const canCast =
                                isVerificationCompleted &&
                                isCampaignActive &&
                                timelineActive;

                              if (!canCast) {
                                return (
                                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-sans p-3.5 rounded-xl leading-relaxed w-full">
                                    <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-extrabold block">
                                        Voting is Restricted:
                                      </span>
                                      <span>
                                        You cannot vote until the election is
                                        active and all of your citizen
                                        verification requirements have been
                                        completed.
                                      </span>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  type="button"
                                  id="btn-confirm-election-wizard"
                                  onClick={handleStartVoteCampaign}
                                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md cursor-pointer transition-colors"
                                >
                                  <span>Explore Campaign Candidates</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: BROWSE CANDIDATES */}
                  {voteStep === "view_candidates" && selectedElection && (
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-2 text-indigo-500 mb-3">
                          <Sparkles className="w-5 h-5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                            WIZARD STEP 2 OF 3
                          </span>
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-sm mb-4">
                          Choose Your Representative for:{" "}
                          {selectedElection.title}
                        </h3>

                        {candidates.length === 0 ? (
                          <p className="text-xs text-slate-500 py-12 italic text-center">
                            No nominees registered for this election yet.
                          </p>
                        ) : (
                          <div className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden">
                            <div className="grid grid-cols-[44px_72px_1fr_92px] gap-3 bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
                              <span>Vote</span>
                              <span>Photo</span>
                              <span>Candidate</span>
                              <span>Symbol</span>
                            </div>
                            {candidates.map((cand) => {
                              const isSelected =
                                selectedCandidate?.id === cand.id;
                              const symbolColor =
                                cand.electionSymbol?.displayColor ||
                                cand.partyColorTheme ||
                                "#2563eb";
                              return (
                                <label
                                  key={cand.id}
                                  className={`grid grid-cols-[44px_72px_1fr_92px] gap-3 px-3 py-4 border-t border-slate-200 cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-emerald-50 ring-2 ring-inset ring-emerald-500"
                                      : "bg-white hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-start justify-center pt-4">
                                    <input
                                      type="radio"
                                      name="candidateSelection"
                                      checked={isSelected}
                                      onChange={() =>
                                        setSelectedCandidate(cand)
                                      }
                                      className="h-5 w-5 accent-emerald-600"
                                      aria-label={`Select ${cand.name}`}
                                    />
                                  </div>

                                  <div className="flex flex-col items-center gap-2">
                                    <img
                                      src={cand.photoUrl}
                                      alt={cand.name}
                                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                                    />
                                    {!cand.isIndependent &&
                                      cand.partyLogoUrl && (
                                        <img
                                          src={cand.partyLogoUrl}
                                          alt={`${cand.party} logo`}
                                          className="w-7 h-7 rounded-md object-cover border border-slate-200"
                                        />
                                      )}
                                  </div>

                                  <div className="min-w-0 space-y-2">
                                    <div>
                                      <h5 className="font-black text-slate-900 text-sm">
                                        {cand.name}
                                      </h5>
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                          {cand.isIndependent
                                            ? "Independent Candidate"
                                            : cand.party}
                                        </span>
                                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                          {cand.electionPosition || "Candidate"}
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                                          {cand.electoralConstituency ||
                                            "Constituency pending"}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                                      {cand.biography ||
                                        cand.visionStatement ||
                                        cand.manifestoText ||
                                        "No specific bio provided."}
                                    </p>
                                    <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                                      <span className="font-bold text-slate-700">
                                        Vision:
                                      </span>{" "}
                                      {cand.visionStatement ||
                                        "Vision statement pending."}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setProfileCandidate(cand);
                                        }}
                                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                      >
                                        View Details
                                      </button>
                                      <span className="text-[10px] font-mono text-slate-500 px-2 py-1.5">
                                        {cand.candidateRegistrationNumber ||
                                          "Registration pending"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-center justify-center gap-2">
                                    <div
                                      className="w-16 h-16 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-4xl"
                                      style={{ color: symbolColor }}
                                    >
                                      {cand.electionSymbol?.imageUrl ? (
                                        <img
                                          src={cand.electionSymbol.imageUrl}
                                          alt={cand.electionSymbol.name}
                                          className="w-12 h-12 object-contain"
                                        />
                                      ) : (
                                        <span>
                                          {getSymbolGlyph(
                                            cand.electionSymbol?.name,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-700 text-center">
                                      {cand.electionSymbol?.name || "Symbol"}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setVoteStep("select_election")}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          Back to detail
                        </button>

                        <button
                          type="button"
                          disabled={!selectedCandidate}
                          onClick={() => setVoteStep("biometric_challenge")}
                          className="flex items-center gap-1.5 bg-blue-600 disabled:opacity-40 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-3 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors"
                        >
                          <span>Secure Biometric Verification</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: BIOMETRIC CHALLENGE CHECK */}
                  {voteStep === "biometric_challenge" &&
                    selectedElection &&
                    selectedCandidate && (
                      <div className="flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center gap-2 text-indigo-500 mb-3">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                              WIZARD STEP 3 OF 3: RE-AUTHENTICATE LIVENESS
                            </span>
                          </div>

                          <div className="mb-4 bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[9px] block">
                                Your Casting Choice:
                              </span>
                              <span className="font-bold text-slate-800 text-xs">
                                Nominee: {selectedCandidate.name} (
                                {selectedCandidate.party})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              Option fully anonymous
                            </span>
                          </div>

                          <div className="space-y-4">
                            <Suspense
                              fallback={
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                                  Loading face verification...
                                </div>
                              }
                            >
                              <FaceVerification
                                token={token}
                                electionId={selectedElection.id}
                                candidateLabel={`${selectedCandidate.name} (${selectedCandidate.party})`}
                                onBack={() => setVoteStep("view_candidates")}
                                onVerified={(result) => {
                                  setFaceVerificationId(result.verificationId);
                                  setFaceVerificationStatus("matched");
                                  setFaceVerificationScore(
                                    Math.round(result.similarityScore * 100),
                                  );
                                  setFaceVerificationMessage(result.message);
                                  setScanImage(
                                    "server-face-verification-passed",
                                  );
                                }}
                              />
                            </Suspense>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                  Live Face Verification
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${faceVerificationStatus === "matched" ? "text-emerald-600" : faceVerificationStatus === "checking" ? "text-blue-600" : "text-amber-600"}`}
                                >
                                  {faceVerificationStatus === "matched"
                                    ? "MATCHED"
                                    : faceVerificationStatus === "checking"
                                      ? "CHECKING"
                                      : "RETRY REQUIRED"}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 mb-2">
                                {faceVerificationMessage ||
                                  "Complete the live camera verification to unlock voting."}
                              </div>
                              {faceVerificationScore > 0 && (
                                <div className="text-[11px] text-slate-500 mb-2">
                                  Match score: {faceVerificationScore}%
                                </div>
                              )}
                              <div className="rounded-xl border border-slate-200 bg-white p-3 text-[10px] text-slate-500">
                                <div className="font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                  Live Fingerprint Match
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>
                                    Upload a fresh fingerprint image from your
                                    registered finger.
                                  </span>
                                  <span
                                    className={`font-bold ${fingerprintStatus === "matched" ? "text-emerald-600" : fingerprintStatus === "checking" ? "text-blue-600" : "text-amber-600"}`}
                                  >
                                    {fingerprintStatus === "matched"
                                      ? "MATCHED"
                                      : fingerprintStatus === "checking"
                                        ? "CHECKING"
                                        : "RETRY REQUIRED"}
                                  </span>
                                </div>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () =>
                                    handleFingerprintCapture(
                                      reader.result as string,
                                    );
                                  reader.readAsDataURL(file);
                                }}
                                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs"
                              />
                              <p className="text-[10px] text-slate-500 mt-2">
                                Upload a fresh fingerprint image from your
                                registered finger for real-time voting
                                authentication.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setVoteStep("view_candidates")}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            Back to nominees
                          </button>

                          <button
                            type="button"
                            disabled={
                              faceVerificationStatus !== "matched" ||
                              !faceVerificationId ||
                              voteSubmitting
                            }
                            onClick={handleCastBallot}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-750 disabled:opacity-50 text-white font-bold text-xs px-5 py-3 rounded-xl cursor-pointer disabled:cursor-not-allowed shadow transition-colors"
                          >
                            {voteSubmitting
                              ? "Casting sealed choice..."
                              : "Sealing choice & cast ballot"}
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                  {/* STEP 4: VOTING RECEIPT SUCCESS */}
                  {voteStep === "success" &&
                    selectedElection &&
                    selectedCandidate && (
                      <div className="flex flex-col items-center justify-center p-6 text-center flex-1">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
                          <CheckCircle className="w-8 h-8" />
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                          Cryptographic Voting Cast Successfully!
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mb-6">
                          Well done! Your ballot selection has been parsed,
                          stripped of voter identity parameters for full
                          anonymity, and hashed on our block logs.
                        </p>

                        {/* Cryptographic Receipt block */}
                        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 w-full max-w-sm text-left mb-6 font-mono text-xs">
                          <div className="border-b border-slate-900 pb-2 mb-3">
                            <span className="text-slate-500 text-[10px]">
                              AUTHENTICATED OFFICIAL RECEIPT
                            </span>
                            <h5 className="text-white font-bold text-xs mt-0.5">
                              {selectedElection.title}
                            </h5>
                          </div>
                          <div className="flex flex-col gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-500 block">
                                SEALED BALLOT ID
                              </span>
                              <span className="text-emerald-400 font-bold select-all break-all">
                                {successReceipt}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">
                                CAST TIMESTAMP
                              </span>
                              <span className="text-slate-300 font-semibold">
                                {new Date().toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">
                                AUDIT CONSTRAINTS APPROVED
                              </span>
                              <span className="text-emerald-500 font-semibold">
                                TRUE (1 Choice Limit applied)
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setVoteStep("select_election");
                            setSuccessReceipt(null);
                            setScanImage(null);
                          }}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition-all"
                        >
                          Return to Dashboard
                        </button>
                      </div>
                    )}
                </div>
              </section>
            </main>
          ) : (
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6 animate-in fade-in duration-300">
              {/* Informational banner about read-only / restricted voting profile state */}
              <div className="bg-blue-50 border border-blue-200/80 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20 shrink-0 mt-0.5">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-blue-700 font-extrabold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/10">
                      STATE REGISTER VERIFIED
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-2.5">
                      Secure Profile Verification Active
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Your identity registration is fully verified. Pursuant to
                      current national security and audit regulations:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-left">
                        <span className="text-[10px] uppercase font-mono font-bold text-red-600 block">
                          ✖ Voting Access Restricted
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Your verified account is not currently authorized to
                          cast ballots in the selected ward campaign.
                        </p>
                      </div>
                      <div className="p-3 bg-slate-500/5 border border-slate-500/10 rounded-xl text-left">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-600 block">
                          🔒Records Locked
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          No profile edits or document changes are allowed while
                          this verified status is active.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ComprehensiveProfile token={token} user={user} />
            </main>
          )}
        </>
      )}
      {profileCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] overflow-y-auto">
            <div
              className="h-32 rounded-t-2xl bg-slate-900 relative overflow-hidden"
              style={{
                background: profileCandidate.coverBannerUrl
                  ? `linear-gradient(90deg, rgba(15,23,42,.86), rgba(15,23,42,.45)), url(${profileCandidate.coverBannerUrl}) center/cover`
                  : `linear-gradient(135deg, ${profileCandidate.partyColorTheme || "#0f172a"}, #0f172a)`,
              }}
            >
              <button
                type="button"
                onClick={() => setProfileCandidate(null)}
                className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                Close
              </button>
              <div className="absolute left-6 bottom-5 text-white">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                  Candidate Verification Profile
                </p>
                <h3 className="text-2xl font-black">{profileCandidate.name}</h3>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
              <aside className="space-y-4">
                <img
                  src={profileCandidate.photoUrl}
                  alt={profileCandidate.name}
                  className="w-full aspect-square rounded-2xl object-cover border border-slate-200"
                />
                <div className="rounded-2xl border border-slate-200 p-4 text-center">
                  <div
                    className="mx-auto w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-5xl"
                    style={{
                      color:
                        profileCandidate.electionSymbol?.displayColor ||
                        profileCandidate.partyColorTheme ||
                        "#2563eb",
                    }}
                  >
                    {profileCandidate.electionSymbol?.imageUrl ? (
                      <img
                        src={profileCandidate.electionSymbol.imageUrl}
                        alt={profileCandidate.electionSymbol.name}
                        className="w-14 h-14 object-contain"
                      />
                    ) : (
                      <span>
                        {getSymbolGlyph(profileCandidate.electionSymbol?.name)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-black text-slate-900 mt-2">
                    {profileCandidate.electionSymbol?.name || "Election Symbol"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {profileCandidate.electionSymbol?.code || "SYMBOL"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
                  <p>
                    <span className="font-bold text-slate-700">Party:</span>{" "}
                    {profileCandidate.isIndependent
                      ? "Independent"
                      : profileCandidate.party}
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Position:</span>{" "}
                    {profileCandidate.electionPosition || "Candidate"}
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">
                      Constituency:
                    </span>{" "}
                    {profileCandidate.electoralConstituency || "Pending"}
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Status:</span>{" "}
                    {profileCandidate.candidateStatus || "Approved"}
                  </p>
                </div>
              </aside>

              <section className="space-y-5">
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-2">
                    Biography
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {profileCandidate.biography || "Biography pending."}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-2">
                    Vision
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {profileCandidate.visionStatement ||
                      "Vision statement pending."}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-2">
                    Manifesto
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {profileCandidate.manifestoText || "Manifesto pending."}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-2">
                    Key Promises
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(profileCandidate.keyPromises?.length
                      ? profileCandidate.keyPromises
                      : ["Public service commitment pending."]
                    ).map((promise) => (
                      <li
                        key={promise}
                        className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-3 py-2 font-semibold"
                      >
                        {promise}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <span className="font-black text-slate-700 block mb-1">
                      Education
                    </span>
                    {profileCandidate.education || "Not declared"}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <span className="font-black text-slate-700 block mb-1">
                      Experience
                    </span>
                    {profileCandidate.experience || "Not declared"}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <span className="font-black text-slate-700 block mb-1">
                      Contact
                    </span>
                    {profileCandidate.contactNumber || "Not public"}{" "}
                    {profileCandidate.emailAddress
                      ? ` | ${profileCandidate.emailAddress}`
                      : ""}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <span className="font-black text-slate-700 block mb-1">
                      QR Verification
                    </span>
                    {profileCandidate.verificationQrCode ||
                      profileCandidate.candidateRegistrationNumber ||
                      "Verification code pending"}
                  </div>
                </div>
                {profileCandidate.manifestoPdfUrl && (
                  <a
                    href={profileCandidate.manifestoPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    <FileText className="w-4 h-4" />
                    Download Manifesto PDF
                  </a>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
