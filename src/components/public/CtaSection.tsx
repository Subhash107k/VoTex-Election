import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Vote,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface CtaSectionProps {
  onRegisterClick: () => void;
  onLoginClick: () => void;
}

type Election = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

type Candidate = {
  id: string;
  name: string;
  fullName?: string;
  party?: string;
  electionId?: string;
};

export default function CtaSection({
  onRegisterClick,
  onLoginClick,
}: CtaSectionProps) {
  const [loading, setLoading] = useState(false);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/elections");
        if (!res.ok) throw new Error("Failed to load elections");
        const json = await res.json();
        const list: Election[] = (json.elections || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          status: e.status,
          startDate: e.startDate,
          endDate: e.endDate,
        }));

        const active = list.find((e) => e.status === "Active") || null;
        if (!mounted) return;
        setActiveElection(active);

        if (active) {
          const candRes = await fetch(
            `/api/candidates?electionId=${active.id}`,
          );
          if (!candRes.ok) throw new Error("Failed to load candidates");
          const candJson = await candRes.json();
          const candList: Candidate[] = (candJson.candidates || []).map(
            (c: any) => ({
              id: c.id,
              name: c.name || c.fullName || "Unknown",
              fullName: c.fullName,
              party: c.party,
              electionId: c.electionId,
            }),
          );
          if (!mounted) return;
          setCandidates(candList);
        } else {
          setCandidates([]);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 p-8 sm:p-12 md:p-16 text-slate-950 shadow-2xl overflow-hidden">
          <div className="absolute -right-12 -bottom-12 opacity-15 pointer-events-none">
            <Vote className="h-96 w-96 text-white stroke-[1]" />
          </div>

          <div className="relative z-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-12 h-12 text-emerald-200 animate-spin mb-3" />
                <span className="text-sm text-emerald-100 font-mono">
                  Checking election status…
                </span>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-white/10 text-emerald-50">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-200" />
                  <div>
                    <h3 className="text-sm font-extrabold">
                      Unable to load election info
                    </h3>
                    <p className="text-xs mt-1 text-emerald-100/80">{error}</p>
                  </div>
                </div>
              </div>
            ) : activeElection ? (
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/20 backdrop-blur-md text-white text-xs font-bold font-mono">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <span>Live Election — Cast your vote securely</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2 space-y-3">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                      {activeElection.title}
                    </h2>
                    <p className="text-sm text-emerald-50/90 font-medium leading-relaxed">
                      {activeElection.description ||
                        "Secure, verified voting with end-to-end auditable results."}
                    </p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {candidates.length === 0 ? (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-sm text-emerald-100">
                            No candidates published yet for this election.
                          </p>
                        </div>
                      ) : (
                        candidates.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
                          >
                            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-white font-bold text-sm">
                              {c.name
                                ? c.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                : "?"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="font-bold text-sm text-white">
                                    {c.name}
                                  </div>
                                  <div className="text-[11px] text-emerald-100/80">
                                    {c.party || "Independent"}
                                  </div>
                                </div>
                                <div className="text-[11px] text-emerald-100 font-mono">
                                  {/* placeholder for votes/stats */}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <aside className="lg:col-span-1">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-emerald-100/80">
                          Starts
                        </span>
                        <span className="text-xs font-mono text-emerald-100/80">
                          Ends
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-4 text-[12px] text-emerald-50">
                        <span>
                          {activeElection.startDate
                            ? new Date(
                                activeElection.startDate,
                              ).toLocaleString()
                            : "TBD"}
                        </span>
                        <span>
                          {activeElection.endDate
                            ? new Date(activeElection.endDate).toLocaleString()
                            : "TBD"}
                        </span>
                      </div>

                      <button
                        onClick={onLoginClick}
                        className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm mb-2 flex items-center justify-center gap-2"
                      >
                        <Vote className="w-4 h-4" />
                        Sign In & Vote
                      </button>

                      <button
                        onClick={onRegisterClick}
                        className="w-full py-3 rounded-xl border border-white/10 text-white text-sm font-semibold"
                      >
                        Register to Vote
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="p-6 md:p-8 rounded-2xl text-center border bg-white/5">
                <Calendar className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                <h3 className="font-extrabold text-white text-lg">
                  No Active Election
                </h3>
                <p className="text-sm text-emerald-100/80 mt-1">
                  Upcoming — check back soon or register to receive
                  notifications.
                </p>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={onRegisterClick}
                    className="px-5 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-bold"
                  >
                    Register Now
                  </button>

                  <button
                    onClick={onLoginClick}
                    className="px-5 py-2 rounded-2xl border border-white/10 text-white font-semibold"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
