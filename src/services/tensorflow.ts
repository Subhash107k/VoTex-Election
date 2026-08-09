// ============================================
// TensorFlow Face Detection Module Loader
// Enhanced Production Version
// ============================================

// Types
export interface FaceDetectionConfig {
  maxFaces?: number;
  minDetectionConfidence?: number;
  runtime?: "tfjs" | "mediapipe" | "auto";
  backend?: "webgl" | "wasm" | "cpu";
  modelType?: "short" | "full" | "lite";
  enableTracking?: boolean;
  refineLandmarks?: boolean;
}

export interface DetectedFace {
  box: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    width: number;
    height: number;
  };
  keypoints: Array<{
    x: number;
    y: number;
    z?: number;
    name?: string;
    visibility?: number;
  }>;
  mesh?: number[][];
  annotations?: Record<string, number[][]>;
  faceInViewConfidence?: number;
  trackingId?: number;
}

export interface FaceDetector {
  estimateFaces: (
    input:
      | HTMLImageElement
      | HTMLVideoElement
      | HTMLCanvasElement
      | ImageData
      | { data: Uint8Array; width: number; height: number },
    config?: FaceDetectionConfig,
  ) => Promise<DetectedFace[]>;
  dispose: () => Promise<void>;
  getModelInfo: () => {
    modelName: string;
    inputSize: number;
    description: string;
  };
}

export interface TensorflowFaceModules {
  tf: {
    setBackend: (backend: string) => Promise<void>;
    ready: () => Promise<void>;
    getBackend: () => string;
    memory: () => { numTensors: number; numBytes: number };
    dispose: (tensor: any) => void;
    tidy: <T>(fn: () => T) => T;
    version: string;
  };
  faceLandmarksDetection: {
    SupportedModels: {
      MediaPipeFaceMesh: string;
    };
    createDetector: (
      modelName: string,
      config?: Record<string, unknown>,
    ) => Promise<FaceDetector>;
  };
}

interface ModuleCache {
  modules: TensorflowFaceModules | null;
  detector: FaceDetector | null;
  lastAccess: number;
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
}

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  BACKEND_PREFERENCE: "webgl" as const,
  MODEL_TYPE: "short" as const, // 'short' for speed, 'full' for accuracy
  DETECTION_CONFIDENCE: 0.5,
  MAX_FACES: 1,
  LOAD_TIMEOUT: 15000, // 15 seconds
};

// Module caching
let tensorflowFaceModulesPromise: Promise<TensorflowFaceModules> | null = null;
const moduleCache: ModuleCache = {
  modules: null,
  detector: null,
  lastAccess: 0,
  isLoading: false,
  error: null,
  retryCount: 0,
};

// Offline fallback implementations
const createOfflineFaceDetector = (): FaceDetector => ({
  estimateFaces: async () => [],
  dispose: async () => undefined,
  getModelInfo: () => ({
    modelName: "offline-fallback",
    inputSize: 0,
    description: "Offline fallback detector - no face detection available",
  }),
});

const createOfflineTensorflowModules = (): TensorflowFaceModules => ({
  tf: {
    setBackend: async () => undefined,
    ready: async () => undefined,
    getBackend: () => "offline",
    memory: () => ({ numTensors: 0, numBytes: 0 }),
    dispose: () => undefined,
    tidy: <T>(fn: () => T) => fn(),
    version: "offline-fallback",
  },
  faceLandmarksDetection: {
    SupportedModels: {
      MediaPipeFaceMesh: "MediaPipeFaceMesh",
    },
    createDetector: async () => createOfflineFaceDetector(),
  },
});

// Utility functions
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isCacheValid = (): boolean => {
  return Date.now() - moduleCache.lastAccess < CONFIG.CACHE_TTL;
};

const clearModuleCache = (): void => {
  moduleCache.modules = null;
  moduleCache.detector = null;
  moduleCache.error = null;
  moduleCache.isLoading = false;
  tensorflowFaceModulesPromise = null;
};

const detectBrowserSupport = (): {
  webgl: boolean;
  wasm: boolean;
  webworker: boolean;
} => {
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  return {
    webgl: !!gl,
    wasm:
      typeof WebAssembly === "object" &&
      typeof WebAssembly.instantiate === "function",
    webworker: typeof Worker !== "undefined",
  };
};

const getOptimalBackend = (): string => {
  const support = detectBrowserSupport();

  if (support.webgl) return "webgl";
  if (support.wasm) return "wasm";
  return "cpu";
};

