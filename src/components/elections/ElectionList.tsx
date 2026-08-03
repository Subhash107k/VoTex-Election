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
        setElections(items.filter((e) => e.active !== false));
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
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {(e.candidates || []).map((c) => (
              <div key={c.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.label}</div>
                </div>
                <div>
                  <button onClick={() => onVote(e, c)} className="px-3 py-1 bg-emerald-600 text-white rounded-lg">Vote</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
