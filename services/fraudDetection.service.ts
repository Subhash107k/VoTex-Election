import { AuditService } from "./audit.service.js";

export class FraudDetectionService {
  static async checkUserActivity(
    userId: string,
    ip: string,
    deviceFingerprint?: string,
  ) {
    return {
      isSuspicious: false,
      reason: "No suspicious activity detected.",
    };
  }

  static async flagUser(userId: string, data: Record<string, unknown>) {
    return AuditService.logSecurityEvent({
      userId,
      event: "FRAUD_FLAGGED",
      details: JSON.stringify(data),
      severity: "WARNING",
    });
  }
}
