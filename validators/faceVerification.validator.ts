import { z } from "zod";

const base64ImageSchema = z
  .string()
  .min(120, "Captured image is too small for verification.")
  .refine(
    (value) => /^data:image\/(jpeg|jpg|png|webp);base64,/.test(value),
    "Captured image must be a base64 image data URL.",
  );

const numericVectorSchema = z
  .array(z.number().finite())
  .min(8, "Face embedding is incomplete.")
  .max(128, "Face embedding is unexpectedly large.");

const livenessSchema = z.object({
  blinkDetected: z.boolean(),
  headTurnLeft: z.boolean(),
  headTurnRight: z.boolean(),
  returnedToCenter: z.boolean(),
  faceDetected: z.boolean(),
  leftEye: z.boolean(),
  rightEye: z.boolean(),
  nose: z.boolean(),
  mouth: z.boolean(),
  faceCentered: z.boolean(),
  imageQualityGood: z.boolean(),
  lightingGood: z.boolean(),
  distanceGood: z.boolean(),
  stable: z.boolean(),
});

const qualitySchema = z.object({
  brightness: z.number().min(0).max(100),
  sharpness: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  livenessScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(1),
});

export const startFaceVerificationSchema = z.object({
  electionId: z.string().min(1, "Election id is required."),
});

export const verifyFaceLivenessSchema = z.object({
  verificationId: z.string().min(1, "Verification id is required."),
  electionId: z.string().min(1, "Election id is required."),
  livenessChecks: livenessSchema,
  quality: qualitySchema,
});

export const matchFaceSchema = verifyFaceLivenessSchema.extend({
  capturedImage: base64ImageSchema,
  faceTemplate: numericVectorSchema,
});

export type StartFaceVerificationInput = z.infer<
  typeof startFaceVerificationSchema
>;
export type VerifyFaceLivenessInput = z.infer<typeof verifyFaceLivenessSchema>;
export type MatchFaceInput = z.infer<typeof matchFaceSchema>;
