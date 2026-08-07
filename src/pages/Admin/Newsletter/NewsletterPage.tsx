import { useEffect, useState } from "react";
import {
  Mail,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  Clock3,
  Send,
} from "lucide-react";
import type { ContactRequest, NewsletterSubscriber } from "../../../types.js";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";
import {
  authHeader,
  jsonRequestOptions,
  requestJson,
} from "../../../services/apiClient.ts";

interface NewsletterPageProps {
  token: string;
  subscribers: NewsletterSubscriber[];
  onUpdateStatus: (
    subscriberId: string,
    status: "Active" | "Inactive" | "Pending",
  ) => Promise<void>;
  onDeleteSubscriber: (subscriberId: string) => Promise<void>;
}

const statusStyles: Record<NewsletterSubscriber["status"], string> = {
  Active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
  Inactive:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
};

export default function NewsletterPage({
  token,
  subscribers,
  onUpdateStatus,
  onDeleteSubscriber,
}: NewsletterPageProps) {
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactError, setContactError] = useState("");
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadContactRequests = async () => {
      setLoadingContacts(true);
      setContactError("");

      try {
        const response = await requestJson<{ requests?: ContactRequest[] }>(
          "/api/admin/contact-requests",
          { headers: authHeader(token) },
        );

        if (isMounted) {
          setContactRequests(response.requests || []);
        }
      } catch (error) {
        if (isMounted) {
          setContactError(
            error instanceof Error
              ? error.message
              : "Unable to load contact requests.",
          );
        }
      } finally {
        if (isMounted) {
          setLoadingContacts(false);
        }
      }
    };

    void loadContactRequests();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleReply = async (requestId: string) => {
    const replyText = (replyDrafts[requestId] || "").trim();
    if (!replyText) return;

    setSendingReplyId(requestId);
    setContactError("");

    try {
      const options = jsonRequestOptions("PATCH", { reply: replyText });
      const response = await requestJson<{ request: ContactRequest }>(
        `/api/admin/contact-requests/${requestId}/reply`,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
        },
      );

      setContactRequests((current) =>
        current.map((request) =>
          request.id === requestId ? response.request : request,
        ),
      );
      setReplyDrafts((current) => ({ ...current, [requestId]: "" }));
    } catch (error) {
      setContactError(
        error instanceof Error ? error.message : "Unable to send reply.",
      );
    } finally {
      setSendingReplyId(null);
    }
  };

  const totals = {
    all: subscribers.length,
    active: subscribers.filter((subscriber) => subscriber.status === "Active")
      .length,
    inactive: subscribers.filter(
      (subscriber) => subscriber.status === "Inactive",
    ).length,
    pending: subscribers.filter((subscriber) => subscriber.status === "Pending")
      .length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Election Bulletins"
        description="Review public bulletin subscribers and control their delivery status."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total",
            value: totals.all,
            icon: <Mail className="h-4 w-4" />,
          },
          {
            label: "Active",
            value: totals.active,
            icon: <ShieldCheck className="h-4 w-4" />,
          },
          {
            label: "Inactive",
            value: totals.inactive,
            icon: <UserMinus className="h-4 w-4" />,
          },
          {
            label: "Pending",
            value: totals.pending,
            icon: <Clock3 className="h-4 w-4" />,
          },
        ].map((item) => (
          <SectionCard key={item.label} title={item.label} description="">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                {item.icon}
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                {item.value}
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Contact requests"
        description="Public support messages from the contact page appear here so admins can respond directly."
      >
        <div className="space-y-4">
          {loadingContacts ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading contact requests...
            </div>
          ) : null}

          {contactError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
              {contactError}
            </div>
          ) : null}

          {!loadingContacts && contactRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No contact requests have been submitted yet.
            </div>
          ) : null}

          {contactRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {request.name}
                    </h3>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {request.email}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {request.subject}
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date(request.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                {request.message}
              </div>

              {request.reply ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                    Admin reply
                  </p>
                  <p className="mt-1">{request.reply}</p>
                </div>
              ) : null}

              <div className="mt-3 space-y-2">
                <textarea
                  rows={3}
                  value={replyDrafts[request.id] ?? ""}
                  onChange={(event) =>
                    setReplyDrafts((current) => ({
                      ...current,
                      [request.id]: event.target.value,
                    }))
                  }
                  placeholder="Write a reply for this contact request..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
                <button
                  type="button"
                  disabled={sendingReplyId === request.id}
                  onClick={() => void handleReply(request.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sendingReplyId === request.id ? "Sending..." : "Send reply"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Subscriber roster"
        description="Latest subscriptions appear at the top of the list."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 pr-4 font-semibold">Email</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Subscribed</th>
                <th className="py-3 pr-4 font-semibold">Source</th>
                <th className="py-3 pr-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="align-top">
                  <td className="py-4 pr-4 font-medium text-slate-900 dark:text-white">
                    {subscriber.email}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[subscriber.status]}`}
                    >
                      {subscriber.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                    {new Date(subscriber.subscribedAt).toLocaleString()}
                  </td>
                  <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                    {subscriber.source}
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void onUpdateStatus(subscriber.id, "Active")
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Active
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void onUpdateStatus(subscriber.id, "Pending")
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-950/30"
                      >
                        <Clock3 className="h-3.5 w-3.5" /> Pending
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void onUpdateStatus(subscriber.id, "Inactive")
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Inactive
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteSubscriber(subscriber.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No newsletter subscribers have been recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
