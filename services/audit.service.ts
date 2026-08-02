import { Database } from "../src/db/dbService.js";

export type AuditEventContext = {
  ip?: string;
  userAgent?: string;
  requestId?: string;
};

export type AuditMetadata = Record<string, unknown>;

export class AuditService {
  static async logVerificationEvent(payload: {
    userId: string;
    action: string;
    sessionId?: string;
    electionId?: string;
    context?: AuditEventContext;
    metadata?: AuditMetadata;
  }) {
    const details = JSON.stringify({
      ...(payload.metadata || {}),
      sessionId: payload.sessionId,
      electionId: payload.electionId,
    });

    return Database.addAuditLog(
      payload.userId,
      payload.userId,
      payload.action,
      payload.context?.ip || "127.0.0.1",
      payload.context?.userAgent || "Unknown",
      details,
    );
  }

  static async logSecurityEvent(payload: {
    userId: string;
    event: string;
    details?: string;
    ip?: string;
    userAgent?: string;
    severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  }) {
    const audit = await Database.addAuditLog(
      payload.userId,
      payload.userId,
      payload.event,
      payload.ip || "127.0.0.1",
      payload.userAgent || "Unknown",
      payload.details || payload.event,
    );

    if (audit && payload.severity) {
      await Database.updateOne(
        "audit_logs",
        { id: audit.id },
        { $set: { severity: payload.severity } },
      );
    }

    return audit;
  }
}
