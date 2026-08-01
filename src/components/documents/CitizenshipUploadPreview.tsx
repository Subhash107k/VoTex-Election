import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

export type CitizenshipPreviewStatus =
  | "idle"
  | "uploading"
  | "verified"
  | "error";

interface CitizenshipUploadPreviewProps {
  label: string;
  subtitle?: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  status?: CitizenshipPreviewStatus;
  errorMessage?: string;
  accept?: string;
  maxSizeBytes?: number;
  accent?: "emerald" | "indigo";
  onFileChange?: (file: File) => void;
  onRemove?: () => void;
  readOnly?: boolean;
  className?: string;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const accentMap = {
  emerald: {
    chip: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    accentText: "text-emerald-400/90",
    button:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15",
    highlight:
      "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_55%)]",
  },
  indigo: {
    chip: "border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
    accentText: "text-indigo-400/90",
    button:
      "border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/15",
    highlight:
      "bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_55%)]",
  },
};

const validateFile = (file: File, maxSizeBytes: number) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, JPEG, PNG, WEBP, or PDF files are supported.";
  }

  if (file.size > maxSizeBytes) {
    const sizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return `File must be smaller than ${sizeMB}MB.`;
  }

  return "";
};

export default function CitizenshipUploadPreview({
  label,
  subtitle,
  description,
  fileUrl,
  fileName,
  uploadedAt,
  status = "idle",
  errorMessage,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  maxSizeBytes = 2 * 1024 * 1024,
  accent = "emerald",
  onFileChange,
  onRemove,
  readOnly = false,
  className = "",
}: CitizenshipUploadPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const styles = accentMap[accent];
  const hasPreview = Boolean(fileUrl);
  const isPdf = Boolean(
    fileUrl?.startsWith("data:application/pdf") || fileUrl?.endsWith(".pdf"),
  );
  const currentStatus =
    status === "error" ? "error" : hasPreview ? "verified" : "idle";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file, maxSizeBytes);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError("");
    setIsUploading(true);
    if (onFileChange) {
      onFileChange(file);
    }
    event.target.value = "";
    setTimeout(() => setIsUploading(false), 250);
  };

  const handleRemove = () => {
    setLocalError("");
    if (onRemove) {
      onRemove();
    }
  };

  const handleOpen = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-3xl border border-gray-800/80 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_45px_-28px_rgba(0,0,0,0.8)] ${className}`}
    >
      <div className={`absolute inset-0 ${styles.highlight}`} />

      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] xl:grid-cols-[minmax(0,0.5fr)_minmax(0,1.5fr)] 2xl:grid-cols-[minmax(0,0.45fr)_minmax(0,1.55fr)]">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${styles.accentText}`}
              >
                {subtitle || "Document"}
              </p>
              <h4 className="mt-1 text-sm font-semibold text-white">{label}</h4>
            </div>
            <div className={`rounded-2xl border p-2 ${styles.chip}`}>
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>

          {description && (
            <div className="rounded-2xl border border-gray-800/80 bg-slate-900/70 p-3 text-[11px] leading-relaxed text-slate-300">
              {description}
            </div>
          )}

          <div className="rounded-2xl border border-gray-800/80 bg-slate-900/70 p-3 text-[10px] text-slate-300">
            <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.24em] text-slate-500">
              <span>File</span>
              <span>Details</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Name</span>
                <span className="text-slate-200">
                  {fileName || "Not uploaded"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Status</span>
                <span className="text-slate-200">
                  {currentStatus === "verified"
                    ? "Ready"
                    : currentStatus === "error"
                      ? "Error"
                      : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Upload</span>
                <span className="text-slate-200">
                  {uploadedAt || "Not yet"}
                </span>
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <label
                className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] transition ${styles.button}`}
              >
                <Upload className="h-3.5 w-3.5" />
                {hasPreview ? "Replace" : "Upload"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {hasPreview && onRemove && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-300 transition hover:bg-rose-500/15"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
          )}

          {(localError || errorMessage) && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-[10px] text-amber-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{localError || errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-slate-800/80 bg-white/95 p-3 shadow-inner dark:bg-slate-950/90 md:min-h-[260px] lg:min-h-[300px] xl:min-h-[360px] 2xl:min-h-[420px]">
            {isUploading ? (
              <div className="flex w-full flex-col items-center justify-center gap-3 text-center text-slate-500">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Preparing preview...
                </span>
              </div>
            ) : hasPreview ? (
              <div className="flex h-full w-full flex-col gap-3">
                <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  {isPdf ? (
                    <iframe
                      src={fileUrl}
                      title={`${label} preview`}
                      className="h-full min-h-[200px] w-full rounded-lg border-0 bg-white dark:bg-slate-950"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-slate-950">
                      <img
                        src={fileUrl}
                        alt={`${label} preview`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleOpen}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-slate-700 hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileUrl) {
                        const anchor = document.createElement("a");
                        anchor.href = fileUrl;
                        anchor.download =
                          fileName ||
                          `${label.toLowerCase().replace(/\s+/g, "-")}.pdf`;
                        anchor.click();
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-slate-700 hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/80 bg-slate-100/80 p-4 text-center text-slate-600 dark:bg-slate-950/70 dark:text-slate-500 md:min-h-[260px] lg:min-h-[300px] xl:min-h-[360px] 2xl:min-h-[420px]">
                <div className="mb-3 rounded-full border border-slate-300 bg-white p-2 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No document uploaded yet
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  {isPdf ? "PDF preview" : "Image preview"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
