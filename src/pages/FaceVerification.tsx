import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
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

type FacePoint = { x: number; y: number };
type Stage =
  | "idle"
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
  onVerified: (result: {
    verificationId: string;
    similarityScore: number;
    threshold: number;
    message: string;
  }) => void;
}

const emptyChecks: DetectionChecks = {
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

const getKeypoint = (
  face: faceLandmarksDetection.Face | undefined,
  index: number,
): FacePoint | null => {
  const point = face?.keypoints?.[index];
  return point ? { x: point.x, y: point.y } : null;
};

const distance = (a: FacePoint, b: FacePoint) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

function estimateFrameQuality(video: HTMLVideoElement, box: any) {
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
}

export default function FaceVerification({
  token,
  electionId,
  candidateLabel,
  onBack,
  onVerified,
}: FaceVerificationProps) {
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
  const checksRef = useRef<DetectionChecks>(emptyChecks);

  const [stage, setStage] = useState<Stage>("idle");
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [checks, setChecks] = useState<DetectionChecks>(emptyChecks);
  const [instruction, setInstruction] = useState(
    "Start verification when you are ready.",
  );
  const [quality, setQuality] = useState({
    brightness: 0,
    sharpness: 0,
    qualityScore: 0,
    livenessScore: 0,
    confidenceScore: 0,
  });
  const [error, setError] = useState("");
  const [matchResult, setMatchResult] = useState<{
    status: "idle" | "success" | "failed" | "processing";
    score?: number;
    threshold?: number;
    message?: string;
  }>({ status: "idle" });

  const commitChecks = (nextChecks: DetectionChecks) => {
    checksRef.current = nextChecks;
    setChecks(nextChecks);
  };

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const updateStage = (nextStage: Stage, nextInstruction: string) => {
    if (stageRef.current !== nextStage) {
      stageRef.current = nextStage;
      setStage(nextStage);
    }
    setInstruction(nextInstruction);
  };

  const progressPercent = useMemo(() => {
    const values: Record<Stage, number> = {
      idle: 0,
      center: 14,
      blink: 34,
      turnLeft: 48,
      turnRight: 62,
      returnCenter: 76,
      capturing: 86,
      matching: 94,
      success: 100,
      failed: Math.max(12, quality.qualityScore),
    };
    return Math.round(values[stage]);
  }, [stage, quality.qualityScore]);

  const progressSteps: ProgressStep[] = useMemo(
    () => [
      {
        label: "Open Camera",
        status: cameraActive || stage !== "idle" ? "complete" : "waiting",
      },
      {
        label: "Detect Face",
        status: checks.faceDetected ? "complete" : cameraActive ? "processing" : "waiting",
      },
      {
        label: "Detect Landmarks",
        status:
          checks.leftEye && checks.rightEye && checks.nose && checks.mouth
            ? "complete"
            : checks.faceDetected
              ? "processing"
              : "waiting",
      },
      {
        label: "Liveness Check",
        status:
          checks.blinkDetected &&
          checks.headTurnLeft &&
          checks.headTurnRight &&
          checks.returnedToCenter
            ? "complete"
            : cameraActive
              ? "processing"
              : "waiting",
      },
      {
        label: "Capture",
        status:
          stage === "capturing" || stage === "matching" || stage === "success"
            ? stage === "capturing"
              ? "processing"
              : "complete"
            : "waiting",
      },
      {
        label: "Face Match",
        status:
          stage === "matching"
            ? "processing"
            : stage === "success"
              ? "complete"
              : stage === "failed"
                ? "failed"
                : "waiting",
      },
      {
        label: "Vote",
        status: stage === "success" ? "complete" : "waiting",
      },
    ],
    [cameraActive, checks, stage],
  );

  const submitMatch = useCallback(
    async (payload: any) => {
      updateStage("matching", "Comparing your live face on the server.");
      setMatchResult({
        status: "processing",
        message: "Server verification is checking liveness and face match.",
      });
      stopCamera();

      const verificationBody = {
        verificationId: verificationIdRef.current,
        electionId,
        livenessChecks: payload.livenessChecks,
        quality: payload.quality,
      };

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

      updateStage("success", "Verification successful. You can cast your vote.");
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
    },
    [electionId, onVerified, stopCamera, token],
  );

  const captureAndSubmit = useCallback(async () => {
    if (captureStartedRef.current || !videoRef.current || !latestPayloadRef.current) {
      return;
    }

    captureStartedRef.current = true;
    updateStage("capturing", "Hold still. Capturing the best frame automatically.");

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
  }, [stopCamera, submitMatch]);

  const runDetection = useCallback(async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;
    if (!detector || !video || stageRef.current === "success" || stageRef.current === "failed") {
      return;
    }

    if (video.readyState < 2) {
      frameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    try {
      const faces = await detector.estimateFaces(video, { flipHorizontal: true });
      if (faces.length !== 1) {
        stableFramesRef.current = 0;
        lastCenterRef.current = null;
        commitChecks({
          ...emptyChecks,
          blinkDetected: checksRef.current.blinkDetected,
          headTurnLeft: checksRef.current.headTurnLeft,
          headTurnRight: checksRef.current.headTurnRight,
          returnedToCenter: checksRef.current.returnedToCenter,
        });
        setQuality({
          brightness: 0,
          sharpness: 0,
          qualityScore: 0,
          livenessScore: 0,
          confidenceScore: 0,
        });
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
      const leftEyeOuter = getKeypoint(face, 33);
      const leftEyeInner = getKeypoint(face, 133);
      const rightEyeOuter = getKeypoint(face, 263);
      const rightEyeInner = getKeypoint(face, 362);
      const leftEyeTop = getKeypoint(face, 159);
      const leftEyeBottom = getKeypoint(face, 145);
      const rightEyeTop = getKeypoint(face, 386);
      const rightEyeBottom = getKeypoint(face, 374);
      const nose = getKeypoint(face, 1);
      const mouthTop = getKeypoint(face, 13);
      const mouthBottom = getKeypoint(face, 14);
      const leftEar = getKeypoint(face, 234);
      const rightEar = getKeypoint(face, 454);

      const bothEyes = !!(
        leftEyeOuter &&
        leftEyeInner &&
        rightEyeOuter &&
        rightEyeInner &&
        leftEyeTop &&
        leftEyeBottom &&
        rightEyeTop &&
        rightEyeBottom
      );
      const eyeDistance =
        leftEyeOuter && rightEyeOuter ? distance(leftEyeOuter, rightEyeOuter) : 1;
      const leftEarRatio =
        leftEyeTop && leftEyeBottom && leftEyeOuter && leftEyeInner
          ? distance(leftEyeTop, leftEyeBottom) / distance(leftEyeOuter, leftEyeInner)
          : 1;
      const rightEarRatio =
        rightEyeTop && rightEyeBottom && rightEyeOuter && rightEyeInner
          ? distance(rightEyeTop, rightEyeBottom) /
            distance(rightEyeOuter, rightEyeInner)
          : 1;
      const eyesClosed = bothEyes && (leftEarRatio + rightEarRatio) / 2 < 0.12;
      const eyesOpen = bothEyes && (leftEarRatio + rightEarRatio) / 2 > 0.16;

      const center = {
        x: box.xMin + box.width / 2,
        y: box.yMin + box.height / 2,
      };
      const frameWidth = video.videoWidth || 1;
      const frameHeight = video.videoHeight || 1;
      const faceCentered =
        Math.abs(center.x - frameWidth / 2) < frameWidth * 0.16 &&
        Math.abs(center.y - frameHeight / 2) < frameHeight * 0.18;
      const faceWidthRatio = box.width / frameWidth;
      const distanceGood = faceWidthRatio >= 0.24 && faceWidthRatio <= 0.52;

      if (lastCenterRef.current) {
        stableFramesRef.current =
          distance(lastCenterRef.current, center) < 9
            ? stableFramesRef.current + 1
            : 0;
      }
      lastCenterRef.current = center;
      const stable = stableFramesRef.current >= 10;

      const yaw =
        nose && leftEyeOuter && rightEyeOuter
          ? (nose.x - (leftEyeOuter.x + rightEyeOuter.x) / 2) / eyeDistance
          : 0;
      const returnedToCenter = Math.abs(yaw) < 0.08 && faceCentered;
      const { brightness, sharpness } = estimateFrameQuality(video, box);
      const lightingGood = brightness >= 35 && brightness <= 82;
      const headRotationAcceptable = Math.abs(yaw) < 0.12;
      const qualityScore = Math.round(
        clamp(
          (faceCentered ? 18 : 0) +
            (distanceGood ? 14 : 0) +
            (lightingGood ? 22 : 0) +
            (sharpness >= 28 ? 20 : 0) +
            (bothEyes ? 12 : 0) +
            (nose ? 7 : 0) +
            (mouthTop && mouthBottom ? 7 : 0),
        ),
      );
      const nextChecks: DetectionChecks = {
        faceDetected: true,
        leftEye: bothEyes,
        rightEye: bothEyes,
        nose: !!nose,
        mouth: !!mouthTop && !!mouthBottom,
        leftEar: !!leftEar,
        rightEar: !!rightEar,
        faceCentered,
        blinkDetected: checksRef.current.blinkDetected,
        headTurnLeft: checksRef.current.headTurnLeft,
        headTurnRight: checksRef.current.headTurnRight,
        returnedToCenter: checksRef.current.returnedToCenter,
        imageQualityGood: qualityScore >= 72 && sharpness >= 28,
      };

      if (stageRef.current === "center") {
        if (!faceCentered) setInstruction("Center your face inside the guide frame.");
        else if (!distanceGood)
          setInstruction(
            faceWidthRatio < 0.24
              ? "Move closer to the camera."
              : "Move slightly farther from the camera.",
          );
        else if (!lightingGood) setInstruction("Adjust lighting so your face is clear.");
        else if (stable) updateStage("blink", "Please blink once.");
      }

      if (stageRef.current === "blink") {
        if (eyesClosed) blinkClosedRef.current = true;
        if (blinkClosedRef.current && eyesOpen) {
          nextChecks.blinkDetected = true;
          updateStage("turnLeft", "Please slowly turn your head left.");
        } else {
          setInstruction("Please blink once.");
        }
      }

      if (stageRef.current === "turnLeft") {
        if (Math.abs(yaw) > 0.14) {
          nextChecks.headTurnLeft = true;
          firstTurnDirectionRef.current = yaw < 0 ? "negative" : "positive";
          stableFramesRef.current = 0;
          updateStage("turnRight", "Please slowly turn your head right.");
        } else {
          setInstruction("Please slowly turn your head left.");
        }
      }

      if (stageRef.current === "turnRight") {
        const turnedOpposite =
          firstTurnDirectionRef.current === "negative"
            ? yaw > 0.14
            : yaw < -0.14;
        if (turnedOpposite) {
          nextChecks.headTurnRight = true;
          stableFramesRef.current = 0;
          updateStage("returnCenter", "Please look straight at the camera.");
        } else {
          setInstruction("Please slowly turn your head right.");
        }
      }

      if (stageRef.current === "returnCenter") {
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
      const qualityPayload = {
        brightness,
        sharpness,
        qualityScore,
        livenessScore,
        confidenceScore: 0.96,
      };
      const livenessChecks = {
        blinkDetected: nextChecks.blinkDetected,
        headTurnLeft: nextChecks.headTurnLeft,
        headTurnRight: nextChecks.headTurnRight,
        returnedToCenter: nextChecks.returnedToCenter,
        faceDetected: nextChecks.faceDetected,
        leftEye: nextChecks.leftEye,
        rightEye: nextChecks.rightEye,
        nose: nextChecks.nose,
        mouth: nextChecks.mouth,
        faceCentered: nextChecks.faceCentered,
        imageQualityGood: nextChecks.imageQualityGood,
        lightingGood,
        distanceGood,
        stable,
      };
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
        leftEar && rightEar ? 1 : 0,
        nose ? 1 : 0,
        mouthTop && mouthBottom ? 1 : 0,
        headRotationAcceptable ? 1 : 0,
        Number(faceWidthRatio.toFixed(4)),
        Number((box.height / frameHeight).toFixed(4)),
        ...normalizedPoint(leftEyeOuter),
        ...normalizedPoint(rightEyeOuter),
        ...normalizedPoint(nose),
        ...normalizedPoint(mouthTop),
        ...normalizedPoint(leftEar),
        ...normalizedPoint(rightEar),
      ];

      latestPayloadRef.current = {
        livenessChecks,
        quality: qualityPayload,
        faceTemplate,
      };
      commitChecks(nextChecks);
      setQuality(qualityPayload);

      if (
        stageRef.current === "capturing" &&
        livenessScore >= 80 &&
        !captureStartedRef.current
      ) {
        window.setTimeout(captureAndSubmit, 350);
      }
    } catch (err) {
      console.warn("Face verification detection failed", err);
    }

    frameRef.current = requestAnimationFrame(runDetection);
  }, [captureAndSubmit]);

  const startVerification = async () => {
    setError("");
    setMatchResult({ status: "idle" });
    checksRef.current = emptyChecks;
    setChecks(emptyChecks);
    setQuality({
      brightness: 0,
      sharpness: 0,
      qualityScore: 0,
      livenessScore: 0,
      confidenceScore: 0,
    });
    captureStartedRef.current = false;
    firstTurnDirectionRef.current = null;
    blinkClosedRef.current = false;
    stableFramesRef.current = 0;
    lastCenterRef.current = null;
    setLoadingLabel("Preparing secure verification session...");
    updateStage("idle", "Preparing secure verification session.");

    try {
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

      setLoadingLabel("Loading face landmark model...");
      await tf.setBackend("webgl");
      await tf.ready();
      detectorRef.current = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          maxFaces: 2,
          refineLandmarks: true,
        },
      );

      setLoadingLabel("Opening webcam...");
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
      updateStage("failed", "Camera could not be opened.");
      setLoadingLabel("");
      setError(
        err?.name === "NotAllowedError"
          ? "Camera access was blocked. Please allow camera permission and try again."
          : err.message || "Camera could not be opened.",
      );
    }
  };

  const retryVerification = () => {
    stopCamera();
    updateStage("idle", "Start verification when you are ready.");
    setError("");
    setMatchResult({ status: "idle" });
    checksRef.current = emptyChecks;
    setChecks(emptyChecks);
  };

  const qualityLabel =
    quality.qualityScore >= 72 ? `${quality.qualityScore}%` : "Needs work";
  const brightnessLabel =
    quality.brightness === 0
      ? "Waiting"
      : quality.brightness < 35
        ? "Low"
        : quality.brightness > 82
          ? "High"
          : "Good";
  const distanceLabel = checks.faceCentered
    ? "Good"
    : checks.faceDetected
      ? "Adjust"
      : "Waiting";

  const overlayState =
    stage === "capturing"
      ? "capturing"
      : stage === "matching"
        ? "matching"
        : stage === "success"
          ? "success"
          : "idle";

  return (
    <div className="space-y-5">
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
            Selected nominee: <span className="font-bold">{candidateLabel}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to nominees
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="space-y-4">
          <CameraView
            videoRef={videoRef}
            cameraActive={cameraActive}
            centered={checks.faceCentered}
            distanceGood={latestPayloadRef.current?.livenessChecks?.distanceGood || false}
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

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Camera Quality
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-900">
                  {quality.qualityScore}%
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  Quality
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-900">
                  {quality.brightness}%
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  Brightness
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-lg font-black text-slate-900">
                  {quality.sharpness}%
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  Sharpness
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
