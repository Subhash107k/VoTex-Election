import type { Response, NextFunction } from "express";
import { Database } from "../src/db/dbService.js";
import { FaceVerificationService } from "../services/faceVerification.service.js";

export function verifyFace(req: any, res: Response, next: NextFunction) {
  const { electionId, faceVerificationId } = req.body || {};

  if (!electionId) {
    return res.status(400).json({
      error: "ELECTION_REQUIRED",
      message: "Election selection is required before voting.",
    });
  }

  const verification = FaceVerificationService.findUsableVerification(
    req.user.id,
    electionId,
    faceVerificationId,
  );

  if (!verification) {
    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Voting rejected for election "${electionId}": live face verification missing or expired`,
      ip,
      req.headers["user-agent"] || "",
    );

    return res.status(403).json({
      error: "FACE_VERIFICATION_REQUIRED",
      message:
        "Live face verification must pass shortly before a ballot can be cast.",
    });
  }

  req.faceVerification = verification;
  next();
}
