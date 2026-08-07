import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AuditLog,
  Candidate,
  DashboardStats,
  Election,
  Faq,
  NewsletterSubscriber,
  Notification,
  PoliticalParty,
  User,
} from "../types.js";
import { useRealTimeSync } from "./useRealTimeSync.js";

export type AdminTab =
  | "dashboard"
  | "elections"
  | "candidates"
  | "voters"
  | "parties"
  | "votes"
  | "reports"
  | "notifications"
  | "newsletter"
  | "settings"
  | "analytics";

interface UseAdminOptions {
  token: string;
}

interface ElectionFormValues {
  id?: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  maxVotes: number;
}

interface CandidateFormValues {
  id?: string;
  name: string;
  fullName: string;
  party: string;
  biography: string;
  electionId: string;
}

interface UseAdminResult {
  stats: DashboardStats | null;
  elections: Election[];
  candidates: Candidate[];
  notifications: Notification[];
  newsletterSubscribers: NewsletterSubscriber[];
  auditLogs: AuditLog[];
  voters: User[];
  loading: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: AdminTab;
  setActiveTab: React.Dispatch<React.SetStateAction<AdminTab>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  smtpForm: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
  };
  setSmtpForm: React.Dispatch<
    React.SetStateAction<{
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPass: string;
    }>
  >;
  twilioForm: { twilioSid: string; twilioToken: string; twilioFrom: string };
  setTwilioForm: React.Dispatch<
    React.SetStateAction<{
      twilioSid: string;
      twilioToken: string;
      twilioFrom: string;
    }>
  >;
  successMsg: string;
  errorMsg: string;
  fetchData: () => Promise<void>;
  handleCreateOrUpdateElection: (payload: ElectionFormValues) => Promise<void>;
  handleDeleteElection: (id: string) => Promise<void>;
  handleToggleElectionStatus: (
    election: Election,
    nextStatus: "Draft" | "Active" | "Closed" | "Published",
  ) => Promise<void>;
  handleCreateOrUpdateCandidate: (
    payload: CandidateFormValues,
  ) => Promise<void>;
  handleDeleteCandidate: (id: string) => Promise<void>;
  handleVerifyCandidate: (
    candidateId: string,
    status: "Verified" | "Rejected" | "Withdrawn" | "Pending",
  ) => Promise<void>;
  handlePublishAnnouncement: (payload: {
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "alert";
  }) => Promise<void>;
  handleUpdateNewsletterStatus: (
    subscriberId: string,
    status: "Active" | "Inactive" | "Pending",
  ) => Promise<void>;
  handleDeleteNewsletterSubscriber: (subscriberId: string) => Promise<void>;
  handleUpdateVoterStatus: (
    voterId: string,
    payload: {
      isApproved?: boolean;
      isVerified?: boolean;
      isSuspended?: boolean;
      accountStatus?: string;
      rejectionReason?: string;
      requestedChangesFields?: string[];
    },
  ) => Promise<void>;
  handleSaveSystemConfig: (payload: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    twilioSid: string;
    twilioToken: string;
    twilioFrom: string;
  }) => Promise<void>;
  parties: PoliticalParty[];
  faqs: Faq[];
  team: User[];
}

function normalizeElectionDate(value: string, fallback?: string) {
  const candidate = value?.trim() || fallback || new Date().toISOString();
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime())
    ? new Date(fallback || Date.now()).toISOString()
    : parsed.toISOString();
}

