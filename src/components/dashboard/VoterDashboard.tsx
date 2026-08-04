import React, { useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileCard from "./ProfileCard";
import SummarySidebar from "./SummarySidebar";
import DocumentGallery from "./DocumentGallery";
import ElectionList from "../elections/ElectionList";
import FaceVerification from "../../pages/FaceVerification";
import FamilyTable from "./FamilyTable";
import Timeline from "./Timeline";
import DocumentViewerModal from "./DocumentViewerModal";
import useProfile from "../../hooks/useProfile";
import {
  Bell,
  LogOut,
  Shield,
  User,
  FileText,
  RefreshCw,
  Menu,
  X,
  Activity,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function VoterDashboard({
  token,
  user,
  onLogout,
  setCurrentPath,
}: {
  token: string;
  user?: any;
  onLogout: () => void;
  setCurrentPath: (path: string) => void;
}) {
  const { profile, loading, error, reload } = useProfile(token);
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
    completion: user?.profileCompletionPercent || 0,
  };
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [currentElection, setCurrentElection] = useState<any | null>(null);
  const [currentCandidate, setCurrentCandidate] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "family" | "timeline" | "elections" | "myVotes"
  >("overview");
  const notificationCount = 3;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reload();
    setTimeout(() => setIsRefreshing(false), 1000);
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
    (profile?.documents || []).forEach((d: any) => {
      if (d?.url) handleDownload(d.url, d.label || d.id);
    });
  };

  const handleEditProfile = () => {
    setCurrentPath("/profile/edit");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">
            Loading your digital identity...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-lg text-red-800 dark:text-red-300">
                Authentication Error
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-slate-700 dark:text-slate-300 font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <div className="font-bold text-lg text-slate-800 dark:text-white leading-tight">
                    National Digital Identity
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Government Portal
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                )}
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setActiveTab("elections")}
                className={`px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium ${
                  activeTab === "elections"
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Elections
              </button>

              <button
                onClick={() => setActiveTab("myVotes")}
                className={`px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium ${
                  activeTab === "myVotes"
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                My Votes
              </button>

              <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {notificationCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleRefresh}
                className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group ${isRefreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors" />
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
              >
                <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  Sign Out
                </span>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-slate-200 dark:border-slate-700 py-3 space-y-2">
              <div className="flex items-center justify-between px-2">
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={handleRefresh}
                    className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isRefreshing ? "animate-spin" : ""}`}
                  >
                    <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Sign Out
                </span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Mobile Tab Navigation */}
        <div className="lg:hidden mb-6 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-6 gap-1">
            {[
              { id: "overview", label: "Overview", icon: User },
              { id: "documents", label: "Docs", icon: FileText },
              { id: "family", label: "Family", icon: Users },
              { id: "timeline", label: "History", icon: Clock },
              { id: "elections", label: "Elections", icon: Activity },
              { id: "myVotes", label: "My Votes", icon: CheckCircle2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                  activeTab === tab.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <section
            className={`lg:col-span-2 space-y-6 ${activeTab !== "overview" ? "hidden lg:block" : ""}`}
          >
            <ProfileHeader profile={safeProfile} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <ProfileCard profile={safeProfile} />
              </div>
            </div>

            {activeTab === "elections" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-3">
                  Elections
                </h3>
                <ElectionList
                  token={token}
                  onVote={(e: any, c: any) => {
                    setCurrentElection(e);
                    setCurrentCandidate(c);
                    setShowFaceModal(true);
                  }}
                />
              </div>
            )}

            {activeTab === "myVotes" && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-3">
                  My Votes
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your voting history and receipts will appear here.
                </p>
              </div>
            )}

            <div
              className={`${activeTab === "documents" ? "block" : "hidden lg:block"}`}
            >
              <DocumentGallery
                documents={safeProfile?.documents || []}
                onView={(u?: string) => setViewerUrl(u || null)}
                onDownload={handleDownload}
              />
            </div>

            <div
              className={`${activeTab === "timeline" ? "block" : "hidden lg:block"}`}
            >
              <Timeline items={safeProfile?.timeline || []} />
            </div>

            <div
              className={`${activeTab === "family" ? "block" : "hidden lg:block"}`}
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <FamilyTable family={safeProfile?.family || []} />
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      Audit History
                    </h3>
                  </div>
                  {(safeProfile?.audit || []).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No audit records found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeProfile.audit.map((a: any) => (
                        <div
                          key={a.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {a.action}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              By {a.by || "System"}
                            </p>
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {new Date(a.at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <SummarySidebar
              profile={profile}
              onEdit={handleEditProfile}
              onDownloadAll={handleDownloadAll}
            />
          </aside>
        </div>
      </main>

      <DocumentViewerModal
        open={!!viewerUrl}
        url={viewerUrl}
        onClose={() => setViewerUrl(null)}
      />

      {showFaceModal && currentElection && currentCandidate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Verify and Cast Vote</h4>
              <button
                onClick={() => setShowFaceModal(false)}
                className="text-slate-500"
              >
                Close
              </button>
            </div>
            <FaceVerification
              token={token}
              electionId={currentElection.id}
              candidateLabel={currentCandidate.label}
              onBack={() => setShowFaceModal(false)}
              onVerified={async (result: any) => {
                try {
                  // Call vote endpoint
                  const { castVote } =
                    await import("../../services/electionService");
                  await castVote(token, {
                    electionId: currentElection.id,
                    candidateId: currentCandidate.id,
                    faceVerificationId: result.verificationId,
                  });
                  setShowFaceModal(false);
                  alert("Vote cast successfully.");
                } catch (err: any) {
                  console.error(err);
                  alert(err?.message || "Failed to cast vote.");
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
