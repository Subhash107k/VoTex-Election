import { ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";

export default function VerificationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification"
        description="Coordinate identity, document, and biometric validation queues from one location."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Pending review"
          description="Cases awaiting manual approval and operator review."
        >
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Sparkles className="h-4 w-4" /> 6 cases require attention
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title="Verified identities"
          description="Successful biometric and document validations."
        >
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> 84 approvals completed
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
