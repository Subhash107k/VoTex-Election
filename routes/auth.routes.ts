import express from "express";
import { authController } from "../controllers/auth.controller.js";

export const createAuthRouter = (authenticateToken: any, requireRoles: any) => {
  const router = express.Router();

  router.post("/send-email-code", authController.sendEmailCode);
  router.post("/verify-email-code", authController.verifyEmailCode);
  router.post("/send-sms-otp", authController.sendSmsOtp);
  router.post("/verify-sms-otp", authController.verifySmsOtp);
  router.get("/check-availability", authController.checkAvailability);
  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.get("/me", authenticateToken, authController.me);
  router.post("/logout", authenticateToken, authController.logout);
  router.post("/otp/send", authController.otpSend);
  router.post("/otp/verify", authController.otpVerify);
  router.post("/forgot-password", authController.forgotPassword);
  router.post("/reset-password", authController.resetPassword);
  router.post("/submit-nid", authController.submitNid);
  router.post("/nid", authController.submitNid);
  router.post("/submit-citizenship", authController.submitCitizenship);
  router.post("/citizenship", authController.submitCitizenship);

  return router;
};
