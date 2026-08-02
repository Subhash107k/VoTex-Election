import type { Request, Response, NextFunction } from "express";

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  voterId?: string;
}
import { Database } from "../src/db/dbService";
import { FaceVerificationService } from "../services/faceVerification.service";
import { AuditService } from "../services/audit.service";
import { CacheService } from "../services/cache.service";
import { FraudDetectionService } from "../services/fraudDetection.service";

// Extended Request interface
interface FaceVerificationRequest extends Request {
  id?: string;
  user: AuthenticatedUser;
  faceVerification?: {
    id: string;
    sessionId: string;
    verifiedAt: Date;
    matchScore: number;
    livenessScore: number;
    template: number[];
    method: string;
    deviceInfo: any;
    expiresAt: Date;
  };
}

// Configuration constants
const CONFIG = {
  VERIFICATION_EXPIRY: 15 * 60 * 1000, // 15 minutes
  MIN_MATCH_SCORE: 0.85, // 85% minimum match
  MIN_LIVENESS_SCORE: 0.9, // 90% minimum liveness
  MAX_VERIFICATION_AGE: 30 * 60 * 1000, // 30 minutes max age
  RETRY_COOLDOWN: 5 * 60 * 1000, // 5 minutes between retries
  MAX_DAILY_ATTEMPTS: 10,
  SUSPICIOUS_THRESHOLD: 3, // Flag after 3 suspicious activities
};

interface VerificationRequirements {
  requireLiveness: boolean;
  requireDocumentMatch: boolean;
  minimumMatchScore: number;
  minimumLivenessScore: number;
  maxVerificationAge: number;
  requireChallengeResponse: boolean;
}

