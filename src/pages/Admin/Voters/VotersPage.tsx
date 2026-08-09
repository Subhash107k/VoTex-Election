import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserX,
  Users,
  X,
} from "lucide-react";
import type { User } from "../../../types.js";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";
import { StatusBadge } from "../../../components/Admin/Shared/StatusBadge.tsx";
import AdminRecordDetailModal from "../../../components/Admin/Shared/AdminRecordDetailModal.tsx";
import {
  getVoterStatus,
  isVoterApproved,
} from "../../../components/Admin/Shared/adminStatusUtils.ts";

interface VotersPageProps {
  voters: User[];
  token: string;
  onUpdateVoterStatus: (
    id: string,
    payload: {
      isApproved?: boolean;
      isVerified?: boolean;
      isSuspended?: boolean;
      accountStatus?: string;
    },
  ) => Promise<void>;
  onDeleteVoter?: (voterId: string) => Promise<void>;
}

export default function VotersPage({
  voters,
  token,
  onUpdateVoterStatus,
  onDeleteVoter,
}: VotersPageProps) {
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteModalVoter, setDeleteModalVoter] = useState<User | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = useMemo(() => {
    const total = voters.length;
    const verified = voters.filter((voter) => {
      const status = getVoterStatus(voter);
      return (
        status === "Verified" ||
        status === "Approved" ||
        isVoterApproved(voter)
      );
    }).length;
    const unverified = total - verified;
    return { total, verified, unverified };
  }, [voters]);

  const filteredVoters = useMemo(
    () =>
      voters.filter((voter) =>
        `${voter.fullName} ${voter.email} ${voter.mobile} ${voter.nationalID || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [voters, search],
  );

  const handleStatusUpdate = async (
    voterId: string,
    payload: Parameters<VotersPageProps["onUpdateVoterStatus"]>[1],
  ) => {
    setUpdatingId(voterId);
    try {
      await onUpdateVoterStatus(voterId, payload);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalVoter || !onDeleteVoter) return;
    setIsDeleting(true);
    try {
      await onDeleteVoter(deleteModalVoter.id);
      setDeleteModalVoter(null);
      setDeleteReason("");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voters Management"
        description="Manage voter approvals, suspensions, verification states, and administrative deletions from a centralized control panel."
      />

      {/* Stat Summary Box Container */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/70">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Voters
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm backdrop-blur">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified / Approved
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.verified}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm backdrop-blur">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Unverified / Pending
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.unverified}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      <SectionCard
        title="Voter Roster"
        description="Search, inspect, manage approvals, and remove enrolled voter accounts."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone, or National ID..."
            className="w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="space-y-3">
          {filteredVoters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
              <Users className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                No voter records match your search criteria.
              </p>
            </div>
          ) : (
            filteredVoters.map((voter) => {
              const status = getVoterStatus(voter);
              const approved = isVoterApproved(voter);
              const suspended =
                !!voter.isSuspended || voter.accountStatus === "Rejected";
              const busy = updatingId === voter.id;

              return (
                <div
                  key={voter.id}
                  className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {approved ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : suspended ? (
                        <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                        {voter.fullName}
                      </h3>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {voter.email} • {voter.mobile}
                    </p>
                  </div>

                  {/* Redesigned Action Button Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                    {/* View Details */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
                      onClick={() => setDetailId(voter.id)}
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-500" />
                      View Details
                    </button>

                    {/* Approve Action */}
                    {!approved ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        onClick={() =>
                          void handleStatusUpdate(voter.id, {
                            isApproved: true,
                            isVerified: true,
                            isSuspended: false,
                            accountStatus: "Approved",
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Approve
                      </button>
                    ) : null}

                    {/* Pending Action */}
                    {!approved && !suspended ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        onClick={() =>
                          void handleStatusUpdate(voter.id, {
                            isApproved: false,
                            isVerified: false,
                            isSuspended: false,
                            accountStatus: "Pending",
                          })
                        }
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        Pending
                      </button>
                    ) : null}

                    {/* Suspend / Reinstate Action */}
                    {!suspended ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        onClick={() =>
                          void handleStatusUpdate(voter.id, {
                            isSuspended: true,
                            isApproved: false,
                            accountStatus: "Rejected",
                          })
                        }
                      >
                        <UserX className="h-3.5 w-3.5 text-rose-500" />
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        onClick={() =>
                          void handleStatusUpdate(voter.id, {
                            isSuspended: false,
                            isApproved: false,
                            accountStatus: "Pending",
                          })
                        }
                      >
                        Reinstate
                      </button>
                    )}

                    {/* Delete Action Button */}
                    <button
                      type="button"
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-600/30 bg-red-600/10 hover:bg-red-600/20 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      onClick={() => setDeleteModalVoter(voter)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>

      {/* Record Detail Modal */}
      <AdminRecordDetailModal
        isOpen={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        type="voter"
        recordId={detailId}
        token={token}
        onVerify={async (id, updates) => handleStatusUpdate(id, updates)}
        onDelete={async (id) => {
          const target = voters.find((v) => v.id === id);
          if (target) setDeleteModalVoter(target);
          setDetailId(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    Confirm Permanent Delete
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Voter Record #{deleteModalVoter.id.substring(0, 10)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalVoter(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-slate-300">
                Are you sure you want to permanently delete voter record{" "}
                <strong className="text-white font-extrabold">
                  {deleteModalVoter.fullName}
                </strong>{" "}
                (<span className="text-slate-400 font-mono">{deleteModalVoter.email}</span>)?
              </p>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] font-medium text-amber-300">
                ⚠️ Warning: Deleting a voter account permanently removes their identity records, verification history, and credential dossier from the database. This action cannot be undone.
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Reason for Removal (Optional Log Note)
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Requested removal / Fraudulent registration duplicate"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalVoter(null)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-extrabold text-white transition-colors cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