// Main loading functions
async function loadRealModules(): Promise<TensorflowFaceModules> {
  try {
    // Dynamic imports with timeout
    const importWithTimeout = async <T>(
      importPromise: Promise<T>,
      timeoutMs: number,
    ): Promise<T> => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Import timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      );
      return Promise.race([importPromise, timeout]);
    };

    // Import TensorFlow.js
    const tf = await importWithTimeout(
      import("@tensorflow/tfjs-core"),
      CONFIG.LOAD_TIMEOUT,
    );

    // Import required backends
    const [tfBackendWebGL] = await Promise.allSettled([
      importWithTimeout(
        import("@tensorflow/tfjs-backend-webgl"),
        CONFIG.LOAD_TIMEOUT,
      ),
    ]);

    // Import face landmarks detection
    const faceLandmarksDetection = await importWithTimeout(
      import("@tensorflow-models/face-landmarks-detection"),
      CONFIG.LOAD_TIMEOUT,
    );

    // Set up TF.js
    await tf.ready();

    const supportedBackend = getOptimalBackend();
    if (tf.getBackend() !== supportedBackend) {
      try {
        await tf.setBackend(supportedBackend);
      } catch {
        // Backend already initialized or active
      }
    }

    console.log(`✅ TensorFlow.js loaded with ${tf.getBackend() || supportedBackend} backend`);

    return {
      tf: {
        setBackend: async (backend: string) => {
          if (tf.getBackend() !== backend) {
            try {
              await tf.setBackend(backend);
            } catch {
              // Backend already set
            }
          }
        },
        ready: () => tf.ready(),
        getBackend: () => tf.getBackend(),
        memory: () => tf.memory(),
        dispose: (tensor: any) => tf.dispose(tensor),
        tidy: <T>(fn: () => T) => (tf as any).tidy(fn) as unknown as T,
        version: (tf as any).version || "unknown",
      },
      faceLandmarksDetection: {
        SupportedModels: {
          MediaPipeFaceMesh:
            faceLandmarksDetection.SupportedModels?.MediaPipeFaceMesh ||
            "MediaPipeFaceMesh",
        },
        createDetector: async (
          modelName: string,
          config?: Record<string, unknown>,
        ) => {
          const detector = await faceLandmarksDetection.createDetector(
            faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            {
              runtime: "tfjs",
              refineLandmarks: true,
              maxFaces: CONFIG.MAX_FACES,
              ...config,
            },
          );
          return detector as unknown as FaceDetector;
        },
      },
    };
  } catch (error) {
    console.error("❌ Failed to load TensorFlow modules:", error);
    throw error;
  }
}

// Public API
export async function loadTensorflowFaceModules(): Promise<TensorflowFaceModules> {
  // Return cached modules if still valid
  if (moduleCache.modules && isCacheValid()) {
    moduleCache.lastAccess = Date.now();
    return moduleCache.modules;
  }

  // Return existing promise if loading
  if (tensorflowFaceModulesPromise && moduleCache.isLoading) {
    return tensorflowFaceModulesPromise;
  }

  // Clear stale cache
  if (moduleCache.error && moduleCache.retryCount >= CONFIG.MAX_RETRIES) {
    clearModuleCache();
  }

  // Start new loading process
  moduleCache.isLoading = true;
  moduleCache.error = null;

  tensorflowFaceModulesPromise = (async () => {
    try {
      const modules = await loadRealModules();

      // Cache successful load
      moduleCache.modules = modules;
      moduleCache.lastAccess = Date.now();
      moduleCache.isLoading = false;
      moduleCache.retryCount = 0;

      console.log("✅ TensorFlow face modules loaded successfully");
      return modules;
    } catch (error: any) {
      moduleCache.error = error;
      moduleCache.retryCount++;
      moduleCache.isLoading = false;

      console.warn(
        `⚠️ TensorFlow load attempt ${moduleCache.retryCount}/${CONFIG.MAX_RETRIES} failed:`,
        error.message,
      );

      // Retry logic
      if (moduleCache.retryCount < CONFIG.MAX_RETRIES) {
        console.log(`🔄 Retrying in ${CONFIG.RETRY_DELAY / 1000} seconds...`);
        await sleep(CONFIG.RETRY_DELAY);

        // Reset promise to allow retry
        tensorflowFaceModulesPromise = null;
        return loadTensorflowFaceModules();
      }

      // Max retries reached, use offline fallback
      console.error("❌ Max retries reached. Using offline fallback.");
      const offlineModules = createOfflineTensorflowModules();
      moduleCache.modules = offlineModules;
      return offlineModules;
    }
  })();

  return tensorflowFaceModulesPromise;
}

