import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LogOut,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Upload,
  User,
  Flag,
  AlignLeft,
  Info,
  Calendar,
  Building,
  Sparkles,
  History,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  Image as ImageIcon,
  Check,
  Ban,
  X,
  Sun,
  Moon,
  Download,
  Share2,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingUp,
  Users,
  ThumbsUp,
  MessageSquare,
  BarChart3,
  Globe,
  Award,
  Clock,
  Edit3,
  Save,
  Send,
  Camera,
  Phone,
  Mail,
  Link,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ExternalLink,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PoliticalParty, Candidate, Election } from "../../types.js";
import type { ThemeMode } from "../../types/auth.ts";

interface CandidateDashboardProps {
  token: string;
  user: any;
  onLogout: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  token,
  user,
  onLogout,
  theme,
  setTheme,
}) => {
  // State Management
  const [profile, setProfile] = useState<Candidate | null>(null);
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [publicProfile, setPublicProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "analytics">(
    "edit",
  );
  const [showPublicLink, setShowPublicLink] = useState(false);

  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(
    null,
  );
  const [notifications, setNotifications] = useState<any[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    party: "",
    biography: "",
    education: "",
    experience: "",
    photoUrl: "",
    partyLogoUrl: "",
    manifestoText: "",
    electionId: "",
    phoneNumber: "",
    email: "",
    website: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
    },
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch candidate profile
      const profileRes = await fetch("/api/candidates/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();

      // Fetch parties
      const partiesRes = await fetch("/api/parties");
      const partiesData = await partiesRes.json();
      setParties(partiesData.parties || []);

      // Fetch elections
      const electionsRes = await fetch("/api/elections");
      const electionsData = await electionsRes.json();
      setElections(electionsData.elections || []);

      // Fetch analytics if profile exists
      if (profileData.candidate) {
        try {
          const analyticsRes = await fetch(
            `/api/candidates/${profileData.candidate.id}/analytics`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        } catch (e) {
          console.log("Analytics not available yet");
        }

        // Fetch public profile
        try {
          const publicRes = await fetch(
            `/api/candidates/${profileData.candidate.id}/public`,
          );
          const publicData = await publicRes.json();
          setPublicProfile(publicData);
        } catch (e) {
          console.log("Public profile not available");
        }

        setProfile(profileData.candidate);
        setFormData({
          name: profileData.candidate.name || user.fullName || "",
          party: profileData.candidate.party || "",
          biography: profileData.candidate.biography || "",
          education: profileData.candidate.education || "",
          experience: profileData.candidate.experience || "",
          photoUrl: profileData.candidate.photoUrl || "",
          partyLogoUrl: profileData.candidate.partyLogoUrl || "",
          manifestoText: profileData.candidate.manifestoText || "",
          electionId: profileData.candidate.electionId || "",
          phoneNumber: profileData.candidate.phoneNumber || user.mobile || "",
          email: profileData.candidate.email || user.email || "",
          website: profileData.candidate.website || "",
          socialLinks: profileData.candidate.socialLinks || {
            facebook: "",
            twitter: "",
            instagram: "",
            linkedin: "",
          },
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          name: user.fullName || "",
          email: user.email || "",
          phoneNumber: user.mobile || "",
        }));
      }

      // Fetch notifications
      try {
        const notifRes = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      } catch (e) {
        console.log("Notifications not loaded");
      }
    } catch (e: any) {
      triggerToast("Error loading profile data", true);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerToast = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  // Party Change Handler
  const handlePartyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPartyCode = e.target.value;
    const matchedParty = parties.find(
      (p) => p.code === selectedPartyCode || p.name === selectedPartyCode,
    );
    setFormData((prev) => ({
      ...prev,
      party: selectedPartyCode,
      partyLogoUrl: matchedParty ? matchedParty.logoUrl : prev.partyLogoUrl,
    }));
    setTouched((prev) => ({ ...prev, party: true }));
  };

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("Please upload a valid image file (JPEG/PNG)", true);
      return;
    }

    // Upload to server
    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const uploadData = await uploadRes.json();
      setFormData((prev) => ({
        ...prev,
        photoUrl: uploadData.url,
      }));
      setTouched((prev) => ({ ...prev, photoUrl: true }));
      triggerToast("Profile photo uploaded successfully!");
    } catch (err) {
      triggerToast("Failed to upload image", true);
    }
  };

  // Validation
  const isNameValid = formData.name.trim() !== "";
  const isPartyValid = formData.party !== "";
  const isElectionValid = formData.electionId !== "";
  const isPhotoValid = formData.photoUrl.trim() !== "";
  const isManifestoValid = formData.manifestoText.trim() !== "";

  const isFormValid =
    isNameValid &&
    isPartyValid &&
    isElectionValid &&
    isPhotoValid &&
    isManifestoValid;

  // Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      party: true,
      electionId: true,
      photoUrl: true,
      manifestoText: true,
    });

    if (!isFormValid) {
      triggerToast("Please fill all required fields", true);
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/candidates/profile/me", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      triggerToast("Profile saved successfully!");
      setProfile(data.candidate);
      await fetchData(); // Refresh data
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  // Copy public link
  const copyPublicLink = async () => {
    if (publicProfile?.publicUrl) {
      try {
        await navigator.clipboard.writeText(publicProfile.publicUrl);
        triggerToast("Public profile link copied!");
      } catch (err) {
        triggerToast("Failed to copy link", true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading Campaign Portal...
          </p>
        </div>
      </div>
    );
  }

  const currentStatus = profile ? profile.status || "Pending" : "Pending";
  const isVerified = currentStatus === "Verified";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border backdrop-blur-sm ${
              toast.isError
                ? "bg-red-500/90 border-red-400 text-white"
                : "bg-emerald-500/90 border-emerald-400 text-white"
            }`}
          >
            {toast.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={formData.photoUrl || user.avatar}
                  alt={formData.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-200 dark:border-blue-800"
                />
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {formData.name || "Candidate Portal"}
                  </h1>
                  <StatusBadge status={currentStatus} />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {user.email} • ID: {user.id?.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Sun className="w-5 h-5 text-slate-400" />
                )}
              </button>

              <button
                onClick={fetchData}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <StatusBanner status={currentStatus} profile={profile} />

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsCard
              icon={Eye}
              label="Profile Views"
              value={analytics.views || 0}
              trend={analytics.viewsTrend || 0}
            />
            <AnalyticsCard
              icon={Users}
              label="Supporters"
              value={analytics.supporters || 0}
              trend={analytics.supportersTrend || 0}
            />
            <AnalyticsCard
              icon={ThumbsUp}
              label="Endorsements"
              value={analytics.endorsements || 0}
            />
            <AnalyticsCard
              icon={MessageSquare}
              label="Feedbacks"
              value={analytics.feedbacks || 0}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50">
          {[
            { id: "edit", label: "Edit Profile", icon: Edit3 },
            { id: "preview", label: "Public Preview", icon: Eye },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "edit" && !isVerified && (
              <EditProfileForm
                formData={formData}
                setFormData={setFormData}
                touched={touched}
                setTouched={setTouched}
                parties={parties}
                elections={elections}
                handlePartyChange={handlePartyChange}
                handleSave={handleSave}
                saving={saving}
                isFormValid={isFormValid}
                fileInputRef={fileInputRef}
                dragActive={dragActive}
                handleDrag={handleDrag}
                handleDrop={handleDrop}
                handleFileChange={handleFileChange}
                errors={{
                  name: touched.name && !isNameValid ? "Required" : "",
                  party: touched.party && !isPartyValid ? "Required" : "",
                  electionId:
                    touched.electionId && !isElectionValid ? "Required" : "",
                  photoUrl: touched.photoUrl && !isPhotoValid ? "Required" : "",
                  manifestoText:
                    touched.manifestoText && !isManifestoValid
                      ? "Required"
                      : "",
                }}
              />
            )}

            {activeTab === "preview" && (
              <PublicPreview
                formData={formData}
                parties={parties}
                elections={elections}
                profile={profile}
                publicProfile={publicProfile}
              />
            )}

            {activeTab === "analytics" && analytics && (
              <AnalyticsPanel analytics={analytics} />
            )}

            {isVerified && (
              <VerifiedProfileView
                formData={formData}
                parties={parties}
                elections={elections}
                profile={profile}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Public Link Card */}
            {publicProfile && (
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Public Profile
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <Link className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      value={publicProfile.publicUrl || ""}
                      className="flex-1 bg-transparent text-sm text-slate-600 dark:text-slate-300 truncate"
                    />
                    <button
                      onClick={copyPublicLink}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      window.open(publicProfile.publicUrl, "_blank")
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Public Profile
                  </button>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
                Profile Overview
              </h3>
              <div className="space-y-3">
                <ProgressItem
                  label="Profile Completion"
                  value={calculateCompletion(formData)}
                />
                <ProgressItem
                  label="Documents Verified"
                  value={profile ? 100 : 0}
                />
                <ProgressItem
                  label="Public Visibility"
                  value={publicProfile ? 100 : 0}
                />
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Notifications
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notif: any) => (
                    <div
                      key={notif.id}
                      className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm"
                    >
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No notifications yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
function StatusBadge({ status }: { status: string }) {
  const config = {
    Verified: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-700 dark:text-emerald-400",
      icon: CheckCircle,
    },
    Pending: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-700 dark:text-amber-400",
      icon: Clock,
    },
    Rejected: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-400",
      icon: Ban,
    },
  };

  const style = config[status as keyof typeof config] || config.Pending;
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text}`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function StatusBanner({ status, profile }: { status: string; profile: any }) {
  const configs = {
    Verified: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      icon: CheckCircle,
      title: "Profile Verified",
      message:
        "Your candidate profile has been verified and is publicly visible.",
    },
    Pending: {
      bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
      icon: Clock,
      title: "Under Review",
      message: "Your profile is being reviewed by election officials.",
    },
    Rejected: {
      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      icon: AlertTriangle,
      title: "Verification Failed",
      message:
        profile?.rejectionReason || "Please review and resubmit your profile.",
    },
  };

  const config = configs[status as keyof typeof configs] || configs.Pending;
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border p-5 ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5" />
        <div>
          <h3 className="font-semibold">{config.title}</h3>
          <p className="text-sm mt-1 opacity-80">{config.message}</p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ icon: Icon, label, value, trend }: any) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            <TrendingUp className="w-3 h-3" />
            {trend}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-slate-800 dark:text-white">
          {value}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}

function ProgressItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-medium text-slate-800 dark:text-white">
          {value}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function calculateCompletion(formData: any): number {
  const fields = [
    formData.name,
    formData.party,
    formData.electionId,
    formData.photoUrl,
    formData.manifestoText,
    formData.biography,
    formData.education,
    formData.experience,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

// Edit Profile Form
function EditProfileForm({
  formData,
  setFormData,
  touched,
  setTouched,
  parties,
  elections,
  handlePartyChange,
  handleSave,
  saving,
  isFormValid,
  fileInputRef,
  dragActive,
  handleDrag,
  handleDrop,
  handleFileChange,
  errors,
}: any) {
  return (
    <form
      onSubmit={handleSave}
      className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 space-y-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Edit3 className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Edit Profile
        </h2>
      </div>

      {/* Name & Election */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Candidate Name"
          required
          error={errors.name}
          icon={User}
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={() => setTouched({ ...touched, name: true })}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Your full name"
          />
        </FormField>

        <FormField
          label="Election"
          required
          error={errors.electionId}
          icon={Building}
        >
          <select
            value={formData.electionId}
            onChange={(e) =>
              setFormData({ ...formData, electionId: e.target.value })
            }
            onBlur={() => setTouched({ ...touched, electionId: true })}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select election</option>
            {elections.map((el: any) => (
              <option key={el.id} value={el.id}>
                {el.title}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Party */}
      <FormField
        label="Political Party"
        required
        error={errors.party}
        icon={Flag}
      >
        <select
          value={formData.party}
          onChange={handlePartyChange}
          onBlur={() => setTouched({ ...touched, party: true })}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select party</option>
          {parties.map((p: any) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
          <option value="Independent">Independent</option>
        </select>
      </FormField>

      {/* Photo Upload */}
      <FormField
        label="Profile Photo"
        required
        error={errors.photoUrl}
        icon={Camera}
      >
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 dark:border-slate-600"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {formData.photoUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={formData.photoUrl}
                alt="Preview"
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="text-left">
                <p className="text-sm font-medium">Photo selected</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData({ ...formData, photoUrl: "" });
                  }}
                  className="text-xs text-red-500 hover:text-red-600 mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click or drag photo here
              </p>
            </div>
          )}
        </div>
      </FormField>

      {/* Education & Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Education" icon={GraduationCap}>
          <textarea
            rows={3}
            value={formData.education}
            onChange={(e) =>
              setFormData({ ...formData, education: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Your educational background"
          />
        </FormField>

        <FormField label="Experience" icon={Briefcase}>
          <textarea
            rows={3}
            value={formData.experience}
            onChange={(e) =>
              setFormData({ ...formData, experience: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Your professional experience"
          />
        </FormField>
      </div>

      {/* Biography */}
      <FormField label="Biography" icon={Info}>
        <textarea
          rows={3}
          value={formData.biography}
          onChange={(e) =>
            setFormData({ ...formData, biography: e.target.value })
          }
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
          placeholder="Brief biography"
        />
      </FormField>

      {/* Manifesto */}
      <FormField
        label="Campaign Manifesto"
        required
        error={errors.manifestoText}
        icon={AlignLeft}
      >
        <textarea
          rows={5}
          value={formData.manifestoText}
          onChange={(e) =>
            setFormData({ ...formData, manifestoText: e.target.value })
          }
          onBlur={() => setTouched({ ...touched, manifestoText: true })}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
          placeholder="Your campaign promises and plans"
        />
      </FormField>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Phone" icon={Phone}>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Phone number"
          />
        </FormField>

        <FormField label="Email" icon={Mail}>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Email address"
          />
        </FormField>

        <FormField label="Website" icon={Globe}>
          <input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Your website"
          />
        </FormField>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="submit"
          disabled={saving || !isFormValid}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 flex items-center gap-2"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, required, error, icon: Icon, children }: any) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </label>
      {children}
    </div>
  );
}

function PublicPreview({
  formData,
  parties,
  elections,
  profile,
  publicProfile,
}: any) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Eye className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Public Profile Preview
        </h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <img
            src={formData.photoUrl}
            alt={formData.name}
            className="w-32 h-32 rounded-2xl mx-auto object-cover border-4 border-blue-100 dark:border-blue-900"
          />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">
            {formData.name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {formData.party}
          </p>
        </div>

        {/* Bio */}
        <div className="prose dark:prose-invert max-w-none">
          <h3>Biography</h3>
          <p>{formData.biography || "No biography provided."}</p>
        </div>

        {/* Manifesto */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Campaign Manifesto</h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {formData.manifestoText || "No manifesto published."}
            </p>
          </div>
        </div>

        {/* Education & Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Education</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {formData.education || "Not specified"}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Experience</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {formData.experience || "Not specified"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel({ analytics }: any) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Analytics
        </h2>
      </div>
      <div className="text-center py-12 text-slate-500">
        Detailed analytics dashboard coming soon...
      </div>
    </div>
  );
}

function VerifiedProfileView({ formData, parties, elections, profile }: any) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Verified Profile
        </h2>
      </div>
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-400">
          Your profile has been verified and locked. Contact election officials
          for any changes.
        </p>
        {/* Display read-only profile data */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Name:</strong> {formData.name}
          </div>
          <div>
            <strong>Party:</strong> {formData.party}
          </div>
          <div>
            <strong>Status:</strong> Verified
          </div>
        </div>
      </div>
    </div>
  );
}

// Import missing icon
function Bell(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
