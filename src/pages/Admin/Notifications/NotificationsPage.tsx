import { BellRing, Send } from "lucide-react";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Dispatch announcements and manage the communication layer from one screen."
      />
      <SectionCard
        title="Broadcast message"
        description="Send a new system-wide notification."
      >
        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            placeholder="Notification title"
          />
          <textarea
            className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            placeholder="Message body"
          />
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Send className="h-4 w-4" /> Send notification
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
