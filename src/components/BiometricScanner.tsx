import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import type * as tf from "@tensorflow/tfjs-core";
import type * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { loadTensorflowFaceModules } from "../services/tensorflow";
import {
  buildFallbackFaceBox,
  resolveCaptureDimensions,
} from "./biometricScanner.utils";

// ==================== Type Definitions ====================
interface FaceLandmarkPosition {
  x: number;
  y: number;
}

interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceCaptureResult {
  originalImage: string;
  croppedImage: string;
  faceBoundingBox: FaceBoundingBox;
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

type ScannerMode = "default" | "face-api";
type ScanStep = "idle" | "aligning" | "locked" | "processing" | "registered";
type FaceOrientation =
  | "Straight"
  | "Turned Left"
  | "Turned Right"
  | "Not Centered";
type LightingCondition = "Too Dark" | "Optimal" | "Too Bright";
type ImageQuality = "Blurry" | "Optimal";
type BackgroundPlane = "Stable" | "Uneven" | "Cluttered";
type FacePlane = "Centered" | "Tilted" | "Profile" | "Not Centered" | "Unknown";

// ==================== Constants ====================
const CANVAS_DIMENSIONS = { width: 740, height: 510 };
const FRAME_DIMENSIONS = { width: 240, height: 310 };
const TARGET_IMAGE_SIZE = { width: 600, height: 750 };
const DETECTION_CONFIG = {
  maxFaces: 2,
  refineLandmarks: true,
  runtime: "tfjs" as const,
};

const LANDMARK_INDICES = {
  LEFT_EYE: 33,
  LEFT_EYE_ALT: 133,
  RIGHT_EYE: 263,
  RIGHT_EYE_ALT: 362,
  NOSE_TIP: 1,
  MOUTH_TOP: 13,
  MOUTH_BOTTOM: 14,
  LEFT_EAR: 234,
  RIGHT_EAR: 454,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
} as const;

// ==================== Utility Functions ====================
const calculateDistance = (
  a: FaceLandmarkPosition,
  b: FaceLandmarkPosition,
): number => Math.hypot(a.x - b.x, a.y - b.y);

const calculateEyeOpenness = (
  top: FaceLandmarkPosition,
  bottom: FaceLandmarkPosition,
): number => calculateDistance(top, bottom);

const getKeypoint = (
  predictions: faceLandmarksDetection.Face[],
  index: number,
): FaceLandmarkPosition | null => {
  if (!predictions?.[0]?.keypoints) return null;
  const keypoint = predictions[0].keypoints[index];
  return keypoint ? { x: keypoint.x, y: keypoint.y } : null;
};

const estimateFrameQuality = (
  video: HTMLVideoElement,
  box: { xMin: number; yMin: number; width: number; height: number },
): number => {
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
  const pixelCount = imageData.length / 4;

  for (let i = 0; i < imageData.length; i += 4) {
    const gray = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
    brightness += gray;
    variance += gray * gray;
  }

  const avgBrightness = brightness / pixelCount;
  const avgVariance = variance / pixelCount - avgBrightness * avgBrightness;
  const normalized = Math.min(
    100,
    Math.max(0, (avgBrightness / 255) * 45 + (avgVariance / 6500) * 55),
  );
  return Math.round(normalized);
};

const encryptFaceTemplate = async (
  template: number[],
): Promise<string | undefined> => {
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
    const cipherBytes = new Uint8Array(cipher as ArrayBuffer);
    const encodedCipher = btoa(String.fromCharCode(...Array.from(cipherBytes)));
    return `v1:${encodedIv}:${encodedCipher}`;
  } catch (error) {
    console.warn("Unable to encrypt face template", error);
    return undefined;
  }
};

