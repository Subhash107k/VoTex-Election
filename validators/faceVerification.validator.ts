import { z } from "zod";

// ============================================
// Base Validators
// ============================================

/**
 * Validates base64 encoded images with size and format checks
 */
const base64ImageSchema = z
  .string()
  .min(
    120,
    "Captured image is too small for verification (minimum 120 characters).",
  )
  .max(10_000_000, "Captured image exceeds maximum size of 10MB.")
  .refine(
    (value) => /^data:image\/(jpeg|jpg|png|webp);base64,/.test(value),
    "Captured image must be a valid base64-encoded image (JPEG, PNG, or WebP format).",
  )
  .refine((value) => {
    // Extract base64 part and check approximate size
    const base64Data = value.split(",")[1];
    if (!base64Data) return false;
    const approximateSizeBytes = (base64Data.length * 3) / 4;
    return approximateSizeBytes <= 10 * 1024 * 1024; // 10MB limit
  }, "Image file size must not exceed 10MB.");

/**
 * Validates face embedding/feature vectors
 */
const numericVectorSchema = z
  .array(z.number().finite("Face embedding values must be finite numbers."))
  .min(8, "Face embedding is incomplete (minimum 8 dimensions required).")
  .max(256, "Face embedding exceeds maximum allowed dimensions (256).")
  .refine((vector) => {
    // Check for NaN or Infinity values
    return vector.every((v) => Number.isFinite(v) && !Number.isNaN(v));
  }, "Face embedding contains invalid numeric values.")
  .refine((vector) => {
    // Check that values are within reasonable range
    return vector.every((v) => v >= -10 && v <= 10);
  }, "Face embedding values are outside the expected range (-10 to 10).");

// ============================================
// Liveness & Quality Schemas
// ============================================

/**
 * Validates liveness detection checks
 */
const livenessSchema = z
  .object({
    blinkDetected: z.boolean({ message: "Blink detection status is required." }),
    headTurnLeft: z.boolean({ message: "Head turn left status is required." }),
    headTurnRight: z.boolean({ message: "Head turn right status is required." }),
    returnedToCenter: z.boolean({ message: "Return to center status is required." }),
    faceDetected: z.boolean({ message: "Face detection status is required." }),
    leftEye: z.boolean({ message: "Left eye detection status is required." }),
    rightEye: z.boolean({ message: "Right eye detection status is required." }),
    nose: z.boolean({ message: "Nose detection status is required." }),
    mouth: z.boolean({ message: "Mouth detection status is required." }),
    faceCentered: z.boolean({ message: "Face centered status is required." }),
    imageQualityGood: z.boolean({ message: "Image quality status is required." }),
    lightingGood: z.boolean({ message: "Lighting status is required." }),
    distanceGood: z.boolean({ message: "Distance status is required." }),
    stable: z.boolean({ message: "Stability status is required." }),
  })
  .refine((data) => data.faceDetected === true, {
    message: "Face must be detected for verification.",
    path: ["faceDetected"],
  })
  .refine((data) => data.leftEye && data.rightEye, {
    message: "Both eyes must be detected for verification.",
    path: ["leftEye"],
  })
  .refine((data) => data.nose === true, {
    message: "Nose must be detected for verification.",
    path: ["nose"],
  })
  .refine((data) => data.mouth === true, {
    message: "Mouth must be detected for verification.",
    path: ["mouth"],
  });

/**
 * Validates image quality metrics
 */
const qualitySchema = z.object({
  brightness: z
    .number({ message: "Brightness score is required." })
    .min(0, "Brightness must be at least 0.")
    .max(100, "Brightness must not exceed 100."),
  sharpness: z
    .number({ message: "Sharpness score is required." })
    .min(0, "Sharpness must be at least 0.")
    .max(100, "Sharpness must not exceed 100."),
  qualityScore: z
    .number({ message: "Quality score is required." })
    .min(0, "Quality score must be at least 0.")
    .max(100, "Quality score must not exceed 100.")
    .refine(
      (score) => score >= 50,
      "Quality score is too low for reliable verification (minimum 50 required).",
    ),
  livenessScore: z
    .number({ message: "Liveness score is required." })
    .min(0, "Liveness score must be at least 0.")
    .max(100, "Liveness score must not exceed 100.")
    .refine(
      (score) => score >= 70,
      "Liveness score is too low (minimum 70 required for anti-spoofing).",
    ),
  confidenceScore: z
    .number({ message: "Confidence score is required." })
    .min(0, "Confidence score must be at least 0.")
    .max(1, "Confidence score must not exceed 1.")
    .refine(
      (score) => score >= 0.5,
      "Face detection confidence is too low (minimum 0.5 required).",
    ),
});

