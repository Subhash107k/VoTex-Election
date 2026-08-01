import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import type { PoliticalParty } from "../../../types.js";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";

interface PartiesPageProps {
  parties: PoliticalParty[];
}

export default function PartiesPage({ parties }: PartiesPageProps) {
  const [draft, setDraft] = useState({
    name: "",
    code: "",
    description: "",
    leader: "",
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Political parties"
        description="Review party records and keep campaign affiliations synchronized."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Registered parties"
          description="Current party registry entries managed by administrators."
        >
          <div className="space-y-3">
            {parties.map((party) => (
              <div
                key={party.id}
                className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {party.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {party.description}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {party.code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Add party"
          description="Create a lightweight party placeholder for the current election cycle."
        >
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Party name"
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Code"
              value={draft.code}
              onChange={(event) =>
                setDraft({ ...draft, code: event.target.value })
              }
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Leader"
              value={draft.leader}
              onChange={(event) =>
                setDraft({ ...draft, leader: event.target.value })
              }
            />
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              placeholder="Description"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Save party
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
