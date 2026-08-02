import React from "react";

export default function Timeline({ items }: { items: any[] }) {
  if (!items || items.length === 0)
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        No timeline events
      </div>
    );
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-sm">
      <h3 className="font-black text-[var(--text-primary)] mb-3">
        Registration Timeline
      </h3>
      <ol className="space-y-3 text-sm">
        {items.map((it) => (
          <li key={it.event + it.timestamp} className="flex justify-between">
            <div className="text-[var(--text-primary)]">{it.event}</div>
            <div className="text-[var(--text-secondary)]">
              {new Date(it.timestamp).toLocaleString()}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
