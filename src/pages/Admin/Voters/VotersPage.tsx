import { useMemo, useState } from "react";
import { Eye, ShieldCheck, UserX } from "lucide-react";
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
}

export default function VotersPage({
  voters,
  token,
  onUpdateVoterStatus,
}: VotersPageProps) {
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredVoters = useMemo(
    () =>
      voters.filter((voter) =>
        `${voter.fullName} ${voter.email} ${voter.mobile}`
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voters"
        description="Manage voter approvals, suspensions, and verification states from a centralized control panel."
      />

      <SectionCard
        title="Voter roster"
        description="Search and manage enrolled voter accounts."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search voter records"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
          />
        </div>
        <div className="space-y-3">
          {filteredVoters.map((voter) => {
            const status = getVoterStatus(voter);
            const approved = isVoterApproved(voter);
            const suspended =
              !!voter.isSuspended || voter.accountStatus === "Rejected";
            const busy = updatingId === voter.id;

            return (
              <div
                key={voter.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {voter.fullName}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {voter.email} • {voter.mobile}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={status} />
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                    onClick={() => setDetailId(voter.id)}
                  >
                    <Eye className="mr-1 inline h-3.5 w-3.5" />
                    View details
                  </button>
                  {!approved ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                      onClick={() =>
                        void handleStatusUpdate(voter.id, {
                          isApproved: true,
                          isVerified: true,
                          isSuspended: false,
                          accountStatus: "Approved",
                        })
                      }
                    >
                      Approve
                    </button>
                  ) : null}
                  {!approved && !suspended ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50"
                      onClick={() =>
                        void handleStatusUpdate(voter.id, {
                          isApproved: false,
                          isVerified: false,
                          isSuspended: false,
                          accountStatus: "Pending",
                        })
                      }
                    >
                      Pending
                    </button>
                  ) : null}
                  {!suspended ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
                      onClick={() =>
                        void handleStatusUpdate(voter.id, {
                          isSuspended: true,
                          isApproved: false,
                          accountStatus: "Rejected",
                        })
                      }
                    >
                      <UserX className="mr-1 inline h-3.5 w-3.5" />
                      Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-50"
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
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <AdminRecordDetailModal
        isOpen={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        type="voter"
        recordId={detailId}
        token={token}
      />
    </div>
  );
}