// ============================================
// Verification Schemas
// ============================================

/**
 * Validates the start verification request
 */
export const startFaceVerificationSchema = z.object({
  electionId: z
    .string({ message: "Election ID is required." })
    .min(1, "Election ID cannot be empty.")
    .max(100, "Election ID is too long (maximum 100 characters).")
    .trim()
    .refine(
      (value) => /^[a-zA-Z0-9_-]+$/.test(value),
      "Election ID contains invalid characters (only letters, numbers, hyphens, and underscores allowed).",
    ),
  deviceInfo: z
    .object({
      deviceId: z.string().optional(),
      deviceType: z.enum(["mobile", "tablet", "desktop", "other"]).optional(),
      operatingSystem: z.string().optional(),
      browser: z.string().optional(),
    })
    .optional(),
  returnUrl: z.string().url("Return URL must be a valid URL.").optional(),
});

/**
 * Validates the liveness verification request
 */
export const verifyFaceLivenessSchema = z.object({
  verificationId: z
    .string({ message: "Verification ID is required." })
    .min(1, "Verification ID cannot be empty.")
    .max(100, "Verification ID is too long.")
    .trim(),
  electionId: z
    .string({ message: "Election ID is required." })
    .min(1, "Election ID cannot be empty.")
    .max(100, "Election ID is too long.")
    .trim(),
  livenessChecks: livenessSchema,
  quality: qualitySchema,
  metadata: z
    .object({
      processingTime: z.number().optional(),
      faceCount: z.number().min(0).max(10).optional(),
      modelVersion: z.string().optional(),
    })
    .optional(),
});

/**
 * Validates the face match request (extends liveness)
 */
export const matchFaceSchema = verifyFaceLivenessSchema.extend({
  capturedImage: base64ImageSchema,
  faceTemplate: numericVectorSchema,
  registeredFaceTemplate: numericVectorSchema.optional(),
  matchThreshold: z
    .number()
    .min(0, "Match threshold must be at least 0.")
    .max(1, "Match threshold must not exceed 1.")
    .optional()
    .default(0.85),
  checkLiveness: z.boolean().optional().default(true),
  documentImage: base64ImageSchema.optional(),
});

// ============================================
// Additional Schemas
// ============================================

/**
 * Validates face comparison request (for duplicate detection)
 */
export const compareFacesSchema = z.object({
  face1: base64ImageSchema,
  face2: base64ImageSchema,
  threshold: z.number().min(0).max(1).optional().default(0.85),
  checkLiveness: z.boolean().optional().default(false),
});

/**
 * Validates face template update request
 */
export const updateTemplateSchema = z.object({
  faceImage: base64ImageSchema,
  faceTemplate: numericVectorSchema,
  quality: qualitySchema,
  confirmation: z
    .string()
    .min(1, "Confirmation is required.")
    .refine(
      (value) => value === "UPDATE_MY_FACE_TEMPLATE",
      "Please confirm by sending the exact confirmation phrase.",
    ),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters.")
    .max(500, "Reason must not exceed 500 characters.")
    .optional(),
});

/**
 * Validates challenge response for anti-spoofing
 */
export const challengeResponseSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required."),
  response: z.object({
    action: z.enum(["blink", "smile", "nod", "turn_left", "turn_right"]),
    timestamp: z.number(),
    confidence: z.number().min(0).max(1),
  }),
  sessionId: z.string().min(1, "Session ID is required."),
});

/**
 * Validates batch verification request (admin only)
 */
