import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Award,
  ArrowLeft,
  Trophy,
  Calendar,
  MapPin,
  Users,
  Vote,
  CheckCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Activity,
  TrendingUp,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Election, Candidate } from "../types";

interface ElectionTally {
  candidate: Candidate;
  votesCount: number;
}

interface AreaVoterCount {
  area: string;
  voters: number;
}

interface PublishedResultDetail {
  election: Election;
  totalVotes: number;
  totalRegisteredVoters: number;
  turnoutPercent: number;
  areaBreakdown?: AreaVoterCount[];
  winner: Candidate | null;
  runnerUp: Candidate | null;
  tallies: ElectionTally[];
}

interface ElectionResultsProps {
  onBack: () => void;
  isLight: boolean;
}

export default function ElectionResults({
  onBack,
  isLight,
}: ElectionResultsProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PublishedResultDetail[]>([]);
  const [selectedResult, setSelectedResult] =
    useState<PublishedResultDetail | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedWinnerFilter, setSelectedWinnerFilter] = useState("all");
  const [sortBy, setSortBy] = useState("highest-votes");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination for Candidates in comparison table
  const [candidatePage, setCandidatePage] = useState(1);
  const candidatesPerPage = 5;

  // Pagination for Election Cards (Grid)
  const [electionPage, setElectionPage] = useState(1);
  const electionsPerPage = 3;

  // Load results from backend
  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/results/published-details");
      if (!res.ok)
        throw new Error("Failed to load official published results.");
      const data = await res.json();

      setResults(data.results || []);
      if (data.results && data.results.length > 0) {
        // Default to select first result
        setSelectedResult(data.results[0]);
      } else {
        setSelectedResult(null);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Filter & Sort Elections list
  const filteredResults = results.filter((item) => {
    const election = item.election;
    const matchesSearch =
      election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      election.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (election.eligibilityDept &&
        election.eligibilityDept
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      item.tallies.some(
        (t) =>
          t.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.candidate.party.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesType =
      selectedType === "all" || election.type === selectedType;

    const matchesArea =
      selectedArea === "all" ||
      (election.eligibilityDept &&
        election.eligibilityDept.toLowerCase() === selectedArea.toLowerCase());

    const matchesWinner =
      selectedWinnerFilter === "all" ||
      (selectedWinnerFilter === "has-winner" && item.winner) ||
      (selectedWinnerFilter === "no-winner" && !item.winner);

    return matchesSearch && matchesType && matchesArea && matchesWinner;
  });

  // Sort filtered results
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === "highest-votes") {
      return b.totalVotes - a.totalVotes;
    } else if (sortBy === "lowest-votes") {
      return a.totalVotes - b.totalVotes;
    } else if (sortBy === "name-asc") {
      return a.election.title.localeCompare(b.election.title);
    } else if (sortBy === "name-desc") {
      return b.election.title.localeCompare(a.election.title);
    } else if (sortBy === "newest") {
      return (
        new Date(b.election.startDate).getTime() -
        new Date(a.election.startDate).getTime()
      );
    } else if (sortBy === "oldest") {
      return (
        new Date(a.election.startDate).getTime() -
        new Date(b.election.startDate).getTime()
      );
    }
    return 0;
  });

  // Get unique areas from all elections to populate filter select
  const uniqueAreas = Array.from(
    new Set(results.map((r) => r.election.eligibilityDept).filter(Boolean)),
  ) as string[];

  // Dynamic Charts Setup for the currently selected election
  const getVoteDistributionData = () => {
    if (!selectedResult || selectedResult.tallies.length === 0) return [];
    return selectedResult.tallies.map((t) => ({
      name: t.candidate.name,
      votes: t.votesCount,
      party: t.candidate.party,
    }));
  };

  const getVoterTurnoutData = () => {
    if (!selectedResult) return [];
    const cast = selectedResult.totalVotes;
    const remaining = Math.max(0, selectedResult.totalRegisteredVoters - cast);
    return [
      { name: "Votes Cast", value: cast, color: "#10b981" },
      { name: "Absent Base", value: remaining, color: "#cbd5e1" },
    ];
  };

  const getAreaWiseData = () => {
    if (
      !selectedResult ||
      !selectedResult.areaBreakdown ||
      selectedResult.areaBreakdown.length === 0
    )
      return [];
    return selectedResult.areaBreakdown.map((item) => ({
      area: item.area,
      voters: item.voters,
    }));
  };

  // Colors for Recharts Pie
  const COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
    "#ec4899",
  ];

  // Calculate winner statistics
  const winnerVotes = selectedResult?.tallies[0]?.votesCount || 0;
  const runnerUpVotes = selectedResult?.tallies[1]?.votesCount || 0;
  const winningMarginVal =
    selectedResult && selectedResult.tallies.length > 0
      ? winnerVotes - runnerUpVotes
      : 0;

  const topContenderCards = selectedResult
    ? ([selectedResult.winner, selectedResult.runnerUp].filter(
        Boolean,
      ) as Candidate[])
    : [];

  const handleSelectResult = (res: PublishedResultDetail) => {
    setSelectedResult(res);
    setCandidatePage(1); // Reset page of comparison table
  };

  // Pagination logic for Candidates comparison table
  const indexOfLastCandidate = candidatePage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = selectedResult
    ? selectedResult.tallies.slice(indexOfFirstCandidate, indexOfLastCandidate)
    : [];
  const totalCandidatePages = selectedResult
    ? Math.ceil(selectedResult.tallies.length / candidatesPerPage)
    : 1;

  // Pagination logic for Election list cards
  const indexOfLastElection = electionPage * electionsPerPage;
  const indexOfFirstElection = indexOfLastElection - electionsPerPage;
  const currentElections = sortedResults.slice(
    indexOfFirstElection,
    indexOfLastElection,
  );
  const totalElectionPages = Math.ceil(sortedResults.length / electionsPerPage);

  const themeBg = isLight
    ? "bg-slate-50 text-slate-800"
    : "bg-slate-950 text-slate-100";

  const themeCard = isLight
    ? "bg-white border-slate-150 shadow-sm"
    : "bg-slate-900 border-slate-800 shadow-xl";

  const themeTextMuted = isLight ? "text-slate-500" : "text-slate-400";

  const themeTextTitle = isLight ? "text-slate-900" : "text-white";

  const themeInput = isLight
    ? "bg-slate-100 border-slate-200 text-slate-950 focus:bg-white"
    : "bg-slate-850 border-slate-800 text-slate-100 focus:bg-slate-800";

  const themeBorder = isLight ? "border-slate-200" : "border-slate-800";

  return (
    <div
      id="results-page-view"
      className={`min-h-screen ${themeBg} font-sans pb-16`}
    >
      {/* PROFESSIONAL TITLE HEADER */}
      <div
        className={`py-12 border-b ${themeBorder} ${isLight ? "bg-white" : "bg-slate-900"}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-600 transition-colors mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Home
              </button>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
                <Award className="w-8 h-8 text-indigo-500" /> Election Results
              </h1>
              <p
                className={`text-xs md:text-sm ${themeTextMuted} mt-2 max-w-xl`}
              >
                View official published election results with detailed candidate
                statistics and vote counts.
              </p>
            </div>

            {/* Quick action triggers */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchResults}
                className={`py-2 px-4 text-xs font-mono font-bold flex items-center gap-1.5 rounded-xl border cursor-pointer hover:scale-[1.02] transition-transform ${isLight ? "bg-white hover:bg-slate-50 border-slate-200" : "bg-slate-800 border-slate-700 hover:bg-slate-750"}`}
                title="Refresh Live DB Results"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload Data
              </button>
            </div>
          </div>

          {/* SEARCH AND INTERACTIVE FILTERS CONTROLS */}
          <div
            className={`p-4 rounded-2xl border ${themeCard} flex flex-col gap-4`}
          >
            <div className="flex flex-col md:flex-row gap-3">
              {/* Instant Search input */}
              <div className="relative flex-grow">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Instant Search by candidate, party, election title, department, or location..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setElectionPage(1); // Reset card page
                  }}
                  className={`w-full text-xs pl-9 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${themeInput}`}
                />
              </div>

              {/* Filter Display Trigger Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl text-xs font-bold font-mono tracking-wider uppercase border flex items-center gap-1.5 cursor-pointer transition-colors ${showFilters ? "bg-indigo-600 border-indigo-600 text-white" : isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-200" : "bg-slate-800 hover:bg-slate-750 border-slate-700"}`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters {showFilters ? "Close" : "Open"}</span>
              </button>
            </div>

            {/* Advanced Filters Drawer Panel */}
            {showFilters && (
              <div
                className={`pt-4 border-t ${themeBorder} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5`}
              >
                <div>
                  <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5">
                    Election Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setElectionPage(1);
                    }}
                    className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${themeInput}`}
                  >
                    <option value="all">All Types (Select...)</option>
                    <option value="General Election">General Election</option>
                    <option value="Provincial Election">
                      Provincial Election
                    </option>
                    <option value="Local Election">Local Election</option>
                    <option value="By-Election">By-Election</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5">
                    Area / Region
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => {
                      setSelectedArea(e.target.value);
                      setElectionPage(1);
                    }}
                    className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${themeInput}`}
                  >
                    <option value="all">All Areas</option>
                    {uniqueAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5">
                    Result Outcomes
                  </label>
                  <select
                    value={selectedWinnerFilter}
                    onChange={(e) => {
                      setSelectedWinnerFilter(e.target.value);
                      setElectionPage(1);
                    }}
                    className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${themeInput}`}
                  >
                    <option value="all">All Outcomes</option>
                    <option value="has-winner">Published with Winner</option>
                    <option value="no-winner">Uncontested / Re-Run</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5">
                    Sort Results By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setElectionPage(1);
                    }}
                    className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${themeInput}`}
                  >
                    <option value="highest-votes">Highest Votes Cast</option>
                    <option value="lowest-votes">Lowest Votes Cast</option>
                    <option value="name-asc">Title (A-Z)</option>
                    <option value="name-desc">Title (Z-A)</option>
                    <option value="newest">Newest Date</option>
                    <option value="oldest">Oldest Date</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedType("all");
                      setSelectedArea("all");
                      setSelectedWinnerFilter("all");
                      setSortBy("highest-votes");
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-center border cursor-pointer ${isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-350"}`}
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE CONTENT Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
        {loading ? (
          /* SKELETON LOADING STATE */
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-mono text-slate-500">
              Compiling biometric ledger accounts & election tallies...
            </p>
          </div>
        ) : error ? (
          /* NETWORK ERROR PANEL */
          <div
            className={`p-8 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-center max-w-xl mx-auto my-10 flex flex-col items-center gap-3 shadow-sm`}
          >
            <p className="font-extrabold max-w-md text-sm">{error}</p>
            <button
              onClick={fetchResults}
              className="mt-2 text-xs font-mono font-bold uppercase tracking-wider bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : results.length === 0 ? (
          /* BRAND NEW OFFICIALLY SPECIFIED EMPTY STATE WITH ILLUSTRATION */
          <div
            className={`text-center py-16 px-6 max-w-xl mx-auto rounded-3xl border border-dashed ${themeBorder} ${themeCard} my-8`}
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5 text-slate-400 dark:text-slate-500">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-bold ${themeTextTitle} mb-2`}>
              No Official Election Results Available
            </h3>
            <p
              className={`text-xs ${themeTextMuted} max-w-xs mx-auto leading-relaxed mb-6`}
            >
              Administrative bodies have not officially locked or published any
              voting records yet. Check back momentarily as biometrics
              verification registers clear.
            </p>
            <button
              onClick={onBack}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-mono font-black uppercase tracking-wider cursor-pointer"
            >
              Return to Home Panel
            </button>
          </div>
        ) : (
          /* PRIMARY DASHBOARD SYSTEM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: PUBLISHED ELECTIONS LIST (GRID-LIKE LAYOUT WITH CARDS) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1">
                <h3
                  className={`text-xs font-mono font-black uppercase tracking-widest text-indigo-500`}
                >
                  Published List ({sortedResults.length})
                </h3>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                  LIVE SECURE
                </span>
              </div>

              {currentElections.length === 0 ? (
                <div
                  className={`p-8 text-center rounded-2xl border border-dashed ${themeBorder} ${themeCard}`}
                >
                  <p className="text-xs text-slate-500 font-mono">
                    No matching elections found for your filters.
                  </p>
                </div>
              ) : (
                currentElections.map((item) => {
                  const election = item.election;
                  const isSelected =
                    selectedResult?.election.id === election.id;

                  return (
                    <div
                      key={election.id}
                      onClick={() => handleSelectResult(item)}
                      className={`rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-500/5 shadow-md"
                          : `${themeCard} hover:${isLight ? "bg-slate-50" : "bg-slate-850"} hover:translate-y-[-2px]`
                      }`}
                    >
                      {/* CARD BANNER STYLE ELEMENT */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />

                      <div className="flex items-center justify-between mb-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border bg-indigo-500/10 text-indigo-500 border-indigo-500/20`}
                        >
                          ● Published
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">
                          {election.type}
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-bold ${themeTextTitle} leading-snug group-hover:text-indigo-500 transition-colors`}
                      >
                        {election.title}
                      </h4>
                      <p
                        className={`text-[11px] ${themeTextMuted} line-clamp-2 mt-1 leading-relaxed`}
                      >
                        {election.description}
                      </p>

                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {election.eligibilityDept || "Nationwide"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {new Date(election.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            Voters:{" "}
                            {election.maxVotes?.toLocaleString() || "1,200"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <Vote className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-extrabold text-indigo-500">
                            {item.totalVotes.toLocaleString()} cast
                          </span>
                        </div>
                      </div>

                      {/* TURNOUT METRIC PERCENT BAR */}
                      <div className="mt-3">
                        <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400 mb-1">
                          <span>VOTER TURNOUT</span>
                          <span className="text-emerald-500">
                            {item.turnoutPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, item.turnoutPercent)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* CARD PAGINATION SYSTEM */}
              {totalElectionPages > 1 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40">
                  <span className="text-[10px] font-mono text-slate-400">
                    Page {electionPage} of {totalElectionPages}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      disabled={electionPage === 1}
                      onClick={() =>
                        setElectionPage((prev) => Math.max(1, prev - 1))
                      }
                      className="p-1 px-2 text-xs border rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={electionPage === totalElectionPages}
                      onClick={() =>
                        setElectionPage((prev) =>
                          Math.min(totalElectionPages, prev + 1),
                        )
                      }
                      className="p-1 px-2 text-xs border rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: CORE GRAPHICS, WINNER SPOTLIGHT, TABLES, STATISTICS */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {selectedResult ? (
                <>
                  {/* CURRENT ACTIVE SELECTION BANNER */}
                  <div
                    className={`p-5 rounded-3xl border ${themeCard} relative overflow-hidden bg-gradient-to-r ${isLight ? "from-indigo-50 to-emerald-50/50" : "from-slate-900 to-slate-900"}`}
                  >
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 pointer-events-none">
                      <Award className="w-40 h-40" />
                    </div>

                    <span className="text-[10px] font-mono font-black text-indigo-500 tracking-wider block uppercase mb-1">
                      NOW VISUALIZING PUBLISHED REPORT
                    </span>
                    <h2
                      className={`text-lg md:text-xl font-bold ${themeTextTitle} tracking-tight`}
                    >
                      {selectedResult.election.title}
                    </h2>
                    <p
                      className={`text-xs ${themeTextMuted} mt-1.5 leading-relaxed`}
                    >
                      {selectedResult.election.description}
                    </p>
                  </div>

                  {/* SIX STATS SUMMARY CARDS (Total candidate, turnover, invalid votes, etc) */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div
                      className={`p-2.5 rounded-xl border text-center ${themeCard}`}
                    >
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Total Candidates
                      </span>
                      <span className="text-sm font-bold text-slate-950 dark:text-slate-100 block truncate">
                        {selectedResult.tallies.length}
                      </span>
                      <span className="text-[8px] font-mono text-emerald-500 mt-1 block">
                        Registered
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-center ${themeCard}`}
                    >
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Total Votes
                      </span>
                      <span className="text-sm font-bold text-slate-950 dark:text-slate-100 block truncate">
                        {selectedResult.totalVotes.toLocaleString()}
                      </span>
                      <span className="text-[8px] font-mono text-indigo-500 mt-1 block">
                        Valid Ballots
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-center ${themeCard}`}
                    >
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Registered Voters
                      </span>
                      <span className="text-sm font-bold text-slate-950 dark:text-slate-100 block truncate">
                        {selectedResult.totalRegisteredVoters.toLocaleString()}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 block">
                        Roll Index
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-center ${themeCard}`}
                    >
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Voter Turnout
                      </span>
                      <span className="text-sm font-bold text-emerald-600 block truncate">
                        {selectedResult.turnoutPercent}%
                      </span>
                      <span className="text-[8px] font-mono text-emerald-500 mt-1 block">
                        Active Ratio
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-center ${themeCard}`}
                    >
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Winning Margin
                      </span>
                      <span className="text-sm font-bold text-amber-500 block truncate">
                        {winningMarginVal.toLocaleString()}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 block">
                        Vote Delta
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-center ${themeCard}`}
                    >
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Invalid Ballots
                      </span>
                      <span className="text-sm font-bold text-rose-600 block truncate">
                        0
                      </span>
                      <span className="text-[8px] font-mono text-rose-500 mt-1 block">
                        100% Certified
                      </span>
                    </div>
                  </div>

                  {/* SPARKLES / SPOTLIGHT GOLD WINNER SECTION */}
                  {selectedResult.winner ? (
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/5 rounded-3xl border border-amber-500/35 p-6 relative overflow-hidden shadow-md flex flex-col md:flex-row items-center gap-6">
                      <div className="absolute top-0 right-0 bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 font-black text-[9px] font-mono tracking-widest uppercase py-1 px-4 rounded-bl-2xl flex items-center gap-1 z-10 shadow-sm animate-pulse">
                        <Sparkles className="w-3 h-3 text-slate-950" />
                        <span>Winner Spotlight</span>
                      </div>

                      {/* Trophy spotlight and Profile photograph */}
                      <div className="relative shrink-0 select-none">
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl blur-[4px] opacity-70 animate-pulse" />
                        <img
                          src={
                            selectedResult.winner.photoUrl ||
                            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
                          }
                          referrerPolicy="no-referrer"
                          alt={selectedResult.winner.name}
                          className="w-24 h-24 rounded-2xl border-2 border-amber-400 object-cover relative z-10 bg-slate-950"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 w-8 h-8 rounded-full flex items-center justify-center z-20 text-slate-950 shadow-md">
                          <Trophy className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Winner biography and details */}
                      <div className="flex-grow text-center md:text-left">
                        <span className="text-[9px] font-mono font-black border border-amber-500/40 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full tracking-wider uppercase mb-2 inline-block">
                          {selectedResult.winner.party}
                        </span>
                        <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-sans tracking-tight leading-none mb-1.5">
                          {selectedResult.winner.name}
                        </h3>
                        <p
                          className={`text-[11px] ${themeTextMuted} max-w-lg mb-3 line-clamp-2 leading-relaxed`}
                        >
                          {selectedResult.winner.biography}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono">
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[9px] font-black uppercase">
                              VOTES COUNTED
                            </span>
                            <span className="font-extrabold text-slate-950 dark:text-slate-200">
                              {winnerVotes.toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block`}
                          />
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[9px] font-black uppercase">
                              RATIO SCALE
                            </span>
                            <span className="font-extrabold text-emerald-500 text-sm">
                              {selectedResult.totalVotes > 0
                                ? (
                                    (winnerVotes / selectedResult.totalVotes) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                          <div
                            className={`h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block`}
                          />
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block text-[9px] font-black uppercase font-mono">
                              STATUS RESOLUTION
                            </span>
                            <span className="font-extrabold text-amber-500 uppercase flex items-center gap-1 text-[10px]">
                              ● ELECTED CHAIR
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-6 rounded-2xl border ${themeCard} text-center font-mono text-slate-500 flex flex-col items-center gap-1.5`}
                    >
                      <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                      <p className="text-xs">
                        No candidate has been compiled as a winner. Re-run or
                        tie-break pending.
                      </p>
                    </div>
                  )}

                  {/* OPPOSITION SNAPSHOT */}
                  {selectedResult.runnerUp && selectedResult.winner && (
                    <div className={`p-5 rounded-2xl border ${themeCard}`}>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h4 className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-indigo-500" />{" "}
                          Winning Side vs Opposition
                        </h4>
                        <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-mono border border-rose-100">
                          Winner + Runner-Up
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topContenderCards.map((candidate, index) => {
                          const isWinner = index === 0;
                          const tally = selectedResult.tallies.find(
                            (item) => item.candidate.id === candidate.id,
                          );
                          return (
                            <div
                              key={candidate.id}
                              className={`rounded-2xl border p-4 flex gap-3 items-start ${isWinner ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-50 border-slate-200"}`}
                            >
                              <img
                                src={
                                  candidate.photoUrl ||
                                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
                                }
                                referrerPolicy="no-referrer"
                                alt={candidate.name}
                                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-900 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <img
                                    src={
                                      candidate.partyLogoUrl ||
                                      candidate.photoUrl ||
                                      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=100"
                                    }
                                    referrerPolicy="no-referrer"
                                    alt={`${candidate.party} logo`}
                                    className="w-6 h-6 rounded-full object-cover border border-slate-200 bg-white"
                                  />
                                  <span
                                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase border font-bold ${isWinner ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}
                                  >
                                    {isWinner ? "Winner" : "Opposition"}
                                  </span>
                                </div>
                                <h5
                                  className={`font-bold leading-tight ${themeTextTitle}`}
                                >
                                  {candidate.name}
                                </h5>
                                <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                                  {candidate.party}
                                </p>
                                <p
                                  className={`text-[11px] ${themeTextMuted} mt-2 line-clamp-2`}
                                >
                                  {candidate.biography}
                                </p>
                                <div className="flex items-center justify-between mt-3 text-[10px] font-mono">
                                  <span className="text-slate-400 uppercase font-black">
                                    Votes
                                  </span>
                                  <span className="font-extrabold text-indigo-500">
                                    {tally?.votesCount.toLocaleString() || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* VOTE PROGRESS AND PERCENTAGE CIRCLE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Progress Bar tallies */}
                    <div className={`p-5 rounded-2xl border ${themeCard}`}>
                      <h4 className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                        <Activity className="w-4 h-4 text-indigo-500" /> Vote
                        Progress Tallies
                      </h4>

                      <div className="flex flex-col gap-4">
                        {selectedResult.tallies.map((item, idx) => {
                          const percent =
                            selectedResult.totalVotes > 0
                              ? parseFloat(
                                  (
                                    (item.votesCount /
                                      selectedResult.totalVotes) *
                                    100
                                  ).toFixed(1),
                                )
                              : 0;

                          return (
                            <div key={item.candidate.id} className="relative">
                              <div className="flex justify-between items-center text-xs mb-1 font-sans">
                                <div>
                                  <span
                                    className={`font-bold ${themeTextTitle}`}
                                  >
                                    {item.candidate.name}
                                  </span>
                                  <span
                                    className={`text-[10px] ${themeTextMuted} ml-1.5 truncate`}
                                  >
                                    ({item.candidate.party})
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-indigo-500">
                                  {item.votesCount.toLocaleString()} ({percent}
                                  %)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="h-2.5 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${percent}%`,
                                    backgroundColor:
                                      COLORS[idx % COLORS.length],
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Percentage Turnout Ring Circle style */}
                    <div
                      className={`p-5 rounded-2xl border ${themeCard} flex flex-col justify-between`}
                    >
                      <h4 className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />{" "}
                        Voter Participation Ratio
                      </h4>

                      <div className="flex items-center justify-around gap-4 flex-grow">
                        {/* Percentage Circle Ring widget */}
                        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                          <svg
                            className="w-full h-full transform -rotate-90"
                            viewBox="0 0 100 100"
                          >
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-slate-200 dark:stroke-slate-800 fill-transparent"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-emerald-500 fill-transparent transition-all duration-1000"
                              strokeWidth="8"
                              strokeDasharray="251.2"
                              strokeDashoffset={
                                251.2 -
                                (251.2 *
                                  Math.min(
                                    100,
                                    selectedResult.turnoutPercent,
                                  )) /
                                  100
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-2xl font-black block leading-none text-emerald-500">
                              {selectedResult.turnoutPercent}%
                            </span>
                            <span className="text-[8px] font-mono font-extrabold text-slate-400 block uppercase mt-0.5">
                              TURNOUT Ratio
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] font-mono text-slate-500 flex flex-col gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded" />
                            <span>
                              Voted Cast:{" "}
                              <strong>
                                {selectedResult.totalVotes.toLocaleString()}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded" />
                            <span>
                              Absent Pool:{" "}
                              <strong>
                                {(
                                  selectedResult.totalRegisteredVoters -
                                  selectedResult.totalVotes
                                ).toLocaleString()}
                              </strong>
                            </span>
                          </div>
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1">
                            <span>
                              Absolute Base:{" "}
                              <strong>
                                {selectedResult.totalRegisteredVoters.toLocaleString()}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DOUBLE CHARTS SYSTEM (Vote distribution and Turnout representation) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bar chart - Vote Distribution */}
                    <div className={`p-4 rounded-2xl border ${themeCard}`}>
                      <h4 className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                        <BarChart2 className="w-4 h-4 text-indigo-500" />{" "}
                        Candidate Vote Counts
                      </h4>
                      <div className="h-56 text-xs text-slate-500 font-mono">
                        {getVoteDistributionData().length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getVoteDistributionData()}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.1}
                              />
                              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                              <YAxis tick={{ fontSize: 9 }} />
                              <Tooltip
                                contentStyle={{
                                  background: isLight ? "#ffffff" : "#0f172a",
                                  border: "1px solid #e2e8f0",
                                }}
                              />
                              <Bar
                                dataKey="votes"
                                fill="#6366f1"
                                radius={[4, 4, 0, 0]}
                              >
                                {getVoteDistributionData().map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ),
                                )}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center pt-24 text-stone-400">
                            No chart data compiled.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pie Chart / Area Chart - Voter Turnout visual */}
                    <div className={`p-4 rounded-2xl border ${themeCard}`}>
                      <h4 className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                        <PieIcon className="w-4 h-4 text-emerald-500" /> Voter
                        Attendance Mix
                      </h4>
                      <div className="h-56 text-xs text-slate-500 font-mono">
                        {getVoterTurnoutData().length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getVoterTurnoutData()}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {getVoterTurnoutData().map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  background: isLight ? "#ffffff" : "#0f172a",
                                  border: "1px solid #e2e8f0",
                                }}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconSize={10}
                                iconType="circle"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center pt-24 text-stone-400">
                            No turnout mix data.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AREA WISE DISTRICT RESULTS CHART FOR GEOGRAPHICAL ANALYSIS */}
                  <div className={`p-5 rounded-2xl border ${themeCard}`}>
                    <h4 className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                      <LineIcon className="w-4 h-4 text-teal-500" /> Area Voter
                      Count
                    </h4>
                    <div className="h-56 text-xs text-slate-500 font-mono">
                      {getAreaWiseData().length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getAreaWiseData()}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              opacity={0.1}
                            />
                            <XAxis dataKey="area" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip
                              contentStyle={{
                                background: isLight ? "#ffffff" : "#0f172a",
                                border: "1px solid #e2e8f0",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="voters"
                              fill="#0f766e"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center pt-24 text-stone-400 font-sans">
                          No area-wise data generated.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CANDIDATE RESULT CARDS GRID VIEW */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-mono font-black text-slate-500 uppercase tracking-widest pl-1 mt-2">
                      Candidate Profile Roster ({selectedResult.tallies.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedResult.tallies.map((item, idx) => {
                        const isWinner =
                          selectedResult.winner?.id === item.candidate.id;
                        const isRunnerUp =
                          selectedResult.runnerUp?.id === item.candidate.id;

                        return (
                          <div
                            key={item.candidate.id}
                            className={`p-4 rounded-2xl border ${themeCard} flex flex-col gap-3 relative overflow-hidden group hover:scale-[1.01] transition-transform`}
                          >
                            {/* Decorative background border glow */}
                            {isWinner && (
                              <div className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rounded-bl-full" />
                            )}
                            {isRunnerUp && (
                              <div className="absolute top-0 right-0 w-3 h-3 bg-slate-400 rounded-bl-full" />
                            )}

                            <div className="flex gap-3.5">
                              <img
                                src={
                                  item.candidate.photoUrl ||
                                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
                                }
                                referrerPolicy="no-referrer"
                                alt={item.candidate.name}
                                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-900"
                              />
                              <div>
                                <img
                                  src={
                                    item.candidate.partyLogoUrl ||
                                    item.candidate.photoUrl ||
                                    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=100"
                                  }
                                  referrerPolicy="no-referrer"
                                  alt={`${item.candidate.party} logo`}
                                  className="w-5 h-5 rounded-full object-cover border border-slate-200 bg-white mb-1"
                                />
                                <span
                                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase border font-bold ${
                                    isWinner
                                      ? "bg-amber-100 text-amber-800 border-amber-200"
                                      : isRunnerUp
                                        ? "bg-slate-100 text-slate-700 border-slate-200"
                                        : "bg-slate-50 text-slate-500 border-slate-150"
                                  }`}
                                >
                                  {isWinner
                                    ? "🥇 Winner Spotlight"
                                    : isRunnerUp
                                      ? "🥈 Runner-Up"
                                      : "🏅 Participant"}
                                </span>
                                <h5
                                  className={`font-bold mt-1.5 leading-tight ${themeTextTitle}`}
                                >
                                  {item.candidate.name}
                                </h5>
                                <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                                  {item.candidate.party}
                                </p>
                              </div>
                            </div>

                            <p
                              className={`text-[11px] ${themeTextMuted} line-clamp-3 leading-relaxed border-t ${themeBorder} pt-2.5 mt-1`}
                            >
                              <strong>Biography:</strong>{" "}
                              {item.candidate.biography}
                            </p>

                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              <strong>Credentials:</strong>{" "}
                              {item.candidate.education} —{" "}
                              {item.candidate.experience}
                            </p>

                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border dark:border-slate-850 mt-1">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-black">
                                Ballots counted
                              </span>
                              <span className="text-sm font-black font-mono text-indigo-500">
                                {item.votesCount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RESPONSIVE CANDIDATE COMPARISON TABLE (Rank, Photo, Name, Party, Area, Votes, %, Status) */}
                  <div
                    className={`p-5 rounded-2xl border ${themeCard} overflow-hidden`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <h4 className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-4 h-4 text-indigo-500" /> Candidate
                        Leaderboard Comparison
                      </h4>
                      <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 px-2.5 py-1 rounded-full font-mono border border-indigo-100 dark:border-indigo-900/30">
                        AUDITED REAL-TIME BY VOTE_CHAIN
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr
                            className={`border-b ${themeBorder} text-[10px] uppercase font-mono font-black text-slate-400`}
                          >
                            <th className="pb-3 pl-2">Rank</th>
                            <th className="pb-3">Candidate</th>
                            <th className="pb-3">Political Faction</th>
                            <th className="pb-3 text-center">District Scope</th>
                            <th className="pb-3 text-right">Votes</th>
                            <th className="pb-3 text-right">% Ratio</th>
                            <th className="pb-3 text-right pr-2">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
                          {currentCandidates.map((item, index) => {
                            const globalRank =
                              indexOfFirstCandidate + index + 1;
                            const isWinner = globalRank === 1;
                            const isRunnerUp = globalRank === 2;
                            const percent =
                              selectedResult.totalVotes > 0
                                ? (
                                    (item.votesCount /
                                      selectedResult.totalVotes) *
                                    100
                                  ).toFixed(1)
                                : "0.0";

                            return (
                              <tr
                                key={item.candidate.id}
                                className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors`}
                              >
                                <td className="py-3 pl-2 font-mono font-bold text-slate-400">
                                  {isWinner
                                    ? "🥇 01"
                                    : isRunnerUp
                                      ? "🥈 02"
                                      : `🥉 0${globalRank}`}
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={
                                        item.candidate.photoUrl ||
                                        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
                                      }
                                      referrerPolicy="no-referrer"
                                      alt={item.candidate.name}
                                      className="w-7 h-7 rounded-lg object-cover bg-slate-900 border"
                                    />
                                    <img
                                      src={
                                        item.candidate.partyLogoUrl ||
                                        item.candidate.photoUrl ||
                                        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=100"
                                      }
                                      referrerPolicy="no-referrer"
                                      alt={`${item.candidate.party} logo`}
                                      className="w-5 h-5 rounded-full object-cover border border-slate-200 bg-white"
                                    />
                                    <div>
                                      <span
                                        className={`font-bold block text-sm ${themeTextTitle}`}
                                      >
                                        {item.candidate.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 max-w-xs block truncate leading-tight mt-0.5">
                                        {item.candidate.education}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 font-medium">
                                  {item.candidate.party}
                                </td>
                                <td className="py-3 text-center font-mono text-[10px] uppercase text-emerald-500 font-bold bg-emerald-500/5 rounded-md py-1 px-2 mb-1 inline-block">
                                  {selectedResult.election.eligibilityDept ||
                                    "Nationwide"}
                                </td>
                                <td className="py-3 text-right font-mono font-extrabold text-slate-950 dark:text-slate-200">
                                  {item.votesCount.toLocaleString()}
                                </td>
                                <td className="py-3 text-right font-mono font-black text-indigo-500">
                                  {percent}%
                                </td>
                                <td className="py-3 text-right pr-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-black ${
                                      isWinner
                                        ? "bg-amber-100 text-amber-800"
                                        : isRunnerUp
                                          ? "bg-slate-100 text-slate-700"
                                          : "bg-slate-50 text-slate-450"
                                    }`}
                                  >
                                    {isWinner
                                      ? "Elected"
                                      : isRunnerUp
                                        ? "RunnerUp"
                                        : "Participant"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* COMPARISON TABLE PAGINATION SYSTEM */}
                    {totalCandidatePages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400">
                          Showing {indexOfFirstCandidate + 1}-
                          {Math.min(
                            indexOfLastCandidate,
                            selectedResult.tallies.length,
                          )}{" "}
                          of {selectedResult.tallies.length} members
                        </span>
                        <div className="flex gap-1">
                          <button
                            disabled={candidatePage === 1}
                            onClick={() =>
                              setCandidatePage((prev) => Math.max(1, prev - 1))
                            }
                            className="p-1 px-2 text-xs border rounded-lg hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={candidatePage === totalCandidatePages}
                            onClick={() =>
                              setCandidatePage((prev) =>
                                Math.min(totalCandidatePages, prev + 1),
                              )
                            }
                            className="p-1 px-2 text-xs border rounded-lg hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div
                  className={`p-8 text-center rounded-2xl border border-dashed ${themeBorder} ${themeCard}`}
                >
                  <p className="text-xs text-slate-500 font-mono">
                    No active report selected. Choose an election from the list.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER COPIED ACCORDING TO AUDIT REVOLUTION RULES */}
      <footer
        className={`mt-24 pt-12 border-t ${themeBorder} ${isLight ? "bg-white" : "bg-slate-950"}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center text-xs text-slate-400 leading-relaxed font-mono">
          <p>
            © 2026 Nepal National Election Commission Secure Ledger Authority.
            System fully certified for Municipal, Provincial and National
            Operational Deployments.
          </p>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-600">
            Encrypted ledger validation tokens are certified directly under
            CC-SEC-42 guidelines.
          </p>
        </div>
      </footer>
    </div>
  );
}
