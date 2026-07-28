import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, ShieldCheck, CheckCircle, AlertTriangle, Upload, User, Flag, AlignLeft, Info, Calendar, Building, Sparkles, History, MapPin, GraduationCap, Briefcase, FileText, Image as ImageIcon, Check, Ban, X, Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PoliticalParty, Candidate, Election } from "../types.js";
import type { ThemeMode } from "../types/auth.ts";

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
  setTheme
}) => {
  const [profile, setProfile] = useState<Candidate | null>(null);
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null);
  
  // Local edit state
  const [formData, setFormData] = useState({
    name: "",
    party: "",
    biography: "",
    education: "",
    experience: "",
    photoUrl: "",
    partyLogoUrl: "",
    manifestoText: "",
    electionId: ""
  });

  const [touched, setTouched] = useState({
    name: false,
    party: false,
    electionId: false,
    photoUrl: false,
    manifestoText: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load profile data, parties, and elections on mount
  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch own candidate profile draft from backend
      const profileRes = await fetch("/api/candidates/profile/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      // 2. Fetch parties
      const partiesRes = await fetch("/api/parties");
      const partiesData = await partiesRes.json();
      setParties(partiesData.parties || []);

      // 3. Fetch elections
      const electionsRes = await fetch("/api/elections");
      const electionsData = await electionsRes.json();
      setElections(electionsData.elections || []);

      if (profileData.candidate) {
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
          electionId: profileData.candidate.electionId || ""
        });
      } else {
        // Initialize with default values
        setFormData(prev => ({
          ...prev,
          name: user.fullName || ""
        }));
      }

    } catch (e: any) {
      triggerToast("Error retrieving directory profiles", true);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize Party logo whenever party dropdown changes
  const handlePartyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPartyCode = e.target.value;
    const matchedParty = parties.find(p => p.code === selectedPartyCode || p.name === selectedPartyCode);
    setFormData(prev => ({
      ...prev,
      party: selectedPartyCode,
      partyLogoUrl: matchedParty ? matchedParty.logoUrl : ""
    }));
    setTouched(prev => ({ ...prev, party: true }));
  };

  // Drag and Drop handlers for photo
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

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("Please upload a valid JPEG/PNG profile file.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
        setTouched(prev => ({ ...prev, photoUrl: true }));
        triggerToast("Profile photo loaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Validation
  const isNameValid = formData.name.trim() !== "";
  const isPartyValid = formData.party !== "";
  const isElectionValid = formData.electionId !== "";
  const isPhotoValid = formData.photoUrl.trim() !== "";
  const isManifestoValid = formData.manifestoText.trim() !== "";

  const isFormValid = isNameValid && isPartyValid && isElectionValid && isPhotoValid && isManifestoValid;

  const errors = {
    name: touched.name && !isNameValid ? "Full candidate name is required." : "",
    party: touched.party && !isPartyValid ? "Political party affiliation is required." : "",
    electionId: touched.electionId && !isElectionValid ? "Please select a target active election." : "",
    photoUrl: touched.photoUrl && !isPhotoValid ? "Candidate digital headshot is required." : "",
    manifestoText: touched.manifestoText && !isManifestoValid ? "Civic focus manifesto description is required." : ""
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      party: true,
      electionId: true,
      photoUrl: true,
      manifestoText: true
    });

    if (!isFormValid) {
      triggerToast("Validation failed. Please fill all required fields.", true);
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/candidates/profile/me", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile draft.");
      }

      triggerToast("Candidate profile committed for verification review!");
      setProfile(data.candidate);
    } catch (err: any) {
      triggerToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  // Quick preset photos
  const PRESET_PHOTOS = [
    { name: "Executive Style", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" },
    { name: "Professional Corporate", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200" },
    { name: "Warm Casual", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 text-slate-100 min-h-[70vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono tracking-widest">ESTABLISHING CRYPTOGRAPHIC SESSIONS...</p>
      </div>
    );
  }

  const currentStatus = profile ? profile.status || "Pending" : "Pending";
  const isVerified = currentStatus === "Verified";

  return (
    <div className="flex-1 bg-slate-950 text-slate-150 p-4 sm:p-6 md:p-8 space-y-8 font-sans">
      
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce border ${
            toast.isError ? "bg-red-600 border-red-500" : "bg-emerald-600 border-emerald-500"
          }`}>
            <Info className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-semibold text-white">{toast.msg}</span>
          </div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md uppercase font-bold">
              Campaign Portal
            </span>
            <span className="text-slate-500">●</span>
            <span className="text-[10px] text-slate-400 font-mono">ID: {user.username}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-indigo-400" />
            <span>Welcome, {user.fullName}</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Register and update your campaign profile details, upload credential headers, select target contests, and audit status.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-750"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-750 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Session</span>
          </button>
        </div>
      </div>

      {/* Status Warning / Success Section */}
      <div className="grid grid-cols-1 gap-6">
        {isVerified ? (
          <div className="bg-emerald-950/20 border border-emerald-850/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-400 shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-400 text-sm flex items-center gap-2">
                <span>Verified Candidate Credentials</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-emerald-400/10 text-emerald-400 rounded-full border border-emerald-400/20 uppercase">
                  Active
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Your campaign portfolio has been successfully reviewed, optimized, and verified by federal election observers. All details are now locked to prevent ballot tampering. Visitors can view your records, campaign history, and vote.
              </p>
            </div>
          </div>
        ) : profile && currentStatus === "Rejected" ? (
          <div className="bg-red-950/20 border border-red-850/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-red-500/15 rounded-xl text-red-400 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-extrabold text-red-400 text-sm flex items-center gap-2">
                <span>Verification Rejected / Re-entry Advised</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-red-400/10 text-red-400 rounded-full border border-red-400/20 uppercase">
                  Re-submit
                </span>
              </h3>
              <div className="p-3 bg-slate-950 border border-red-950 rounded-xl">
                <span className="block text-[10px] text-red-450 uppercase font-bold tracking-wider mb-0.5">Observer Comments:</span>
                <p className="text-xs font-mono text-slate-300 leading-normal">{profile.rejectionReason || "Please verify credentials and manifestos for accuracy and typos."}</p>
              </div>
              <p className="text-[11px] text-slate-500 max-w-2xl leading-normal">
                You can correct the highlighted details in the edit terminal below and resubmit. Our security agents will re-evaluate within 24 hours.
              </p>
            </div>
          </div>
        ) : profile ? (
          <div className="bg-amber-950/20 border border-amber-850/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-amber-500/15 rounded-xl text-amber-400 shrink-0">
              <Info className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-2">
                <span>Credentials Under Audit Review</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded-full border border-amber-400/20 uppercase">
                  Pending
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Your dossier has been registered and is currently waiting for secure administrative certification. Profile fields can still be edited if needed — editing will re-queue the submission to the first position of audit tasks.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-950/25 border border-blue-900/60 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse">
            <div className="p-3 bg-blue-500/15 rounded-xl text-blue-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-blue-300 text-sm flex items-center gap-1.5">
                <span>No Active Portfolio Registered</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Get started by creating your official candidate profile. Once certified, your digital card can be selected by thousands of voters.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Form Edit / Portfolio Read-only vs Sidebar details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Details Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Candidate Dossier Credentials Form</h3>
            </div>

            {isVerified ? (
              // LOCKED PROFILE PREVIEW (READ ONLY ENFORCED)
              <div className="space-y-6">
                
                {/* Upper card */}
                <div className="flex flex-col sm:flex-row gap-6 p-4 bg-slate-950 rounded-2xl border border-slate-850">
                  <img 
                    src={formData.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} 
                    alt={formData.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-black text-white">{formData.name}</h4>
                      <p className="text-xs text-indigo-400 font-mono tracking-tight flex items-center gap-1 mt-0.5">
                        <User className="w-3.5 h-3.5" /> Approved Candidate Profile Representation
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300">
                        <Flag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold">Party: {formData.party || "Independent"}</span>
                        {formData.partyLogoUrl && (
                          <img src={formData.partyLogoUrl} alt="Logo" className="w-4 h-4 object-cover rounded-sm ml-1" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300">
                        <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium">
                          Race: {elections.find(e => e.id === formData.electionId)?.title || "Universal Election Pool"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" />
                      <span>Academic Background</span>
                    </span>
                    <p className="text-xs text-slate-300 leading-normal font-sans">{formData.education || "No education history declared."}</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <Briefcase className="w-4 h-4 text-purple-400" />
                      <span>Professional Experience</span>
                    </span>
                    <p className="text-xs text-slate-300 leading-normal font-sans">{formData.experience || "No professional overview declared."}</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <Info className="w-4 h-4 text-amber-500" />
                      <span>Candidate Biography</span>
                    </span>
                    <p className="text-xs text-slate-300 leading-normal font-sans">{formData.biography || "No personal bio statement declared."}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                    <AlignLeft className="w-4 h-4 text-indigo-500" />
                    <span>Official Campaign Manifesto & Voter Platform</span>
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed font-sans">{formData.manifestoText}</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] text-slate-400 flex gap-2 leading-relaxed">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p>
                    All of the candidate profile values above are locked under federal cryptographic hashing mechanisms. If you suspect any informational discrepancy, please consult your assigned state election officer.
                  </p>
                </div>

              </div>
            ) : (
              // EDITABLE PROFILE FORM
              <form onSubmit={handleSave} className="space-y-6 text-slate-300 text-xs font-sans">
                
                {/* Candidate Name & Target Election */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                  <div>
                    <label className="flex items-center justify-between text-slate-400 font-bold uppercase mb-1.5 text-[10px] tracking-wide">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Candidate Name *</span>
                      </span>
                      {errors.name && <span className="text-[9px] text-red-500 font-medium font-mono">{errors.name}</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="Enter legal candidate name"
                      value={formData.name}
                      onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                      onChange={e => {
                        setFormData({ ...formData, name: e.target.value });
                        setTouched(prev => ({ ...prev, name: true }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                        errors.name ? "border-red-500 focus:border-red-500" : "border-slate-800 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-400 font-bold uppercase mb-1.5 text-[10px] tracking-wide">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-blue-400" />
                        <span>Target Election Pool *</span>
                      </span>
                      {errors.electionId && <span className="text-[9px] text-red-500 font-medium font-mono">{errors.electionId}</span>}
                    </label>
                    <select
                      value={formData.electionId}
                      onBlur={() => setTouched(prev => ({ ...prev, electionId: true }))}
                      onChange={e => {
                        setFormData({ ...formData, electionId: e.target.value });
                        setTouched(prev => ({ ...prev, electionId: true }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                        errors.electionId ? "border-red-500 focus:border-red-500" : "border-slate-800 focus:border-blue-500"
                      }`}
                    >
                      <option value="" disabled>-- Select contest or race pool --</option>
                      {elections.map(el => (
                        <option key={el.id} value={el.id}>
                          {el.title} ({el.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Political Party SelectorDropdown */}
                <div>
                  <label className="flex items-center justify-between text-slate-400 font-bold uppercase mb-1.5 text-[10px] tracking-wide">
                    <span className="flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Target Political Party Association *</span>
                    </span>
                    {errors.party && <span className="text-[9px] text-red-500 font-medium font-mono">{errors.party}</span>}
                  </label>
                  <select
                    value={formData.party}
                    onBlur={() => setTouched(prev => ({ ...prev, party: true }))}
                    onChange={handlePartyChange}
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                      errors.party ? "border-red-500 focus:border-red-500" : "border-slate-800 focus:border-blue-500"
                    }`}
                  >
                    <option value="" disabled>-- Select political party from registry --</option>
                    {parties.map(py => (
                      <option key={py.id} value={py.name}>
                        {py.name} ({py.code})
                      </option>
                    ))}
                    <option value="Independent">Independent (No Group Affiliation)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Political party options listed above are managed dynamically under the federal administrative register panel.
                  </p>
                </div>

                {/* Profile Photo upload area */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px] tracking-wide">
                    <span className="flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Candidate Headshot Portrait image *</span>
                    </span>
                    {errors.photoUrl && <span className="text-[9px] text-red-500 font-semibold font-mono">{errors.photoUrl}</span>}
                  </div>

                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      dragActive 
                        ? "border-blue-500 bg-blue-950/20" 
                        : errors.photoUrl
                          ? "border-red-500 bg-red-950/5 hover:border-red-650"
                          : "border-slate-800 hover:border-indigo-500 bg-slate-950"
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
                      <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                        <img 
                          src={formData.photoUrl} 
                          alt="Uploaded headshot" 
                          className="w-16 h-16 rounded-xl object-cover border border-slate-850 shadow-sm ring-4 ring-indigo-500/10"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left space-y-1">
                          <p className="font-bold text-slate-100 flex items-center gap-1 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                            Digital Portrait Selected
                          </p>
                          <p className="text-[9px] text-slate-500 truncate max-w-[200px]" title={formData.photoUrl}>
                            Source: {formData.photoUrl.startsWith("data:") ? "Local File Sync" : "Raw Web Address URL"}
                          </p>
                          <button 
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, photoUrl: "" }));
                              setTouched(prev => ({ ...prev, photoUrl: true }));
                            }}
                            className="text-red-400 hover:text-red-500 font-bold text-[9px] uppercase tracking-wider mt-1 cursor-pointer flex items-center gap-0.5"
                          >
                            <X className="w-3 h-3" /> Clear Portrait
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-indigo-500/10 p-2.5 rounded-full text-indigo-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-[11px]">Click or Drag & Drop headshot photo file</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">JPEG, PNG standards. Aspect ratio 1:1 works best</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Fallback image address */}
                  <div className="mt-1">
                    <span className="text-[9px] text-slate-500 block mb-1">Or paste custom image web address link manually:</span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or paste image Base64 string"
                      value={formData.photoUrl.startsWith("data:") ? "" : formData.photoUrl}
                      onChange={e => {
                        setFormData({ ...formData, photoUrl: e.target.value });
                        setTouched(prev => ({ ...prev, photoUrl: true }));
                      }}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Preset photo options */}
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-900/60 mt-1">
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1 mb-2">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Select Quick Classic Avatar Assets</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_PHOTOS.map((ph, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, photoUrl: ph.url }));
                            setTouched(prev => ({ ...prev, photoUrl: true }));
                          }}
                          className={`flex items-center gap-1.5 p-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                            formData.photoUrl === ph.url 
                              ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-sm" 
                              : "border-slate-850 bg-slate-900 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          <img 
                            src={ph.url} 
                            alt={ph.name} 
                            className="w-5 h-5 rounded object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span>{ph.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Academic & Professional Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-1 text-slate-400 font-bold uppercase mb-1.5 text-[10px] tracking-wide">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Educational Details</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Master of Science in Political Institutions, Tribhuvan University, 2012"
                      value={formData.education}
                      onChange={e => setFormData({ ...formData, education: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-normal"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-slate-400 font-bold uppercase mb-1.5 text-[10px] tracking-wide">
                      <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                      <span>Professional Experience Details</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. 10 Years as Community Coordinator, Local Development Advisor, State Representative"
                      value={formData.experience}
                      onChange={e => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-normal"
                    />
                  </div>
                </div>

                {/* biography fields */}
                <div>
                  <label className="flex items-center gap-1 text-slate-400 font-bold uppercase mb-1.5 text-[10px] tracking-wide">
                    <Info className="w-3.5 h-3.5 text-amber-500" />
                    <span>Candidate General Biography Description</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a general bio description summarizing your background, mission, or vision..."
                    value={formData.biography}
                    onChange={e => setFormData({ ...formData, biography: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-normal"
                  />
                </div>

                {/* written campaign manifesto */}
                <div>
                  <div className="flex justify-between items-center text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wide">
                    <span className="flex items-center gap-1">
                      <AlignLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Official Campaign Manifesto & Platform *</span>
                    </span>
                    {errors.manifestoText && <span className="text-[9px] text-red-500 font-semibold font-mono">{errors.manifestoText}</span>}
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Enter your official campaign proposals, development plans, community commitments, and why citizens should select you..."
                    value={formData.manifestoText}
                    onBlur={() => setTouched(prev => ({ ...prev, manifestoText: true }))}
                    onChange={e => {
                      setFormData({ ...formData, manifestoText: e.target.value });
                      setTouched(prev => ({ ...prev, manifestoText: true }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-normal transition-colors ${
                      errors.manifestoText ? "border-red-500 focus:border-red-500" : "border-slate-800 focus:border-blue-500"
                    }`}
                  />
                </div>

                {/* Actions submit */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={saving || !isFormValid}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold uppercase rounded-xl tracking-wider cursor-pointer shadow-md shadow-blue-500/10 transition-all disabled:opacity-45 disabled:cursor-not-allowed text-[10px] flex items-center gap-2"
                  >
                    {saving ? (
                      <span>CONSOLIDATING...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Resubmit Portfolio Draft</span>
                      </>
                    )}
                  </button>
                </div>

                {!isFormValid && (
                  <div className="text-center">
                    <span className="text-[10px] text-amber-500 font-semibold flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                      <span>Form is locked from saving until all mandatory fields (*) are validly completed.</span>
                    </span>
                  </div>
                )}

              </form>
            )}

          </div>
        </div>

        {/* Sidebar info logs and dynamic candidate view */}
        <div className="space-y-6">
          
          {/* Real-time card mockup */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
            
            <h4 className="font-extrabold text-xs text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
              <span>Ballot Sheet Mockup Preview</span>
            </h4>

            {/* Simulated Live Ballot Badge Card */}
            <div className="bg-slate-950 rounded-2xl border border-slate-850 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={formData.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} 
                  alt="Headshot" 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-indigo-400 font-mono tracking-wider bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">
                    {currentStatus === "Verified" ? "Active" : "Sample Draft"}
                  </span>
                  <h5 className="font-extrabold text-white text-xs truncate mt-1">{formData.name || "UNNAMED"}</h5>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    {parties.find(py => py.name === formData.party || py.code === formData.party)?.name || formData.party || "No Group Affiliation"}
                  </p>
                </div>
              </div>

              {/* Symbol row */}
              <div className="flex items-center justify-between text-[11px] bg-slate-900 border border-slate-850/60 p-2.5 rounded-xl">
                <span className="text-slate-400">Federal Symbol Logo:</span>
                {formData.partyLogoUrl ? (
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={formData.partyLogoUrl} 
                      alt="Symbol" 
                      className="w-5 h-5 rounded object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-bold text-slate-300 font-mono text-[9px] uppercase">{formData.party || "Logo"}</span>
                  </div>
                ) : (
                  <span className="text-slate-550 italic font-mono text-[10px]">No logo matched</span>
                )}
              </div>

              {/* Manifesto excerpt snippet */}
              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">Manifesto Core Excerpt:</span>
                <p className="text-[11px] text-slate-400 leading-normal line-clamp-3 italic">
                  "{formData.manifestoText || "The campaign program manifesto remains unwritten. Please write your public manifesto to populate ballot sheet sheets."}"
                </p>
              </div>

              {/* Vote Simulation click */}
              <button 
                type="button"
                disabled
                className="w-full py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-xl border border-indigo-500/20"
              >
                Simulated Vote button
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-3 leading-normal">
              This layout mimics the format voters encounter in our high-security ballot interface when casting federal elections.
            </p>
          </div>

          {/* Historical Audit Log timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Dossier Validation History Timeline</span>
            </h4>

            <div className="space-y-4 relative pl-3 before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {profile && profile.history && profile.history.length > 0 ? (
                profile.history.map((h, i) => (
                  <div key={i} className="relative flex gap-3 text-xs">
                    {/* Bullet */}
                    <div className={`absolute -left-[5px] w-2.5 h-2.5 rounded-full border-2 border-slate-900 mt-1 ${
                      h.status === "Verified" ? "bg-emerald-500" : h.status === "Rejected" ? "bg-red-500" : "bg-amber-500"
                    }`} />
                    
                    <div className="pl-4 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-extrabold uppercase font-mono tracking-wide text-[9px] px-1.5 py-0.2 rounded-md ${
                          h.status === "Verified" ? "bg-emerald-500/10 text-emerald-400" : h.status === "Rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {h.status}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-350 text-[11px] leading-relaxed">{h.note}</p>
                      <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Actor: {h.actor}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic py-2 text-center text-xs">
                  No historical audits have been executed on this candidate document yet.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