export const batchVerificationSchema = z.object({
  userIds: z
    .array(z.string().min(1))
    .min(1, "At least one user ID is required.")
    .max(50, "Maximum 50 users per batch verification."),
  electionId: z.string().min(1, "Election ID is required."),
  threshold: z.number().min(0).max(1).optional().default(0.85),
  notifyUsers: z.boolean().optional().default(false),
});

/**
 * Validates verification status query
 */
export const verificationStatusSchema = z
  .object({
    electionId: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional().default(10),
    page: z.number().int().min(1).optional().default(1),
    sortBy: z
      .enum(["createdAt", "verifiedAt", "matchScore", "status"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .refine((data) => data.electionId || data.sessionId, {
    message: "Either electionId or sessionId must be provided.",
    path: ["electionId"],
  });

/**
 * Validates face data deletion request (GDPR)
 */
export const deleteFaceDataSchema = z.object({
  confirmation: z
    .string()
    .min(1, "Confirmation phrase is required.")
    .refine(
      (value) => value === "DELETE_MY_FACE_DATA",
      "Please send the exact confirmation phrase 'DELETE_MY_FACE_DATA' to proceed.",
    ),
  reason: z
    .string()
    .min(10, "Please provide a reason (at least 10 characters).")
    .max(500, "Reason must not exceed 500 characters."),
  deleteAll: z.boolean().optional().default(false),
});

// ============================================
// Response Schemas (for API documentation)
// ============================================

export const verificationResultSchema = z.object({
  verificationId: z.string(),
  passed: z.boolean(),
  similarityScore: z.number().min(0).max(1).optional(),
  threshold: z.number().min(0).max(1).optional(),
  livenessScore: z.number().min(0).max(100).optional(),
  message: z.string(),
  timestamp: z.string(),
  expiresAt: z.string().optional(),
});

export const verificationSessionSchema = z.object({
  sessionId: z.string(),
  verificationId: z.string(),
  status: z.enum(["pending", "in_progress", "verified", "failed", "expired"]),
  createdAt: z.string(),
  expiresAt: z.string(),
  instructions: z.object({
    nextStep: z.string(),
    endpoint: z.string(),
    method: z.string(),
  }),
});

// ============================================
// Type Exports
// ============================================

export type StartFaceVerificationInput = z.infer<
  typeof startFaceVerificationSchema
>;
export type VerifyFaceLivenessInput = z.infer<typeof verifyFaceLivenessSchema>;
export type MatchFaceInput = z.infer<typeof matchFaceSchema>;
export type CompareFacesInput = z.infer<typeof compareFacesSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ChallengeResponseInput = z.infer<typeof challengeResponseSchema>;
export type BatchVerificationInput = z.infer<typeof batchVerificationSchema>;
export type VerificationStatusInput = z.infer<typeof verificationStatusSchema>;
export type DeleteFaceDataInput = z.infer<typeof deleteFaceDataSchema>;

export type VerificationResult = z.infer<typeof verificationResultSchema>;
export type VerificationSession = z.infer<typeof verificationSessionSchema>;

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validates and parses input with detailed error formatting
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = (result.error.issues || []).map((err: any) => {
    const path = err.path ? err.path.join(".") : "";
    const prefix = path ? `${path}: ` : "";
    return `${prefix}${err.message}`;
  });

  return { success: false, errors };
}

/**
 * Creates a partial schema for PATCH operations
 */
export function createPartialSchema<T extends z.ZodObject<any>>(schema: T) {
  return schema.partial();
}

/**
 * Sanitizes input by trimming strings and removing extra whitespace
 */
export function sanitizeInput<T extends Record<string, any>>(input: T): T {
  const sanitized = { ...input };
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitized[key].trim() as any;
    }
  }
  return sanitized;
}

// ============================================
// Export Default
// ============================================

export default {
  startFaceVerificationSchema,
  verifyFaceLivenessSchema,
  matchFaceSchema,
  compareFacesSchema,
  updateTemplateSchema,
  challengeResponseSchema,
  batchVerificationSchema,
  verificationStatusSchema,
  deleteFaceDataSchema,
  validateInput,
  createPartialSchema,
  sanitizeInput,
};
