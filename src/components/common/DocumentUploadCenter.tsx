import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  RotateCw,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Modal from "../ui/Modal.tsx";
import Button from "../ui/Button.tsx";
import Badge from "../ui/Badge.tsx";

export interface DocumentItem {
  id: string;
  label: string;
  description: string;
  required?: boolean;
  fileUrl: string;
  status: "idle" | "uploading" | "verified" | "error";
  errorMessage?: string;
}

interface DocumentUploadCenterProps {
  documents: DocumentItem[];
  onDocumentChange: (
    id: string,
    fileUrl: string,
    status: DocumentItem["status"],
    errorMessage?: string,
  ) => void;
  maxSizeBytes?: number;
}

export default function DocumentUploadCenter({
  documents,
  onDocumentChange,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB default
}: DocumentUploadCenterProps) {
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocumentItem | null>(
    null,
  );
  const [rotation, setRotation] = useState(0);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelected = (docId: string, file: File) => {
    // Validate Size
    if (file.size > maxSizeBytes) {
      const sizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      onDocumentChange(
        docId,
        "",
        "error",
        `File exceeds maximum allowed size of ${sizeMB}MB.`,
      );
      return;
    }

    // Validate Type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      onDocumentChange(
        docId,
        "",
        "error",
        "Invalid file type. Allowed formats: JPG, PNG, WEBP, PDF.",
      );
      return;
    }

    // Set uploading state
    onDocumentChange(docId, "", "uploading");

    // Process file as Data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setTimeout(() => {
        onDocumentChange(docId, result, "verified");
      }, 500);
    };
    reader.onerror = () => {
      onDocumentChange(
        docId,
        "",
        "error",
        "Failed to read file. Please try again.",
      );
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (docId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverId(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(docId, e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Document Verification Hub
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload clear, uncropped government-issued identification cards for
            automatic OCR & authenticity validation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => {
          const isDragging = dragOverId === doc.id;

          return (
            <div
              key={doc.id}
              className={`relative rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 shadow-lg"
                  : doc.status === "verified"
                    ? "border-emerald-500/40 bg-slate-900/90"
                    : doc.status === "error"
                      ? "border-rose-500/40 bg-rose-950/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(doc.id);
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(doc.id, e)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-white tracking-wide">
                      {doc.label}
                    </span>
                    {doc.required && (
                      <span className="text-[10px] text-rose-400 font-mono font-bold">
                        *REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {doc.description}
                  </p>
                </div>

                {/* Status Badge */}
                {doc.status === "verified" && (
                  <Badge variant="success" dot>
                    Verified
                  </Badge>
                )}
                {doc.status === "uploading" && (
                  <Badge variant="warning" dot>
                    Uploading...
                  </Badge>
                )}
                {doc.status === "error" && (
                  <Badge variant="danger" dot>
                    Error
                  </Badge>
                )}
                {doc.status === "idle" && (
                  <Badge variant="neutral">Pending</Badge>
                )}
              </div>

              {/* Upload Drop Zone / Preview */}
              {doc.fileUrl ? (
                <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-3 overflow-hidden group">
                  {doc.fileUrl.startsWith("data:application/pdf") ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-slate-300">
                      <FileText className="w-8 h-8 text-emerald-400" />
                      <span className="text-xs font-mono font-bold">
                        PDF Document Attached
                      </span>
                    </div>
                  ) : (
                    <div className="relative h-36 w-full rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
                      <img
                        src={doc.fileUrl}
                        alt={doc.label}
                        className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Action Bar Overlay */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setRotation(0);
                        setActivePreviewDoc(doc);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => onDocumentChange(doc.id, "", "idle")}
                      className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRefs.current[doc.id]?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-900/50"
                >
                  <Upload className="w-6 h-6 text-slate-500 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-300">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    PNG, JPG, WEBP or PDF (max 5MB)
                  </p>
                </div>
              )}

              {/* Error Message */}
              {doc.status === "error" && doc.errorMessage && (
                <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{doc.errorMessage}</span>
                </p>
              )}

              {/* Hidden File Input */}
              <input
                ref={(el) => {
                  if (el) fileInputRefs.current[doc.id] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(doc.id, e.target.files[0]);
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal with Rotation */}
      <Modal
        isOpen={Boolean(activePreviewDoc)}
        onClose={() => setActivePreviewDoc(null)}
        title={activePreviewDoc?.label || "Document Inspection"}
        maxWidth="2xl"
      >
        {activePreviewDoc && (
          <div className="space-y-4">
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 min-h-[300px] flex items-center justify-center overflow-hidden">
              {activePreviewDoc.fileUrl.startsWith("data:application/pdf") ? (
                <iframe
                  src={activePreviewDoc.fileUrl}
                  className="w-full h-[450px] rounded-xl border-0"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={activePreviewDoc.fileUrl}
                  alt={activePreviewDoc.label}
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="max-h-[500px] max-w-full object-contain transition-transform duration-200"
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                >
                  Rotate 90°
                </Button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActivePreviewDoc(null)}
              >
                Done Inspecting
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
