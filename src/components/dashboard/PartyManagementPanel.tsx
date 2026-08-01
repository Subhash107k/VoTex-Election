import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, ShieldCheck, Flag, Upload, Image as ImageIcon, X, Sparkles, Building, Calendar, User, AlignLeft, Info, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PoliticalParty, Candidate } from "../../types.js";

interface PartyManagementPanelProps {
  parties: PoliticalParty[];
  candidates: Candidate[];
  token: string;
  onRefresh: () => void;
  triggerToast: (msg: string, isError?: boolean) => void;
}

// Preset modern placeholder party logos
const PRESET_LOGOS = [
  { name: "Sun Emblem", url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=150" },
  { name: "Sovereign Tree", url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=150" },
  { name: "Progress Bell", url: "https://images.unsplash.com/photo-1520690214124-2405c5217036?auto=format&fit=crop&q=80&w=150" },
  { name: "Solidarity Fist", url: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=150" },
  { name: "Democratic Star", url: "https://images.unsplash.com/photo-1603504824368-2b821dfbb25e?auto=format&fit=crop&q=80&w=150" }
];

export const PartyManagementPanel: React.FC<PartyManagementPanelProps> = ({
  parties,
  candidates,
  token,
  onRefresh,
  triggerToast
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [partyForm, setPartyForm] = useState({
    id: "",
    name: "",
    code: "",
    logoUrl: "",
    description: "",
    leader: "",
    foundedYear: "",
    headquarters: ""
  });

  // Track touches for field validation messages
  const [touched, setTouched] = useState({
    name: false,
    code: false,
    description: false,
    logoUrl: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Filter parties by search
  const filteredParties = parties.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.leader && p.leader.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.headquarters && p.headquarters.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      triggerToast("Please upload a valid image file, e.g. PNG, JPG.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPartyForm(prev => ({ ...prev, logoUrl: reader.result as string }));
        setTouched(prev => ({ ...prev, logoUrl: true }));
        triggerToast("Logo uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Synchronous React Form Validation state
  const isNameVal = partyForm.name.trim() !== "";
  const isCodeVal = partyForm.code ? partyForm.code.trim() !== "" : false;
  const isDescVal = partyForm.description ? partyForm.description.trim() !== "" : false;
  const isLogoVal = partyForm.logoUrl.trim() !== "";

  const isFormValid = isNameVal && isCodeVal && isDescVal && isLogoVal;

  const errors = {
    name: touched.name && !isNameVal ? "Party classification name is mandatory." : "",
    code: touched.code && !isCodeVal ? "Party code/abbreviation is mandatory." : "",
    description: touched.description && !isDescVal ? "Manifesto description is mandatory." : "",
    logoUrl: touched.logoUrl && !isLogoVal ? "Please select a quick emblem or upload a party logo." : ""
  };

  const markAllTouched = () => {
    setTouched({
      name: true,
      code: true,
      description: true,
      logoUrl: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markAllTouched();

    if (!isFormValid) {
      triggerToast("Please complete all mandatory variables properly.", true);
      return;
    }

    try {
      setIsSubmitting(true);
      const headers = { 
        "Authorization": `Bearer ${token}`, 
        "Content-Type": "application/json" 
      };
      const url = partyForm.id ? `/api/parties/${partyForm.id}` : "/api/parties";
      const method = partyForm.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(partyForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to commit political party");
      }

      triggerToast(
        partyForm.id 
          ? `Sovereign details modified for "${partyForm.name}"` 
          : `Political party "${partyForm.name}" registered successfully`
      );
      
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      triggerToast(err.message || "An unexpected error occurred", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (p: PoliticalParty) => {
    setPartyForm({
      id: p.id,
      name: p.name,
      code: p.code || "",
      logoUrl: p.logoUrl || "",
      description: p.description || "",
      leader: p.leader || "",
      foundedYear: p.foundedYear || "",
      headquarters: p.headquarters || ""
    });
    setTouched({ name: false, code: false, description: false, logoUrl: false });
    setShowModal(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const activeCandidates = candidates.filter(c => c.party === name);
    if (activeCandidates.length > 0) {
      triggerToast(`Cannot delete party: "${name}" has ${activeCandidates.length} active registered candidate(s) linked.`, true);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the party "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const res = await fetch(`/api/parties/${id}`, { 
        method: "DELETE", 
        headers 
      });

      if (!res.ok) {
        throw new Error("Deletion request denied by secure environment kernel");
      }

      triggerToast(`Political party "${name}" deleted from registry.`);
      onRefresh();
    } catch (err: any) {
      triggerToast(err.message || "Failed to delete party", true);
    }
  };

  const resetForm = () => {
    setPartyForm({
      id: "",
      name: "",
      code: "",
      logoUrl: "",
      description: "",
      leader: "",
      foundedYear: "",
      headquarters: ""
    });
    setTouched({
      name: false,
      code: false,
      description: false,
      logoUrl: false
    });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Upper controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-500" />
            <span>Nepal Sovereign Party Register</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure democratic party credentials, secure physical symbol assets, and coordinate with federal candidates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          <input
            type="text"
            placeholder="Search party by name, code, leader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-64 transition-all"
          />
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-4 py-2.5 cursor-pointer shadow-md shadow-blue-500/10 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Formulate Party</span>
          </button>
        </div>
      </div>

      {/* Grid of parties */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <AnimatePresence>
          {filteredParties.map(p => {
            const affiliatedCands = candidates.filter(c => c.party === p.name || c.party === p.code);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden p-5 space-y-4 hover:shadow-md dark:hover:border-slate-700 transition-all group"
              >
                {/* Upper Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <img 
                      src={p.logoUrl || "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=150"} 
                      alt={p.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight leading-snug line-clamp-2" title={p.name}>
                        {p.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                          {p.code || "ABBR"}
                        </span>
                        <span className="text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400">
                          Est: {p.foundedYear || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {p.description || "No official party manifesto configured."}
                  </p>
                </div>

                {/* Characteristics */}
                <div className="text-[11px] space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-450">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      Leader:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-250">{p.leader || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      Central HQ:
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={p.headquarters}>
                      {p.headquarters || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      Affiliated Candidates:
                    </span>
                    <span className={`font-mono font-extrabold px-1.5 py-0.5 rounded text-[10px] ${
                      affiliatedCands.length > 0 
                        ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40"
                        : "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/40"
                    }`}>
                      {affiliatedCands.length} Active
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEditClick(p)}
                    className="px-3 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Update</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(p.id, p.name)}
                    className="p-1.5 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredParties.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Flag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No parties match search queries</p>
            <p className="text-xs text-slate-400 mt-1">Initialize or formulate a political party directory entry above.</p>
          </div>
        )}
      </motion.div>

      {/* Party Modals Form */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/65 dark:bg-slate-955/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-850 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <span>{partyForm.id ? "Alter Political Party Credentials" : "Enroll New Political Party"}</span>
                </h4>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-705 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-sans text-slate-700 dark:text-slate-300">
                {/* Name & Abbreviation Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wide">
                      <span className="flex items-center gap-1">
                        <Flag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Party Name *</span>
                      </span>
                      {errors.name && <span className="text-[9px] text-red-500 font-medium lowercase font-sans">{errors.name}</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nepali Congress"
                      value={partyForm.name}
                      onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                      onChange={e => {
                        setPartyForm({ ...partyForm, name: e.target.value });
                        setTouched(prev => ({ ...prev, name: true }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-850 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${
                        errors.name ? "border-red-500 bg-red-50/5 dark:bg-red-950/5 focus:border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wide">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Abbr Code *</span>
                      </span>
                      {errors.code && <span className="text-[9px] text-red-500 font-medium lowercase font-sans">{errors.code}</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NC"
                      value={partyForm.code}
                      onBlur={() => setTouched(prev => ({ ...prev, code: true }))}
                      onChange={e => {
                        setPartyForm({ ...partyForm, code: e.target.value.toUpperCase() });
                        setTouched(prev => ({ ...prev, code: true }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-850 dark:text-slate-100 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-colors ${
                        errors.code ? "border-red-500 bg-red-50/5 dark:bg-red-950/5 focus:border-red-500 focus:ring-red-550" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Leader, Headquarters & Founded */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wide">
                      <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>General Leader</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sher Bahadur Deuba"
                      value={partyForm.leader}
                      onChange={e => setPartyForm({ ...partyForm, leader: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wide">
                      <Building className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>Headquarters</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sanepa, Lalitpur"
                      value={partyForm.headquarters}
                      onChange={e => setPartyForm({ ...partyForm, headquarters: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wide">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Founded Year</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1950"
                      value={partyForm.foundedYear}
                      onChange={e => setPartyForm({ ...partyForm, foundedYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* PARTY LOGO UPLOAD & PREVIEW / SELECTION SECTION */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wide">
                    <span className="flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Party Emblem / Logo Asset *</span>
                    </span>
                    {errors.logoUrl && <span className="text-[9px] text-red-500 font-semibold lowercase font-sans">{errors.logoUrl}</span>}
                  </div>

                  {/* Logo Drag-n-Drop area */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      dragActive 
                        ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/10" 
                        : errors.logoUrl
                          ? "border-red-500 bg-red-50/5 dark:bg-red-950/5 hover:border-red-600"
                          : "border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30"
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {partyForm.logoUrl ? (
                      <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                        <img 
                          src={partyForm.logoUrl} 
                          alt="Uploaded emblem" 
                          className="w-16 h-16 rounded-xl object-cover border border-slate-250 dark:border-slate-750 shadow-sm ring-4 ring-emerald-500/10"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulseinline-block"></span>
                            Emblem Loaded Successfully
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]" title={partyForm.logoUrl}>
                            Source: {partyForm.logoUrl.startsWith("data:") ? "Local File Data (Base64)" : "Network Asset Link"}
                          </p>
                          <button 
                            type="button"
                            onClick={() => {
                              setPartyForm(prev => ({ ...prev, logoUrl: "" }));
                              setTouched(prev => ({ ...prev, logoUrl: true }));
                            }}
                            className="text-red-500 hover:text-red-600 font-bold text-[10px] uppercase tracking-wider mt-1 cursor-pointer flex items-center gap-0.5"
                          >
                            <X className="w-3 h-3" /> Clear Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 dark:bg-indigo-950/40 p-2.5 rounded-full text-blue-600 dark:text-indigo-400">
                          <Upload className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-850 dark:text-slate-200">Click or Drag & Drop to Upload Emblem File</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG standard graphic definitions</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Fallback Custom URL */}
                  <div className="mt-1">
                    <span className="text-[9px] text-slate-400 block mb-1">Or input custom image web address link manually:</span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or paste base64 data"
                      value={partyForm.logoUrl.startsWith("data:") ? "" : partyForm.logoUrl}
                      onChange={e => {
                        setPartyForm({ ...partyForm, logoUrl: e.target.value });
                        setTouched(prev => ({ ...prev, logoUrl: true }));
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>

                  {/* Quick Select Presets Option */}
                  <div className="bg-slate-50 dark:bg-slate-850/50 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 mt-1">
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-2">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Select Quick Classic Emblem Presets</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_LOGOS.map((plt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPartyForm(prev => ({ ...prev, logoUrl: plt.url }));
                            setTouched(prev => ({ ...prev, logoUrl: true }));
                          }}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                            partyForm.logoUrl === plt.url 
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                              : "border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <img 
                            src={plt.url} 
                            alt={plt.name} 
                            className="w-5 h-5 rounded object-cover border border-slate-100 dark:border-slate-700"
                            referrerPolicy="no-referrer"
                          />
                          <span>{plt.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wide">
                    <span className="flex items-center gap-1">
                      <AlignLeft className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Party Manifesto / Guidelines Description *</span>
                    </span>
                    {errors.description && <span className="text-[9px] text-red-500 font-semibold lowercase font-sans">{errors.description}</span>}
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Enter official mission statement, development strategy, and civic focus..."
                    value={partyForm.description}
                    onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                    onChange={e => {
                      setPartyForm({ ...partyForm, description: e.target.value });
                      setTouched(prev => ({ ...prev, description: true }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-850 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-normal transition-colors ${
                      errors.description ? "border-red-500 bg-red-50/5 dark:bg-red-950/5 focus:border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    }`}
                  />
                </div>

                {/* alert warning info details */}
                <div className="bg-slate-50 dark:bg-slate-800/65 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p>
                    All configurations registered here undergo standard democratic oversight. If modified, affiliated candidates on active ballots automatically inherit updated logo and abbreviation codes without manual conflict resolution.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-150 dark:border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-indigo-600 dark:to-violet-600 dark:hover:from-indigo-700 dark:hover:to-violet-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/10 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Confirm & Commit Party</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Feedback helper if invalid */}
                {!isFormValid && (
                  <div className="text-center">
                    <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Confirm button is locked until all required fields (*) are completed.</span>
                    </span>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
