import React, { useState } from "react";
import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Send,
  Calendar,
} from "lucide-react";

interface PublicContactPageProps {
  handleNav: (path: string) => void;
  theme: "light" | "dark";
}

export default function PublicContactPage({
  handleNav,
  theme,
}: PublicContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [supportCode, setSupportCode] = useState("10000");

  const isLight = theme === "light";
  const bgCard = isLight
    ? "bg-white border-slate-200/80 shadow-sm"
    : "bg-slate-950 border-slate-850 shadow-2xl";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";
  const inputBg = isLight
    ? "bg-slate-100 text-slate-900 border-slate-200"
    : "bg-slate-900 text-white border-slate-800";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSupportCode(String(10000 + (Date.now() % 90000)));
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSubmitting(false);
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <section
      className={`min-h-screen px-4 py-14 md:px-8 md:py-20 ${isLight ? "bg-slate-50" : "bg-slate-900"}`}
    >
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => handleNav("/")}
          className={`mb-6 text-sm font-semibold underline-offset-4 hover:underline ${textMuted}`}
        >
          ← Back to home
        </button>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className={`rounded-3xl border ${bgCard} p-6 md:p-8`}>
            <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.24em] text-blue-500">
              Official Support Channels
            </p>
            <h1
              className={`mt-3 text-3xl font-black ${textTitle} tracking-tight`}
            >
              Contact the VoTex Support Desk
            </h1>
            <p className={`mt-4 text-sm leading-relaxed ${textMuted}`}>
              Need help with enrollment, verification, accessibility, or
              election questions? Reach out through our verified support
              channels.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-emerald-500" />
                <div>
                  <p className={`font-semibold ${textTitle}`}>Support email</p>
                  <p className={`text-sm ${textMuted}`}>
                    support@votex-system.gov
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-teal-500" />
                <div>
                  <p className={`font-semibold ${textTitle}`}>Help line</p>
                  <p className={`text-sm ${textMuted}`}>
                    +1 (800) 555-VTEX (8839)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-blue-500" />
                <div>
                  <p className={`font-semibold ${textTitle}`}>Office</p>
                  <p className={`text-sm ${textMuted}`}>
                    600 Congress Ave. Suite 1400, Austin, TX 78701
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-indigo-500" />
                <div>
                  <p className={`font-semibold ${textTitle}`}>Working hours</p>
                  <p className={`text-sm ${textMuted}`}>
                    Monday – Friday | 08:00 AM – 05:00 PM CST
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border ${bgCard} p-6 md:p-8`}>
            <h2 className={`text-xl font-extrabold ${textTitle}`}>
              Send a secure support request
            </h2>
            <p className={`mt-2 text-sm ${textMuted}`}>
              Your request will be logged for the support team and reviewed
              shortly.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-4 text-sm"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your full name"
                  className={`rounded-xl border px-3 py-2.5 ${inputBg}`}
                />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Your email"
                  className={`rounded-xl border px-3 py-2.5 ${inputBg}`}
                />
              </div>
              <input
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Subject"
                className={`rounded-xl border px-3 py-2.5 ${inputBg}`}
              />
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Describe your issue or question"
                className={`rounded-xl border px-3 py-2.5 ${inputBg}`}
              />

              {submitted && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Message sent. Support code VTEX-TKT-{supportCode}.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 font-bold uppercase tracking-wide text-slate-950 transition-opacity hover:opacity-90"
              >
                {submitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
