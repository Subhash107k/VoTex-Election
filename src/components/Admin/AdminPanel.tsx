import { useState, type FormEvent } from "react";
import { BellRing, Sparkles } from "lucide-react";
import type { ThemeMode } from "../../types/auth.ts";
import AdminSidebar from "./Sidebar/AdminSidebar.tsx";
import AdminTopbar from "./Shared/AdminTopbar.tsx";
import DashboardPage from "../../pages/Admin/Dashboard/Dashboard.tsx";
import ElectionsPage from "../../pages/Admin/Elections/ElectionsPage.tsx";
import CandidatesPage from "../../pages/Admin/Candidates/CandidatesPage.tsx";
import VotersPage from "../../pages/Admin/Voters/VotersPage.tsx";
import AdminPasswordsPage from "../../pages/Admin/AdminPasswords/AdminPasswordsPage.tsx";
import PartiesPage from "../../pages/Admin/Parties/PartiesPage.tsx";
import ReportsPage from "../../pages/Admin/Reports/ReportsPage.tsx";
import NotificationsPage from "../../pages/Admin/Notifications/NotificationsPage.tsx";
import AnalyticsPage from "../../pages/Admin/Analytics/AnalyticsPage.tsx";
import NewsletterPage from "../../pages/Admin/Newsletter/NewsletterPage.tsx";
import VotesPage from "../../pages/Admin/Votes/VotesPage.tsx";
import { useAdmin } from "../../hooks/useAdmin.ts";

interface AdminPanelProps {
  token: string;
  onLogout: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel({
  token,
  onLogout,
  theme,
  setTheme,
}: AdminPanelProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    stats,
    elections,
    candidates,
    notifications,
    auditLogs,
    voters,
    loading,
    sidebarCollapsed,
    setSidebarCollapsed,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    smtpForm,
    setSmtpForm,
    twilioForm,
    setTwilioForm,
    handleCreateOrUpdateElection,
    handleDeleteElection,
    handleToggleElectionStatus,
    handleCreateOrUpdateCandidate,
    handleDeleteCandidate,
    handleVerifyCandidate,
    handlePublishAnnouncement,
    handleUpdateNewsletterStatus,
    handleDeleteNewsletterSubscriber,
    handleUpdateVoterStatus,
    handleDeleteVoter,
    handleSaveSystemConfig,
    handleChangeAdminPassword,
    parties,
    newsletterSubscribers,
    team,
    successMsg,
    errorMsg,
  } = useAdmin({ token });

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleSaveConfig = async (payload: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    twilioSid: string;
    twilioToken: string;
    twilioFrom: string;
  }) => {
    await handleSaveSystemConfig(payload);
  };

  return (
    <div className="min-h-screen bg-(--surface-page) text-(--text-primary)">
      {successMsg ? (
        <div className="fixed right-4 top-4 z-50 rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {successMsg}
        </div>
      ) : null}
      {errorMsg ? (
        <div className="fixed right-4 top-4 z-50 rounded-2xl border border-rose-200 bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {errorMsg}
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
          onLogout={onLogout}
          theme={theme}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <AdminTopbar
            theme={theme === "high-contrast" ? "dark" : theme}
            onToggleTheme={handleThemeToggle}
            onRefresh={() => window.location.reload()}
            onSearch={setSearchQuery}
            onToggleMobileMenu={() => setMobileMenuOpen(true)}
          />

          <main className="flex-1 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/70 md:p-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
              {activeTab === "dashboard" ? (
                <DashboardPage
                  stats={stats}
                  elections={elections}
                  notifications={notifications}
                  voters={voters}
                  team={team}
                  loading={loading}
                />
              ) : null}

              {activeTab === "elections" ? (
                <ElectionsPage
                  elections={elections}
                  onCreateElection={async (payload) => {
                    await handleCreateOrUpdateElection(payload);
                  }}
                  onDeleteElection={handleDeleteElection}
                  onToggleElectionStatus={handleToggleElectionStatus}
                />
              ) : null}

              {activeTab === "candidates" ? (
                <CandidatesPage
                  candidates={candidates}
                  elections={elections}
                  token={token}
                  onCreateCandidate={async (payload) => {
                    await handleCreateOrUpdateCandidate(payload);
                  }}
                  onDeleteCandidate={handleDeleteCandidate}
                  onVerifyCandidate={async (candidateId, status) => {
                    await handleVerifyCandidate(candidateId, status);
                  }}
                />
              ) : null}

              {activeTab === "voters" ? (
                <VotersPage
                  voters={voters}
                  token={token}
                  onUpdateVoterStatus={handleUpdateVoterStatus}
                  onDeleteVoter={handleDeleteVoter}
                />
              ) : null}

              {activeTab === "parties" ? (
                <PartiesPage
                  parties={parties}
                  candidates={candidates}
                  token={token}
                  onRefresh={() => window.location.reload()}
                />
              ) : null}
              {activeTab === "votes" ? (
                <VotesPage token={token} />
              ) : null}
              {activeTab === "reports" ? <ReportsPage /> : null}
              {activeTab === "notifications" ? <NotificationsPage /> : null}
              {activeTab === "newsletter" ? (
                <NewsletterPage
                  token={token}
                  subscribers={newsletterSubscribers}
                  onUpdateStatus={handleUpdateNewsletterStatus}
                  onDeleteSubscriber={handleDeleteNewsletterSubscriber}
                />
              ) : null}
              {activeTab === "admin-passwords" ? (
                <AdminPasswordsPage
                  team={team}
                  onChangeAdminPassword={handleChangeAdminPassword}
                  token={token}
                />
              ) : null}
              {activeTab === "analytics" ? <AnalyticsPage /> : null}
              {![
                "dashboard",
                "elections",
                "candidates",
                "voters",
                "parties",
                "votes",
                "reports",
                "notifications",
                "newsletter",
                "admin-passwords",
                "analytics",
              ].includes(activeTab) ? (
                <PlaceholderPage
                  title="Admin module"
                  description="Additional sections can be introduced here without changing the core shell."
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
