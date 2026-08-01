import { TrendingUp } from "lucide-react";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track system engagement and election momentum through a streamlined analytics view."
      />
      <SectionCard
        title="Performance overview"
        description="Key indicators for recent operations."
      >
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Engagement is
            trending positively
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This analytics workspace provides a stable foundation for future
            charts and drill-down reporting.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
