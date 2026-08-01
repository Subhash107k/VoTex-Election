import { useMemo, useState } from "react";
import { CalendarDays, Plus, RefreshCcw, Trash2 } from "lucide-react";
import type { Election } from "../../../types.js";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";
import { StatusBadge } from "../../../components/Admin/Shared/StatusBadge.tsx";

interface ElectionFormValues {
  id?: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  maxVotes: number;
}

interface ElectionsPageProps {
  elections: Election[];
  onCreateElection: (payload: ElectionFormValues) => Promise<void>;
  onDeleteElection: (id: string) => Promise<void>;
  onToggleElectionStatus: (
    election: Election,
    nextStatus: "Draft" | "Active" | "Closed" | "Published",
  ) => Promise<void>;
}

const defaultForm = () => ({
  title: "",
  description: "",
  type: "General Election",
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16),
  maxVotes: 100000,
});

export default function ElectionsPage({
  elections,
  onCreateElection,
  onDeleteElection,
  onToggleElectionStatus,
}: ElectionsPageProps) {
  const [form, setForm] = useState<ElectionFormValues>(defaultForm());
  const [busy, setBusy] = useState(false);

  const sortedElections = useMemo(
    () =>
      [...elections].sort((left, right) =>
        left.title.localeCompare(right.title),
      ),
    [elections],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onCreateElection(form);
      setForm(defaultForm());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Elections"
        description="Create, update, and manage election lifecycles with the same API contracts as before."
        actions={
          <button
            type="button"
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => setForm(defaultForm())}
          >
            Reset
          </button>
        }
      />

      <SectionCard
        title="Election schedule"
        description="Use the administration workflow to publish active ballots and close completed rounds."
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {sortedElections.map((election) => (
              <div
                key={election.id}
                className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {election.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {election.description}
                    </p>
                  </div>
                  <StatusBadge status={election.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                    onClick={() =>
                      onToggleElectionStatus(
                        election,
                        election.status === "Active" ? "Closed" : "Active",
                      )
                    }
                  >
                    Toggle status
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600"
                    onClick={() => void onDeleteElection(election.id)}
                  >
                    <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                New election
              </h3>
              <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                Secure
              </div>
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Election title"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
            />
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value })
                }
              >
                <option value="General Election">General Election</option>
                <option value="Provincial Election">Provincial Election</option>
                <option value="Local Election">Local Election</option>
                <option value="By-Election">By-Election</option>
              </select>
              <input
                type="number"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                min="1"
                value={form.maxVotes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    maxVotes: Number(event.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
                required
              />
              <input
                type="datetime-local"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.endDate}
                onChange={(event) =>
                  setForm({ ...form, endDate: event.target.value })
                }
                required
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
              disabled={busy}
            >
              <Plus className="h-4 w-4" />{" "}
              {busy ? "Saving..." : "Save election"}
            </button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
