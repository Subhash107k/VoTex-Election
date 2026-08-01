import { useMemo, useState } from "react";
import { Edit2, Search, Trash2, Upload } from "lucide-react";
import type { Candidate, PoliticalParty } from "../../../types.js";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";
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

interface PartyDraft {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  description: string;
  leader: string;
  foundedYear: string;
  headquarters: string;
}

const emptyDraft: PartyDraft = {
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
  const [draft, setDraft] = useState<PartyDraft>(emptyDraft);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const resetDraft = () => setDraft(emptyDraft);

  const startEdit = (party: PoliticalParty) => {
    setDraft({
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
    if (!draft.name.trim() || !draft.code.trim() || !draft.description.trim()) {
      alert("Party name, code, and description are required.");
      return;
    }

    try {
      setIsSaving(true);
      const method = draft.id ? "PUT" : "POST";
      await requestJson(
        draft.id ? `/api/parties/${draft.id}` : "/api/parties",
        {
          ...jsonRequestOptions(method, draft),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      resetDraft();
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
              onClick={resetDraft}
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(party)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-slate-800"
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
          title={draft.id ? "Edit party" : "Add party"}
          description="Create or update a party registry entry."
        >
          <div className="space-y-3">
            {(
              [
                "name",
                "code",
                "logoUrl",
                "leader",
                "foundedYear",
                "headquarters",
              ] as const
            ).map((field) => (
              <input
                key={field}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                placeholder={
                  field === "logoUrl"
                    ? "Logo URL"
                    : field === "foundedYear"
                      ? "Founded year"
                      : field.charAt(0).toUpperCase() + field.slice(1)
                }
                value={draft[field]}
                onChange={(event) =>
                  setDraft({ ...draft, [field]: event.target.value })
                }
              />
            ))}
            <div className="flex flex-wrap gap-2">
              {presetLogos.map((logo) => (
                <button
                  key={logo}
                  type="button"
                  onClick={() => setDraft({ ...draft, logoUrl: logo })}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs dark:border-slate-800"
                >
                  Use preset logo
                </button>
              ))}
            </div>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Description"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void saveParty()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />{" "}
                {isSaving
                  ? "Saving..."
                  : draft.id
                    ? "Update party"
                    : "Save party"}
              </button>
              {draft.id ? (
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-800"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
