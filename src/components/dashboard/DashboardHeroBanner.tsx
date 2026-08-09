import React, { useEffect, useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, ArrowRight, Vote, Lock, AlertTriangle } from "lucide-react";

interface DashboardHeroBannerProps {
  user: any;
  activeElection?: any;
  hasVoted?: boolean;
  onVoteClick: () => void;
  onVerifyClick?: () => void;
}

export default function DashboardHeroBanner({
  user,
  activeElection,
  hasVoted = false,
  onVoteClick,
  onVerifyClick,
}: DashboardHeroBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    if (!activeElection?.endDate) {
      // Fallback default timer if no explicit end date is provided
      setTimeLeft({ days: 1, hours: 12, minutes: 30, seconds: 0, expired: false });
      return;
    }

    const calculateTime = () => {
      const end = new Date(activeElection.endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [activeElection?.endDate]);

  const name = user?.fullName || "Democratic Citizen";
  const voterId = user?.voterIdNumber || user?.nationalID || user?.citizenshipNumber || "VTX-NEPAL-REGISTERED";
  const isVerified = Boolean(user?.isVerified || user?.isApproved);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-950 via-blue-950/80 to-slate-950 p-6 md:p-8 text-white shadow-2xl backdrop-blur-xl">
      {/* Background Radial Glow Effects */}
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Welcome Info */}
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Official Election Voter Portal
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
              {name}
            </span>
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {hasVoted
              ? "Your vote has been cryptographically sealed and recorded in the database. Thank you for exercising your democratic right."
              : isVerified
              ? "Your identity biometrics and credentials are verified. Participate in active elections with real-time face verification."
              : "Complete your identity profile verification to unlock instant live ballot access."}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-slate-800 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Voter ID:{" "}
              <strong className="font-mono text-white">{voterId}</strong>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-slate-800 text-slate-300">
              {hasVoted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Status:{" "}
                  <strong className="text-emerald-400 font-bold">Voted & Sealed</strong>
                </>
              ) : isVerified ? (
                <>
                  <Lock className="h-4 w-4 text-blue-400 shrink-0" /> Status:{" "}
                  <strong className="text-emerald-400 font-bold">Verified & Eligible</strong>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" /> Status:{" "}
                  <strong className="text-amber-400 font-bold">Verification Pending</strong>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Right Countdown & Primary Voting Action Widget */}
        <div className="flex flex-col items-center lg:items-end gap-4 shrink-0">
          {activeElection && (
            <div className="rounded-2xl border border-slate-800/90 bg-slate-950/80 p-4 backdrop-blur-md text-center lg:text-right shadow-lg w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 justify-center lg:justify-end">
                <Clock className="h-4 w-4 animate-spin text-amber-400" />
                {activeElection.title || "Active Election"} Poll Closes In
              </div>

              {/* Countdown Grid */}
              <div className="mt-3 flex items-center justify-center gap-2 font-mono">
                <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                  <span className="block text-lg sm:text-xl font-black text-white">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Days
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-600">:</span>
                <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                  <span className="block text-lg sm:text-xl font-black text-white">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Hours
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-600">:</span>
                <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                  <span className="block text-lg sm:text-xl font-black text-white">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Mins
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-600">:</span>
                <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-center min-w-[54px]">
                  <span className="block text-lg sm:text-xl font-black text-emerald-400">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Secs
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          {hasVoted ? (
            <div className="w-full lg:w-auto px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
              <span>Vote Already Recorded</span>
            </div>
          ) : isVerified ? (
            <button
              type="button"
              onClick={onVoteClick}
              className="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <Vote className="h-4.5 w-4.5 text-white" />
              <span>Vote Now</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onVerifyClick}
              className="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <ShieldCheck className="h-4.5 w-4.5 text-white" />
              <span>Complete Verification</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
