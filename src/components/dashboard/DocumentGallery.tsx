import React from "react";

function DocCard({
  doc,
  onView,
  onDownload,
}: {
  doc: any;
  onView?: (url?: string) => void;
  onDownload?: (url?: string, name?: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 shadow-sm">
      <div
        className="h-40 rounded-md overflow-hidden bg-[var(--surface-muted)] mb-3 cursor-pointer"
        onClick={() => onView && onView(doc?.url)}
      >
        {doc?.url ? (
          <img
            src={doc.url}
            alt={doc.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No document uploaded
          </div>
        )}
      </div>
      <div className="text-sm font-semibold text-[var(--text-primary)]">
        {doc.label}
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        {doc.number || "—"}
      </div>
      <div className="mt-2 flex gap-2">
        {doc?.url && (
          <button
            onClick={() => onView && onView(doc.url)}
            className="text-xs px-3 py-1 bg-slate-100 rounded-md"
          >
            Open
          </button>
        )}
        <button
          onClick={() => onDownload && onDownload(doc?.url, doc?.label)}
          className="text-xs px-3 py-1 border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)]"
        >
          Download
        </button>
      </div>
    </div>
  );
}

export default function DocumentGallery({
  documents,
  onView,
  onDownload,
}: {
  documents: any[];
  onView?: (url?: string) => void;
  onDownload?: (url?: string, name?: string) => void;
}) {
  const docs = documents || [];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-center text-[var(--text-secondary)]">
          No documents uploaded
        </div>
      ) : (
        docs.map((d) => (
          <DocCard
            key={d.label || d.id}
            doc={d}
            onView={onView}
            onDownload={onDownload}
          />
        ))
      )}
    </div>
  );
}
