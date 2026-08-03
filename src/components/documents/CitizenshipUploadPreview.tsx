import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, PenTool, Upload, X } from "lucide-react";

/**
 * Shared design tokens
 * Both components below live in the same visual system as the
 * biometric capture card: near-black panels, hairline gray borders,
 * a teal accent for primary/active states, and small mono-uppercase
 * micro-labels for structure.
 */
const CARD = "rounded-2xl border border-gray-800 bg-gray-950 p-4";
const MICRO_LABEL =
  "text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500";
const PRIMARY_BUTTON =
  "inline-flex items-center gap-1.5 rounded-lg bg-teal-500/90 px-4 py-1.5 text-[10px] font-bold uppercase text-gray-950 hover:bg-teal-400";
const GHOST_BUTTON =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-[9px] font-bold uppercase text-gray-300 hover:text-white";
const DESTRUCTIVE_TEXT =
  "text-[9px] font-bold uppercase text-red-400 hover:underline";

/* --------------------------------------------------------------------- */
/* SignaturePad                                                          */
/* --------------------------------------------------------------------- */

interface SignaturePadProps {
  signatureImage: string;
  onSignatureChange: (value: string) => void;
  onClear: () => void;
  onError?: (message: string) => void;
}

export function SignaturePad({
  signatureImage,
  onSignatureChange,
  onClear,
  onError,
}: SignaturePadProps) {
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCanvasContext = () => sigCanvasRef.current?.getContext("2d") ?? null;

  const clearCanvas = () => {
    const canvas = sigCanvasRef.current;
    const ctx = getCanvasContext();
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawSignatureImage = (value: string) => {
    const canvas = sigCanvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!value) return;

    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(
        (canvas.width - 20) / img.width,
        (canvas.height - 20) / img.height,
      );
      const nw = img.width * ratio;
      const nh = img.height * ratio;
      ctx.drawImage(
        img,
        (canvas.width - nw) / 2,
        (canvas.height - nh) / 2,
        nw,
        nh,
      );
    };
    img.src = value;
  };

  useEffect(() => {
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
    }
  }, []);

  useEffect(() => {
    drawSignatureImage(signatureImage);
  }, [signatureImage]);

  const getCanvasCoordinates = (
    e:
      React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Bug fix: the touch branch was reading e.touches[0].touches[0].clientY,
    // which doesn't exist on a Touch object — it always fell through to
    // undefined and drew at (x, NaN). Both axes now read off e.touches[0].
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (
    e:
      React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!sigCanvasRef.current) return;
    setIsDrawing(true);
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.beginPath();
      const { x, y } = getCanvasCoordinates(e);
      ctx.moveTo(x, y);
    }
  };

  const draw = (
    e:
      React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing || !sigCanvasRef.current) return;
    e.preventDefault();
    const ctx = getCanvasContext();
    if (ctx) {
      const { x, y } = getCanvasCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (sigCanvasRef.current) {
      onSignatureChange(sigCanvasRef.current.toDataURL("image/png"));
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onError?.("Signature file must be less than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onSignatureChange(base64);
      drawSignatureImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    clearCanvas();
    onClear();
  };

  return (
    <div
      className={`${CARD} flex flex-col items-center justify-between text-center`}
    >
      <div className="mb-1 flex w-full items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
          <PenTool className="h-3 w-3 text-teal-300" />
          Signature Pad
        </span>
        <button
          type="button"
          onClick={handleClear}
          className={DESTRUCTIVE_TEXT}
        >
          Clear
        </button>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-inner">
        <canvas
          ref={sigCanvasRef}
          width={640}
          height={180}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block h-37.5 w-full cursor-crosshair touch-none sm:h-42.5"
          aria-label="Digital signature drawing area"
        />
        <div className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-dashed border-gray-700/80" />
        <span className="pointer-events-none absolute bottom-2 left-6 text-[9px] font-mono uppercase tracking-[0.18em] text-gray-600">
          Sign here
        </span>
      </div>

      <div className="mt-3 flex flex-col items-center gap-1.5">
        <span className={MICRO_LABEL}>Draw above or</span>
        <label
          className={`${GHOST_BUTTON} cursor-pointer select-none text-teal-300`}
        >
          <Upload className="h-3 w-3" />
          Upload signature card
          <input
            type="file"
            accept="image/*"
            onChange={handleSignatureUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* CitizenshipUploadPreview                                              */
/* --------------------------------------------------------------------- */

interface CitizenshipUploadPreviewProps {
  label: string;
  subtitle?: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  accent?: "emerald" | "indigo" | string;
  accept?: string;
  maxSizeBytes?: number;
  onFileChange?: (file: File) => void;
  onRemove?: () => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  readOnly?: boolean;
  className?: string;
}

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
];

export function CitizenshipUploadPreview({
  label,
  subtitle,
  description,
  fileUrl,
  accent = "emerald",
  accept = "image/png,image/jpeg,image/jpg",
  maxSizeBytes = 5 * 1024 * 1024,
  onFileChange,
  onRemove,
  onDrop,
  onDragOver,
  onDragLeave,
  readOnly = false,
  className = "",
}: CitizenshipUploadPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only PNG, JPG and JPEG images are allowed.";
    }
    if (file.size > maxSizeBytes) {
      return `Maximum file size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`;
    }
    return "";
  };

  const handleFile = (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    onFileChange?.(file);
  };

  const accentClasses = {
    emerald: "text-teal-300",
    indigo: "text-indigo-300",
  };

  const accentClass =
    accentClasses[accent as keyof typeof accentClasses] ?? "text-teal-300";

  return (
    <div className={`${CARD} ${className}`}>
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-1.5">
          <ImageIcon className={`h-3.5 w-3.5 ${accentClass}`} />
          <h3 className={MICRO_LABEL}>{label}</h3>
        </div>
        {subtitle && (
          <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">
            {subtitle}
          </p>
        )}
        {description && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
            {description}
          </p>
        )}
      </div>

      {fileUrl ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            <img
              src={fileUrl}
              alt={label}
              className="h-64 w-full object-contain"
            />
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={onRemove}
              className={`${GHOST_BUTTON} text-red-400 hover:text-red-300`}
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!readOnly) setDragActive(true);
            onDragOver?.(e);
          }}
          onDragLeave={() => {
            setDragActive(false);
            onDragLeave?.();
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            onDrop?.(e);
          }}
          className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
            dragActive ? "border-teal-300/70 bg-teal-300/10" : "border-gray-800"
          }`}
        >
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-gray-600" />
          <p className="text-xs text-gray-300">Drag and drop your image here</p>
          <p className="mt-1 text-[10px] text-gray-500">
            PNG, JPG or JPEG (max {Math.round(maxSizeBytes / (1024 * 1024))}MB)
          </p>

          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={`${PRIMARY_BUTTON} mt-4`}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload image
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 text-[10px] font-semibold text-rose-400"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
