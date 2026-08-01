import React from "react";
import {
  ShieldCheck,
  Vote,
  Lock,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Sparkles,
} from "lucide-react";

interface HeroProps {
  onRegisterClick: () => void;
  onLoginClick: () => void;
  onResultsClick: () => void;
}

export default function Hero({
  onRegisterClick,
  onLoginClick,
  onResultsClick,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-28 bg-slate-50 dark:bg-slate-950">
      {/* Background Glow Accents */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-0 -z-10 h-[300px] w-[400px] rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>Next-Gen Cryptographic Civic Voting Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Empowering{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 bg-clip-text text-transparent">
                Democratic Trust
              </span>{" "}
              with Cryptographic Integrity.
            </h1>

            {/* Sub-description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              VoTex provides tamper-proof, transparent, and biometric-verified
              online elections for citizens, institutions, and civic bodies with
              end-to-end security auditability.
            </p>

            {/* CTAs Button Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                type="button"
                onClick={onRegisterClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Register to Vote</span>
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={onLoginClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4 text-emerald-500" />
                <span>Sign In to Account</span>
              </button>

              <button
                type="button"
                onClick={onResultsClick}
                className="w-full sm:w-auto px-5 py-3.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View Live Results</span>
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="pt-6 grid grid-cols-3 gap-3 border-t border-slate-200/80 dark:border-slate-850/80 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Biometric Facial ID
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  1-Voter 1-Ballot
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  End-to-End Audit
                </span>
              </div>
            </div>
          </div>

          {/* Right Hero Mockup / Graphic Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Ballot Verification Core
                    </h3>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      SYSTEM STATUS: ACTIVE & SECURED
                    </p>
                  </div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Card Body Metrics */}
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Identity Authentication
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    VERIFIED
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-teal-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Anonymized Hash Protocol
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400">
                    ENCRYPTED
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Vote className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Double-Vote Prevention
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    ENFORCED
                  </span>
                </div>
              </div>

              {/* Bottom Card Footer Banner */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[10px]">
                  Liveness & Face Template Matching
                </span>
                <span className="font-bold text-emerald-500">
                  99.98% Accuracy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
