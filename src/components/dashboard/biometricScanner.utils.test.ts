import { test, expect } from "vitest";

import {
  buildFallbackFaceBox,
  resolveCaptureDimensions,
} from "./biometricScanner.utils";

test("resolveCaptureDimensions falls back to video metadata when available", () => {
  const dims = resolveCaptureDimensions({
    videoWidth: 640,
    videoHeight: 480,
    clientWidth: 320,
    clientHeight: 240,
  });

  expect(dims).toEqual({ width: 640, height: 480 });
});

test("buildFallbackFaceBox centers a sensible crop when no face is detected", () => {
  const box = buildFallbackFaceBox({ videoWidth: 740, videoHeight: 510 });

  expect(box.xMin).toBe(185);
  expect(box.yMin).toBe(127);
  expect(box.width).toBe(370);
  expect(box.height).toBe(255);
});