export function useAdmin({ token }: UseAdminOptions): UseAdminResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [voters, setVoters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
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
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<
    NewsletterSubscriber[]
  >([]);

  const triggerToast = useCallback((message: string, isError = false) => {
    if (isError) {
      setErrorMsg(message);
      window.setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setSuccessMsg(message);
      window.setTimeout(() => setSuccessMsg(""), 4000);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [
        statsRes,
        electRes,
        candRes,
        notifRes,
        newsletterRes,
        auditRes,
        votersRes,
        configRes,
        faqsRes,
        teamRes,
        partiesRes,
      ] = await Promise.all([
        fetch("/api/dashboard/stats", { headers }),
        fetch("/api/elections", { headers }),
        fetch("/api/candidates?includePending=true", { headers }),
        fetch("/api/notifications", { headers }),
        fetch("/api/admin/newsletter", { headers }),
        fetch("/api/audit-logs", { headers }),
        fetch("/api/voters", { headers }),
        fetch("/api/system/config", { headers }),
        fetch("/api/faqs", { headers }),
        fetch("/api/admin/team", { headers }),
        fetch("/api/parties", { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        setAuditLogs(statsData.recentLogs || []);
      }
      if (electRes.ok) {
        const electData = await electRes.json();
        setElections(electData.elections || []);
      }
      if (candRes.ok) {
        const candData = await candRes.json();
        setCandidates(candData.candidates || []);
      }
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }
      if (newsletterRes.ok) {
        const newsletterData = await newsletterRes.json();
        setNewsletterSubscribers(newsletterData.subscribers || []);
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }
      if (votersRes.ok) {
        const votersData = await votersRes.json();
        setVoters(votersData.voters || []);
      }
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.config) {
          setSmtpForm({
            smtpHost: configData.config.smtpHost || "",
            smtpPort: configData.config.smtpPort || 587,
            smtpUser: configData.config.smtpUser || "",
            smtpPass: "••••••••••••••",
          });
          setTwilioForm({
            twilioSid: configData.config.twilioSid || "",
            twilioToken: configData.config.twilioToken || "",
            twilioFrom: configData.config.twilioFrom || "",
          });
        }
      }
      if (faqsRes.ok) {
        const faqsData = await faqsRes.json();
        setFaqs(faqsData.faqs || []);
      }
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeam(teamData.team || []);
      }
      if (partiesRes.ok) {
        const partiesData = await partiesRes.json();
        setParties(partiesData.parties || []);
      }
    } catch (error) {
      console.error(error);
      triggerToast("Failed to synchronize admin dashboard records.", true);
    } finally {
      setLoading(false);
    }
  }, [token, triggerToast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Listen to real-time events and refresh admin data
  useRealTimeSync({ onRefresh: fetchData, token });

  const handleCreateOrUpdateElection = useCallback(
    async (payload: ElectionFormValues) => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const url = payload.id
          ? `/api/elections/${payload.id}`
          : "/api/elections";
        const method = payload.id ? "PUT" : "POST";

        const bodyData = {
          ...payload,
          startDate: normalizeElectionDate(
            payload.startDate,
            new Date().toISOString(),
          ),
          endDate: normalizeElectionDate(
            payload.endDate,
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ),
        };

        const res = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(bodyData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Election update failed");
        }
        triggerToast(
          payload.id
            ? "Election updated successfully."
            : "Election created successfully.",
        );
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error ? error.message : "Election update failed.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleDeleteElection = useCallback(
    async (id: string) => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`/api/elections/${id}`, {
          method: "DELETE",
          headers,
        });
        if (!res.ok) throw new Error("Deletion failed");
        triggerToast("Election deleted successfully.");
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error ? error.message : "Deletion failed.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleToggleElectionStatus = useCallback(
    async (
      election: Election,
      nextStatus: "Draft" | "Active" | "Closed" | "Published",
    ) => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const res = await fetch(`/api/elections/${election.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) throw new Error("Status update failed");
        triggerToast(`Election updated to ${nextStatus}.`);
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error ? error.message : "Status update failed.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleCreateOrUpdateCandidate = useCallback(
    async (payload: CandidateFormValues) => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const url = payload.id
          ? `/api/candidates/${payload.id}`
          : "/api/candidates";
        const method = payload.id ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Candidate update failed");
        }
        triggerToast(
          payload.id
            ? "Candidate updated successfully."
            : "Candidate created successfully.",
        );
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error ? error.message : "Candidate update failed.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleDeleteCandidate = useCallback(
    async (id: string) => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`/api/candidates/${id}`, {
          method: "DELETE",
          headers,
        });
        if (!res.ok) throw new Error("Candidate delete failed");
        triggerToast("Candidate deleted successfully.");
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error ? error.message : "Candidate delete failed.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleVerifyCandidate = useCallback(
    async (
      candidateId: string,
      status: "Verified" | "Rejected" | "Withdrawn" | "Pending",
    ) => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const res = await fetch(`/api/candidates/${candidateId}/verify`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ status, rejectionReason: "" }),
        });
        if (!res.ok) throw new Error("Verification update failed");
        triggerToast(`Candidate marked as ${status}.`);
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error
            ? error.message
            : "Verification update failed.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handlePublishAnnouncement = useCallback(
    async (payload: {
      title: string;
      message: string;
      type: "info" | "success" | "warning" | "alert";
    }) => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const res = await fetch("/api/notifications", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Announcement dispatch failed");
        triggerToast("Announcement published.");
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error
            ? error.message
            : "Announcement dispatch failed.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleUpdateNewsletterStatus = useCallback(
    async (subscriberId: string, status: "Active" | "Inactive" | "Pending") => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const res = await fetch(
          `/api/admin/newsletter/${subscriberId}/status`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status }),
          },
        );
        if (!res.ok) throw new Error("Unable to update newsletter status");
        triggerToast(`Newsletter subscriber marked as ${status}.`);
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error
            ? error.message
            : "Unable to update newsletter status.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleDeleteNewsletterSubscriber = useCallback(
    async (subscriberId: string) => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`/api/admin/newsletter/${subscriberId}`, {
          method: "DELETE",
          headers,
        });
        if (!res.ok) throw new Error("Unable to delete subscriber");
        triggerToast("Newsletter subscriber removed.");
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error
            ? error.message
            : "Unable to delete subscriber.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleUpdateVoterStatus = useCallback(
    async (
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
          throw new Error(err.error || "Unable to update voter status");
        }
        triggerToast("Voter status updated.");
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error
            ? error.message
            : "Unable to update voter status.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  const handleSaveSystemConfig = useCallback(
    async (payload: {
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPass: string;
      twilioSid: string;
      twilioToken: string;
      twilioFrom: string;
    }) => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const res = await fetch("/api/system/config", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Unable to save configuration");
        }
        triggerToast("System configuration saved.");
        await fetchData();
      } catch (error) {
        triggerToast(
          error instanceof Error
            ? error.message
            : "Unable to save configuration.",
          true,
        );
      }
    },
    [fetchData, token, triggerToast],
  );

  return useMemo(
    () => ({
      stats,
      elections,
      candidates,
      notifications,
      newsletterSubscribers,
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
      successMsg,
      errorMsg,
      fetchData,
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
      handleSaveSystemConfig,
      parties,
      faqs,
      team,
    }),
    [
      stats,
      elections,
      candidates,
      notifications,
      newsletterSubscribers,
      auditLogs,
      voters,
      loading,
      sidebarCollapsed,
      activeTab,
      searchQuery,
      smtpForm,
      twilioForm,
      successMsg,
      errorMsg,
      fetchData,
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
      handleSaveSystemConfig,
      parties,
      faqs,
      team,
    ],
  );
}
