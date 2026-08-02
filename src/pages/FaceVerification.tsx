import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  BatteryWarning,
} from "lucide-react";
import type * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { loadTensorflowFaceModules } from "../services/tensorflow.ts";

// Components
import CameraPermissionDialog from "../components/face-verification/CameraPermissionDialog.tsx";
import CameraView from "../components/face-verification/CameraView.tsx";
import CaptureOverlay from "../components/face-verification/CaptureOverlay.tsx";
import DetectionStatus, {
  DetectionChecks,
} from "../components/face-verification/DetectionStatus.tsx";
import FaceMatchResult from "../components/face-verification/FaceMatchResult.tsx";
import InstructionPanel from "../components/face-verification/InstructionPanel.tsx";
import LoadingScreen from "../components/face-verification/LoadingScreen.tsx";
import VerificationFailedDialog from "../components/face-verification/VerificationFailedDialog.tsx";
import VerificationProgress, {
  ProgressStep,
} from "../components/face-verification/VerificationProgress.tsx";

// ============================================
// Types & Constants
// ============================================

type FacePoint = { x: number; y: number };

type Stage =
  | "idle"
  | "loading"
  | "center"
  | "blink"
  | "turnLeft"
  | "turnRight"
  | "returnCenter"
  | "capturing"
  | "matching"
  | "success"
  | "failed";

interface FaceVerificationProps {
  token: string;
  electionId: string;
  candidateLabel: string;
  onBack: () => void;
  onVerified: (result: VerificationResult) => void;
}

interface VerificationResult {
  verificationId: string;
  similarityScore: number;
  threshold: number;
  message: string;
}

interface QualityMetrics {
  brightness: number;
  sharpness: number;
  qualityScore: number;
  livenessScore: number;
  confidenceScore: number;
}

interface NetworkStatus {
  online: boolean;
  type: string;
  rtt: number;
}

interface BatteryStatus {
  charging: boolean;
  level: number;
}

const EMPTY_CHECKS: DetectionChecks = {
  faceDetected: false,
  leftEye: false,
  rightEye: false,
  nose: false,
  mouth: false,
  leftEar: false,
  rightEar: false,
  faceCentered: false,
  blinkDetected: false,
  headTurnLeft: false,
  headTurnRight: false,
  returnedToCenter: false,
  imageQualityGood: false,
};

const INITIAL_QUALITY: QualityMetrics = {
  brightness: 0,
  sharpness: 0,
  qualityScore: 0,
  livenessScore: 0,
  confidenceScore: 0,
};

const DETECTION_CONFIG = {
  MAX_FACES: 2,
  MIN_FACE_WIDTH_RATIO: 0.24,
  MAX_FACE_WIDTH_RATIO: 0.52,
  CENTER_TOLERANCE_X: 0.16,
  CENTER_TOLERANCE_Y: 0.18,
  STABLE_FRAMES_REQUIRED: 10,
  MIN_BRIGHTNESS: 35,
  MAX_BRIGHTNESS: 82,
  MIN_SHARPNESS: 28,
  BLINK_CLOSED_RATIO: 0.12,
  BLINK_OPEN_RATIO: 0.16,
  HEAD_TURN_THRESHOLD: 0.14,
  RETURN_CENTER_THRESHOLD: 0.08,
  LIVENESS_PASS_SCORE: 80,
  QUALITY_PASS_SCORE: 72,
  CAPTURE_DELAY: 350,
  VERIFICATION_TIMEOUT: 30000,
};

// ============================================
// Utility Functions
// ============================================

const getKeypoint = (
  face: faceLandmarksDetection.Face | undefined,
  index: number,
): FacePoint | null => {
  const point = face?.keypoints?.[index];
  return point ? { x: point.x, y: point.y } : null;
};

const distance = (a: FacePoint, b: FacePoint): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

const clamp = (value: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, value));

const formatScore = (score: number): string => `${Math.round(score)}%`;

