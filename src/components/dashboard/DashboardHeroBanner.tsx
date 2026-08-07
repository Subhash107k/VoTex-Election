import React, { useEffect, useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, AlertCircle, ArrowRight, Vote } from "lucide-react";

interface DashboardHeroBannerProps {
  user: any;
  onVoteClick: () => void;
}

export default function DashboardHeroBanner({ user, onVoteClick }: DashboardHeroBannerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const name = user?.fullName || "Democratic Citizen";
  const voterId = user?.nationalID || user?.citizenshipNumber || "VTX-98214-NP";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-2xl">
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Welcome Info */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Official Voter Dashboard
          </div>

          <h1 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Welcome, <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">{name}</span>
          </h1>

          <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed">
            Your voter identity is authenticated. Participate in active democratic elections using encrypted live face verification.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 border border-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Voter ID: <strong className="font-mono text-white">{voterId}</strong>
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 border border-slate-700">
              <ShieldCheck className="h-4 w-4 text-blue-400" /> Status: <strong className="text-emerald-300">Face Verified & Eligible</strong>
            </span>
          </div>
        </div>

        {/* Right Countdown & Vote Action Widget */}
        <div className="flex flex-col items-center lg:items-end gap-3 shrink-0">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4 backdrop-blur-md text-center lg:text-right">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 justify-center lg:justify-end">
              <Clock className="h-4 w-4 animate-spin text-amber-400" /> House of Representatives Poll Closes In
            </div>

            {/* Countdown Grid */}
            <div className="mt-3 flex items-center justify-center gap-2 font-mono">
              <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                <span className="block text-lg font-black text-white">{String(timeLeft.days).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">Days</span>
              </div>
              <span className="text-lg font-bold text-slate-600">:</span>
              <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                <span className="block text-lg font-black text-white">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">Hours</span>
              </div>
              <span className="text-lg font-bold text-slate-600">:</span>
              <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                <span className="block text-lg font-black text-white">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">Mins</span>
              </div>
              <span className="text-lg font-bold text-slate-600">:</span>
              <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                <span className="block text-lg font-black text-white">{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">Secs</span>
              </div>
            </div>
          </div>

          <button
            onClick={onVoteClick}
            className="w-full lg:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Vote className="h-4 w-4" /> Enter Digital Ballot Box <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
