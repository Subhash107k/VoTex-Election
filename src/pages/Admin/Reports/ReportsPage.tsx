import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Export operational reports and audit summaries directly from the admin workspace."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Election exports"
          description="Download CSV summaries for public reporting and internal review."
        >
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export ballots
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              <Download className="h-4 w-4" /> Download audit
            </button>
          </div>
        </SectionCard>
        <SectionCard
          title="Security snapshot"
          description="Operational health and integrity posture."
        >
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Secure and compliant
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              All major systems have active monitoring and backing telemetry.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
