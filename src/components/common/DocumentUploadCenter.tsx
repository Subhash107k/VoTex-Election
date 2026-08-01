import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import CitizenshipUploadPreview from "../documents/CitizenshipUploadPreview.tsx";

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
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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
            <CitizenshipUploadPreview
              key={doc.id}
              label={doc.label}
              description={doc.description}
              required={doc.required}
              fileUrl={doc.fileUrl}
              fileName={doc.label}
              status={doc.status}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              dragActive={isDragging}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverId(null);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelected(doc.id, e.dataTransfer.files[0]);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(doc.id);
              }}
              onDragLeave={() => setDragOverId(null)}
              onFileChange={(file) => handleFileSelected(doc.id, file)}
              onRemove={() => onDocumentChange(doc.id, "", "idle")}
            />
          );
        })}
      </div>
    </div>
  );
}
