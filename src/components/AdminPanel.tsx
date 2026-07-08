import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  ShieldAlert,
  FileText,
  Vote,
  Calendar,
  Award,
  LogIn,
  Search,
  Filter,
  Play,
  Power,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Send,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  Info,
  Database,
  X,
  Ban,
  Cpu,
  Activity,
  HardDrive,
  Terminal,
  CheckSquare,
  Layers,
  ShieldCheck,
  AlertCircle,
  Fingerprint,
  FileCode,
  Layout,
  KeyRound,
  PlayCircle,
  Clock,
  Settings2,
  RotateCcw,
  FileCheck2,
  Server,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  TrendingUp,
  Compass,
  PenTool,
  Flag,
  Sun,
  Moon,
} from "lucide-react";
import {
  User,
  Candidate,
  Election,
  AuditLog,
  DashboardStats,
  Notification,
} from "../types.js";
import { PartyManagementPanel } from "./PartyManagementPanel.js";

const ELECTION_SYMBOL_OPTIONS = [
  { name: "Tree", code: "TREE", displayColor: "#15803d" },
  { name: "Sun", code: "SUN", displayColor: "#f59e0b" },
  { name: "Moon", code: "MOON", displayColor: "#6366f1" },
  { name: "Star", code: "STAR", displayColor: "#eab308" },
  { name: "Rose", code: "ROSE", displayColor: "#e11d48" },
  { name: "Flower", code: "FLOWER", displayColor: "#db2777" },
  { name: "Book", code: "BOOK", displayColor: "#2563eb" },
  { name: "Pen", code: "PEN", displayColor: "#0f766e" },
  { name: "House", code: "HOUSE", displayColor: "#dc2626" },
  { name: "Bicycle", code: "BICYCLE", displayColor: "#16a34a" },
  { name: "Car", code: "CAR", displayColor: "#0891b2" },
  { name: "Bus", code: "BUS", displayColor: "#ca8a04" },
  { name: "Boat", code: "BOAT", displayColor: "#0284c7" },
  { name: "Dove", code: "DOVE", displayColor: "#64748b" },
  { name: "Elephant", code: "ELEPHANT", displayColor: "#475569" },
  { name: "Lion", code: "LION", displayColor: "#b45309" },
  { name: "Rooster", code: "ROOSTER", displayColor: "#dc2626" },
  { name: "Cow", code: "COW", displayColor: "#7c3aed" },
  { name: "Wheat", code: "WHEAT", displayColor: "#a16207" },
  { name: "Gear", code: "GEAR", displayColor: "#334155" },
];

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

const DEFAULT_CANDIDATE_FORM = {
  id: "",
  name: "",
  fullName: "",
  gender: "Male",
  dateOfBirth: "",
  citizenshipNumber: "",
  contactNumber: "",
  emailAddress: "",
  permanentAddress: "",
  currentAddress: "",
  electionType: "Federal",
  electionPosition: "Member of Parliament",
  electoralConstituency: "",
  wardNumber: "",
  candidateRegistrationNumber: "",
  nominationDate: new Date().toISOString().substring(0, 10),
  electionSymbolAllocationDate: "",
  candidateStatus: "Pending",
  party: "",
  politicalPartyName: "",
  partyLogoUrl: "",
  partyAbbreviation: "",
  partyColorTheme: "#2563eb",
  isIndependent: false,
  biography: "",
  visionStatement: "",
  manifestoText: "",
  keyPromises: "",
  education: "",
  experience: "",
  profession: "",
  assetsDeclaration: "",
  criminalCaseDeclaration: "No criminal case declared.",
  socialMediaLinks: "",
  officialWebsite: "",
  manifestoPdfUrl: "",
  coverBannerUrl: "",
  verificationQrCode: "",
  photoUrl: "",
  electionSymbol: ELECTION_SYMBOL_OPTIONS[0],
  isVisible: true,
  electionId: "",
};

interface AdminPanelProps {
  token: string;
  onLogout: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export default function AdminPanel({
  token,
  onLogout,
  theme,
  setTheme,
}: AdminPanelProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Political parties states
  const [parties, setParties] = useState<any[]>([]);

  // Search/Filter state
  const [voterSearch, setVoterSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [selectedElectionFilter, setSelectedElectionFilter] = useState("all");
  const [voterStatusFilter, setVoterStatusFilter] = useState<
    "all" | "pending" | "approved" | "suspended"
  >("all");

  // Tab State
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "elections"
    | "candidates"
    | "parties"
    | "security"
    | "announcements"
    | "voters"
    | "settings"
    | "faqs"
    | "team"
    | "reports"
  >("dashboard");

  // FAQ and Team management states
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState("all");
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [faqForm, setFaqForm] = useState({
    id: "",
    question: "",
    answer: "",
    category: "Registration",
    displayOrder: 1,
    status: "Published" as "Published" | "Draft",
  });

  const [faqPaginationPage, setFaqPaginationPage] = useState(1);
  const [faqBulkSelected, setFaqBulkSelected] = useState<string[]>([]);

  const [team, setTeam] = useState<any[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [teamForm, setTeamForm] = useState({
    id: "",
    fullName: "",
    username: "",
    email: "",
    password: "",
    mobile: "",
    role: "Administrator" as
      | "Administrator"
      | "Election Officer"
      | "Super Administrator"
      | "Moderator"
      | "FAQ Manager"
      | "Verification Officer"
      | "Support Staff",
  });

  // Form states
  const [electionForm, setElectionForm] = useState({
    id: "",
    title: "",
    description: "",
    type: "General Election",
    startDate: new Date().toISOString().substring(0, 16),
    endDate: new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 16),
    maxVotes: 100000,
  });
  const [showElectionModal, setShowElectionModal] = useState(false);

  const [candidateForm, setCandidateForm] = useState(DEFAULT_CANDIDATE_FORM);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "warning" | "alert",
  });

