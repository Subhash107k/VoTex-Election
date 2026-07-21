import { Router } from "express";
import rateLimit from "express-rate-limit";
import { FaceVerificationController } from "../controllers/faceVerification.controller.js";

export function createFaceVerificationRouter(authenticateToken: any) {
  const router = Router();

  const faceLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 12,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error:
        "Too many face verification attempts. Please wait before retrying.",
    },
  });

  router.use(authenticateToken, faceLimiter);
  router.post("/start", FaceVerificationController.start);
  router.post("/verify", FaceVerificationController.verify);
  router.post("/match", FaceVerificationController.match);
  router.get("/status", FaceVerificationController.status);

  return router;
}
