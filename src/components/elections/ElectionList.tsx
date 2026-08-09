import React, { useEffect, useState } from "react";
import CandidateCard from "../dashboard/CandidateCard";
import type { Election, Candidate } from "../../services/electionService";
import { getElections, getLocalVoteReceipts, getVotingStatus } from "../../services/electionService";
import {
  Vote,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  AlertCircle,
  X,
  Camera,
  CheckCircle2,
  FileText,
  UserCheck,
} from "lucide-react";

export default function ElectionList({
  token,
  onVote,
}: {
  token: string | null;
  onVote: (election: Election, candidate: Candidate) => void;
}) {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Selection Confirmation Modal State
  const [pendingSelection, setPendingSelection] = useState<{
    election: Election;
    candidate: Candidate;
  } | null>(null);

  const [votedElectionIds, setVotedElectionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const items = await getElections(token);
        if (!active) return;
        setElections(items.filter((e) => e.status === "Active" || e.active === true));

        // Load voted elections from receipts and backend voting-status
        const receipts = getLocalVoteReceipts();
        const votedSet = new Set(receipts.map((r) => r.electionId));
        
        try {
          const serverVoted = await getVotingStatus(token);
          serverVoted.forEach((id: string) => votedSet.add(id));
        } catch {
          // ignore
        }

        if (active) {
          setVotedElectionIds(votedSet);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to load active elections");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center backdrop-blur-xl">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-300 animate-pulse">
          Retrieving live active election ballots...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-slate-900/80 p-6 text-center backdrop-blur-xl">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-white">Election Data Error</h4>
        <p className="text-xs text-slate-400 mt-1">{error}</p>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center backdrop-blur-xl">
        <Vote className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-bold text-white">No Active Elections</h4>
        <p className="text-xs text-slate-400 mt-1">
          There are currently no active public polling sessions running.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate name or party..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          {["All", "Federal", "Provincial", "Local"].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Active Elections List */}
      {elections.map((election) => {
        const hasVoted = votedElectionIds.has(election.id);
        const filteredCandidates = (election.candidates || []).filter((c) => {
          const matchesSearch =
            !searchTerm ||
            (c.fullName || c.label || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.party || c.politicalPartyName || "").toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesCategory =
            selectedCategory === "All" ||
            !election.category ||
            election.category.toLowerCase() === selectedCategory.toLowerCase();

          return matchesSearch && matchesCategory;
        });

        if (filteredCandidates.length === 0 && searchTerm) return null;

        return (
          <div
            key={election.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-6"
          >
            {/* Election Header Card Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[10px] font-bold text-blue-400">
                    {election.category || "Official Election"}
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Live Voting Open
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">
                  {election.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {election.description}
                </p>
              </div>

              {hasVoted ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-emerald-300">
                    Ballot Sealed & Cast
                  </span>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 flex items-center gap-2 shrink-0">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Status
                    </div>
                    <div className="text-xs font-bold text-white">
                      Polling Active
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  electionStatus={election.status || "Active"}
                  hasVoted={hasVoted}
                  onVote={(cand) => {
                    setPendingSelection({
                      election,
                      candidate: cand,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Candidate Selection Confirmation Modal */}
      {pendingSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative space-y-6">
            <button
              onClick={() => setPendingSelection(null)}
              className="absolute top-5 right-5 p-2 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <UserCheck className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-black text-lg text-white">
                  Confirm Candidate Selection
                </h4>
                <p className="text-xs text-slate-400">
                  Step 1 of 2: Confirm choice before face verification
                </p>
              </div>
            </div>

            {/* Selected Candidate Info Card */}
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-slate-900/90 p-5 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={
                    pendingSelection.candidate.candidatePhoto ||
                    pendingSelection.candidate.photoUrl ||
                    pendingSelection.candidate.photo ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
                  }
                  alt={pendingSelection.candidate.label}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-blue-500/40"
                />
                <div>
                  <h5 className="font-black text-lg text-white">
                    {pendingSelection.candidate.fullName ||
                      pendingSelection.candidate.label}
                  </h5>
                  <p className="text-xs font-bold text-blue-400 mt-0.5">
                    {pendingSelection.candidate.politicalPartyName ||
                      pendingSelection.candidate.party ||
                      "Independent Candidate"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {pendingSelection.candidate.electionPosition ||
                      pendingSelection.election.title}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300 leading-relaxed">
                <div className="font-bold text-slate-400 mb-1 text-[10px] uppercase">
                  Selected Manifesto Goal
                </div>
                {pendingSelection.candidate.manifestoText ||
                  pendingSelection.candidate.visionStatement ||
                  "Promising digital governance, transparency, and public service overhaul."}
              </div>
            </div>

            {/* Biometric Notice Banner */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
              <Camera className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-300">
                  Real-time Face Verification Required Next
                </h5>
                <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                  In the next step, your camera will launch to perform real-time
                  liveness and face matching to cryptographically seal your vote.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPendingSelection(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
              >
                Change Candidate
              </button>
              <button
                onClick={() => {
                  const { election, candidate } = pendingSelection;
                  setPendingSelection(null);
                  onVote(election, candidate);
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Camera className="h-4 w-4" /> Proceed to Real-time Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