// Create face detector with optimal config
export async function createFaceDetector(
  config: FaceDetectionConfig = {},
): Promise<FaceDetector> {
  // Return cached detector if available
  if (moduleCache.detector && isCacheValid()) {
    return moduleCache.detector;
  }

  try {
    const modules = await loadTensorflowFaceModules();

    const detector = await modules.faceLandmarksDetection.createDetector(
      modules.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: config.runtime || "tfjs",
        maxFaces: config.maxFaces || CONFIG.MAX_FACES,
        refineLandmarks: config.refineLandmarks !== false,
        modelType: config.modelType || CONFIG.MODEL_TYPE,
      },
    );

    // Cache detector
    moduleCache.detector = detector;

    return detector;
  } catch (error) {
    console.error("Failed to create face detector:", error);
    return createOfflineFaceDetector();
  }
}

// Dispose resources
export async function disposeFaceDetector(): Promise<void> {
  if (moduleCache.detector) {
    try {
      await moduleCache.detector.dispose();
      moduleCache.detector = null;
      console.log("🗑️ Face detector disposed");
    } catch (error) {
      console.error("Error disposing face detector:", error);
    }
  }
}

// Clear all cached modules
export function clearFaceModules(): void {
  clearModuleCache();
}

// Check if modules are available
export function isFaceDetectionAvailable(): boolean {
  return (
    moduleCache.modules !== null &&
    moduleCache.modules !== createOfflineTensorflowModules() &&
    isCacheValid()
  );
}

// Get module status
export function getFaceModuleStatus(): {
  loaded: boolean;
  backend: string;
  error: string | null;
  retryCount: number;
} {
  return {
    loaded: isFaceDetectionAvailable(),
    backend: moduleCache.modules?.tf.getBackend() || "none",
    error: moduleCache.error?.message || null,
    retryCount: moduleCache.retryCount,
  };
}

// Detect face from image/video element
export async function detectFace(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  config?: FaceDetectionConfig,
): Promise<DetectedFace | null> {
  try {
    const detector = await createFaceDetector(config);
    const faces = await detector.estimateFaces(input, {
      maxFaces: 1,
      minDetectionConfidence:
        config?.minDetectionConfidence || CONFIG.DETECTION_CONFIDENCE,
    });

    return faces.length > 0 ? faces[0] : null;
  } catch (error) {
    console.error("Face detection failed:", error);
    return null;
  }
}

// Extract face landmarks as template
export function extractFaceTemplate(face: DetectedFace): number[] {
  if (!face?.keypoints) return [];

  // Flatten keypoints into a 1D array for template matching
  return face.keypoints.flatMap((kp) => [kp.x, kp.y, kp.z || 0]);
}

// Check if face is properly positioned
export function isFaceWellPositioned(face: DetectedFace): {
  isCentered: boolean;
  isCloseEnough: boolean;
  isLookingStraight: boolean;
  score: number;
} {
  if (!face?.box || !face?.keypoints) {
    return {
      isCentered: false,
      isCloseEnough: false,
      isLookingStraight: false,
      score: 0,
    };
  }

  const { box } = face;

  // Check if face is centered (box center should be near image center)
  const faceCenterX = (box.xMin + box.xMax) / 2;
  const faceCenterY = (box.yMin + box.yMax) / 2;
  const isCentered =
    Math.abs(faceCenterX - 0.5) < 0.2 && Math.abs(faceCenterY - 0.5) < 0.2;

  // Check if face is close enough (should occupy reasonable portion of frame)
  const faceArea = (box.xMax - box.xMin) * (box.yMax - box.yMin);
  const isCloseEnough = faceArea > 0.1 && faceArea < 0.5;

  // Check nose position for straight-looking face
  const noseKeypoint = face.keypoints.find((kp) => kp.name === "noseTip");
  const leftEyeKeypoint = face.keypoints.find((kp) => kp.name === "leftEye");
  const rightEyeKeypoint = face.keypoints.find((kp) => kp.name === "rightEye");

  let isLookingStraight = false;
  if (noseKeypoint && leftEyeKeypoint && rightEyeKeypoint) {
    const eyeCenterX = (leftEyeKeypoint.x + rightEyeKeypoint.x) / 2;
    const eyeCenterY = (leftEyeKeypoint.y + rightEyeKeypoint.y) / 2;
    const noseToEyeCenterX = Math.abs(noseKeypoint.x - eyeCenterX);
    const noseToEyeCenterY = Math.abs(noseKeypoint.y - eyeCenterY);
    isLookingStraight =
      noseToEyeCenterX < 0.05 &&
      noseToEyeCenterY > 0.1 &&
      noseToEyeCenterY < 0.3;
  }

  // Calculate overall score
  const score =
    [
      isCentered ? 1 : 0,
      isCloseEnough ? 1 : 0,
      isLookingStraight ? 1 : 0,
    ].reduce((sum, val) => sum + val, 0) / 3;

  return { isCentered, isCloseEnough, isLookingStraight, score };
}

