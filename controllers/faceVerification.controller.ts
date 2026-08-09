import type { Request, Response } from "express";
import { FaceVerificationService } from "../services/faceVerification.service";
import { AuditService } from "../services/audit.service";
import { SecurityService } from "../services/security.service";
import { CacheService } from "../services/cache.service";
import { NotificationService } from "../services/notification.service";
import {
  startFaceVerificationSchema,
  verifyFaceLivenessSchema,
  matchFaceSchema,
  compareFacesSchema,
  updateTemplateSchema,
  batchVerificationSchema,
} from "../validators/faceVerification.validator";

// Types
interface RequestContext {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
    country?: string;
    city?: string;
  };
  timestamp: number;
  requestId: string;
}

interface VerificationMetrics {
  processingTime: number;
  attempts: number;
  successRate: number;
  averageScore: number;
}

interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// Utility Functions
function requestContext(req: Request): RequestContext {
  return {
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Unknown browser",
    deviceFingerprint: req.headers["x-device-fingerprint"] as string,
    geoLocation: req.headers["x-geo-location"]
      ? JSON.parse(req.headers["x-geo-location"] as string)
      : undefined,
    timestamp: Date.now(),
    requestId:
      (req as any).id ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

function handleError(error: unknown, res: Response, context?: RequestContext) {
  const err = error as Error & {
    status?: number;
    code?: string;
    details?: any;
    retryable?: boolean;
  };

  // Log error with context
  console.error("FaceVerificationController Error:", {
    message: err.message,
    code: err.code,
    status: err.status,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    context: context
      ? {
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date(context.timestamp).toISOString(),
        }
      : undefined,
  });

  // Determine appropriate status code
  const statusCode =
    err.status ||
    (err.message?.includes("not found")
      ? 404
      : err.message?.includes("expired")
        ? 410
        : err.message?.includes("unauthorized")
          ? 401
          : 400);

  // Build error response
  const errorResponse: any = {
    error: err.message || "Face verification could not be completed.",
    code: err.code || "VERIFICATION_ERROR",
    requestId: context?.requestId || "unknown",
    timestamp: new Date().toISOString(),
  };

  // Add retry information if applicable
  if (err.retryable !== false) {
    errorResponse.retry = {
      allowed: true,
      after: "30 seconds",
      maxAttempts: 3,
    };
  }

  // Add validation details if available
  if (err.details) {
    errorResponse.details = err.details;
  }

  // Add documentation link for common errors
  if (statusCode === 400) {
    errorResponse.documentation =
      "https://api.votex.gov/docs/face-verification#errors";
  }

  return res.status(statusCode).json(errorResponse);
}

function extractPaginationParams(req: Request): PaginationParams {
  return {
    page: Math.max(1, parseInt(req.query.page as string) || 1),
    limit: Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 10),
    ),
    sortBy: (req.query.sortBy as string) || "createdAt",
    sortOrder: (req.query.sortOrder as string) === "asc" ? "asc" : "desc",
  };
}

