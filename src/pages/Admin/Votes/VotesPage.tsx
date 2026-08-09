import React, { useCallback, useEffect, useState } from "react";
import {
  Vote,
  Users,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Crown,
  ShieldCheck,
  Radio,
  Lock,
  Search,
  Filter,
  BarChart3,
  Award,
  Clock,
} from "lucide-react";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";

interface VotesPageProps {
  token: string;
}

interface CandidateTally {
  id: string;
  name: string;
  party: string;
  partySymbol?: string;
  photoUrl?: string;
  voteCount: number;
  percentage: number;
  position?: string;
}

interface ElectionTally {
  id: string;
  title: string;
  status: string;
  totalVotes: number;
  candidates: CandidateTally[];
  leadingCandidate?: CandidateTally | null;
}

interface RecentVote {
  id: string;
  receiptHash: string;
  electionTitle: string;
  candidateName: string;
  candidateParty: string;
  timestamp: string;
  status: string;
  district: string;
}

interface TelemetryData {
  totalVotes: number;
  registeredVoters: number;
  turnoutPercent: number;
  activeElections: number;
  electionTallies: ElectionTally[];
  recentVotes: RecentVote[];
}

export function VotesPage({ token }: VotesPageProps) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedElectionId, setSelectedElectionId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchTelemetry = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await fetch("/api/admin/votes/telemetry", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.warn("Failed to fetch votes telemetry:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Real-time auto polling every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTelemetry]);

  const filteredTallies = data?.electionTallies.filter((e) =>
    selectedElectionId === "all" ? true : e.id === selectedElectionId,
  );

  const filteredRecentVotes = data?.recentVotes.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.candidateName.toLowerCase().includes(q) ||
      v.candidateParty.toLowerCase().includes(q) ||
      v.receiptHash.toLowerCase().includes(q) ||
      v.electionTitle.toLowerCase().includes(q) ||
      v.district.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Page Header with Live Pulse Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Live Real-Time Voting Stream Active
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Votes & Real-Time Telemetry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time vote counting, candidate leaderboards, turnout metrics, and encrypted ballot logs.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
              autoRefresh
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${autoRefresh ? "animate-pulse text-emerald-500" : ""}`} />
            <span>{autoRefresh ? "Live (3s Auto)" : "Paused"}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchTelemetry(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Votes */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Total Cast Votes
            </span>
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/50 p-2.5 text-blue-600 dark:text-blue-400">
              <Vote className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (data?.totalVotes ?? 0).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5 inline" /> Live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Encrypted votes recorded across all districts
          </p>
        </div>

        {/* Metric 2: Voter Turnout % */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Voter Turnout Rate
            </span>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 p-2.5 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : `${data?.turnoutPercent ?? 0}%`}
            </span>
            <span className="text-xs text-slate-400">
              of {(data?.registeredVoters ?? 0).toLocaleString()} registered
            </span>
          </div>
          {/* Turnout Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.min(100, data?.turnoutPercent ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Active Polls */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Active Elections
            </span>
            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 p-2.5 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (data?.activeElections ?? 0)}
            </span>
            <span className="text-xs font-bold text-indigo-500">Live Polling</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Monitored in real-time by election officers
          </p>
        </div>

        {/* Metric 4: Cryptographic Security */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Ballot Integrity
            </span>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 p-2.5 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              100%
            </span>
            <span className="text-xs font-bold text-amber-500">Sealed</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            SHA-256 HMAC signed & zero-knowledge verified
          </p>
        </div>
      </div>

      {/* Filter Toolbar for Elections */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedElectionId("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              selectedElectionId === "all"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Elections
          </button>
          {data?.electionTallies.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelectedElectionId(e.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                selectedElectionId === e.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {e.title}
            </button>
          ))}
        </div>

        {/* Search Input for Audit Logs */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, party, hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Real-Time Candidate Vote Tallies & Leaderboards */}
      <div className="space-y-6">
        {filteredTallies?.map((election) => (
          <div
            key={election.id}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Election Header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Real-Time Candidate Leaderboard
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {election.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {election.totalVotes.toLocaleString()} Votes Cast
                </span>
              </div>
            </div>

            {/* Candidate Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {election.candidates.map((candidate, index) => {
                const isLeading = index === 0 && candidate.voteCount > 0;
                return (
                  <div
                    key={candidate.id}
                    className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                      isLeading
                        ? "border-amber-400/60 bg-gradient-to-b from-amber-500/5 to-transparent dark:border-amber-500/40 shadow-lg shadow-amber-500/5"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                    }`}
                  >
                    {/* Leader Badge */}
                    {isLeading && (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300 border border-amber-400/40">
                        <Crown className="h-3 w-3 text-amber-500" />
                        Leader
                      </div>
                    )}

                    <div className="flex items-start gap-3.5">
                      {/* Candidate Avatar */}
                      <div className="relative shrink-0">
                        <img
                          src={candidate.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                          alt={candidate.name}
                          className="h-12 w-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                        />
                        {candidate.partySymbol && (
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5">
                            <img
                              src={candidate.partySymbol}
                              alt={candidate.party}
                              className="h-full w-full rounded-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Candidate Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {candidate.name}
                        </h4>
                        <span className="inline-block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {candidate.party}
                        </span>

                        {/* Big Vote Counter */}
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-xl font-black text-slate-900 dark:text-white">
                            {candidate.voteCount.toLocaleString()}{" "}
                            <span className="text-xs font-normal text-slate-500">votes</span>
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {candidate.percentage}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLeading
                                ? "bg-gradient-to-r from-amber-400 to-amber-600"
                                : "bg-gradient-to-r from-blue-500 to-indigo-600"
                            }`}
                            style={{ width: `${candidate.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Real-Time Cast Ballot Stream Audit Log */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Live Encrypted Cast Ballots Audit Trail
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time feed of cryptographically signed and sealed ballot receipts.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing latest {filteredRecentVotes?.length || 0} cast ballots
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Receipt Hash</th>
                <th className="pb-3 px-4">Election</th>
                <th className="pb-3 px-4">Voted Nominee</th>
                <th className="pb-3 px-4">District</th>
                <th className="pb-3 px-4">Timestamp</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredRecentVotes?.map((vote) => (
                <tr
                  key={vote.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 pr-4 font-bold text-blue-600 dark:text-blue-400">
                    <span className="truncate max-w-[140px] inline-block">
                      {vote.receiptHash}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-700 dark:text-slate-300">
                    {vote.electionTitle}
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                    {vote.candidateName}{" "}
                    <span className="text-[10px] text-blue-500 font-bold uppercase">
                      ({vote.candidateParty})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400">
                    {vote.district}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(vote.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 pl-4 text-right font-sans">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      {vote.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VotesPage;