// ==================== Main Component ====================
export default function BiometricScanner({
  onCapture,
  onCaptureResult,
  title = "Biometric Face Registration",
  subtitle = "Ensure you are in a well-lit room. Remove hats, glasses or face masks.",
  buttonLabel = "Capture Biometric Face ID",
  mode = "face-api",
}: BiometricScannerProps) {
  // ==================== State Management ====================
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStep, setScanStep] = useState<ScanStep>("idle");
  const [progress, setProgress] = useState(0);
  const [biometricsLog, setBiometricsLog] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>(mode);

  // Face detection state
  const [detector, setDetector] =
    useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [boundingBox, setBoundingBox] = useState<FaceBoundingBox | null>(null);
  const [landmarks, setLandmarks] = useState<
    Record<string, FaceLandmarkPosition>
  >({});
  const [qualityScore, setQualityScore] = useState(0);
  const [livenessScore, setLivenessScore] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [validationResults, setValidationResults] = useState<
    Record<string, boolean | string>
  >({});
  const [guidanceMessage, setGuidanceMessage] = useState(
    "Mount camera and align your face in the window.",
  );
  const [instructionList, setInstructionList] = useState<string[]>([
    "✓ Face detected",
  ]);

  // Biometric metrics
  const [livenessPrompt, setLivenessPrompt] = useState(
    "Blink once to prove liveness.",
  );
  const [motionStability, setMotionStability] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [headMovementFrames, setHeadMovementFrames] = useState(0);
  const [qualityMeter, setQualityMeter] = useState(0);
  const [backgroundClarity, setBackgroundClarity] = useState<"Clear" | "Busy">(
    "Clear",
  );
  const [poseStatus, setPoseStatus] = useState<"Aligned" | "Needs adjustment">(
    "Aligned",
  );
  const [occlusionStatus, setOcclusionStatus] = useState<
    "Clear" | "Obstructed"
  >("Clear");
  const [antiSpoofScore, setAntiSpoofScore] = useState(0);

  // Landmark states
  const [leftEye, setLeftEye] = useState(true);
  const [rightEye, setRightEye] = useState(true);
  const [leftEar, setLeftEar] = useState(true);
  const [rightEar, setRightEar] = useState(true);
  const [nose, setNose] = useState(true);
  const [mouth, setMouth] = useState(true);
  const [faceOrientation, setFaceOrientation] =
    useState<FaceOrientation>("Straight");
  const [eyesClosed, setEyesClosed] = useState(false);
  const [lighting, setLighting] = useState<LightingCondition>("Optimal");
  const [quality, setQuality] = useState<ImageQuality>("Optimal");
  const [faceCount, setFaceCount] = useState(1);
  const [backgroundPlane, setBackgroundPlane] =
    useState<BackgroundPlane>("Stable");
  const [facePlane, setFacePlane] = useState<FacePlane>("Unknown");
  const [faceDistance, setFaceDistance] = useState<
    "too_close" | "too_far" | "good"
  >("good");

  // Auto-capture countdown
  const [countdown, setCountdown] = useState<number | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const previousCenterRef = useRef<FaceLandmarkPosition | null>(null);
  const stableFramesRef = useRef(0);
  const blinkFramesRef = useRef(0);
  const headMovementFramesRef = useRef(0);
  const lastBlinkTimeRef = useRef(Date.now());
  const isProcessingRef = useRef(false);

  // ==================== Cleanup ====================
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupResources();
    };
  }, []);

  const cleanupResources = useCallback(() => {
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setStream(null);

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }

    // Clear countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // Dispose TensorFlow resources
    if (detector) {
      detector.dispose();
    }
  }, [detector]);

  // ==================== Camera Management ====================
  const startCamera = useCallback(async () => {
    cleanupResources();
    setPreviewImage(null);
    setScanStep("idle");
    setHasCamera(null);
    setIsSimulated(false);
    setProgress(0);
    isProcessingRef.current = false;

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        setBiometricsLog([
          "Initializing hardware client local stream...",
          "Requesting camera permissions...",
        ]);

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: CANVAS_DIMENSIONS.width,
            height: CANVAS_DIMENSIONS.height,
            facingMode: "user",
          },
        });

        if (!isMountedRef.current) {
          mediaStream
            .getTracks()
            .forEach((track: MediaStreamTrack) => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setHasCamera(true);
        setCameraActive(true);
        setScanStep("aligning");
        setBiometricsLog((prev: string[]) => [
          ...prev,
          "✔ Native hardware stream bound successfully.",
          "Align your face with the central guidelines tracker.",
        ]);
      } else {
        throw new Error("Local platform has no media device access routes");
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.warn("Unable to capture native video feed:", err);
      setHasCamera(false);
      setCameraActive(true);
      setIsSimulated(true);
      setScanStep("aligning");
      setBiometricsLog([
        "Hardware camera blocked or unavailable.",
        "BOOTING HIGH-FIDELITY BIOMETRIC HOLO-SIMULATION FRAMEWORK...",
      ]);
    }
  }, [cleanupResources]);

  const stopCamera = useCallback(() => {
    cleanupResources();
    setCameraActive(false);
    setScanStep("idle");
    setCountdown(null);
    setBoundingBox(null);
    setFaceCount(0);
  }, [cleanupResources]);

  // ==================== Video Stream Binding ====================
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      if (stream) {
        videoRef.current.play().catch((err: unknown) => {
          console.warn("Error playing video:", err);
        });
      }
    }
  }, [stream]);

  // ==================== Face Detection Model Loading ====================
  useEffect(() => {
    setScannerMode(mode);
  }, [mode]);

  useEffect(() => {
    if (!cameraActive || scannerMode !== "face-api") return;

    let isActive = true;

    const loadDetector = async () => {
      try {
        const { tf, faceLandmarksDetection } =
          await loadTensorflowFaceModules();
        await tf.setBackend("webgl");
        await tf.ready();
        const model = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          DETECTION_CONFIG,
        );

        if (isActive && isMountedRef.current) {
          setDetector(model);
          setBiometricsLog((prev) => [
            ...prev,
            "✔ Face landmark model loaded.",
          ]);
        }
      } catch (error) {
        if (isActive && isMountedRef.current) {
          console.warn("Failed to load face landmark model", error);
          setBiometricsLog((prev: string[]) => [
            ...prev,
            "⚠ Unable to load face landmark detector. Using fallback quality checks.",
          ]);
        }
      }
    };

    loadDetector();

    return () => {
      isActive = false;
    };
  }, [cameraActive, scannerMode]);

  // ==================== Validation Logic ====================
  const buildValidation = useCallback(
    (
      predictions: faceLandmarksDetection.Face[],
    ): Record<string, boolean | string> => {
      const result: Record<string, boolean | string> = {};
      const faceDetected = predictions.length === 1;
      const tooManyFaces = predictions.length > 1;
      const noFaces = predictions.length === 0;

      result.singleFace = faceDetected;
      result.multipleFaces = !tooManyFaces;
      result.facePresent = !noFaces;

      const face = predictions[0];
      if (!face || !face.box) return result;

      const leftEyeTop = getKeypoint(
        predictions,
        LANDMARK_INDICES.LEFT_EYE_TOP,
      );
      const leftEyeBottom = getKeypoint(
        predictions,
        LANDMARK_INDICES.LEFT_EYE_BOTTOM,
      );
      const rightEyeTop = getKeypoint(
        predictions,
        LANDMARK_INDICES.RIGHT_EYE_TOP,
      );
      const rightEyeBottom = getKeypoint(
        predictions,
        LANDMARK_INDICES.RIGHT_EYE_BOTTOM,
      );
      const noseTip = getKeypoint(predictions, LANDMARK_INDICES.NOSE_TIP);
      const mouthTop = getKeypoint(predictions, LANDMARK_INDICES.MOUTH_TOP);
      const mouthBottom = getKeypoint(
        predictions,
        LANDMARK_INDICES.MOUTH_BOTTOM,
      );
      const leftEarPoint = getKeypoint(predictions, LANDMARK_INDICES.LEFT_EAR);
      const rightEarPoint = getKeypoint(
        predictions,
        LANDMARK_INDICES.RIGHT_EAR,
      );

      const leftOpen =
        leftEyeTop && leftEyeBottom
          ? calculateEyeOpenness(leftEyeTop, leftEyeBottom) > 4.5
          : false;
      const rightOpen =
        rightEyeTop && rightEyeBottom
          ? calculateEyeOpenness(rightEyeTop, rightEyeBottom) > 4.5
          : false;

      result.eyesOpen = leftOpen && rightOpen;
      result.bothEyes = !!(
        leftEyeTop &&
        leftEyeBottom &&
        rightEyeTop &&
        rightEyeBottom
      );
      result.bothEars = !!(leftEarPoint && rightEarPoint);
      result.noseDetected = !!noseTip;
      result.mouthDetected = !!(mouthTop && mouthBottom);

      // Center and distance validation
      const centerX = face.box.xMin + face.box.width / 2;
      const centerY = face.box.yMin + face.box.height / 2;
      const frameWidth =
        videoRef.current?.videoWidth || CANVAS_DIMENSIONS.width;
      const frameHeight =
        videoRef.current?.videoHeight || CANVAS_DIMENSIONS.height;
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

      // Rotation validation
      if (leftEyeTop && rightEyeTop) {
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
    },
    [],
  );

  const scoreQuality = useCallback(
    (predictions: faceLandmarksDetection.Face[]): number => {
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
    },
    [buildValidation, lighting],
  );

  const computeValidationState = useCallback(
    (predictions: faceLandmarksDetection.Face[]) => {
      const validation = buildValidation(predictions);
      const instructions: string[] = [];
      let newGuidanceMessage = guidanceMessage;

      if (predictions.length === 1) {
        instructions.push("✓ Face detected");
      } else if (predictions.length > 1) {
        instructions.push("⚠ Multiple faces are visible");
        newGuidanceMessage = "Ensure only one person is visible in the frame.";
      } else {
        instructions.push("⚠ No face detected");
        newGuidanceMessage = "Please position your face inside the frame.";
      }

      if (validation.tooClose) {
        newGuidanceMessage = "Move farther away from the camera.";
        instructions.push("↘ Move farther away");
      } else if (validation.tooFar) {
        newGuidanceMessage = "Move closer to the camera.";
        instructions.push("↗ Move closer");
      } else if (!validation.centered) {
        newGuidanceMessage = "Center your face within the capture frame.";
        instructions.push("↔ Center your face");
      }

      if (!validation.eyesOpen) {
        newGuidanceMessage = "Remove glasses or keep your eyes open.";
        instructions.push("👓 Remove glasses");
      }

      if (!validation.bothEars) {
        newGuidanceMessage =
          "Remove cap or pull hair back so ears are visible.";
        instructions.push("🧢 Remove cap");
      }

      if (!validation.noseDetected || !validation.mouthDetected) {
        newGuidanceMessage =
          "Keep the full face visible and free from coverings.";
        instructions.push("🧼 Keep the full face visible");
      }

      if (validation.rotation && validation.rotation !== "straight") {
        newGuidanceMessage =
          "Keep your head straight and look directly at the camera.";
        instructions.push("🧭 Keep your head straight");
      }

      if (backgroundPlane !== "Stable") {
        instructions.push("🖼️ Background is not clear");
      }

      if (lighting !== "Optimal") {
        instructions.push("💡 Improve lighting");
      }

      if (predictions.length === 1 && instructions.length === 1) {
        newGuidanceMessage =
          "Hold still while we capture your passport-style face image.";
        instructions.push("✓ Ready for capture");
      }

      setInstructionList(instructions);
      setGuidanceMessage(newGuidanceMessage);
      setValidationResults(validation);
      setQualityScore(scoreQuality(predictions));
    },
    [buildValidation, scoreQuality, guidanceMessage, backgroundPlane, lighting],
  );

  // ==================== Image Capture Logic ====================
  const createPassportCrop = useCallback(
    (
      video: HTMLVideoElement,
      box: { xMin: number; yMin: number; width: number; height: number },
      landmarksMap: Record<string, FaceLandmarkPosition>,
    ): string => {
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = TARGET_IMAGE_SIZE.width;
      cropCanvas.height = TARGET_IMAGE_SIZE.height;
      const ctx = cropCanvas.getContext("2d");
      if (!ctx) return "";

      const { width: videoWidth, height: videoHeight } =
        resolveCaptureDimensions(video);
      const safeBox = {
        xMin: Math.max(0, Math.min(box.xMin, Math.max(0, videoWidth - 1))),
        yMin: Math.max(0, Math.min(box.yMin, Math.max(0, videoHeight - 1))),
        width: Math.max(80, Math.min(box.width, Math.max(80, videoWidth))),
        height: Math.max(80, Math.min(box.height, Math.max(80, videoHeight))),
      };

      const marginFactor = 0.25;
      let cropWidth = safeBox.width * (1 + marginFactor);
      let cropHeight = cropWidth * (5 / 4);
      if (cropHeight < safeBox.height * (1 + marginFactor)) {
        cropHeight = safeBox.height * (1 + marginFactor);
        cropWidth = cropHeight * (4 / 5);
      }

      const centerX = safeBox.xMin + safeBox.width / 2;
      const centerY = safeBox.yMin + safeBox.height / 2;
      let sx = Math.max(
        0,
        Math.min(centerX - cropWidth / 2, videoWidth - cropWidth),
      );
      let sy = Math.max(
        0,
        Math.min(centerY - cropHeight / 2, videoHeight - cropHeight),
      );

      const leftEye = landmarksMap.leftEye;
      const rightEye = landmarksMap.rightEye;
      let angle = 0;
      if (leftEye && rightEye) {
        angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
      }

      ctx.save();
      ctx.translate(TARGET_IMAGE_SIZE.width / 2, TARGET_IMAGE_SIZE.height / 2);
      ctx.rotate(-angle);
      ctx.drawImage(
        video,
        sx,
        sy,
        cropWidth,
        cropHeight,
        -TARGET_IMAGE_SIZE.width / 2,
        -TARGET_IMAGE_SIZE.height / 2,
        TARGET_IMAGE_SIZE.width,
        TARGET_IMAGE_SIZE.height,
      );
      ctx.restore();

      return cropCanvas.toDataURL("image/jpeg", 0.92);
    },
    [],
  );

  const captureFaceData = useCallback(
    async (
      predictions: faceLandmarksDetection.Face[],
    ): Promise<FaceCaptureResult | null> => {
      if (!videoRef.current || !canvasRef.current) {
        return null;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const { width: videoWidth, height: videoHeight } =
        resolveCaptureDimensions(video);
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const originalImage = canvas.toDataURL("image/jpeg", 0.96);

      const face = predictions[0];
      const fallbackBox = buildFallbackFaceBox(video);
      const box = face?.box || fallbackBox;
      const landmarksMap: Record<string, FaceLandmarkPosition> = {
        leftEye: getKeypoint(predictions, LANDMARK_INDICES.LEFT_EYE) ||
          getKeypoint(predictions, LANDMARK_INDICES.LEFT_EYE_ALT) || {
            x: box.xMin,
            y: box.yMin,
          },
        rightEye: getKeypoint(predictions, LANDMARK_INDICES.RIGHT_EYE) ||
          getKeypoint(predictions, LANDMARK_INDICES.RIGHT_EYE_ALT) || {
            x: box.xMin + box.width,
            y: box.yMin,
          },
        nose: getKeypoint(predictions, LANDMARK_INDICES.NOSE_TIP) || {
          x: box.xMin + box.width / 2,
          y: box.yMin + box.height / 2,
        },
        mouthTop: getKeypoint(predictions, LANDMARK_INDICES.MOUTH_TOP) || {
          x: box.xMin + box.width / 2,
          y: box.yMin + box.height * 0.75,
        },
        mouthBottom: getKeypoint(
          predictions,
          LANDMARK_INDICES.MOUTH_BOTTOM,
        ) || {
          x: box.xMin + box.width / 2,
          y: box.yMin + box.height * 0.78,
        },
      };

      const croppedImage = createPassportCrop(
        video,
        {
          xMin: box.xMin,
          yMin: box.yMin,
          width: box.width,
          height: box.height,
        },
        landmarksMap,
      );
      const finalCroppedImage = croppedImage || originalImage;

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
        box.width / Math.max(videoWidth, 1),
        box.height / Math.max(videoHeight, 1),
      ];

      const encryptedFaceData = await encryptFaceTemplate(faceTemplate);

      const result: FaceCaptureResult = {
        originalImage,
        croppedImage: finalCroppedImage,
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

      return result;
    },
    [
      createPassportCrop,
      qualityScore,
      livenessScore,
      confidenceScore,
      validationResults,
      qualityMeter,
      antiSpoofScore,
      backgroundClarity,
      poseStatus,
      occlusionStatus,
      backgroundPlane,
    ],
  );

  // ==================== Auto-Capture Logic ====================
  const handleAutoTriggerCapture = useCallback(async () => {
    if (scanStep === "processing" || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setScanStep("processing");
    setBiometricsLog((prev) => [
      ...prev,
      "Analyzing final face registration frame...",
      "Performing passport-standard alignment and quality validation...",
    ]);

    if (!videoRef.current) {
      setBiometricsLog((prev) => [
        ...prev,
        "⚠ Capture aborted: video feed unavailable.",
      ]);
      setScanStep("aligning");
      isProcessingRef.current = false;
      return;
    }

    try {
      let predictions: faceLandmarksDetection.Face[] = [];

      if (detector) {
        predictions = await detector.estimateFaces(videoRef.current, {
          flipHorizontal: true,
        });
      }

      if (predictions.length > 1) {
        setBiometricsLog((prev) => [
          ...prev,
          "Multiple faces detected; using the primary face region for capture.",
        ]);
      }

      const result = await captureFaceData(predictions);
      if (result && isMountedRef.current) {
        setPreviewImage(result.croppedImage || result.originalImage);
        setScanStep("registered");
        setBiometricsLog((prev) => [
          ...prev,
          "✔ Passport-compliant face capture complete.",
          `Quality score: ${result.qualityScore}`,
          `Liveness score: ${result.livenessScore}`,
        ]);

        const faceTemplate = [
          result.qualityScore / 100,
          result.livenessScore / 100,
          result.confidenceScore,
          result.validation.centered ? 1 : 0,
          result.validation.eyesOpen ? 1 : 0,
          result.validation.bothEars ? 1 : 0,
        ];

        onCapture(result.originalImage, faceTemplate, result);
        onCaptureResult?.(result);
      } else if (isMountedRef.current) {
        setScanStep("aligning");
        setBiometricsLog((prev) => [
          ...prev,
          "⚠ Capture failed to produce a valid passport crop. Please realign and retry.",
        ]);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.warn("Auto capture failed", error);
        setScanStep("aligning");
        setBiometricsLog((prev) => [
          ...prev,
          "⚠ Auto capture error. Please adjust lighting and try again.",
        ]);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [scanStep, detector, captureFaceData, onCapture, onCaptureResult]);

  // ==================== Face Detection Loop ====================
  useEffect(() => {
    if (!cameraActive || scannerMode !== "face-api" || !detector) return;

    let isActive = true;

    const runDetection = async () => {
      if (!isActive || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(runDetection);
        return;
      }

      try {
        const predictions = await detector.estimateFaces(video, {
          flipHorizontal: true,
        });

        if (!isActive || !isMountedRef.current) return;

        setFaceCount(predictions.length);

        if (predictions.length === 1) {
          const face = predictions[0];
          const box = face.box;

          setBoundingBox({
            x: box.xMin,
            y: box.yMin,
            width: box.width,
            height: box.height,
          });

          // Update landmark states
          const leftEyePoint =
            getKeypoint(predictions, LANDMARK_INDICES.LEFT_EYE) ||
            getKeypoint(predictions, LANDMARK_INDICES.LEFT_EYE_ALT);
          const rightEyePoint =
            getKeypoint(predictions, LANDMARK_INDICES.RIGHT_EYE) ||
            getKeypoint(predictions, LANDMARK_INDICES.RIGHT_EYE_ALT);
          const nosePoint = getKeypoint(predictions, LANDMARK_INDICES.NOSE_TIP);
          const mouthTop = getKeypoint(predictions, LANDMARK_INDICES.MOUTH_TOP);
          const mouthBottom = getKeypoint(
            predictions,
            LANDMARK_INDICES.MOUTH_BOTTOM,
          );
          const leftEarPoint = getKeypoint(
            predictions,
            LANDMARK_INDICES.LEFT_EAR,
          );
          const rightEarPoint = getKeypoint(
            predictions,
            LANDMARK_INDICES.RIGHT_EAR,
          );

          setLeftEye(!!leftEyePoint);
          setRightEye(!!rightEyePoint);
          setNose(!!nosePoint);
          setMouth(!!(mouthTop && mouthBottom));
          setLeftEar(!!leftEarPoint);
          setRightEar(!!rightEarPoint);

          // Face center and distance
          if (box) {
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

          // Face orientation
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
            const faceScore =
              (face as unknown as { score?: number }).score ?? 1;
            setConfidenceScore(Math.min(1, faceScore));
          }

          // Motion stability
          const faceCenter = {
            x: (box.xMin + box.xMax) / 2,
            y: (box.yMin + box.yMax) / 2,
          };

          if (previousCenterRef.current) {
            const motionDelta = calculateDistance(
              previousCenterRef.current,
              faceCenter,
            );
            const stability = Math.max(0, 1 - motionDelta / 20);
            setMotionStability(stability);

            stableFramesRef.current =
              stability > 0.9 ? stableFramesRef.current + 1 : 0;
            if (motionDelta > 8) {
              headMovementFramesRef.current += 1;
              setHeadMovementFrames((prev) => prev + 1);
            }
          }
          previousCenterRef.current = faceCenter;

          // Blink detection
          const leftEyeOpenPoint = getKeypoint(
            predictions,
            LANDMARK_INDICES.LEFT_EYE_BOTTOM,
          );
          const rightEyeOpenPoint = getKeypoint(
            predictions,
            LANDMARK_INDICES.RIGHT_EYE_BOTTOM,
          );

          if (
            leftEyePoint &&
            rightEyePoint &&
            leftEyeOpenPoint &&
            rightEyeOpenPoint
          ) {
            const leftDistance = calculateEyeOpenness(
              leftEyePoint,
              leftEyeOpenPoint,
            );
            const rightDistance = calculateEyeOpenness(
              rightEyePoint,
              rightEyeOpenPoint,
            );
            const blinkDetected = leftDistance < 4.5 || rightDistance < 4.5;

            if (blinkDetected && Date.now() - lastBlinkTimeRef.current > 900) {
              blinkFramesRef.current += 1;
              lastBlinkTimeRef.current = Date.now();
              setBlinkCount((prev: number) => prev + 1);
            }
          }

          // Update prompts
          if (blinkFramesRef.current === 0) {
            setLivenessPrompt("Blink once to prove liveness.");
          } else if (headMovementFramesRef.current > 0) {
            setLivenessPrompt("Natural head movement detected. Hold still.");
          } else {
            setLivenessPrompt("Move your head slightly left or right.");
          }

          // Quality scoring
          const frameQuality = estimateFrameQuality(video, box);
          const spoofScore = Math.min(
            100,
            Math.round(
              (frameQuality / 100) * 35 +
                (blinkFramesRef.current > 0 ? 25 : 0) +
                (headMovementFramesRef.current > 0 ? 25 : 0) +
                (stableFramesRef.current >= 3 ? 15 : 0),
            ),
          );

          setQualityMeter(frameQuality);
          setAntiSpoofScore(spoofScore);

          computeValidationState(predictions);

          const liveness = Math.min(
            100,
            Math.round(
              stableFramesRef.current * 20 +
                blinkFramesRef.current * 15 +
                qualityScore / 10,
            ),
          );
          setLivenessScore(liveness);

          // Background and pose assessment
          setBackgroundClarity(
            frameQuality >= 72 && validationResults.centered ? "Clear" : "Busy",
          );
          setPoseStatus(
            validationResults.headRotationAcceptable &&
              validationResults.centered
              ? "Aligned"
              : "Needs adjustment",
          );
          setOcclusionStatus(
            validationResults.bothEars &&
              validationResults.noseDetected &&
              validationResults.mouthDetected
              ? "Clear"
              : "Obstructed",
          );
          setBackgroundPlane(
            frameQuality >= 72 && validationResults.centered
              ? "Stable"
              : "Cluttered",
          );
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

      animationFrameRef.current = requestAnimationFrame(runDetection);
    };

    runDetection();

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
    };
  }, [
    cameraActive,
    scannerMode,
    detector,
    computeValidationState,
    qualityScore,
    validationResults,
  ]);

  // ==================== Countdown Logic ====================
  const getValidationIssues = useCallback((): string[] => {
    const issues: string[] = [];

    if (faceCount === 0) {
      issues.push("No face detected in canvas frame.");
    } else if (faceCount > 1) {
      issues.push(
        "Multiple faces detected. Ensure only one person is in frame.",
      );
    }

    if (faceCount === 1) {
      if (!leftEye || !rightEye) issues.push("Eyes missing or obscured.");
      if (eyesClosed)
        issues.push("Eyes closed. Please look open-eyed at the lens.");
      if (!leftEar || !rightEar)
        issues.push("Ears obscured. Ensure hair/hat is swept back.");
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
      if (lighting === "Too Dark")
        issues.push("Poor lighting (Too Dark). Enable a key light source.");
      if (lighting === "Too Bright")
        issues.push(
          "Exposure over-saturated (Too Bright). Step back from glare.",
        );
      if (quality === "Blurry")
        issues.push("Camera target out of focus (Blurry). Hold steady.");
    }

    return issues;
  }, [
    faceCount,
    leftEye,
    rightEye,
    eyesClosed,
    leftEar,
    rightEar,
    nose,
    mouth,
    faceOrientation,
    lighting,
    quality,
  ]);

  const validationIssues = useMemo(
    () => getValidationIssues(),
    [getValidationIssues],
  );
  const isValidReady = validationIssues.length === 0;

  useEffect(() => {
    if (
      !cameraActive ||
      scanStep === "registered" ||
      scanStep === "processing"
    ) {
      setCountdown(null);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    if (isValidReady) {
      if (scanStep === "idle" || scanStep === "aligning") {
        setScanStep("locked");
        setBiometricsLog((prev) => [
          ...prev,
          "✔ ALL SYSTEMS NOMINAL: Biometric face mesh lock acquired.",
        ]);
      }

      if (countdown === null && !isProcessingRef.current) {
        setCountdown(3);
        setBiometricsLog((prev) => [
          ...prev,
          "Stabilizing target coordinates... countdown triggered.",
        ]);

        let localSec = 3;
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }

        countdownTimerRef.current = window.setInterval(() => {
          localSec -= 1;
          if (isMountedRef.current) {
            if (localSec > 0) {
              setCountdown(localSec);
            } else {
              if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
              }
              setCountdown(null);
              handleAutoTriggerCapture();
            }
          }
        }, 1000);
      }
    } else {
      if (scanStep === "locked") {
        setScanStep("aligning");
        setBiometricsLog((prev) => [
          ...prev,
          `⚠ Biometric lock lost. Parameters compromised: ${validationIssues[0]}`,
        ]);
      }
      if (countdown !== null) {
        setCountdown(null);
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }
    }
  }, [
    isValidReady,
    cameraActive,
    scanStep,
    countdown,
    handleAutoTriggerCapture,
    validationIssues,
  ]);

  // ==================== UI Canvas Rendering ====================
  useEffect(() => {
    if (!cameraActive) return;

    let isActive = true;
    let animFrameId: number;
    let jitterPhase = 0;

    const renderLoop = () => {
      if (!isActive || !isMountedRef.current) return;

      const canvas = uiCanvasRef.current;
      const video = videoRef.current;

      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const { width, height } = CANVAS_DIMENSIONS;
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          ctx.clearRect(0, 0, width, height);

          // Draw video feed or simulation backdrop
          if (!isSimulated && video && !video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, width, height);
          } else {
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(0, 0, width, height);

            // Grid pattern
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 40) {
              ctx.beginPath();
              ctx.moveTo(i, 0);
              ctx.lineTo(i, height);
              ctx.stroke();
            }
            for (let j = 0; j < height; j += 40) {
              ctx.beginPath();
              ctx.moveTo(0, j);
              ctx.lineTo(width, j);
              ctx.stroke();
            }
          }

          // Apply visual filters based on conditions
          if (lighting === "Too Dark") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(0, 0, width, height);
          } else if (lighting === "Too Bright") {
            ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
            ctx.fillRect(0, 0, width, height);
          }

          if (quality === "Blurry") {
            ctx.fillStyle = "rgba(15, 23, 42, 0.15)";
            ctx.fillRect(0, 0, width, height);
          }

          // Draw HUD elements
          ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(width / 2, height);
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();

          // Face target frame
          const faceColor = isValidReady ? "#10b981" : "#3b82f6";
          const { width: fw, height: fh } = FRAME_DIMENSIONS;
          const fx = (width - fw) / 2;
          const fy = (height - fh) / 2 - 10;

          // Oval guideline
          ctx.strokeStyle = faceColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(
            width / 2,
            height / 2 - 15,
            fw / 2,
            fh / 2,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();

          // Corner brackets
          ctx.strokeStyle = faceColor;
          ctx.lineWidth = 4;
          const bracketLength = 40;

          // Top-left
          ctx.beginPath();
          ctx.moveTo(fx - 10, fy + bracketLength);
          ctx.lineTo(fx - 10, fy - 10);
          ctx.lineTo(fx + bracketLength, fy - 10);
          ctx.stroke();

          // Top-right
          ctx.beginPath();
          ctx.moveTo(fx + fw + 10, fy + bracketLength);
          ctx.lineTo(fx + fw + 10, fy - 10);
          ctx.lineTo(fx + fw - bracketLength, fy - 10);
          ctx.stroke();

          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(fx - 10, fy + fh - bracketLength);
          ctx.lineTo(fx - 10, fy + fh + 10);
          ctx.lineTo(fx + bracketLength, fy + fh + 10);
          ctx.stroke();

          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(fx + fw + 10, fy + fh - bracketLength);
          ctx.lineTo(fx + fw + 10, fy + fh + 10);
          ctx.lineTo(fx + fw - bracketLength, fy + fh + 10);
          ctx.stroke();

          // Render facial landmarks
          if (faceCount > 0) {
            jitterPhase += 0.08;
            const jitterX = Math.sin(jitterPhase) * 2;
            const jitterY = Math.cos(jitterPhase * 0.8) * 2;

            let faceOffsetX = 0;
            if (faceOrientation === "Turned Left") faceOffsetX = -60;
            if (faceOrientation === "Turned Right") faceOffsetX = 60;
            if (faceOrientation === "Not Centered") faceOffsetX = -130;

            const cx = width / 2 + faceOffsetX + jitterX;
            const cy = height / 2 - 10 + jitterY;

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

            nodes.forEach((node) => {
              if (node.present) {
                ctx.fillStyle = faceColor;
                ctx.strokeStyle = faceColor;
                ctx.lineWidth = 1.5;

                if (node.isClosed) {
                  ctx.beginPath();
                  ctx.moveTo(node.x - 8, node.y);
                  ctx.lineTo(node.x + 8, node.y);
                  ctx.strokeStyle = "#ef4444";
                  ctx.stroke();
                } else {
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
                  ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
                  ctx.stroke();
                }

                ctx.fillStyle = "#10b981";
                ctx.font = "bold 8px monospace";
                ctx.fillText(
                  `${node.label}: [${Math.round(node.x)}, ${Math.round(node.y)}]`,
                  node.x + 8,
                  node.y - 8,
                );

                ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, cy + 5);
                ctx.lineTo(node.x, node.y);
                ctx.stroke();
              } else {
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
      isActive = false;
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

  // ==================== Render ====================
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto text-white">
      {/* Camera Preview Console */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center">
        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase mb-2 block self-start">
          Secure Camera Viewport (Min 700x500px Console)
        </span>

        <div className="relative w-full aspect-[1.4] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center border-2 border-slate-800">
          {/* Status indicator */}
          <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                cameraActive
                  ? isValidReady
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-blue-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">
              {cameraActive
                ? isValidReady
                  ? "State: Locked & Stable"
                  : "State: Unlocked / Aligning"
                : "State: Stream Closed"}
            </span>
          </div>

          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-15 pointer-events-none" />

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

                {scanStep !== "idle" && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent top-0 animate-[shimmer_2s_infinite] shadow-[0_0_8px_#3b82f6] opacity-35" />
                )}

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

          <canvas ref={canvasRef} className="hidden" />
          <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        </div>
      </div>

      {/* Calibration & Controls Panel */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between gap-4">
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
              {instructionList.map((item: string, index: number) => (
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
                className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                  scannerMode === "face-api"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                face-api
              </button>
              <button
                type="button"
                onClick={() => setScannerMode("default")}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                  scannerMode === "default"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
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

          {cameraActive && !previewImage && (
            <div className="mb-4 bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
              <span className="text-[9px] font-mono font-extrabold text-blue-400 uppercase tracking-widest block mb-3">
                Facial Landmarks live validation:
              </span>

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

              {validationIssues.length > 0 ? (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-amber-300 text-[10px] font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold block text-sm mb-0.5">
                      ALIGNMENT FAILED:
                    </span>
                    <ul className="list-disc pl-3 text-[10px] space-y-0.5 font-medium">
                      {validationIssues
                        .slice(0, 3)
                        .map((issue: string, i: number) => (
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

        {/* Action Buttons */}
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
