import { useMemo, useState } from "react";
import { Eye, Plus, Trash2, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import type { Candidate, Election } from "../../../types.js";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";
import { StatusBadge } from "../../../components/Admin/Shared/StatusBadge.tsx";
import AdminRecordDetailModal from "../../../components/Admin/Shared/AdminRecordDetailModal.tsx";
import {
  getCandidateStatus,
  isCandidateApproved,
} from "../../../components/Admin/Shared/adminStatusUtils.ts";

interface CandidateFormValues {
  id?: string;
  name: string;
  fullName: string;
  party: string;
  biography: string;
  electionId: string;
}

interface CandidatesPageProps {
  candidates: Candidate[];
  elections: Election[];
  token: string;
  onCreateCandidate: (payload: CandidateFormValues) => Promise<void>;
  onDeleteCandidate: (id: string) => Promise<void>;
  onVerifyCandidate: (
    id: string,
    status: "Verified" | "Rejected" | "Withdrawn" | "Pending",
  ) => Promise<void>;
}

const defaultForm = () => ({
  name: "",
  fullName: "",
  party: "",
  biography: "",
  electionId: "",
});

export default function CandidatesPage({
  candidates,
  elections,
  token,
  onCreateCandidate,
  onDeleteCandidate,
  onVerifyCandidate,
}: CandidatesPageProps) {
  const [form, setForm] = useState<CandidateFormValues>(defaultForm());
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredCandidates = useMemo(
    () =>
      candidates.filter((candidate) =>
        `${candidate.name} ${candidate.fullName ?? ""} ${candidate.party}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [candidates, search],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onCreateCandidate(form);
      setForm(defaultForm());
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (
    candidateId: string,
    status: "Verified" | "Rejected" | "Withdrawn" | "Pending",
  ) => {
    setUpdatingId(candidateId);
    try {
      await onVerifyCandidate(candidateId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const candidateStats = useMemo(() => {
    const total = candidates.length;
    const verified = candidates.filter((c) => {
      const status = getCandidateStatus(c);
      return status === "Verified" || status === "Approved" || isCandidateApproved(c);
    }).length;
    const unverified = total - verified;
    return { total, verified, unverified };
  }, [candidates]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Review candidate profiles and apply status updates while preserving existing verification workflows."
      />

      {/* Stat Summary Box Container */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/70">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Candidates</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{candidateStats.total}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm backdrop-blur">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Verified Candidates</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{candidateStats.verified}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm backdrop-blur">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Unverified / Pending</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{candidateStats.unverified}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      <SectionCard
        title="Candidate registry"
        description="Search, verify, or remove candidate records."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidates"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
          />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {filteredCandidates.map((candidate) => {
              const status = getCandidateStatus(candidate);
              const approved = isCandidateApproved(candidate);
              const updating = updatingId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {candidate.fullName || candidate.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {candidate.party}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => setDetailId(candidate.id)}
                    >
                      <Eye className="mr-1 inline h-3.5 w-3.5" />
                      View details
                    </button>
                    {status !== "Verified" && status !== "Approved" && (
                      <button
                        type="button"
                        disabled={updating}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                        onClick={() =>
                          void handleVerify(candidate.id, "Verified")
                        }
                      >
                        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                        Approve
                      </button>
                    )}
                    {status !== "Rejected" && (
                      <button
                        type="button"
                        disabled={updating}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                        onClick={() =>
                          void handleVerify(candidate.id, "Rejected")
                        }
                      >
                        <XCircle className="mr-1 inline h-3.5 w-3.5" />
                        Reject / Disapprove
                      </button>
                    )}
                    {status !== "Pending" && (
                      <button
                        type="button"
                        disabled={updating}
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                        onClick={() =>
                          void handleVerify(candidate.id, "Pending")
                        }
                      >
                        <Clock className="mr-1 inline h-3.5 w-3.5" />
                        Pending
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={updating}
                      className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 transition-colors cursor-pointer"
                      onClick={() => void onDeleteCandidate(candidate.id)}
                    >
                      <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Candidate intake
              </h3>
              <div className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Review
              </div>
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Display name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Full legal name"
              value={form.fullName}
              onChange={(event) =>
                setForm({ ...form, fullName: event.target.value })
              }
              required
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Party or affiliation"
              value={form.party}
              onChange={(event) =>
                setForm({ ...form, party: event.target.value })
              }
              required
            />
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Biography"
              value={form.biography}
              onChange={(event) =>
                setForm({ ...form, biography: event.target.value })
              }
            />
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={form.electionId}
              onChange={(event) =>
                setForm({ ...form, electionId: event.target.value })
              }
            >
              <option value="">Select election</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
              disabled={busy}
            >
              <Plus className="h-4 w-4" />{" "}
              {busy ? "Saving..." : "Save candidate"}
            </button>
          </form>
        </div>
      </SectionCard>

      <AdminRecordDetailModal
        isOpen={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        type="candidate"
        recordId={detailId}
        token={token}
        onVerify={onVerifyCandidate}
        onDelete={onDeleteCandidate}
      />
    </div>
  );
}