export async function verifyFace(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authReq = req as FaceVerificationRequest;
  const startTime = Date.now();
  const requestId =
    authReq.id ||
    `vfy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const {
      electionId,
      faceVerificationId,
      requireLiveness = true,
      minimumMatchScore,
      minimumLivenessScore,
    } = req.body || {};

    // Validate election ID
    if (!electionId) {
      return res.status(400).json({
        error: "ELECTION_REQUIRED",
        message: "Election selection is required before voting.",
        code: "ERR_ELECTION_REQUIRED",
        requestId,
      });
    }

    // Check if election exists and is active
    const election = await Database.findElectionById(electionId);
    if (!election) {
      return res.status(404).json({
        error: "ELECTION_NOT_FOUND",
        message: "The specified election does not exist.",
        code: "ERR_ELECTION_NOT_FOUND",
        requestId,
      });
    }

    if (!election.isActive) {
      return res.status(400).json({
        error: "ELECTION_INACTIVE",
        message: "This election is not currently active.",
        code: "ERR_ELECTION_INACTIVE",
        requestId,
      });
    }

    // Get user's IP and device info for security
    const clientIp = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "Unknown";
    const deviceFingerprint = req.headers["x-device-fingerprint"] as string;

    // Check for suspicious activity
    const fraudCheck = await FraudDetectionService.checkUserActivity(
      authReq.user.id,
      clientIp,
      deviceFingerprint,
    );

    if (fraudCheck.isSuspicious) {
      await AuditService.logSecurityEvent({
        userId: authReq.user.id,
        event: "SUSPICIOUS_ACTIVITY_DETECTED",
        details: fraudCheck.reason,
        ip: clientIp,
        userAgent,
        severity: "CRITICAL",
      });

      return res.status(403).json({
        error: "SECURITY_RISK_DETECTED",
        message: "Suspicious activity detected. Please contact support.",
        code: "ERR_SECURITY_RISK",
        requestId,
      });
    }

    // Check rate limiting for verification attempts
    const recentAttempts = await Database.getRecentVerificationAttempts(
      authReq.user.id,
      CONFIG.RETRY_COOLDOWN,
    );
    const recentAttemptCount = Array.isArray(recentAttempts)
      ? recentAttempts.length
      : Number(recentAttempts) || 0;

    if (recentAttemptCount >= CONFIG.MAX_DAILY_ATTEMPTS) {
      return res.status(429).json({
        error: "TOO_MANY_ATTEMPTS",
        message:
          "Maximum verification attempts reached. Please try again later.",
        code: "ERR_RATE_LIMIT",
        retryAfter: Math.ceil(CONFIG.RETRY_COOLDOWN / 60000) + " minutes",
        requestId,
      });
    }

    // Check cache for existing valid verification
    const cachedVerification = await CacheService.get(
      `face_verify:${authReq.user.id}:${electionId}`,
    );

    if (cachedVerification) {
      const parsedCache = JSON.parse(cachedVerification);
      if (isVerificationValid(parsedCache, CONFIG)) {
        authReq.faceVerification = parsedCache;

        // Log successful cache hit
        await AuditService.logVerificationEvent({
          userId: authReq.user.id,
          action: "CACHE_HIT",
          electionId,
          context: {
            ip: clientIp,
            userAgent,
          },
          metadata: {
            verificationId: parsedCache.id,
            status: "CACHE_HIT",
            processingTime: Date.now() - startTime,
          },
        });

        return next();
      }
    }

    // Set verification requirements based on election security level
    const requirements = getVerificationRequirements(election.securityLevel, {
      requireLiveness,
      minimumMatchScore: minimumMatchScore || CONFIG.MIN_MATCH_SCORE,
      minimumLivenessScore: minimumLivenessScore || CONFIG.MIN_LIVENESS_SCORE,
    });

    // Find usable verification
    const verification = await FaceVerificationService.findUsableVerification(
      authReq.user.id,
      electionId,
      faceVerificationId,
      requirements,
    );

    if (!verification) {
      // Determine the reason for failure
      const lastAttempt = await FaceVerificationService.getLastVerification(
        authReq.user.id,
        electionId,
      );

      let errorCode = "FACE_VERIFICATION_REQUIRED";
      let errorMessage = "Live face verification required before voting.";
      let errorDetails: any = {};

      if (lastAttempt) {
        if (
          lastAttempt.expiresAt &&
          new Date(lastAttempt.expiresAt) < new Date()
        ) {
          errorCode = "VERIFICATION_EXPIRED";
          errorMessage =
            "Your face verification has expired. Please re-verify.";
          errorDetails.expiredAt = lastAttempt.expiresAt;
        } else if (lastAttempt.matchScore < requirements.minimumMatchScore) {
          errorCode = "LOW_MATCH_SCORE";
          errorMessage = "Face match score is below required threshold.";
          errorDetails.matchScore = lastAttempt.matchScore;
          errorDetails.requiredScore = requirements.minimumMatchScore;
        } else if (
          requirements.requireLiveness &&
          lastAttempt.livenessScore < requirements.minimumLivenessScore
        ) {
          errorCode = "LIVENESS_CHECK_FAILED";
          errorMessage =
            "Liveness detection failed. Please try again in better lighting.";
          errorDetails.livenessScore = lastAttempt.livenessScore;
          errorDetails.requiredScore = requirements.minimumLivenessScore;
        }
      }

      // Log failed verification attempt
      const ip = clientIp;
      await Database.addAuditLog(
        authReq.user.id,
        authReq.user.email,
        `Voting rejected for election "${electionId}": ${errorMessage}`,
        ip,
        userAgent,
      );

      // Track failed attempt for rate limiting
      await Database.recordVerificationAttempt(
        authReq.user.id,
        electionId,
        false,
      );

      // Check if we should escalate to fraud detection
      const failedCount = await Database.getFailedVerificationCount(
        authReq.user.id,
        CONFIG.SUSPICIOUS_THRESHOLD,
      );

      if (failedCount >= CONFIG.SUSPICIOUS_THRESHOLD) {
        await FraudDetectionService.flagUser(authReq.user.id, {
          reason: "Multiple failed face verifications",
          count: failedCount,
          ip: clientIp,
          userAgent,
        });
      }

      return res.status(403).json({
        error: errorCode,
        message: errorMessage,
        code: `ERR_${errorCode}`,
        details: errorDetails,
        requestId,
        nextSteps: {
          action: "reverify",
          endpoint: "/api/face-verification/start",
          requirements: {
            livenessRequired: requirements.requireLiveness,
            minimumMatchScore: requirements.minimumMatchScore,
            minimumLivenessScore: requirements.minimumLivenessScore,
          },
        },
      });
    }

    // Additional security checks for sensitive elections
    if (
      election.securityLevel === "HIGH" ||
      election.securityLevel === "CRITICAL"
    ) {
      // Verify IP consistency
      if (verification.ipAddress && verification.ipAddress !== clientIp) {
        await AuditService.logSecurityEvent({
          userId: authReq.user.id,
          event: "IP_MISMATCH",
          details: `Verification IP: ${verification.ipAddress}, Current IP: ${clientIp}`,
          ip: clientIp,
          userAgent,
          severity: "WARNING",
        });

        return res.status(403).json({
          error: "IP_MISMATCH",
          message: "Verification must be completed from the same network.",
          code: "ERR_IP_MISMATCH",
          requestId,
        });
      }

      // Verify device fingerprint consistency
      if (
        verification.deviceFingerprint &&
        verification.deviceFingerprint !== deviceFingerprint &&
        election.securityLevel === "CRITICAL"
      ) {
        return res.status(403).json({
          error: "DEVICE_MISMATCH",
          message: "Verification must be completed from the same device.",
          code: "ERR_DEVICE_MISMATCH",
          requestId,
        });
      }
    }

    // Cache successful verification
    await CacheService.set(
      `face_verify:${authReq.user.id}:${electionId}`,
      JSON.stringify(verification),
      Math.floor(CONFIG.VERIFICATION_EXPIRY / 1000), // TTL in seconds
    );

    // Log successful verification
    await AuditService.logVerificationEvent({
      userId: authReq.user.id,
      action: "VERIFICATION_SUCCESS",
      electionId,
      context: {
        ip: clientIp,
        userAgent,
        requestId,
      },
      metadata: {
        verificationId: verification.id,
        status: "SUCCESS",
        matchScore: verification.matchScore,
        livenessScore: verification.livenessScore,
        deviceFingerprint,
        processingTime: Date.now() - startTime,
      },
    });

    // Track successful attempt
    await Database.recordVerificationAttempt(authReq.user.id, electionId, true);

    // Attach verification to request
    authReq.faceVerification = verification;

    // Add security headers
    res.setHeader("X-Verification-Id", verification.id);
    res.setHeader(
      "X-Verification-Expires",
      verification.expiresAt?.toISOString(),
    );
    res.setHeader("X-Verification-Method", verification.method || "standard");

    next();
  } catch (error: any) {
    console.error("Face verification middleware error:", {
      error: error.message,
      stack: error.stack,
      userId: authReq.user?.id,
      electionId: req.body?.electionId,
      requestId,
    });

    // Log critical error
    await AuditService.logSecurityEvent({
      userId: authReq.user?.id,
      event: "VERIFICATION_MIDDLEWARE_ERROR",
      details: error.message,
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "Unknown",
      severity: "CRITICAL",
    });

    return res.status(500).json({
      error: "VERIFICATION_ERROR",
      message: "An unexpected error occurred during face verification.",
      code: "ERR_INTERNAL",
      requestId,
      retry: true,
    });
  }
}

// Helper Functions
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

function isVerificationValid(
  verification: any,
  config: typeof CONFIG,
): boolean {
  if (!verification || !verification.verifiedAt) return false;

  const age = Date.now() - new Date(verification.verifiedAt).getTime();
  if (age > config.MAX_VERIFICATION_AGE) return false;

  if (verification.expiresAt && new Date(verification.expiresAt) < new Date()) {
    return false;
  }

  if (verification.matchScore < config.MIN_MATCH_SCORE) return false;

  return true;
}

function getVerificationRequirements(
  securityLevel: string = "STANDARD",
  overrides: Partial<VerificationRequirements> = {},
): VerificationRequirements {
  const baseRequirements: Record<string, VerificationRequirements> = {
    LOW: {
      requireLiveness: false,
      requireDocumentMatch: false,
      minimumMatchScore: 0.75,
      minimumLivenessScore: 0.7,
      maxVerificationAge: 30 * 60 * 1000, // 30 minutes
      requireChallengeResponse: false,
    },
    STANDARD: {
      requireLiveness: true,
      requireDocumentMatch: false,
      minimumMatchScore: 0.85,
      minimumLivenessScore: 0.85,
      maxVerificationAge: 15 * 60 * 1000, // 15 minutes
      requireChallengeResponse: false,
    },
    HIGH: {
      requireLiveness: true,
      requireDocumentMatch: true,
      minimumMatchScore: 0.9,
      minimumLivenessScore: 0.9,
      maxVerificationAge: 10 * 60 * 1000, // 10 minutes
      requireChallengeResponse: true,
    },
    CRITICAL: {
      requireLiveness: true,
      requireDocumentMatch: true,
      minimumMatchScore: 0.95,
      minimumLivenessScore: 0.95,
      maxVerificationAge: 5 * 60 * 1000, // 5 minutes
      requireChallengeResponse: true,
    },
  };

  const requirements =
    baseRequirements[securityLevel] || baseRequirements.STANDARD;

  return {
    ...requirements,
    ...overrides,
  };
}

// Export types for use in other modules
export type { FaceVerificationRequest, VerificationRequirements };