// ============================================
// Face-API Descriptor & Embedding Generator
// ============================================
// Single application-wide initialization promise
let faceRecognitionInitPromise: Promise<void> | null = null;

export async function initializeFaceRecognition(): Promise<void> {
  if (faceRecognitionInitPromise) return faceRecognitionInitPromise;

  faceRecognitionInitPromise = (async () => {
    try {
      await loadTensorflowFaceModules();
      await loadFaceApiModels();
    } catch (err) {
      faceRecognitionInitPromise = null;
      throw err;
    }
  })();

  return faceRecognitionInitPromise;
}

let faceApiLoadedPromise: Promise<void> | null = null;

export async function loadFaceApiModels(): Promise<void> {
  if (faceApiLoadedPromise) return faceApiLoadedPromise;

  faceApiLoadedPromise = (async () => {
    try {
      const faceapi = await import("@vladmandic/face-api");

      // Load models from their respective subdirectories inside /models
      const loads: Promise<void>[] = [];
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        loads.push(
          faceapi.nets.tinyFaceDetector
            .loadFromUri("/models/tiny_face_detector")
            .catch(() => faceapi.nets.tinyFaceDetector.loadFromUri("/models")),
        );
      }
      if (!faceapi.nets.faceLandmark68Net.isLoaded) {
        loads.push(
          faceapi.nets.faceLandmark68Net
            .loadFromUri("/models/face_landmark_68")
            .catch(() => faceapi.nets.faceLandmark68Net.loadFromUri("/models")),
        );
      }
      if (!faceapi.nets.faceRecognitionNet.isLoaded) {
        loads.push(
          faceapi.nets.faceRecognitionNet
            .loadFromUri("/models/face_recognition")
            .catch(() => faceapi.nets.faceRecognitionNet.loadFromUri("/models")),
        );
      }

      await Promise.all(loads);
      console.log("✅ Face-API models loaded successfully from /models subdirectories");
    } catch (err) {
      console.warn("⚠️ Primary Face-API model load failed, attempting root /models:", err);
      try {
        const faceapi = await import("@vladmandic/face-api");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        console.log("✅ Face-API models loaded from /models root");
      } catch (fallbackErr) {
        console.error("❌ Face-API model load failed:", fallbackErr);
        faceApiLoadedPromise = null;
        throw fallbackErr;
      }
    }
  })();

  return faceApiLoadedPromise;
}

export async function generateFaceEmbedding(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): Promise<number[] | null> {
  try {
    const faceapi = await import("@vladmandic/face-api");
    await loadFaceApiModels();

    const detection = await faceapi
      .detectSingleFace(
        input as any,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.35 }),
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection?.descriptor) {
      return Array.from(detection.descriptor);
    }

    try {
      if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
        await faceapi.nets.ssdMobilenetv1
          .loadFromUri("/models/ssd_mobilenetv1")
          .catch(() => faceapi.nets.ssdMobilenetv1.loadFromUri("/models"));
      }
      const ssdDetection = await faceapi
        .detectSingleFace(
          input as any,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (ssdDetection?.descriptor) {
        return Array.from(ssdDetection.descriptor);
      }
    } catch {
      // Ignore fallback SSD error
    }

    return null;
  } catch (error) {
    console.error("Failed to generate face embedding:", error);
    return null;
  }
}

export async function detectSingleFaceApi(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
) {
  try {
    const faceapi = await import("@vladmandic/face-api");
    await loadFaceApiModels();

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.3,
    });
    const detection = await faceapi
      .detectSingleFace(input as any, options)
      .withFaceLandmarks();

    if (!detection) return null;

    const box = detection.detection.box;
    const positions = detection.landmarks.positions;

    return {
      box: {
        xMin: box.x,
        yMin: box.y,
        xMax: box.x + box.width,
        yMax: box.y + box.height,
        width: box.width,
        height: box.height,
      },
      keypoints: positions.map((p) => ({ x: p.x, y: p.y })),
      score: detection.detection.score,
    };
  } catch (err) {
    console.warn("Face-API detection error:", err);
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Export default
export default {
  loadTensorflowFaceModules,
  createFaceDetector,
  disposeFaceDetector,
  clearFaceModules,
  isFaceDetectionAvailable,
  getFaceModuleStatus,
  detectFace,
  extractFaceTemplate,
  isFaceWellPositioned,
  loadFaceApiModels,
  generateFaceEmbedding,
  cosineSimilarity,
};

