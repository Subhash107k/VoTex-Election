import type { Request, Response } from "express";
import { FaceVerificationService } from "../services/faceVerification.service.js";
import {
  matchFaceSchema,
  startFaceVerificationSchema,
  verifyFaceLivenessSchema,
} from "../validators/faceVerification.validator.js";

function requestContext(req: Request) {
  return {
    ipAddress:
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Unknown browser",
  };
}

function handleError(error: unknown, res: Response) {
  const err = error as Error & { status?: number };
  return res.status(err.status || 400).json({
    error: err.message || "Face verification could not be completed.",
  });
}

export class FaceVerificationController {
  static start(req: any, res: Response) {
    try {
      const input = startFaceVerificationSchema.parse(req.body);
      const result = FaceVerificationService.start(
        req.user,
        input.electionId,
        requestContext(req),
      );
      return res.status(201).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  static verify(req: any, res: Response) {
    try {
      const input = verifyFaceLivenessSchema.parse(req.body);
      const result = FaceVerificationService.verifyLiveness(
        req.user,
        input,
        requestContext(req),
      );
      return res.json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  static match(req: any, res: Response) {
    try {
      const input = matchFaceSchema.parse(req.body);
      const result = FaceVerificationService.match(
        req.user,
        input,
        requestContext(req),
      );
      return res.status(result.verificationResult === "Passed" ? 200 : 403).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  static status(req: any, res: Response) {
    try {
      const electionId =
        typeof req.query.electionId === "string" ? req.query.electionId : undefined;
      return res.json(FaceVerificationService.getStatus(req.user, electionId));
    } catch (error) {
      return handleError(error, res);
    }
  }
}
