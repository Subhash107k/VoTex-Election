import { useMemo, useState } from "react";
import { Edit2, Eye, Search, Trash2, Upload, Users, Building, Calendar } from "lucide-react";
import type { Candidate, PoliticalParty } from "../../../types.js";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";
import Modal from "../../../components/ui/Modal.tsx";
import {
  ApiError,
  jsonRequestOptions,
  requestJson,
} from "../../../services/apiClient.js";

interface PartiesPageProps {
  parties: PoliticalParty[];
  candidates: Candidate[];
  token: string;
  onRefresh: () => void;
}

interface PartyFormData {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  description: string;
  leader: string;
  foundedYear: string;
  headquarters: string;
}

const emptyFormData: PartyFormData = {
  id: "",
  name: "",
  code: "",
  logoUrl: "",
  description: "",
  leader: "",
  foundedYear: "",
  headquarters: "",
};

const presetLogos = [
  "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1520690214124-2405c5217036?auto=format&fit=crop&q=80&w=150",
];

export default function PartiesPage({
  parties,
  candidates,
  token,
  onRefresh,
}: PartiesPageProps) {
  const [formData, setFormData] = useState<PartyFormData>(emptyFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedParty, setSelectedParty] = useState<PoliticalParty | null>(null);

  const filteredParties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return parties;
    return parties.filter((party) =>
      [
        party.name,
        party.code,
        party.description,
        party.leader,
        party.headquarters,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [parties, searchQuery]);

  const candidateCount = (party: PoliticalParty) =>
    candidates.filter(
      (candidate) =>
        candidate.party === party.name || candidate.party === party.code,
    ).length;

  const resetFormData = () => setFormData(emptyFormData);

  const startEdit = (party: PoliticalParty) => {
    setFormData({
      id: party.id,
      name: party.name || "",
      code: party.code || "",
      logoUrl: party.logoUrl || "",
      description: party.description || "",
      leader: party.leader || "",
      foundedYear: party.foundedYear || "",
      headquarters: party.headquarters || "",
    });
  };

  const saveParty = async () => {
    if (!formData.name.trim() || !formData.code.trim() || !formData.description.trim()) {
      alert("Party name, code, and description are required.");
      return;
    }

    try {
      setIsSaving(true);
      const method = formData.id ? "PUT" : "POST";
      await requestJson(
        formData.id ? `/api/parties/${formData.id}` : "/api/parties",
        {
          ...jsonRequestOptions(method, formData),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      resetFormData();
      onRefresh();
    } catch (error) {
      alert(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Unable to save party.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteParty = async (party: PoliticalParty) => {
    const linked = candidateCount(party);
    if (linked > 0) {
      alert(
        `Cannot delete ${party.name}; ${linked} candidate(s) are linked to it.`,
      );
      return;
    }
    if (!window.confirm(`Delete ${party.name}? This cannot be undone.`)) return;

    try {
      setIsSaving(true);
      await requestJson(`/api/parties/${party.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch (error) {
      alert(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Unable to delete party.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Political parties"
        description="Manage party records, logos, and candidate affiliations from one admin screen."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Registered parties"
          description="Search, edit, and remove party registry entries."
        >
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                placeholder="Search parties"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={resetFormData}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-800"
            >
              New party
            </button>
          </div>
          <div className="space-y-3">
            {filteredParties.map((party) => (
              <div
                key={party.id}
                className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {party.name}
                      </h3>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {party.code || "N/A"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {party.description || "No description available."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Leader: {party.leader || "Not set"} | Candidates linked:{" "}
                      {candidateCount(party)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      onClick={() => setSelectedParty(party)}
                    >
                      <Eye className="mr-1 inline h-3.5 w-3.5" />
                      View details
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(party)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold dark:border-slate-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteParty(party)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredParties.length === 0 ? (
              <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
                No parties match the search.
              </p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title={formData.id ? "Edit Political Party" : "Add Political Party"}
          description="Register a new political party or update official registry details."
        >
          <form onSubmit={(e) => { e.preventDefault(); void saveParty(); }} className="space-y-4 text-xs">
            {/* Live Logo Preview Header */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 shadow-sm">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Party logo preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Building className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                  {formData.name || "New Political Party"}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                  {formData.code ? `Code: ${formData.code}` : "Enter party name & short code below"}
                </p>
              </div>
            </div>

            {/* Basic Info: 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Party Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rastriya Prajatantra Party"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Abbreviation Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RPP"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            {/* Leadership & History */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Party Leader
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajendra Lingden"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.leader}
                  onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Founded Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1990"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.foundedYear}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Headquarters
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu, Nepal"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.headquarters}
                  onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                />
              </div>
            </div>

            {/* Logo URL & Presets */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Logo Emblem URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              />

              {/* Preset Logos with visual thumbnails */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Quick Presets:</span>
                <div className="flex gap-2">
                  {presetLogos.map((logo, idx) => (
                    <button
                      key={logo}
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: logo })}
                      className={`group relative h-7 w-7 rounded-lg overflow-hidden border transition-all ${
                        formData.logoUrl === logo
                          ? "border-blue-500 ring-2 ring-blue-500/30 scale-105"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-400"
                      }`}
                      title={`Select preset emblem ${idx + 1}`}
                    >
                      <img src={logo} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manifesto & Party Summary
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                placeholder="Enter party principles, founding objectives, and ideology..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                {isSaving
                  ? "Saving to registry..."
                  : formData.id
                    ? "Update Party Entry"
                    : "Save New Party"}
              </button>
              {formData.id && (
                <button
                  type="button"
                  onClick={resetFormData}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </SectionCard>
      </div>

      {selectedParty && (
        <Modal
          isOpen={Boolean(selectedParty)}
          onClose={() => setSelectedParty(null)}
          title={selectedParty.name}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-400">
                Code: {selectedParty.code}
              </span>
              <span className="text-xs font-mono text-slate-400">
                ID: {selectedParty.id}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Party Description
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {selectedParty.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Party Leader
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {selectedParty.leader || "Not set"}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Founded Year
                  </span>
                  <span className="text-slate-200 font-semibold font-mono">
                    {selectedParty.foundedYear || "N/A"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Headquarters
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {selectedParty.headquarters || "N/A"}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Linked Candidates Count
                  </span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {candidateCount(selectedParty)} Candidates
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

