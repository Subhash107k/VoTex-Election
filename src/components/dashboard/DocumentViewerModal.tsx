import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  X,
  FileX,
  Sparkles,
} from "lucide-react";

interface DocumentViewerModalProps {
  open: boolean;
  url?: string | null;
  onClose: () => void;
}

export default function DocumentViewerModal({
  open,
  url,
  onClose,
}: DocumentViewerModalProps) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setRotation(0);
    setScale(1);
    setIsFullscreen(false);
  }, [url, open]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.25, 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setRotation(0);
    setScale(1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose && onClose();
      if (e.key === "ArrowLeft") setRotation((r) => r - 90);
      if (e.key === "ArrowRight") setRotation((r) => r + 90);
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "r" || e.key === "R") handleReset();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, handleZoomIn, handleZoomOut, handleReset]);

  if (!open) return null;

  const handleDownload = async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "document-preview";
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
    w.document.write(
      `<html><head><title>Document Print</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#fff;"><img src='${url}' style='max-width:100%;height:auto;max-height:100vh;'/></body></html>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 transition-all duration-300">
      <div
        className={`relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen
            ? "w-[98vw] h-[96vh]"
            : "w-full max-w-5xl h-[88vh] max-h-[850px]"
        }`}
      >
        {/* Floating Minimal Control Toolbar - NO DOCUMENT NAME DISPLAYED */}
        <div className="px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10 select-none">
          {/* Status Indicator Pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Document Preview
            </span>
          </div>

          {/* Interactive Action Icons Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 shadow-inner">
            <button
              type="button"
              onClick={() => setRotation((r) => r - 90)}
              title="Rotate Left (-90°)"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/70 rounded-xl transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => r + 90)}
              title="Rotate Right (+90°)"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/70 rounded-xl transition-all active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-700/80 mx-1" />

            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              title="Zoom Out (-)"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-all active:scale-95"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset Zoom & Rotation"
              className="px-2.5 py-1 text-xs font-mono font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.5}
              title="Zoom In (+)"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-all active:scale-95"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-700/80 mx-1" />

            <button
              type="button"
              onClick={handleDownload}
              title="Download File"
              className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              title="Print Document"
              className="p-2 text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-700/80 mx-1" />

            <button
              type="button"
              onClick={() => setIsFullscreen((s) => !s)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/70 rounded-xl transition-all active:scale-95"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 rounded-full border border-slate-800 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 overflow-auto bg-slate-950 p-6 flex items-center justify-center relative select-none cursor-grab active:cursor-grabbing">
          {url ? (
            <div className="flex items-center justify-center min-h-full w-full">
              <img
                ref={imgRef}
                src={url}
                alt="Document Preview"
                className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out shadow-2xl rounded-lg border border-slate-800"
                style={{
                  transform: `rotate(${rotation}deg) scale(${scale})`,
                }}
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
              <FileX className="w-12 h-12 mb-3 text-slate-600 animate-bounce" />
              <p className="text-sm font-medium">No document available to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
