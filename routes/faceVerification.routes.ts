import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body, query } from "express-validator";
import { FaceVerificationController } from "../controllers/faceVerification.controller";
import { validateRequest } from "../middleware/validation.middleware";
import { auditLogger } from "../middleware/audit.middleware";
import { deviceFingerprint } from "../middleware/deviceFingerprint.middleware";
import { biometricConsent } from "../middleware/biometricConsent.middleware";

export function createFaceVerificationRouter(authenticateToken: any) {
  const router = Router();

  // Base rate limiter for face verification
  const faceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error:
        "Too many face verification attempts. Please wait before retrying.",
      retryAfter: "15 minutes",
      code: "RATE_LIMIT_EXCEEDED",
    },
    keyGenerator: (req: any) => {
      // Use combination of user ID and forwarded IP for rate limiting.
      // Avoid using `req.ip` directly to satisfy express-rate-limit IPv6 checks.
      const forwarded = (req.headers["x-forwarded-for"] as string) || "";
      const ip = forwarded
        ? forwarded.split(",")[0].trim()
        : req.socket?.remoteAddress || "unknown";
      return `${req.user?.id || "anon"}_${ip}`;
    },
    skip: (req: any) => {
      // Skip rate limiting for admins
      return req.user?.role === "admin";
    },
    handler: (req: any, res: any) => {
      // Log rate limit violations
      console.warn("Face verification rate limit exceeded", {
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        error: "Rate limit exceeded",
        message:
          "Too many face verification attempts. Please wait before retrying.",
        retryAfter: "15 minutes",
        code: "RATE_LIMIT_EXCEEDED",
      });
    },
  });

  // Stricter rate limiter for failed attempts
  const failedAttemptLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 5, // 5 failed attempts
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
    message: {
      error:
        "Account temporarily locked due to multiple failed face verification attempts.",
      retryAfter: "30 minutes",
      code: "ACCOUNT_LOCKED",
    },
    keyGenerator: (req: any) => {
      return `failed_face_${req.user?.id}`;
    },
  });

  // File upload size limit for face images
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Upload limit reached. Please try again later.",
      code: "UPLOAD_LIMIT_EXCEEDED",
    },
  });

  // Validation schemas
  const startVerificationValidation = [
    body("deviceInfo")
      .optional()
      .isObject()
      .withMessage("Device info must be an object"),
    body("deviceInfo.deviceId")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 }),
    body("deviceInfo.deviceType")
      .optional()
      .isIn(["mobile", "tablet", "desktop", "other"])
      .withMessage("Invalid device type"),
    body("quality")
      .optional()
      .isIn(["low", "medium", "high", "auto"])
      .withMessage("Invalid quality setting"),
    body("livenessCheck")
      .optional()
      .isBoolean()
      .withMessage("Liveness check must be a boolean"),
    body("returnTemplate")
      .optional()
      .isBoolean()
      .withMessage("Return template must be a boolean"),
  ];

  const verifyFaceValidation = [
    body("verificationId")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Verification ID is required"),
    body("electionId")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Election ID is required"),
    body("livenessChecks")
      .isObject()
      .withMessage("Liveness checks are required"),
    body("livenessChecks.*")
      .isBoolean()
      .withMessage("Each liveness check must be a boolean"),
    body("quality")
      .isObject()
      .withMessage("Quality metrics are required"),
    body("quality.brightness")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Brightness must be between 0 and 100"),
    body("quality.sharpness")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Sharpness must be between 0 and 100"),
    body("quality.qualityScore")
      .isFloat({ min: 50, max: 100 })
      .withMessage("Quality score must be at least 50"),
    body("quality.livenessScore")
      .isFloat({ min: 70, max: 100 })
      .withMessage("Liveness score must be at least 70"),
    body("quality.confidenceScore")
      .isFloat({ min: 0.5, max: 1 })
      .withMessage("Confidence score must be between 0.5 and 1"),
    body("metadata")
      .optional()
      .isObject()
      .withMessage("Metadata must be an object"),
    body("metadata.lighting")
      .optional()
      .isIn(["good", "fair", "poor"])
      .withMessage("Invalid lighting condition"),
    body("metadata.angle")
      .optional()
      .isIn(["front", "left", "right", "up", "down"])
      .withMessage("Invalid angle"),
    body("metadata.expression")
      .optional()
      .isIn(["neutral", "smile", "serious"])
      .withMessage("Invalid expression"),
  ];

  const matchFaceValidation = [
    ...verifyFaceValidation,
    body("capturedImage")
      .isString()
      .notEmpty()
      .withMessage("Captured image is required")
      .custom((value: string) => {
        if (!value.startsWith("data:image/")) {
          throw new Error(
            "Invalid captured image format. Must be base64 encoded image.",
          );
        }
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (value.length > maxSize) {
          throw new Error("Image size exceeds 10MB limit.");
        }
        return true;
      }),
    body("faceTemplate")
      .isArray({ min: 8, max: 256 })
      .withMessage("Face template must contain 8 to 256 numeric values"),
    body("faceTemplate.*")
      .isFloat({ min: -10, max: 10 })
      .withMessage("Face template values must be numeric and within range"),
    body("documentImage")
      .optional()
      .isString()
      .custom((value: string) => {
        if (value && !value.startsWith("data:image/")) {
          throw new Error("Invalid document image format.");
        }
        return true;
      }),
    body("matchThreshold")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("Match threshold must be between 0 and 1"),
    body("checkLiveness")
      .optional()
      .isBoolean()
      .withMessage("Check liveness must be a boolean"),
  ];

  const updateTemplateValidation = [
    body("faceImage")
      .isString()
      .notEmpty()
      .withMessage("Face image is required")
      .custom((value: string) => {
        if (!value.startsWith("data:image/")) {
          throw new Error(
            "Invalid face image format. Must be base64 encoded image.",
          );
        }
        return true;
      }),
    body("faceTemplate")
      .isArray({ min: 8, max: 256 })
      .withMessage("Face template must contain 8 to 256 numeric values"),
    body("faceTemplate.*")
      .isFloat({ min: -10, max: 10 })
      .withMessage("Face template values must be numeric and within range"),
    body("quality")
      .isObject()
      .withMessage("Quality metrics are required"),
    body("quality.brightness")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Brightness must be between 0 and 100"),
    body("quality.sharpness")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Sharpness must be between 0 and 100"),
    body("quality.qualityScore")
      .isFloat({ min: 50, max: 100 })
      .withMessage("Quality score must be at least 50"),
    body("quality.livenessScore")
      .isFloat({ min: 70, max: 100 })
      .withMessage("Liveness score must be at least 70"),
    body("quality.confidenceScore")
      .isFloat({ min: 0.5, max: 1 })
      .withMessage("Confidence score must be between 0.5 and 1"),
    body("confirmation")
      .equals("UPDATE_MY_FACE_TEMPLATE")
      .withMessage("Invalid template update confirmation"),
    body("reason")
      .optional()
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage("Reason must be 10 to 500 characters"),
  ];

  const statusValidation = [
    query("sessionId")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 }),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
  ];

  // Apply global middleware
  router.use(authenticateToken);
  router.use(deviceFingerprint());
  router.use(biometricConsent());
  router.use(auditLogger("face-verification"));

  // Health check endpoint
  router.get("/health", (req: any, res: any) => {
    res.json({
      status: "operational",
      service: "face-verification",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      rateLimit: {
        remaining: req.rateLimit?.remaining || "N/A",
        reset: req.rateLimit?.resetTime || "N/A",
      },
    });
  });

  // Start face verification session
  router.post(
    "/start",
    faceLimiter,
    startVerificationValidation,
    validateRequest,
    FaceVerificationController.start,
  );

  // Verify face (with liveness detection)
  router.post(
    "/verify",
    faceLimiter,
    failedAttemptLimiter,
    uploadLimiter,
    verifyFaceValidation,
    validateRequest,
    FaceVerificationController.verify,
  );

  // Match face with document/stored template
  router.post(
    "/match",
    faceLimiter,
    failedAttemptLimiter,
    matchFaceValidation,
    validateRequest,
    FaceVerificationController.match,
  );

  // Get verification status
  router.get(
    "/status",
    faceLimiter,
    statusValidation,
    validateRequest,
    FaceVerificationController.status,
  );

  // Get verification history
  router.get(
    "/history",
    faceLimiter,
    statusValidation,
    validateRequest,
    FaceVerificationController.history,
  );

  // Get face template (secured)
  router.get(
    "/template",
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // Very limited access
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: "Template access is restricted.",
        code: "TEMPLATE_ACCESS_RESTRICTED",
      },
    }),
    FaceVerificationController.getTemplate,
  );

  // Update face template
  router.put(
    "/template",
    faceLimiter,
    failedAttemptLimiter,
    updateTemplateValidation,
    validateRequest,
    FaceVerificationController.updateTemplate,
  );

  // Delete face data
  router.delete(
    "/data",
    rateLimit({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 1, // Only 1 deletion per day
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: "Face data deletion is limited to once per day.",
        code: "DELETION_LIMITED",
      },
    }),
    FaceVerificationController.deleteFaceData,
  );

  // Challenge-response for anti-spoofing
  router.post(
    "/challenge",
    faceLimiter,
    FaceVerificationController.getChallenge,
  );

  // Verify challenge response
  router.post(
    "/challenge/verify",
    faceLimiter,
    failedAttemptLimiter,
    [
      body("challengeId")
        .isString()
        .notEmpty()
        .withMessage("Challenge ID is required"),
      body("response")
        .isObject()
        .notEmpty()
        .withMessage("Challenge response is required"),
    ],
    validateRequest,
    FaceVerificationController.verifyChallenge,
  );

  // Compare faces (for duplicate detection)
  router.post(
    "/compare",
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    [
      body("face1")
        .isString()
        .notEmpty()
        .withMessage("First face image is required"),
      body("face2")
        .isString()
        .notEmpty()
        .withMessage("Second face image is required"),
    ],
    validateRequest,
    FaceVerificationController.compareFaces,
  );

  // Get liveness score
  router.get(
    "/liveness/:sessionId",
    faceLimiter,
    FaceVerificationController.getLivenessScore,
  );

  // Export verification report
  router.get(
    "/report/:sessionId",
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    FaceVerificationController.getVerificationReport,
  );

  // Batch verification (for admin)
  router.post(
    "/batch-verify",
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 5,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      skip: (req: any) => req.user?.role !== "admin",
    }),
    [
      body("userIds")
        .isArray({ min: 1, max: 50 })
        .withMessage("User IDs array is required (1-50 users)"),
      body("userIds.*")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Invalid user ID"),
    ],
    validateRequest,
    FaceVerificationController.batchVerify,
  );

  // Get statistics (admin only)
  router.get(
    "/stats",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      skip: (req: any) => req.user?.role !== "admin",
    }),
    FaceVerificationController.getStats,
  );

  // Webhook for external verification services
  router.post(
    "/webhook",
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    [
      body("event")
        .isString()
        .isIn([
          "verification.complete",
          "verification.failed",
          "liveness.detected",
        ])
        .withMessage("Invalid webhook event"),
      body("data")
        .isObject()
        .notEmpty()
        .withMessage("Webhook data is required"),
    ],
    validateRequest,
    FaceVerificationController.handleWebhook,
  );

  // Error handling middleware
  router.use((err: any, req: any, res: any, _next: any) => {
    console.error("Face Verification Router Error:", {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error types
    if (err.type === "entity.too.large") {
      return res.status(413).json({
        error: "Image too large",
        message: "Face image exceeds maximum size limit of 10MB.",
        code: "IMAGE_TOO_LARGE",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        message: err.message,
        code: "VALIDATION_ERROR",
        details: err.details,
      });
    }

    res.status(err.status || 500).json({
      error: "Face verification service error",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err.message,
      code: err.code || "INTERNAL_ERROR",
      requestId: req.id,
    });
  });

  return router;
}

// Export additional middleware for testing
export const middleware = {
  faceLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  failedAttemptLimiter: rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  }),
};