const estimateFrameQuality = (
  video: HTMLVideoElement,
  box: any,
): { brightness: number; sharpness: number } => {
  const canvas = document.createElement("canvas");
  canvas.width = 72;
  canvas.height = 72;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { brightness: 0, sharpness: 0 };

  const sx = Math.max(0, box.xMin);
  const sy = Math.max(0, box.yMin);
  const sw = Math.max(1, Math.min(video.videoWidth - sx, box.width));
  const sh = Math.max(1, Math.min(video.videoHeight - sy, box.height));
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let brightnessTotal = 0;
  let edgeTotal = 0;
  let previousGray = 0;

  for (let i = 0; i < image.length; i += 4) {
    const gray = (image[i] + image[i + 1] + image[i + 2]) / 3;
    brightnessTotal += gray;
    edgeTotal += Math.abs(gray - previousGray);
    previousGray = gray;
  }

  const pixels = image.length / 4;
  const brightness = Math.round((brightnessTotal / pixels / 255) * 100);
  const sharpness = Math.round(clamp((edgeTotal / pixels / 42) * 100));
  return { brightness, sharpness };
};

// ============================================
// Main Component
// ============================================

export default function FaceVerification({
  token,
  electionId,
  candidateLabel,
  onBack,
  onVerified,
}: FaceVerificationProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef =
    useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const frameRef = useRef<number | null>(null);
  const verificationIdRef = useRef<string>("");
  const stageRef = useRef<Stage>("idle");
  const blinkClosedRef = useRef(false);
  const stableFramesRef = useRef(0);
  const lastCenterRef = useRef<FacePoint | null>(null);
  const captureStartedRef = useRef(false);
  const firstTurnDirectionRef = useRef<"negative" | "positive" | null>(null);
  const latestPayloadRef = useRef<any>(null);
  const checksRef = useRef<DetectionChecks>(EMPTY_CHECKS);
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const networkRetryRef = useRef<number>(0);

  // State
  const [stage, setStage] = useState<Stage>("idle");
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [checks, setChecks] = useState<DetectionChecks>(EMPTY_CHECKS);
  const [instruction, setInstruction] = useState(
    "Start verification when you are ready.",
  );
  const [quality, setQuality] = useState<QualityMetrics>(INITIAL_QUALITY);
  const [error, setError] = useState("");
  const [matchResult, setMatchResult] = useState<{
    status: "idle" | "success" | "failed" | "processing";
    score?: number;
    threshold?: number;
    message?: string;
  }>({ status: "idle" });
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    type: "unknown",
    rtt: 0,
  });
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus>({
    charging: true,
    level: 100,
  });
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // ============================================
  // Network & Battery Monitoring
  // ============================================

  useEffect(() => {
    const handleOnline = () =>
      setNetworkStatus((prev) => ({ ...prev, online: true }));
    const handleOffline = () =>
      setNetworkStatus((prev) => ({ ...prev, online: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Monitor network type
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      const updateNetworkType = () => {
        setNetworkStatus((prev) => ({
          ...prev,
          type: connection?.effectiveType || "unknown",
          rtt: connection?.rtt || 0,
        }));
      };
      connection?.addEventListener("change", updateNetworkType);
      updateNetworkType();
    }

    // Monitor battery
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryStatus({
            charging: battery.charging,
            level: Math.round(battery.level * 100),
          });
        };
        battery.addEventListener("chargingchange", updateBattery);
        battery.addEventListener("levelchange", updateBattery);
        updateBattery();
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ============================================
  // Camera Management
  // ============================================

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const cleanupDetector = useCallback(async () => {
    if (detectorRef.current) {
      try {
        await detectorRef.current.dispose();
      } catch (err) {
        console.warn("Error disposing detector:", err);
      }
      detectorRef.current = null;
    }
    setIsModelLoaded(false);
  }, []);

  useEffect(
    () => () => {
      cleanupDetector();
    },
    [cleanupDetector],
  );

  // ============================================
  // Stage Management
  // ============================================

  const updateStage = useCallback(
    (nextStage: Stage, nextInstruction: string) => {
      if (stageRef.current !== nextStage) {
        stageRef.current = nextStage;
        setStage(nextStage);
      }
      setInstruction(nextInstruction);
    },
    [],
  );

  const commitChecks = useCallback((nextChecks: DetectionChecks) => {
    checksRef.current = nextChecks;
    setChecks(nextChecks);
  }, []);

  // ============================================
  // Submission Logic
  // ============================================

  const submitMatch = useCallback(
    async (payload: any) => {
      updateStage("matching", "Comparing your live face on the server.");
      setMatchResult({
        status: "processing",
        message: "Server verification is checking liveness and face match.",
      });
      stopCamera();

      // Set timeout for verification
      verificationTimeoutRef.current = setTimeout(() => {
        updateStage("failed", "Verification timed out. Please try again.");
        setError(
          "The verification request timed out. Please check your connection and try again.",
        );
        setMatchResult({
          status: "failed",
          message: "Verification timed out.",
        });
      }, DETECTION_CONFIG.VERIFICATION_TIMEOUT);

      try {
        const verificationBody = {
          verificationId: verificationIdRef.current,
          electionId,
          livenessChecks: payload.livenessChecks,
          quality: payload.quality,
        };

        // Step 1: Verify liveness
        const verifyRes = await fetch("/api/face/verify", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(verificationBody),
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.passed) {
          throw new Error(
            verifyData.error ||
              verifyData.message ||
              "The liveness check could not be completed.",
          );
        }

        // Step 2: Match face
        const matchRes = await fetch("/api/face/match", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...verificationBody,
            capturedImage: payload.capturedImage,
            faceTemplate: payload.faceTemplate,
          }),
        });
        const matchData = await matchRes.json();

        if (!matchRes.ok || matchData.verificationResult !== "Passed") {
          throw new Error(
            matchData.message ||
              matchData.error ||
              "The live face did not match the registered voter template.",
          );
        }

        // Clear timeout on success
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
        }

        updateStage(
          "success",
          "Verification successful. You can cast your vote.",
        );
        setMatchResult({
          status: "success",
          score: matchData.similarityScore,
          threshold: matchData.threshold,
          message: matchData.message,
        });

        onVerified({
          verificationId: matchData.verificationId,
          similarityScore: matchData.similarityScore,
          threshold: matchData.threshold,
          message: matchData.message,
        });
      } catch (err: any) {
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
        }

        stopCamera();
        updateStage("failed", "Verification failed. Please retry.");
        setError(err.message || "Face verification failed.");
        setMatchResult({ status: "failed", message: err.message });

        // Retry logic for network errors
        if (
          err.message?.includes("network") ||
          err.message?.includes("fetch")
        ) {
          networkRetryRef.current += 1;
          if (networkRetryRef.current < 3) {
            setTimeout(() => {
              retryVerification();
            }, 2000 * networkRetryRef.current);
          }
        }
      }
    },
    [electionId, onVerified, stopCamera, token, updateStage],
  );

  const captureAndSubmit = useCallback(async () => {
    if (
      captureStartedRef.current ||
      !videoRef.current ||
      !latestPayloadRef.current
    ) {
      return;
    }

    captureStartedRef.current = true;
    updateStage(
      "capturing",
      "Hold still. Capturing the best frame automatically.",
    );

    const video = videoRef.current;
    const canvas = captureCanvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Camera frame could not be captured.");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const capturedImage = canvas.toDataURL("image/jpeg", 0.94);

    try {
      await submitMatch({
        ...latestPayloadRef.current,
        capturedImage,
      });
    } catch (err: any) {
      stopCamera();
      updateStage("failed", "Verification failed. Please retry.");
      setError(err.message || "Face verification failed.");
      setMatchResult({ status: "failed", message: err.message });
    }
  }, [stopCamera, submitMatch, updateStage]);

  // ============================================
  // Face Detection Loop
  // ============================================

  const runDetection = useCallback(async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;

    if (
      !detector ||
      !video ||
      stageRef.current === "success" ||
      stageRef.current === "failed" ||
      stageRef.current === "idle"
    ) {
      return;
    }

    if (video.readyState < 2) {
      frameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    try {
      const faces = await detector.estimateFaces(video, {
        flipHorizontal: true,
      });

      // No face or multiple faces detected
      if (faces.length !== 1) {
        stableFramesRef.current = 0;
        lastCenterRef.current = null;
        commitChecks({
          ...EMPTY_CHECKS,
          blinkDetected: checksRef.current.blinkDetected,
          headTurnLeft: checksRef.current.headTurnLeft,
          headTurnRight: checksRef.current.headTurnRight,
          returnedToCenter: checksRef.current.returnedToCenter,
        });
        setQuality(INITIAL_QUALITY);
        setInstruction(
          faces.length > 1
            ? "Only one person should be visible in the camera."
            : "Position your face inside the guide frame.",
        );
        frameRef.current = requestAnimationFrame(runDetection);
        return;
      }

      const face = faces[0];
      const box = face.box;

      // Extract keypoints
      const keypoints = {
        leftEyeOuter: getKeypoint(face, 33),
        leftEyeInner: getKeypoint(face, 133),
        rightEyeOuter: getKeypoint(face, 263),
        rightEyeInner: getKeypoint(face, 362),
        leftEyeTop: getKeypoint(face, 159),
        leftEyeBottom: getKeypoint(face, 145),
        rightEyeTop: getKeypoint(face, 386),
        rightEyeBottom: getKeypoint(face, 374),
        nose: getKeypoint(face, 1),
        mouthTop: getKeypoint(face, 13),
        mouthBottom: getKeypoint(face, 14),
        leftEar: getKeypoint(face, 234),
        rightEar: getKeypoint(face, 454),
      };

      // Check eyes
      const bothEyes = !!(
        keypoints.leftEyeOuter &&
        keypoints.leftEyeInner &&
        keypoints.rightEyeOuter &&
        keypoints.rightEyeInner &&
        keypoints.leftEyeTop &&
        keypoints.leftEyeBottom &&
        keypoints.rightEyeTop &&
        keypoints.rightEyeBottom
      );

      const eyeDistance =
        keypoints.leftEyeOuter && keypoints.rightEyeOuter
          ? distance(keypoints.leftEyeOuter, keypoints.rightEyeOuter)
          : 1;

      const leftEarRatio = bothEyes
        ? distance(keypoints.leftEyeTop!, keypoints.leftEyeBottom!) /
          distance(keypoints.leftEyeOuter!, keypoints.leftEyeInner!)
        : 1;

      const rightEarRatio = bothEyes
        ? distance(keypoints.rightEyeTop!, keypoints.rightEyeBottom!) /
          distance(keypoints.rightEyeOuter!, keypoints.rightEyeInner!)
        : 1;

      const avgEyeRatio = (leftEarRatio + rightEarRatio) / 2;
      const eyesClosed =
        bothEyes && avgEyeRatio < DETECTION_CONFIG.BLINK_CLOSED_RATIO;
      const eyesOpen =
        bothEyes && avgEyeRatio > DETECTION_CONFIG.BLINK_OPEN_RATIO;

      // Face position
      const center = {
        x: box.xMin + box.width / 2,
        y: box.yMin + box.height / 2,
      };
      const frameWidth = video.videoWidth || 1;
      const frameHeight = video.videoHeight || 1;
      const faceCentered =
        Math.abs(center.x - frameWidth / 2) <
          frameWidth * DETECTION_CONFIG.CENTER_TOLERANCE_X &&
        Math.abs(center.y - frameHeight / 2) <
          frameHeight * DETECTION_CONFIG.CENTER_TOLERANCE_Y;

      const faceWidthRatio = box.width / frameWidth;
      const distanceGood =
        faceWidthRatio >= DETECTION_CONFIG.MIN_FACE_WIDTH_RATIO &&
        faceWidthRatio <= DETECTION_CONFIG.MAX_FACE_WIDTH_RATIO;

      // Stability check
      if (lastCenterRef.current) {
        stableFramesRef.current =
          distance(lastCenterRef.current, center) < 9
            ? stableFramesRef.current + 1
            : 0;
      }
      lastCenterRef.current = center;
      const stable =
        stableFramesRef.current >= DETECTION_CONFIG.STABLE_FRAMES_REQUIRED;

      // Head pose (yaw)
      const yaw =
        keypoints.nose && keypoints.leftEyeOuter && keypoints.rightEyeOuter
          ? (keypoints.nose.x -
              (keypoints.leftEyeOuter.x + keypoints.rightEyeOuter.x) / 2) /
            eyeDistance
          : 0;

      const returnedToCenter =
        Math.abs(yaw) < DETECTION_CONFIG.RETURN_CENTER_THRESHOLD &&
        faceCentered;

      // Quality
      const { brightness, sharpness } = estimateFrameQuality(video, box);
      const lightingGood =
        brightness >= DETECTION_CONFIG.MIN_BRIGHTNESS &&
        brightness <= DETECTION_CONFIG.MAX_BRIGHTNESS;

      const qualityScore = Math.round(
        clamp(
          (faceCentered ? 18 : 0) +
            (distanceGood ? 14 : 0) +
            (lightingGood ? 22 : 0) +
            (sharpness >= DETECTION_CONFIG.MIN_SHARPNESS ? 20 : 0) +
            (bothEyes ? 12 : 0) +
            (keypoints.nose ? 7 : 0) +
            (keypoints.mouthTop && keypoints.mouthBottom ? 7 : 0),
        ),
      );

      // Update checks
      const nextChecks: DetectionChecks = {
        faceDetected: true,
        leftEye: bothEyes,
        rightEye: bothEyes,
        nose: !!keypoints.nose,
        mouth: !!keypoints.mouthTop && !!keypoints.mouthBottom,
        leftEar: !!keypoints.leftEar,
        rightEar: !!keypoints.rightEar,
        faceCentered,
        blinkDetected: checksRef.current.blinkDetected,
        headTurnLeft: checksRef.current.headTurnLeft,
        headTurnRight: checksRef.current.headTurnRight,
        returnedToCenter: checksRef.current.returnedToCenter,
        imageQualityGood:
          qualityScore >= DETECTION_CONFIG.QUALITY_PASS_SCORE &&
          sharpness >= DETECTION_CONFIG.MIN_SHARPNESS,
      };

      // Stage transitions
      const currentStage = stageRef.current;

      if (currentStage === "center") {
        if (!faceCentered) {
          setInstruction("Center your face inside the guide frame.");
        } else if (!distanceGood) {
          setInstruction(
            faceWidthRatio < DETECTION_CONFIG.MIN_FACE_WIDTH_RATIO
              ? "Move closer to the camera."
              : "Move slightly farther from the camera.",
          );
        } else if (!lightingGood) {
          setInstruction("Adjust lighting so your face is clear.");
        } else if (stable) {
          updateStage("blink", "Please blink once.");
        }
      }

      if (currentStage === "blink") {
        if (eyesClosed) blinkClosedRef.current = true;
        if (blinkClosedRef.current && eyesOpen) {
          nextChecks.blinkDetected = true;
          updateStage("turnLeft", "Please slowly turn your head left.");
        } else {
          setInstruction("Please blink once.");
        }
      }

      if (currentStage === "turnLeft") {
        if (Math.abs(yaw) > DETECTION_CONFIG.HEAD_TURN_THRESHOLD) {
          nextChecks.headTurnLeft = true;
          firstTurnDirectionRef.current = yaw < 0 ? "negative" : "positive";
          stableFramesRef.current = 0;
          updateStage("turnRight", "Please slowly turn your head right.");
        } else {
          setInstruction("Please slowly turn your head left.");
        }
      }

      if (currentStage === "turnRight") {
        const turnedOpposite =
          firstTurnDirectionRef.current === "negative"
            ? yaw > DETECTION_CONFIG.HEAD_TURN_THRESHOLD
            : yaw < -DETECTION_CONFIG.HEAD_TURN_THRESHOLD;
        if (turnedOpposite) {
          nextChecks.headTurnRight = true;
          stableFramesRef.current = 0;
          updateStage("returnCenter", "Please look straight at the camera.");
        } else {
          setInstruction("Please slowly turn your head right.");
        }
      }

      if (currentStage === "returnCenter") {
        nextChecks.returnedToCenter = returnedToCenter;
        setInstruction("Please look straight at the camera.");
        if (
          returnedToCenter &&
          stable &&
          nextChecks.imageQualityGood &&
          lightingGood &&
          distanceGood
        ) {
          updateStage("capturing", "Hold still. Capturing automatically.");
        }
      }

      // Calculate scores
      const livenessScore = Math.round(
        clamp(
          (nextChecks.blinkDetected ? 25 : 0) +
            (nextChecks.headTurnLeft ? 20 : 0) +
            (nextChecks.headTurnRight ? 20 : 0) +
            (nextChecks.returnedToCenter ? 15 : 0) +
            (stable ? 10 : 0) +
            (nextChecks.imageQualityGood ? 10 : 0),
        ),
      );

      const faceScore = (face as unknown as { score?: number }).score ?? 0.96;

      const qualityPayload: QualityMetrics = {
        brightness,
        sharpness,
        qualityScore,
        livenessScore,
        confidenceScore: Math.min(1, faceScore),
      };

      // Build face template
      const normalizedPoint = (point: FacePoint | null) => [
        point ? Number(((point.x - box.xMin) / box.width).toFixed(4)) : 0,
        point ? Number(((point.y - box.yMin) / box.height).toFixed(4)) : 0,
      ];

      const faceTemplate = [
        qualityScore / 100,
        livenessScore / 100,
        qualityPayload.confidenceScore,
        faceCentered ? 1 : 0,
        eyesOpen ? 1 : 0,
        keypoints.leftEar && keypoints.rightEar ? 1 : 0,
        keypoints.nose ? 1 : 0,
        keypoints.mouthTop && keypoints.mouthBottom ? 1 : 0,
        Math.abs(yaw) < 0.12 ? 1 : 0,
        Number(faceWidthRatio.toFixed(4)),
        Number((box.height / frameHeight).toFixed(4)),
        ...normalizedPoint(keypoints.leftEyeOuter),
        ...normalizedPoint(keypoints.rightEyeOuter),
        ...normalizedPoint(keypoints.nose),
        ...normalizedPoint(keypoints.mouthTop),
        ...normalizedPoint(keypoints.leftEar),
        ...normalizedPoint(keypoints.rightEar),
      ];

      // Store payload for capture
      latestPayloadRef.current = {
        livenessChecks: {
          ...nextChecks,
          lightingGood,
          distanceGood,
          stable,
        },
        quality: qualityPayload,
        faceTemplate,
      };

      commitChecks(nextChecks);
      setQuality(qualityPayload);

      // Auto-capture when ready
      if (
        currentStage === "capturing" &&
        livenessScore >= DETECTION_CONFIG.LIVENESS_PASS_SCORE &&
        !captureStartedRef.current
      ) {
        window.setTimeout(captureAndSubmit, DETECTION_CONFIG.CAPTURE_DELAY);
      }
    } catch (err) {
      console.warn("Face detection error:", err);
    }

    frameRef.current = requestAnimationFrame(runDetection);
  }, [captureAndSubmit, commitChecks, updateStage]);

  // ============================================
  // Start Verification
  // ============================================

  const startVerification = useCallback(async () => {
    setError("");
    setMatchResult({ status: "idle" });
    checksRef.current = EMPTY_CHECKS;
    setChecks(EMPTY_CHECKS);
    setQuality(INITIAL_QUALITY);
    captureStartedRef.current = false;
    firstTurnDirectionRef.current = null;
    blinkClosedRef.current = false;
    stableFramesRef.current = 0;
    lastCenterRef.current = null;
    networkRetryRef.current = 0;
    setVerificationAttempt((prev) => prev + 1);

    updateStage("loading", "Preparing secure verification session...");
    setLoadingLabel("Initializing secure session...");

    try {
      // Start verification session on server
      const startRes = await fetch("/api/face/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ electionId }),
      });

      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || "Could not start verification.");
      }
      verificationIdRef.current = startData.verificationId;

      // Load TensorFlow model
      setLoadingLabel("Loading face detection model...");
      const { tf, faceLandmarksDetection } = await loadTensorflowFaceModules();
      await tf.setBackend("webgl");
      await tf.ready();

      detectorRef.current = (await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          maxFaces: DETECTION_CONFIG.MAX_FACES,
          refineLandmarks: true,
        },
      )) as any;
      setIsModelLoaded(true);

      // Open camera
      setLoadingLabel("Accessing camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setLoadingLabel("");
      updateStage("center", "Please look straight at the camera.");
      frameRef.current = requestAnimationFrame(runDetection);
    } catch (err: any) {
      stopCamera();
      updateStage("failed", "Verification setup failed.");
      setLoadingLabel("");

      const errorMessage =
        err?.name === "NotAllowedError"
          ? "Camera access was blocked. Please allow camera permission in your browser settings and try again."
          : err?.name === "NotFoundError"
            ? "No camera detected. Please connect a camera and try again."
            : err?.name === "NotReadableError"
              ? "Camera is already in use by another application. Please close other apps using the camera."
              : err.message || "Failed to start verification.";

      setError(errorMessage);
    }
  }, [token, electionId, updateStage, stopCamera, runDetection]);

  // ============================================
  // Retry Verification
  // ============================================

  const retryVerification = useCallback(() => {
    stopCamera();
    updateStage("idle", "Start verification when you are ready.");
    setError("");
    setMatchResult({ status: "idle" });
    checksRef.current = EMPTY_CHECKS;
    setChecks(EMPTY_CHECKS);
    setQuality(INITIAL_QUALITY);
    captureStartedRef.current = false;
  }, [stopCamera, updateStage]);

  // ============================================
  // Computed Values
  // ============================================

  const progressPercent = useMemo(() => {
    const values: Record<Stage, number> = {
      idle: 0,
      loading: 5,
      center: 20,
      blink: 40,
      turnLeft: 55,
      turnRight: 70,
      returnCenter: 80,
      capturing: 90,
      matching: 95,
      success: 100,
      failed: Math.max(12, quality.qualityScore),
    };
    return Math.round(values[stage]);
  }, [stage, quality.qualityScore]);

  const progressSteps: ProgressStep[] = useMemo(
    () => [
      {
        label: "Initialize",
        status: stage !== "idle" ? "complete" : "waiting",
      },
      {
        label: "Face Detection",
        status: checks.faceDetected
          ? "complete"
          : cameraActive
            ? "processing"
            : "waiting",
      },
      {
        label: "Liveness Check",
        status:
          checks.blinkDetected && checks.headTurnLeft && checks.headTurnRight
            ? "complete"
            : cameraActive
              ? "processing"
              : "waiting",
      },
      {
        label: "Capture",
        status:
          stage === "matching" || stage === "success"
            ? "complete"
            : stage === "capturing"
              ? "processing"
              : "waiting",
      },
      {
        label: "Verification",
        status:
          stage === "success"
            ? "complete"
            : stage === "matching"
              ? "processing"
              : stage === "failed"
                ? "failed"
                : "waiting",
      },
    ],
    [cameraActive, checks, stage],
  );

  const overlayState =
    stage === "capturing"
      ? "capturing"
      : stage === "matching"
        ? "matching"
        : stage === "success"
          ? "success"
          : "idle";

  const qualityLabel =
    quality.qualityScore >= DETECTION_CONFIG.QUALITY_PASS_SCORE
      ? `${quality.qualityScore}%`
      : "Low";
  const brightnessLabel =
    quality.brightness === 0
      ? "---"
      : quality.brightness < DETECTION_CONFIG.MIN_BRIGHTNESS
        ? "Dark"
        : quality.brightness > DETECTION_CONFIG.MAX_BRIGHTNESS
          ? "Bright"
          : "Good";
  const distanceLabel = checks.faceCentered
    ? "Good"
    : checks.faceDetected
      ? "Adjust"
      : "---";

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
            <ShieldCheck className="h-4 w-4" />
            Advanced Live Face Verification
          </div>
          <h3 className="text-base font-black text-slate-900">
            Verify before casting your ballot
          </h3>
          <p className="text-xs text-slate-500">
            Selected nominee:{" "}
            <span className="font-bold">{candidateLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Network Status */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            {networkStatus.online ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-red-500" />
            )}
          </div>

          {/* Battery Status */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            {batteryStatus.charging ? (
              <BatteryCharging className="h-3.5 w-3.5 text-emerald-500" />
            ) : batteryStatus.level < 20 ? (
              <BatteryWarning className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Battery className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span className="text-[10px]">{batteryStatus.level}%</span>
          </div>

          {/* Attempt counter */}
          {verificationAttempt > 0 && (
            <span className="text-[10px] text-slate-400">
              Attempt {verificationAttempt}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onBack();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      {/* Warning for low battery */}
      {batteryStatus.level < 20 && !batteryStatus.charging && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            Your battery is low ({batteryStatus.level}%). Please connect your
            charger to avoid interruption during verification.
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        {/* Left Column - Camera */}
        <div className="space-y-4">
          <CameraView
            videoRef={videoRef}
            cameraActive={cameraActive}
            centered={checks.faceCentered}
            distanceGood={
              latestPayloadRef.current?.livenessChecks?.distanceGood || false
            }
            qualityLabel={qualityLabel}
            brightnessLabel={brightnessLabel}
            distanceLabel={distanceLabel}
          >
            <CaptureOverlay state={overlayState} />
          </CameraView>

          <InstructionPanel instruction={instruction} />

          <FaceMatchResult
            status={matchResult.status}
            score={matchResult.score}
            threshold={matchResult.threshold}
            message={matchResult.message}
          />

          {stage === "failed" && error && (
            <VerificationFailedDialog
              message={error}
              onRetry={retryVerification}
            />
          )}
        </div>

        {/* Right Column - Status */}
        <aside className="space-y-4">
          {loadingLabel ? (
            <LoadingScreen label={loadingLabel} />
          ) : stage === "idle" || (stage === "failed" && !cameraActive) ? (
            <CameraPermissionDialog
              error={stage === "failed" ? error : undefined}
              onStart={startVerification}
            />
          ) : null}

          <DetectionStatus checks={checks} />
          <VerificationProgress
            percent={progressPercent}
            steps={progressSteps}
          />

          {/* Quality Metrics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Camera Quality Metrics
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-900">
                  {formatScore(quality.qualityScore)}
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  Quality
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-900">
                  {formatScore(quality.brightness)}
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  Brightness
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-900">
                  {formatScore(quality.sharpness)}
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  Sharpness
                </div>
              </div>
            </div>

            {/* Liveness Score */}
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">
                  Liveness Score
                </span>
                <span
                  className={`text-sm font-black ${
                    quality.livenessScore >=
                    DETECTION_CONFIG.LIVENESS_PASS_SCORE
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {formatScore(quality.livenessScore)}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    quality.livenessScore >=
                    DETECTION_CONFIG.LIVENESS_PASS_SCORE
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${quality.livenessScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Verification Tips */}
          {stage !== "idle" && stage !== "success" && stage !== "failed" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                Tips for Success
              </div>
              <ul className="space-y-1.5 text-xs text-blue-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  Ensure even lighting on your face
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  Remove glasses if there is glare
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  Keep a neutral expression
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  Stay still during capture
                </li>
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
