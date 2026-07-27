import React from "react";
import { UserCheck, ShieldCheck, Vote, Award, Users } from "lucide-react";

interface StatsProps {
  stats: {
    registeredVoters: number;
    verifiedVoters: number;
    electionsConducted: number;
    candidates: number;
    votesCast: number;
  };
}

export default function StatsSection({ stats }: StatsProps) {
  const statItems = [
    {
      label: "Registered Voters",
      value: stats.registeredVoters.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Biometric Verified Voters",
      value: stats.verifiedVoters.toLocaleString(),
      icon: ShieldCheck,
      color: "text-emerald-500",
    },
    {
      label: "Elections Conducted",
      value: stats.electionsConducted.toLocaleString(),
      icon: Award,
      color: "text-purple-500",
    },
    {
      label: "Total Votes Cast",
      value: stats.votesCast.toLocaleString(),
      icon: Vote,
      color: "text-teal-500",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-emerald-900/10 via-slate-900/5 to-teal-900/10 dark:from-emerald-950/40 dark:via-slate-950/60 dark:to-teal-950/40 border-b border-slate-200/80 dark:border-slate-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 md:p-6 text-center backdrop-blur-sm shadow-sm"
              >
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 mb-3">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {item.value}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
