import React, { useEffect, useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, ArrowRight, Vote, Lock } from "lucide-react";

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
    <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-950 via-blue-950/80 to-slate-950 p-6 md:p-8 text-white shadow-2xl backdrop-blur-xl">
      {/* Background Radial Glow Effects */}
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Welcome Info */}
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Official National Voter Portal
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Welcome back, <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent">{name}</span>
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Your biometrics and identity credentials are cryptographically sealed. Participate in active elections with instant real-time face verification.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-slate-800 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Voter ID: <strong className="font-mono text-white">{voterId}</strong>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-slate-800 text-slate-300">
              <Lock className="h-4 w-4 text-blue-400 shrink-0" /> Status: <strong className="text-emerald-400 font-bold">Face Verified & Eligible</strong>
            </span>
          </div>
        </div>

        {/* Right Countdown & Vote Action Widget */}
        <div className="flex flex-col items-center lg:items-end gap-4 shrink-0">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/80 p-4 backdrop-blur-md text-center lg:text-right shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 justify-center lg:justify-end">
              <Clock className="h-4 w-4 animate-spin text-amber-400" /> House of Representatives Poll Closes In
            </div>

            {/* Countdown Grid */}
            <div className="mt-3 flex items-center justify-center gap-2 font-mono">
              <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                <span className="block text-lg sm:text-xl font-black text-white">{String(timeLeft.days).padStart(2, "0")}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Days</span>
              </div>
              <span className="text-lg font-bold text-slate-600">:</span>
              <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                <span className="block text-lg sm:text-xl font-black text-white">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Hours</span>
              </div>
              <span className="text-lg font-bold text-slate-600">:</span>
              <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                <span className="block text-lg sm:text-xl font-black text-white">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mins</span>
              </div>
              <span className="text-lg font-bold text-slate-600">:</span>
              <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                <span className="block text-lg sm:text-xl font-black text-emerald-400">{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Secs</span>
              </div>
            </div>
          </div>

          <button
            onClick={onVoteClick}
            className="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 group"
          >
            <Vote className="h-4.5 w-4.5 text-white" />
            <span>Cast Digital Ballot</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
