import test from "node:test";
import assert from "node:assert/strict";

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

  assert.deepEqual(dims, { width: 640, height: 480 });
});

test("buildFallbackFaceBox centers a sensible crop when no face is detected", () => {
  const box = buildFallbackFaceBox({ videoWidth: 740, videoHeight: 510 });

  assert.equal(box.xMin, 185);
  assert.equal(box.yMin, 127);
  assert.equal(box.width, 370);
  assert.equal(box.height, 255);
});
