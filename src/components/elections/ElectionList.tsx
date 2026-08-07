import React, { useEffect, useState } from "react";
import type { Election } from "../../services/electionService";
import { getElections } from "../../services/electionService";

export default function ElectionList({ token, onVote }: { token: string | null; onVote: (election: Election, candidate: any) => void }) {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const items = await getElections(token);
        if (!active) return;
        setElections(items.filter((e) => e.status === "Active" || e.active === true));
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to load elections");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) return <div>Loading elections…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (elections.length === 0) return <div>No active elections available.</div>;

  return (
    <div className="space-y-4">
      {elections.map((e) => (
        <div key={e.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white">{e.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{e.description}</p>
            </div>
            <div className="text-sm text-slate-400">{e.startsAt ? new Date(e.startsAt).toLocaleString() : ""}</div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(e.candidates || []).map((c) => (
              <div key={c.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Candidate Photo */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                    {c.photo ? (
                      <img src={c.photo} alt={c.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                        {c.label.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white text-lg">{c.label}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {c.partyLogo && (
                        <img src={c.partyLogo} alt={c.party} className="w-4 h-4 rounded-full" />
                      )}
                      <span>{c.party}</span>
                      {c.symbol && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Symbol: {c.symbol}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <button onClick={() => onVote(e, c)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors">
                    Vote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
