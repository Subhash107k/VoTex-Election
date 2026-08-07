import React from "react";
import { Vote, ShieldCheck, Award, FileText, CheckCircle2 } from "lucide-react";

export interface CandidateCardProps {
  candidate: {
    id: string;
    name?: string;
    fullName?: string;
    party?: string;
    politicalPartyName?: string;
    partyLogoUrl?: string;
    partyLogo?: string;
    photoUrl?: string;
    candidatePhoto?: string;
    manifestoText?: string;
    manifestoPdfUrl?: string;
    visionStatement?: string;
    electionPosition?: string;
    electoralConstituency?: string;
    status?: string;
    label?: string;
  };
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
  const photo = candidate.candidatePhoto || candidate.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400";
  const partyLogo = candidate.partyLogo || candidate.partyLogoUrl;
  const position = candidate.electionPosition || "Member of House of Representatives";
  const manifesto = candidate.manifestoText || candidate.visionStatement || "Promising digital governance, anti-corruption transparency, and modern public infrastructure.";

  const isElectionOpen = electionStatus === "Active" || electionStatus === "Open" || electionStatus === "Published";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="relative">
            <img
              src={photo}
              alt={name}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-blue-500/20 dark:ring-blue-500/40 group-hover:ring-blue-500/60 transition-all"
            />
            {partyLogo && (
              <img
                src={partyLogo}
                alt={partyName}
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-md"
              />
            )}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </span>
        </div>

        {/* Name & Party */}
        <div className="mt-4">
          <h4 className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </h4>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
            {partyName}
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            {position}
          </p>
        </div>

        {/* Manifesto Brief */}
        <div className="mt-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            Key Manifesto
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
            {manifesto}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        {hasVoted ? (
          <div className="w-full py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Vote Recorded
          </div>
        ) : isElectionOpen ? (
          <button
            onClick={() => onVote(candidate)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Vote className="h-4 w-4" /> Cast Digital Vote
          </button>
        ) : (
          <div className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold text-center">
            Election Pending
          </div>
        )}
      </div>
    </div>
  );
}
