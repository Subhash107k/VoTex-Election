import React, { useEffect, useMemo, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileCard from "./ProfileCard";
import SummarySidebar from "./SummarySidebar";
import DocumentGallery from "./DocumentGallery";
import ElectionList from "../elections/ElectionList";
import FaceVerification from "../../pages/FaceVerification";
import FamilyTable from "./FamilyTable";
import Timeline from "./Timeline";
import DocumentViewerModal from "./DocumentViewerModal";
import ComprehensiveProfile from "./ComprehensiveProfile";
import DashboardStatsCards from "./DashboardStatsCards";
import DashboardHeroBanner from "./DashboardHeroBanner";
import VoterDashboardHeader from "./VoterDashboardHeader";
import useProfile from "../../hooks/useProfile";
import { getElections, getLocalVoteReceipts, getVotingStatus } from "../../services/electionService";
import {
  User,
  FileText,
  RefreshCw,
  Activity,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Vote,
  ShieldCheck,
  Eye,
  Edit,
  X,
  AlertTriangle,
  Lock,
} from "lucide-react";
import type { ThemeMode } from "../../types/auth";

export default function VoterDashboard({
  token,
  user,
  onLogout,
  setCurrentPath,
  theme,
  setTheme,
}: {
  token: string;
  user?: any;
  onLogout: () => void;
  setCurrentPath: (path: string) => void;
  theme?: ThemeMode;
  setTheme?: (t: ThemeMode) => void;
}) {
  const { profile, loading, error, reload } = useProfile(token);
  const [activeElections, setActiveElections] = useState<any[]>([]);
  const [votedElectionIds, setVotedElectionIds] = useState<Set<string>>(new Set());

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showProfileDossier, setShowProfileDossier] = useState(false);
  const [currentElection, setCurrentElection] = useState<any | null>(null);
  const [currentCandidate, setCurrentCandidate] = useState<any | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "overview" | "elections" | "myVotes" | "documents" | "family" | "timeline"
  >("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real active elections & voting status on mount
  useEffect(() => {
    let active = true;
    const fetchElectionsAndStatus = async () => {
      try {
        const items = await getElections(token);
        if (!active) return;
        const activeOnly = items.filter((e: any) => e.status === "Active" || e.active === true);
        setActiveElections(activeOnly);

        // Load receipts and server voted status
        const receipts = getLocalVoteReceipts();
        const votedSet = new Set(receipts.map((r: any) => r.electionId));
        try {
          const serverVoted = await getVotingStatus(token);
          serverVoted.forEach((id: string) => votedSet.add(id));
        } catch {
          // ignore
        }
        if (active) {
          setVotedElectionIds(votedSet);
        }
      } catch (err) {
        console.error("Failed to load elections", err);
      }
    };
    void fetchElectionsAndStatus();
    return () => {
      active = false;
    };
  }, [token]);

  const safeProfile = profile || {
    user: user || null,
    profile: user || {},
    documents: [],
    family: [],
    audit: [],
    timeline: [],
    status: user?.accountStatus || "Pending",
    verificationStatus: user?.accountStatus || "Pending",
    createdAt: user?.createdAt || new Date().toISOString(),
    updatedAt: user?.updatedAt || user?.createdAt || new Date().toISOString(),
    completion: user?.profileCompletionPercent || 100,
  };

  const fallbackDocuments = useMemo(() => {
    const dbDocs = Array.isArray(safeProfile?.documents) ? safeProfile.documents : [];
    const profileSource = safeProfile?.profile || safeProfile || {};
    const documentSource = safeProfile?.document || {};
    const items: any[] = [...dbDocs];
    const existingLabels = new Set(items.map((d: any) => d?.label || d?.id));

    const addDocument = (url?: string, label?: string, extra: any = {}) => {
      if (!url || !label || existingLabels.has(label)) return;
      existingLabels.add(label);
      items.push({
        id: `${label}-${items.length}`,
        url,
        label,
        ...extra,
      });
    };

    addDocument(
      profileSource.faceImage ||
        user?.faceImage ||
        profileSource.profilePhoto ||
        user?.profilePhoto ||
        user?.profilePicture,
      "Live Face Capture Scan",
      {
        uploadedAt: documentSource.createdAt || profileSource.createdAt || user?.createdAt,
        verificationStatus: documentSource.verificationStatus || profileSource.verificationStatus || "Verified",
      },
    );

    addDocument(
      profileSource.citizenshipFrontImage || documentSource.citizenshipFrontImage,
      "Citizenship (Front)",
      {
        documentNumber: profileSource.citizenshipNumber || documentSource.citizenshipNumber || user?.nationalID,
        issueDate: profileSource.citizenshipIssueDate || documentSource.issueDate,
        uploadedAt: documentSource.createdAt || profileSource.createdAt || user?.createdAt,
        verificationStatus: documentSource.verificationStatus || profileSource.verificationStatus || "Verified",
      },
    );

    addDocument(
      profileSource.citizenshipBackImage || documentSource.citizenshipBackImage,
      "Citizenship (Back)",
      {
        documentNumber: profileSource.citizenshipNumber || documentSource.citizenshipNumber || user?.nationalID,
        issueDate: profileSource.citizenshipIssueDate || documentSource.issueDate,
        uploadedAt: documentSource.createdAt || profileSource.createdAt || user?.createdAt,
        verificationStatus: documentSource.verificationStatus || profileSource.verificationStatus || "Verified",
      },
    );

    addDocument(
      profileSource.nidFrontImage || documentSource.nidFrontImage,
      "National ID (Front)",
      {
        documentNumber: profileSource.nidNumber || user?.nationalID,
        issueDate: profileSource.nidIssueDate || documentSource.issueDate,
        uploadedAt: documentSource.createdAt || profileSource.createdAt || user?.createdAt,
        verificationStatus: documentSource.verificationStatus || profileSource.verificationStatus || "Verified",
      },
    );

    addDocument(
      profileSource.voterCardImage || documentSource.voterCardImage,
      "Voter ID Card",
      {
        uploadedAt: documentSource.createdAt || profileSource.createdAt || user?.createdAt,
        verificationStatus: documentSource.verificationStatus || profileSource.verificationStatus || "Verified",
      },
    );

    return items;
  }, [safeProfile, user]);

  const renderProfile = {
    ...safeProfile,
    documents: fallbackDocuments,
    family: safeProfile?.family?.length
      ? safeProfile.family
      : Array.isArray(safeProfile?.profile?.familyMembers)
      ? safeProfile.profile.familyMembers.map((member: any, index: number) => ({
          id: member?.id || member?._id || `${user?.id || "user"}-family-${index}`,
          name: member?.name || member?.fullName || "Family Member",
          relation: member?.relation || member?.relationship || "Other",
          relationship: member?.relationship || member?.relation || "Other",
          ...member,
        }))
      : [],
  };

  const primaryElection = activeElections[0] || null;
  const userHasVoted = primaryElection ? votedElectionIds.has(primaryElection.id) : false;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reload();
    try {
      const items = await getElections(token);
      setActiveElections(items.filter((e: any) => e.status === "Active" || e.active === true));
    } catch {
      // ignore
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleDownload = async (url?: string, name?: string) => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (name || "document") + "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const handleDownloadAll = () => {
    (renderProfile?.documents || []).forEach((d: any) => {
      if (d?.url) handleDownload(d.url, d.label || d.id);
    });
  };

  const handleEditProfile = () => {
    setCurrentPath("/profile/edit");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-slate-300 animate-pulse">
            Syncing voter election dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Dashboard Sync Error</h3>
              <p className="text-xs text-slate-400">Network connection or authentication token retry required</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mb-5 leading-relaxed">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans transition-colors selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Header */}
      <VoterDashboardHeader
        user={user}
        onLogout={onLogout}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentPath="/votexDashboard"
        setCurrentPath={setCurrentPath}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Priority 1 & 2 — Hero Welcome & Active Election Status Banner */}
        <DashboardHeroBanner
          user={user}
          activeElection={primaryElection}
          hasVoted={userHasVoted}
          onVoteClick={() => setActiveTab("elections")}
          onVerifyClick={handleEditProfile}
        />

        {/* Real-time National & Voter Statistics */}
        <DashboardStatsCards token={token} user={user} />

        {/* Enhanced Priority Workflow Tab Selector */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 p-2 backdrop-blur-2xl shadow-xl shadow-slate-950/50">
          {/* Subtle Ambient Background Gradient Line */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              {
                id: "overview",
                label: "Overview & Verification",
                icon: User,
                badge: user?.isVerified ? "Verified" : "Pending",
                badgeColor: user?.isVerified
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30",
              },
              {
                id: "elections",
                label: "Active Elections & Candidates",
                icon: Activity,
                badge: activeElections.length > 0 ? "Live" : "0",
                badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                isLive: activeElections.length > 0,
              },
              {
                id: "myVotes",
                label: "My Ballots & Receipts",
                icon: CheckCircle2,
                badge: votedElectionIds.size > 0 ? `${votedElectionIds.size} Sealed` : undefined,
                badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
              },
              {
                id: "documents",
                label: "Documents Vault",
                icon: FileText,
                badge: `${renderProfile?.documents?.length || 0}`,
                badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
              },
              {
                id: "family",
                label: "Family & Audit History",
                icon: Users,
              },
              {
                id: "timeline",
                label: "Timeline History",
                icon: Clock,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02] ring-1 ring-blue-400/40"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 hover:scale-[1.01] active:scale-[0.98]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform duration-300 ${
                      active ? "text-white scale-110" : "text-slate-400 group-hover:text-blue-400 group-hover:scale-110"
                    }`}
                  />
                  <span>{tab.label}</span>

                  {tab.badge && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                        active
                          ? "bg-white/20 text-white border-white/30"
                          : `${tab.badgeColor}`
                      }`}
                    >
                      {tab.isLive && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                      )}
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column */}
          <section className="lg:col-span-2 space-y-6">
            {/* Overview Tab Content */}
            {activeTab === "overview" && (
              <>
                <ProfileHeader
                  profile={renderProfile}
                  onEditProfile={handleEditProfile}
                  onDownloadPdf={handleDownloadAll}
                  onPrint={() => window.print()}
                />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-2">
                    <ProfileCard profile={renderProfile} />
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Identity Verification
                        </span>
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Full Biometric Dossier</h4>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        Inspect every stored personal field, document status, address, and verification timeline.
                      </p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowProfileDossier(true)}
                        className="w-full py-2.5 px-3 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" /> View Full Profile Dossier
                      </button>
                      <button
                        type="button"
                        onClick={handleEditProfile}
                        className="w-full py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" /> Edit Profile Settings
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Elections & Candidates Tab */}
            {activeTab === "elections" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xl text-white tracking-tight">
                    Active Elections & Approved Candidates
                  </h3>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    Live Polling Open
                  </span>
                </div>

                <ElectionList
                  token={token}
                  user={user}
                  onVote={(e: any, c: any) => {
                    setCurrentElection(e);
                    setCurrentCandidate(c);
                    setShowFaceModal(true);
                  }}
                />
              </div>
            )}

            {/* My Votes & Receipts Tab */}
            {activeTab === "myVotes" && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <Vote className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      Digital Ballot Receipts & Verification Log
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cryptographically sealed anonymous vote receipts logged in real-time.
                    </p>
                  </div>
                </div>

                {(() => {
                  const rawReceipts = getLocalVoteReceipts();
                  const seen = new Set();
                  const receipts = rawReceipts.filter((r: any) => {
                    const key = r.electionId || r.receiptId;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });

                  if (receipts.length === 0) {
                    return (
                      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-10 text-center space-y-3">
                        <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                          <Vote className="h-8 w-8" />
                        </div>
                        <h4 className="text-base font-bold text-white">
                          No Digital Receipts Logged Yet
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                          When you select a candidate and complete live face verification,
                          your cryptographically sealed anonymous SHA-256 vote receipt will be permanently logged here.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {receipts.map((r: any) => (
                        <div
                          key={r.receiptId}
                          className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-slate-950 p-6 space-y-4 shadow-xl backdrop-blur-xl"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-emerald-400">
                                <CheckCircle2 className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-black text-base text-white">
                                  {r.electionTitle}
                                </h4>
                                <p className="text-xs text-blue-400 font-bold mt-0.5">
                                  Nominee Choice: <span className="text-white">{r.candidateName}</span> ({r.candidateParty})
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-400">
                              <ShieldCheck className="h-3.5 w-3.5" /> Cryptographically Sealed
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                            <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3">
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">
                                Receipt ID
                              </span>
                              <span className="font-mono text-slate-200 text-xs font-bold mt-0.5 block">
                                {r.receiptId}
                              </span>
                            </div>

                            <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3">
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">
                                Anonymous Voter SHA-256 Hash
                              </span>
                              <span className="font-mono text-emerald-400 text-xs truncate block mt-0.5">
                                {r.anonymousVoterHash}
                              </span>
                            </div>

                            <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3">
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">
                                Verification Timestamp
                              </span>
                              <span className="text-slate-300 font-semibold text-xs mt-0.5 block">
                                {new Date(r.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3">
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">
                                Digital RSA Signature
                              </span>
                              <span className="font-mono text-blue-400 text-xs truncate block mt-0.5">
                                {r.signature}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Documents Vault Tab */}
            {activeTab === "documents" && (
              <DocumentGallery
                documents={renderProfile?.documents || []}
                onView={(u?: string) => setViewerUrl(u || null)}
                onDownload={handleDownload}
              />
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <Timeline items={safeProfile?.timeline || []} />
            )}

            {/* Family & Audit Tab */}
            {activeTab === "family" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <FamilyTable family={renderProfile?.family || []} />
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <Activity className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-white text-sm">
                      Security Audit History
                    </h3>
                  </div>

                  {(safeProfile?.audit || []).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">
                        No audit security violations detected
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[340px] overflow-y-auto">
                      {safeProfile.audit.map((a: any) => (
                        <div
                          key={a.id}
                          className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                        >
                          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                            <Activity className="h-4 w-4 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-200">
                              {a.action}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              By {a.by || "System"}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(a.at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right Summary Sidebar Column */}
          <aside className="lg:col-span-1">
            <SummarySidebar
              profile={renderProfile}
              onEdit={handleEditProfile}
              onDownloadAll={handleDownloadAll}
            />
          </aside>
        </div>
      </main>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        open={!!viewerUrl}
        url={viewerUrl}
        onClose={() => setViewerUrl(null)}
      />

      {/* Full Profile Dossier Modal */}
      {showProfileDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowProfileDossier(false)}
              className="absolute top-5 right-5 p-2 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <ComprehensiveProfile token={token} user={user} />
          </div>
        </div>
      )}

      {/* Live Face Verification Modal for Voting */}
      {showFaceModal && currentElection && currentCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-lg text-white">
                  Real-time Face Verification & Ballot Submission
                </h4>
                <p className="text-xs text-slate-400">
                  Target Candidate:{" "}
                  <span className="font-semibold text-blue-400">
                    {currentCandidate.fullName || currentCandidate.label || currentCandidate.name}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFaceModal(false)}
                className="p-2 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <FaceVerification
              token={token}
              electionId={currentElection.id}
              candidateLabel={currentCandidate.fullName || currentCandidate.label || currentCandidate.name}
              onBack={() => setShowFaceModal(false)}
              onVerified={async (result: any) => {
                setVerificationResult(result);
                setShowFaceModal(false);
                setShowConfirmModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Voter Confirmation Modal — Review & Submit Vote */}
      {showConfirmModal && verificationResult && currentElection && currentCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl relative space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">Review & Confirm Your Vote</h4>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    ✓ Identity Verified — Ready to Submit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) {
                    setShowConfirmModal(false);
                    setVerificationResult(null);
                  }
                }}
                disabled={isSubmitting}
                className="p-2 rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Election & Candidate Details */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Election</span>
                <span className="font-black text-white">
                  {currentElection.title || currentElection.name || currentElection.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Selected Candidate</span>
                <span className="font-black text-blue-400">
                  {currentCandidate.fullName || currentCandidate.label || currentCandidate.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Face Match Score</span>
                <span className="font-black text-emerald-400">
                  {Math.round(
                    verificationResult.similarityScore <= 1
                      ? verificationResult.similarityScore * 100
                      : verificationResult.similarityScore
                  )}% Matched
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Min. Threshold</span>
                <span className="font-black text-slate-300">60%</span>
              </div>
            </div>

            {/* Captured Live Image */}
            {verificationResult.capturedImage && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-3">
                <img
                  src={verificationResult.capturedImage}
                  alt="Verified Live Capture"
                  className="h-16 w-16 rounded-xl object-cover border border-emerald-500/30 shrink-0"
                />
                <div className="text-xs">
                  <p className="font-black text-white">Live Verification Capture</p>
                  <p className="text-slate-400 mt-0.5">Captured during face verification</p>
                  <p className="text-emerald-400 font-semibold mt-1">✓ Identity Confirmed</p>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-relaxed">
                <strong>This action is irreversible.</strong> Once submitted, your ballot cannot be changed or withdrawn. Please confirm your candidate selection carefully.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) {
                    setShowConfirmModal(false);
                    setVerificationResult(null);
                  }
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-40 cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="confirm-submit-vote-btn"
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    const { castVote } = await import("../../services/electionService");
                    const res = await castVote(token, {
                      electionId: currentElection.id,
                      candidateId: currentCandidate.id,
                      faceVerificationId: verificationResult.verificationId,
                    });
                    setShowConfirmModal(false);
                    setVerificationResult(null);
                    setCurrentElection(null);
                    setCurrentCandidate(null);
                    if (res?.receipt) {
                      setLatestReceipt(res.receipt);
                    }
                    setVotedElectionIds((prev) => new Set([...prev, currentElection.id]));
                    setActiveTab("myVotes");
                    void reload();
                  } catch (err: any) {
                    console.error(err);
                    setShowConfirmModal(false);
                    setVerificationResult(null);
                    alert(err?.message || "Failed to cast vote. Please try again.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className={`flex-2 flex-1 py-3 rounded-2xl font-black text-xs text-white transition-all cursor-pointer ${
                  isSubmitting
                    ? "bg-emerald-700 cursor-wait opacity-70"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 active:scale-95"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Submitting Ballot…
                  </span>
                ) : (
                  "✓ Confirm & Submit Vote"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Successful Vote Receipt Confirmation Modal */}
      {latestReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-slate-950 p-6 shadow-2xl relative space-y-6 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Digital Ballot Sealed & Cast!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your vote was authenticated via real-time face verification.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Election:</span>
                <span className="font-bold text-white">{latestReceipt.electionTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Candidate:</span>
                <span className="font-bold text-blue-400">{latestReceipt.candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt ID:</span>
                <span className="font-mono text-slate-300">{latestReceipt.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Anonymous Voter Hash:</span>
                <span className="font-mono text-emerald-400 text-[11px] truncate max-w-[200px]">
                  {latestReceipt.anonymousVoterHash}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLatestReceipt(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Done & View Receipts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
