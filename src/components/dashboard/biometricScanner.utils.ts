export interface CaptureDimensions {
  width: number;
  height: number;
}

export interface FaceBoxLike {
  xMin: number;
  yMin: number;
  width: number;
  height: number;
}

export const resolveCaptureDimensions = (videoLike: {
  videoWidth?: number;
  videoHeight?: number;
  clientWidth?: number;
  clientHeight?: number;
}): CaptureDimensions => {
  const width = videoLike.videoWidth || videoLike.clientWidth || 740;
  const height = videoLike.videoHeight || videoLike.clientHeight || 510;

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
};

export const buildFallbackFaceBox = (videoLike: {
  videoWidth?: number;
  videoHeight?: number;
}): FaceBoxLike => {
  const { width, height } = resolveCaptureDimensions(videoLike);
  const fallbackWidth = Math.max(120, Math.floor(width * 0.5));
  const fallbackHeight = Math.max(120, Math.floor(height * 0.5));

  return {
    xMin: Math.max(0, Math.floor((width - fallbackWidth) / 2)),
    yMin: Math.max(0, Math.floor((height - fallbackHeight) / 2)),
    width: fallbackWidth,
    height: fallbackHeight,
  };
};