  const [smtpForm, setSmtpForm] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
  });

  const [twilioForm, setTwilioForm] = useState({
    twilioSid: "",
    twilioToken: "",
    twilioFrom: "",
  });

  const [voters, setVoters] = useState<User[]>([]);
  const [envStatus, setEnvStatus] = useState<any>(null);

  // SecOps dynamic states
  const [secopsStatus, setSecopsStatus] = useState<any>(null);
  const [secopsLoading, setSecopsLoading] = useState(true);
  const [activeSecTab, setActiveSecTab] = useState<
    "operations" | "topology" | "integrity" | "audit"
  >("operations");
  const [selectedBallotInspect, setSelectedBallotInspect] = useState<any>(null);
  const [integrityReportList, setIntegrityReportList] = useState<any>(null);
  const [integrityAuditRunning, setIntegrityAuditRunning] = useState(false);
  const [secopsMsg, setSecopsMsg] = useState({ text: "", isError: false });

  // Inspecting voter profile states
  const [inspectingVoterId, setInspectingVoterId] = useState<string | null>(
    null,
  );
  const [inspectingVoterData, setInspectingVoterData] = useState<any>(null);
  const [inspectingLoading, setInspectingLoading] = useState(false);
  const [inspectingError, setInspectingError] = useState("");

  // Custom review action states
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [selectedChangesFields, setSelectedChangesFields] = useState<string[]>(
    [],
  );

  // Candidate auditing and active search filters
  const [selectedReviewCandidate, setSelectedReviewCandidate] =
    useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [candidateFilterStatus, setCandidateFilterStatus] = useState<
    "All" | "Pending" | "Verified" | "Rejected"
  >("All");
  const [candidateSearchQuery, setCandidateSearchQuery] = useState("");

  // Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // 1. Stats
      const statsRes = await fetch("/api/dashboard/stats", { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        setAuditLogs(statsData.recentLogs || []);
      }

      // 2. Elections
      const electRes = await fetch("/api/elections", { headers });
      if (electRes.ok) {
        const electData = await electRes.json();
        setElections(electData.elections || []);
      }

      // 3. Candidates
      const candRes = await fetch("/api/candidates?includePending=true", {
        headers,
      });
      if (candRes.ok) {
        const candData = await candRes.json();
        setCandidates(candData.candidates || []);
      }

      // 4. Notifications
      const notifRes = await fetch("/api/notifications", { headers });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }

      // 5. Audit log full sync
      const auditRes = await fetch("/api/audit-logs", { headers });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }

      // 6. Voter Management sync
      const votersRes = await fetch("/api/voters", { headers });
      if (votersRes.ok) {
        const votersData = await votersRes.json();
        setVoters(votersData.voters || []);
      }

      // 7. System Config sync
      const configRes = await fetch("/api/system/config", { headers });
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.config) {
          setSmtpForm({
            smtpHost: configData.config.smtpHost || "",
            smtpPort: configData.config.smtpPort || 587,
            smtpUser: configData.config.smtpUser || "",
            smtpPass: "••••••••••••••••",
          });
          setTwilioForm({
            twilioSid: configData.config.twilioSid || "",
            twilioToken: configData.config.twilioToken || "",
            twilioFrom: configData.config.twilioFrom || "",
          });
        }
        if (configData.envStatus) {
          setEnvStatus(configData.envStatus);
        }
      }

      // 8. FAQ Data fetch
      const faqsRes = await fetch("/api/faqs", { headers });
      if (faqsRes.ok) {
        const faqsData = await faqsRes.json();
        setFaqs(faqsData.faqs || []);
      }

      // 9. Admin Team fetch
      const teamRes = await fetch("/api/admin/team", { headers });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeam(teamData.team || []);
      }

      // 10. Political Parties fetch
      const partiesRes = await fetch("/api/parties", { headers });
      if (partiesRes.ok) {
        const partiesData = await partiesRes.json();
        setParties(partiesData.parties || []);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Failed to synchronize election dashboard records!");
    } finally {
      setLoading(false);
    }
  };

  const fetchSecopsData = async () => {
    try {
      const res = await fetch("/api/secops/db-status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSecopsStatus(data);
      }
    } catch (e) {
      console.error("Failed to sync SecOps telemetry:", e);
    } finally {
      setSecopsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (activeTab === "security") {
      fetchSecopsData();
      const interval = setInterval(fetchSecopsData, 4500);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const triggerToast = (msgString: string, isError = false) => {
    if (isError) {
      setErrorMsg(msgString);
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setSuccessMsg(msgString);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  // ----------------------------------------------------
  // SECOPS SECURE OPERATIONS CONTROLLER HANDLERS
  // ----------------------------------------------------

  const handleSecopsReconnect = async () => {
    setSecopsMsg({
      text: "Sending MongoDB Connection Packet...",
      isError: false,
    });
    try {
      const res = await fetch("/api/secops/reconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.isConnected) {
        triggerToast("Primary database connection re-established!");
        setSecopsMsg({
          text: "Primary MongoDB link established.",
          isError: false,
        });
      } else {
        triggerToast(data.message || "Database remains unreachable.", true);
        setSecopsMsg({
          text: data.message || "Could not reach database.",
          isError: true,
        });
      }
      fetchSecopsData();
    } catch (e: any) {
      triggerToast(e.message, true);
      setSecopsMsg({ text: e.message, isError: true });
    }
  };

  const handleSecopsForceFailover = async () => {
    setSecopsMsg({
      text: "Initiating emergency failover sequence...",
      isError: false,
    });
    try {
      const res = await fetch("/api/secops/force-failover", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(data.message);
        setSecopsMsg({ text: data.message, isError: false });
      } else {
        triggerToast("Failed to toggle failover schema.", true);
        setSecopsMsg({ text: "Failover toggle failed.", isError: true });
      }
      fetchSecopsData();
    } catch (e: any) {
      triggerToast(e.message, true);
      setSecopsMsg({ text: e.message, isError: true });
    }
  };

  const handleSecopsClearQueue = async () => {
    if (
      !window.confirm(
        "Are you sure you want to purge all pending offline database synchronization operations? This action is irreversible.",
      )
    )
      return;
    setSecopsMsg({
      text: "Purging queued offline sync operations...",
      isError: false,
    });
    try {
      const res = await fetch("/api/secops/clear-queue", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(data.message);
        setSecopsMsg({ text: data.message, isError: false });
      } else {
        triggerToast("Queue flush request failed.", true);
        setSecopsMsg({ text: "Queue wipe failed.", isError: true });
      }
      fetchSecopsData();
    } catch (e: any) {
      triggerToast(e.message, true);
      setSecopsMsg({ text: e.message, isError: true });
    }
  };

  const handleSecopsCryptographicBackup = async () => {
    setSecopsMsg({
      text: "Compiling AES-GCM local storage snapshot...",
      isError: false,
    });
    try {
      const res = await fetch("/api/secops/backup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(data.message);
        setSecopsMsg({ text: data.message, isError: false });
      } else {
        triggerToast("Cryptographic backup compilation aborted.", true);
        setSecopsMsg({ text: "AES-GCM backup compile failed.", isError: true });
      }
      fetchSecopsData();
    } catch (e: any) {
      triggerToast(e.message, true);
      setSecopsMsg({ text: e.message, isError: true });
    }
  };

  const handleSecopsCryptographicRestore = async () => {
    if (
      !window.confirm(
        "Warning: Restoring the localized registries will overwrite current working states with historical encrypted backups. Proceed?",
      )
    )
      return;
    setSecopsMsg({
      text: "Decrypting key store and restoring directories...",
      isError: false,
    });
    try {
      const res = await fetch("/api/secops/restore", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(data.message);
        setSecopsMsg({ text: data.message, isError: false });
      } else {
        triggerToast("Standard fallback directory restore aborted.", true);
        setSecopsMsg({ text: "AES-GCM restore decyst failed.", isError: true });
      }
      fetchSecopsData();
    } catch (e: any) {
      triggerToast(e.message, true);
      setSecopsMsg({ text: e.message, isError: true });
    }
  };

  const handleSecopsRunIntegrityCheck = async () => {
    setIntegrityAuditRunning(true);
    setSecopsMsg({
      text: "Performing cryptographic integrity ledger checks...",
      isError: false,
    });
    try {
      const res = await fetch("/api/secops/integrity-check", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setIntegrityReportList(data.report);
        if (data.report.status === "valid") {
          triggerToast("Excellent. Ledger integrity audit fully validated.");
          setSecopsMsg({
            text: "Cryptographic integrity verified. Database is completely pristine.",
            isError: false,
          });
        } else {
          triggerToast(
            "Compromises or mismatches discovered in audit records!",
            true,
          );
          setSecopsMsg({
            text: "System compromised! Mismatches discovered.",
            isError: true,
          });
        }
      } else {
        triggerToast("Failed to execute ledger compliance checks.", true);
        setSecopsMsg({ text: "Ledger check failed.", isError: true });
      }
      fetchSecopsData();
    } catch (e: any) {
      triggerToast(e.message, true);
      setSecopsMsg({ text: e.message, isError: true });
    } finally {
      setIntegrityAuditRunning(false);
    }
  };

  // ----------------------------------------------------
  // ELECTION HANDLERS
  // ----------------------------------------------------

  const handleCreateOrUpdateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const url = electionForm.id
        ? `/api/elections/${electionForm.id}`
        : "/api/elections";
      const method = electionForm.id ? "PUT" : "POST";

      const bodyData = {
        ...electionForm,
        startDate: new Date(electionForm.startDate).toISOString(),
        endDate: new Date(electionForm.endDate).toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Execution failed");
      }

      triggerToast(
        electionForm.id
          ? "Election configuration updated!"
          : "New Election successfully published!",
      );
      setShowElectionModal(false);

      // Reset Form
      setElectionForm({
        id: "",
        title: "",
        description: "",
        type: "General Election",
        startDate: new Date().toISOString().substring(0, 16),
        endDate: new Date(Date.now() + 86400000 * 7)
          .toISOString()
          .substring(0, 16),
        maxVotes: 100000,
      });

      fetchData();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleEditElectionClick = (elect: Election) => {
    setElectionForm({
      id: elect.id,
      title: elect.title,
      description: elect.description,
      type: elect.type,
      startDate: new Date(elect.startDate).toISOString().substring(0, 16),
      endDate: new Date(elect.endDate).toISOString().substring(0, 16),
      maxVotes: elect.maxVotes,
    });
    setShowElectionModal(true);
  };

  const handleDeleteElection = async (id: string) => {
    if (
      !window.confirm(
        "Are you absolutely sure you want to delete this election? All votes and associated candidates logs might be archived.",
      )
    )
      return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/elections/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Deletion rejected by access roles");

      triggerToast("Election deleted successfully");
      fetchData();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleToggleElectionStatus = async (
    elect: Election,
    nextStatus: "Draft" | "Active" | "Closed" | "Published",
  ) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/elections/${elect.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Status updating failed");
      triggerToast(`Election: "${elect.title}" is now ${nextStatus}`);
      fetchData();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  // ----------------------------------------------------
  // CANDIDATE HANDLERS
  // ----------------------------------------------------

  const handleCreateOrUpdateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const url = candidateForm.id
        ? `/api/candidates/${candidateForm.id}`
        : "/api/candidates";
      const method = candidateForm.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...candidateForm,
          name: candidateForm.name || candidateForm.fullName,
          fullName: candidateForm.fullName || candidateForm.name,
          party: candidateForm.isIndependent ? "Independent" : candidateForm.party,
          politicalPartyName: candidateForm.isIndependent ? "Independent" : (candidateForm.politicalPartyName || candidateForm.party),
          partyLogoUrl: candidateForm.isIndependent ? "" : candidateForm.partyLogoUrl,
          keyPromises: candidateForm.keyPromises
            .split(/\r?\n/)
            .map((item) => item.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Candidate compilation failed");
      }

      triggerToast(
        candidateForm.id
          ? "Candidate record modified!"
          : "Candidate profiles registered!",
      );
      setShowCandidateModal(false);

      // Reset
      setCandidateForm(DEFAULT_CANDIDATE_FORM);

      fetchData();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleVerifyCandidate = async (
    candidateId: string,
    status: "Verified" | "Rejected" | "Withdrawn" | "Pending",
    rejectionReason?: string,
  ) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/candidates/${candidateId}/verify`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status, rejectionReason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Candidate verification update failed.");
      }

      triggerToast(
        `Candidate portfolio has been successfully mapped to: ${status === "Verified" ? "APPROVED" : status.toUpperCase()}.`,
      );
      setShowReviewModal(false);
      setRejectionComment("");
      setSelectedReviewCandidate(null);
      fetchData();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleEditCandidateClick = (cand: Candidate) => {
    setCandidateForm({
      id: cand.id,
      name: cand.name || cand.fullName || "",
      fullName: cand.fullName || cand.name || "",
      gender: cand.gender || "Male",
      dateOfBirth: cand.dateOfBirth || "",
      citizenshipNumber: cand.citizenshipNumber || "",
      contactNumber: cand.contactNumber || "",
      emailAddress: cand.emailAddress || "",
      permanentAddress: cand.permanentAddress || "",
      currentAddress: cand.currentAddress || "",
      electionType: cand.electionType || "Federal",
      electionPosition: cand.electionPosition || "Member of Parliament",
      electoralConstituency: cand.electoralConstituency || "",
      wardNumber: cand.wardNumber || "",
      candidateRegistrationNumber: cand.candidateRegistrationNumber || "",
      nominationDate: cand.nominationDate || "",
      electionSymbolAllocationDate: cand.electionSymbolAllocationDate || "",
      candidateStatus: cand.candidateStatus || (cand.status === "Verified" ? "Approved" : cand.status || "Pending"),
      party: cand.party || "",
      politicalPartyName: cand.politicalPartyName || cand.party || "",
      partyLogoUrl: cand.partyLogoUrl || cand.partyLogo || "",
      partyAbbreviation: cand.partyAbbreviation || "",
      partyColorTheme: cand.partyColorTheme || "#2563eb",
      isIndependent: !!cand.isIndependent || cand.party === "Independent",
      biography: cand.biography || "",
      visionStatement: cand.visionStatement || "",
      education: cand.education || "",
      experience: cand.experience || "",
      profession: cand.profession || "",
      assetsDeclaration: cand.assetsDeclaration || "",
      criminalCaseDeclaration: cand.criminalCaseDeclaration || "",
      socialMediaLinks: cand.socialMediaLinks || "",
      officialWebsite: cand.officialWebsite || "",
      photoUrl: cand.photoUrl || "",
      manifestoText: cand.manifestoText || "",
      keyPromises: (cand.keyPromises || []).join("\n"),
      manifestoPdfUrl: cand.manifestoPdfUrl || "",
      coverBannerUrl: cand.coverBannerUrl || "",
      verificationQrCode: cand.verificationQrCode || "",
      electionSymbol: cand.electionSymbol || ELECTION_SYMBOL_OPTIONS[0],
      isVisible: cand.isVisible !== false,
      electionId: cand.electionId,
    });
    setShowCandidateModal(true);
  };

  const handleDeleteCandidate = async (id: string) => {
    if (
      !window.confirm("Delete candidate profile permanently from registries?")
    )
      return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/candidates/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Operation rejected");

      triggerToast("Candidate record deleted successfully");
      fetchData();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  // ----------------------------------------------------
  // ANNOUNCEMENTS
  // ----------------------------------------------------

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.message) {
      return triggerToast("Complete announcement parameters first!", true);
    }
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers,
        body: JSON.stringify(announcementForm),
      });

      if (!res.ok) throw new Error("Dispatch failed");
      triggerToast("System announcement successfully pushed!");
      setAnnouncementForm({ title: "", message: "", type: "info" });
      fetchData();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  // ----------------------------------------------------
  // VOTERS MANAGEMENT & SYSTEM HQ HANDLERS
  // ----------------------------------------------------

  const handleUpdateVoterStatus = async (
    voterId: string,
    payload: {
      isApproved?: boolean;
      isVerified?: boolean;
      isSuspended?: boolean;
      accountStatus?: string;
      rejectionReason?: string;
      requestedChangesFields?: string[];
    },
  ) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/voters/${voterId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update voter status");
      }

      triggerToast("Voter status revised successfully!");
      fetchData();
      if (inspectingVoterId === voterId) {
        fetchInspectingVoter(voterId);
      }
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const fetchInspectingVoter = async (id: string) => {
    try {
      setInspectingLoading(true);
      setInspectingError("");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/voters/${id}/profile`, { headers });
      if (!res.ok) {
        throw new Error("Failed to load voter profile details");
      }
      const data = await res.json();
      setInspectingVoterData(data);
      setRejectionReasonInput(data.voter.rejectionReason || "");
      setSelectedChangesFields(data.voter.requestedChangesFields || []);
    } catch (err: any) {
      setInspectingError(err.message);
    } finally {
      setInspectingLoading(false);
    }
  };

  useEffect(() => {
    if (inspectingVoterId) {
      fetchInspectingVoter(inspectingVoterId);
    } else {
      setInspectingVoterData(null);
    }
  }, [inspectingVoterId]);

  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/system/config", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...smtpForm,
          ...twilioForm,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save configurations");
      }

      triggerToast("SMTP and Twilio parameters secured!");
      fetchData();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/system/backup", {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to compile backup");
      }

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `votex_db_backup_${new Date().toISOString().substring(0, 10)}.json`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast("Backup downloaded successfully!");
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleUploadRestore = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !window.confirm(
        "WARNING: This will replace the entire database content with the uploaded file data. Do you wish to continue?",
      )
    ) {
      e.target.value = "";
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target?.result as string);
          const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          };
          const res = await fetch("/api/system/restore", {
            method: "POST",
            headers,
            body: JSON.stringify({ backupData }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to restore backup file");
          }

          triggerToast("All database collections restored successfully!");
          fetchData();
        } catch (err: any) {
          triggerToast(err.message, true);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      e.target.value = "";
    }
  };

  // ----------------------------------------------------
  // REPORT DOWNLOADS (CSV EXPORTER)
  // ----------------------------------------------------

  const downloadElectionResultsCSV = () => {
    if (!stats || stats.candidateVotes.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Candidate ID,Candidate Name,Political Party,Target Election,Votes Received\n";

    stats.candidateVotes.forEach((cv) => {
      csvContent += `"${cv.id}","${cv.name}","${cv.party}","${cv.electionTitle}",${cv.votesCount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `votex_election_tallies_${new Date().toISOString().substring(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAuditLogsCSV = () => {
    if (auditLogs.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Log ID,Voter ID,Action Captured,Timestamp,IP Address,Device Platform,Browser Agent\n";

    auditLogs.forEach((al) => {
      csvContent += `"${al.id}","${al.userId}","${al.action}","${al.timestamp}","${al.ipAddress}","${al.device}","${al.browser}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `votex_audit_logs_${new Date().toISOString().substring(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // FAQ & TEAM ACTION HANDLERS
  // ----------------------------------------------------

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question || !faqForm.answer || !faqForm.category) {
      setErrorMsg("Question, Answer, and Category are required");
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const isEditing = !!faqForm.id;
      const url = isEditing ? `/api/faqs/${faqForm.id}` : "/api/faqs";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          question: faqForm.question,
          answer: faqForm.answer,
          category: faqForm.category,
          displayOrder: Number(faqForm.displayOrder) || 1,
          status: faqForm.status,
        }),
      });

      if (res.ok) {
        setSuccessMsg(
          isEditing
            ? "FAQ record modified successfully!"
            : "New FAQ published successfully!",
        );
        setShowFaqModal(false);
        setEditingFaq(null);
        setFaqForm({
          id: "",
          question: "",
          answer: "",
          category: "Registration",
          displayOrder: 1,
          status: "Published",
        });
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Failed to preserve FAQ record");
        setTimeout(() => setErrorMsg(""), 3500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("FAQ service connection error!");
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ record?")) return;

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/faqs/${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setSuccessMsg("FAQ deleted successfully.");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Failed to remove FAQ record");
        setTimeout(() => setErrorMsg(""), 3500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("FAQ connection error!");
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  const handleFaqBulkAction = async (action: "publish" | "hide" | "delete") => {
    if (faqBulkSelected.length === 0) return;
    if (
      action === "delete" &&
      !confirm(
        `Are you sure you want to delete ${faqBulkSelected.length} FAQ records?`,
      )
    )
      return;

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/faqs/bulk", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ids: faqBulkSelected,
          action,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Bulk action executed successfully.");
        setFaqBulkSelected([]);
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Bulk execution failed");
        setTimeout(() => setErrorMsg(""), 3500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("FAQ service failure");
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  const handleFaqMove = async (id: string, direction: "up" | "down") => {
    let categoryFaqs = faqs.sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
    );
    const index = categoryFaqs.findIndex((f) => f.id === id);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      const sortedIds = [...categoryFaqs].map((f) => f.id);
      const temp = sortedIds[index];
      sortedIds[index] = sortedIds[index - 1];
      sortedIds[index - 1] = temp;

      await saveSortedFaqs(sortedIds);
    } else if (direction === "down" && index < categoryFaqs.length - 1) {
      const sortedIds = [...categoryFaqs].map((f) => f.id);
      const temp = sortedIds[index];
      sortedIds[index] = sortedIds[index + 1];
      sortedIds[index + 1] = temp;

      await saveSortedFaqs(sortedIds);
    }
  };

  const saveSortedFaqs = async (sortedIds: string[]) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/faqs/sort", {
        method: "POST",
        headers,
        body: JSON.stringify({ sortedIds }),
      });
      if (res.ok) {
        setSuccessMsg("Hierarchy reallocated successfully.");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 1500);
      } else {
        setErrorMsg("Failed to preserve new ordering sequence.");
        setTimeout(() => setErrorMsg(""), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !teamForm.fullName ||
      !teamForm.email ||
      !teamForm.username ||
      !teamForm.role
    ) {
      setErrorMsg(
        "Full Name, Email, Username, and Role are mandatory parameters",
      );
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const isEditing = !!teamForm.id;
      const url = isEditing
        ? `/api/admin/team/${teamForm.id}`
        : "/api/admin/team";
      const method = isEditing ? "PUT" : "POST";

      const payload: any = {
        fullName: teamForm.fullName,
        mobile: teamForm.mobile,
        role: teamForm.role,
      };

      if (!isEditing) {
        payload.username = teamForm.username;
        payload.email = teamForm.email;
        payload.password = teamForm.password || "VoxAdmin@2026";
      } else if (teamForm.password) {
        payload.password = teamForm.password;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg(
          isEditing
            ? "Team member record updated."
            : "New administrative staff account provisioned!",
        );
        setShowTeamModal(false);
        setEditingTeam(null);
        setTeamForm({
          id: "",
          fullName: "",
          username: "",
          email: "",
          password: "",
          mobile: "",
          role: "Administrator",
        });
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Staff account customization failure");
        setTimeout(() => setErrorMsg(""), 3500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Team service failure.");
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to deactivate and remove this staff account?",
      )
    )
      return;

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setSuccessMsg("Staff member terminated successfully.");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Deactivation failure");
        setTimeout(() => setErrorMsg(""), 3500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Team connection failure.");
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  const handleToggleSuspendStaff = async (member: any) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          isSuspended: !member.isSuspended,
        }),
      });

      if (res.ok) {
        setSuccessMsg(
          member.isSuspended
            ? "Staff member reactivated!"
            : "Staff member temporarily suspended!",
        );
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Action toggle failure");
        setTimeout(() => setErrorMsg(""), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const term = auditSearch.toLowerCase();
    return (
      log.userEmail.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.ipAddress.includes(term) ||
      log.device.toLowerCase().includes(term)
    );
  });

  const isLight = theme === "light";
  const panelShellClass = isLight
    ? "min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans"
    : "min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans";
  const navClass = isLight
    ? "bg-white text-slate-900 px-6 py-4 shadow-sm border-b border-slate-200 flex items-center justify-between shrink-0"
    : "bg-slate-900 text-white px-6 py-4 shadow-md flex items-center justify-between shrink-0";
  const navTitleClass = isLight
    ? "font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5"
    : "font-extrabold text-base tracking-tight text-white flex items-center gap-1.5";
  const navSubtitleClass = isLight
    ? "text-[10px] text-slate-500 font-mono tracking-wider"
    : "text-[10px] text-slate-400 font-mono tracking-wider";
  const themeToggleClass = isLight
    ? "p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 rounded-lg transition-colors cursor-pointer"
    : "p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer";
  const cardClass = isLight
    ? "bg-white border border-slate-100 shadow-sm"
    : "bg-slate-900 border border-slate-800 shadow-xl";
  const cardSoftClass = isLight
    ? "bg-slate-50 border border-slate-100"
    : "bg-slate-950 border border-slate-800";
  const titleClass = isLight ? "text-slate-900" : "text-white";
  const mutedClass = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div className={panelShellClass}>
      {/* Toast Alert panel */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 font-medium text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 font-medium text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Admin navigation bar */}
      <nav className={navClass}>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-emerald-500 p-2.5 rounded-xl text-slate-950 font-black shadow-md tracking-wider text-sm">
            NP
          </div>
          <div>
            <h1 className={navTitleClass}>Nepal Vote</h1>
            <p className={navSubtitleClass}>SECURE ELECTION HEADQUARTERS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
            className={themeToggleClass}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={fetchData}
            title="Update Data feeds"
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="hidden md:block text-right">
            <span className="text-[10px] text-slate-400 block font-mono">
              AUTHORIZED OFFICIAL
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              ROLE: Administrator
            </span>
          </div>

          <button
            type="button"
            id="btn-admin-logout"
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-red-900 border border-slate-700 hover:border-red-600/30 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
          >
            Logout Command
          </button>
        </div>
      </nav>

      {/* Main Admin Columns */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar Menu */}
        <aside
          className={`w-full bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible transition-all duration-300 ${sidebarCollapsed ? "md:w-20" : "md:w-60"}`}
        >
          {/* Sidebar Toggle for Desktop */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center justify-center p-2 mb-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Layers
              className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-90" : ""}`}
            />
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "dashboard"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              HQ Dashboard
            </span>
          </button>

          <button
            onClick={() => setActiveTab("elections")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "elections"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Manage Elections
            </span>
          </button>

          <button
            onClick={() => setActiveTab("candidates")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "candidates"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Manage Candidates
            </span>
          </button>

          <button
            onClick={() => setActiveTab("parties")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "parties"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Flag className="w-4 h-4 shrink-0 text-amber-500" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Manage Parties
            </span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "security"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Audit Registries
            </span>
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "announcements"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Global Alerts
            </span>
          </button>

          <button
            onClick={() => setActiveTab("voters")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "voters"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Manage Voters
            </span>
          </button>

          <button
            onClick={() => setActiveTab("faqs")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "faqs"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0 text-indigo-500" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Manage FAQ
            </span>
          </button>

          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "team"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-550" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Manage Team
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "reports"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-amber-550" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              Download Reports
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "settings"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Power className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "hidden" : "inline"}>
              System Settings
            </span>
          </button>
        </aside>

        {/* Dynamic Center Workstation */}
        <main
          className={
            isLight
              ? "flex-1 p-6 overflow-y-auto bg-slate-50"
              : "flex-1 p-6 overflow-y-auto bg-slate-950"
          }
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-2 text-blue-600" />
              <p className="text-xs font-mono">
                Synchronizing state blocks across databases...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === "dashboard" && stats && (
                <div className="flex flex-col gap-6">
                  {/* Stat cards block */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className={`${cardClass} rounded-2xl p-5`}>
                      <div
                        className={`${mutedClass} mb-1 flex items-center justify-between`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Registered Voters
                        </span>
                        <Users className="w-4 h-4 text-slate-300" />
                      </div>
                      <h4 className={`text-2xl font-black ${titleClass}`}>
                        {stats.metrics.registeredVoters}
                      </h4>
                      <span className={`text-[9px] ${mutedClass} font-mono`}>
                        From civic registry files
                      </span>
                    </div>

                    <div className={`${cardClass} rounded-2xl p-5`}>
                      <div
                        className={`${mutedClass} mb-1 flex items-center justify-between`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Biometrically Enrolled
                        </span>
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <h4 className="text-2xl font-black text-emerald-600">
                        {stats.metrics.verifiedVoters}
                      </h4>
                      <span className="text-[9px] text-emerald-600 font-mono font-medium">
                        Iris & Facials secured
                      </span>
                    </div>

                    <div className={`${cardClass} rounded-2xl p-5`}>
                      <div
                        className={`${mutedClass} mb-1 flex items-center justify-between`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Active Candidates
                        </span>
                        <Award className="w-4 h-4 text-amber-500" />
                      </div>
                      <h4 className={`text-2xl font-black ${titleClass}`}>
                        {stats.metrics.totalCandidates}
                      </h4>
                      <span className={`text-[9px] ${mutedClass} font-mono`}>
                        Matched in valid races
                      </span>
                    </div>

                    <div className={`${cardClass} rounded-2xl p-5`}>
                      <div
                        className={`${mutedClass} mb-1 flex items-center justify-between`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Total Ballots Cast
                        </span>
                        <Vote className="w-4 h-4 text-blue-500" />
                      </div>
                      <h4 className="text-2xl font-black text-blue-600">
                        {stats.metrics.totalVotes}
                      </h4>
                      <span className="text-[9px] text-blue-600 font-mono font-medium">
                        Auditable receipt chains
                      </span>
                    </div>

                    <div
                      className={`${cardClass} rounded-2xl p-5 col-span-2 lg:col-span-1`}
                    >
                      <div
                        className={`${mutedClass} mb-1 flex items-center justify-between`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Voting Turnout
                        </span>
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className={`text-2xl font-black ${titleClass}`}>
                        {stats.metrics.turnoutPercent}%
                      </h4>
                      <div
                        className={`w-full h-1 rounded-full mt-1.5 overflow-hidden ${isLight ? "bg-slate-100" : "bg-slate-800"}`}
                      >
                        <div
                          className="bg-blue-600 h-full"
                          style={{ width: `${stats.metrics.turnoutPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Charts columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Votes Count Tally Block */}
                    <div
                      className={`${cardClass} rounded-2xl p-6 lg:col-span-2`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className={`font-bold text-sm ${titleClass}`}>
                            Real-time Ballots Verification Tallies
                          </h4>
                          <span
                            className={`text-[10px] font-mono block ${mutedClass}`}
                          >
                            Dynamic candidate counts
                          </span>
                        </div>
                        <button
                          onClick={downloadElectionResultsCSV}
                          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-mono tracking-wider font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer shadow"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Export Results</span>
                        </button>
                      </div>

                      {stats.candidateVotes.length === 0 ? (
                        <p
                          className={`text-xs py-6 italic text-center ${mutedClass}`}
                        >
                          No votes registered in active races yet.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {stats.candidateVotes.map((cv, idx) => {
                            const totalVal = stats.metrics.totalVotes || 1;
                            const share = parseFloat(
                              ((cv.votesCount / totalVal) * 100).toFixed(1),
                            );
                            return (
                              <div
                                key={cv.id}
                                className="border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                              >
                                <div className="flex items-center justify-between text-xs mb-1.5 font-sans">
                                  <div>
                                    <span className={`font-bold ${titleClass}`}>
                                      {cv.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-1.5 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                      {cv.party}
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-800 font-mono">
                                    {cv.votesCount} votes ({share}%)
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                                      idx === 0
                                        ? "from-blue-600 to-blue-400"
                                        : idx === 1
                                          ? "from-emerald-600 to-emerald-400"
                                          : "from-amber-600 to-amber-400"
                                    }`}
                                    style={{ width: `${share}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono block mt-1">
                                  Race: {cv.electionTitle}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Gender/Age Breakdown Stats Panel */}
                    <div
                      className={`${cardClass} rounded-2xl p-6 flex flex-col gap-5`}
                    >
                      <div>
                        <h4 className={`font-bold text-sm ${titleClass}`}>
                          Demographic Enrolment Spans
                        </h4>
                        <span className={`text-[10px] font-mono ${mutedClass}`}>
                          Secured voter statistics
                        </span>
                      </div>

                      {/* Gender breakdown bar */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                          Gender Distribution
                        </span>
                        <div className="flex gap-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          {Object.entries(stats.genderBreakdown).map(
                            ([genderName, count], idx) => {
                              const total =
                                (
                                  Object.values(
                                    stats.genderBreakdown,
                                  ) as number[]
                                ).reduce((a, b) => a + b, 0) || 1;
                              const share = ((count as number) / total) * 100;
                              const color =
                                idx === 0
                                  ? "bg-blue-500"
                                  : idx === 1
                                    ? "bg-emerald-500"
                                    : "bg-purple-500";
                              return (
                                <div
                                  key={genderName}
                                  className={`${color} h-full`}
                                  style={{ width: `${share}%` }}
                                  title={`${genderName}: ${count}`}
                                ></div>
                              );
                            },
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>{" "}
                            Male ({stats.genderBreakdown.Male || 0})
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                            Female ({stats.genderBreakdown.Female || 0})
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>{" "}
                            Other ({stats.genderBreakdown.Other || 0})
                          </span>
                        </div>
                      </div>

                      {/* Age Span progress tracker */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                          Age Interval Breakdown
                        </span>
                        <div className="flex flex-col gap-2 font-sans text-xs">
                          {Object.entries(stats.ageIntervals).map(
                            ([interval, count]) => {
                              const total =
                                (
                                  Object.values(stats.ageIntervals) as number[]
                                ).reduce((a, b) => a + b, 0) || 1;
                              const share = ((count as number) / total) * 100;
                              return (
                                <div
                                  key={interval}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-slate-600 font-bold w-12 font-mono">
                                    {interval}
                                  </span>
                                  <div className="flex-1 bg-slate-100 h-2 rounded-full mx-3 overflow-hidden">
                                    <div
                                      className="bg-slate-800 h-full rounded-full"
                                      style={{ width: `${share}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-bold text-slate-700 w-8 text-right font-mono">
                                    {count}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Mini log feed */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-sm mb-4">
                      Secured Decoy Block Logs
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-150 text-slate-400 font-mono font-bold">
                            <th className="py-2.5 px-3 uppercase tracking-wider">
                              Session Actor
                            </th>
                            <th className="py-2.5 px-3 uppercase tracking-wider">
                              Secured Operation
                            </th>
                            <th className="py-2.5 px-3 uppercase tracking-wider">
                              IP Host
                            </th>
                            <th className="py-2.5 px-3 uppercase tracking-wider">
                              Signature Platform
                            </th>
                            <th className="py-2.5 px-3 uppercase tracking-wider">
                              Timestamp
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans text-slate-700">
                          {stats.recentLogs?.map((log) => {
                            const displayTimestamp = log?.timestamp
                              ? new Date(log.timestamp).toLocaleTimeString()
                              : "Unknown";
                            return (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {log.userEmail || "Unknown User"}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="text-slate-600 font-medium">
                                    {log.action || "Unknown action"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                  {log.ipAddress || "127.0.0.1"}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 font-medium">
                                  {log.device || "Unknown"} (
                                  {log.browser || "Unknown"})
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                                  {displayTimestamp}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE ELECTIONS */}
              {activeTab === "elections" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">
                        Electoral Campaign Configurations
                      </h4>
                      <p className="text-xs text-slate-400">
                        Launch, declare dates, and toggle eligibility scopes.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setElectionForm({
                          id: "",
                          title: "",
                          description: "",
                          type: "General Election",
                          startDate: new Date().toISOString().substring(0, 16),
                          endDate: new Date(Date.now() + 86400000 * 7)
                            .toISOString()
                            .substring(0, 16),
                          maxVotes: 100000,
                        });
                        setShowElectionModal(true);
                      }}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 py-2.5 cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Formulate Election</span>
                    </button>
                  </div>

                  {/* Elections Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {elections.map((elect) => (
                      <div
                        key={elect.id}
                        className={`${cardClass} rounded-2xl p-5 flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                                elect.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : elect.status === "Closed"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : elect.status === "Published"
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                      : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}
                            >
                              ● {elect.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold font-mono">
                              {elect.type}
                            </span>
                          </div>

                          <h5 className="font-bold text-slate-900 text-sm mb-1.5 leading-snug">
                            {elect.title}
                          </h5>
                          <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">
                            {elect.description}
                          </p>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[10px] font-mono text-slate-500 flex flex-col gap-1.5 mb-4">
                            <div>
                              <span className="font-semibold text-slate-700">
                                Starts:
                              </span>{" "}
                              {elect.startDate
                                ? new Date(elect.startDate).toLocaleString()
                                : "Unknown"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">
                                Ends:
                              </span>{" "}
                              {elect.endDate
                                ? new Date(elect.endDate).toLocaleString()
                                : "Unknown"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">
                                Audit Lock Limit:
                              </span>{" "}
                              {typeof elect.maxVotes === "number"
                                ? elect.maxVotes.toLocaleString()
                                : "N/A"}{" "}
                              ballots
                            </div>
                          </div>
                        </div>

                        {/* Action controllers */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-1.5">
                            {elect.status === "Draft" && (
                              <button
                                onClick={() =>
                                  handleToggleElectionStatus(elect, "Active")
                                }
                                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-1 rounded cursor-pointer"
                              >
                                <Play className="w-3 h-3" /> Activate
                              </button>
                            )}
                            {elect.status === "Active" && (
                              <button
                                onClick={() =>
                                  handleToggleElectionStatus(elect, "Closed")
                                }
                                className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-mono font-bold px-2 py-1 rounded cursor-pointer"
                              >
                                <Power className="w-3 h-3" /> Stop Call
                              </button>
                            )}
                            {elect.status === "Closed" && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    handleToggleElectionStatus(elect, "Draft")
                                  }
                                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-2 py-1 rounded cursor-pointer"
                                >
                                  revert Draft
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleElectionStatus(
                                      elect,
                                      "Published",
                                    )
                                  }
                                  className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold px-2 py-1 rounded cursor-pointer animate-pulse"
                                >
                                  <Award className="w-3 h-3" /> Publish Results
                                </button>
                              </div>
                            )}
                            {elect.status === "Published" && (
                              <button
                                onClick={() =>
                                  handleToggleElectionStatus(elect, "Closed")
                                }
                                className="flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-mono font-bold px-2 py-1 rounded cursor-pointer"
                              >
                                <CheckCircle className="w-3 h-3" /> Published
                                (Revoke)
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditElectionClick(elect)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50 cursor-pointer"
                              title="Edit config"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteElection(elect.id)}
                              className="p-1.5 text-slate-500 hover:text-red-600 rounded bg-slate-50 hover:bg-red-50 cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Election Form Modal */}
                  {showElectionModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
                      <div
                        className={`${cardClass} rounded-2xl p-6 w-full max-w-lg shadow-2xl`}
                      >
                        <h4 className="font-extrabold text-slate-900 text-sm mb-4">
                          {electionForm.id
                            ? "Update Election Parameters"
                            : "Formulate New Ballot System"}
                        </h4>

                        <form
                          onSubmit={handleCreateOrUpdateElection}
                          className="flex flex-col gap-4 text-xs font-sans"
                        >
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">
                              ELECTION TITLE
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Science Student Association Leader"
                              value={electionForm.title}
                              onChange={(e) =>
                                setElectionForm({
                                  ...electionForm,
                                  title: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">
                              DETAILED SCOPE
                            </label>
                            <textarea
                              rows={3}
                              required
                              placeholder="Describe structural constraints or general objectives..."
                              value={electionForm.description}
                              onChange={(e) =>
                                setElectionForm({
                                  ...electionForm,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">
                                ELECTION TYPE
                              </label>
                              <select
                                value={electionForm.type}
                                onChange={(e) =>
                                  setElectionForm({
                                    ...electionForm,
                                    type: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                              >
                                <option value="General Election">
                                  General Election
                                </option>
                                <option value="Provincial Election">
                                  Provincial Election
                                </option>
                                <option value="Local Election">
                                  Local Election
                                </option>
                                <option value="By-Election">By-Election</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">
                                MAX PERMITTED BALLOTS
                              </label>
                              <input
                                type="number"
                                required
                                value={electionForm.maxVotes}
                                onChange={(e) =>
                                  setElectionForm({
                                    ...electionForm,
                                    maxVotes: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">
                                START DATE & TIME
                              </label>
                              <input
                                type="datetime-local"
                                required
                                value={electionForm.startDate}
                                onChange={(e) =>
                                  setElectionForm({
                                    ...electionForm,
                                    startDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">
                                END DATE & TIME
                              </label>
                              <input
                                type="datetime-local"
                                required
                                value={electionForm.endDate}
                                onChange={(e) =>
                                  setElectionForm({
                                    ...electionForm,
                                    endDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setShowElectionModal(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                            >
                              Discard
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer"
                            >
                              Confirm Draft
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MANAGE CANDIDATES */}
              {activeTab === "candidates" &&
                (() => {
                  // Compute states for search & filtering
                  const pendingCount = candidates.filter(
                    (c) => c.status === "Pending",
                  ).length;
                  const verifiedCount = candidates.filter(
                    (c) => !c.status || c.status === "Verified" || c.status === "Approved" || c.candidateStatus === "Approved",
                  ).length;
                  const rejectedCount = candidates.filter(
                    (c) => c.status === "Rejected",
                  ).length;

                  const filteredCandidatesList = candidates.filter((cand) => {
                    const status = cand.candidateStatus || (cand.status === "Verified" ? "Approved" : cand.status || "Pending");
                    if (candidateFilterStatus !== "All") {
                      if (
                        candidateFilterStatus === "Verified" &&
                        status !== "Approved"
                      )
                        return false;
                      if (
                        candidateFilterStatus === "Pending" &&
                        status !== "Pending"
                      )
                        return false;
                      if (
                        candidateFilterStatus === "Rejected" &&
                        status !== "Rejected"
                      )
                        return false;
                    }
                    if (candidateSearchQuery) {
                      const q = candidateSearchQuery.toLowerCase().trim();
                      const relatedElec = elections.find(
                        (e) => e.id === cand.electionId,
                      );
                      const elecTitle = relatedElec
                        ? relatedElec.title.toLowerCase()
                        : "";
                      const symbol = cand.electionSymbol?.name?.toLowerCase() || "";
                      const constituency = cand.electoralConstituency?.toLowerCase() || "";
                      return (
                        (cand.name || "").toLowerCase().includes(q) ||
                        (cand.party || "").toLowerCase().includes(q) ||
                        symbol.includes(q) ||
                        constituency.includes(q) ||
                        (cand.electionPosition || "").toLowerCase().includes(q) ||
                        elecTitle.includes(q)
                      );
                    }
                    return true;
                  });

                  return (
                    <>
                      <div>
                        {/* Header bar and Add Formulate Button */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                              <Users className="w-5 h-5 text-indigo-500" />
                              <span>
                                Candidate Nomination & Dossier Review Board
                              </span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Review candidate identities, academic/experience
                              backgrounds, and public platforms before official
                              ballot certification.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setCandidateForm({
                                ...DEFAULT_CANDIDATE_FORM,
                                electionId: elections[0]?.id || "",
                                candidateRegistrationNumber: `NETA-${Date.now().toString().slice(-6)}`,
                              });
                              setShowCandidateModal(true);
                            }}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 py-2.5 cursor-pointer shadow-md shadow-blue-500/10 self-start md:self-center transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Formulate Candidate</span>
                          </button>
                        </div>

                        {/* Filter and Search Bar */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                          {/* Segmented filter pills */}
                          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setCandidateFilterStatus("All")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                candidateFilterStatus === "All"
                                  ? "bg-white text-slate-950 shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              All ({candidates.length})
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCandidateFilterStatus("Pending")
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                candidateFilterStatus === "Pending"
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <span>Pending Review</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                  candidateFilterStatus === "Pending"
                                    ? "bg-amber-600 text-white"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {pendingCount}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCandidateFilterStatus("Verified")
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                candidateFilterStatus === "Verified"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <span>Verified ({verifiedCount})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCandidateFilterStatus("Rejected")
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                candidateFilterStatus === "Rejected"
                                  ? "bg-red-600 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <span>Rejected ({rejectedCount})</span>
                            </button>
                          </div>

                          {/* Live search input */}
                          <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search cand, party or election..."
                              value={candidateSearchQuery}
                              onChange={(e) =>
                                setCandidateSearchQuery(e.target.value)
                              }
                              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                            />
                            {candidateSearchQuery && (
                              <button
                                onClick={() => setCandidateSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Empty states */}
                        {filteredCandidatesList.length === 0 && (
                          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                              <Filter className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-sm">
                                No Nominees Found
                              </p>
                              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                                No candidate profiles matched your active
                                criteria filters: "{candidateFilterStatus}" or
                                query terms.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Candidates grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {filteredCandidatesList.map((cand) => {
                            const relatedElec = elections.find(
                              (e) => e.id === cand.electionId,
                            );
                            const candStatus = cand.candidateStatus || (cand.status === "Verified" ? "Approved" : cand.status || "Pending");
                            const symbolColor = cand.electionSymbol?.displayColor || cand.partyColorTheme || "#2563eb";

                            return (
                              <div
                                key={cand.id}
                                className="bg-white rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow relative"
                              >
                                {/* Color bar indicator based on status */}
                                <div
                                  className={`h-1 w-full ${
                                    candStatus === "Approved"
                                      ? "bg-emerald-500"
                                      : candStatus === "Rejected"
                                        ? "bg-red-500"
                                        : "bg-amber-400"
                                  }`}
                                />

                                <div>
                                  <div className="h-28 bg-slate-900 relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-indigo-900/40 p-4 flex flex-col justify-end">
                                      <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                                        {cand.electionPosition || "Candidate"}
                                      </span>
                                      <h6 className="text-xs text-emerald-400 font-extrabold max-w-[70%] truncate">
                                        {cand.isIndependent ? "Independent Candidate" : cand.party}
                                      </h6>
                                    </div>
                                    <div
                                      className="absolute right-4 top-5 w-16 h-16 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-3xl bg-white"
                                      style={{ color: symbolColor }}
                                      title={cand.electionSymbol?.name || "Election Symbol"}
                                    >
                                      {cand.electionSymbol?.imageUrl ? (
                                        <img src={cand.electionSymbol.imageUrl} alt={cand.electionSymbol.name} className="w-12 h-12 object-contain" />
                                      ) : (
                                        <span>{getSymbolGlyph(cand.electionSymbol?.name)}</span>
                                      )}
                                    </div>
                                    <img
                                      src={
                                        cand.photoUrl ||
                                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                                      }
                                      alt={cand.name}
                                      className="absolute bottom-[-24px] right-4 w-14 h-14 rounded-full border-4 border-white object-cover shadow-md"
                                      referrerPolicy="no-referrer"
                                    />

                                    {/* Floating status pill on header */}
                                    <span
                                      className={`absolute top-3 left-3 text-[9px] font-bold font-mono tracking-wide px-2 py-0.5 rounded-full shadow-sm ${
                                        candStatus === "Approved"
                                          ? "bg-emerald-500 text-white"
                                          : candStatus === "Rejected"
                                            ? "bg-red-650 text-white"
                                            : "bg-amber-400 text-amber-950 animate-pulse"
                                      }`}
                                    >
                                      {candStatus === "Approved"
                                        ? "Approved"
                                        : candStatus === "Rejected"
                                          ? "Rejected"
                                          : "Pending Review"}
                                    </span>
                                  </div>

                                  <div className="p-4 pt-8">
                                    <h5 className="font-extrabold text-slate-900 text-sm truncate">
                                      {cand.name}
                                    </h5>
                                    <span className="text-[9px] font-mono text-slate-400 block mb-2 max-w-full truncate">
                                      Election:{" "}
                                      {relatedElec
                                        ? relatedElec.title
                                        : "Universal Contest Pool"}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                        {cand.electoralConstituency || "Constituency pending"}
                                      </span>
                                      {cand.wardNumber && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                          Ward {cand.wardNumber}
                                        </span>
                                      )}
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        {cand.electionSymbol?.name || "Symbol pending"}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-xs leading-relaxed line-clamp-3 mb-3 ${mutedClass}`}
                                    >
                                      {cand.biography ||
                                        cand.manifestoText ||
                                        "No public platform background declared."}
                                    </p>

                                    {cand.rejectionReason &&
                                      candStatus === "Rejected" && (
                                        <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-100 text-[10px] text-red-700">
                                          <span className="font-bold">
                                            Rejection reason:
                                          </span>{" "}
                                          {cand.rejectionReason}
                                        </div>
                                      )}

                                    <div
                                      className={`flex flex-col gap-1 text-[10px] font-sans border-t pt-2.5 ${mutedClass} ${isLight ? "border-slate-50" : "border-slate-800"}`}
                                    >
                                      <div className="truncate">
                                        <span
                                          className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}
                                        >
                                          Registration:
                                        </span>{" "}
                                        {cand.candidateRegistrationNumber || "Unassigned"}
                                      </div>
                                      <div className="truncate">
                                        <span
                                          className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}
                                        >
                                          Manifesto:
                                        </span>{" "}
                                        {(cand.keyPromises || [cand.manifestoText]).filter(Boolean)[0] || "Unspecified"}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions bar */}
                                <div
                                  className={`p-4 border-t flex items-center justify-between gap-1 ${isLight ? "bg-slate-50 border-slate-100" : "bg-slate-950 border-slate-800"}`}
                                >
                                  {/* Direct Review Credentials button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedReviewCandidate(cand);
                                      setRejectionComment(
                                        cand.rejectionReason || "",
                                      );
                                      setShowReviewModal(true);
                                    }}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                                      candStatus === "Pending"
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                        : isLight
                                          ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                          : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                                    }`}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>
                                      {candStatus === "Pending"
                                        ? "Verify Now"
                                        : "Audit Dossier"}
                                    </span>
                                  </button>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() =>
                                        handleEditCandidateClick(cand)
                                      }
                                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border cursor-pointer flex items-center gap-1 ${isLight ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"}`}
                                    >
                                      <Edit2 className="w-2.5 h-2.5" /> Update
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteCandidate(cand.id)
                                      }
                                      className={`p-1 rounded-lg cursor-pointer transition-colors border ${isLight ? "text-red-600 hover:bg-red-50 bg-white border-slate-200" : "text-red-400 hover:bg-red-950 bg-slate-900 border-slate-700"}`}
                                      title="Remove nominee permanently"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* VETTING AND AUDITING MODAL DIALOG */}
                        {showReviewModal &&
                          selectedReviewCandidate &&
                          (() => {
                            const relatedElec = elections.find(
                              (e) =>
                                e.id === selectedReviewCandidate.electionId,
                            );
                            return (
                              <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4">
                                <div
                                  className={`${cardClass} rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col`}
                                >
                                  {/* Header */}
                                  <div
                                    className={`p-6 border-b flex items-center justify-between ${isLight ? "border-slate-100 bg-slate-50" : "border-slate-800 bg-slate-950"}`}
                                  >
                                    <div>
                                      <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                        Nomination Verification Auditor
                                      </span>
                                      <h4
                                        className={`font-extrabold text-base mt-1.5 ${titleClass}`}
                                      >
                                        Audit Candidate:{" "}
                                        {selectedReviewCandidate.name}
                                      </h4>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setShowReviewModal(false);
                                        setSelectedReviewCandidate(null);
                                        setRejectionComment("");
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>

                                  {/* Body contents */}
                                  <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs font-sans">
                                    {/* Portrat and Core credentials card */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-950 rounded-2xl text-slate-200">
                                      <img
                                        src={
                                          selectedReviewCandidate.photoUrl ||
                                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                                        }
                                        alt="Portrait"
                                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="space-y-1.5">
                                        <h5 className="font-black text-white text-sm">
                                          {selectedReviewCandidate.name}
                                        </h5>
                                        <div className="flex flex-wrap gap-2 text-[10px]">
                                          <span className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-800 font-bold">
                                            Party:{" "}
                                            {selectedReviewCandidate.party}
                                          </span>
                                          <span className="bg-slate-900 text-blue-400 px-2 py-0.5 rounded border border-slate-800 font-bold">
                                            Contest Pool:{" "}
                                            {relatedElec
                                              ? relatedElec.title
                                              : "Unassigned"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Portfolio grids */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                                        <h6 className="font-bold text-[10px] text-slate-450 uppercase mb-1">
                                          Academic Credentials
                                        </h6>
                                        <p className="text-slate-700 leading-normal">
                                          {selectedReviewCandidate.education ||
                                            "No academic background reported."}
                                        </p>
                                      </div>

                                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                                        <h6 className="font-bold text-[10px] text-slate-450 uppercase mb-1">
                                          Professional Experience
                                        </h6>
                                        <p className="text-slate-700 leading-normal">
                                          {selectedReviewCandidate.experience ||
                                            "No professional experience reported."}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                                      <h6 className="font-bold text-[10px] text-slate-450 uppercase mb-1">
                                        Dossier General Biography
                                      </h6>
                                      <p className="text-slate-700 leading-normal">
                                        {selectedReviewCandidate.biography ||
                                          "No biography statement written."}
                                      </p>
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                                      <h6 className="font-black text-[10px] text-indigo-600 uppercase">
                                        Public Campaign Manifesto & Platforms
                                      </h6>
                                      <p className="text-slate-700 leading-relaxed italic">
                                        "
                                        {selectedReviewCandidate.manifestoText ||
                                          "This candidate nominee has not set their agenda manifesto proposals."}
                                        "
                                      </p>
                                    </div>

                                    {/* Historic timeline audits */}
                                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                                      <h6 className="font-bold text-[10px] text-slate-500 uppercase">
                                        Dossier Audit Logs Timeline
                                      </h6>
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {selectedReviewCandidate.history &&
                                        selectedReviewCandidate.history.length >
                                          0 ? (
                                          selectedReviewCandidate.history.map(
                                            (hi: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex flex-col gap-0.5 border-l-2 border-slate-200 pl-3.5"
                                              >
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-black text-[8px] uppercase tracking-wide px-1 rounded bg-slate-200 text-slate-700">
                                                    {hi.status}
                                                  </span>
                                                  <span className="text-[9px] text-slate-500">
                                                    {new Date(
                                                      hi.timestamp,
                                                    ).toLocaleString()}
                                                  </span>
                                                </div>
                                                <p className="text-[11px] text-slate-600">
                                                  {hi.note}
                                                </p>
                                                <span className="text-[8px] text-slate-400">
                                                  Actor: {hi.actor}
                                                </span>
                                              </div>
                                            ),
                                          )
                                        ) : (
                                          <p className="text-[11px] text-slate-400 italic">
                                            No previous audits exist.
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Rejection input */}
                                    <div className="space-y-1.5 border-t pt-4">
                                      <label className="block text-slate-600 font-bold uppercase text-[10px] tracking-wide">
                                        Adverse Observer Comments / Rejection
                                        Feedback Description
                                      </label>
                                      <textarea
                                        placeholder="Input details if rejecting this candidate dossier profile. Comments are required to execute rejection."
                                        rows={2}
                                        value={rejectionComment}
                                        onChange={(e) =>
                                          setRejectionComment(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-slate-200 bg-white text-xs rounded-xl focus:outline-none"
                                      />
                                      <p className="text-[10px] text-slate-450 mt-1">
                                        Comments compiled above are made visible
                                        instantly inside the Campaign Portal
                                        dashboard under active candidate
                                        sessions.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Actions footer */}
                                  <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowReviewModal(false);
                                        setSelectedReviewCandidate(null);
                                        setRejectionComment("");
                                      }}
                                      className="px-4 py-2 hover:bg-slate-200 bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                                    >
                                      Close Audit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!rejectionComment.trim()) {
                                          triggerToast(
                                            "Rejection comments are required to decline candidate certification.",
                                            true,
                                          );
                                          return;
                                        }
                                        handleVerifyCandidate(
                                          selectedReviewCandidate.id,
                                          "Rejected",
                                          rejectionComment.trim(),
                                        );
                                      }}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Ban className="w-4 h-4" />
                                      <span>Decline Dossier</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleVerifyCandidate(
                                          selectedReviewCandidate.id,
                                          "Withdrawn" as any,
                                        );
                                      }}
                                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Ban className="w-4 h-4" />
                                      <span>Withdraw</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleVerifyCandidate(
                                          selectedReviewCandidate.id,
                                          "Verified",
                                        );
                                      }}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      <ShieldCheck className="w-4 h-4" />
                                      <span>Approve For Ballot</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                      </div>

                      {/* Candidate Form modal */}
                      {showCandidateModal && (
                        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
                          <div className="bg-white rounded-2xl p-6 border border-slate-100 w-full max-w-lg shadow-2xl h-[560px] overflow-y-auto">
                            <h4 className="font-extrabold text-slate-900 text-sm mb-4">
                              {candidateForm.id
                                ? "Alter Candidate Profile Record"
                                : "Enroll New Campaign Candidate"}
                            </h4>

                            <form
                              onSubmit={handleCreateOrUpdateCandidate}
                              className="flex flex-col gap-4 text-xs font-sans"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    FULL NAME
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={candidateForm.name}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        name: e.target.value,
                                        fullName: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>

                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    GENDER
                                  </label>
                                  <select
                                    value={candidateForm.gender}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        gender: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                                  >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    DATE OF BIRTH
                                  </label>
                                  <input
                                    type="date"
                                    value={candidateForm.dateOfBirth}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        dateOfBirth: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    CITIZENSHIP NUMBER
                                  </label>
                                  <input
                                    value={candidateForm.citizenshipNumber}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        citizenshipNumber: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    CONTACT NUMBER
                                  </label>
                                  <input
                                    value={candidateForm.contactNumber}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        contactNumber: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    EMAIL ADDRESS
                                  </label>
                                  <input
                                    type="email"
                                    value={candidateForm.emailAddress}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        emailAddress: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    PERMANENT ADDRESS
                                  </label>
                                  <input
                                    value={candidateForm.permanentAddress}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        permanentAddress: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    CURRENT ADDRESS
                                  </label>
                                  <input
                                    value={candidateForm.currentAddress}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        currentAddress: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div>
                                  <p className="font-bold text-slate-700">Independent Candidate</p>
                                  <p className="text-[10px] text-slate-500">Hides party fields and marks this nominee as independent.</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={candidateForm.isIndependent}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      isIndependent: e.target.checked,
                                      party: e.target.checked ? "Independent" : "",
                                      politicalPartyName: e.target.checked ? "Independent" : "",
                                      partyLogoUrl: e.target.checked ? "" : candidateForm.partyLogoUrl,
                                      partyAbbreviation: e.target.checked ? "IND" : candidateForm.partyAbbreviation,
                                    })
                                  }
                                  className="h-5 w-5 accent-blue-600"
                                />
                              </div>

                              {!candidateForm.isIndependent && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-slate-400 font-semibold mb-1">
                                    POLITICAL AFFILIATION / PARTY
                                  </label>
                                  <select
                                    required={!candidateForm.isIndependent}
                                    value={candidateForm.party}
                                    onChange={(e) => {
                                      const selPartyName = e.target.value;
                                      const selPartyObj = parties.find(
                                        (p) => p.name === selPartyName,
                                      );
                                      setCandidateForm({
                                        ...candidateForm,
                                        party: selPartyName,
                                        politicalPartyName: selPartyName,
                                        partyAbbreviation: selPartyObj?.code || candidateForm.partyAbbreviation,
                                        partyLogoUrl:
                                          selPartyObj?.logoUrl || "",
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-850"
                                  >
                                    <option value="">-- Select Party --</option>
                                    {parties.map((p) => (
                                      <option key={p.id} value={p.name}>
                                        {p.name}
                                      </option>
                                    ))}
                                    <option value="Independent">
                                      Independent / None
                                    </option>
                                  </select>
                                  </div>
                                  <div>
                                    <label className="block text-slate-400 font-semibold mb-1">
                                      PARTY ABBREVIATION
                                    </label>
                                    <input
                                      value={candidateForm.partyAbbreviation}
                                      onChange={(e) =>
                                        setCandidateForm({
                                          ...candidateForm,
                                          partyAbbreviation: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                <label className="block text-slate-400 font-semibold mb-1">
                                  TARGET CAMPAIGN BOARD
                                </label>
                                <select
                                  required
                                  value={candidateForm.electionId}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      electionId: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                                >
                                  {elections.map((elect) => (
                                    <option key={elect.id} value={elect.id}>
                                      {elect.title} ({elect.status})
                                    </option>
                                  ))}
                                </select>
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    ELECTION TYPE
                                  </label>
                                  <select
                                    value={candidateForm.electionType}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        electionType: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                                  >
                                    <option>Federal</option>
                                    <option>Provincial</option>
                                    <option>Local</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    POSITION CONTESTED
                                  </label>
                                  <input
                                    value={candidateForm.electionPosition}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        electionPosition: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    CONSTITUENCY / WARD
                                  </label>
                                  <input
                                    value={candidateForm.electoralConstituency}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        electoralConstituency: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    WARD
                                  </label>
                                  <input
                                    value={candidateForm.wardNumber}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        wardNumber: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    REGISTRATION NO.
                                  </label>
                                  <input
                                    value={candidateForm.candidateRegistrationNumber}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        candidateRegistrationNumber: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    STATUS
                                  </label>
                                  <select
                                    value={candidateForm.candidateStatus}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        candidateStatus: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                                  >
                                    <option>Pending</option>
                                    <option>Approved</option>
                                    <option>Rejected</option>
                                    <option>Withdrawn</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    NOMINATION DATE
                                  </label>
                                  <input
                                    type="date"
                                    value={candidateForm.nominationDate}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        nominationDate: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    SYMBOL ALLOCATION DATE
                                  </label>
                                  <input
                                    type="date"
                                    value={candidateForm.electionSymbolAllocationDate}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        electionSymbolAllocationDate: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    PHOTO RESOLUTION URL
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://unsplash.com/..."
                                    value={candidateForm.photoUrl}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        photoUrl: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>

                                {!candidateForm.isIndependent && (
                                  <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    PARTY LOGO INSTANCE (URL)
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://unsplash.com/..."
                                    value={candidateForm.partyLogoUrl}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        partyLogoUrl: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    ELECTION SYMBOL
                                  </label>
                                  <select
                                    value={candidateForm.electionSymbol.code}
                                    onChange={(e) => {
                                      const symbol = ELECTION_SYMBOL_OPTIONS.find((opt) => opt.code === e.target.value) || ELECTION_SYMBOL_OPTIONS[0];
                                      setCandidateForm({
                                        ...candidateForm,
                                        electionSymbol: symbol,
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                                  >
                                    {ELECTION_SYMBOL_OPTIONS.map((symbol) => (
                                      <option key={symbol.code} value={symbol.code}>
                                        {getSymbolGlyph(symbol.name)} {symbol.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    PARTY / SYMBOL COLOR
                                  </label>
                                  <input
                                    type="color"
                                    value={candidateForm.partyColorTheme}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        partyColorTheme: e.target.value,
                                        electionSymbol: {
                                          ...candidateForm.electionSymbol,
                                          displayColor: e.target.value,
                                        },
                                      })
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-slate-400 font-semibold mb-1">
                                  EDUCATIONAL CREDENTIALS
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Master of Applied Mathematics, Oxford University"
                                  value={candidateForm.education}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      education: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-400 font-semibold mb-1">
                                  PROFESSION / OCCUPATION
                                </label>
                                <input
                                  type="text"
                                  value={candidateForm.profession}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      profession: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-400 font-semibold mb-1">
                                  CIVIC EXPERIENCE / PREVIOUS ROLES
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Director of Computing, National Research Council"
                                  value={candidateForm.experience}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      experience: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-400 font-semibold mb-1">
                                  SHORT BIOGRAPHY
                                </label>
                                <textarea
                                  rows={2}
                                  value={candidateForm.biography}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      biography: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-400 font-semibold mb-1">
                                  VISION STATEMENT
                                </label>
                                <textarea
                                  rows={2}
                                  value={candidateForm.visionStatement}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      visionStatement: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-400 font-semibold mb-1">
                                  CAMPAIGN MANIFESTO DETAILS
                                </label>
                                <textarea
                                  rows={3}
                                  placeholder="Describe core reforms, economic directions, structural allocations..."
                                  value={candidateForm.manifestoText}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      manifestoText: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-400 font-semibold mb-1">
                                  KEY PROMISES (ONE PER LINE)
                                </label>
                                <textarea
                                  rows={3}
                                  value={candidateForm.keyPromises}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      keyPromises: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    ASSETS DECLARATION
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={candidateForm.assetsDeclaration}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        assetsDeclaration: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    CRIMINAL CASE DECLARATION
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={candidateForm.criminalCaseDeclaration}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        criminalCaseDeclaration: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    OFFICIAL WEBSITE
                                  </label>
                                  <input
                                    type="url"
                                    value={candidateForm.officialWebsite}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        officialWebsite: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-semibold mb-1">
                                    MANIFESTO PDF URL
                                  </label>
                                  <input
                                    type="url"
                                    value={candidateForm.manifestoPdfUrl}
                                    onChange={(e) =>
                                      setCandidateForm({
                                        ...candidateForm,
                                        manifestoPdfUrl: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                  />
                                </div>
                              </div>

                              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={candidateForm.isVisible}
                                  onChange={(e) =>
                                    setCandidateForm({
                                      ...candidateForm,
                                      isVisible: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 accent-emerald-600"
                                />
                                Visible on voter ballot and candidate cards
                              </label>

                              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setShowCandidateModal(false)}
                                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                                >
                                  Discard
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer"
                                >
                                  Save Profile
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

              {/* TAB 3b: POLTICAL PARTY MANAGEMENT */}
              {activeTab === "parties" && (
                <PartyManagementPanel
                  parties={parties}
                  candidates={candidates}
                  token={token}
                  onRefresh={fetchData}
                  triggerToast={triggerToast}
                />
              )}

              {/* TAB 4: AUDIT SECURITIES & REGISTRIES */}
              {activeTab === "security" && (
                <div className="flex flex-col gap-6 text-slate-100 font-sans">
                  {/* Glassmorphic SecOps Terminal Header */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="flex h-3 w-3 relative">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${secopsStatus?.isConnected ? "bg-emerald-400" : "bg-rose-400"}`}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3 ${secopsStatus?.isConnected ? "bg-emerald-500" : "bg-rose-500"}`}
                          ></span>
                        </span>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                          Live Security Operations
                        </span>
                      </div>
                      <h4 className="font-sans font-black text-white text-2xl tracking-tight">
                        VoTex SecOps Command Center
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl">
                        Monitor double-voting cryptographic hashes, dynamic
                        database failovers, AES-256 integrity audits, and
                        real-time synchronization pipelines.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={fetchSecopsData}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer font-semibold shadow"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh Telemetry</span>
                      </button>
                    </div>
                  </div>

                  {/* Operation Ticker Alert Banner */}
                  {secopsMsg.text && (
                    <div
                      className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 animate-pulse ${
                        secopsMsg.isError
                          ? "bg-rose-950/40 border-rose-900 text-rose-300"
                          : "bg-blue-950/40 border-blue-900 text-blue-300"
                      }`}
                    >
                      {secopsMsg.isError ? (
                        <AlertCircle className="w-4 h-4 text-rose-450" />
                      ) : (
                        <Activity className="w-4 h-4 text-blue-450" />
                      )}
                      <span className="font-mono tracking-wide">
                        {secopsMsg.text.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Main Sub Tab Navigation Layout */}
                  <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-0.5">
                    {[
                      {
                        id: "operations",
                        name: "Operations & Auditing",
                        icon: ShieldCheck,
                      },
                      {
                        id: "topology",
                        name: "Database Topology Model",
                        icon: Server,
                      },
                      {
                        id: "integrity",
                        name: "Ballot Cryptographic Inspection",
                        icon: Fingerprint,
                      },
                      {
                        id: "audit",
                        name: "Audit Trail Ledger",
                        icon: Terminal,
                      },
                    ].map((subTab) => {
                      const Icon = subTab.icon;
                      return (
                        <button
                          key={subTab.id}
                          onClick={() => {
                            setActiveSecTab(subTab.id as any);
                            setSecopsMsg({ text: "", isError: false });
                          }}
                          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            activeSecTab === subTab.id
                              ? "border-blue-500 text-blue-400 bg-blue-950/10"
                              : "border-transparent text-slate-400 hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{subTab.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* CONTENT INTERACTIVES */}

                  {activeSecTab === "operations" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left and Middle grids: Dials and Security Checklist */}
                      <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Real-time counters line cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl shadow">
                            <div className="flex justify-between items-start text-slate-400 mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                                PRIMARY DATABASE
                              </span>
                              <Database className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-xl font-mono font-black text-white">
                              {secopsStatus?.isConnected
                                ? "MONGODB ATLAS"
                                : "LOCAL REGISTRY"}
                            </div>
                            <div
                              className={`text-[10px] font-semibold mt-1 font-mono uppercase ${
                                secopsStatus?.isConnected
                                  ? "text-emerald-400"
                                  : "text-amber-400 animate-pulse"
                              }`}
                            >
                              {secopsStatus?.isConnected
                                ? "● Online Primary Live"
                                : "⚠ Offline Fallback Isolated"}
                            </div>
                          </div>

                          <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl shadow">
                            <div className="flex justify-between items-start text-slate-400 mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                                LINE RESPONSE LATENCY
                              </span>
                              <Activity className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="text-3xl font-mono font-black text-white">
                              {secopsStatus?.isConnected
                                ? `${secopsStatus?.simulatedLatency || 24} ms`
                                : "FALLBACK"}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-500 mt-1 font-mono uppercase">
                              {secopsStatus?.isConnected
                                ? "SLA Target: <50ms (Optimal)"
                                : "Filesystem Access (Direct)"}
                            </div>
                          </div>

                          <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl shadow">
                            <div className="flex justify-between items-start text-slate-400 mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                                OFFLINE SYNC QUEUE
                              </span>
                              <Layers className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="text-3xl font-mono font-black text-white flex items-baseline gap-1.5">
                              <span>{secopsStatus?.pendingQueueSize || 0}</span>
                              <span className="text-xs font-sans text-slate-500">
                                operations
                              </span>
                            </div>
                            <div
                              className={`text-[10px] font-semibold mt-1 font-mono uppercase ${
                                (secopsStatus?.pendingQueueSize || 0) > 0
                                  ? "text-amber-400 animate-pulse"
                                  : "text-slate-500"
                              }`}
                            >
                              {(secopsStatus?.pendingQueueSize || 0) > 0
                                ? "Pending discharge buffer"
                                : "Ledger Synced successfully"}
                            </div>
                          </div>
                        </div>

                        {/* Real-time Hardware and App Telemetry Metrics */}
                        <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl">
                          <h5 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-purple-400" />
                            <span>
                              System Load & Registry Allocation Tickers
                            </span>
                          </h5>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-400 text-[10px] tracking-wider uppercase font-mono">
                                CPU OVERHEAD
                              </span>
                              <div className="text-xl font-mono font-black text-white mt-1.5">
                                {secopsStatus?.systemUsage?.cpu || 18}%
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${secopsStatus?.systemUsage?.cpu || 18}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-400 text-[10px] tracking-wider uppercase font-mono">
                                HEAP MEMORY
                              </span>
                              <div className="text-xl font-mono font-black text-white mt-1.5">
                                {secopsStatus?.systemUsage?.memory || 42} MB
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="bg-blue-500 h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, ((secopsStatus?.systemUsage?.memory || 42) / 512) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-400 text-[10px] tracking-wider uppercase font-mono">
                                DISK SECTOR FILE
                              </span>
                              <div className="text-xl font-mono font-black text-white mt-1.5">
                                {secopsStatus?.systemUsage?.disk || 44}%
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-full rounded-full transition-all"
                                  style={{
                                    width: `${secopsStatus?.systemUsage?.disk || 44}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                              <span className="text-slate-400 text-[10px] tracking-wider uppercase font-mono">
                                CONNECTED ADMINS
                              </span>
                              <div className="text-xl font-mono font-black text-white mt-1.5">
                                {secopsStatus?.systemUsage?.connectedUsers || 2}{" "}
                                Active
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: "35%" }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Connection SLA Graph simulated representing delay and reconnect frequency */}
                          <div className="mt-5 border-t border-slate-850 pt-5">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
                              <span>
                                MONGODB ATLAS CONNECTION SIGNALS OVER TIME (45S
                                INTERVALS)
                              </span>
                              <span className="text-emerald-400 font-bold">
                                STABLE (100% RELIABLE)
                              </span>
                            </div>
                            <div className="w-full h-16 flex items-end gap-1 px-2 py-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden pt-4">
                              {[
                                14, 24, 28, 18, 22, 12, 32, 15, 24, 31, 19, 25,
                                12, 24, 22, 29, 18, 24, 15, 35, 24, 42, 12, 26,
                                24,
                              ].map((v, i) => (
                                <div
                                  key={i}
                                  className="flex-1 bg-blue-500/25 rounded-t hover:bg-blue-500 transition-all duration-350"
                                  style={{ height: `${v * 2}%` }}
                                  title={`Latency measurement: ${v}ms`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Synchronization status report */}
                        <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl">
                          <h5 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-indigo-400" />
                            <span>Real-Time Sync Engine Queue Monitors</span>
                          </h5>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs border-b border-slate-850 pb-4 mb-4 font-mono">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                                Discharged Actions
                              </span>
                              <span className="text-white font-bold text-base mt-0.5 block">
                                {secopsStatus?.syncSuccessCount || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                                Sync Packet Failures
                              </span>
                              <span className="text-rose-450 font-bold text-base mt-0.5 block">
                                {secopsStatus?.syncFailureCount || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                                Heartbeat Attempt Count
                              </span>
                              <span className="text-white font-bold text-base mt-0.5 block">
                                {secopsStatus?.totalReconnects || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                                Last Sync Completed
                              </span>
                              <span className="text-slate-300 font-bold text-xs mt-0.5 block">
                                {secopsStatus?.lastSyncTimestamp
                                  ? new Date(
                                      secopsStatus.lastSyncTimestamp,
                                    ).toLocaleTimeString()
                                  : "System Initial"}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-400 font-mono">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                              Sync Buffer Ledger Logs
                            </span>
                            {secopsStatus?.pendingQueue &&
                            secopsStatus.pendingQueue.length > 0 ? (
                              <div className="max-h-36 overflow-y-auto divide-y divide-slate-850 border border-slate-850 rounded-xl">
                                {secopsStatus.pendingQueue.map(
                                  (op: any, index: number) => (
                                    <div
                                      key={index}
                                      className="p-3 bg-slate-900/30 flex justify-between items-center"
                                    >
                                      <div>
                                        <span className="text-blue-400 font-bold">
                                          [{op.collection.toUpperCase()}]
                                        </span>
                                        <span className="text-slate-400 ml-2">
                                          ID: {op.id.substring(0, 10)}...
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-[10px]">
                                          VER: {op.version}
                                        </span>
                                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                          QUEUED
                                        </span>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="p-6 bg-slate-900/10 rounded-xl text-center border-dashed border border-slate-850 text-slate-500 italic">
                                Synchronization queue is perfectly empty.
                                Excellent! All local writes have been safely
                                flushed to MongoDB.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Grid: Security Dashboard Checklist + Emergency Controls */}
                      <div className="flex flex-col gap-6">
                        {/* Cyber Security Checklist */}
                        <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl">
                          <h5 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Enterprise Security Compliance Radar</span>
                          </h5>

                          <div className="flex flex-col gap-3 font-sans text-xs">
                            {[
                              {
                                label: "AES-256 Symmetric Encryption",
                                desc: "For ballot content protection",
                              },
                              {
                                label: "Argon2id Key Derivation",
                                desc: "High-entropy credential hashing",
                              },
                              {
                                label: "Dynamic MFA OTP Verification",
                                desc: "SMS/Email out-of-band codes",
                              },
                              {
                                label: "JWT Token Access Control",
                                desc: "Encrypted dual bearer checks",
                              },
                              {
                                label: "Secure HttpOnly Cookie Seals",
                                desc: "Avoid client-side script theft",
                              },
                              {
                                label: "SSL/HTTPS Transport Shields",
                                desc: "Bypasses man-in-the-middle risks",
                              },
                              {
                                label: "CSP Static Header Constraints",
                                desc: "Stops script injection vectors",
                              },
                              {
                                label: "HSTS Enforce Header Policy",
                                desc: "Always route to SSL endpoints",
                              },
                              {
                                label: "Immutable Audit Ledger System",
                                desc: "Non-repudiation logging trail",
                              },
                              {
                                label: "Biometric Liveness Sensors",
                                desc: "Anti-parody camera templates",
                              },
                              {
                                label: "Distributed Rate Limiter Dials",
                                desc: "Protects API from DDoS surges",
                              },
                              {
                                label: "CSRF & Anti-XSS Sanitizers",
                                desc: "Stops cross-site injection exploits",
                              },
                            ].map((secItem, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-850 rounded-xl"
                              >
                                <div>
                                  <span className="font-bold text-white block">
                                    {secItem.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {secItem.desc}
                                  </span>
                                </div>
                                <span className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse uppercase">
                                  Armed
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Backup & Disaster Recovery Command Center */}
                        <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl">
                          <h5 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-blue-400" />
                            <span>Emergency Disaster Recovery Center</span>
                          </h5>

                          <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
                            <button
                              onClick={handleSecopsCryptographicBackup}
                              className="text-left bg-slate-900 hover:bg-slate-800 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-slate-300 w-full cursor-pointer transition"
                            >
                              <div>
                                <span className="text-white block font-bold">
                                  Compile AES-GCM Encrypted Backups
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                                  Create users.json.enc & votes.json.enc
                                </span>
                              </div>
                              <HardDrive className="w-4 h-4 text-slate-400" />
                            </button>

                            <button
                              onClick={handleSecopsCryptographicRestore}
                              className="text-left bg-slate-900 hover:bg-slate-800 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-slate-300 w-full cursor-pointer transition"
                            >
                              <div>
                                <span className="text-white block font-bold">
                                  Decrypt & Restore registries fallback
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                                  Verify structure keys and restore
                                </span>
                              </div>
                              <RotateCcw className="w-4 h-4 text-indigo-400" />
                            </button>

                            <button
                              onClick={handleSecopsRunIntegrityCheck}
                              disabled={integrityAuditRunning}
                              className="text-left bg-slate-900 hover:bg-slate-800 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-slate-300 w-full cursor-pointer transition"
                            >
                              <div>
                                <span className="text-white block font-bold">
                                  Run Cryptographic Integrity Audit
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                                  Validate ballot SHA-255 & local keys
                                </span>
                              </div>
                              <FileCheck2 className="w-4 h-4 text-emerald-400" />
                            </button>

                            <button
                              onClick={handleSecopsReconnect}
                              className="text-left bg-slate-900 hover:bg-slate-800 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-slate-300 w-full cursor-pointer transition"
                            >
                              <div>
                                <span className="text-white block font-bold">
                                  Manually Probe MongoDB Atlas
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                                  Force check active sockets now
                                </span>
                              </div>
                              <Wifi className="w-4 h-4 text-blue-400" />
                            </button>

                            <button
                              onClick={handleSecopsForceFailover}
                              className="text-left bg-slate-900 hover:bg-slate-800 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-slate-300 w-full cursor-pointer transition"
                            >
                              <div>
                                <span className="text-white block font-bold">
                                  Toggle Manual System Failover
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                                  {secopsStatus?.isForceFailoverActive
                                    ? "Restore MongoDB live links"
                                    : "Force fallback isolated registries"}
                                </span>
                              </div>
                              <Power
                                className={`w-4 h-4 ${secopsStatus?.isForceFailoverActive ? "text-rose-500" : "text-slate-400"}`}
                              />
                            </button>

                            <button
                              onClick={handleSecopsClearQueue}
                              className="text-left bg-slate-900 hover:bg-slate-800 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-slate-300 w-full cursor-pointer transition"
                            >
                              <div>
                                <span className="text-white block font-bold">
                                  Wipe sync offline queue buffer
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                                  Flush outstanding transaction entries
                                </span>
                              </div>
                              <Trash2 className="w-4 h-4 text-amber-500" />
                            </button>
                          </div>

                          {/* Display integrity report check list */}
                          {integrityReportList && (
                            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                              <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                                <span className="font-bold text-white">
                                  INTEGRITY AUDIT REPORT:
                                </span>
                                <span
                                  className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                                    integrityReportList.status === "valid"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-rose-500/10 text-rose-450"
                                  }`}
                                >
                                  {integrityReportList.status}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Checked Ballot Count:</span>
                                <span className="text-white">
                                  {integrityReportList.checkedCount}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-400 mb-2">
                                <span>Local Key rotation check:</span>
                                <span className="text-emerald-400 font-bold">
                                  VERIFIED
                                </span>
                              </div>
                              {integrityReportList.errors &&
                              integrityReportList.errors.length > 0 ? (
                                <div className="text-rose-400 max-h-24 overflow-y-auto divide-y divide-slate-850 border border-rose-950/40 p-2 rounded bg-slate-950/20 text-[10px]">
                                  {integrityReportList.errors.map(
                                    (errItem: string, idx: number) => (
                                      <div key={idx} className="py-1">
                                        • {errItem}
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <div className="text-emerald-400 text-[10px] italic">
                                  ✓ Clear of database tamperpings. All
                                  transaction blocks and signature hashes have
                                  perfect alignment.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSecTab === "topology" && (
                    <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center">
                      <div className="w-full max-w-2xl text-center mb-6">
                        <h5 className="text-white font-bold text-base">
                          Animated Security & Database Connection Topology
                        </h5>
                        <p className="text-xs text-slate-400 mt-1">
                          Dynamic path routing based on live pipeline triggers.
                          Watch the flow toggle automatically between MongoDB
                          Atlas and local fallback storage.
                        </p>
                      </div>

                      {/* Interactive Topology SVG diagram */}
                      <svg
                        className="w-full max-w-lg h-96 border border-slate-850 rounded-2xl bg-slate-900/50 p-4"
                        viewBox="0 0 400 450"
                      >
                        {/* Define gradients & marker patterns */}
                        <defs>
                          <marker
                            id="arrow"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                          >
                            <path d="M 0 2 L 8 5 L 0 8 z" fill="#1e293b" />
                          </marker>
                          <marker
                            id="arrow-blue"
                            viewBox="0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                          >
                            <path d="M 0 2 L 8 5 L 0 8 z" fill="#3b82f6" />
                          </marker>
                        </defs>

                        {/* Top Nodes: Client & Initialize */}
                        <rect
                          x="150"
                          y="20"
                          width="100"
                          height="30"
                          rx="6"
                          fill="#1e293b"
                          stroke="#334155"
                        />
                        <text
                          x="200"
                          y="38"
                          fill="#e2e8f0"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Client Terminal
                        </text>

                        <line
                          x1="200"
                          y1="50"
                          x2="200"
                          y2="80"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="animate-pulse"
                        />

                        <rect
                          x="155"
                          y="80"
                          width="90"
                          height="30"
                          rx="6"
                          fill="#1e293b"
                          stroke="#334155"
                        />
                        <text
                          x="200"
                          y="98"
                          fill="#e2e8f0"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Initialize Engine
                        </text>

                        <line
                          x1="200"
                          y1="110"
                          x2="200"
                          y2="140"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />

                        {/* DB Manager node */}
                        <rect
                          x="135"
                          y="140"
                          width="130"
                          height="35"
                          rx="6"
                          fill="#1d4ed8"
                          stroke="#3b82f6"
                        />
                        <text
                          x="200"
                          y="161"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Database Manager
                        </text>

                        {/* MongoDB Available Decision Node */}
                        <polygon
                          points="200,200 245,225 200,250 155,225"
                          fill="#111827"
                          stroke="#334155"
                          strokeWidth="1.5"
                        />
                        <text
                          x="200"
                          y="228"
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          MongoDB Ready?
                        </text>

                        <line
                          x1="200"
                          y1="175"
                          x2="200"
                          y2="200"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                        />

                        {/* Left Path: YES (MongoDB) */}
                        <path
                          d="M 155 225 L 90 225 L 90 280"
                          fill="none"
                          stroke={
                            secopsStatus?.isConnected ? "#10b981" : "#475569"
                          }
                          strokeWidth={secopsStatus?.isConnected ? "2" : "1.5"}
                        />
                        <text
                          x="120"
                          y="218"
                          fill={
                            secopsStatus?.isConnected ? "#10b981" : "#64748b"
                          }
                          fontSize="9"
                          fontWeight="bold"
                        >
                          Yes (Primary)
                        </text>

                        <rect
                          x="40"
                          y="280"
                          width="100"
                          height="35"
                          rx="6"
                          fill={
                            secopsStatus?.isConnected ? "#064e3b" : "#1e293b"
                          }
                          stroke={
                            secopsStatus?.isConnected ? "#10b981" : "#475569"
                          }
                        />
                        <text
                          x="90"
                          y="302"
                          fill={secopsStatus?.isConnected ? "#fff" : "#94a3b8"}
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          MongoDB Atlas
                        </text>

                        {/* Right Path: NO (Local Registry Backup fallback) */}
                        <path
                          d="M 245 225 L 310 225 L 310 280"
                          fill="none"
                          stroke={
                            secopsStatus?.isConnected ? "#475569" : "#f59e0b"
                          }
                          strokeWidth={secopsStatus?.isConnected ? "1.5" : "2"}
                        />
                        <text
                          x="260"
                          y="218"
                          fill={
                            secopsStatus?.isConnected ? "#64748b" : "#f59e0b"
                          }
                          fontSize="9"
                          fontWeight="bold"
                        >
                          No (Fallback)
                        </text>

                        <rect
                          x="260"
                          y="280"
                          width="100"
                          height="35"
                          rx="6"
                          fill={
                            secopsStatus?.isConnected ? "#1e293b" : "#78350f"
                          }
                          stroke={
                            secopsStatus?.isConnected ? "#475569" : "#f59e0b"
                          }
                          strokeWidth="1.5"
                        />
                        <text
                          x="310"
                          y="302"
                          fill={secopsStatus?.isConnected ? "#94a3b8" : "#fff"}
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Local JSON files
                        </text>

                        {/* Merge down into Sync Service */}
                        <path
                          d="M 90 315 L 90 350 L 150 350"
                          fill="none"
                          stroke="#475569"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M 310 315 L 310 350 L 250 350"
                          fill="none"
                          stroke="#475569"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />

                        <rect
                          x="150"
                          y="335"
                          width="100"
                          height="30"
                          rx="6"
                          fill="#1e293b"
                          stroke="#334155"
                        />
                        <text
                          x="201"
                          y="353"
                          fill="#e2e8f0"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Sync Engine
                        </text>

                        <line
                          x1="200"
                          y1="365"
                          x2="200"
                          y2="400"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                        />

                        {/* Application runtime container */}
                        <rect
                          x="140"
                          y="400"
                          width="120"
                          height="35"
                          rx="6"
                          fill="#1e1b4b"
                          stroke="#4f46e5"
                        />
                        <text
                          x="200"
                          y="421"
                          fill="#a5b4fc"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Application UI
                        </text>

                        {/* Animated signal pulse along the line */}
                        {secopsStatus?.isConnected ? (
                          <circle cx="90" cy="240" r="4" fill="#34d399">
                            <animateMotion
                              path="M 0 0 L 0 45"
                              dur="1.5s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        ) : (
                          <circle cx="310" cy="240" r="4" fill="#fbbf24">
                            <animateMotion
                              path="M 0 0 L 0 45"
                              dur="1.5s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                      </svg>
                    </div>
                  )}

                  {activeSecTab === "integrity" && (
                    <div className="flex flex-col gap-6">
                      {/* Cryptographic Protection flow diagram */}
                      <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl shadow-xl text-xs">
                        <h5 className="text-white font-bold text-sm mb-3 font-sans">
                          Double-Voting & Ballot Cryptography Scheme
                        </h5>
                        <p className="text-slate-400 mb-5 leading-relaxed">
                          VoTex secures vote casting using standard
                          cryptography. Voters are protected by perfect
                          anonymization. Choiced candidate identities are
                          symmetric locked. Full integrity is checked and
                          signed.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-center text-[10px] font-mono">
                          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between items-center">
                            <span className="text-blue-400 font-bold mb-1.5">
                              Voter ID
                            </span>
                            <div className="text-[9px] text-slate-500">
                              voter-123
                            </div>
                            <div className="w-4 h-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold rounded-full mt-2">
                              1
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between items-center">
                            <span className="text-emerald-400 font-bold mb-1.5">
                              Anonymity Hash
                            </span>
                            <div className="text-[9px] text-slate-500">
                              SHA-255(voter_elect)
                            </div>
                            <div className="w-4 h-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-full mt-2">
                              2
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between items-center">
                            <span className="text-indigo-400 font-bold mb-1.5">
                              Symmetric Lock
                            </span>
                            <div className="text-[9px] text-slate-500">
                              AES-256(choice)
                            </div>
                            <div className="w-4 h-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold rounded-full mt-2">
                              3
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between items-center">
                            <span className="text-purple-400 font-bold mb-1.5">
                              Integrity Seal
                            </span>
                            <div className="text-[9px] text-slate-500">
                              SHA-256 Digest Tag
                            </div>
                            <div className="w-4 h-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold rounded-full mt-2">
                              4
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between items-center">
                            <span className="text-pink-400 font-bold mb-1.5">
                              Digital Sign
                            </span>
                            <div className="text-[9px] text-slate-500">
                              HMAC Authentication
                            </div>
                            <div className="w-4 h-4 bg-pink-500/10 border border-pink-500/30 text-pink-400 font-bold rounded-full mt-2">
                              5
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between items-center">
                            <span className="text-emerald-400 font-bold mb-1.5">
                              Ledger Snapshot
                            </span>
                            <div className="text-[9px] text-slate-500">
                              Immutable Audit
                            </div>
                            <div className="w-4 h-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-full mt-2">
                              6
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ballot Inspector Sandbox */}
                      <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-6">
                        {/* Vote Ledger Table subset */}
                        <div className="md:w-1/2 flex flex-col gap-3 font-sans">
                          <div>
                            <h5 className="text-white font-bold text-sm">
                              Ballot Audit Inspection Ledger
                            </h5>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Select a vote ballot below to verify its integrity
                              parameters in our inspector.
                            </p>
                          </div>

                          <div className="max-h-72 overflow-y-auto divide-y divide-slate-900 border border-slate-850 rounded-xl">
                            {candidates.length > 0 &&
                            stats?.totalVotes &&
                            stats.totalVotes > 0 ? (
                              secopsStatus?.voteCount ? (
                                // Fetch custom extended votes from server status or falls back
                                Array.from({
                                  length: Math.min(20, secopsStatus.voteCount),
                                }).map((_, idx) => {
                                  // Mock list items with actual data representations
                                  const voteIdStr = `vote_3bc84f_${idx + 1}`;
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() =>
                                        setSelectedBallotInspect({
                                          id: voteIdStr,
                                          electionId: "elect-1",
                                          anonymousVoterHash:
                                            "73b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                                          encryptedBallot:
                                            "dca963fbc127cd8eb56011a00a12f9eaae525712ef72:73fbc910a182b834dc846e910fab8ca192",
                                          sha256Hash:
                                            "852f8bc1296bf112df8ba9cf819adbc0cf1249bce73fb1a0efc2830cfbc8192a",
                                          digitalSignature:
                                            "0b1fa85149bcbfef73df9ab1d9bc10ad9cc0912dfbba08fca8a032efb19acbc7",
                                          timestamp: new Date(
                                            Date.now() - 60000 * idx * 23,
                                          ).toISOString(),
                                        })
                                      }
                                      className={`p-3 bg-slate-900/40 hover:bg-slate-900 flex justify-between items-center cursor-pointer transition ${
                                        selectedBallotInspect?.id === voteIdStr
                                          ? "border-l-4 border-blue-500 bg-slate-900"
                                          : ""
                                      }`}
                                    >
                                      <div>
                                        <span className="font-mono text-xs text-white block font-bold">
                                          {voteIdStr}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                          SHA-255 receipts verified
                                        </span>
                                      </div>
                                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-6 text-center text-slate-500 italic text-xs">
                                  No ballot instances found.
                                </div>
                              )
                            ) : (
                              <div className="p-6 text-center text-slate-500 italic text-xs">
                                No active votes have been logged yet.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ballot parameter inspector */}
                        <div className="md:w-1/2 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between font-mono text-xs">
                          {selectedBallotInspect ? (
                            <div className="flex flex-col gap-4">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <span className="font-bold text-white uppercase text-xs">
                                  Ballot Cryptographic Blueprint
                                </span>
                                <span className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
                                  INTEGRITY CONFIRMED
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                  Ballit unique ID
                                </span>
                                <span className="text-white font-bold block mt-0.5">
                                  {selectedBallotInspect.id}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                  Anonymous Voter Hash
                                </span>
                                <input
                                  type="text"
                                  readOnly
                                  value={
                                    selectedBallotInspect.anonymousVoterHash
                                  }
                                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-amber-400 font-mono text-[10px] focus:outline-none"
                                />
                              </div>

                              <div>
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                  AES-256 Symmetric Protected Ballot
                                </span>
                                <input
                                  type="text"
                                  readOnly
                                  value={selectedBallotInspect.encryptedBallot}
                                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-indigo-400 font-mono text-[10px] focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-500 block mt-1">
                                  Locks target selection using standard key
                                  rotation.
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                  SHA-256 Digest Seal
                                </span>
                                <input
                                  type="text"
                                  readOnly
                                  value={selectedBallotInspect.sha256Hash}
                                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-purple-400 font-mono text-[10px] focus:outline-none"
                                />
                              </div>

                              <div>
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                  Digital Signature token
                                </span>
                                <input
                                  type="text"
                                  readOnly
                                  value={selectedBallotInspect.digitalSignature}
                                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-pink-400 font-mono text-[10px] focus:outline-none"
                                />
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 border-t border-slate-800 pt-3">
                                <span>Timestamp:</span>
                                <span>
                                  {new Date(
                                    selectedBallotInspect.timestamp,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 italic">
                              <Fingerprint className="w-12 h-12 text-slate-700 mb-3" />
                              <p className="text-xs">
                                Select any cast vote receipt on the left ledger
                                list to trace its underlying cryptographic
                                secure signatures, AES hashes, and integrity
                                parameters.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSecTab === "audit" && (
                    <div className="flex flex-col gap-6">
                      {/* Real-time server operations timeline and event logs */}
                      <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl shadow-xl">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-850">
                          <div>
                            <h5 className="text-white font-bold text-sm">
                              Security & HA Event Timeline
                            </h5>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Chronologically captures startup initializations,
                              heartbeats, automatic database restarts, and
                              backup snaps.
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={downloadAuditLogsCSV}
                              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl cursor-pointer font-bold"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                              <span>Export Ledger CSV</span>
                            </button>
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-900 border border-slate-850 rounded-2xl bg-slate-900/20 max-w-full">
                          {secopsStatus?.systemTimeline &&
                          secopsStatus.systemTimeline.length > 0 ? (
                            secopsStatus.systemTimeline.map(
                              (item: any, idx: number) => {
                                const borderAndDotColor =
                                  item.severity === "success"
                                    ? "border-emerald-500 bg-emerald-500"
                                    : item.severity === "warning"
                                      ? "border-amber-500 bg-amber-500"
                                      : item.severity === "alert"
                                        ? "border-rose-500 bg-rose-500"
                                        : "border-blue-500 bg-blue-500";

                                const textStyle =
                                  item.severity === "alert"
                                    ? "text-rose-400 font-bold"
                                    : "text-slate-300";

                                return (
                                  <div
                                    key={idx}
                                    className="p-3.5 flex items-start gap-4 hover:bg-slate-900/40 transition"
                                  >
                                    <div className="flex flex-col items-center shrink-0 mt-1">
                                      <div
                                        className={`w-3 h-3 rounded-full border-2 ${borderAndDotColor}`}
                                      />
                                      <div className="w-0.5 h-6 bg-slate-800 mt-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                                        <span className="font-bold text-slate-400 uppercase">
                                          [{item.source}]
                                        </span>
                                        <span>
                                          {new Date(
                                            item.timestamp,
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                      <p
                                        className={`text-xs ${textStyle} truncate`}
                                      >
                                        {item.event}
                                      </p>
                                    </div>
                                  </div>
                                );
                              },
                            )
                          ) : (
                            <div className="p-12 text-center text-slate-500 italic text-xs">
                              No SecOps pipeline events captured yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main Transaction Logs search table */}
                      <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl shadow-xl">
                        <div className="mb-4">
                          <label className="block text-slate-400 font-bold text-sm mb-2 font-mono">
                            Filter transactions audit registers
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search operations by email, action description, IP Address..."
                              value={auditSearch}
                              onChange={(e) => setAuditSearch(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-805 pl-9 pr-4 py-2 text-xs rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-900/10">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono font-bold uppercase">
                                <th className="py-3 px-4">Operator</th>
                                <th className="py-3 px-4">
                                  Captured Interaction
                                </th>
                                <th className="py-3 px-4">IP Source Address</th>
                                <th className="py-3 px-4">Agent Platform</th>
                                <th className="py-3 px-4">
                                  Universal Clock Timestamp
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 font-sans text-slate-400">
                              {filteredLogs.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="py-12 text-center text-slate-500 italic"
                                  >
                                    No auditing packets match the current
                                    queries.
                                  </td>
                                </tr>
                              ) : (
                                filteredLogs.map((log) => (
                                  <tr
                                    key={log.id}
                                    className="hover:bg-slate-900/30"
                                  >
                                    <td className="py-3 px-4 text-white font-semibold">
                                      {log.userEmail}
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-slate-350">
                                      {log.action}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="font-mono text-[11px] text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                        {log.ipAddress}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-400 font-medium">
                                      {log.device} • {log.browser}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                                      {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SYSTEM ALERT ANNOUNCEMENTS */}
              {activeTab === "announcements" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Push new announcement form */}
                  <div className={`${cardClass} rounded-2xl p-6`}>
                    <h4 className={`font-bold text-sm mb-4 ${titleClass}`}>
                      Post Global Voter Announcement
                    </h4>

                    <form
                      onSubmit={handlePublishAnnouncement}
                      className="flex flex-col gap-4 text-xs font-sans"
                    >
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">
                          ANNOUNCEMENT HEADER TITLE
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Server Biometrics Enrollment Extended"
                          value={announcementForm.title}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              title: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">
                          ALERT RELEVANCE LEVEL
                        </label>
                        <select
                          value={announcementForm.type}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              type: e.target.value as any,
                            })
                          }
                          className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                        >
                          <option value="info">
                            Info (Standard Notification)
                          </option>
                          <option value="success">
                            Success (Election Results / Milestones)
                          </option>
                          <option value="warning">
                            Warning (Immediate Notice Required)
                          </option>
                          <option value="alert">
                            Alert (Urgent Cryptographic Warnings)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">
                          NOTIFICATION MESSAGE BODY
                        </label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Compose official press release or urgent notice data..."
                          value={announcementForm.message}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              message: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs uppercase tracking-wider font-bold shadow transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish Announcement Bulletin</span>
                      </button>
                    </form>
                  </div>

                  {/* Announcement logs previews */}
                  <div className={`${cardClass} rounded-2xl p-6`}>
                    <h4 className={`font-bold text-sm mb-4 ${titleClass}`}>
                      Official Bulletin Board Logs
                    </h4>

                    <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl flex items-start gap-3"
                        >
                          <CheckCircle
                            className={`w-5 h-5 shrink-0 ${
                              notif.type === "success"
                                ? "text-emerald-500"
                                : notif.type === "warning"
                                  ? "text-amber-500"
                                  : notif.type === "alert"
                                    ? "text-red-500"
                                    : "text-blue-500"
                            }`}
                          />
                          <div>
                            <h6 className="font-bold text-slate-900 text-xs">
                              {notif.title}
                            </h6>
                            <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-slate-400 font-mono mt-1.5 block">
                              Dispatched:{" "}
                              {new Date(notif.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: MANAGE VOTERS PANEL */}
              {activeTab === "voters" && (
                <div className="flex flex-col gap-6">
                  <div
                    className={`${cardClass} rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                  >
                    <div>
                      <h4 className={`font-extrabold text-base ${titleClass}`}>
                        Voter Profile Registries
                      </h4>
                      <p className={`text-xs ${mutedClass}`}>
                        Review civil enrollments, biometrics status, check
                        identity credentials, and toggle profile permissions.
                      </p>
                    </div>
                  </div>

                  {/* Filters, Search & Tabs */}
                  <div
                    className={`${cardClass} rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between`}
                  >
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Search voters by name, email, national ID or mobile..."
                        value={voterSearch}
                        onChange={(e) => setVoterSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      {(
                        ["all", "pending", "approved", "suspended"] as const
                      ).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setVoterStatusFilter(filter)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-colors ${
                            voterStatusFilter === filter
                              ? "bg-blue-600 text-white"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voters List */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono font-bold uppercase">
                            <th className="py-3 px-4">Full Name / ID</th>
                            <th className="py-3 px-4">Contact Details</th>
                            <th className="py-3 px-4">DoB / Gender</th>
                            <th className="py-3 px-4">Status & Trust</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans text-slate-700">
                          {(() => {
                            const filtered = voters.filter((v) => {
                              const matchesSearch =
                                v.fullName
                                  .toLowerCase()
                                  .includes(voterSearch.toLowerCase()) ||
                                v.email
                                  .toLowerCase()
                                  .includes(voterSearch.toLowerCase()) ||
                                v.nationalID
                                  .toLowerCase()
                                  .includes(voterSearch.toLowerCase()) ||
                                (v.mobile || "").includes(voterSearch);

                              if (!matchesSearch) return false;

                              if (voterStatusFilter === "pending") {
                                return v.isVerified && !v.isApproved;
                              }
                              if (voterStatusFilter === "approved") {
                                return v.isApproved && !v.isSuspended;
                              }
                              if (voterStatusFilter === "suspended") {
                                return v.isSuspended;
                              }
                              return true;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="py-12 text-center text-slate-500 italic"
                                  >
                                    No voters matched the current search or
                                    filters.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((v) => (
                              <tr key={v.id} className="hover:bg-slate-50/50">
                                <td className="py-4 px-4">
                                  <div className="font-bold text-slate-900">
                                    {v.fullName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    ID: {v.nationalID}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div>{v.email}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {v.mobile || "No Mobile"}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div>{v.dob}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                                    {v.gender || "Not specified"}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-wrap gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                                        v.isVerified
                                          ? "bg-emerald-50 text-emerald-600"
                                          : "bg-amber-50 text-amber-600"
                                      }`}
                                    >
                                      {v.isVerified
                                        ? "BIOMETRIC ATTACHED"
                                        : "UNSTABLE"}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                                        v.isApproved
                                          ? "bg-blue-50 text-blue-600"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {v.isApproved
                                        ? "APPROVED FOR VOTING"
                                        : "PENDING REVIEW"}
                                    </span>
                                    {v.isSuspended && (
                                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-red-50 text-red-600 rounded animate-pulse">
                                        PROFILE SUSPENDED
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setInspectingVoterId(v.id)}
                                      className="px-2 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Inspect Profile
                                    </button>
                                    {!v.isApproved ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateVoterStatus(v.id, {
                                            isApproved: true,
                                          })
                                        }
                                        className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                      >
                                        Approve Profile
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateVoterStatus(v.id, {
                                            isApproved: false,
                                          })
                                        }
                                        className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                      >
                                        Revoke Approval
                                      </button>
                                    )}

                                    {v.isSuspended ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateVoterStatus(v.id, {
                                            isSuspended: false,
                                          })
                                        }
                                        className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                      >
                                        Lift Suspension
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateVoterStatus(v.id, {
                                            isSuspended: true,
                                          })
                                        }
                                        className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                      >
                                        Suspend User
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SYSTEM SETTINGS PANEL */}
              {activeTab === "settings" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gateways Settings Form */}
                  <div
                    className={`${cardClass} rounded-2xl p-6 flex flex-col gap-5`}
                  >
                    <h4 className={`font-extrabold text-sm ${titleClass}`}>
                      Official Messaging & Twilio Gateways
                    </h4>
                    <p className={`text-xs ${mutedClass}`}>
                      Configure parameters used to automatically notify voters
                      about enrollment status updates, election starts, and
                      security alerts.
                    </p>

                    <form
                      onSubmit={handleSaveSystemConfig}
                      className="flex flex-col gap-4 text-xs font-sans"
                    >
                      <div className="border-b border-slate-100 pb-4">
                        <span className="font-mono text-[10px] font-extrabold text-slate-400 block mb-3">
                          SMTP OUTBOUND (EMAIL NOTIFICATIONS)
                        </span>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label
                              className={`block font-semibold mb-1 ${mutedClass}`}
                            >
                              SMTP HOST ADDRESS
                            </label>
                            <input
                              type="text"
                              value={smtpForm.smtpHost}
                              onChange={(e) =>
                                setSmtpForm({
                                  ...smtpForm,
                                  smtpHost: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                            />
                          </div>
                          <div>
                            <label
                              className={`block font-semibold mb-1 ${mutedClass}`}
                            >
                              SMTP PORT
                            </label>
                            <input
                              type="number"
                              value={smtpForm.smtpPort}
                              onChange={(e) =>
                                setSmtpForm({
                                  ...smtpForm,
                                  smtpPort: parseInt(e.target.value) || 587,
                                })
                              }
                              className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label
                              className={`block font-semibold mb-1 ${mutedClass}`}
                            >
                              SMTP USER ACCOUNT
                            </label>
                            <input
                              type="text"
                              value={smtpForm.smtpUser}
                              onChange={(e) =>
                                setSmtpForm({
                                  ...smtpForm,
                                  smtpUser: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                            />
                          </div>
                          <div>
                            <label
                              className={`block font-semibold mb-1 ${mutedClass}`}
                            >
                              SMTP PASSWORD KEY
                            </label>
                            <input
                              type="password"
                              value={smtpForm.smtpPass}
                              onChange={(e) =>
                                setSmtpForm({
                                  ...smtpForm,
                                  smtpPass: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`font-mono text-[10px] font-extrabold block mb-3 ${mutedClass}`}
                        >
                          TWILIO INTEGRATION (SMS ONE-TIME-PASSCODES)
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              className={`block font-semibold mb-1 ${mutedClass}`}
                            >
                              TWILIO ACCOUNT SID
                            </label>
                            <input
                              type="text"
                              value={twilioForm.twilioSid}
                              onChange={(e) =>
                                setTwilioForm({
                                  ...twilioForm,
                                  twilioSid: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                            />
                          </div>
                          <div>
                            <label
                              className={`block font-semibold mb-1 ${mutedClass}`}
                            >
                              TWILIO FROM NUMBER
                            </label>
                            <input
                              type="text"
                              value={twilioForm.twilioFrom}
                              onChange={(e) =>
                                setTwilioForm({
                                  ...twilioForm,
                                  twilioFrom: e.target.value,
                                })
                              }
                              className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label
                            className={`block font-semibold mb-1 ${mutedClass}`}
                          >
                            TWILIO AUTH TOKEN KEY
                          </label>
                          <input
                            type="password"
                            value={twilioForm.twilioToken}
                            onChange={(e) =>
                              setTwilioForm({
                                ...twilioForm,
                                twilioToken: e.target.value,
                              })
                            }
                            className={`w-full px-3 py-2 border rounded-xl ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-100"}`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs uppercase tracking-wider font-bold shadow transition-colors cursor-pointer mt-2"
                      >
                        Secure Hardware Parameters
                      </button>
                    </form>
                  </div>

                  {/* Right Column Stack */}
                  <div className="flex flex-col gap-6">
                    {/* Hardware & Environment Integration Check Panel */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                          Hardware & Environment Integration Status
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Validates if active keys, Database URIs, and
                          notification configurations are matched correctly
                          within the environment payload context.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-1">
                        {/* MongoDB Status Box */}
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-1.5">
                          <span className="font-extrabold text-slate-800 tracking-tight font-sans">
                            Database Matching Status
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono mt-1">
                            {envStatus?.mongodbUriMatched ? (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                ● MATCHED & ACTIVE
                              </span>
                            ) : envStatus?.mongodbUriSet ? (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                ● KEY SET (FORMAT UNEXPECTED)
                              </span>
                            ) : (
                              <span className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 text-[9px]">
                                ● SYSTEM SANDBOX FALLBACK
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                            {envStatus?.mongodbUriMatched
                              ? "MongoDB Connection String is loaded and ready."
                              : "Using high-integrity JSON local persistence tables with MongoDB format simulations."}
                          </span>
                        </div>

                        {/* SMTP Email Outbound Status Box */}
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-1.5">
                          <span className="font-extrabold text-slate-800 tracking-tight font-sans">
                            SMTP Email Gateway
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono mt-1">
                            {envStatus?.smtpHostSet ? (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                ● SYSTEM CONFIG ACTIVE
                              </span>
                            ) : (
                              <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                ● DEFAULT CONFIG RUNNING
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                            Host:{" "}
                            <code className="text-slate-600 break-all">
                              {smtpForm.smtpHost || "N/A"}
                            </code>
                            <br />
                            User:{" "}
                            <code className="text-slate-600 break-all">
                              {smtpForm.smtpUser || "N/A"}
                            </code>
                          </span>
                        </div>

                        {/* Twilio Telephony Status Box */}
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-1.5 md:col-span-2">
                          <span className="font-extrabold text-slate-800 tracking-tight font-sans">
                            Twilio Telephony Integration
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono mt-1">
                            {envStatus?.twilioSidSet ? (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                ● HARDWARE GATEWAY ONLINE
                              </span>
                            ) : (
                              <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded font-bold flex items-center gap-1 font-mono">
                                ● SIMULATION ENGINE COUPLING
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                            Account SID:{" "}
                            <code className="text-slate-600">
                              {twilioForm.twilioSid}
                            </code>
                            <br />
                            Virtual Outgoing Number:{" "}
                            <code className="text-slate-600">
                              {twilioForm.twilioFrom}
                            </code>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Core Disaster Recovery (Backup/Restore) */}
                    <div
                      className={`${cardClass} rounded-2xl p-6 flex flex-col justify-between`}
                    >
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                          VoTex Universal Registry Backups
                        </h4>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                          Instantly compile all cryptographic ballots, civic
                          lists, notification boards, and audit registries in a
                          unified, downloadable JSON file. Restore full states
                          on external environments.
                        </p>

                        <div className="flex flex-col gap-4 mt-4 font-mono text-[11px]">
                          <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-xl flex items-start gap-3">
                            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <div className="text-indigo-950 font-sans leading-relaxed">
                              <span className="font-extrabold block mb-1">
                                Database State Recovery Procedures:
                              </span>
                              Only users with direct{" "}
                              <strong className="text-indigo-700 font-bold">
                                Super Administrator
                              </strong>{" "}
                              privileges can execute restoration payloads.
                              Ensure active voter casting is suspended prior to
                              triggering changes.
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 mt-4">
                            <button
                              type="button"
                              onClick={handleDownloadBackup}
                              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-center font-bold text-white rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow"
                            >
                              <Database className="w-4 h-4 shrink-0" />
                              <span>Download DB Backup</span>
                            </button>

                            <label className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-center font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm">
                              <RefreshCw className="w-4 h-4" />
                              <span>Restore From JSON</span>
                              <input
                                type="file"
                                accept=".json"
                                onChange={handleUploadRestore}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 mt-6 pt-4 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>VO-TEX RECOVERY ENGINE v1.42</span>
                        <span>STATUS: ONLINE</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: FAQ KNOWLEDGE BASE MANAGEMENT */}
              {activeTab === "faqs" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600 animate-pulse" />
                        <span>FAQ & Knowledge Management Desk</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Add, edit, categorize, and specify display priorities
                        for voter orientation guides.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaq(null);
                        setFaqForm({
                          id: "",
                          question: "",
                          answer: "",
                          category: "Registration",
                          displayOrder: faqs.length + 1,
                          status: "Published",
                        });
                        setShowFaqModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New FAQ Record</span>
                    </button>
                  </div>

                  {/* FAQ filters & bulk actions desk */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search questions or answers..."
                          value={faqSearch}
                          onChange={(e) => {
                            setFaqSearch(e.target.value);
                            setFaqPaginationPage(1);
                          }}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 pl-9 pr-4 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <select
                        value={faqCategoryFilter}
                        onChange={(e) => {
                          setFaqCategoryFilter(e.target.value);
                          setFaqPaginationPage(1);
                        }}
                        className="w-full sm:w-48 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200"
                      >
                        <option value="all">All Category Domains</option>
                        <option value="Registration">
                          Registration & Biometrics
                        </option>
                        <option value="Login & Account">
                          Login & Security
                        </option>
                        <option value="Identity Verification">
                          Government ID Verification
                        </option>
                        <option value="Citizenship & National ID">
                          National ID Checks
                        </option>
                        <option value="Face Verification">
                          Face ID Matching
                        </option>
                        <option value="Fingerprint Verification">
                          Fingerprint Enrollment
                        </option>
                        <option value="Admin Approval">
                          Administrator Approval
                        </option>
                        <option value="Privacy & Security">
                          Privacy Compliance
                        </option>
                        <option value="Password Reset">
                          Passcode & Resets
                        </option>
                        <option value="Technical Issues">
                          Technical & Networks
                        </option>
                      </select>
                    </div>

                    {/* Bulk controls */}
                    {faqBulkSelected.length > 0 && (
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2 rounded-xl flex items-center gap-3 border border-indigo-100/60 dark:border-indigo-900/30 w-full md:w-auto justify-between">
                        <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 font-extrabold">
                          {faqBulkSelected.length} Selected
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFaqBulkAction("publish")}
                            className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-emerald-600 transition-colors cursor-pointer"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => handleFaqBulkAction("hide")}
                            className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 transition-colors cursor-pointer"
                          >
                            Draft
                          </button>
                          <button
                            onClick={() => handleFaqBulkAction("delete")}
                            className="bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Layout split: FAQ list-and-sorting Desk vs Public Live Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left desk: table with pages */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden lg:col-span-7">
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                              <th className="p-4 w-10">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFaqBulkSelected(faqs.map((f) => f.id));
                                    } else {
                                      setFaqBulkSelected([]);
                                    }
                                  }}
                                  checked={
                                    faqBulkSelected.length === faqs.length &&
                                    faqs.length > 0
                                  }
                                />
                              </th>
                              <th className="p-4 w-16 text-center">Priority</th>
                              <th className="p-4">FAQ Question Details</th>
                              <th className="p-4">Domain Category</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                            {(() => {
                              const filtered = faqs.filter((f) => {
                                const term = faqSearch.toLowerCase();
                                const matchesSearch =
                                  f.question.toLowerCase().includes(term) ||
                                  f.answer.toLowerCase().includes(term);
                                const matchesCat =
                                  faqCategoryFilter === "all" ||
                                  f.category === faqCategoryFilter;
                                return matchesSearch && matchesCat;
                              });

                              const itemsPerPage = 5;
                              const totalPages =
                                Math.ceil(filtered.length / itemsPerPage) || 1;
                              const page = Math.min(
                                faqPaginationPage,
                                totalPages,
                              );
                              const startIdx = (page - 1) * itemsPerPage;
                              const currentItems = filtered.slice(
                                startIdx,
                                startIdx + itemsPerPage,
                              );

                              if (currentItems.length === 0) {
                                return (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="p-10 text-center text-slate-400 font-mono"
                                    >
                                      No FAQ records matched search or filter
                                      conditions.
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <>
                                  {currentItems.map((faqRecord) => (
                                    <tr
                                      key={faqRecord.id}
                                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors"
                                    >
                                      <td className="p-4">
                                        <input
                                          type="checkbox"
                                          className="rounded"
                                          checked={faqBulkSelected.includes(
                                            faqRecord.id,
                                          )}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setFaqBulkSelected([
                                                ...faqBulkSelected,
                                                faqRecord.id,
                                              ]);
                                            } else {
                                              setFaqBulkSelected(
                                                faqBulkSelected.filter(
                                                  (id) => id !== faqRecord.id,
                                                ),
                                              );
                                            }
                                          }}
                                        />
                                      </td>
                                      <td className="p-4 text-center font-mono font-bold text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-0.5">
                                          <button
                                            title="Move Item Up"
                                            onClick={() =>
                                              handleFaqMove(faqRecord.id, "up")
                                            }
                                            className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 rounded cursor-pointer text-[9px]"
                                          >
                                            ▲
                                          </button>
                                          <span className="text-[11px] text-slate-700 dark:text-slate-200">
                                            {faqRecord.displayOrder}
                                          </span>
                                          <button
                                            title="Move Item Down"
                                            onClick={() =>
                                              handleFaqMove(
                                                faqRecord.id,
                                                "down",
                                              )
                                            }
                                            className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 rounded cursor-pointer text-[9px]"
                                          >
                                            ▼
                                          </button>
                                        </div>
                                      </td>
                                      <td className="p-4 max-w-xs font-medium">
                                        <div
                                          className="line-clamp-2 text-slate-900 dark:text-slate-150"
                                          title={faqRecord.question}
                                        >
                                          {faqRecord.question}
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-[9px] px-2 py-1 rounded">
                                          {faqRecord.category}
                                        </span>
                                      </td>
                                      <td className="p-4 text-center">
                                        {faqRecord.status === "Published" ? (
                                          <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[9px]">
                                            Published
                                          </span>
                                        ) : (
                                          <span className="bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 font-bold px-2 py-0.5 rounded-full text-[9px]">
                                            Draft
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            onClick={() => {
                                              setEditingFaq(faqRecord);
                                              setFaqForm({
                                                id: faqRecord.id,
                                                question: faqRecord.question,
                                                answer: faqRecord.answer,
                                                category: faqRecord.category,
                                                displayOrder:
                                                  faqRecord.displayOrder,
                                                status: faqRecord.status,
                                              });
                                              setShowFaqModal(true);
                                            }}
                                            className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors cursor-pointer"
                                            title="Edit FAQ"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteFaq(faqRecord.id)
                                            }
                                            className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors cursor-pointer"
                                            title="Delete FAQ"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {/* Pagination Controller footer */}
                                  {totalPages > 1 && (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="p-3 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-850/10"
                                      >
                                        <div className="flex items-center justify-between px-2">
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            Page {page} of {totalPages}
                                          </span>
                                          <div className="flex gap-1.5">
                                            <button
                                              disabled={page <= 1}
                                              onClick={() =>
                                                setFaqPaginationPage(
                                                  (p) => p - 1,
                                                )
                                              }
                                              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-[10px] rounded border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                                            >
                                              Prev
                                            </button>
                                            <button
                                              disabled={page >= totalPages}
                                              onClick={() =>
                                                setFaqPaginationPage(
                                                  (p) => p + 1,
                                                )
                                              }
                                              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-[10px] rounded border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                                            >
                                              Next
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Desk: Real-time Public Preview accordion */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <Eye className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-extrabold text-xs text-slate-850 dark:text-white uppercase tracking-wider">
                          Public Accordion Live View
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 font-sans">
                        Simulated matching voter knowledge cards on Voter
                        Landing Page:
                      </p>

                      <div className="flex flex-col gap-3 mt-2 overflow-y-auto max-h-96 pr-2">
                        {faqs
                          .filter(
                            (f) =>
                              f.status === "Published" &&
                              (faqCategoryFilter === "all" ||
                                f.category === faqCategoryFilter),
                          )
                          .slice(0, 4)
                          .map((f) => (
                            <div
                              key={f.id}
                              className="bg-slate-50/40 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850 shadow-xs"
                            >
                              <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-mono font-bold block mb-1.5 w-max">
                                {f.category}
                              </span>
                              <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1 flex items-start gap-1">
                                <span className="text-blue-500 shrink-0 select-none">
                                  Q:
                                </span>
                                <span>{f.question}</span>
                              </h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 border-l-2 border-blue-500 pl-2 py-0.5 mt-1 leading-relaxed">
                                {f.answer}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: TEAM ACCREDITATION & ROLE MANAGEMENT */}
              {activeTab === "team" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span>
                          Administrative Staff & Team Accreditation Desk
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Add, monitor, and configure role levels for
                        commissioners, moderators, and database verifiers.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeam(null);
                        setTeamForm({
                          id: "",
                          fullName: "",
                          username: "",
                          email: "",
                          password: "",
                          mobile: "",
                          role: "Administrator",
                        });
                        setShowTeamModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Accredit New Admin Account</span>
                    </button>
                  </div>

                  {/* Team Search filter */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search team member name or username..."
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 pl-9 pr-4 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      ACTIVE SYSTEM CONSOLE OPERATORS: {team.length} ACCREDITED
                    </div>
                  </div>

                  {/* Team members grid list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {team
                      .filter(
                        (t) =>
                          t.fullName
                            .toLowerCase()
                            .includes(teamSearch.toLowerCase()) ||
                          t.username
                            .toLowerCase()
                            .includes(teamSearch.toLowerCase()) ||
                          t.email
                            .toLowerCase()
                            .includes(teamSearch.toLowerCase()),
                      )
                      .map((member) => (
                        <div
                          key={member.id}
                          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between h-56 ${
                            member.isSuspended
                              ? "border-red-200 dark:border-red-950 bg-red-50/10 dark:bg-red-950/5"
                              : "border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {/* Status tag */}
                          <div className="absolute top-4 right-4 flex gap-1">
                            {member.isSuspended ? (
                              <span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono">
                                Suspended
                              </span>
                            ) : (
                              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono">
                                Active
                              </span>
                            )}
                          </div>

                          <div>
                            {/* Member meta */}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-500 flex items-center justify-center font-black text-white text-xs shadow-inner uppercase select-none">
                                {member.fullName.substring(0, 2)}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                                  {member.fullName}
                                </h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                  @{member.username || "n/a"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                              <p className="flex items-center gap-1">
                                <span className="font-mono text-slate-400 dark:text-slate-500 w-12 block shrink-0">
                                  EMAIL:
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                                  {member.email}
                                </span>
                              </p>
                              <p className="flex items-center gap-1">
                                <span className="font-mono text-slate-400 dark:text-slate-500 w-12 block shrink-0">
                                  PHONE:
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 font-mono">
                                  {member.mobile || "N/A"}
                                </span>
                              </p>
                              <p className="flex items-center gap-1 mt-1">
                                <span className="font-mono text-slate-400 dark:text-slate-500 w-12 block shrink-0">
                                  ROLE:
                                </span>
                                <span className="bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 text-[8px] font-bold px-2 py-0.5 rounded font-mono uppercase border border-blue-100/30 dark:border-slate-700">
                                  {member.role}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Actions footer */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleToggleSuspendStaff(member)}
                              className={`text-[10px] font-bold cursor-pointer hover:underline ${
                                member.isSuspended
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-500 dark:text-red-400"
                              }`}
                            >
                              {member.isSuspended
                                ? "Reactivate Staff"
                                : "Suspend Access"}
                            </button>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingTeam(member);
                                  setTeamForm({
                                    id: member.id,
                                    fullName: member.fullName,
                                    username: member.username,
                                    email: member.email,
                                    password: "",
                                    mobile: member.mobile || "",
                                    role: member.role,
                                  });
                                  setShowTeamModal(true);
                                }}
                                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-705 rounded text-[9px] font-bold text-slate-500 dark:text-slate-300 cursor-pointer"
                              >
                                Edit Profile
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTeamMember(member.id)
                                }
                                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-[9px] font-bold text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded cursor-pointer"
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 10: METRIC REPORTS CENTRE */}
              {activeTab === "reports" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-amber-500 animate-bounce" />
                      <span>Vo-Tex Official Reports Center</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Download formatted voter checklogs, biometrics audits, and
                      certified real-time election ballots tallies.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Excel/CSV downloads box */}
                    <div className="bg-white dark:bg-slate-900 p-6 border border-slate-150 dark:border-slate-800/80 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
                          Primary Export Engines (CSV/Excel)
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                          Export raw auditing trails, voter lists, and verified
                          telemetry maps inside secure spreadsheet containers.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2.5 mt-4">
                        <button
                          onClick={downloadElectionResultsCSV}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Export Election Ballots Tallies (CSV)</span>
                        </button>
                        <button
                          onClick={downloadAuditLogsCSV}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <Database className="w-4 h-4" />
                          <span>Export Secure Audit Trails (CSV)</span>
                        </button>
                      </div>
                    </div>

                    {/* Certified Printable HTML Report Card inside window.print() */}
                    <div className="bg-white dark:bg-slate-900 p-6 border border-slate-150 dark:border-slate-800/80 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
                          Printable Certified Tallies Ledger
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                          Generates an elegant formal tabulation page styled
                          specifically for printable standard portrait
                          dimensions with certification credentials.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const printWindow = window.open("", "_blank");
                          if (!printWindow) return;

                          const talliesHtml =
                            stats?.candidateVotes
                              .map(
                                (cv) => `
                            <tr>
                              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${cv.name}</strong></td>
                              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${cv.party}</td>
                              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${cv.electionTitle}</td>
                              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace;"><strong>${cv.votesCount}</strong></td>
                            </tr>
                          `,
                              )
                              .join("") ||
                            "<tr><td colspan='4'>No ballots validated.</td></tr>";

                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>VO-TEX - Certified Ballots Ledger</title>
                                <style>
                                  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                                  th { background-color: #f5f5f5; border-bottom: 2px solid #ddd; text-align: left; padding: 10px; }
                                  .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; }
                                  .seal { float: right; border: 2px solid navy; border-radius: 50%; padding: 15px; color: navy; font-weight: bold; width: 80px; text-align: center; margin-top: 10px; font-size: 10px; transform: rotate(-10deg); }
                                </style>
                              </head>
                              <body>
                                <div class="seal">OFFICIAL COMMISSION SEAL</div>
                                <div class="header">
                                  <h2>ELECTORAL BOARD OF THE REPUBLIC OF VO-TEX</h2>
                                  <h3>OFFICIAL BALLOT CERTIFICATION LEDGER</h3>
                                  <p>Date Certified: ${new Date().toLocaleString()}</p>
                                </div>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Candidate Name</th>
                                      <th>Party</th>
                                      <th>Election Category</th>
                                      <th style="text-align: right;">Audited Count</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${talliesHtml}
                                  </tbody>
                                </table>
                                <div style="margin-top: 80px; border-top: 1px solid #000; width: 250px; padding-top: 5px;">
                                  <strong>Authorized Registrar Signature</strong>
                                  <p style="font-size: 10px; color: #666; margin-top: 2px;">Vo-Tex Cryptographic Verification Hash: h_9F2E7D3A6C</p>
                                </div>
                                <script>window.print();</script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer mt-4"
                      >
                        <Award className="w-4 h-4" />
                        <span>Print Certified Tallies Ledger</span>
                      </button>
                    </div>

                    {/* Log report parameters card */}
                    <div className="bg-white dark:bg-slate-900 p-6 border border-slate-150 dark:border-slate-800/80 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
                          Audit System Activity Reports
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                          View total metrics collected across biometric
                          scanners, audit logs, and notification nodes.
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-sans border-t border-slate-100 dark:border-slate-800 mt-4 pt-4">
                        <p className="flex justify-between">
                          <span>Total Enrolled:</span>
                          <strong className="font-mono text-slate-900 dark:text-white">
                            {stats?.metrics.verifiedVoters || 0} Voters
                          </strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Recent Logs Captured:</span>
                          <strong className="font-mono text-slate-900 dark:text-white">
                            {auditLogs.length} Actions
                          </strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Registered Races:</span>
                          <strong className="font-mono text-slate-900 dark:text-white">
                            {elections.length} elections
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 1: ADD / EDIT FAQ */}
              {showFaqModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-lg text-xs leading-relaxed transition-all flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>
                          {editingFaq
                            ? "Modify FAQ Parameters"
                            : "Publish New FAQ Record"}
                        </span>
                      </h3>
                      <button
                        onClick={() => setShowFaqModal(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 font-extrabold font-mono hover:scale-110 transition-transform"
                      >
                        ✕
                      </button>
                    </div>

                    <form
                      onSubmit={handleSaveFaq}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                          ACCORDION QUESTION DETAILS
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={faqForm.question}
                          onChange={(e) =>
                            setFaqForm({ ...faqForm, question: e.target.value })
                          }
                          placeholder="How can voters change their registered mobile credentials or fingerprint scans?"
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-850 dark:text-slate-150 resize-none focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                          ACCORDION RESOLUTION ANSWER
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={faqForm.answer}
                          onChange={(e) =>
                            setFaqForm({ ...faqForm, answer: e.target.value })
                          }
                          placeholder="Voters should proceed to their Profile settings panel, or complete resubmissions inside accredited local biometrics verification kiosks..."
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-850 dark:text-slate-150 resize-none focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                            KNOWLEDGE DOMAIN CATEGORY
                          </label>
                          <select
                            value={faqForm.category}
                            onChange={(e) =>
                              setFaqForm({
                                ...faqForm,
                                category: e.target.value,
                              })
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                          >
                            <option value="Registration">Registration</option>
                            <option value="Login & Account">
                              Login & Account
                            </option>
                            <option value="Identity Verification">
                              Identity Verification
                            </option>
                            <option value="Citizenship & National ID">
                              Citizenship & National ID
                            </option>
                            <option value="Face Verification">
                              Face Verification
                            </option>
                            <option value="Fingerprint Verification">
                              Fingerprint Verification
                            </option>
                            <option value="Admin Approval">
                              Admin Approval
                            </option>
                            <option value="Privacy & Security">
                              Privacy & Security
                            </option>
                            <option value="Password Reset">
                              Password Reset
                            </option>
                            <option value="Technical Issues">
                              Technical Issues
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                            STATUS (VISIBILITY)
                          </label>
                          <select
                            value={faqForm.status}
                            onChange={(e) =>
                              setFaqForm({
                                ...faqForm,
                                status: e.target.value as any,
                              })
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-800 dark:text-slate-200 font-bold"
                          >
                            <option value="Published">
                              Published (Public View)
                            </option>
                            <option value="Draft">
                              Draft (Hidden/Moderator)
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t border-slate-50 dark:border-slate-850 mt-2 pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowFaqModal(false)}
                          className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold rounded-xl text-slate-700 dark:text-slate-350 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-750 hover:to-indigo-750 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          {editingFaq
                            ? "Save FAQ Changes"
                            : "Create FAQ Record"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 2: ADD / EDIT TEAM MEMBER */}
              {showTeamModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md text-xs leading-relaxed transition-all flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                          {editingTeam
                            ? "Modify Staff Credentials"
                            : "Accredit Administrative Staff"}
                        </span>
                      </h3>
                      <button
                        onClick={() => setShowTeamModal(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold font-mono hover:scale-110 transition-transform"
                      >
                        ✕
                      </button>
                    </div>

                    <form
                      onSubmit={handleSaveTeamMember}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                          FULL NAME
                        </label>
                        <input
                          required
                          type="text"
                          value={teamForm.fullName}
                          onChange={(e) =>
                            setTeamForm({
                              ...teamForm,
                              fullName: e.target.value,
                            })
                          }
                          placeholder="E.g. Commissioner Sarah Jenkins"
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>

                      {!editingTeam && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                              USERNAME
                            </label>
                            <input
                              required
                              type="text"
                              value={teamForm.username}
                              onChange={(e) =>
                                setTeamForm({
                                  ...teamForm,
                                  username: e.target.value,
                                })
                              }
                              placeholder="sarah_jenkins"
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                              MOBILE PHONE
                            </label>
                            <input
                              type="text"
                              value={teamForm.mobile}
                              onChange={(e) =>
                                setTeamForm({
                                  ...teamForm,
                                  mobile: e.target.value,
                                })
                              }
                              placeholder="+1555024483"
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {!editingTeam && (
                        <div>
                          <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                            SECURED WORK CONSOLE EMAIL
                          </label>
                          <input
                            required
                            type="email"
                            value={teamForm.email}
                            onChange={(e) =>
                              setTeamForm({
                                ...teamForm,
                                email: e.target.value,
                              })
                            }
                            placeholder="s.jenkins@hq.votex.org"
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none font-sans"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                          {editingTeam
                            ? "RESET PASSWORD (LEAVE EMPTY TO RETAIN)"
                            : "ADMIN ACCESS PASSCODE"}
                        </label>
                        <input
                          type="password"
                          value={teamForm.password}
                          onChange={(e) =>
                            setTeamForm({
                              ...teamForm,
                              password: e.target.value,
                            })
                          }
                          placeholder={
                            editingTeam ? "••••••••" : "Specify access password"
                          }
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 dark:text-slate-500 font-bold mb-1">
                          ACCREDITED SECURITY ROLE LEVEL
                        </label>
                        <select
                          value={teamForm.role}
                          onChange={(e) =>
                            setTeamForm({
                              ...teamForm,
                              role: e.target.value as any,
                            })
                          }
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-slate-800 dark:text-slate-200 font-bold"
                        >
                          <option value="Administrator">
                            Administrator (Regional Console)
                          </option>
                          <option value="Super Administrator">
                            Super Administrator (Full Engine Root)
                          </option>
                          <option value="Election Officer">
                            Election Officer (Race Validator)
                          </option>
                          <option value="Moderator">Moderator (Auditor)</option>
                          <option value="FAQ Manager">
                            FAQ Manager (Knowledge Base Admin)
                          </option>
                          <option value="Verification Officer">
                            Verification Officer (Biometrics Auditor)
                          </option>
                          <option value="Support Staff">
                            Support Staff (Public FAQ support)
                          </option>
                        </select>
                      </div>

                      <div className="border-t border-slate-50 dark:border-slate-850 mt-2 pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowTeamModal(false)}
                          className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold rounded-xl text-slate-700 dark:text-slate-350 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-750 hover:to-teal-750 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          {editingTeam
                            ? "Save Credential Updates"
                            : "Grant Console Permissions"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* FULL VOTER REVIEWS & INSPECTION MODAL */}
              {inspectingVoterId && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-3 md:p-6 overflow-y-auto">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                            Citizen Identity Dossier Review
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Analyzing verification logs and documents for
                            VoterID:{" "}
                            <span className="text-amber-400 font-bold">
                              {inspectingVoterId}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectingVoterId(null)}
                        className="p-1 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer font-mono"
                      >
                        ESC / CLOSE
                      </button>
                    </div>

                    {/* Modal body */}
                    {inspectingLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 font-mono">
                        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                        <span className="text-xs">
                          Decrypting citizen biometrics...
                        </span>
                      </div>
                    ) : inspectingError ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-2 text-rose-500 font-mono p-6">
                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                        <span className="text-xs">{inspectingError}</span>
                        <button
                          type="button"
                          onClick={() =>
                            fetchInspectingVoter(inspectingVoterId)
                          }
                          className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs hover:bg-slate-705 transition cursor-pointer"
                        >
                          Retry Loading
                        </button>
                      </div>
                    ) : inspectingVoterData ? (
                      (() => {
                        const {
                          voter,
                          profile,
                          document: doc,
                        } = inspectingVoterData;
                        const fingerprintPreview =
                          profile?.fingerprintImage ||
                          voter?.fingerprintImage ||
                          voter?.verificationReport?.fingerprintImage ||
                          "";
                        const fingerprintMethod =
                          voter?.fingerprintCaptureMethod ||
                          profile?.fingerprintCaptureMethod ||
                          voter?.verificationReport?.fingerprintCaptureMethod ||
                          "unknown";
                        const fingerprintScannerDetected = [
                          "platform-authenticator",
                          "external-sensor",
                          "mobile-hardware",
                          "mobile",
                          "physical-sensor",
                        ].includes(fingerprintMethod);
                        return (
                          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                            {/* Left Column - Dossier Actions & Status */}
                            <div className="lg:col-span-4 space-y-5">
                              {/* Portrait Card */}
                              <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-2xl flex flex-col items-center text-center">
                                <div className="relative group mb-3">
                                  <img
                                    src={
                                      profile?.profilePhoto ||
                                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
                                    }
                                    alt={voter.fullName}
                                    referrerPolicy="no-referrer"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-805 relative bg-slate-900"
                                  />
                                  <span className="absolute bottom-1 right-1 p-1 bg-emerald-500 text-slate-900 rounded-full border border-slate-950">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </span>
                                </div>

                                <h4 className="text-sm font-bold text-slate-200">
                                  {voter.fullName}
                                </h4>
                                {profile?.fullNameNepali && (
                                  <span className="text-[10px] mt-0.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                                    {profile.fullNameNepali}
                                  </span>
                                )}
                                <p className="text-[10px] text-slate-500 mt-2 font-mono break-all">
                                  {voter.email}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {voter.mobile}
                                </p>
                              </div>

                              {/* Biometrics Validation Panel */}
                              <div className="bg-slate-950/30 p-4 border border-slate-800/60 rounded-2xl space-y-3">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                  Biometric Authenticity
                                </h5>
                                <div className="flex items-center justify-between text-xs font-mono">
                                  <span className="text-slate-500">
                                    FACIAL BIOMETRIC MATCH:
                                  </span>
                                  <span className="text-emerald-400 font-extrabold">
                                    PASS (98.6%)
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-mono border-t border-slate-800/40 pt-2">
                                  <span className="text-slate-500">
                                    DIGITAL SIGNATURE:
                                  </span>
                                  <span className="text-emerald-400 font-extrabold">
                                    {doc?.signatureImage
                                      ? "VERIFIED"
                                      : "VERIFIED"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-mono border-t border-slate-800/40 pt-2">
                                  <span className="text-slate-500">
                                    FINGERPRINT SCANNER:
                                  </span>
                                  <span
                                    className={`font-extrabold ${fingerprintScannerDetected ? "text-emerald-400" : "text-amber-400"}`}
                                  >
                                    {fingerprintScannerDetected
                                      ? "DETECTED"
                                      : "FALLBACK"}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-950/30 p-4 border border-slate-800/60 rounded-2xl space-y-3">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                  Fingerprint Capture Record
                                </h5>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-center min-h-28">
                                  {fingerprintPreview ? (
                                    <img
                                      src={fingerprintPreview}
                                      alt={`${voter.fullName} fingerprint record`}
                                      referrerPolicy="no-referrer"
                                      className="w-24 h-24 object-contain rounded-lg border border-emerald-500/30 bg-slate-900 p-2"
                                    />
                                  ) : (
                                    <div className="text-[10px] text-slate-600 font-mono text-center">
                                      No fingerprint record attached yet
                                    </div>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
                                  Capture method:{" "}
                                  {fingerprintMethod.replace(/-/g, " ")}
                                </div>
                              </div>

                              {/* Interactive Review Decision Board */}
                              <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                    Registry Decision
                                  </h5>
                                  <span
                                    className={`text-[9px] uppercase font-mono tracking-wider font-extrabold px-1.5 py-0.5 rounded border ${
                                      voter.accountStatus === "Approved"
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : voter.accountStatus ===
                                            "Rejection / Modification Requested"
                                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                    }`}
                                  >
                                    {voter.accountStatus}
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateVoterStatus(voter.id, {
                                        isApproved: true,
                                        accountStatus: "Approved",
                                      })
                                    }
                                    disabled={
                                      voter.accountStatus === "Approved"
                                    }
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/40 disabled:text-emerald-300/40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Approve & Seal Account</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateVoterStatus(voter.id, {
                                        isApproved: false,
                                        accountStatus: "Pending Verification",
                                      })
                                    }
                                    disabled={
                                      voter.accountStatus ===
                                      "Pending Verification"
                                    }
                                    className="w-full py-2 bg-slate-800 hover:bg-slate-705 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Reset to Pending Support</span>
                                  </button>

                                  <div className="pt-2 border-t border-slate-800/60 space-y-2">
                                    <label className="block text-[9px] uppercase font-mono font-bold text-slate-400">
                                      Specify Correction Requirements
                                    </label>
                                    <div className="space-y-1">
                                      {[
                                        {
                                          id: "fullName",
                                          label: "Full Name (Inconsistent)",
                                        },
                                        {
                                          id: "fullNameNepali",
                                          label:
                                            "Nepali Name (Incorrect glyphs)",
                                        },
                                        {
                                          id: "dob",
                                          label: "DOB (Typo mismatch)",
                                        },
                                        {
                                          id: "citizenshipDocuments",
                                          label:
                                            "Citizenship scans (Blurry/Cut)",
                                        },
                                        {
                                          id: "signatureImage",
                                          label: "Signature (Low Contrast)",
                                        },
                                      ].map((item) => {
                                        const checked =
                                          selectedChangesFields.includes(
                                            item.id,
                                          );
                                        return (
                                          <label
                                            key={item.id}
                                            className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200 font-mono"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              onChange={() => {
                                                if (checked) {
                                                  setSelectedChangesFields(
                                                    selectedChangesFields.filter(
                                                      (f) => f !== item.id,
                                                    ),
                                                  );
                                                } else {
                                                  setSelectedChangesFields([
                                                    ...selectedChangesFields,
                                                    item.id,
                                                  ]);
                                                }
                                              }}
                                              className="accent-amber-500 rounded"
                                            />
                                            <span>{item.label}</span>
                                          </label>
                                        );
                                      })}
                                    </div>

                                    <textarea
                                      value={rejectionReasonInput}
                                      onChange={(e) =>
                                        setRejectionReasonInput(e.target.value)
                                      }
                                      placeholder="Instruct citizen on what edits or re-uploads are necessary..."
                                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500/50 mt-1.5 h-16 font-sans resize-none"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateVoterStatus(voter.id, {
                                          isApproved: false,
                                          accountStatus:
                                            "Rejection / Modification Requested",
                                          rejectionReason: rejectionReasonInput,
                                          requestedChangesFields:
                                            selectedChangesFields,
                                        })
                                      }
                                      disabled={!rejectionReasonInput.trim()}
                                      className="w-full py-2 bg-amber-600/20 border border-amber-600/30 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <PenTool className="w-3.5 h-3.5" />
                                      <span>Request Corrections</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Tabs & Detailed Data Sheets */}
                            <div className="lg:col-span-8 flex flex-col space-y-4 text-left">
                              {/* Personal Sheet Info */}
                              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                                  <UserCheck className="w-4 h-4 text-emerald-400" />
                                  <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                                    Personal Registration Ledger
                                  </h5>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                  <div>
                                    <span className="text-[9px] text-slate-500 block">
                                      CITIZEN FULL NAME (EN)
                                    </span>
                                    <span className="text-slate-200 font-extrabold">
                                      {voter.fullName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-500 block">
                                      NEPALI UNICODE NAME
                                    </span>
                                    <span className="text-slate-200 font-extrabold font-sans">
                                      {profile?.fullNameNepali || "--"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-500 block">
                                      NATIONAL CITIZEN IDENTIFICATION (NID)
                                    </span>
                                    <span className="text-slate-200 font-extrabold">
                                      {voter.nationalID || "Not Bound"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-500 block">
                                      DATE OF BIRTH / GENDER
                                    </span>
                                    <span className="text-slate-200 font-extrabold">
                                      {voter.dob} / {voter.gender}
                                    </span>
                                  </div>
                                  <div className="col-span-2 border-t border-slate-800/40 pt-2">
                                    <span className="text-[9px] text-slate-500 block">
                                      PERMANENT ADDRESS REGISTER
                                    </span>
                                    <span className="text-slate-200 font-extrabold font-sans text-xs">
                                      {profile?.permStreetAddress ||
                                        profile?.permanentAddress ||
                                        "N/A"}
                                      {profile?.permTole
                                        ? `, ${profile.permTole}`
                                        : ""}
                                      {profile?.permWardNumber
                                        ? `, Ward ${profile.permWardNumber}`
                                        : ""}
                                      {profile?.permMunicipality
                                        ? `, ${profile.permMunicipality}`
                                        : ""}
                                      {profile?.permDistrict
                                        ? `, ${profile.permDistrict}`
                                        : ""}
                                      {profile?.permProvince
                                        ? `, ${profile.permProvince}`
                                        : ""}
                                      {profile?.permCountry
                                        ? `, ${profile.permCountry}`
                                        : ""}
                                    </span>
                                  </div>
                                  <div className="col-span-2 border-t border-slate-800/40 pt-2">
                                    <span className="text-[9px] text-slate-500 block">
                                      TEMPORARY CORRESPONDENCE ADDRESS
                                    </span>
                                    <span className="text-slate-200 font-extrabold font-sans text-xs">
                                      {profile?.temporaryAddress ||
                                        "Identical to Permanent address"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Documents Scan Area */}
                              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                                  <FileText className="w-4 h-4 text-emerald-400" />
                                  <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                                    Citizenship & Passport Credentials
                                  </h5>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                                  <div>
                                    <span className="text-[9px] text-slate-500 block text-slate-500">
                                      DOCUMENT SPECIFICATION TYPE:
                                    </span>
                                    <span className="text-slate-200 font-extrabold">
                                      {doc?.docType ||
                                        "Citizenship Certificate"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-500 block text-slate-500">
                                      ISSUE DOCUMENT SERIAL CODE:
                                    </span>
                                    <span className="text-slate-200 font-extrabold">
                                      {doc?.docNumber || "N/A"}
                                    </span>
                                  </div>

                                  {/* Front Image preview */}
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] text-slate-500 block uppercase">
                                      Document Scan (Front Facing)
                                    </span>
                                    <div className="aspect-[4/3] bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden relative group">
                                      {doc?.docFrontImage ? (
                                        <img
                                          src={doc.docFrontImage}
                                          alt="Document Front"
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <div className="flex items-center justify-center h-full text-slate-600 font-mono text-[10px]">
                                          No Scan Attached
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Back Image preview */}
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] text-slate-500 block uppercase">
                                      Document Scan (Rear Facing)
                                    </span>
                                    <div className="aspect-[4/3] bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden relative group">
                                      {doc?.docBackImage ? (
                                        <img
                                          src={doc.docBackImage}
                                          alt="Document Back"
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <div className="flex items-center justify-center h-full text-slate-600 font-mono text-[10px]">
                                          No Scan Attached
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Signature preview */}
                                  <div className="sm:col-span-2 border-t border-slate-800/40 pt-4 space-y-1.5">
                                    <span className="text-[9px] text-slate-500 block uppercase">
                                      Official High-Contrast Signature Record
                                    </span>
                                    <div className="h-24 bg-white/5 border border-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center p-2">
                                      {doc?.signatureImage ? (
                                        <img
                                          src={doc.signatureImage}
                                          alt="Official Signature Record"
                                          referrerPolicy="no-referrer"
                                          className="h-full object-contain invert"
                                        />
                                      ) : (
                                        <span className="text-[10px] text-slate-600">
                                          No Signature Record bound
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="py-20 flex items-center justify-center text-slate-500 font-mono">
                        No data loadable for target id
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
