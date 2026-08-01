import React, { useMemo, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FileX,
  Image as ImageIcon,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Modal from "../ui/Modal.tsx";
import Button from "../ui/Button.tsx";
import Badge from "../ui/Badge.tsx";

export type PreviewStatus =
  | "idle"
  | "uploading"
  | "verified"
  | "pending"
  | "rejected"
  | "error";

export interface DocumentPreviewProps {
  label: string;
  subtitle?: string;
  description?: string;
  required?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileType?: string;
  uploadedAt?: string;
  status?: PreviewStatus;
  accept?: string;
  onFileChange?: (file: File) => void;
  onRemove?: () => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  dragActive?: boolean;
  className?: string;
}

const statusMap: Record<
  PreviewStatus,
  { label: string; variant: Parameters<typeof Badge>[0]["variant"] }
> = {
  idle: { label: "Pending", variant: "neutral" },
  uploading: { label: "Uploading", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
  pending: { label: "Pending", variant: "neutral" },
  rejected: { label: "Rejected", variant: "danger" },
  error: { label: "Error", variant: "danger" },
};

const estimateBase64Size = (dataUrl: string) => {
  try {
    const base64 = dataUrl.split(",")[1] || "";
    const padding = (base64.match(/=+$/) || [""])[0].length;
    return Math.ceil((base64.length * 3) / 4) - padding;
  } catch {
    return 0;
  }
};

const bytesToSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileTypeLabel = (type?: string, url?: string) => {
  if (type) {
    return type.replace("image/", "").toUpperCase();
  }
  if (!url) return "UNKNOWN";
  const match = url.match(/data:([^;]+);/);
  if (match) return match[1].replace("image/", "").toUpperCase();
  const extMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return extMatch ? extMatch[1].toUpperCase() : "FILE";
};

export default function DocumentPreview({
  label,
  subtitle,
  description,
  required,
  fileUrl,
  fileName,
  fileSizeBytes,
  fileType,
  uploadedAt,
  status = "idle",
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  onFileChange,
  onRemove,
  onDrop,
  onDragOver,
  onDragLeave,
  dragActive,
  className = "",
}: DocumentPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const isPdf = Boolean(
    fileUrl?.startsWith("data:application/pdf") ||
    fileType?.includes("pdf") ||
    fileUrl?.endsWith(".pdf"),
  );

  const finalFileSize = useMemo(() => {
    if (fileSizeBytes != null) return fileSizeBytes;
    if (fileUrl?.startsWith("data:")) return estimateBase64Size(fileUrl);
    return undefined;
  }, [fileSizeBytes, fileUrl]);

  const fileTypeLabel = getFileTypeLabel(fileType, fileUrl);
  const statusProps = statusMap[status] || statusMap.idle;
  const hasPreview = Boolean(fileUrl);
  const previewVisible = hasPreview || status === "uploading";

  const openPreview = () => {
    if (!fileUrl) return;
    setPreviewOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileChange) {
      onFileChange(file);
      e.target.value = "";
    }
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const anchor = document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = fileName || `document.${fileTypeLabel.toLowerCase()}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleOpenInNewTab = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleFullscreen = async () => {
    if (!previewContainerRef.current) return;
    if (previewContainerRef.current.requestFullscreen) {
      await previewContainerRef.current.requestFullscreen();
    } else {
      handleOpenInNewTab();
    }
  };

  const previewLabel = fileName || label;

  return (
    <div
      className={`rounded-3xl border bg-slate-950/90 border-slate-800 shadow-black/20 shadow-sm overflow-hidden ${
        dragActive ? "border-emerald-500 bg-emerald-500/10 shadow-lg" : ""
      } ${className}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="p-5 border-b border-slate-800/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-white">
              <FileText className="w-4 h-4 text-emerald-400" />
              {label}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-400 mt-2">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={statusProps.variant}
              dot={status !== "idle" && status !== "pending"}
            >
              {statusProps.label}
            </Badge>
            {required && (
              <span className="text-[10px] uppercase tracking-[0.24em] text-rose-300 font-bold">
                Required
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[35%_65%]">
        <div className="space-y-4 text-[11px] text-slate-300">
          {description && (
            <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-3 leading-relaxed">
              <p>{description}</p>
            </div>
          )}

          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-4 space-y-3">
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 uppercase tracking-[0.24em]">
                File
              </span>
              <span className="text-slate-400 uppercase tracking-[0.24em]">
                Details
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Name</span>
                <span className="text-slate-200">
                  {fileName || "Not uploaded"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Type</span>
                <span className="text-slate-200">
                  {hasPreview ? fileTypeLabel : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Size</span>
                <span className="text-slate-200">
                  {finalFileSize ? bytesToSize(finalFileSize) : "—"}
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

          <div className="space-y-3">
            {onFileChange && (
              <label className="block w-full cursor-pointer rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-emerald-300 transition hover:bg-emerald-500/15">
                {hasPreview ? "Replace Document" : "Upload Document"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}

            {onRemove && hasPreview && (
              <button
                type="button"
                onClick={onRemove}
                className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-rose-300 transition hover:bg-rose-500/15"
              >
                Remove Document
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div
            className={`rounded-3xl border border-slate-800/70 bg-slate-900/80 p-4 min-h-[310px] flex flex-col justify-between ${
              !hasPreview ? "items-center justify-center" : ""
            }`}
          >
            {status === "uploading" ? (
              <div className="animate-pulse space-y-3 w-full">
                <div className="h-4 w-2/5 rounded-full bg-slate-700" />
                <div className="h-48 rounded-3xl bg-slate-800" />
                <div className="h-4 w-1/3 rounded-full bg-slate-700" />
              </div>
            ) : hasPreview ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 border border-slate-800">
                  {isPdf ? (
                    <iframe
                      src={fileUrl}
                      className="h-[300px] min-h-[260px] w-full rounded-[1.75rem] border-0 bg-slate-950"
                      title={previewLabel}
                    />
                  ) : (
                    <div className="relative flex h-[300px] min-h-[260px] w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-slate-950">
                      <img
                        src={fileUrl}
                        alt={previewLabel}
                        onLoad={() => setImageLoaded(true)}
                        className={`max-h-full max-w-full object-contain transition-all duration-300 ${
                          imageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        }}
                      />
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                          <ImageIcon className="w-10 h-10 text-slate-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={openPreview}
                  >
                    <Maximize2 className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={handleOpenInNewTab}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {hasPreview && (
            <div className="grid gap-2 sm:grid-cols-2">
              {!isPdf && (
                <>
                  <button
                    type="button"
                    onClick={() => setZoom((value) => Math.min(3, value + 0.1))}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:border-emerald-500 hover:text-white"
                  >
                    <ZoomIn className="w-4 h-4 mr-2" /> Zoom In
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((value) => Math.max(1, value - 0.1))}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:border-emerald-500 hover:text-white"
                  >
                    <ZoomOut className="w-4 h-4 mr-2" /> Zoom Out
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setRotation((value) => (value + 90) % 360)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:border-emerald-500 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Rotate
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:border-emerald-500 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </button>
              <button
                type="button"
                onClick={handleFullscreen}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:border-emerald-500 hover:text-white"
              >
                <Maximize2 className="w-4 h-4 mr-2" /> Full Screen
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewLabel}
        maxWidth="4xl"
      >
        <div ref={previewContainerRef} className="space-y-4">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-4 min-h-[380px] flex items-center justify-center overflow-hidden">
            {isPdf ? (
              <iframe
                src={fileUrl}
                className="h-[520px] w-full rounded-[1.75rem] border-0 bg-slate-950"
                title={previewLabel}
              />
            ) : (
              <img
                src={fileUrl}
                alt={previewLabel}
                onLoad={() => setImageLoaded(true)}
                className="max-h-[520px] max-w-full object-contain transition-all duration-300"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              />
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button variant="secondary" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-4 h-4" /> Open in New Tab
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
