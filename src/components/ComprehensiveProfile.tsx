import React, { useState, useEffect } from "react";
import { 
  User, Users, FileText, CreditCard, Phone, Mail, 
  ShieldCheck, Calendar, Lock, Briefcase, Heart, BookOpen, 
  MapPin, Award, Sun, Moon, RefreshCw, FileImage, ShieldAlert, BadgePlus,
  PenTool, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ComprehensiveProfileProps {
  token: string;
  user: any;
}

export default function ComprehensiveProfile({ token, user: initialUser }: ComprehensiveProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [activeProfileTab, setActiveProfileTab] = useState<"personal" | "family" | "citizenship" | "nid" | "contact">("personal");

  // Local user state dynamically updated after editing
  const [user, setUser] = useState<any>(initialUser);

  // Edit fields states
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "Male",
    fullNameNepali: "",
    maritalStatus: "Single",
    educationStatus: "Undergraduate",
    occupation: ""
  });

  // Calculate approval status
  const isApproved = user.isApproved !== false && user.isVerified;

  // Fetch full details dynamically
  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile/my-profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setDocument(data.document);
      }

      // Also refresh basic info
      const meRes = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }
    } catch (err) {
      console.error("Failed to load comprehensive profile parameters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [token]);

  const handleStartEdit = () => {
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      mobile: user.mobile || "",
      dob: profile?.dob || user.dob || "",
      gender: profile?.gender || user.gender || "Male",
      fullNameNepali: profile?.fullNameNepali || "",
      maritalStatus: profile?.maritalStatus || "Single",
      educationStatus: profile?.educationStatus || "Undergraduate",
      occupation: profile?.occupation || ""
    });
    setIsEditing(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      const res = await fetch("/api/voter/profile", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          mobile: editForm.mobile,
          dob: editForm.dob,
          gender: editForm.gender,
          fullNameNepali: editForm.fullNameNepali,
          maritalStatus: editForm.maritalStatus,
          educationStatus: editForm.educationStatus,
          occupation: editForm.occupation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg("Your citizen profile credentials have been successfully updated!");
        setIsEditing(false);
        await fetchProfileDetails();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || errData.message || "Failed to update profile.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Styling helpers based on local light/dark theme switch
  const isDark = themeMode === "dark";
  const bgCanvas = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100";
  const bgBody = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const textTitle = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const bgCard = isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/60 shadow-sm";
  const bgInput = isDark ? "bg-slate-950/80 border-slate-850" : "bg-slate-50 border-slate-200";

  const renderValue = (val: any) => {
    if (val === undefined || val === null || String(val).trim() === "") {
      return (
        <span className="text-slate-500 italic text-[11px] font-medium font-sans">
          Not Available
        </span>
      );
    }
    return <span className="font-bold text-xs select-all text-emerald-500 font-mono">{val}</span>;
  };

  const renderValueText = (val: any) => {
    if (val === undefined || val === null || String(val).trim() === "") {
      return (
        <span className="text-slate-500 italic text-[11px] font-medium font-sans">
          Not Available
        </span>
      );
    }
    return <span className={`font-semibold text-xs leading-relaxed ${isDark ? "text-slate-200" : "text-slate-800"}`}>{val}</span>;
  };

  const isMarried = profile?.maritalStatus === "Married" || profile?.maritalStatus === "married";

  return (
    <div className={`p-1.5 rounded-3xl border transition-all duration-300 ${bgCanvas} ${isDark ? "shadow-2xl" : "shadow-md"}`}>
      
      {/* Top action header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 font-mono">
            State Citizen Registrar Dossier
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button 
            type="button"
            onClick={fetchProfileDetails}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isDark ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-250 text-slate-600 hover:text-slate-900"
            }`}
            title="Reload registry data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          {/* Theme switcher */}
          <div className={`flex items-center rounded-xl p-0.5 border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
            <button
              type="button"
              onClick={() => setThemeMode("light")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${themeMode === "light" ? "bg-white text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-450"}`}
              title="Light theme view style"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setThemeMode("dark")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${themeMode === "dark" ? "bg-slate-900 text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-400"}`}
              title="Dark theme view style"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 font-mono">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs text-slate-500 tracking-wider">Synchronizing biometric credentials...</span>
        </div>
      ) : (
        <div className={`transition-all duration-350 p-4 md:p-6 rounded-2xl ${bgBody}`}>
          
          {/* User dossier summary card */}
          <div className="flex flex-col md:flex-row items-center gap-6 pb-6 mb-6 border-b border-slate-200/10 justify-between">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              {/* Profile image with validation border */}
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-full blur-sm opacity-40 group-hover:opacity-70 transition-opacity" />
                <img 
                  src={profile?.profilePhoto || user.faceImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"} 
                  alt={user.fullName} 
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover relative border-2 border-emerald-500/80 bg-slate-900"
                />
                <span className="absolute bottom-0 right-0 p-1 bg-slate-900 border border-slate-800 text-emerald-400 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center flex-wrap gap-2 justify-center md:justify-start">
                  <h2 className={`text-lg font-black tracking-tight ${textTitle}`}>{user.fullName}</h2>
                  {profile?.fullNameNepali && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-sans tracking-wide">
                      {profile.fullNameNepali}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  State-Verified Register Block: <span className="text-emerald-500 font-bold">{user.id}</span>
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 justify-center md:justify-start">
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700">
                    Nepal National Voter
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    Biometrics Approved
                  </span>
                </div>
              </div>
            </div>

            {/* Microstats block && Edit Action */}
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/60 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-500 block">NATIONAL CITIZEN ID</span>
                  <span className="font-extrabold text-slate-200">{user.nationalID || "Not Assigned"}</span>
                </div>
                <div className="border-l border-slate-800/80 pl-3">
                  <span className="text-[9px] text-slate-500 block">ELECTION DISTRICT</span>
                  <span className="font-extrabold text-slate-200">{profile?.district || "Bagmati / KTM"}</span>
                </div>
              </div>

              {!isApproved ? (
                <button
                  type="button"
                  onClick={isEditing ? () => setIsEditing(false) : handleStartEdit}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold cursor-pointer border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Back to View" : "Modify Profile"}</span>
                </button>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Profile Sealed (Read-Only)</span>
                </div>
              )}
            </div>
          </div>

          {/* Toast feedback alerts */}
          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-slate-900/40 rounded-2xl border border-slate-850 space-y-6 text-left"
            >
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-500" />
                  <span>Interactive Registry Profile Editor</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Adjust editable parameters below. Verified details will be reviewed for blockchain audit integrity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Full Name (English)</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Nepali Name (Unicode)</label>
                  <input
                    type="text"
                    value={editForm.fullNameNepali}
                    onChange={e => setEditForm({ ...editForm, fullNameNepali: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Registry Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">SMS Gateway Mobile Phone</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors [color-scheme:dark] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Gender Identification</label>
                  <select
                    value={editForm.gender}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors font-sans font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Marital Status Status</label>
                  <select
                    value={editForm.maritalStatus}
                    onChange={e => setEditForm({ ...editForm, maritalStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors font-sans font-semibold"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Educational Qualification</label>
                  <select
                    value={editForm.educationStatus}
                    onChange={e => setEditForm({ ...editForm, educationStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors font-sans font-semibold"
                  >
                    <option value="Primary">Primary Education</option>
                    <option value="Secondary">Secondary Education</option>
                    <option value="Higher Secondary">Higher Secondary / High School</option>
                    <option value="Undergraduate">Undergraduate Degree</option>
                    <option value="Postgraduate">Postgraduate Degree</option>
                    <option value="Doctorate">Doctorate / Ph.D.</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Core Occupation / Profession</label>
                  <input
                    type="text"
                    value={editForm.occupation}
                    onChange={e => setEditForm({ ...editForm, occupation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors font-semibold"
                    placeholder="E.g. Software Engineer, Government Employee..."
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Commit Changes</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Section Selector Tabs Bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-6 border-b border-slate-200/10 scrollbar-none">
                {[
                  { id: "personal", label: "Personal Info", icon: User, color: "text-blue-500" },
                  { id: "family", label: "Family Info", icon: Users, color: "text-purple-500" },
                  { id: "citizenship", label: "Citizenship Documents", icon: FileText, color: "text-amber-500" },
                  { id: "nid", label: "National Identity", icon: CreditCard, color: "text-indigo-500" },
                  { id: "contact", label: "Security & Contact", icon: Lock, color: "text-rose-500" }
                ].map(tab => {
                  const TabIcon = tab.icon;
                  const active = activeProfileTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveProfileTab(tab.id as any)}
                      className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                        active 
                          ? "bg-slate-900 border-slate-700 text-white shadow-xl scale-[1.01]" 
                          : isDark
                            ? "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/50"
                            : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <TabIcon className={`w-4 h-4 ${tab.color}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Render Content Panels */}
              <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              
              {/* Tab 1: PERSONAL INFORMATION */}
              {activeProfileTab === "personal" && (
                <motion.div
                  key="personal-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">English Name</span>
                      </div>
                      {renderValueText(user.fullName)}
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Nepali Name (unicode)</span>
                      </div>
                      {renderValueText(profile?.fullNameNepali)}
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Gender Identification</span>
                      </div>
                      {renderValueText(profile?.gender || user.gender)}
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Date of Birth</span>
                      </div>
                      {renderValueText(profile?.dob || user.dob)}
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Marital Status Status</span>
                      </div>
                      {renderValueText(profile?.maritalStatus)}
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Educational Qualification</span>
                      </div>
                      {renderValueText(profile?.educationStatus)}
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-teal-500" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Core Occupation / Profession</span>
                      </div>
                      {renderValueText(profile?.occupation)}
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Calculated Age</span>
                      </div>
                      <span className="font-semibold text-xs text-white">
                        {(() => {
                          const dobStr = profile?.dob || user.dob;
                          if (!dobStr) return "Not Provided";
                          const birthDate = new Date(dobStr);
                          if (isNaN(birthDate.getTime())) return "Invalid Date";
                          const today = new Date();
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const m = today.getMonth() - birthDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                          }
                          return `${age} Years`;
                        })()}
                      </span>
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <Heart className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Blood Group</span>
                      </div>
                      {renderValueText(profile?.bloodGroup || "Not Available")}
                    </div>

                    <div className={`p-4 rounded-2xl border ${bgCard}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wide">Nationality</span>
                      </div>
                      {renderValueText(profile?.nationality || "Nepali")}
                    </div>

                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <h4 className={`text-xs uppercase tracking-widest font-mono font-extrabold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Residential Address Registers
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl border ${bgCard}`}>
                        <div className="flex items-center gap-2 text-slate-400 mb-2.5">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold uppercase tracking-wide">Permanent Address</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {profile?.permanentAddress || user.address || "Not Registered"}
                        </p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${bgCard}`}>
                        <div className="flex items-center gap-2 text-slate-400 mb-2.5">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold uppercase tracking-wide">Temporary Address</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {profile?.isTemporarySameAsPermanent ? "Same as Permanent Address" : profile?.temporaryAddress || "Not Registered"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: FAMILY INFORMATION */}
              {activeProfileTab === "family" && (
                <motion.div
                  key="family-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Father details */}
                    <div className={`p-4 rounded-2xl border ${bgCard} space-y-3`}>
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Father's Full Name</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block">ENGLISH</span>
                        {renderValueText(profile?.fatherName)}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block">NEPALI (unicode)</span>
                        {renderValueText(profile?.fatherNameNepali)}
                      </div>
                    </div>

                    {/* Mother details */}
                    <div className={`p-4 rounded-2xl border ${bgCard} space-y-3`}>
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Mother's Full Name</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block">ENGLISH</span>
                        {renderValueText(profile?.motherName)}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block">NEPALI (unicode)</span>
                        {renderValueText(profile?.motherNameNepali)}
                      </div>
                    </div>

                    {/* Grandfather details */}
                    <div className={`p-4 rounded-2xl border ${bgCard} space-y-3`}>
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Grandfather's Full Name</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block">ENGLISH</span>
                        {renderValueText(profile?.grandfatherName)}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 block">NEPALI (unicode)</span>
                        {renderValueText(profile?.grandfatherNameNepali)}
                      </div>
                    </div>

                  </div>

                  {/* Optional Spouse Information section (Married Applicant) */}
                  {isMarried ? (
                    <div className="space-y-4 pt-4 border-t border-slate-200/5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-rose-500" />
                        <h4 className={`text-xs uppercase tracking-widest font-mono font-extrabold ${isDark ? "text-rose-450" : "text-rose-600"}`}>
                          Additional Spouse Information (Married Record Verified)
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Spouse details */}
                        <div className={`p-4 rounded-2xl border ${bgCard} border-rose-500/10 space-y-3`}>
                          <div className="border-b border-white/5 pb-2">
                            <span className="text-[10px] uppercase font-mono font-bold text-rose-400">Spouse's Full Name</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block">ENGLISH</span>
                            {renderValueText(profile?.spouseName)}
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block">NEPALI</span>
                            {renderValueText(profile?.spouseNameNepali)}
                          </div>
                        </div>

                        {/* Spouse Father details */}
                        <div className={`p-4 rounded-2xl border ${bgCard} border-rose-500/10 space-y-3`}>
                          <div className="border-b border-white/5 pb-2">
                            <span className="text-[10px] uppercase font-mono font-bold text-rose-400">Spouse's Father's Name</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block">ENGLISH</span>
                            {renderValueText(profile?.spouseFatherName)}
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block">NEPALI</span>
                            {renderValueText(profile?.spouseFatherNameNepali)}
                          </div>
                        </div>

                        {/* Spouse Mother details */}
                        <div className={`p-4 rounded-2xl border ${bgCard} border-rose-500/10 space-y-3`}>
                          <div className="border-b border-white/5 pb-2">
                            <span className="text-[10px] uppercase font-mono font-bold text-rose-400">Spouse's Mother's Name</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block">ENGLISH</span>
                            {renderValueText(profile?.spouseMotherName)}
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block">NEPALI</span>
                            {renderValueText(profile?.spouseMotherNameNepali)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* Tab 3: CITIZENSHIP INFORMATION */}
              {activeProfileTab === "citizenship" && (
                <motion.div
                  key="cit-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Metadata column */}
                    <div className="space-y-4">
                      <div className={`p-5 rounded-2xl border ${bgCard} space-y-4`}>
                        <div className="flex items-center gap-2 border-b border-slate-200/5 pb-3">
                          <FileText className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                            Dossier Metadata Registry
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">Citizenship Number</span>
                            {renderValue(document?.citizenshipNumber || profile?.citizenshipNumber || user.nationalID)}
                          </div>

                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">Ownership Type</span>
                            {renderValueText(profile?.citizenshipType || "By Descent")}
                          </div>

                          <div className="col-span-2 pt-2 border-t border-white/5" />

                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">Issue Date</span>
                            {renderValue(profile?.citizenshipIssueDate || "2009-05-12")}
                          </div>

                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">Issuing District</span>
                            {renderValueText(profile?.citizenshipIssueDistrict || profile?.district || "Kathmandu")}
                          </div>

                          <div className="col-span-2 pt-2 border-t border-white/5" />

                          <div className="col-span-2">
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">Issuing High Authority</span>
                            {renderValueText(profile?.citizenshipIssueAuthority || "District Administration Office")}
                          </div>
                        </div>
                      </div>

                      {/* Signature block */}
                      <div className={`p-4 rounded-xl border ${bgCard} flex items-center justify-between gap-4`}>
                        <div>
                          <h5 className="font-bold text-xs text-slate-200">Official Digital Signature</h5>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
                            Sealed cryptographic hash of custom handwritten signature matched at registry.
                          </p>
                        </div>
                        {document?.signatureImage ? (
                          <img 
                            src={document.signatureImage} 
                            alt="Signature preview" 
                            className="bg-slate-950 border border-slate-800 p-2 rounded-lg max-h-16 object-contain w-32"
                          />
                        ) : (
                          <div className="h-14 w-28 bg-slate-950/50 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-[10px] font-mono">
                            Not Uploaded
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scopes and photo documents */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className={`p-4 rounded-2xl border ${bgCard} flex flex-col gap-3 justify-between`}>
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                            Front Scanned Image
                          </span>
                          <span className="text-[9px] text-slate-500 leading-tight block">
                            Requires 1280px raw visual clearance.
                          </span>
                        </div>
                        
                        <div className="aspect-[4/3] bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative group">
                          {document?.citizenshipFrontImage ? (
                            <>
                              <img 
                                src={document.citizenshipFrontImage} 
                                alt="Citizenship Front Scan" 
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a 
                                  href={document.citizenshipFrontImage} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-[10px] rounded hover:bg-slate-800 font-mono font-bold text-white uppercase text-center"
                                >
                                  View Raw Scan
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-slate-600">
                              <FileImage className="w-8 h-8" />
                              <span className="text-[10px] font-mono">Preview Not Found</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${bgCard} flex flex-col gap-3 justify-between`}>
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                            Back Scanned Image
                          </span>
                          <span className="text-[9px] text-slate-500 leading-tight block">
                            Backside barcode and issuing stamp.
                          </span>
                        </div>
                        
                        <div className="aspect-[4/3] bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative group">
                          {document?.citizenshipBackImage ? (
                            <>
                              <img 
                                src={document.citizenshipBackImage} 
                                alt="Citizenship Back Scan" 
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a 
                                  href={document.citizenshipBackImage} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-[10px] rounded hover:bg-slate-800 font-mono font-bold text-white uppercase text-center"
                                >
                                  View Raw Scan
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-slate-600">
                              <FileImage className="w-8 h-8" />
                              <span className="text-[10px] font-mono">Preview Not Found</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}

              {/* Tab 4: NATIONAL ID INFORMATION */}
              {activeProfileTab === "nid" && (
                <motion.div
                  key="nid-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* ID Details Card */}
                    <div className={`p-5 rounded-2xl border ${bgCard} md:col-span-1 space-y-4 flex flex-col justify-between`}>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-200/5 pb-3">
                          <CreditCard className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                            National ID Register
                          </h4>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">National ID Number (NID)</span>
                            {renderValue(user.nationalID || profile?.citizenshipNumber || "NID-101-987")}
                          </div>

                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">NID Verification Status</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono font-bold mt-1 uppercase">
                              Active / Approved
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">NID Issued Registry Date</span>
                            {renderValue(profile?.nidIssueDate || "2019-09-22")}
                          </div>
                        </div>
                      </div>

                      {/* Upgrade notification banner */}
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] leading-relaxed text-indigo-300">
                        <span className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Standard Biometric Sync
                        </span>
                        This national database record was biometrically synced from the centralized Home Ministry NID registry platform.
                      </div>
                    </div>

                    {/* Scans Cards */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className={`p-4 rounded-2xl border ${bgCard} flex flex-col justify-between gap-3`}>
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">
                            National ID Card (Front)
                          </span>
                          <span className="text-[9px] text-slate-500">
                            Preintegrated portrait hologram dossier scan.
                          </span>
                        </div>

                        <div className="aspect-[1.58/1] bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative group">
                          {profile?.nidFrontImage ? (
                            <>
                              <img 
                                src={profile.nidFrontImage} 
                                alt="NID Front Scan" 
                                className="object-cover w-full h-full"
                              />
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-slate-600 p-4 text-center">
                              <ShieldAlert className="w-6 h-6 text-indigo-400/80" />
                              <span className="text-[10px] font-mono max-w-[140px] leading-tight block">
                                NID Scanned Frame Not Available
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${bgCard} flex flex-col justify-between gap-3`}>
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">
                            National ID Card (Back)
                          </span>
                          <span className="text-[9px] text-slate-500">
                            Official microgrid and metadata barcodes.
                          </span>
                        </div>

                        <div className="aspect-[1.58/1] bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative group">
                          {profile?.nidBackImage ? (
                            <>
                              <img 
                                src={profile.nidBackImage} 
                                alt="NID Back Scan" 
                                className="object-cover w-full h-full"
                              />
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-slate-600 p-4 text-center">
                              <ShieldAlert className="w-6 h-6 text-indigo-400/80" />
                              <span className="text-[10px] font-mono max-w-[140px] leading-tight block">
                                NID Scanned Frame Not Available
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}

              {/* Tab 5: CONTACT INFORMATION (Read-only security constraints) */}
              {activeProfileTab === "contact" && (
                <motion.div
                  key="contact-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-[11px] md:text-xs leading-relaxed text-amber-300 rounded-2xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <span className="font-bold block text-sm mb-0.5">Contact Verification Security Hold</span>
                      To maintain absolute defense integrity against voter simulation attacks, citizen emails and mobile registrations are strictly locked inside the HSM vault. Contact updates require multi-factor liveness approval conducted at physical Election Bureau outlets.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className={`p-5 rounded-2xl border ${bgCard} relative overflow-hidden group`}>
                      <div className="absolute top-4 right-4 text-slate-500 group-hover:scale-110 transition-transform">
                        <Lock className="w-4 h-4 text-rose-500" />
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-400 mb-2 font-mono">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] uppercase font-bold tracking-wide">Registry Email Address</span>
                      </div>

                      <div className={`p-3 rounded-xl border font-mono text-xs text-slate-300 mt-2 flex items-center justify-between ${bgInput}`}>
                        <span className="font-bold select-all leading-relaxed">{user.email}</span>
                        <span className="text-[9px] uppercase tracking-wider text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
                          Locked
                        </span>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border ${bgCard} relative overflow-hidden group`}>
                      <div className="absolute top-4 right-4 text-slate-500 group-hover:scale-110 transition-transform">
                        <Lock className="w-4 h-4 text-rose-500" />
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-400 mb-2 font-mono">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] uppercase font-bold tracking-wide">SMS Gateway Mobile Phone</span>
                      </div>

                      <div className={`p-3 rounded-xl border font-mono text-xs text-slate-300 mt-2 flex items-center justify-between ${bgInput}`}>
                        <span className="font-bold select-all leading-relaxed">{user.mobile}</span>
                        <span className="text-[9px] uppercase tracking-wider text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
                          Locked
                        </span>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </>
      )}

        </div>
      )}

    </div>
  );
}
