import React from "react";
import { ShieldCheck, UserCheck2, Vote, Lock, FileText, CheckCircle, Activity, Award } from "lucide-react";

export default function Features() {
  const featureList = [
    {
      icon: UserCheck2,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-blue-500",
      title: "Biometric Liveness Verification",
      description:
        "Real-time webcam facial detection and template matching prevent impersonation and identity fraud prior to ballot access.",
    },
    {
      icon: Lock,
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-500",
      title: "Zero-Knowledge Ballot Privacy",
      description:
        "Voter authentication credentials are completely decoupled from submitted ballots, safeguarding voter anonymity.",
    },
    {
      icon: ShieldCheck,
      color: "from-purple-500 to-indigo-600",
      textColor: "text-purple-500",
      title: "Strict Identity Uniqueness",
      description:
        "Database-enforced constraints ensure National ID, Citizenship, Email, and Phone number can only register a single account.",
    },
    {
      icon: Vote,
      color: "from-teal-500 to-emerald-600",
      textColor: "text-teal-500",
      title: "Double-Vote Prevention",
      description:
        "Transactional lock mechanisms ensure that once a ballot is submitted, duplicate attempts are immediately blocked.",
    },
    {
      icon: Activity,
      color: "from-amber-500 to-orange-600",
      textColor: "text-amber-500",
      title: "Real-Time Election Auditing",
      description:
        "Live vote counting with candidate breakdown graphs and transparent election status indicators once published by officers.",
    },
    {
      icon: FileText,
      color: "from-rose-500 to-pink-600",
      textColor: "text-rose-500",
      title: "Dual OTP Authentication",
      description:
        "Mandatory 6-digit email and SMS verification codes validate voter contact ownership during account registration.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            Built for High-Assurance Elections
          </h2>
          <p className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Security & Integrity Engineered into Every Step
          </p>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            From biometric identity verification to encrypted vote counting, VoTex provides institutional-grade guarantees for modern digital elections.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featureList.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-slate-950 font-extrabold shadow-md mb-5 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-6 w-6 text-white stroke-[2]" />
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-500 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
