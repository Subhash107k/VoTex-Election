export interface TensorflowFaceModules {
  tf: typeof import("@tensorflow/tfjs-core");
  faceLandmarksDetection: typeof import("@tensorflow-models/face-landmarks-detection");
}

let tensorflowFaceModulesPromise: Promise<TensorflowFaceModules> | null = null;

export async function loadTensorflowFaceModules(): Promise<TensorflowFaceModules> {
  if (!tensorflowFaceModulesPromise) {
    tensorflowFaceModulesPromise = (async () => {
      await import("@tensorflow/tfjs-backend-webgl");

      const [tfModule, faceLandmarksDetectionModule] = await Promise.all([
        import("@tensorflow/tfjs-core"),
        import("@tensorflow-models/face-landmarks-detection"),
      ]);

      return {
        tf: tfModule,
        faceLandmarksDetection: faceLandmarksDetectionModule,
      };
    })();
  }

  return tensorflowFaceModulesPromise;
}
