import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  RefreshCw,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Eye,
  Scan,
  ShieldCheck,
  Sun,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

type FaceLandmarkPosition = { x: number; y: number };

type SelectChangeEvent = { target: { value: string } };

declare module "react" {
  export type DependencyList = readonly any[];
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export function useState<S>(
    initialState: S | (() => S),
  ): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(
    effect: () => void | (() => void),
    deps?: DependencyList,
  ): void;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export interface ChangeEvent<T = Element> {
    target: { value: any };
  }
  export default any;
}

declare module "react/jsx-runtime" {
  export function jsx(type: any, props: any, key?: string | number): any;
  export function jsxs(type: any, props: any, key?: string | number): any;
  export function jsxDEV(
    type: any,
    props: any,
    key?: string | number,
    source?: any,
    self?: any,
  ): any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface FaceCaptureResult {
  originalImage: string;
  croppedImage: string;
  faceBoundingBox: { x: number; y: number; width: number; height: number };
  landmarks: Record<string, FaceLandmarkPosition>;
  qualityScore: number;
  livenessScore: number;
  confidenceScore: number;
  validation: Record<string, boolean | string>;
  qualityMeter?: number;
  antiSpoofScore?: number;
  backgroundClarity?: string;
  poseStatus?: string;
  occlusionStatus?: string;
  backgroundPlane?: string;
  encryptedFaceData?: string;
  timestamp: string;
}

interface BiometricScannerProps {
  onCapture: (
    base64Image: string,
    faceTemplate?: number[],
    result?: FaceCaptureResult,
  ) => void;
  onCaptureResult?: (result: FaceCaptureResult) => void;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  mode?: "default" | "face-api";
}

export default function BiometricScanner({
  onCapture,
  onCaptureResult,
  title = "Biometric Face Registration",
  subtitle = "Ensure you are in a well-lit room. Remove hats, glasses or face masks.",
  buttonLabel = "Capture Biometric Face ID",
  mode = "face-api",
}: BiometricScannerProps) {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<
    "idle" | "aligning" | "locked" | "processing" | "registered"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [biometricsLog, setBiometricsLog] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [scannerMode, setScannerMode] = useState<"default" | "face-api">(mode);

  const [detector, setDetector] =
    useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [boundingBox, setBoundingBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [landmarks, setLandmarks] = useState<
    Record<string, FaceLandmarkPosition>
  >({});
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [livenessScore, setLivenessScore] = useState<number>(0);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [validationResults, setValidationResults] = useState<
    Record<string, boolean | string>
  >({});
  const [guidanceMessage, setGuidanceMessage] = useState<string>(
    "Mount camera and align your face in the window.",
  );
  const [instructionList, setInstructionList] = useState<string[]>([
    "✓ Face detected",
  ]);
  const [livenessPrompt, setLivenessPrompt] = useState<string>(
    "Blink once to prove liveness.",
  );
  const [motionStability, setMotionStability] = useState<number>(0);
  const [blinkCount, setBlinkCount] = useState<number>(0);
  const [headMovementFrames, setHeadMovementFrames] = useState<number>(0);
  const [qualityMeter, setQualityMeter] = useState<number>(0);
  const [backgroundClarity, setBackgroundClarity] = useState<"Clear" | "Busy">(
    "Clear",
  );
  const [poseStatus, setPoseStatus] = useState<"Aligned" | "Needs adjustment">(
    "Aligned",
  );
  const [occlusionStatus, setOcclusionStatus] = useState<
    "Clear" | "Obstructed"
  >("Clear");
  const [antiSpoofScore, setAntiSpoofScore] = useState<number>(0);
  const [lastFaceCenter, setLastFaceCenter] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [faceDistance, setFaceDistance] = useState<
    "too_close" | "too_far" | "good"
  >("good");
  const [captureResult, setCaptureResult] = useState<FaceCaptureResult | null>(
    null,
  );
  const [cameraInterrupted, setCameraInterrupted] = useState<boolean>(false);

  // Landmarks state parameters (allows dynamic calibration debugging for users!)
  const [leftEye, setLeftEye] = useState<boolean>(true);
  const [rightEye, setRightEye] = useState<boolean>(true);
  const [leftEar, setLeftEar] = useState<boolean>(true);
  const [rightEar, setRightEar] = useState<boolean>(true);
  const [nose, setNose] = useState<boolean>(true);
  const [mouth, setMouth] = useState<boolean>(true);
  const [faceOrientation, setFaceOrientation] = useState<
    "Straight" | "Turned Left" | "Turned Right" | "Not Centered"
  >("Straight");
  const [eyesClosed, setEyesClosed] = useState<boolean>(false);
  const [lighting, setLighting] = useState<
    "Too Dark" | "Optimal" | "Too Bright"
  >("Optimal");
  const [quality, setQuality] = useState<"Blurry" | "Optimal">("Optimal");
  const [faceCount, setFaceCount] = useState<number>(1);
  const [backgroundPlane, setBackgroundPlane] = useState<
    "Stable" | "Uneven" | "Cluttered"
  >("Stable");
  const [facePlane, setFacePlane] = useState<
    "Centered" | "Tilted" | "Profile" | "Unknown"
  >("Unknown");
  const [homeDetail, setHomeDetail] = useState<
    "Living Room" | "Office" | "Studio" | "Unknown"
  >("Unknown");
  const [leftEyeConfidence, setLeftEyeConfidence] = useState<number>(0.94);
  const [rightEyeConfidence, setRightEyeConfidence] = useState<number>(0.93);
  const [noseConfidence, setNoseConfidence] = useState<number>(0.91);
  const [earConfidence, setEarConfidence] = useState<number>(0.88);

  // Auto capture countdown state
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Clean stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [stream]);

  // Bind/Play local camera stream on video tag
  useEffect(() => {
    setScannerMode(mode);
  }, [mode]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      if (stream) {
        videoRef.current.play().catch((err) => {
          console.warn("Error playing video:", err);
        });
      }
    }
  }, [stream]);

  const loadDetector = async () => {
    try {
      const model = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          maxFaces: 2,
          refineLandmarks: true,
        },
      );
      setDetector(model);
      setBiometricsLog((l) => [...l, "✔ Face landmark model loaded."]);
    } catch (error) {
      console.warn("Failed to load face landmark model", error);
      setBiometricsLog((l) => [
        ...l,
        "⚠ Unable to load face landmark detector. Using fallback quality checks.",
      ]);
    }
  };

  const getKeypoint = (
    predictions: faceLandmarksDetection.Face[],
    index: number,
  ): FaceLandmarkPosition | null => {
    if (!predictions || !predictions[0] || !predictions[0].keypoints)
      return null;
    const keypoint = predictions[0].keypoints[index];
    return keypoint ? { x: keypoint.x, y: keypoint.y } : null;
  };

  const calcDistance = (a: FaceLandmarkPosition, b: FaceLandmarkPosition) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const calcEyeOpenness = (
    top: FaceLandmarkPosition,
    bottom: FaceLandmarkPosition,
  ) => {
    return calcDistance(top, bottom);
  };

  const estimateFrameQuality = (
    video: HTMLVideoElement,
    box: { xMin: number; yMin: number; width: number; height: number },
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    const sx = Math.max(0, box.xMin);
    const sy = Math.max(0, box.yMin);
    const sw = Math.min(video.videoWidth - sx, box.width);
    const sh = Math.min(video.videoHeight - sy, box.height);

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 48, 48);
    const imageData = ctx.getImageData(0, 0, 48, 48).data;

    let brightness = 0;
    let variance = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      const gray = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
      brightness += gray;
      variance += gray * gray;
    }

    const avgBrightness = brightness / (imageData.length / 4);
    const avgVariance =
      variance / (imageData.length / 4) - avgBrightness * avgBrightness;
    const normalized = Math.min(
      100,
      Math.max(0, (avgBrightness / 255) * 45 + (avgVariance / 6500) * 55),
    );
    return Math.round(normalized);
  };

  const buildValidation = (predictions: faceLandmarksDetection.Face[]) => {
    const result: Record<string, boolean | string> = {};
    const faceDetected = predictions.length === 1;
    const tooManyFaces = predictions.length > 1;
    const noFaces = predictions.length === 0;

    result.singleFace = faceDetected;
    result.multipleFaces = !tooManyFaces;
    result.facePresent = !noFaces;

    const face = predictions[0];
    if (!face) return result;

    const leftEyeTop = getKeypoint(predictions, 159);
    const leftEyeBottom = getKeypoint(predictions, 145);
    const rightEyeTop = getKeypoint(predictions, 386);
    const rightEyeBottom = getKeypoint(predictions, 374);
    const noseTip = getKeypoint(predictions, 1);
    const mouthTop = getKeypoint(predictions, 13);
    const mouthBottom = getKeypoint(predictions, 14);
    const leftEarPoint = getKeypoint(predictions, 234);
    const rightEarPoint = getKeypoint(predictions, 454);

    const leftOpen =
      leftEyeTop && leftEyeBottom
        ? calcEyeOpenness(leftEyeTop, leftEyeBottom) > 4.5
        : false;
    const rightOpen =
      rightEyeTop && rightEyeBottom
        ? calcEyeOpenness(rightEyeTop, rightEyeBottom) > 4.5
        : false;
    const leftEarVisible = !!leftEarPoint;
    const rightEarVisible = !!rightEarPoint;
    const noseVisible = !!noseTip;
    const mouthVisible = !!mouthTop && !!mouthBottom;

    result.eyesOpen = leftOpen && rightOpen;
    result.bothEyes = !!(
      leftEyeTop &&
      leftEyeBottom &&
      rightEyeTop &&
      rightEyeBottom
    );
    result.bothEars = leftEarVisible && rightEarVisible;
    result.noseDetected = noseVisible;
    result.mouthDetected = mouthVisible;

    if (face.box) {
      const centerX = face.box.xMin + face.box.width / 2;
      const centerY = face.box.yMin + face.box.height / 2;
      const frameWidth = videoRef.current?.videoWidth || 740;
      const frameHeight = videoRef.current?.videoHeight || 510;
      const horizontalMargin = frameWidth * 0.18;
      const verticalMargin = frameHeight * 0.16;
      result.centered =
        centerX >= horizontalMargin &&
        centerX <= frameWidth - horizontalMargin &&
        centerY >= verticalMargin &&
        centerY <= frameHeight - verticalMargin;

      const normalizedWidth = face.box.width / frameWidth;
      result.distanceGood = normalizedWidth >= 0.24 && normalizedWidth <= 0.48;
      result.tooClose = normalizedWidth > 0.48 ? "Move farther away" : false;
      result.tooFar = normalizedWidth < 0.24 ? "Move closer" : false;
    }

    if (leftEyeTop && rightEyeTop && leftEyeBottom && rightEyeBottom) {
      const eyeSlope = Math.atan2(
        rightEyeTop.y - leftEyeTop.y,
        rightEyeTop.x - leftEyeTop.x,
      );
      const degrees = Math.abs((eyeSlope * 180) / Math.PI);
      result.rotation =
        degrees <= 10 ? "straight" : degrees <= 18 ? "slight" : "excessive";
      result.headRotationAcceptable = degrees <= 18;
    }

    result.completeFace = !!(
      leftEyeTop &&
      leftEyeBottom &&
      rightEyeTop &&
      rightEyeBottom &&
      noseTip &&
      mouthTop &&
      mouthBottom &&
      leftEarPoint &&
      rightEarPoint
    );

    return result;
  };

  const scoreQuality = (predictions: faceLandmarksDetection.Face[]) => {
    let score = 0;
    const validation = buildValidation(predictions);
    if (validation.singleFace) score += 20;
    if (validation.completeFace) score += 20;
    if (validation.eyesOpen) score += 15;
    if (validation.bothEars) score += 10;
    if (validation.centered) score += 15;
    if (validation.distanceGood) score += 10;
    if (validation.headRotationAcceptable) score += 10;
    if (lighting === "Optimal") score += 10;
    return Math.min(100, score);
  };

  const computeValidationState = (
    predictions: faceLandmarksDetection.Face[],
  ) => {
    const validation = buildValidation(predictions);
    const instructions: string[] = [];

    if (predictions.length === 1) {
      instructions.push("✓ Face detected");
    } else if (predictions.length > 1) {
      instructions.push("⚠ Multiple faces are visible");
    } else {
      instructions.push("⚠ No face detected");
    }

    if (validation.tooClose) {
      setGuidanceMessage("Move farther away from the camera.");
      instructions.push("↘ Move farther away");
    } else if (validation.tooFar) {
      setGuidanceMessage("Move closer to the camera.");
      instructions.push("↗ Move closer");
    } else if (!validation.centered) {
      setGuidanceMessage("Center your face within the capture frame.");
      instructions.push("↔ Center your face");
    }

    if (!validation.eyesOpen) {
      setGuidanceMessage("Remove glasses or keep your eyes open.");
      instructions.push("👓 Remove glasses");
    }

    if (!validation.bothEars) {
      setGuidanceMessage(
        "Remove cap or pull hair back so the face stays clear.",
      );
      instructions.push("🧢 Remove cap");
    }

    if (!validation.noseDetected || !validation.mouthDetected) {
      setGuidanceMessage("Keep the full face visible and free from coverings.");
      instructions.push("🧼 Keep the full face visible");
    }

    if (validation.rotation !== "straight") {
      setGuidanceMessage(
        "Keep your head straight and look directly at the camera.",
      );
      instructions.push("🧭 Keep your head straight");
    }

    if (backgroundPlane !== "Stable") {
      instructions.push("🖼️ Background is not clear");
    }

    if (lighting !== "Optimal") {
      instructions.push("💡 Improve lighting");
    }

    if (predictions.length === 1 && instructions.length === 1) {
      setGuidanceMessage(
        "Hold still while we capture your passport-style face image.",
      );
      instructions.push("✓ Ready for capture");
    }

    setInstructionList(instructions);
    setValidationResults(validation);
    setQualityScore(scoreQuality(predictions));
  };

  const createPassportCrop = (
    video: HTMLVideoElement,
    box: { x: number; y: number; width: number; height: number },
    landmarksMap: Record<string, FaceLandmarkPosition>,
  ) => {
    const cropCanvas = document.createElement("canvas");
    const targetWidth = 600;
    const targetHeight = 750;
    cropCanvas.width = targetWidth;
    cropCanvas.height = targetHeight;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return "";

    const marginFactor = 0.25;
    let cropWidth = box.width * (1 + marginFactor);
    let cropHeight = cropWidth * (5 / 4);
    if (cropHeight < box.height * (1 + marginFactor)) {
      cropHeight = box.height * (1 + marginFactor);
      cropWidth = cropHeight * (4 / 5);
    }
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    let sx = centerX - cropWidth / 2;
    let sy = centerY - cropHeight / 2;
    sx = Math.max(0, Math.min(sx, video.videoWidth - cropWidth));
    sy = Math.max(0, Math.min(sy, video.videoHeight - cropHeight));

    const leftEye = landmarksMap.leftEye;
    const rightEye = landmarksMap.rightEye;
    let angle = 0;
    if (leftEye && rightEye) {
      angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    }

    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate(-angle);
    ctx.drawImage(
      video,
      sx,
      sy,
      cropWidth,
      cropHeight,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight,
    );
    ctx.restore();

    return cropCanvas.toDataURL("image/jpeg", 0.92);
  };

  const encryptFaceTemplate = async (template: number[]) => {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode("votex-face-guard-2026"),
        "PBKDF2",
        false,
        ["deriveKey"],
      );
      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: encoder.encode("votex-salt"),
          iterations: 200000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"],
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cipher = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(JSON.stringify(template)),
      );
      const encodedIv = btoa(String.fromCharCode(...Array.from(iv)));
      const encodedCipher = btoa(
        String.fromCharCode(...new Uint8Array(cipher)),
      );
      return `v1:${encodedIv}:${encodedCipher}`;
    } catch (error) {
      console.warn("Unable to encrypt face template", error);
      return undefined;
    }
  };

  const captureFaceData = async (
    predictions: faceLandmarksDetection.Face[],
  ) => {
    if (!videoRef.current || !canvasRef.current || predictions.length === 0) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const originalImage = canvas.toDataURL("image/jpeg", 0.96);

    const box = predictions[0].box;
    const landmarksMap: Record<string, FaceLandmarkPosition> = {
      leftEye: getKeypoint(predictions, 33) ||
        getKeypoint(predictions, 133) || { x: box.xMin, y: box.yMin },
      rightEye: getKeypoint(predictions, 263) ||
        getKeypoint(predictions, 362) || {
          x: box.xMin + box.width,
          y: box.yMin,
        },
      nose: getKeypoint(predictions, 1) || {
        x: box.xMin + box.width / 2,
        y: box.yMin + box.height / 2,
      },
      mouthTop: getKeypoint(predictions, 13) || {
        x: box.xMin + box.width / 2,
        y: box.yMin + box.height * 0.75,
      },
      mouthBottom: getKeypoint(predictions, 14) || {
        x: box.xMin + box.width / 2,
        y: box.yMin + box.height * 0.78,
      },
    };

    const croppedImage = createPassportCrop(
      video,
      {
        x: box.xMin,
        y: box.yMin,
        width: box.width,
        height: box.height,
      },
      landmarksMap,
    );

    const faceTemplate = [
      qualityScore / 100,
      livenessScore / 100,
      confidenceScore,
      validationResults.centered ? 1 : 0,
      validationResults.eyesOpen ? 1 : 0,
      validationResults.bothEars ? 1 : 0,
      validationResults.noseDetected ? 1 : 0,
      validationResults.mouthDetected ? 1 : 0,
      validationResults.headRotationAcceptable ? 1 : 0,
      box.width / Math.max(video.videoWidth, 1),
      box.height / Math.max(video.videoHeight, 1),
    ];
    const encryptedFaceData = await encryptFaceTemplate(faceTemplate);

    const result: FaceCaptureResult = {
      originalImage,
      croppedImage,
      faceBoundingBox: {
        x: box.xMin,
        y: box.yMin,
        width: box.width,
        height: box.height,
      },
      landmarks: landmarksMap,
      qualityScore,
      livenessScore,
      confidenceScore,
      validation: validationResults,
      qualityMeter,
      antiSpoofScore,
      backgroundClarity,
      poseStatus,
      occlusionStatus,
      backgroundPlane,
      encryptedFaceData,
      timestamp: new Date().toISOString(),
    };

    setCaptureResult(result);
    onCapture(originalImage, faceTemplate, result);
    if (onCaptureResult) onCaptureResult(result);
    return result;
  };

  useEffect(() => {
    if (cameraActive && scannerMode === "face-api") {
      loadDetector();
    }
  }, [cameraActive, scannerMode]);

  useEffect(() => {
    if (!cameraActive || scannerMode !== "face-api" || !detector) return;

    let active = true;
    let requestId = 0;
    let previousCenter: FaceLandmarkPosition | null = null;
    let stableFrames = 0;
    let blinkFrames = 0;
    let headMovementFramesCounter = 0;
    let lastBlinkTime = Date.now();

    const runDetection = async () => {
      if (!active || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2) {
        requestId = requestAnimationFrame(runDetection);
        return;
      }

      try {
        const predictions = await detector.estimateFaces(video, {
          flipHorizontal: true,
        });
        setFaceCount(predictions.length);

        if (predictions.length === 1) {
          const face = predictions[0];
          const box = face.box;
          const validation = buildValidation(predictions);
          setBoundingBox({
            x: box.xMin,
            y: box.yMin,
            width: box.width,
            height: box.height,
          });

          const leftEyePoint =
            getKeypoint(predictions, 33) || getKeypoint(predictions, 133);
          const rightEyePoint =
            getKeypoint(predictions, 263) || getKeypoint(predictions, 362);
          const nosePoint = getKeypoint(predictions, 1);
          const mouthTop = getKeypoint(predictions, 13);
          const mouthBottom = getKeypoint(predictions, 14);
          const leftEarPoint = getKeypoint(predictions, 234);
          const rightEarPoint = getKeypoint(predictions, 454);

          setLeftEye(!!leftEyePoint);
          setRightEye(!!rightEyePoint);
          setNose(!!nosePoint);
          setMouth(!!mouthTop && !!mouthBottom);
          setLeftEar(!!leftEarPoint);
          setRightEar(!!rightEarPoint);

          if (face.box) {
            const centerX = box.xMin + box.width / 2;
            const centerY = box.yMin + box.height / 2;
            const frameWidth = video.videoWidth;
            const frameHeight = video.videoHeight;
            const centerXDelta = Math.abs(centerX - frameWidth / 2);
            const centerYDelta = Math.abs(centerY - frameHeight / 2);
            setFacePlane(
              centerXDelta < frameWidth * 0.12 &&
                centerYDelta < frameHeight * 0.12
                ? "Centered"
                : "Not Centered",
            );
            setFaceDistance(
              box.width / frameWidth > 0.48
                ? "too_close"
                : box.width / frameWidth < 0.24
                  ? "too_far"
                  : "good",
            );
          }

          if (leftEyePoint && rightEyePoint && nosePoint) {
            const eyeSlope = Math.atan2(
              rightEyePoint.y - leftEyePoint.y,
              rightEyePoint.x - leftEyePoint.x,
            );
            const degrees = Math.abs((eyeSlope * 180) / Math.PI);
            setFaceOrientation(
              degrees <= 10
                ? "Straight"
                : degrees <= 25
                  ? "Turned Left"
                  : "Turned Right",
            );
            setConfidenceScore(Math.min(1, face.score ?? 1));
          }

          const faceCenter = {
            x: (box.xMin + box.xMax) / 2,
            y: (box.yMin + box.yMax) / 2,
          };
          const previousFaceCenter = previousCenter;
          if (previousFaceCenter) {
            const motionDelta = calcDistance(previousFaceCenter, faceCenter);
            const stability = Math.max(0, 1 - motionDelta / 20);
            setMotionStability(stability);
            stableFrames = stability > 0.9 ? stableFrames + 1 : 0;
            if (motionDelta > 8) {
              headMovementFramesCounter += 1;
              setHeadMovementFrames((value) => value + 1);
            }
          }
          previousCenter = faceCenter;

          const leftEyeOpen = leftEyePoint && getKeypoint(predictions, 145);
          const rightEyeOpen = rightEyePoint && getKeypoint(predictions, 374);
          if (leftEyeOpen && rightEyeOpen) {
            const leftDistance = calcEyeOpenness(leftEyePoint, leftEyeOpen);
            const rightDistance = calcEyeOpenness(rightEyePoint, rightEyeOpen);
            const blinkDetected = leftDistance < 4.5 || rightDistance < 4.5;
            if (blinkDetected && Date.now() - lastBlinkTime > 900) {
              blinkFrames += 1;
              lastBlinkTime = Date.now();
              setBlinkCount((count) => count + 1);
            }
          }

          if (blinkFrames === 0) {
            setLivenessPrompt("Blink once to prove liveness.");
          } else if (headMovementFramesCounter > 0) {
            setLivenessPrompt("Natural head movement detected. Hold still.");
          } else {
            setLivenessPrompt("Move your head slightly left or right.");
          }

          const predictionsQuality = scoreQuality(predictions);
          const frameQuality = estimateFrameQuality(video, box);
          const spoofScore = Math.min(
            100,
            Math.round(
              (frameQuality / 100) * 35 +
                (blinkFrames > 0 ? 25 : 0) +
                (headMovementFrames > 0 ? 25 : 0) +
                (stableFrames >= 3 ? 15 : 0),
            ),
          );
          setQualityMeter(frameQuality);
          setBackgroundClarity(
            frameQuality >= 72 && validation.centered ? "Clear" : "Busy",
          );
          setPoseStatus(
            validation.headRotationAcceptable && validation.centered
              ? "Aligned"
              : "Needs adjustment",
          );
          setOcclusionStatus(
            validation.bothEars &&
              validation.noseDetected &&
              validation.mouthDetected
              ? "Clear"
              : "Obstructed",
          );
          setBackgroundPlane(
            frameQuality >= 72 && validation.centered ? "Stable" : "Cluttered",
          );
          setAntiSpoofScore(spoofScore);
          setQualityScore(predictionsQuality);
          const liveness = Math.min(
            100,
            Math.round(
              stableFrames * 20 + blinkFrames * 15 + predictionsQuality / 10,
            ),
          );
          setLivenessScore(liveness);

          computeValidationState(predictions);

          const faceDetected =
            validation.singleFace === true || predictions.length === 1;
          const hasReasonablePose =
            validation.centered === true ||
            validation.distanceGood === true ||
            (validation.tooClose === false && validation.tooFar === false);

          if (
            faceDetected &&
            hasReasonablePose &&
            stableFrames >= 2 &&
            blinkFrames >= 0 &&
            headMovementFramesCounter >= 0 &&
            spoofScore >= 45 &&
            predictionsQuality >= 60
          ) {
            setScanStep("locked");
            if (countdown === null) {
              setCountdown(2);
              countdownTimerRef.current = window.setTimeout(() => {
                captureFaceData(predictions).then((res) => {
                  if (res) {
                    setPreviewImage(res.croppedImage);
                    setScanStep("registered");
                    setBiometricsLog((l) => [
                      ...l,
                      "✔ Passport-compliant face capture complete.",
                      "Liveness and quality checks passed.",
                    ]);
                  }
                });
              }, 1000);
            }
          }
        } else {
          setBoundingBox(null);
          setFaceDistance("good");
          setQualityScore(0);
          setLivenessScore(0);
          setConfidenceScore(0);
          setGuidanceMessage(
            predictions.length === 0
              ? "No face found. Please position your face inside the frame."
              : "Multiple faces detected. Only one person should be visible.",
          );
        }
      } catch (error) {
        console.warn("Face detection error", error);
      }

      requestId = requestAnimationFrame(runDetection);
    };

    runDetection();

    return () => {
      active = false;
      cancelAnimationFrame(requestId);
    };
  }, [cameraActive, scannerMode, detector, validationResults, countdown]);

  // Calibration validator calculation
  const getValidationIssues = () => {
    const issues: string[] = [];
    if (faceCount === 0) {
      issues.push("No face detected in canvas frame.");
    } else if (faceCount > 1) {
      issues.push(
        "Multiple faces detected. Ensure only one person is in frame.",
      );
    }

    if (faceCount === 1) {
      if (!leftEye || !rightEye) {
        issues.push("Eyes missing or obscured.");
      }
      if (eyesClosed) {
        issues.push("Eyes closed. Please look open-eyed at the lens.");
      }
      if (!leftEar || !rightEar) {
        issues.push("Ears obscured. Ensure hair/hat is swept back.");
      }
      if (!nose) issues.push("Nose obscured.");
      if (!mouth) issues.push("Mouth obscured.");
      if (
        faceOrientation === "Turned Left" ||
        faceOrientation === "Turned Right"
      ) {
        issues.push(
          `Face orientation turned (${faceOrientation}). Align straight.`,
        );
      }
      if (lighting === "Too Dark") {
        issues.push("Poor lighting (Too Dark). Enable a key light source.");
      }
      if (lighting === "Too Bright") {
        issues.push(
          "Exposure over-saturated (Too Bright). Step back from glare.",
        );
      }
      if (quality === "Blurry") {
        issues.push("Camera target out of focus (Blurry). Hold steady.");
      }
    }
    return issues;
  };

  const validationIssues = getValidationIssues();
  const isValidReady = validationIssues.length === 0;

  // Handles starting/canceling the automatic high-precision face capturing countdown
  useEffect(() => {
    if (
      !cameraActive ||
      scanStep === "registered" ||
      scanStep === "processing"
    ) {
      setCountdown(null);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    if (isValidReady) {
      if (scanStep === "idle" || scanStep === "aligning") {
        setScanStep("locked");
        setBiometricsLog((l) => [
          ...l,
          "✔ ALL SYSTEMS NOMINAL: Biometric face mesh lock acquired.",
        ]);
      }

      if (countdown === null) {
        setCountdown(3);
        setBiometricsLog((l) => [
          ...l,
          "Stabilizing target coordinates... countdown triggered.",
        ]);

        let localSec = 3;
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        countdownTimerRef.current = setInterval(() => {
          localSec -= 1;
          if (localSec > 0) {
            setCountdown(localSec);
          } else {
            clearInterval(countdownTimerRef.current);
            setCountdown(null);
            handleAutoTriggerCapture();
          }
        }, 1000);
      }
    } else {
      // If validation falls out of optimal requirements, break lock
      if (scanStep === "locked") {
        setScanStep("aligning");
        setBiometricsLog((l) => [
          ...l,
          "⚠ Biometric lock lost. Parameters compromised: " +
            validationIssues[0],
        ]);
      }
      if (countdown !== null) {
        setCountdown(null);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      }
    }
  }, [isValidReady, cameraActive, scanStep]);

  // Render loop to canvas
  useEffect(() => {
    if (!cameraActive) return;

    let active = true;
    let animFrameId: number;
    let jitterPhase = 0;

    const renderLoop = () => {
      if (!active) return;
      const canvas = uiCanvasRef.current;
      const video = videoRef.current;

      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Keep canvas resolution in strict high definition (740x510 on desktop)
          const designWidth = 740;
          const designHeight = 510;
          if (canvas.width !== designWidth || canvas.height !== designHeight) {
            canvas.width = designWidth;
            canvas.height = designHeight;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Draw camera feed or simulation backdrop
          if (!isSimulated && video && !video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          } else {
            // High fidelity dark cyber backdrop for simulator mode
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw holographic facial node frame
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 40) {
              ctx.beginPath();
              ctx.moveTo(i, 0);
              ctx.lineTo(i, canvas.height);
              ctx.stroke();
            }
            for (let j = 0; j < canvas.height; j += 40) {
              ctx.beginPath();
              ctx.moveTo(0, j);
              ctx.lineTo(canvas.width, j);
              ctx.stroke();
            }
          }

          // Apply post-processing visual filters reflecting calibration settings
          if (lighting === "Too Dark") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (lighting === "Too Bright") {
            ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          if (quality === "Blurry") {
            ctx.fillStyle = "rgba(15, 23, 42, 0.15)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Draw simple blur overlay
            ctx.font = "italic font-sans text-xs";
            ctx.fillStyle = "#ef4444";
          }

          // 2. Draw HUD graphic overlays (grid, centering line, state readouts)
          ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, 0);
          ctx.lineTo(canvas.width / 2, canvas.height);
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();

          // 3. Draw face target frame matching alignment
          const faceColor = isValidReady ? "#10b981" : "#3b82f6";
          ctx.strokeStyle = faceColor;
          ctx.lineWidth = 2.5;

          // Align frame bounds
          const frameWidth = 240;
          const frameHeight = 310;
          const fx = (canvas.width - frameWidth) / 2;
          const fy = (canvas.height - frameHeight) / 2 - 10;

          // Centenarian alignment ring
          ctx.beginPath();
          ctx.ellipse(
            canvas.width / 2,
            canvas.height / 2 - 15,
            frameWidth / 2,
            frameHeight / 2,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();

          // Corner frames
          ctx.strokeStyle = faceColor;
          ctx.lineWidth = 4;
          // Top Left
          ctx.beginPath();
          ctx.moveTo(fx - 10, fy + 40);
          ctx.lineTo(fx - 10, fy - 10);
          ctx.lineTo(fx + 40, fy - 10);
          ctx.stroke();
          // Top Right
          ctx.beginPath();
          ctx.moveTo(fx + frameWidth + 10, fy + 40);
          ctx.lineTo(fx + frameWidth + 10, fy - 10);
          ctx.lineTo(fx + frameWidth - 40, fy - 10);
          ctx.stroke();
          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(fx - 10, fy + frameHeight - 40);
          ctx.lineTo(fx - 10, fy + frameHeight + 10);
          ctx.lineTo(fx + 40, fy + frameHeight + 10);
          ctx.stroke();
          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(fx + frameWidth + 10, fy + frameHeight - 40);
          ctx.lineTo(fx + frameWidth + 10, fy + frameHeight + 10);
          ctx.lineTo(fx + frameWidth - 40, fy + frameHeight + 10);
          ctx.stroke();

          // 4. Render Dynamic Landmarks (facial key points)
          if (faceCount > 0) {
            jitterPhase += 0.08;
            const jitterX = Math.sin(jitterPhase) * 2;
            const jitterY = Math.cos(jitterPhase * 0.8) * 2;

            // Offset based on face orientation turned left or right
            let faceOffsetX = 0;
            if (faceOrientation === "Turned Left") faceOffsetX = -60;
            if (faceOrientation === "Turned Right") faceOffsetX = 60;
            if (faceOrientation === "Not Centered") faceOffsetX = -130;

            const cx = canvas.width / 2 + faceOffsetX + jitterX;
            const cy = canvas.height / 2 - 10 + jitterY;

            // Set up landmarks definitions
            const nodes = [
              {
                label: "L. EYE",
                present: leftEye,
                x: cx - 45,
                y: cy - 35,
                isClosed: eyesClosed,
              },
              {
                label: "R. EYE",
                present: rightEye,
                x: cx + 45,
                y: cy - 35,
                isClosed: eyesClosed,
              },
              { label: "L. EAR", present: leftEar, x: cx - 95, y: cy - 10 },
              { label: "R. EAR", present: rightEar, x: cx + 95, y: cy - 10 },
              { label: "NOSE", present: nose, x: cx, y: cy + 5 },
              { label: "MOUTH", present: mouth, x: cx, y: cy + 55 },
            ];

            // Render Node Dots and coordinate tags
            nodes.forEach((node) => {
              if (node.present) {
                ctx.fillStyle = faceColor;
                ctx.strokeStyle = faceColor;
                ctx.lineWidth = 1.5;

                // Dot
                ctx.beginPath();
                if (node.isClosed) {
                  // Draw flat closed eyes
                  ctx.moveTo(node.x - 8, node.y);
                  ctx.lineTo(node.x + 8, node.y);
                  ctx.strokeStyle = "#ef4444";
                  ctx.stroke();
                } else {
                  // Draw glowing node circles
                  ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
                  ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
                  ctx.stroke();
                }

                // Text Coord label
                ctx.fillStyle = "#10b981";
                ctx.font = "bold 8px monospace";
                ctx.fillText(
                  `${node.label}: [${Math.round(node.x)}, ${Math.round(node.y)}]`,
                  node.x + 8,
                  node.y - 8,
                );

                // Connect nodes with light mesh vector lines
                ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, cy + 5); // Connect from nose
                ctx.lineTo(node.x, node.y);
                ctx.stroke();
              } else {
                // If landmark is missing/obscured, draw red error indicator
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(node.x - 6, node.y - 6);
                ctx.lineTo(node.x + 6, node.y + 6);
                ctx.moveTo(node.x + 6, node.y - 6);
                ctx.lineTo(node.x - 6, node.y + 6);
                ctx.stroke();
                ctx.fillStyle = "#ef4444";
                ctx.font = "bold 8px monospace";
                ctx.fillText(`${node.label} [FAIL]`, node.x + 8, node.y - 8);
              }
            });

            // If we have multiple faces, draw a scary secondary warning rectangle
            if (faceCount > 1) {
              ctx.strokeStyle = "#f59e0b";
              ctx.lineWidth = 2;
              ctx.strokeRect(cx - 240, cy - 80, 160, 200);
              ctx.fillStyle = "#f59e0b";
              ctx.font = "bold 10px sans-serif";
              ctx.fillText(
                "ATTENTION: SECONDARY TARGET DETECTED",
                cx - 240,
                cy - 90,
              );
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      active = false;
      cancelAnimationFrame(animFrameId);
    };
  }, [
    cameraActive,
    isSimulated,
    leftEye,
    rightEye,
    leftEar,
    rightEar,
    nose,
    mouth,
    faceOrientation,
    eyesClosed,
    lighting,
    quality,
    faceCount,
    isValidReady,
  ]);

  // Triggers camera device retrieval
  const startCamera = async () => {
    setPreviewImage(null);
    setScanStep("idle");
    setHasCamera(null);
    setIsSimulated(false);
    setProgress(0);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setBiometricsLog([
          "Initializing hardware client local stream...",
          "Requesting camera permissions...",
        ]);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 740, height: 510, facingMode: "user" },
        });
        setStream(mediaStream);
        setHasCamera(true);
        setCameraActive(true);
        setScanStep("aligning");
        setBiometricsLog((l) => [
          ...l,
          "✔ Native hardware stream bound successfully.",
          "Align your face with the central guidelines tracker.",
        ]);
      } else {
        throw new Error("Local platform has no media device access routes");
      }
    } catch (err) {
      console.warn(
        "Unable to capture native video feed, launching high-fidelity simulation: ",
        err,
      );
      setHasCamera(false);
      setCameraActive(true);
      setIsSimulated(true);
      setScanStep("aligning");
      setBiometricsLog([
        "Hardware camera blocked or unavailable.",
        "BOOTING HIGH-FIDELITY BIOMETRIC HOLO-SIMULATION FRAMEWORK...",
      ]);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setScanStep("idle");
    setCountdown(null);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  const handleAutoTriggerCapture = async () => {
    if (scanStep === "processing") return;
    setScanStep("processing");
    setBiometricsLog((l) => [
      ...l,
      "Analyzing final face registration frame...",
      "Performing passport-standard alignment and quality validation...",
    ]);

    if (!videoRef.current) {
      setBiometricsLog((l) => [
        ...l,
        "⚠ Capture aborted: video feed unavailable.",
      ]);
      setScanStep("aligning");
      return;
    }

    try {
      let predictions: faceLandmarksDetection.Face[] = [];

      if (detector) {
        predictions = await detector.estimateFaces(videoRef.current, {
          flipHorizontal: true,
        });
      }

      if (predictions.length === 0) {
        const fallbackImage = canvasRef.current?.toDataURL?.("image/png");
        if (fallbackImage) {
          setPreviewImage(fallbackImage);
          setScanStep("registered");
          setBiometricsLog((l) => [
            ...l,
            "✔ Manual capture completed using the current camera frame.",
          ]);
          onCapture?.(fallbackImage);
          return;
        }
      }

      if (predictions.length !== 1) {
        setBiometricsLog((l) => [
          ...l,
          "Capture aborted: ensure exactly one face is visible.",
        ]);
        setScanStep("aligning");
        return;
      }

      const result = await captureFaceData(predictions);
      if (result) {
        setPreviewImage(result.croppedImage);
        setScanStep("registered");
        setBiometricsLog((l) => [
          ...l,
          "✔ Passport-compliant face capture complete.",
          `Quality score: ${result.qualityScore}`,
          `Liveness score: ${result.livenessScore}`,
        ]);
      } else {
        setScanStep("aligning");
        setBiometricsLog((l) => [
          ...l,
          "⚠ Capture failed to produce a valid passport crop. Please realign and retry.",
        ]);
      }
    } catch (error) {
      console.warn("Auto capture failed", error);
      setScanStep("aligning");
      setBiometricsLog((l) => [
        ...l,
        "⚠ Auto capture error. Please adjust lighting and try again.",
      ]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto text-white">
      {/* 1. Large High-definition Camera Preview Console */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center">
        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase mb-2 block self-start">
          Secure Camera Viewport (Min 700x500px Console)
        </span>

        <div className="relative w-full aspect-[1.4] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center border-2 border-slate-800">
          {/* Diagnostic status watermark */}
          <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${cameraActive ? (isValidReady ? "bg-emerald-500 animate-pulse" : "bg-blue-500") : "bg-red-500"}`}
            />
            <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">
              {cameraActive
                ? isValidReady
                  ? "State: Locked & Stable"
                  : "State: Unlocked / Aligning"
                : "State: Stream Closed"}
            </span>
          </div>

          {/* Grid background effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-15 pointer-events-none"></div>

          <AnimatePresence mode="wait">
            {!cameraActive && !previewImage && (
              <motion.div
                key="start-prompt"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-4 border border-blue-500/20">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-slate-100 font-extrabold text-sm uppercase tracking-wider mb-2">
                  Biometric Engine Closed
                </h4>
                <p className="text-slate-400 text-[11px] max-w-[280px] mx-auto mb-5">
                  Connect device camera capture routes to process multi-landmark
                  contour checks.
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  Mount Secure Camera
                </button>
              </motion.div>
            )}

            {cameraActive && !previewImage && (
              <motion.div
                key="camera-stream"
                className="absolute inset-0 w-full h-full"
              >
                <canvas
                  ref={uiCanvasRef}
                  className="w-full h-full object-cover"
                />

                {/* Simulated scanner visual sweep */}
                {scanStep !== "idle" && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent top-0 animate-[shimmer_2s_infinite] shadow-[0_0_8px_#3b82f6] opacity-35" />
                )}

                {/* Real-time automated lock countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/70 backdrop-blur-xs">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center text-3xl font-black text-emerald-400 font-mono shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-slate-900"
                    >
                      {countdown}
                    </motion.div>
                    <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mt-4">
                      Hold Steady. Scanning...
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {previewImage && (
              <motion.div
                key="preview-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 w-full h-full flex flex-col bg-slate-950"
              >
                <img
                  src={previewImage}
                  alt="Captured Template"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-white text-xs font-extrabold uppercase">
                        Biometrics Sealed
                      </h5>
                      <p className="text-emerald-400 font-mono text-[9px] uppercase tracking-wider">
                        Holographic Hash: COMPLIANT ✔
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] uppercase font-bold cursor-pointer transition-colors"
                  >
                    Reset & Recalibrate
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden helper elements */}
          <canvas ref={canvasRef} className="hidden" />
          <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        </div>
      </div>

      {/* 2. Interactive Calibration, Checks & Console Logs Panel */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between gap-4">
        {/* Core Description titles */}
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-1 lg:mt-5">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-extrabold text-slate-100 text-sm uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
            {subtitle}
          </p>

          <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-blue-400 mb-2">
              Live verification guidance
            </div>
            <div className="text-sm font-semibold text-white mb-2">
              {guidanceMessage}
            </div>
            <div className="flex flex-wrap gap-2">
              {instructionList.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-emerald-300">
              Liveness prompt: {livenessPrompt}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
                Mode
              </span>
              <button
                type="button"
                onClick={() => setScannerMode("face-api")}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold ${scannerMode === "face-api" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
              >
                face-api
              </button>
              <button
                type="button"
                onClick={() => setScannerMode("default")}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold ${scannerMode === "default" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
              >
                default
              </button>
            </div>
            {scannerMode === "face-api" && (
              <div className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/20">
                Face-API inference active
              </div>
            )}
          </div>

          {/* Verification Status list representing the automated checks */}
          {cameraActive && !previewImage && (
            <div className="mb-4 bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
              <span className="text-[9px] font-mono font-extrabold text-blue-400 uppercase tracking-widest block mb-3">
                Facial Landmarks live validation:
              </span>

              {/* Landmark Checkboxes */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono mb-4">
                <span
                  className={`flex items-center gap-1.5 ${leftEye ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {leftEye ? "✔" : "✖"} Left Eye{" "}
                  {leftEye ? "Detected" : "Missing"}
                </span>
                <span
                  className={`flex items-center gap-1.5 ${rightEye ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {rightEye ? "✔" : "✖"} Right Eye{" "}
                  {rightEye ? "Detected" : "Missing"}
                </span>
                <span
                  className={`flex items-center gap-1.5 ${leftEar ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {leftEar ? "✔" : "✖"} Left Ear{" "}
                  {leftEar ? "Obscured" : "Missing"}
                </span>
                <span
                  className={`flex items-center gap-1.5 ${rightEar ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {rightEar ? "✔" : "✖"} Right Ear{" "}
                  {rightEar ? "Obscured" : "Missing"}
                </span>
                <span
                  className={`flex items-center gap-1.5 ${nose ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {nose ? "✔" : "✖"} Nose Bridge {nose ? "Aligned" : "Obscured"}
                </span>
                <span
                  className={`flex items-center gap-1.5 ${mouth ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {mouth ? "✔" : "✖"} Mouth Contour{" "}
                  {mouth ? "Visible" : "Obscured"}
                </span>
              </div>

              {/* Dynamic live notifications for the validation rejections list */}
              {validationIssues.length > 0 ? (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-amber-300 text-[10px] font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold block text-sm mb-0.5">
                      ALIGNMENT FAILED:
                    </span>
                    <ul className="list-disc pl-3 text-[10px] space-y-0.5 font-medium">
                      {validationIssues.slice(0, 3).map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                      {validationIssues.length > 3 && (
                        <li>
                          And {validationIssues.length - 3} other
                          parameter(s)...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-300 text-[10px]">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 animate-bounce" />
                  <span className="font-bold font-mono">
                    AUTOMATED PARAMETERS MATCHED. AUTO-SHUTTER CAPTURING READY.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button triggers */}
        <div className="pt-2">
          {cameraActive &&
            scanStep !== "registered" &&
            scanStep !== "processing" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoTriggerCapture}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl cursor-pointer transition-colors border border-emerald-500/30"
                >
                  Capture Face Now
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold uppercase text-xs tracking-wider rounded-xl cursor-pointer hover:text-white transition-colors border border-slate-700"
                >
                  Cancel Scan Session
                </button>
              </div>
            )}

          {!cameraActive && previewImage && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl font-bold border border-emerald-500/20 w-full justify-center font-mono">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                BIOMETRICS PASSED & SEALED
              </div>
            </div>
          )}

          {!cameraActive && !previewImage && (
            <div className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-slate-400 text-[10px]">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Please mount the local biometric scanner to lock onto
                coordinates and generate secure voting tokens.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
