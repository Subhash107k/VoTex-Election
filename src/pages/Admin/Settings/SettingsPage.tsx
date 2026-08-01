import { useState } from "react";
import { Save } from "lucide-react";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";

interface SettingsPageProps {
  smtpForm: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
  };
  twilioForm: { twilioSid: string; twilioToken: string; twilioFrom: string };
  onSaveConfig: (payload: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    twilioSid: string;
    twilioToken: string;
    twilioFrom: string;
  }) => Promise<void>;
}

export default function SettingsPage({
  smtpForm,
  twilioForm,
  onSaveConfig,
}: SettingsPageProps) {
  const [smtp, setSmtp] = useState(smtpForm);
  const [twilio, setTwilio] = useState(twilioForm);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onSaveConfig({ ...smtp, ...twilio });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System settings"
        description="Configure secure delivery and communication services without leaving the admin shell."
      />
      <form className="space-y-6" onSubmit={handleSubmit}>
        <SectionCard
          title="SMTP configuration"
          description="Email delivery configuration for operator and voter messaging."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={smtp.smtpHost}
              onChange={(event) =>
                setSmtp({ ...smtp, smtpHost: event.target.value })
              }
              placeholder="SMTP host"
            />
            <input
              type="number"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={smtp.smtpPort}
              onChange={(event) =>
                setSmtp({
                  ...smtp,
                  smtpPort: Number(event.target.value) || 587,
                })
              }
              placeholder="SMTP port"
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={smtp.smtpUser}
              onChange={(event) =>
                setSmtp({ ...smtp, smtpUser: event.target.value })
              }
              placeholder="SMTP user"
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={smtp.smtpPass}
              onChange={(event) =>
                setSmtp({ ...smtp, smtpPass: event.target.value })
              }
              placeholder="SMTP password"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Twilio configuration"
          description="Messaging routes used for important election communications."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={twilio.twilioSid}
              onChange={(event) =>
                setTwilio({ ...twilio, twilioSid: event.target.value })
              }
              placeholder="Twilio SID"
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={twilio.twilioToken}
              onChange={(event) =>
                setTwilio({ ...twilio, twilioToken: event.target.value })
              }
              placeholder="Twilio token"
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={twilio.twilioFrom}
              onChange={(event) =>
                setTwilio({ ...twilio, twilioFrom: event.target.value })
              }
              placeholder="Sender number"
            />
          </div>
        </SectionCard>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          disabled={busy}
        >
          <Save className="h-4 w-4" />{" "}
          {busy ? "Saving..." : "Save configuration"}
        </button>
      </form>
    </div>
  );
}