// Main Controller Class
export class FaceVerificationController {
  /**
   * Start a new face verification session
   */
  static async start(req: any, res: Response) {
    const context = requestContext(req);
    const startTime = Date.now();

    try {
      const input = startFaceVerificationSchema.parse({
        ...req.body,
        deviceInfo: context.deviceFingerprint
          ? {
              fingerprint: context.deviceFingerprint,
              userAgent: context.userAgent,
              ipAddress: context.ipAddress,
            }
          : undefined,
      });

      // Check for existing active sessions
      const activeSession = await FaceVerificationService.getActiveSession(
        req.user.id,
        input.electionId,
      );

      if (activeSession) {
        const sessionVerificationId = activeSession.id || activeSession.verificationId;
        await CacheService.set(
          `face_session:${sessionVerificationId}`,
          JSON.stringify({ userId: req.user.id, electionId: input.electionId }),
          900,
        );
        return res.status(200).json({
          message: "Active verification session already exists",
          verificationId: sessionVerificationId,
          session: activeSession,
          warning: "Starting a new session will invalidate the existing one.",
        });
      }

      // Check rate limits
      const canStart = await SecurityService.checkRateLimit(
        req.user.id,
        "face_verification_start",
        { maxAttempts: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
      );

      if (!canStart.allowed) {
        return res.status(429).json({
          error: "Too many verification attempts",
          retryAfter: Math.ceil(canStart.retryAfter / 1000) + " seconds",
          code: "RATE_LIMIT_EXCEEDED",
          requestId: context.requestId,
        });
      }

      // Start verification session
      const result = await FaceVerificationService.start(
        req.user,
        input.electionId,
        context,
      );

      // Log audit
      await AuditService.logVerificationEvent({
        userId: req.user.id,
        action: "VERIFICATION_STARTED",
        electionId: input.electionId,
        context,
        metadata: {
          verificationId: result.verificationId,
          processingTime: Date.now() - startTime,
          deviceInfo: context.deviceFingerprint ? "provided" : "not_provided",
        },
      });

      // Set cache for quick access
      await CacheService.set(
        `face_session:${result.verificationId}`,
        JSON.stringify({ userId: req.user.id, electionId: input.electionId }),
        900, // 15 minutes TTL
      );

      console.log(`[FACE] start verificationId: ${result.verificationId} for userId: ${req.user.id}`);

      return res.status(201).json({
        success: true,
        ...result,
        instructions: {
          nextStep: "Capture face image",
          timeoutSeconds: 900,
        },
        expiresIn: "15 minutes",
        requestId: context.requestId,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Verify face with liveness detection
   */
  static async verify(req: any, res: Response) {
    const context = requestContext(req);
    const startTime = Date.now();

    try {
      const input = verifyFaceLivenessSchema.parse(req.body);
      console.log(`[FACE] verify verificationId: ${input.verificationId} for userId: ${req.user.id}`);

      // Validate or auto-recover session
      let sessionData = await CacheService.get(
        `face_session:${input.verificationId}`,
      );
      if (!sessionData) {
        sessionData = JSON.stringify({
          userId: req.user.id,
          electionId: input.electionId,
        });
        await CacheService.set(
          `face_session:${input.verificationId}`,
          sessionData,
          900,
        );
      }

      const session = JSON.parse(sessionData);
      if (session.userId !== req.user.id) {
        await SecurityService.logSecurityViolation({
          userId: req.user.id,
          type: "SESSION_MISMATCH",
          details: "Attempted to use another user's verification session",
          severity: "HIGH",
          context,
        });

        return res.status(403).json({
          error: "Invalid verification session",
          code: "SESSION_MISMATCH",
          requestId: context.requestId,
        });
      }

      // Perform liveness verification
      const result = await FaceVerificationService.verifyLiveness(
        req.user,
        input,
        context,
      );

      // Update cache with verification status
      await CacheService.set(
        `face_session:${input.verificationId}`,
        JSON.stringify({
          ...session,
          verified: result.passed,
          verifiedAt: new Date().toISOString(),
        }),
        900,
      );

      // Cache verification result for voting middleware
      if (result.passed) {
        await CacheService.set(
          `face_verify:${req.user.id}:${session.electionId}`,
          JSON.stringify({
            id: input.verificationId,
            sessionId: input.verificationId,
            verifiedAt: new Date().toISOString(),
            matchScore: 0,
            livenessScore: 0,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            method: "live_capture",
          }),
          900,
        );
      }

      // Log audit
      await AuditService.logVerificationEvent({
        userId: req.user.id,
        action: result.passed ? "LIVENESS_VERIFIED" : "LIVENESS_FAILED",
        sessionId: input.verificationId,
        electionId: session.electionId,
        context,
        metadata: {
          processingTime: Date.now() - startTime,
          status: result.passed ? "passed" : "failed",
          message: result.message,
        },
      });

      // Send notification for failed attempts
      if (!result.passed) {
        await NotificationService.sendSecurityAlert(req.user.id, {
          type: "VERIFICATION_FAILED",
          message: "Face verification attempt was unsuccessful",
          details: {
            reason: result.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return res.status(result.passed ? 200 : 422).json({
        ...result,
        requestId: context.requestId,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Match face with document photo or stored template
   */
  static async match(req: any, res: Response) {
    const context = requestContext(req);
    const startTime = Date.now();

    try {
      const input = matchFaceSchema.parse(req.body);
      console.log(`[FACE] match verificationId: ${input.verificationId} for userId: ${req.user.id}`);

      // Check for too many failed match attempts
      const recentFailures = await SecurityService.getRecentFailures(
        req.user.id,
        "face_match",
        3600000, // 1 hour
      );

      if (recentFailures >= 3) {
        return res.status(429).json({
          error: "Too many failed match attempts",
          retryAfter: "1 hour",
          code: "MATCH_RATE_LIMITED",
          requestId: context.requestId,
        });
      }

      // Perform face matching
      const result = await FaceVerificationService.match(
        req.user,
        input,
        context,
      );

      // Determine status code based on result
      const statusCode = result.verificationResult === "Passed" ? 200 : 403;

      // Log audit
      await AuditService.logVerificationEvent({
        userId: req.user.id,
        action: `FACE_MATCH_${result.verificationResult.toUpperCase()}`,
        context,
        metadata: {
          processingTime: Date.now() - startTime,
          matchScore: result.similarityScore,
          verificationResult: result.verificationResult,
          documentMatched: !!input.documentImage,
        },
      });

      // If passed, update user's verification status
      if (result.verificationResult === "Passed") {
        await SecurityService.updateVerificationStatus(req.user.id, {
          faceVerified: true,
          faceVerifiedAt: new Date(),
          faceMatchScore: result.similarityScore,
        });
      }

      return res.status(statusCode).json({
        ...result,
        requestId: context.requestId,
        processingTime: Date.now() - startTime,
        nextSteps:
          result.verificationResult === "Failed"
            ? {
                action: "retry_or_contact_support",
                retryAfter: "5 minutes",
                supportContact: "support@votex.gov",
              }
            : undefined,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Get verification status
   */
  static async status(req: any, res: Response) {
    const context = requestContext(req);

    try {
      const electionId =
        typeof req.query.electionId === "string"
          ? req.query.electionId
          : undefined;

      const status = await FaceVerificationService.getStatus(
        req.user,
        electionId,
      );

      // Add additional context
      const enrichedStatus = {
        ...status,
        metadata: {
          checkedAt: new Date().toISOString(),
          verificationRequired: !status.verified,
          expiresIn: status.expiresAt
            ? Math.max(
                0,
                Math.floor(
                  (new Date(status.expiresAt).getTime() - Date.now()) / 1000,
                ),
              )
            : null,
        },
        recommendations: !status.verified
          ? {
              action: "complete_verification",
              startEndpoint: "/api/face-verification/start",
              estimatedTime: "2-3 minutes",
            }
          : undefined,
        requestId: context.requestId,
      };

      return res.json(enrichedStatus);
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Get verification history
   */
  static async history(req: any, res: Response) {
    const context = requestContext(req);
    const pagination = extractPaginationParams(req);

    try {
      const history = await FaceVerificationService.getHistory(req.user.id);
      const items = Array.isArray(history) ? history : [];

      // Calculate metrics
      const metrics: VerificationMetrics = {
        processingTime: 0,
        attempts: items.length,
        successRate:
          items.length > 0
            ? (items.filter((h: any) => h.verificationStatus === "Verified")
                .length /
                items.length) *
              100
            : 0,
        averageScore:
          items.length > 0
            ? items.reduce(
                (acc: number, h: any) => acc + (h.similarityScore || 0),
                0,
              ) / items.length
            : 0,
      };

      return res.json({
        items,
        metrics,
        pagination: {
          currentPage: pagination.page,
          totalPages: Math.ceil(items.length / pagination.limit),
          limit: pagination.limit,
          total: items.length,
        },
        requestId: context.requestId,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Compare two faces for similarity
   */
  static async compareFaces(req: any, res: Response) {
    const context = requestContext(req);

    try {
      const input = compareFacesSchema.parse(req.body);

      const result = await FaceVerificationService.compareFaces(
        req.user,
        input.face1,
        input.face2,
      );

      return res.json({
        ...result,
        requestId: context.requestId,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Get face template (secured)
   */
  static async getTemplate(req: any, res: Response) {
    const context = requestContext(req);

    try {
      // Additional security check
      const hasPermission = await SecurityService.checkPermission(
        req.user.id,
        "face_template:read",
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: "Insufficient permissions to access face template",
          code: "PERMISSION_DENIED",
          requestId: context.requestId,
        });
      }

      const template = await FaceVerificationService.getTemplate(req.user.id);

      return res.json({
        template,
        metadata: {
          lastUpdated: new Date().toISOString(),
          algorithm: "FaceNet v3",
          dimensions: template ? template.length : 128,
        },
        requestId: context.requestId,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Update face template
   */
  static async updateTemplate(req: any, res: Response) {
    const context = requestContext(req);

    try {
      const input = updateTemplateSchema.parse(req.body);

      // Verify current template before update
      const currentTemplate = await FaceVerificationService.getTemplate(
        req.user.id,
      );
      if (currentTemplate && (currentTemplate as any).updatedAt) {
        const lastUpdate = new Date((currentTemplate as any).updatedAt).getTime();
        const cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (Date.now() - lastUpdate < cooldownPeriod) {
          return res.status(429).json({
            error: "Template can only be updated once every 7 days",
            nextAvailableUpdate: new Date(
              lastUpdate + cooldownPeriod,
            ).toISOString(),
            code: "UPDATE_COOLDOWN",
            requestId: context.requestId,
          });
        }
      }

      const result = await FaceVerificationService.updateTemplate(
        req.user.id,
        input.faceTemplate,
      );

      // Log template update
      await AuditService.logSecurityEvent({
        userId: req.user.id,
        event: "FACE_TEMPLATE_UPDATED",
        severity: "WARNING",
      });

      return res.json({
        success: result,
        requestId: context.requestId,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Delete face data (GDPR compliance)
   */
  static async deleteFaceData(req: any, res: Response) {
    const context = requestContext(req);

    try {
      // Require additional confirmation
      const { confirmation, reason } = req.body;

      if (confirmation !== "DELETE_MY_FACE_DATA") {
        return res.status(400).json({
          error:
            "Please confirm deletion by sending the exact confirmation phrase",
          code: "CONFIRMATION_REQUIRED",
          requestId: context.requestId,
        });
      }

      await FaceVerificationService.deleteFaceData(req.user.id);

      // Log deletion
      await AuditService.logSecurityEvent({
        userId: req.user.id,
        event: "FACE_DATA_DELETED",
        details: reason,
        severity: "ERROR",
      });

      // Clear caches
      await CacheService.deletePattern(`face_*:${req.user.id}*`);

      return res.json({
        message: "Face data successfully deleted",
        deletedAt: new Date().toISOString(),
        requestId: context.requestId,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Batch verification (admin only)
   */
  static async batchVerify(req: any, res: Response) {
    const context = requestContext(req);

    try {
      // Verify admin permissions
      if (req.user.role !== "admin") {
        return res.status(403).json({
          error: "Admin access required",
          code: "ADMIN_REQUIRED",
          requestId: context.requestId,
        });
      }

      const input = batchVerificationSchema.parse(req.body);

      const results = await FaceVerificationService.batchVerify(
        input.userIds.map((userId: string) => ({
          userId,
          electionId: input.electionId,
        })),
      );

      return res.json({
        results,
        summary: {
          total: input.userIds.length,
          verified: results.filter((r: any) => r.passed).length,
          failed: results.filter((r: any) => !r.passed).length,
        },
        requestId: context.requestId,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  /**
   * Get verification statistics (admin only)
   */
  static async getStats(req: any, res: Response) {
    const context = requestContext(req);

    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          error: "Admin access required",
          code: "ADMIN_REQUIRED",
          requestId: context.requestId,
        });
      }

      const stats = await FaceVerificationService.getStats();

      return res.json({
        ...stats,
        generatedAt: new Date().toISOString(),
        requestId: context.requestId,
      });
    } catch (error) {
      return handleError(error, res, context);
    }
  }

  // Challenge endpoints (stubs)
  static async getChallenge(req: any, res: Response) {
    const challengeId = `challenge_${Date.now()}`;
    return res.json({
      challengeId,
      prompt: "Please follow the on-screen instructions (blink & turn head).",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }

  static async verifyChallenge(req: any, res: Response) {
    // Minimal verification stub for development
    return res.json({
      success: true,
      message: "Challenge verified (dev-stub)",
    });
  }

  static async getLivenessScore(req: any, res: Response) {
    const sessionId = req.params.sessionId;
    return res.json({
      sessionId,
      livenessScore: 0.95,
      evaluatedAt: new Date().toISOString(),
    });
  }

  static async getVerificationReport(req: any, res: Response) {
    const sessionId = req.params.sessionId;
    return res.json({
      sessionId,
      report: { summary: "No detailed report in dev" },
    });
  }

  static async handleWebhook(req: any, res: Response) {
    // Accept external webhook payloads in dev
    console.info("Received verification webhook", req.body);
    return res.status(200).json({ received: true });
  }
}
