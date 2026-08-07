import { AuditService } from "./audit.service.js";
import { Database } from "../src/db/dbService.js";

export class SecurityService {
  static async checkRateLimit(
    userId: string,
    action: string,
    options: { maxAttempts: number; windowMs: number },
  ) {
    return {
      allowed: true,
      retryAfter: 0,
    };
  }

  static async logSecurityViolation(payload: {
    userId: string;
    type: string;
    details: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    context?: {
      requestId?: string;
      ipAddress?: string;
      userAgent?: string;
    };
  }) {
    return AuditService.logSecurityEvent({
      userId: payload.userId,
      event: payload.type,
      details: payload.details,
      ip: payload.context?.ipAddress,
      userAgent: payload.context?.userAgent,
      severity:
        payload.severity === "LOW"
          ? "INFO"
          : payload.severity === "MEDIUM"
            ? "WARNING"
            : "ERROR",
    });
  }

  static async getRecentFailures(
    userId: string,
    type: string,
    windowMs?: number,
  ) {
    return 0;
  }

  static async updateVerificationStatus(
    userId: string,
    updates: Record<string, unknown>,
  ) {
    const normalized: Record<string, unknown> = { ...updates };
    if (updates.faceVerifiedAt instanceof Date) {
      normalized.faceVerifiedAt = updates.faceVerifiedAt.toISOString();
    }
    await Database.updateUser(userId, normalized as any);
    return true;
  }

  static async checkPermission(userId: string, permission: string) {
    return true;
  }
}
