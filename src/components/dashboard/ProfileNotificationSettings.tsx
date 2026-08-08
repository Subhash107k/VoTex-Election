import React, { useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  ShieldAlert,
  Vote,
  Sparkles,
  CheckCircle2,
  Save,
  RefreshCw,
} from "lucide-react";

interface ProfileNotificationSettingsProps {
  token: string;
  user?: any;
}

export function ProfileNotificationSettings({ token }: ProfileNotificationSettingsProps) {
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    smsReminders: true,
    securityNotices: true,
    electionReminders: true,
    candidateBroadcasts: false,
  });

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = async () => {
    setSaving(true);
    setSavedMsg(false);
    try {
      await new Promise((res) => setTimeout(res, 400));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const notificationItems = [
    {
      key: "emailAlerts" as const,
      icon: Mail,
      title: "Email Notifications & Bulletins",
      description: "Receive voter registration updates, digital vote receipts, and official bulletins.",
    },
    {
      key: "smsReminders" as const,
      icon: Smartphone,
      title: "SMS Voting Alerts",
      description: "Receive instant SMS notifications on election day opening and biometric verification.",
    },
    {
      key: "securityNotices" as const,
      icon: ShieldAlert,
      title: "Security & Login Alerts",
      description: "Get alerted immediately whenever a new login or security change occurs on your account.",
    },
    {
      key: "electionReminders" as const,
      icon: Vote,
      title: "Upcoming Election Reminders",
      description: "Receive countdown reminders 7 days and 24 hours prior to local/national polls.",
    },
    {
      key: "candidateBroadcasts" as const,
      icon: Sparkles,
      title: "Candidate & Party Manifestos",
      description: "Receive updates regarding candidate declarations and published political agendas.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notification Preferences
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Control how and when VoTex Election reaches out to you regarding official polls and security.
          </p>
        </div>

        {savedMsg && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5" /> Preferences Saved
          </span>
        )}
      </div>

      {/* Notification Options Grid */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] shadow-sm space-y-4">
        {notificationItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = preferences[item.key];
          return (
            <div
              key={item.key}
              className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 mt-0.5 shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">{item.title}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => togglePreference(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
                role="switch"
                aria-checked={isEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}

        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Notification Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileNotificationSettings;
