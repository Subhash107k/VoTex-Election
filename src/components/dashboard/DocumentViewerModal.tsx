import React, { useEffect, useRef, useState } from "react";

export default function DocumentViewerModal({ open, url, onClose }: any) {
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setRotation(0);
    setIsFullscreen(false);
  }, [url, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose && onClose();
      if (e.key === "ArrowLeft") setRotation((r) => r - 90);
      if (e.key === "ArrowRight") setRotation((r) => r + 90);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleDownload = async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = url.split("/").pop() || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const handlePrint = () => {
    if (!url) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<img src='${url}' style='max-width:100%;height:auto'/>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div
        className={`bg-[var(--surface-card)] rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] ${isFullscreen ? "w-[98vw] h-[96vh]" : ""}`}
      >
        <div className="p-3 border-b border-[var(--border-subtle)] flex justify-between items-center">
          <div className="font-bold text-[var(--text-primary)]">
            Document Viewer
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRotation((r) => r - 90)}
              className="px-3 py-1 border rounded"
            >
              Rotate -90°
            </button>
            <button
              onClick={() => setRotation((r) => r + 90)}
              className="px-3 py-1 border rounded"
            >
              Rotate +90°
            </button>
            <button
              onClick={() => setIsFullscreen((s) => !s)}
              className="px-3 py-1 border rounded"
            >
              {isFullscreen ? "Exit Full" : "Full"}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 border rounded"
            >
              Download
            </button>
            <button onClick={handlePrint} className="px-3 py-1 border rounded">
              Print
            </button>
            <button onClick={onClose} className="px-3 py-1 border rounded">
              Close
            </button>
          </div>
        </div>
        <div
          className="p-4 flex items-center justify-center overflow-auto"
          style={{ height: isFullscreen ? "80vh" : undefined }}
        >
          {url ? (
            <img
              ref={imgRef}
              src={url}
              alt="document"
              className="w-auto h-auto max-h-[70vh] object-contain transition-transform"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          ) : (
            <div className="p-8 text-center text-slate-500">
              No document available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
