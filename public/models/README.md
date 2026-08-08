# face-api.js models

Uncompressed and quantized models used by [face-api.js](https://github.com/justadudewhohacks/face-api.js).

## Notes

This folder contains model assets for face detection and landmark recognition. The application also supports a TensorFlow-based `face-api` capture path in `src/components/BiometricScanner.tsx`.

The `face-api` mode is intended for live browser biometric registration with:

- single-face validation
- alignment and centering checks
- eye, nose, mouth, and ear visibility validation
- passport-style cropped face export
- structured JSON capture metadata

If you use this model folder, make sure the browser can load the face model files from the corresponding path and that the video device is enabled in the browser.
