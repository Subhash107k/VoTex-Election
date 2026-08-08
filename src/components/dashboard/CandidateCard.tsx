import React from "react";
import { ShieldCheck, FileText, CheckCircle2, UserCheck } from "lucide-react";
import type { Candidate } from "../../services/electionService";

export interface CandidateCardProps {
  candidate: Candidate | any;
  electionStatus?: string;
  hasVoted?: boolean;
  onVote: (candidate: any) => void;
}

export default function CandidateCard({
  candidate,
  electionStatus = "Active",
  hasVoted = false,
  onVote,
}: CandidateCardProps) {
  const name = candidate.fullName || candidate.name || candidate.label || "Candidate";
  const partyName = candidate.politicalPartyName || candidate.party || "Independent";
  const photo = candidate.candidatePhoto || candidate.photoUrl || candidate.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400";
  const partyLogo = candidate.partyLogo || candidate.partyLogoUrl;
  const position = candidate.electionPosition || "House of Representatives Member";
  const manifesto = candidate.manifestoText || candidate.visionStatement || "Promising transparent digital governance, economic empowerment, and public infrastructure overhaul.";
  const symbol = candidate.symbol;

  const isElectionOpen = electionStatus === "Active" || electionStatus === "Open" || electionStatus === "Published";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-300 backdrop-blur-xl">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="relative">
            <img
              src={photo}
              alt={name}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-blue-500/30 group-hover:ring-blue-500/60 transition-all shadow-md"
            />
            {partyLogo && (
              <img
                src={partyLogo}
                alt={partyName}
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-slate-900 object-cover shadow-md"
              />
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Certified
            </span>
            {symbol && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                {symbol}
              </span>
            )}
          </div>
        </div>

        {/* Name & Party */}
        <div className="mt-4">
          <h4 className="text-lg font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">
            {name}
          </h4>
          <p className="text-xs font-bold text-blue-400 mt-0.5">
            {partyName}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            {position}
          </p>
        </div>

        {/* Manifesto Brief */}
        <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            Key Manifesto
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300 line-clamp-3">
            {manifesto}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
        {hasVoted ? (
          <div className="w-full py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Ballot Sealed & Recorded
          </div>
        ) : isElectionOpen ? (
          <button
            onClick={() => onVote(candidate)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserCheck className="h-4 w-4" /> Select Candidate & Verify
          </button>
        ) : (
          <div className="w-full py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-bold text-center">
            Election Pending
          </div>
        )}
      </div>
    </div>
  );
}

