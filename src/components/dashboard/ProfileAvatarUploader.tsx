import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, Trash2, CheckCircle2, User, RefreshCw, X, ShieldCheck, Sparkles } from "lucide-react";
import { detectSingleFaceApi } from "../../services/tensorflow.ts";

interface ProfileAvatarUploaderProps {
  currentPhotoUrl?: string;
  onPhotoChange: (base64Photo: string) => void;
  userName?: string;
  userRole?: string;
  disabled?: boolean;
}

export function ProfileAvatarUploader({
  currentPhotoUrl,
  onPhotoChange,
  userName = "User Citizen",
  userRole = "Voter",
  disabled = false,
}: ProfileAvatarUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size exceeds maximum limit of 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onPhotoChange(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const startCamera = async () => {
    setShowCameraModal(true);
    setCameraLoading(true);
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError(err?.message || "Failed to access webcam. Please check permissions.");
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const [faceDetected, setFaceDetected] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL("image/jpeg", 0.92);
      onPhotoChange(photoData);
    }
    stopCamera();
  }, [onPhotoChange]);

  useEffect(() => {
    if (!showCameraModal || cameraLoading || cameraError) return;

    let animFrame: number;
    let stableCount = 0;
    let isCaptured = false;

    const checkFaceLoop = async () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !isCaptured) {
        try {
          const apiFace = await detectSingleFaceApi(video);
          if (apiFace) {
            setFaceDetected(true);
            stableCount++;
            if (stableCount >= 2 && !isCaptured) {
              isCaptured = true;
              setAutoCapturing(true);
              setTimeout(() => {
                capturePhoto();
              }, 200);
              return;
            }
          } else {
            setFaceDetected(false);
            stableCount = 0;
          }
        } catch {
          // Ignore frame errors
        }
      }
      if (!isCaptured) {
        animFrame = requestAnimationFrame(checkFaceLoop);
      }
    };

    animFrame = requestAnimationFrame(checkFaceLoop);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [showCameraModal, cameraLoading, cameraError, capturePhoto]);

  const removePhoto = () => {
    onPhotoChange("");
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm">
      {/* Photo Preview Container */}
      <div className="relative group">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative h-28 w-28 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center ${
            dragOver
              ? "border-blue-500 ring-4 ring-blue-500/20 scale-105"
              : "border-[var(--border-default)] hover:border-blue-500/50"
          } bg-[var(--surface-muted)]`}
        >
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt={userName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[var(--text-tertiary)]">
              <span className="text-2xl font-black tracking-wider text-[var(--text-secondary)]">
                {initials || <User className="h-10 w-10" />}
              </span>
            </div>
          )}

          {/* Hover Overlay */}
          {!disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-xs font-semibold"
            >
              <Upload className="h-5 w-5 mb-1 text-blue-400" />
              <span>Change</span>
            </button>
          )}
        </div>

        {/* Verification Status Ring Badge */}
        <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-[var(--surface-card)]" title="Verified Identity Profile">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* Info & Action Controls */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div>
          <h4 className="text-base font-bold text-[var(--text-primary)]">{userName}</h4>
          <p className="text-xs text-[var(--text-secondary)]">
            Official {userRole} Citizen • Profile Photograph
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">


          <button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            Take Photo
          </button>

          {currentPhotoUrl && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Remove current avatar"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>

        <p className="text-[11px] text-[var(--text-tertiary)] pt-0.5">
          Supports JPG, PNG or WEBP (Max 5MB). Live facial identification standards apply.
        </p>
      </div>

      {/* Live Webcam Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-bold">Live Photo Capture</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center">
                {cameraError}
              </div>
            ) : (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[var(--border-subtle)]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover -scale-x-100"
                />
                
                {/* Square Face Guide Frame Overlay */}
                {!cameraLoading && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
                    <div
                      className={`relative aspect-square h-[75%] rounded-2xl border-2 transition-all duration-300 ${
                        faceDetected
                          ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_35px_rgba(52,211,153,0.4)]"
                          : "border-cyan-400/80 bg-cyan-500/5 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
                      }`}
                    >
                      {/* Corner Reticles */}
                      <div className={`absolute -left-1 -top-1 h-4 w-4 rounded-tl-lg border-l-4 border-t-4 transition-colors ${faceDetected ? "border-emerald-400" : "border-cyan-400"}`} />
                      <div className={`absolute -right-1 -top-1 h-4 w-4 rounded-tr-lg border-r-4 border-t-4 transition-colors ${faceDetected ? "border-emerald-400" : "border-cyan-400"}`} />
                      <div className={`absolute -bottom-1 -left-1 h-4 w-4 rounded-bl-lg border-b-4 border-l-4 transition-colors ${faceDetected ? "border-emerald-400" : "border-cyan-400"}`} />
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-br-lg border-b-4 border-r-4 transition-colors ${faceDetected ? "border-emerald-400" : "border-cyan-400"}`} />
                      {/* Center Crosshairs */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <div className={`h-3 w-px ${faceDetected ? "bg-emerald-300" : "bg-cyan-300"}`} />
                        <div className={`h-px w-3 ${faceDetected ? "bg-emerald-300" : "bg-cyan-300"}`} />
                      </div>
                    </div>
                  </div>
                )}

                {cameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-xs font-semibold text-white">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Initializing Camera…
                  </div>
                )}

                <div
                  className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                    faceDetected
                      ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/50"
                      : "bg-slate-900/85 text-cyan-300 border-cyan-500/30"
                  }`}
                >
                  {autoCapturing
                    ? "Capturing Photo..."
                    : faceDetected
                      ? "Face Detected — Auto Capturing..."
                      : "Position face inside square frame"}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={cameraLoading || Boolean(cameraError)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Capture & Use Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileAvatarUploader;
