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
  const documentNumber = doc?.documentNumber || doc?.number || "—";
  const validationNumber =
    doc?.validationNumber || doc?.validationCode || doc?.validatedNumber || "—";
  const issueDate = doc?.issueDate || doc?.issuedAt || "—";
  const uploadedAt = doc?.uploadedAt || doc?.createdAt || "—";
  const verificationStatus =
    doc?.verificationStatus || doc?.status || doc?.documentStatus || "Pending";

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

      <div className="space-y-2 text-xs text-[var(--text-secondary)]">
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          {doc.label}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Document No.
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
            {documentNumber}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Validation No.
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
            {validationNumber}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Issue Date
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {issueDate === "—" ? "—" : new Date(issueDate).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Status
          </span>
          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            {String(verificationStatus).charAt(0).toUpperCase() +
              String(verificationStatus).slice(1)}
          </span>
        </div>

        {uploadedAt !== "—" && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Uploaded: {new Date(uploadedAt).toLocaleString()}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
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
