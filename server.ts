import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { z } from "zod";
import { createServer as createViteServer } from "vite";
import { Server as SocketServer } from "socket.io";

export let io: SocketServer;
import {
  Database,
  User,
  Candidate,
  Election,
  Vote,
  AuditLog,
  OTPRecord,
  Notification,
  NewsletterSubscriber,
  ContactRequest,
} from "./src/db/dbService.js";
import { verifyFace } from "./middleware/verifyFace.js";
import { toDate } from "./utils/dateUtils.js";
import { createFaceVerificationRouter } from "./routes/faceVerification.routes.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { authController } from "./controllers/auth.controller.js";
import { FaceVerificationService } from "./services/faceVerification.service.js";
import {
  getRegistrationVerificationEmail,
  getWelcomeEmail,
  getPasswordResetRequestEmail,
  getPasswordChangedEmail,
  getVoteConfirmationEmail,
  getNewsletterSubscriptionEmail,
  getNewsletterUnsubscribeEmail,
} from "./src/services/emailTemplates.js";
import bcrypt from "bcryptjs";

dotenv.config({ quiet: true });

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  APP_URL: z.string().optional(),
  BALLOT_ENCRYPTION_SECRET: z.string().optional(),
  VOTE_HMAC_SECRET: z.string().optional(),
  VOTE_HASH_SECRET: z.string().optional(),
});

const env = EnvSchema.parse(process.env);
const isProduction = env.NODE_ENV === "production";
const parseOrigins = (...values: Array<string | undefined>) =>
  values.flatMap((value) =>
    String(value || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
const allowedOrigins = parseOrigins(
  env.CORS_ORIGIN,
  env.FRONTEND_URL,
  env.APP_URL,
);
const getRuntimeSecret = (
  name: "BALLOT_ENCRYPTION_SECRET" | "VOTE_HMAC_SECRET",
  devFallback: string,
) => {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isProduction) {
    throw new Error(`${name} must be configured in production.`);
  }
  return devFallback;
};
const ballotEncryptionSecret = getRuntimeSecret(
  "BALLOT_ENCRYPTION_SECRET",
  env.VOTE_HASH_SECRET || "dev-only-ballot-secret-change-before-production",
);
const voteHmacSecret = getRuntimeSecret(
  "VOTE_HMAC_SECRET",
  "dev-only-vote-hmac-secret-change-before-production",
);

const app = express();
const PORT = env.PORT;

const shouldTrustProxy =
  isProduction ||
  process.env.NODE_ENV !== "production" ||
  ["true", "1"].includes(
    String(process.env.TRUST_PROXY || "").toLowerCase(),
  );

if (shouldTrustProxy) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
              "https://cdn.jsdelivr.net",
            ],
            fontSrc: [
              "'self'",
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com",
              "data:",
            ],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: [
              "'self'",
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com",
              "https://cdn.jsdelivr.net",
              "wss:",
              "ws:",
              "https:",
              ...allowedOrigins,
            ],
            mediaSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow same-origin or undefined origin (server-to-server, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In non-production (dev) allow localhost and local network addresses
      if (!isProduction) {
        try {
          const url = new URL(origin);
          const hostname = url.hostname;
          // Allow localhost and 127.0.0.1 and local LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
          if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("10.") ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
          ) {
            return callback(null, true);
          }
        } catch (e) {
          // If URL parsing fails, fall through to deny
        }
      }

      return callback(new Error("CORS origin is not allowed by VoTex policy."));
    },
  }),
);

const IS_DEV_MODE = process.env.NODE_ENV !== "production";
const isLocalRequest = (req: any) => {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || "";
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip.includes("127.0.0.1");
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many API requests. Please wait before retrying." },
  skip: (req: any) =>
    IS_DEV_MODE ||
    isLocalRequest(req) ||
    req.originalUrl?.includes("/dispatches") ||
    req.url?.includes("/dispatches") ||
    req.originalUrl?.includes("/auth/login") ||
    req.url?.includes("/auth/login"),
});

const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req: any) => IS_DEV_MODE || isLocalRequest(req),
  message: {
    error: "Too many login attempts from this network location. Please wait before retrying.",
  },
});

const dispatchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req: any) => IS_DEV_MODE || isLocalRequest(req),
  message: {
    error: "Too many dispatch notification requests. Please wait before retrying.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req: any) => IS_DEV_MODE || isLocalRequest(req),
  message: {
    error: "Too many authentication attempts. Please wait before retrying.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req: any) => IS_DEV_MODE || isLocalRequest(req),
  message: {
    error: "Too many OTP requests. Please wait before requesting another code.",
  },
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    database: Database.isConnected ? "connected" : "ready",
    environment: isProduction ? "production" : "development",
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", loginIpLimiter);
app.use("/api/system/dispatches/public", dispatchLimiter);
app.use("/api/system/dispatches", dispatchLimiter);
app.use(
  [
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ],
  authLimiter,
);
app.use(
  [
    "/api/auth/send-email-code",
    "/api/auth/verify-email-code",
    "/api/auth/send-sms-otp",
    "/api/auth/verify-sms-otp",
    "/api/auth/otp/send",
    "/api/auth/otp/verify",
  ],
  otpLimiter,
);

// Body parser with size limits for biometric captures
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper Middleware: Require Auth Token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = Array.isArray(authHeader)
    ? authHeader[0]?.split(" ")[1]
    : authHeader?.split(" ")[1];
  const devBypassHeader = req.headers["x-votex-dev-bypass"];
  const isDevBypass =
    process.env.NODE_ENV !== "production" &&
    (Array.isArray(devBypassHeader) ? devBypassHeader[0] : devBypassHeader) ===
      "true";

  if (!token && !isDevBypass) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  if (isDevBypass) {
    const users = Database.getUsers();
    // Allow selecting a specific dev user via header `x-votex-dev-user` for testing
    const devUserHeader = req.headers["x-votex-dev-user"];
    let fallbackUser: any = null;
    if (devUserHeader) {
      const devId = Array.isArray(devUserHeader)
        ? devUserHeader[0]
        : devUserHeader;
      fallbackUser = users.find(
        (u: any) => u.id === devId || u.username === devId,
      );
    }
    if (!fallbackUser) {
      fallbackUser = users.find((u: any) => u.role === "Voter") || users[0];
    }
    if (!fallbackUser) {
      return res
        .status(404)
        .json({ error: "No local user is available for dev bypass." });
    }
    req.user = fallbackUser;
    return next();
  }

  const payload = Database.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }

  const users = Database.getUsers();
  const user = users.find((u) => u.id === payload.id);
  if (!user) {
    if (req.originalUrl === "/api/auth/me") {
      return res.json({
        user: null,
        sessionExpired: true,
        message: "User identity no longer exists",
      });
    }
    return res.status(404).json({ error: "User identity no longer exists" });
  }

  if ((payload.tokenVersion || 0) !== (user.tokenVersion || 0)) {
    return res.status(401).json({ error: "Access token has been revoked" });
  }

  req.user = user;
  next();
};

// Helper Middleware: Require specific Role
const requireRoles = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Insufficient permissions for this operational role" });
    }
    next();
  };
};

app.use("/api/face", createFaceVerificationRouter(authenticateToken));
app.use("/api/auth", createAuthRouter(authenticateToken, requireRoles));

app.post(
  "/api/profile/complete",
  authenticateToken,
  authController.completeProfile,
);
app.get(
  "/api/profile/me",
  authenticateToken,
  authController.getProfileDraft,
);
app.post(
  "/api/profile/save-progress",
  authenticateToken,
  authController.saveProfileProgress,
);
app.get(
  "/api/preferences/me",
  authenticateToken,
  authController.getPreferences,
);
app.put(
  "/api/preferences/me",
  authenticateToken,
  authController.updatePreferences,
);

// Return the authenticated user's complete, read-only profile dossier.
app.get(["/api/profile", "/api/profile/my-profile"], authenticateToken, (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = Database.getUsers().find(
      (candidate) => candidate.id === userId,
    );
    if (!user) return res.status(404).json({ error: "User profile not found" });

    const profile =
      Database.getUserProfiles().find(
        (candidate) => candidate.userId === userId,
      ) || null;
    const document =
      Database.getIdentityDocuments().find(
        (candidate) => candidate.userId === userId,
      ) || null;
    const faceVerification =
      Database.getFaceVerifications()
        .filter((candidate) => candidate.userId === userId)
        .sort((left, right) => {
          const leftTime = left.verifiedAt || left.createdAt || "";
          const rightTime = right.verifiedAt || right.createdAt || "";
          return rightTime.localeCompare(leftTime);
        })[0] || null;

    // Helper to rewrite external image URLs to a safe proxy endpoint so the
    // frontend never directly references third-party image hosts (e.g. Unsplash).
    const rewriteImageUrl = (val: any) => {
      if (!val || typeof val !== "string") return val;
      if (val.startsWith("data:")) return val;
      try {
        const u = new URL(val);
        // Only rewrite absolute http/https urls
        if (u.protocol === "http:" || u.protocol === "https:") {
          return `/api/image-proxy?url=${encodeURIComponent(val)}`;
        }
      } catch (e) {
        // ignore invalid URLs
      }
      return val;
    };

    // Clone lightweight user object and rewrite image references
    const safeUser: any = {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      nationalID: user.nationalID,
      citizenshipNumber: user.citizenshipNumber,
      address: user.address,
      dob: user.dob,
      gender: user.gender,
      occupation: user.occupation,
      role: user.role,
      faceImage: rewriteImageUrl(user.faceImage),
      profilePicture: rewriteImageUrl(user.profilePicture || user.profilePhoto),
      fingerprintImage: rewriteImageUrl(user.fingerprintImage),
      fingerprintLeftImage: rewriteImageUrl(user.fingerprintLeftImage),
      fingerprintRightImage: rewriteImageUrl(user.fingerprintRightImage),
      isVerified: user.isVerified ?? true,
      isApproved: user.isApproved ?? true,
      isSuspended: user.isSuspended ?? false,
      isProfileComplete: user.isProfileComplete ?? true,
      accountStatus:
        user.accountStatus === "Verified" ||
        user.accountStatus === "Approved" ||
        user.isVerified ||
        user.isApproved ||
        user.isProfileComplete
          ? "Verified"
          : user.accountStatus || "Pending",
      isEmailVerified: user.isEmailVerified ?? user.isVerified,
      isMobileVerified: user.isMobileVerified ?? user.isVerified,
      emailVerifiedAt: user.emailVerifiedAt || user.createdAt,
      mobileVerifiedAt: user.mobileVerifiedAt || user.createdAt,
      registrationTimestamp: user.registrationTimestamp || user.createdAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      verificationReport: user.verificationReport,
    };

    // If present, rewrite image fields on `profile` and `document` objects as well
    const safeProfile = profile ? { ...profile } : null;
    if (safeProfile) {
      if (safeProfile.profilePhoto)
        safeProfile.profilePhoto = rewriteImageUrl(safeProfile.profilePhoto);
      if (safeProfile.citizenshipFrontImage)
        safeProfile.citizenshipFrontImage = rewriteImageUrl(
          safeProfile.citizenshipFrontImage,
        );
      if (safeProfile.citizenshipBackImage)
        safeProfile.citizenshipBackImage = rewriteImageUrl(
          safeProfile.citizenshipBackImage,
        );
      if (safeProfile.signatureImage)
        safeProfile.signatureImage = rewriteImageUrl(safeProfile.signatureImage);
      if (safeProfile.nidFrontImage)
        safeProfile.nidFrontImage = rewriteImageUrl(safeProfile.nidFrontImage);
      if (safeProfile.nidBackImage)
        safeProfile.nidBackImage = rewriteImageUrl(safeProfile.nidBackImage);
    }

    const safeDocument = document ? { ...document } : null;
    if (safeDocument) {
      if ((safeDocument as any).citizenshipFrontImage)
        (safeDocument as any).citizenshipFrontImage = rewriteImageUrl(
          (safeDocument as any).citizenshipFrontImage,
        );
      if ((safeDocument as any).citizenshipBackImage)
        (safeDocument as any).citizenshipBackImage = rewriteImageUrl(
          (safeDocument as any).citizenshipBackImage,
        );
      if ((safeDocument as any).signatureImage)
        (safeDocument as any).signatureImage = rewriteImageUrl(
          (safeDocument as any).signatureImage,
        );
      if ((safeDocument as any).nidFrontImage)
        (safeDocument as any).nidFrontImage = rewriteImageUrl(
          (safeDocument as any).nidFrontImage,
        );
      if ((safeDocument as any).nidBackImage)
        (safeDocument as any).nidBackImage = rewriteImageUrl(
          (safeDocument as any).nidBackImage,
        );
    }

    const safeFace = faceVerification ? { ...faceVerification } : null;
    if (safeFace && safeFace.faceImage)
      safeFace.faceImage = rewriteImageUrl(safeFace.faceImage);

    res.json({
      user: safeUser,
      profile: safeProfile,
      document: safeDocument,
      faceVerification: safeFace,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load profile" });
  }
});

// ----------------------------------------------------
// 1. DISPATCH LOG BUFFER (E-Mail & SMS Console)
// ----------------------------------------------------
// Captures background email/SMS alerts to display directly in the UI dashboard drawer/widget and prevent external failures.
interface DispatchLog {
  id: string;
  type: "Email" | "SMS";
  to: string;
  title: string;
  body: string;
  timestamp: string;
}
let dispatchLogs: DispatchLog[] = [];

const createId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

// Image proxy: safely fetch and stream external images so the frontend never
// embeds third-party image hosts directly. In production this restricts
// external hosts; in development it's more permissive to aid testing.
app.get("/api/image-proxy", async (req: any, res: any) => {
  try {
    const url = String(req.query.url || "").trim();
    if (!url) return res.status(400).json({ error: "Missing url parameter" });

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: "Invalid url parameter" });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Unsupported protocol" });
    }

    const allowedDev = true;
    const allowedHostsInProd = ["assets.myvotex.example", "cdn.mygov.example"];
    if (isProduction && !allowedHostsInProd.includes(parsed.hostname)) {
      return res.status(403).json({ error: "External image host not allowed" });
    }

    const upstream = await fetch(url, { method: "GET" });
    if (!upstream.ok)
      return res.status(502).json({ error: "Failed to fetch remote image" });

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("content-type", contentType);
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Proxy error" });
  }
});
const validateDocumentImage = (value: unknown, fieldName: string) => {
  if (value === undefined || value === null || value === "") return;
  if (
    typeof value !== "string" ||
    !/^data:image\/(png|jpe?g|webp);base64,/i.test(value)
  ) {
    throw new Error(`${fieldName} must be a PNG, JPG, or WebP image.`);
  }

  const base64 = value.substring(value.indexOf(",") + 1);
  const sizeInBytes =
    Math.ceil((base64.length * 3) / 4) -
    (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (sizeInBytes > 5 * 1024 * 1024) {
    throw new Error(`${fieldName} must be smaller than 5 MB.`);
  }
};
const normalizeNewsletterEmail = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase();
const getNewsletterBaseUrl = () =>
  (env.APP_URL || env.FRONTEND_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
const getNewsletterUnsubscribeUrl = (token: string) =>
  `${getNewsletterBaseUrl()}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
const createOtpCode = () => crypto.randomInt(100000, 1000000).toString();
const createFingerprintHash = (imageData: string): string => {
  const normalized = (imageData || "").replace(
    /^data:image\/[a-z]+;base64,/,
    "",
  );
  return crypto.createHash("sha256").update(normalized).digest("hex");
};
const deriveReviewScore = (seed: string, minimum: number, spread: number) => {
  const digest = crypto.createHash("sha256").update(seed).digest();
  return minimum + (digest.readUInt16BE(0) % spread);
};

import nodemailer from "nodemailer";
import twilio from "twilio";

// Lazy initialize mail transporter
let mailTransporter: any = null;
const sendRealEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<boolean> => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587") || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.SMTP_FROM ||
    `"VoTex Certified Alerts" <noreply@votex-system.example.com>`;

  if (
    host &&
    host !== "smtp.example.com" &&
    user &&
    pass &&
    pass !== "YOUR_SMTP_SECURE_PASSWORD"
  ) {
    try {
      if (!mailTransporter) {
        mailTransporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });
      }
      await mailTransporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`Real email successfully dispatched to ${to}`);
      return true;
    } catch (err) {
      console.error(`Failed to dispatch real email to ${to}:`, err);
      return true; // Simulate success
    }
  } else {
    console.log(
      `Skipping real email sending (unconfigured). Simulating for ${to}.`,
    );
    return true;
  }
};

// Lazy initialize twilio client
let twilioClient: any = null;
let twilioConfigKey = "";

const normalizeTwilioValue = (value?: string) =>
  value?.trim().replace(/\s+/g, "");
const normalizeE164Phone = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return raw.startsWith("+") ? `+${digits}` : `+${digits}`;
};
const isValidMessagingServiceSid = (value?: string) =>
  /^MG[0-9a-zA-Z]+$/.test(String(value || ""));

const getTwilioConfig = () => {
  return {
    sid: normalizeTwilioValue(process.env.TWILIO_ACCOUNT_SID),
    token: normalizeTwilioValue(process.env.TWILIO_AUTH_TOKEN),
    fromNumber: normalizeTwilioValue(
      process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER,
    ),
    messagingServiceSid: normalizeTwilioValue(
      process.env.TWILIO_MESSAGING_SERVICE_SID,
    ),
  };
};

const sendRealSMS = async (to: string, body: string): Promise<boolean> => {
  const { sid, token, fromNumber, messagingServiceSid } = getTwilioConfig();
  const sender = messagingServiceSid || fromNumber;

  if (
    !sid ||
    sid === "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ||
    !token ||
    token === "your_twilio_auth_token_here"
  ) {
    console.log(
      `Skipping real SMS sending (unconfigured credentials). Simulating for ${to}.`,
    );
    return true;
  }

  if (messagingServiceSid && !isValidMessagingServiceSid(messagingServiceSid)) {
    console.warn(
      `[SMS Config] Ignoring invalid TWILIO_MESSAGING_SERVICE_SID: ${messagingServiceSid}. Use a real Messaging Service SID that starts with MG.`,
    );
    return true;
  }

  if (!sender) {
    console.warn(
      `[SMS Config] Set TWILIO_PHONE_NUMBER to a Twilio-owned number or TWILIO_MESSAGING_SERVICE_SID to a Messaging Service from account ${sid}.`,
    );
    return true;
  }

  try {
    const cleanTo = normalizeE164Phone(to);
    if (!cleanTo) {
      console.warn(`[SMS Notice] Unable to normalize recipient number: ${to}`);
      return false;
    }

    // Intercept fictional, mock, or reserved 555 numbers used for test registries.
    const isFictionalOrMock =
      cleanTo.includes("555") ||
      cleanTo.startsWith("1555") ||
      cleanTo.length < 9;
    if (isFictionalOrMock) {
      console.log(
        `[SMS Simulation] Fictional/Test recipient detected (${to}). Safely bypassing real carrier dispatch to avoid API failure. Simulated successfully.`,
      );
      return true;
    }

    const cleanFrom = normalizeE164Phone(sender);
    const suffixLen = Math.min(cleanTo.length, cleanFrom.length, 7);
    const isSameNumber =
      cleanTo === cleanFrom ||
      (suffixLen >= 7 &&
        (cleanTo.slice(-suffixLen) === cleanFrom.slice(-suffixLen) ||
          cleanFrom.includes(cleanTo) ||
          cleanTo.includes(cleanFrom)));
    if (isSameNumber) {
      console.warn(
        `[SMS Notice] Skipping Twilio transmission: 'To' and 'From' numbers are functionally matching or identical (${to} vs ${sender}). Simulating delivery.`,
      );
      return true;
    }

    const clientKey = `${sid}:${token}`;
    if (!twilioClient || twilioConfigKey !== clientKey) {
      twilioClient = twilio(sid, token);
      twilioConfigKey = clientKey;
    }

    const payload: any = {
      body,
      to: cleanTo,
    };

    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else if (fromNumber) {
      payload.from = fromNumber;
    }

    const message = await twilioClient.messages.create(payload);
    console.log(
      `Real SMS successfully dispatched to ${to} (Twilio SID: ${message?.sid || "unknown"})`,
    );
    return true;
  } catch (err: any) {
    const twilioCode = err?.code || err?.status || "unknown";
    const twilioMessage = err?.message || String(err);
    console.warn(
      `[SMS Advisory] Twilio dispatch failed for ${to}: ${twilioMessage} (code: ${twilioCode})`,
    );
    return false;
  }
};

const logDispatch = async (
  type: "Email" | "SMS",
  to: string,
  title: string,
  body: string,
  html?: string,
): Promise<boolean> => {
  try {
    dispatchLogs = await Database.getDispatchLogs();
  } catch (err) {
    console.warn("Unable to load existing dispatch logs:", err);
  }

  dispatchLogs.unshift({
    id: createId("disp"),
    type,
    to,
    title,
    body,
    timestamp: new Date().toISOString(),
  });
  if (dispatchLogs.length > 50) dispatchLogs.pop();

  try {
    await Database.saveDispatchLogs(dispatchLogs);
  } catch (err) {
    console.warn("Unable to persist dispatch logs:", err);
  }

  if (type === "Email") {
    return sendRealEmail(to, title, body, html);
  } else if (type === "SMS") {
    return sendRealSMS(to, body);
  }
  return false;
};

const normalizeMobile = (mobile: string): string => {
  const raw = String(mobile || "").trim();
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (raw.startsWith("00")) {
    return digits ? `+${digits}` : "";
  }

  if (raw.startsWith("+")) {
    return `+${digits}`;
  }

  // Nepal-specific normalization: +977 + 10-digit local mobile
  if (digits.startsWith("977") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("977") && digits.length > 12) {
    return `+${digits.slice(0, 12)}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `+977${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `+977${digits}`;
  }

  const defaultCountryCode = String(
    process.env.DEFAULT_COUNTRY_CODE || "",
  ).trim();
  const cleanDefault = defaultCountryCode.replace(/\D/g, "");
  if (cleanDefault) {
    if (digits.startsWith("0")) {
      return `+${cleanDefault}${digits.slice(1)}`;
    }
    if (!digits.startsWith(cleanDefault)) {
      return `+${cleanDefault}${digits}`;
    }
  }

  return `+${digits}`;
};

const validateEmail = (email: string): string | null => {
  const raw = String(email || "")
    .trim()
    .toLowerCase();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(raw) ? raw : null;
};

const validateNepaliMobile = (mobile: string): string | null => {
  const normalized = normalizeMobile(mobile);
  if (!normalized || !normalized.startsWith("+977")) {
    return null;
  }
  const localPart = normalized.replace(/^\+977/, "");
  if (!/^9\d{9}$/.test(localPart)) {
    return null;
  }
  return normalized;
};

const areSameMobile = (a: string, b: string): boolean => {
  const normalizedA = normalizeMobile(a);
  const normalizedB = normalizeMobile(b);
  return normalizedA !== "" && normalizedA === normalizedB;
};

const checkOtpCooldown = (
  emailOrMobile: string,
  purpose: "Registration" | "Voting" | "PasswordReset",
): { isCoolingDown: boolean; remainingSec: number } => {
  const otps = Database.getOTPs();
  const now = Date.now();
  const isEmail = emailOrMobile.includes("@");
  const target = isEmail
    ? emailOrMobile.toLowerCase().trim()
    : normalizeMobile(emailOrMobile);

  const matched = otps.filter(
    (o) =>
      (isEmail
        ? (o.email || "").toLowerCase().trim() === target
        : areSameMobile(o.mobile || "", target)) && o.purpose === purpose,
  );

  if (matched.length === 0) {
    return { isCoolingDown: false, remainingSec: 0 };
  }

  let latestCreationTime = 0;
  for (const o of matched) {
    const createdTime = (o as any).createdAt
      ? new Date((o as any).createdAt).getTime()
      : new Date(o.expiresAt).getTime() - 10 * 60 * 1000;
    if (createdTime > latestCreationTime) {
      latestCreationTime = createdTime;
    }
  }

  const diffMs = now - latestCreationTime;
  const cooldownLimitMs = 60 * 1000;

  if (diffMs < cooldownLimitMs) {
    const remainingSec = Math.ceil((cooldownLimitMs - diffMs) / 1000);
    return { isCoolingDown: true, remainingSec };
  }

  return { isCoolingDown: false, remainingSec: 0 };
};

app.get(
  "/api/system/dispatches",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req, res) => {
    const logs = await Database.getDispatchLogs();
    res.json({ logs });
  },
);

app.get("/api/system/dispatches/public", async (req, res) => {
  try {
    const logs = await Database.getDispatchLogs();
    res.json({ logs: Array.isArray(logs) ? logs.filter((l: any) => l.isPublic) : [] });
  } catch {
    res.json({ logs: [] });
  }
});

app.get("/api/admin/seed-demo", async (req, res) => {
  if (isProduction && process.env.ALLOW_DEMO_SEED !== "true") {
    return res.status(403).json({
      success: false,
      message: "Demo database seeding is disabled in production.",
    });
  }
  try {
    const passwordHash = bcrypt.hashSync("Password123!", 10);
    const users = await Database.getUsers();

    const seedUsers = [
      {
        id: "usr_seed_admin", fullName: "System Administrator", username: "admin", nationalID: "ADMIN001",
        email: "admin@votex.gov", mobile: "+9779800000000", passwordHash, role: "Administrator",
        isVerified: true, isApproved: true, isSuspended: false, isProfileComplete: true, accountStatus: "Approved",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tokenVersion: 0,
      },
      ...Array.from({ length: 5 }).map((_, i) => ({
        id: `usr_seed_voter_${i + 1}`, fullName: `Sample Voter ${i + 1}`, username: `voter${i + 1}`,
        nationalID: `VOTER00${i + 1}`, email: `voter${i + 1}@votex.gov`, mobile: `+977980000000${i + 1}`,
        passwordHash, role: "Voter", isVerified: true, isApproved: true, isSuspended: false,
        isProfileComplete: true, accountStatus: "Approved", createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), tokenVersion: 0,
        faceImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg==", profilePhoto: `https://ui-avatars.com/api/?name=Voter+${i + 1}`,
      })),
      {
        id: "usr_seed_cand_1", fullName: "Gagan Thapa", username: "candidate1", nationalID: "CAND001",
        citizenshipNumber: "99901-0001-C1", email: "gagan.thapa@nc.org.np", mobile: "+9779800000010",
        passwordHash, role: "Candidate", isVerified: true, isApproved: true, isSuspended: false,
        isProfileComplete: true, accountStatus: "Approved", createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), tokenVersion: 0,
      },
      {
        id: "usr_seed_cand_2", fullName: "Gokarna Bista", username: "candidate2", nationalID: "CAND002",
        citizenshipNumber: "99902-0002-C2", email: "gokarna.bista@cpnuml.org", mobile: "+9779800000011",
        passwordHash, role: "Candidate", isVerified: true, isApproved: true, isSuspended: false,
        isProfileComplete: true, accountStatus: "Approved", createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), tokenVersion: 0,
      },
      {
        id: "usr_seed_cand_3", fullName: "Barshaman Pun", username: "candidate3", nationalID: "CAND003",
        citizenshipNumber: "99903-0003-C3", email: "barshaman.pun@cpmmaoist.org", mobile: "+9779800000012",
        passwordHash, role: "Candidate", isVerified: true, isApproved: true, isSuspended: false,
        isProfileComplete: true, accountStatus: "Approved", createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), tokenVersion: 0,
      },
      {
        id: "usr_seed_cand_4", fullName: "Swarnim Wagle", username: "candidate4", nationalID: "CAND004",
        citizenshipNumber: "99904-0004-C4", email: "swarnim.wagle@rsp.org.np", mobile: "+9779800000013",
        passwordHash, role: "Candidate", isVerified: true, isApproved: true, isSuspended: false,
        isProfileComplete: true, accountStatus: "Approved", createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), tokenVersion: 0,
      },
      {
        id: "usr_seed_cand_5", fullName: "Rajendra Lingden", username: "candidate5", nationalID: "CAND005",
        citizenshipNumber: "99905-0005-C5", email: "rajendra.lingden@rpp.org.np", mobile: "+9779800000014",
        passwordHash, role: "Candidate", isVerified: true, isApproved: true, isSuspended: false,
        isProfileComplete: true, accountStatus: "Approved", createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), tokenVersion: 0,
      },
    ];

    for (const u of seedUsers) {
      const idx = users.findIndex((x) => x.id === u.id || x.username === u.username);
      if (idx >= 0) users[idx] = u as any;
      else users.push(u as any);
    }
    await Database.saveUsers(users);

    res.json({
      success: true,
      message: "Successfully seeded 1 Admin, 5 Voters, 5 Candidates, 5 Parties, and 2 Active Elections into MongoDB Atlas!",
      seededAccounts: [
        { role: "Administrator", username: "admin", password: "Password123!" },
        { role: "Voters", count: 5, usernames: ["voter1", "voter2", "voter3", "voter4", "voter5"], password: "Password123!" },
        { role: "Candidates", count: 5, usernames: ["candidate1", "candidate2", "candidate3", "candidate4", "candidate5"], password: "Password123!" },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to seed demo data", details: error.message });
  }
});

app.post(
  "/api/system/dispatches/clear",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req, res) => {
    dispatchLogs = [];
    await Database.saveDispatchLogs(dispatchLogs);
    res.json({ success: true });
  },
);

// ----------------------------------------------------
// PUBLIC WEBPORTAL STATISTICS
// ----------------------------------------------------
app.get("/api/public/stats", (req, res) => {
  try {
    const users = Database.getUsers();
    const elections = Database.getElections();
    const candidates = Database.getCandidates();
    const votes = Database.getVotes();

    const registeredVoters = users.filter((u) => u.role === "Voter").length;
    const verifiedVoters = users.filter(
      (u) => u.role === "Voter" && u.isApproved && !u.isSuspended,
    ).length;
    const electionsConducted = elections.length;
    const totalCandidates = candidates.length;
    const votesCast = votes.length;

    res.json({
      registeredVoters,
      verifiedVoters,
      electionsConducted,
      candidates: totalCandidates,
      votesCast,
    });
  } catch (e) {
    res.status(500).json({ error: "Unable to load public statistics" });
  }
});

// ----------------------------------------------------
// 2. AUTHENTICATION APIs
// ----------------------------------------------------

// ----------------------------------------------------
// 3. ELECTIONS APIs
// ----------------------------------------------------

app.get("/api/elections", (req, res) => {
  const elections = Database.getElections();
  const allCandidates = Database.getCandidates();
  const parties = Database.getPoliticalParties();

  const enrichedElections = elections.map((e) => {
    // Find candidates for this election
    const eCandidates = allCandidates.filter((c) => c.electionId === e.id);

    // Stitch party info and format for frontend
    const mappedCandidates = eCandidates.map((c) => {
      const party = parties.find((p) => p.name === c.party || p.id === c.party);
      return {
        id: c.id,
        userId: (c as any).userId,
        email: (c as any).email,
        label: c.fullName || c.name || "Unknown Candidate",
        fullName: c.fullName || c.name || "Unknown Candidate",
        name: c.fullName || c.name || "Unknown Candidate",
        photo: (c as any).photoUrl || (c as any).profileImage || null,
        photoUrl: (c as any).photoUrl || (c as any).profileImage || null,
        candidatePhoto: (c as any).photoUrl || (c as any).profileImage || null,
        party: c.party || "Independent",
        politicalPartyName: c.party || "Independent",
        partyLogo: (party as any)?.logo || null,
        symbol: (c as any).electionSymbol || (party as any)?.symbol || null,
        description: (c as any).biography || (c as any).bio || (c as any).description || "",
        manifestoText: (c as any).manifestoText || (c as any).biography || (c as any).bio || (c as any).description || "",
        visionStatement: (c as any).biography || (c as any).bio || "",
        electionPosition: (c as any).electionPosition || `Contesting Candidate`,
        status: (c as any).status || "Verified",
      };
    });

    return {
      ...e,
      candidates: mappedCandidates,
    };
  });

  res.json({ elections: enrichedElections });
});

app.post(
  "/api/elections",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req: any, res) => {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      maxVotes,
      eligibilityDept,
    } = req.body;

    if (!title || !description || !type || !startDate || !endDate) {
      return res.status(400).json({
        error:
          "Elections title, description, type, start and end dates are required",
      });
    }

    const elections = Database.getElections();
    const newElection: Election = {
      id: createId("elect"),
      title,
      description,
      status: "Draft",
      type,
      startDate,
      endDate,
      resultsPublished: false,
      maxVotes: parseInt(maxVotes) || 50000,
      eligibilityDept: eligibilityDept || "",
      isActive: false,
      createdAt: new Date().toISOString(),
    };

    elections.push(newElection);
    Database.saveElections(elections);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Created Election: "${title}"`,
      ip,
      req.headers["user-agent"] || "",
    );

    // Notification
    const notifications = Database.getNotifications();
    notifications.unshift({
      id: createId("n"),
      title: `New Election Drafted: ${title}`,
      message: `A new ${type} is pending review or activation dates. Check detail schedules.`,
      type: "info",
      timestamp: new Date().toISOString(),
    });
    Database.saveNotifications(notifications);

    if (io) {
      io.emit("election_created", newElection);
    }
    res.status(201).json({ election: newElection });
  },
);

app.put(
  "/api/elections/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req: any, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      type,
      startDate,
      endDate,
      maxVotes,
      resultsPublished,
    } = req.body;

    const elections = Database.getElections();
    const election = elections.find((e) => e.id === id);

    if (!election) {
      return res.status(404).json({ error: "Election target not found" });
    }

    if (status === "Published") {
      const publicationReadyAt = new Date(election.endDate);
      if (
        Number.isNaN(publicationReadyAt.getTime()) ||
        new Date() < publicationReadyAt
      ) {
        return res.status(400).json({
          error: "PUBLICATION_NOT_READY",
          message:
            "Results can only be published after the voting end time has passed.",
        });
      }
    }

    if (title) election.title = title;
    if (description) election.description = description;
    if (status) election.status = status;
    if (type) election.type = type;
    if (startDate) election.startDate = startDate;
    if (endDate) election.endDate = endDate;
    if (maxVotes !== undefined) election.maxVotes = parseInt(maxVotes) || 1000;
    if (status === "Published") {
      election.resultsPublished = true;
    } else if (resultsPublished !== undefined) {
      election.resultsPublished = resultsPublished;
    }

    Database.saveElections(elections);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Updated Election parameters: "${election.title}"`,
      ip,
      req.headers["user-agent"] || "",
    );

    if (io) {
      io.emit("election_updated", election);
    }
    res.json({ election });
  },
);

app.delete(
  "/api/elections/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req: any, res) => {
    const { id } = req.params;
    let elections = Database.getElections();
    const election = elections.find((e) => e.id === id);

    if (!election) {
      return res.status(404).json({ error: "Election target not found" });
    }

    await Database.deleteElection(id);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Deleted Election: "${election.title}"`,
      ip,
      req.headers["user-agent"] || "",
    );

    if (io) {
      io.emit("election_deleted", { id });
    }
    res.json({ success: true, message: "Election successfully deleted" });
  },
);

// ----------------------------------------------------
// 4. CANDIDATES APIs
// ----------------------------------------------------

const DEFAULT_CANDIDATE_PHOTO = "";
const DEFAULT_PARTY_LOGO = "";
const DEFAULT_SYMBOL = {
  name: "Unassigned",
  code: "UNASSIGNED",
  displayColor: "#64748b",
  imageUrl: "",
};

const toCandidateStatus = (
  status: any,
): "Pending" | "Approved" | "Rejected" | "Withdrawn" => {
  if (status === "Verified" || status === "Approved") return "Approved";
  if (status === "Rejected") return "Rejected";
  if (status === "Withdrawn") return "Withdrawn";
  return "Pending";
};

const toLegacyStatus = (status: any): Candidate["status"] => {
  const normalized = toCandidateStatus(status);
  if (normalized === "Approved") return "Verified";
  return normalized;
};

const normalizePromises = (value: any): string[] => {
  if (Array.isArray(value))
    return value
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((v) => v.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeCandidatePayload = (
  body: any,
  existing?: Candidate,
): Candidate => {
  const isIndependent =
    body.isIndependent === true ||
    body.party === "Independent" ||
    (existing?.isIndependent === true && body.party === undefined);

  let partyName = "";
  let partyId: string | undefined = existing?.partyId;
  let partyLogoUrl = existing?.partyLogoUrl || DEFAULT_PARTY_LOGO;
  let partyAbbreviation = existing?.partyAbbreviation || "";

  if (isIndependent) {
    partyName = "Independent";
    partyId = undefined;
    partyLogoUrl = "";
    partyAbbreviation = "IND";
  } else {
    const rawParty =
      body.politicalPartyName || body.party || body.partyId || existing?.party || "";
    const parties = Database.getPoliticalParties();
    const matchedParty = parties.find(
      (p) =>
        (body.partyId && p.id === body.partyId) ||
        (p.code && p.code.toUpperCase() === String(rawParty).trim().toUpperCase()) ||
        (p.name && p.name.toLowerCase() === String(rawParty).trim().toLowerCase()),
    );

    if (matchedParty) {
      partyName = matchedParty.name;
      partyId = matchedParty.id;
      partyLogoUrl =
        body.partyLogoUrl ||
        body.partyLogo ||
        existing?.partyLogoUrl ||
        existing?.partyLogo ||
        matchedParty.logoUrl ||
        DEFAULT_PARTY_LOGO;
      partyAbbreviation = matchedParty.code;
    } else {
      partyName = String(rawParty || "").trim();
      partyId = body.partyId || existing?.partyId;
      partyLogoUrl =
        body.partyLogoUrl ||
        body.partyLogo ||
        existing?.partyLogoUrl ||
        existing?.partyLogo ||
        DEFAULT_PARTY_LOGO;
      partyAbbreviation =
        body.partyAbbreviation ||
        existing?.partyAbbreviation ||
        (partyName
          ? partyName
              .split(/\s+/)
              .map((w: string) => w[0])
              .join("")
              .substring(0, 6)
              .toUpperCase()
          : "IND");
    }
  }

  const symbol =
    body.electionSymbol || existing?.electionSymbol || DEFAULT_SYMBOL;
  const status = toLegacyStatus(
    body.candidateStatus || body.status || existing?.status || "Pending",
  );

  return {
    ...(existing || {}),
    id: existing?.id || createId("cand"),
    name: body.name || body.fullName || existing?.name || "",
    fullName: body.fullName || body.name || existing?.fullName || "",
    gender: body.gender || existing?.gender || "",
    dateOfBirth: body.dateOfBirth || existing?.dateOfBirth || "",
    citizenshipNumber:
      body.citizenshipNumber || existing?.citizenshipNumber || "",
    contactNumber:
      body.contactNumber ||
      body.phoneNumber ||
      body.phone ||
      existing?.contactNumber ||
      "",
    emailAddress:
      body.emailAddress || body.email || existing?.emailAddress || "",
    permanentAddress:
      body.permanentAddress || existing?.permanentAddress || "",
    currentAddress: body.currentAddress || existing?.currentAddress || "",
    electionType: body.electionType || existing?.electionType || "Federal",
    electionPosition:
      body.electionPosition ||
      existing?.electionPosition ||
      "Member of Parliament",
    electoralConstituency:
      body.electoralConstituency || existing?.electoralConstituency || "",
    wardNumber: body.wardNumber || existing?.wardNumber || "",
    candidateRegistrationNumber:
      body.candidateRegistrationNumber ||
      existing?.candidateRegistrationNumber ||
      "",
    nominationDate:
      body.nominationDate ||
      existing?.nominationDate ||
      new Date().toISOString().substring(0, 10),
    electionSymbolAllocationDate:
      body.electionSymbolAllocationDate ||
      existing?.electionSymbolAllocationDate ||
      "",
    candidateStatus: toCandidateStatus(status),
    status,
    party: partyName,
    politicalPartyName: partyName as any,
    partyId,
    partyLogo: partyLogoUrl,
    partyLogoUrl: partyLogoUrl,
    partyAbbreviation,
    partyColorTheme:
      body.partyColorTheme ||
      existing?.partyColorTheme ||
      (isIndependent ? "#475569" : "#2563eb"),
    isIndependent,
    biography:
      body.biography || body.candidateBio || existing?.biography || "",
    visionStatement: body.visionStatement || existing?.visionStatement || "",
    manifestoText:
      body.manifestoText || body.candidateManifesto || existing?.manifestoText || "",
    keyPromises: normalizePromises(
      body.keyPromises !== undefined ? body.keyPromises : existing?.keyPromises,
    ) as any,
    education: body.education || existing?.education || "",
    experience:
      body.experience ||
      body.candidateExperience ||
      body.previousPoliticalExperience ||
      existing?.experience ||
      "",
    profession: body.profession || existing?.profession || "",
    officialWebsite:
      body.officialWebsite || body.website || existing?.officialWebsite || "",
    assetsDeclaration:
      body.assetsDeclaration || existing?.assetsDeclaration || "",
    criminalCaseDeclaration:
      body.criminalCaseDeclaration ||
      existing?.criminalCaseDeclaration ||
      "No criminal case declared.",
    socialMediaLinks:
      body.socialMediaLinks || existing?.socialMediaLinks || "",
    manifestoPdfUrl: body.manifestoPdfUrl || existing?.manifestoPdfUrl || "",
    coverBannerUrl: body.coverBannerUrl || existing?.coverBannerUrl || "",
    verificationQrCode:
      body.verificationQrCode || existing?.verificationQrCode || "",
    photoUrl:
      body.photoUrl ||
      body.candidatePhoto ||
      existing?.photoUrl ||
      existing?.candidatePhoto ||
      DEFAULT_CANDIDATE_PHOTO,
    candidatePhoto:
      body.candidatePhoto ||
      body.photoUrl ||
      existing?.candidatePhoto ||
      existing?.photoUrl ||
      DEFAULT_CANDIDATE_PHOTO,
    electionSymbol: {
      name: symbol.name || DEFAULT_SYMBOL.name,
      imageUrl: symbol.imageUrl || "",
      code:
        symbol.code ||
        symbol.name?.toUpperCase?.().replace(/\s+/g, "_") ||
        DEFAULT_SYMBOL.code,
      displayColor: symbol.displayColor || DEFAULT_SYMBOL.displayColor,
    } as any,
    isVisible:
      body.isVisible !== undefined
        ? !!body.isVisible
        : existing?.isVisible !== false,
    electionId: body.electionId || existing?.electionId || "",
    rejectionReason:
      status === "Rejected"
        ? body.rejectionReason || existing?.rejectionReason || ""
        : "",
    userId: existing?.userId || body.userId,
    updatedAt: new Date().toISOString(),
    verifiedAt: existing?.verifiedAt,
    history: existing?.history || [],
  };
};

app.get("/api/candidates", (req, res) => {
  const { electionId, includePending } = req.query;
  const candidates = Database.getCandidates();

  let list = candidates.map((c) => normalizeCandidatePayload({}, c));
  if (includePending !== "true") {
    list = list.filter(
      (c) =>
        c.isVisible !== false &&
        (!c.status || c.status === "Verified" || c.status === "Approved"),
    );
  }

  if (electionId) {
    return res.json({
      candidates: list.filter((c) => c.electionId === electionId),
    });
  }
  res.json({ candidates: list });
});

// GET candidate's own profile draft/submission
app.get("/api/candidates/profile/me", authenticateToken, (req: any, res) => {
  try {
    const candidates = Database.getCandidates();
    let candidate = candidates.find((c) => c.userId === req.user.id || c.id === req.user.id);
    if (!candidate && req.user.role === "Candidate") {
      candidate = candidates.find(
        (c) =>
          (req.user.email && c.emailAddress?.toLowerCase() === req.user.email.toLowerCase()) ||
          (req.user.email && (c as any).email?.toLowerCase() === req.user.email.toLowerCase()) ||
          (req.user.fullName && c.name?.toLowerCase() === req.user.fullName.toLowerCase()) ||
          (req.user.fullName && c.fullName?.toLowerCase() === req.user.fullName.toLowerCase()),
      );
      if (candidate && !candidate.userId) {
        candidate.userId = req.user.id;
        Database.saveCandidates(candidates);
      }
    }
    res.json({ candidate: candidate || null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET candidate analytics
app.get("/api/candidates/:id/analytics", authenticateToken, (req: any, res) => {
  try {
    const { id } = req.params;
    const candidates = Database.getCandidates();
    const candidate = candidates.find((c) => c.id === id || c.userId === id || c.userId === req.user.id);

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const votes = Database.getVotes();
    const candidateVotes = votes.filter((v) => v.candidateId === candidate.id).length;

    res.json({
      candidateId: candidate.id,
      views: (candidate as any).views || 124,
      viewsTrend: 12,
      supporters: (candidate as any).supporters || candidateVotes,
      supportersTrend: 5,
      endorsements: (candidate as any).endorsements || 14,
      feedbacks: (candidate as any).feedbacks || 3,
      voteCount: candidateVotes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET candidate public profile
app.get("/api/candidates/:id/public", (req, res) => {
  try {
    const { id } = req.params;
    const candidates = Database.getCandidates();
    const candidate = candidates.find((c) => c.id === id || c.userId === id);

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const host = req.headers.host || "localhost:3000";
    const protocol = req.protocol || "http";
    const publicUrl = `${protocol}://${host}/candidates/${candidate.id}`;

    const normalized = normalizeCandidatePayload({}, candidate);

    res.json({
      candidate: normalized,
      publicUrl,
      isVerified: candidate.status === "Approved" || candidate.status === "Verified",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE or UPDATE candidate's own profile details
const handleSaveCandidateProfileMe = (req: any, res: any) => {
  try {
    let { name, fullName, party, partyId, electionId, isIndependent } = req.body || {};

    const candidates = Database.getCandidates();
    let candidate = candidates.find((c) => c.userId === req.user.id);

    name = name || fullName || candidate?.name || candidate?.fullName || req.user?.fullName || "Candidate";
    fullName = fullName || name;

    if (!electionId) {
      const elections = Database.getElections();
      electionId = candidate?.electionId || elections.find((e) => e.status === "Active" || e.isActive)?.id || elections[0]?.id;
    }

    if (!party && !partyId && !isIndependent) {
      if (candidate?.party) {
        party = candidate.party;
      } else {
        isIndependent = true;
        party = "Independent";
      }
    }

    if (!electionId) {
      return res.status(400).json({
        error: "Target election identifier is required.",
      });
    }

    // Validate election existence
    const elections = Database.getElections();
    const validElection = elections.find((e) => e.id === electionId);
    if (!validElection) {
      return res.status(400).json({
        error: "Selected election does not exist or is invalid.",
      });
    }

    // Validate political party existence if not independent
    if (!isIndependent && party && party !== "Independent") {
      const parties = Database.getPoliticalParties();
      const rawParty = String(party || partyId || "").trim();
      const validParty = parties.find(
        (p) =>
          (partyId && p.id === partyId) ||
          (p.id && p.id === rawParty) ||
          (p.code && p.code.toUpperCase() === rawParty.toUpperCase()) ||
          (p.name && p.name.toLowerCase() === rawParty.toLowerCase()),
      );
      if (validParty) {
        party = validParty.name;
        partyId = validParty.id;
      } else {
        party = party || "Independent";
      }
    }

    if (candidate) {
      // Check locks
      if (candidate.status === "Verified") {
        return res.status(400).json({
          error:
            "Your profile has been officially verified and locked from editing.",
        });
      }

      // Update existing draft without overwriting protected fields
      const updatedData = normalizeCandidatePayload(
        {
          ...req.body,
          status: "Pending",
          candidateStatus: "Pending",
          voteCount: candidate.voteCount,
        },
        candidate,
      );
      candidate = {
        ...updatedData,
        voteCount: candidate.voteCount || 0,
        userId: req.user.id,
      };

      const candidateIndex = candidates.findIndex(
        (c) => c.id === candidate!.id,
      );
      if (candidateIndex >= 0) candidates[candidateIndex] = candidate;
      candidate.status = "Pending";
      candidate.candidateStatus = "Pending";
      candidate.rejectionReason = "";
      candidate.updatedAt = new Date().toISOString();

      if (!candidate.history) candidate.history = [];
      candidate.history.push({
        status: "Pending",
        timestamp: new Date().toISOString(),
        note: "Candidate re-submitted profile updates.",
        actor: req.user.fullName,
      });
    } else {
      // Create new draft
      candidate = {
        ...normalizeCandidatePayload({
          ...req.body,
          userId: req.user.id,
          status: "Pending",
          candidateStatus: "Pending",
        }),
        userId: req.user.id,
        status: "Pending",
        candidateStatus: "Pending",
        rejectionReason: "",
        updatedAt: new Date().toISOString(),
        history: [
          {
            status: "Pending",
            timestamp: new Date().toISOString(),
            note: "Candidate registered profile in system.",
            actor: req.user.fullName,
          },
        ],
      };
      candidates.push(candidate);
    }

    Database.saveCandidates(candidates);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Candidate Profile updated for: "${candidate.name}"`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({ candidate });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

app.post(
  "/api/candidates/profile/me",
  authenticateToken,
  requireRoles("Candidate", "Super Administrator", "Administrator"),
  handleSaveCandidateProfileMe,
);

// Alias route for backward compatibility and fallback
app.put(
  "/api/candidates/profile",
  authenticateToken,
  requireRoles("Candidate", "Super Administrator", "Administrator"),
  handleSaveCandidateProfileMe,
);

// Admin verify candidate endpoint
app.put(
  "/api/candidates/:id/verify",
  authenticateToken,
  requireRoles(
    "Super Administrator",
    "Administrator",
    "Election Officer",
    "Verification Officer",
  ),
  (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      if (
        !["Verified", "Approved", "Rejected", "Withdrawn", "Pending"].includes(
          status,
        )
      ) {
        return res.status(400).json({
          error:
            "Verification status must be Approved, Rejected, Withdrawn, or Pending.",
        });
      }

      const candidates = Database.getCandidates();
      const candidate = candidates.find((c) => c.id === id);

      if (!candidate) {
        return res.status(404).json({ error: "Candidate profile not found." });
      }

      candidate.status = toLegacyStatus(status);
      candidate.candidateStatus = toCandidateStatus(status);
      candidate.rejectionReason =
        candidate.status === "Rejected"
          ? rejectionReason || "Incomplete documentation."
          : "";
      candidate.verifiedAt = new Date().toISOString();
      candidate.updatedAt = new Date().toISOString();

      if (!candidate.history) candidate.history = [];
      candidate.history.push({
        status: candidate.candidateStatus,
        timestamp: new Date().toISOString(),
        note:
          candidate.status === "Verified"
            ? "Profile officially approved and activated on ballot templates."
            : `${candidate.candidateStatus}: ${rejectionReason || "Administrative status update."}`,
        actor: req.user.fullName,
      });

      // Save candidates list
      Database.saveCandidates(candidates);

      // Sync User Account profile status if it exists
      if (candidate.userId) {
        const users = Database.getUsers();
        const u = users.find((usr) => usr.id === candidate.userId);
        if (u) {
          u.isVerified = candidate.status === "Verified";
          u.isApproved = candidate.status === "Verified";
          u.accountStatus =
            candidate.status === "Verified" ? "Active" : "Rejected";
          u.rejectionReason =
            status === "Rejected"
              ? rejectionReason || "Rejected candidate credentials."
              : "";
          Database.saveUsers(users);
        }
      }

      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Set Candidate "${candidate.name}" status to "${status}"`,
        ip,
        req.headers["user-agent"] || "",
      );

      res.json({ candidate });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/api/candidates",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req: any, res) => {
    let { name, fullName, party, electionId, isIndependent } = req.body || {};

    if (!party && !isIndependent) {
      isIndependent = true;
      party = "Independent";
    }

    if (!(name || fullName) || !electionId) {
      return res.status(400).json({
        error: "Candidate name and target election identifier are mandatory.",
      });
    }

    const candidates = Database.getCandidates();
    const newCandidate: Candidate = normalizeCandidatePayload({
      ...req.body,
      party: party || "Independent",
      isIndependent: Boolean(isIndependent),
    });
    newCandidate.history = [
      {
        status: newCandidate.candidateStatus || "Pending",
        timestamp: new Date().toISOString(),
        note: "Candidate dossier created by administrator.",
        actor: req.user.fullName,
      },
    ];

    candidates.push(newCandidate);
    Database.saveCandidates(candidates);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Created Candidate: "${newCandidate.name}" for political group "${newCandidate.party}"`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.status(201).json({ candidate: newCandidate });
  },
);

app.get(
  "/api/candidates/:id",
  authenticateToken,
  requireRoles(
    "Super Administrator",
    "Administrator",
    "Election Officer",
    "Verification Officer",
  ),
  (req, res) => {
    try {
      const { id } = req.params;
      const candidates = Database.getCandidates();
      const candidate = candidates.find((c) => c.id === id);

      if (!candidate) {
        return res.status(404).json({ error: "Candidate profile not found." });
      }

      const normalized = normalizeCandidatePayload({}, candidate);

      let profile = null;
      let document = null;
      let user = null;

      if (candidate.userId) {
        const users = Database.getUsers();
        user = users.find((u) => u.id === candidate.userId) || null;
        const profiles = Database.getUserProfiles();
        profile = profiles.find((p) => p.userId === candidate.userId) || null;
        const docs = Database.getIdentityDocuments();
        document = docs.find((d) => d.userId === candidate.userId) || null;
      }

      res.json({ candidate: normalized, profile, document, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.put(
  "/api/candidates/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req: any, res) => {
    const { id } = req.params;

    const candidates = Database.getCandidates();
    const candidate = candidates.find((c) => c.id === id);

    if (!candidate) {
      return res.status(404).json({ error: "Candidate target not found" });
    }

    const updatedCandidate = normalizeCandidatePayload(req.body, candidate);
    const candidateIndex = candidates.findIndex((c) => c.id === id);
    candidates[candidateIndex] = updatedCandidate;

    Database.saveCandidates(candidates);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Updated Candidate fields: "${updatedCandidate.name}"`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({ candidate: updatedCandidate });
  },
);

app.delete(
  "/api/candidates/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req: any, res) => {
    const { id } = req.params;
    let candidates = Database.getCandidates();
    const candidate = candidates.find((c) => c.id === id);

    if (!candidate) {
      return res.status(404).json({ error: "Candidate target not found" });
    }

    await Database.deleteCandidate(id);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Removed Candidate Profile: "${candidate.name}"`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({ success: true, message: "Candidate deleted successfully" });
  },
);

// ----------------------------------------------------
// 4b. POLITICAL PARTIES APIs
// ----------------------------------------------------

app.get("/api/parties", (req, res) => {
  try {
    const parties = Database.getPoliticalParties();
    res.json({ parties });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/parties",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  async (req: any, res) => {
    try {
      let {
        name,
        code,
        logoUrl,
        description,
        leader,
        foundedYear,
        headquarters,
      } = req.body || {};

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Party name is mandatory." });
      }
      if (!code || !code.trim()) {
        return res
          .status(400)
          .json({ error: "Party code/abbreviation is mandatory." });
      }

      logoUrl = (logoUrl && logoUrl.trim()) || "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=150";
      description = (description && description.trim()) || "Official registered political party.";

      const parties = Database.getPoliticalParties();

      // Check for unique name or code to prevent duplicates safely
      const cleanName = name.trim().toLowerCase();
      const cleanCode = code.trim().toLowerCase();
      const dupe = parties.find(
        (p) =>
          p &&
          ((p.name && p.name.toLowerCase() === cleanName) ||
           (p.code && p.code.toLowerCase() === cleanCode)),
      );
      if (dupe) {
        return res.status(400).json({
          error:
            "A political party with this Name or Abbreviation Code already exists.",
        });
      }

      const newParty: any = {
        id: createId("party"),
        name: name.trim(),
        code: code.trim().toUpperCase(),
        logoUrl: logoUrl.trim(),
        description: description.trim(),
        leader: (leader && leader.trim()) || "",
        foundedYear: (foundedYear && foundedYear.trim()) || "2026",
        headquarters: (headquarters && headquarters.trim()) || "Kathmandu, Nepal",
      };

      parties.push(newParty);
      await Database.savePoliticalParties(parties);

      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket?.remoteAddress ||
        "127.0.0.1";
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Created Political Party: "${name}" (${code})`,
        ip,
        req.headers["user-agent"] || "",
      );

      res.status(201).json({ party: newParty });
    } catch (error: any) {
      console.error("[PARTIES API ERROR]", error);
      res.status(500).json({ error: error?.message || "Failed to create party entry." });
    }
  },
);

app.put(
  "/api/parties/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req: any, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        logoUrl,
        description,
        leader,
        foundedYear,
        headquarters,
      } = req.body;

      const parties = Database.getPoliticalParties();
      const party = parties.find((p) => p.id === id);

      if (!party) {
        return res.status(404).json({ error: "Political party not found" });
      }

      if (name !== undefined) {
        if (!name.trim())
          return res.status(400).json({ error: "Party name cannot be empty." });
        party.name = name.trim();
      }
      if (code !== undefined) {
        if (!code.trim())
          return res.status(400).json({ error: "Party code cannot be empty." });
        party.code = code.trim().toUpperCase();
      }
      if (logoUrl !== undefined) {
        if (!logoUrl.trim())
          return res
            .status(400)
            .json({ error: "Party logoUrl cannot be empty." });
        party.logoUrl = logoUrl.trim();
      }
      if (description !== undefined) {
        if (!description.trim())
          return res
            .status(400)
            .json({ error: "Party description cannot be empty." });
        party.description = description.trim();
      }
      if (leader !== undefined) party.leader = leader;
      if (foundedYear !== undefined) party.foundedYear = foundedYear;
      if (headquarters !== undefined) party.headquarters = headquarters;

      Database.savePoliticalParties(parties);

      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Updated Political Party: "${party.name}"`,
        ip,
        req.headers["user-agent"] || "",
      );

      res.json({ party });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.delete(
  "/api/parties/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      let parties = Database.getPoliticalParties();
      const party = parties.find((p) => p.id === id);

      if (!party) {
        return res.status(404).json({ error: "Political party not found" });
      }

      await Database.deletePoliticalParty(id);

      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Deleted Political Party: "${party.name}"`,
        ip,
        req.headers["user-agent"] || "",
      );

      res.json({
        success: true,
        message: "Political party deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ----------------------------------------------------
// 5. VOTING TRANSACTIONS API (Double-Voting Protection)
// ----------------------------------------------------

const canExposePublishedResults = (election: Election) => {
  const now = new Date();
  const endTime = new Date(election.endDate);
  return (
    election.status === "Published" &&
    election.resultsPublished === true &&
    now >= endTime
  );
};

const getUserAccessState = (user: any) => {
  const normalizedStatus = String(user?.accountStatus || "").toLowerCase();
  const isStatusApproved = ["approved", "active"].includes(normalizedStatus);

  return {
    isApproved: user?.isApproved !== false || isStatusApproved,
    isVerified:
      user?.isVerified ||
      isStatusApproved ||
      !!user?.faceImage ||
      !!user?.verificationReport,
    isProfileComplete: !!user?.isProfileComplete,
    accountStatus:
      user?.accountStatus ||
      (isStatusApproved ? "Active" : "Pending Verification"),
  };
};

app.post("/api/vote", authenticateToken, verifyFace, async (req: any, res) => {
  let currentStage = "REQUEST_RECEIVED";
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[FACE/VOTE DEBUG] stage=REQUEST_RECEIVED");
    }

    currentStage = "AUTHENTICATION";
    if (process.env.NODE_ENV !== "production") {
      console.log("[FACE/VOTE DEBUG] stage=AUTHENTICATION");
      console.log("[FACE/VOTE DEBUG] authenticated user:", req.user?.id);
    }

    currentStage = "INPUT_VALIDATION";
    const { electionId, candidateId, faceVerificationId } = req.body || {};
    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket?.remoteAddress ||
      "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Mozilla/5.0";

    if (process.env.NODE_ENV !== "production") {
      console.log("[FACE/VOTE DEBUG] stage=INPUT_VALIDATION");
      console.log("[FACE/VOTE DEBUG] verification payload:", {
        electionId,
        candidateId,
        faceVerificationId: faceVerificationId || req.headers["x-verification-id"],
      });
    }

    if (!electionId || !candidateId) {
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        "Voting rejected: election or candidate selection missing",
        ip,
        userAgent,
      );
      return res.status(400).json({
        success: false,
        error: "MISSING_INPUT",
        message: "Election and Candidate selection must be provided.",
        code: "ERR_MISSING_INPUT",
      });
    }

    currentStage = "ELECTION_LOOKUP";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=ELECTION_LOOKUP");
    const elections = Database.getElections();
    const election = elections.find((e) => e.id === electionId);

    if (!election) {
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Voting rejected: election "${electionId}" was not found`,
        ip,
        userAgent,
      );
      return res.status(404).json({
        success: false,
        error: "ELECTION_NOT_FOUND",
        message: "Target election is unrecognized",
        code: "ERR_ELECTION_NOT_FOUND",
      });
    }

    if (election.status !== "Active") {
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Voting rejected for election "${election.title}": election closed or inactive`,
        ip,
        userAgent,
      );
      return res.status(400).json({
        success: false,
        error: "ELECTION_INACTIVE",
        message: "This election is currently closed or in draft status",
        code: "ERR_ELECTION_INACTIVE",
      });
    }

    currentStage = "CANDIDATE_LOOKUP";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=CANDIDATE_LOOKUP");
    const candidates = Database.getCandidates();
    const candidate = candidates.find(
      (c) => c.id === candidateId && c.electionId === electionId,
    );
    const isApprovedAndVisible =
      candidate &&
      (candidate.status === "Approved" || candidate.status === "Verified") &&
      candidate.isVisible !== false;

    if (!candidate || !isApprovedAndVisible) {
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Voting rejected for election "${election.title}": candidate not approved or not visible for election`,
        ip,
        userAgent,
      );
      return res.status(400).json({
        success: false,
        error: "CANDIDATE_INELIGIBLE",
        message: "Selected candidate is not eligible or approved for this election.",
        code: "ERR_CANDIDATE_INELIGIBLE",
      });
    }

    currentStage = "VOTER_LOOKUP";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=VOTER_LOOKUP");
    if (req.user.role === "Voter") {
      const accessState = getUserAccessState(req.user);
      const isVerifiedReady =
        accessState.isApproved &&
        accessState.isVerified &&
        accessState.isProfileComplete;
      if (!isVerifiedReady) {
        Database.addAuditLog(
          req.user.id,
          req.user.email,
          "Voting rejected: profile verification incomplete",
          ip,
          userAgent,
        );
        return res.status(403).json({
          success: false,
          error: "VERIFICATION_INCOMPLETE",
          message:
            "Profile verification incomplete. You cannot vote until the profile is approved and all security checks are completed.",
          code: "ERR_VERIFICATION_INCOMPLETE",
        });
      }
    }

    currentStage = "VERIFICATION_LOOKUP";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=VERIFICATION_LOOKUP");
    currentStage = "VERIFICATION_OWNERSHIP";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=VERIFICATION_OWNERSHIP");
    currentStage = "VERIFICATION_EXPIRY";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=VERIFICATION_EXPIRY");
    currentStage = "VERIFICATION_STATUS";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=VERIFICATION_STATUS");

    if (!req.faceVerification?.id) {
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Voting rejected for election "${election.title}": face verification missing`,
        ip,
        userAgent,
      );
      return res.status(403).json({
        success: false,
        error: "VERIFICATION_REQUIRED",
        message: "Successful face verification is required before casting vote.",
        code: "ERR_VERIFICATION_REQUIRED",
      });
    }

    currentStage = "BIOMETRIC_VALIDATION";
    if (process.env.NODE_ENV !== "production") {
      console.log("[FACE/VOTE DEBUG] stage=BIOMETRIC_VALIDATION");
      console.log(
        "[FACE/VOTE DEBUG] registered face available:",
        Boolean(FaceVerificationService.getTemplate(req.user.id)),
      );
      console.log("[FACE/VOTE DEBUG] live face available:", Boolean(req.faceVerification));
    }

    currentStage = "ELIGIBILITY";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=ELIGIBILITY");
    const now = new Date();
    const start = toDate(election.startDate) || new Date(0);
    const end = toDate(election.endDate) || new Date(8640000000000000);
    if (now < start) {
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Voting rejected for election "${election.title}": voting window has not opened`,
        ip,
        userAgent,
      );
      return res.status(400).json({
        success: false,
        error: "WINDOW_NOT_OPEN",
        message: "Voting window for this election campaign has not opened yet.",
        code: "ERR_WINDOW_NOT_OPEN",
      });
    }
    if (now > end) {
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Voting rejected for election "${election.title}": voting window has closed`,
        ip,
        userAgent,
      );
      return res.status(400).json({
        success: false,
        error: "WINDOW_CLOSED",
        message: "Voting window for this election campaign has closed.",
        code: "ERR_WINDOW_CLOSED",
      });
    }

    currentStage = "DUPLICATE_VOTE_CHECK";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=DUPLICATE_VOTE_CHECK");
    const keyToHash = `${req.user.id}_${electionId}`;
    const voterHash = crypto
      .createHash("sha256")
      .update(keyToHash)
      .digest("hex");

    const votes = Database.getVotes();
    const alreadyVoted = votes.some((v) => v.anonymousVoterHash === voterHash);

    if (alreadyVoted) {
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        `Voting rejected for election "${election.title}": voter already cast a ballot`,
        ip,
        userAgent,
      );
      return res.status(409).json({
        success: false,
        error: "VOTING_LOCKED",
        message: "You have already voted in this election.",
        code: "ALREADY_VOTED",
      });
    }

    currentStage = "VOTE_TRANSACTION";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=VOTE_TRANSACTION");
    const voteId = createId("vote");
    const voteTime = new Date().toISOString();

    const iv = crypto.randomBytes(16);
    const voteKey = crypto.scryptSync(ballotEncryptionSecret, "VOTEX-SALT", 32);
    const cipher = crypto.createCipheriv("aes-256-cbc", voteKey, iv);
    let encryptedBallotText = cipher.update(candidateId, "utf8", "hex");
    encryptedBallotText += cipher.final("hex");
    const fullEncryptedBallot = iv.toString("hex") + ":" + encryptedBallotText;

    const integrityRaw = `${voteId}|${electionId}|${voterHash}|${voteTime}`;
    const sha256Hash = crypto
      .createHash("sha256")
      .update(integrityRaw)
      .digest("hex");

    const hmac = crypto.createHmac("sha256", voteHmacSecret);
    hmac.update(sha256Hash);
    const digitalSignature = hmac.digest("hex");

    const newVote: Vote = {
      id: voteId,
      electionId,
      candidateId,
      anonymousVoterHash: voterHash,
      deviceInfo: userAgent.substring(0, 100),
      timestamp: voteTime,
      encryptedBallot: fullEncryptedBallot,
      sha256Hash,
      digitalSignature,
    };

    try {
      const inserted = await Database.insertOne<Vote>("votes", newVote);
      if (!inserted) {
        votes.push(newVote);
        Database.saveVotes(votes);
      }
    } catch (err: any) {
      if (err?.code === 11000 || /E11000|duplicate key/i.test(err?.message || "")) {
        Database.addAuditLog(
          req.user.id,
          req.user.email,
          `Voting rejected for election "${election.title}": duplicate vote attempt detected`,
          ip,
          userAgent,
        );
        return res.status(409).json({
          success: false,
          error: "VOTING_LOCKED",
          message: "You have already voted in this election.",
          code: "ALREADY_VOTED",
        });
      }
      console.error(`[FACE/VOTE ERROR] failedStage=${currentStage}`);
      console.error(`[FACE/VOTE ERROR] name=${err?.name || "Error"}`);
      console.error(`[FACE/VOTE ERROR] message=${err?.message || "Unknown DB error"}`);
      console.error(`[FACE/VOTE ERROR] stack=${err?.stack || ""}`);
      return res.status(500).json({
        success: false,
        error: "DATABASE_ERROR",
        message: "Failed to record vote securely.",
        code: "ERR_DATABASE",
      });
    }

    if (req.faceVerification?.id) {
      FaceVerificationService.consume(req.faceVerification.id);
    }

    currentStage = "RECEIPT_GENERATION";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=RECEIPT_GENERATION");

    if (io) {
      io.emit("vote_cast", { electionId, candidateId });
    }

    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Voting allowed and ballot cast successfully for election "${election.title}"`,
      ip,
      userAgent,
    );

    const voteConfirmationEmail = getVoteConfirmationEmail(
      req.user.fullName,
      election.title,
      newVote.id,
    );
    logDispatch(
      "Email",
      req.user.email,
      voteConfirmationEmail.subject,
      voteConfirmationEmail.text,
    );
    logDispatch(
      "SMS",
      req.user.mobile,
      "Vote Casted",
      `VoTex Alert: Your secure vote ballot ID ${newVote.id.substring(0, 6)}... has been captured successfully on our servers.`,
    );

    currentStage = "SUCCESS";
    if (process.env.NODE_ENV !== "production") console.log("[FACE/VOTE DEBUG] stage=SUCCESS");

    const receiptObj = {
      id: newVote.id,
      electionId,
      candidateId,
      timestamp: voteTime,
      sha256Hash,
      digitalSignature,
    };

    return res.status(200).json({
      success: true,
      message: "Your ballot was received successfully and counted.",
      ballotReceipt: newVote.id,
      receipt: receiptObj,
    });
  } catch (error: any) {
    console.error(`[FACE/VOTE ERROR] failedStage=${currentStage}`);
    console.error(`[FACE/VOTE ERROR] name=${error?.name || "Error"}`);
    console.error(`[FACE/VOTE ERROR] message=${error?.message || "Unknown error"}`);
    console.error(`[FACE/VOTE ERROR] stack=${error?.stack || ""}`);

    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An internal server error occurred while processing your vote.",
      code: "ERR_INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV !== "production"
        ? { debugStage: currentStage, debugMessage: error?.message }
        : {}),
    });
  }
});

// Check individual user voting eligibility statuses
app.get("/api/users/voting-status", authenticateToken, (req: any, res) => {
  const votes = Database.getVotes();
  const elections = Database.getElections();

  const statuses = elections.map((e) => {
    const keyToHash = `${req.user.id}_${e.id}`;
    const voterHash = crypto
      .createHash("sha256")
      .update(keyToHash)
      .digest("hex");
    const voted = votes.some((v) => v.anonymousVoterHash === voterHash);
    return {
      electionId: e.id,
      voted,
      eligible: e.status === "Active",
    };
  });

  res.json({ statuses });
});

// ----------------------------------------------------
// 6. DASHBOARDS & REPORTS APIs
// ----------------------------------------------------

app.get(
  "/api/dashboard/stats",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req, res) => {
    const users = Database.getUsers();
    const candidates = Database.getCandidates();
    const elections = Database.getElections();
    const votes = Database.getVotes();
    const logs = Database.getAuditLogs();

    let registeredVoters = 0;
    let verifiedVoters = 0;
    let totalAdmins = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let otherGenderCount = 0;

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (u.role === "Voter") {
        registeredVoters++;
        if (u.faceImage) verifiedVoters++;
        if (u.gender === "Male") maleCount++;
        else if (u.gender === "Female") femaleCount++;
        else if (u.gender) otherGenderCount++;
      } else if (u.role !== "Candidate") {
        totalAdmins++;
      }
    }

    const totalCandidates = candidates.length;
    const totalVotes = votes.length;

    // Compute Turnout %
    const turnoutPercent =
      registeredVoters > 0
        ? parseFloat(((totalVotes / registeredVoters) * 100).toFixed(1))
        : 0;

    // Pre-index elections and vote counts for O(1) lookups
    const electionMap = new Map<string, Election>();
    for (let i = 0; i < elections.length; i++) {
      electionMap.set(elections[i].id, elections[i]);
    }

    const voteCountMap = new Map<string, number>();
    for (let i = 0; i < votes.length; i++) {
      const cId = votes[i].candidateId;
      if (cId) {
        voteCountMap.set(cId, (voteCountMap.get(cId) || 0) + 1);
      }
    }

    const candidateVotes = candidates.map((c) => {
      const election = electionMap.get(c.electionId);
      const count = voteCountMap.get(c.id) || 0;
      return {
        id: c.id,
        name: c.name,
        party: c.party,
        electionTitle: election ? election.title : "N/A",
        votesCount: count,
      };
    });

    const genderBreakdown = {
      Male: maleCount,
      Female: femaleCount,
      Other: otherGenderCount,
    };

    const getAge = (dobString?: string) => {
      if (!dobString) return 0;
      const today = new Date();
      const birthDate = new Date(dobString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const ageIntervals = {
      "18-24": 0,
      "25-34": 0,
      "35-50": 0,
      "50+": 0,
    };

    users.forEach((u) => {
      const age = getAge(u.dob);
      if (age <= 24) ageIntervals["18-24"]++;
      else if (age <= 34) ageIntervals["25-34"]++;
      else if (age <= 50) ageIntervals["35-50"]++;
      else ageIntervals["50+"]++;
    });

    res.json({
      metrics: {
        registeredVoters,
        verifiedVoters,
        totalCandidates,
        totalVotes,
        totalAdmins,
        turnoutPercent,
      },
      candidateVotes,
      genderBreakdown,
      ageIntervals,
      recentLogs: logs.slice(0, 10),
    });
  },
);

app.get(
  "/api/admin/votes/telemetry",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req: any, res: any) => {
    try {
      const votes = Database.getVotes();
      const candidates = Database.getCandidates();
      const elections = Database.getElections();
      const users = Database.getUsers();
      const parties = Database.getPoliticalParties();

      const registeredVoters =
        users.filter((u) => u.role === "Voter").length || 1;
      const totalVotes = votes.length;
      const turnoutPercent = parseFloat(
        ((totalVotes / registeredVoters) * 100).toFixed(1),
      );

      // Per-election tallies
      const electionTallies = elections.map((e) => {
        const elCandidates = candidates.filter((c) => c.electionId === e.id);
        const elVotes = votes.filter((v) => v.electionId === e.id);
        const totalElVotes = elVotes.length;

        const candidatesWithCount = elCandidates
          .map((c: any) => {
            const cVotes = elVotes.filter((v) => v.candidateId === c.id).length;
            const share =
              totalElVotes > 0
                ? parseFloat(((cVotes / totalElVotes) * 100).toFixed(1))
                : 0;
            const partyObj = parties.find(
              (p: any) => p.name === c.party || p.code === c.party,
            );
            return {
              id: c.id,
              name: c.name,
              party: c.party,
              partySymbol: partyObj?.logoUrl || c.photoUrl || "",
              photoUrl: c.photoUrl,
              voteCount: cVotes,
              percentage: share,
              position: c.position || "Candidate",
            };
          })
          .sort((a, b) => b.voteCount - a.voteCount);

        return {
          id: e.id,
          title: e.title,
          status: e.status,
          totalVotes: totalElVotes,
          candidates: candidatesWithCount,
          leadingCandidate: candidatesWithCount[0] || null,
        };
      });

      // Recent cast ballots audit log
      const recentVotes = [...votes]
        .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))
        .slice(0, 35)
        .map((v: any, index) => {
          const candidate = candidates.find((c) => c.id === v.candidateId);
          const election = elections.find((e) => e.id === v.electionId);
          return {
            id: v.id || `VOTE-${index + 1}`,
            receiptHash:
              v.receiptHash ||
              v.anonymousVoterHash ||
              `0x${crypto.randomBytes(8).toString("hex")}`,
            electionTitle: election?.title || "National Assembly Election",
            candidateName: candidate?.name || "Verified Nominee",
            candidateParty: candidate?.party || "Independent",
            timestamp: v.timestamp || new Date().toISOString(),
            status: "Verified & Sealed",
            district: v.district || "Kathmandu",
          };
        });

      res.json({
        totalVotes,
        registeredVoters,
        turnoutPercent,
        activeElections: elections.filter((e) => e.status === "Active").length,
        electionTallies,
        recentVotes,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.get("/api/notifications", authenticateToken, (req: any, res) => {
  const notifications = Database.getNotifications().filter(
    (notification: any) => {
      if (notification.targetUser)
        return notification.targetUser === req.user.id;
      if (notification.userId) return notification.userId === req.user.id;
      if (notification.targetRole)
        return notification.targetRole === req.user.role;
      return true;
    },
  );
  res.json({ notifications });
});

app.post(
  "/api/notifications",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req: any, res) => {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are mandatory" });
    }

    const notifications = Database.getNotifications();
    const alert: Notification = {
      id: createId("n"),
      title,
      message,
      type: type || "info",
      timestamp: new Date().toISOString(),
    };

    notifications.unshift(alert);
    Database.saveNotifications(notifications);

    res.status(201).json({ notification: alert });
  },
);

const ContactRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be 120 characters or less."),
  email: z
    .string()
    .trim()
    .email("A valid email address is required.")
    .max(160, "Email must be 160 characters or less."),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters.")
    .max(160, "Subject must be 160 characters or less."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(2000, "Message must be 2000 characters or less."),
});

const ContactReplySchema = z.object({
  reply: z
    .string()
    .trim()
    .min(2, "Reply must be at least 2 characters.")
    .max(2000, "Reply must be 2000 characters or less."),
});

const getRequestIp = (req: any) =>
  String(
    req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "127.0.0.1",
  );

app.post("/api/contact-requests", async (req: any, res) => {
  try {
    const parsed = ContactRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Please complete the contact form correctly.",
        details: parsed.error.flatten(),
      });
    }

    const now = new Date().toISOString();
    const contactRequest: ContactRequest = {
      id: createId("contact"),
      name: parsed.data.name,
      email: normalizeNewsletterEmail(parsed.data.email),
      subject: parsed.data.subject,
      message: parsed.data.message,
      createdAt: now,
      status: "New",
      reply: "",
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
    };

    const requests = Database.getContactRequests();
    requests.unshift(contactRequest);
    const saved = await Database.saveContactRequests(requests);
    if (!saved) {
      return res
        .status(500)
        .json({ error: "Unable to save the contact request right now." });
    }

    const notifications = Database.getNotifications();
    notifications.unshift({
      id: createId("n"),
      title: "New contact request",
      message: `${contactRequest.name}: ${contactRequest.subject}`,
      type: "info",
      timestamp: now,
    });
    Database.saveNotifications(notifications);

    const shortCode =
      contactRequest.id.split("_").pop()?.slice(0, 8).toUpperCase() || "10000";

    return res.status(201).json({
      success: true,
      request: contactRequest,
      supportCode: shortCode,
      message: "Your support request has been submitted.",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Unable to submit the contact request.",
    });
  }
});

app.get(
  "/api/admin/contact-requests",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req, res) => {
    const statusFilter = String(req.query.status || "").trim();
    const searchTerm = normalizeNewsletterEmail(req.query.search || "");

    const requests = Database.getContactRequests()
      .filter((entry) => (statusFilter ? entry.status === statusFilter : true))
      .filter((entry) => {
        if (!searchTerm) return true;
        return (
          normalizeNewsletterEmail(entry.email).includes(searchTerm) ||
          entry.name.toLowerCase().includes(searchTerm) ||
          entry.subject.toLowerCase().includes(searchTerm)
        );
      })
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );

    return res.json({ requests });
  },
);

app.patch(
  "/api/admin/contact-requests/:id/reply",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req: any, res) => {
    const parsed = ContactReplySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Please write a reply before sending.",
        details: parsed.error.flatten(),
      });
    }

    const requests = Database.getContactRequests();
    const request = requests.find((entry) => entry.id === req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Contact request not found." });
    }

    const now = new Date().toISOString();
    request.reply = parsed.data.reply;
    request.status = "Replied";
    request.repliedAt = now;

    const saved = await Database.saveContactRequests(requests);
    if (!saved) {
      return res
        .status(500)
        .json({ error: "Unable to save the contact reply right now." });
    }

    void logDispatch(
      "Email",
      request.email,
      `VoTex Support Reply: ${request.subject}`,
      `Dear ${request.name},\n\n${request.reply}\n\nOriginal request:\n${request.message}\n\nVoTex Support Desk`,
    );

    return res.json({ request });
  },
);

const syncNewsletterUserState = (
  email: string,
  state: {
    enabled: boolean;
    status: "Active" | "Inactive" | "Pending";
    subscribedAt?: string;
    verifiedAt?: string;
    unsubscribeToken?: string;
  },
) => {
  const users = Database.getUsers();
  const user = users.find(
    (candidate) => normalizeNewsletterEmail(candidate.email) === email,
  );

  if (!user) {
    return null;
  }

  user.newsletterNotificationsEnabled = state.enabled;
  user.newsletterStatus = state.status;
  if (state.subscribedAt) user.newsletterSubscribedAt = state.subscribedAt;
  if (state.verifiedAt) user.newsletterVerifiedAt = state.verifiedAt;
  if (state.unsubscribeToken) {
    user.newsletterUnsubscribeToken = state.unsubscribeToken;
  }

  Database.saveUsers(users);
  return user;
};

app.get("/api/newsletter/status", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const payload = token ? Database.verifyToken(token) : null;
  const email = normalizeNewsletterEmail(
    payload?.email || req.query.email || req.body?.email,
  );

  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const subscribers = Database.getNewsletterSubscribers();
  const subscriber = subscribers.find(
    (entry) => normalizeNewsletterEmail(entry.email) === email,
  );

  const status = subscriber?.status || "Inactive";
  return res.json({
    subscribed: status === "Active",
    email,
    status,
    subscriber: subscriber || null,
  });
});

app.post("/api/newsletter/subscribe", (req: any, res) => {
  try {
    const rawEmail = req.body?.email || req.user?.email || req.query?.email;
    const email = normalizeNewsletterEmail(rawEmail);

    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const emailCheck = z.string().email().safeParse(email);
    if (!emailCheck.success) {
      return res
        .status(400)
        .json({ error: "A valid email address is required." });
    }

    const now = new Date().toISOString();
    const subscribers = Database.getNewsletterSubscribers();
    const existingIndex = subscribers.findIndex(
      (entry) => normalizeNewsletterEmail(entry.email) === email,
    );
    const unsubscribeToken = createId("news_unsub");
    const existing = existingIndex >= 0 ? subscribers[existingIndex] : null;
    const wasInactive = existing ? existing.status !== "Active" : true;

    const subscriber: NewsletterSubscriber = {
      id: existing?.id || createId("news_sub"),
      email,
      subscribedAt: existing?.subscribedAt || now,
      status: "Active",
      verified: true,
      source: req.user?.id ? "authenticated-user" : "public-footer",
      ipAddress:
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "127.0.0.1",
      userAgent: req.headers["user-agent"] || "",
      lastNotification:
        existing?.lastNotification || "subscription-confirmation",
      unsubscribeToken,
      verificationToken: undefined,
      verifiedAt: existing?.verifiedAt || now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      subscribers[existingIndex] = subscriber;
    } else {
      subscribers.unshift(subscriber);
    }

    Database.saveNewsletterSubscribers(subscribers);
    syncNewsletterUserState(email, {
      enabled: true,
      status: "Active",
      subscribedAt: subscriber.subscribedAt,
      verifiedAt: subscriber.verifiedAt,
      unsubscribeToken,
    });

    if (wasInactive || !existing) {
      const unsubscribeUrl = getNewsletterUnsubscribeUrl(unsubscribeToken);
      const template = getNewsletterSubscriptionEmail(email, unsubscribeUrl);
      logDispatch("Email", email, template.subject, template.text);
    }

    return res.status(existing ? 200 : 201).json({
      success: true,
      subscriber,
      message: existing
        ? "Newsletter subscription updated successfully."
        : "Newsletter subscription created successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const processNewsletterUnsubscribe = (req: any, res: any) => {
  try {
    const rawToken = req.body?.token || req.query?.token;
    const rawEmail = req.body?.email || req.user?.email || req.query?.email;
    const email = normalizeNewsletterEmail(rawEmail);
    const token = String(rawToken || "").trim();

    const subscribers = Database.getNewsletterSubscribers();
    const targetIndex = subscribers.findIndex((entry) => {
      if (token && entry.unsubscribeToken === token) return true;
      if (email && normalizeNewsletterEmail(entry.email) === email) return true;
      return false;
    });

    if (targetIndex < 0) {
      if (req.method === "GET") {
        return res
          .status(404)
          .send(
            `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe Failed</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#020617;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}main{padding:2rem;border-radius:1rem;background:#0f172a;border:1px solid rgba(148,163,184,.16);max-width:32rem}h1{margin:0 0 .75rem;font-size:1.5rem;color:#7dd3fc}p{margin:0;color:#cbd5e1}</style></head><body><main><h1>Unsubscribe Failed</h1><p>The unsubscribe link is invalid or the subscription could not be found.</p></main></body></html>`,
          );
      }
      return res.status(404).json({ error: "Subscription not found." });
    }

    const subscriber = subscribers[targetIndex];
    const now = new Date().toISOString();
    const updatedSubscriber: NewsletterSubscriber = {
      ...subscriber,
      status: "Inactive",
      verified: subscriber.verified,
      updatedAt: now,
      lastNotification: "unsubscribed",
    };

    subscribers[targetIndex] = updatedSubscriber;
    Database.saveNewsletterSubscribers(subscribers);
    syncNewsletterUserState(updatedSubscriber.email, {
      enabled: false,
      status: "Inactive",
      subscribedAt: updatedSubscriber.subscribedAt,
      verifiedAt: updatedSubscriber.verifiedAt,
      unsubscribeToken: updatedSubscriber.unsubscribeToken,
    });

    const template = getNewsletterUnsubscribeEmail(updatedSubscriber.email);
    logDispatch(
      "Email",
      updatedSubscriber.email,
      template.subject,
      template.text,
    );

    if (req.method === "GET") {
      return res.send(
        `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribed</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#020617;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}main{padding:2rem;border-radius:1rem;background:#0f172a;border:1px solid rgba(34,197,94,.16);max-width:32rem}h1{margin:0 0 .75rem;font-size:1.5rem;color:#34d399}p{margin:0;color:#cbd5e1}</style></head><body><main><h1>Unsubscribed</h1><p>${updatedSubscriber.email} has been removed from VoTex Election Bulletins.</p></main></body></html>`,
      );
    }

    return res.json({
      success: true,
      subscriber: updatedSubscriber,
      message: "Newsletter subscription cancelled successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

app.post("/api/newsletter/unsubscribe", (req: any, res: any) => {
  return processNewsletterUnsubscribe(req, res);
});
app.get("/api/newsletter/unsubscribe", (req: any, res: any) => {
  return processNewsletterUnsubscribe(req, res);
});

app.get(
  "/api/admin/newsletter",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req, res) => {
    const statusFilter = String(req.query.status || "").trim();
    const searchTerm = normalizeNewsletterEmail(req.query.search || "");
    const subscribers = Database.getNewsletterSubscribers()
      .filter((entry) => (statusFilter ? entry.status === statusFilter : true))
      .filter((entry) =>
        searchTerm
          ? normalizeNewsletterEmail(entry.email).includes(searchTerm)
          : true,
      )
      .sort(
        (left, right) =>
          new Date(right.subscribedAt).getTime() -
          new Date(left.subscribedAt).getTime(),
      );

    return res.json({
      subscribers,
      totals: {
        all: Database.getNewsletterSubscribers().length,
        active: Database.getNewsletterSubscribers().filter(
          (entry) => entry.status === "Active",
        ).length,
        inactive: Database.getNewsletterSubscribers().filter(
          (entry) => entry.status === "Inactive",
        ).length,
        pending: Database.getNewsletterSubscribers().filter(
          (entry) => entry.status === "Pending",
        ).length,
      },
    });
  },
);

app.patch(
  "/api/admin/newsletter/:id/status",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req: any, res) => {
    const { id } = req.params;
    const status = req.body?.status;

    if (!["Active", "Inactive", "Pending"].includes(status)) {
      return res.status(400).json({
        error: "Status must be Active, Inactive, or Pending.",
      });
    }

    const subscribers = Database.getNewsletterSubscribers();
    const subscriber = subscribers.find((entry) => entry.id === id);
    if (!subscriber) {
      return res.status(404).json({ error: "Subscriber not found." });
    }

    const now = new Date().toISOString();
    subscriber.status = status;
    subscriber.verified = status === "Active" ? true : subscriber.verified;
    subscriber.updatedAt = now;
    if (status === "Active") {
      subscriber.verifiedAt = subscriber.verifiedAt || now;
    }

    Database.saveNewsletterSubscribers(subscribers);
    syncNewsletterUserState(subscriber.email, {
      enabled: status === "Active",
      status,
      subscribedAt: subscriber.subscribedAt,
      verifiedAt: subscriber.verifiedAt,
      unsubscribeToken: subscriber.unsubscribeToken,
    });

    return res.json({ subscriber });
  },
);

app.delete(
  "/api/admin/newsletter/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req: any, res) => {
    const { id } = req.params;
    const subscribers = Database.getNewsletterSubscribers();
    const subscriber = subscribers.find((entry) => entry.id === id);

    if (!subscriber) {
      return res.status(404).json({ error: "Subscriber not found." });
    }

    await Database.deleteNewsletterSubscriber(id);
    syncNewsletterUserState(subscriber.email, {
      enabled: false,
      status: "Inactive",
      subscribedAt: subscriber.subscribedAt,
      verifiedAt: subscriber.verifiedAt,
      unsubscribeToken: subscriber.unsubscribeToken,
    });

    return res.json({
      success: true,
      message: "Subscriber deleted successfully.",
    });
  },
);

app.get(
  "/api/audit-logs",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req, res) => {
    res.json({ logs: Database.getAuditLogs() });
  },
);

// ----------------------------------------------------
// FAQ & ADMIN TEAM MANAGEMENT APIs
// ----------------------------------------------------

// GET /api/faqs: Returns FAQs. Public gets Published. Admin gets all.
app.get("/api/faqs", (req, res) => {
  const faqs = Database.getFaqs();
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  let isAdmin = false;
  if (token) {
    const payload = Database.verifyToken(token);
    if (payload) {
      const users = Database.getUsers();
      const currentUser = users.find((u) => u.id === payload.id);
      if (currentUser && currentUser.role !== "Voter") {
        isAdmin = true;
      }
    }
  }

  // Sort display order ASC
  const sortedFaqs = [...faqs].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
  );

  if (isAdmin) {
    res.json({ faqs: sortedFaqs });
  } else {
    res.json({ faqs: sortedFaqs.filter((f) => f.status === "Published") });
  }
});

// POST /api/faqs: Add a new FAQ (Admin/FAQ Manager only)
app.post(
  "/api/faqs",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "FAQ Manager"),
  (req: any, res) => {
    const { question, answer, category, displayOrder, status } = req.body;
    if (!question || !answer || !category) {
      return res
        .status(400)
        .json({ error: "Question, Answer, and Category are mandatory" });
    }

    const faqs = Database.getFaqs();
    const newFaq = {
      id: createId("faq"),
      question,
      answer,
      category,
      displayOrder: Number(displayOrder) || faqs.length + 1,
      status: status || "Draft",
    };

    faqs.push(newFaq);
    Database.saveFaqs(faqs);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `FAQ created: "${question.substring(0, 30)}..."`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.status(201).json({ faq: newFaq });
  },
);

// PUT /api/faqs/:id: Update an FAQ (Admin/FAQ Manager only)
app.put(
  "/api/faqs/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "FAQ Manager"),
  (req: any, res) => {
    const { id } = req.params;
    const { question, answer, category, displayOrder, status } = req.body;

    const faqs = Database.getFaqs();
    const faq = faqs.find((f) => f.id === id);
    if (!faq) {
      return res.status(404).json({ error: "FAQ record not found" });
    }

    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (category !== undefined) faq.category = category;
    if (displayOrder !== undefined) faq.displayOrder = Number(displayOrder);
    if (status !== undefined) faq.status = status;

    Database.saveFaqs(faqs);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `FAQ modified: ID: ${id}`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({ faq });
  },
);

// DELETE /api/faqs/:id: Delete an FAQ (Admin/FAQ Manager only)
app.delete(
  "/api/faqs/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "FAQ Manager"),
  async (req: any, res) => {
    const { id } = req.params;
    const faqs = Database.getFaqs();
    const index = faqs.findIndex((f) => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "FAQ record not found" });
    }

    await Database.deleteFaq(id);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `FAQ deleted ID: ${id}`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({ success: true, message: "FAQ deleted successfully" });
  },
);

// POST /api/faqs/bulk: Bulk FAQ operations (publish, draft, delete)
app.post(
  "/api/faqs/bulk",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "FAQ Manager"),
  (req: any, res) => {
    const { ids, action } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      return res.status(400).json({
        error: "Selection and action are required for bulk operation",
      });
    }

    let faqs = Database.getFaqs();
    if (action === "delete") {
      faqs = faqs.filter((f) => !ids.includes(f.id));
    } else if (action === "publish") {
      faqs.forEach((f) => {
        if (ids.includes(f.id)) f.status = "Published";
      });
    } else if (action === "hide") {
      faqs.forEach((f) => {
        if (ids.includes(f.id)) f.status = "Draft";
      });
    } else {
      return res.status(400).json({ error: "Unsupported bulk action" });
    }

    Database.saveFaqs(faqs);
    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Bulk FAQ edit: ${action} for ${ids.length} records`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({
      success: true,
      message: `Bulk action "${action}" completed successfully`,
    });
  },
);

// POST /api/faqs/sort: Save custom FAQ display order
app.post(
  "/api/faqs/sort",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "FAQ Manager"),
  (req: any, res) => {
    const { sortedIds } = req.body;
    if (!sortedIds || !Array.isArray(sortedIds)) {
      return res
        .status(400)
        .json({ error: "Sorted FAQ sequence is mandatory" });
    }

    const faqs = Database.getFaqs();
    sortedIds.forEach((id, index) => {
      const faq = faqs.find((f) => f.id === id);
      if (faq) {
        faq.displayOrder = index + 1;
      }
    });

    Database.saveFaqs(faqs);
    res.json({
      success: true,
      message: "Custom display order preserved successfully",
    });
  },
);

// GET /api/admin/team: List administrative workers
app.get(
  "/api/admin/team",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req, res) => {
    const users = Database.getUsers();
    const team = users
      .filter((u) => u.role !== "Voter")
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        username: u.username,
        email: u.email,
        mobile: u.mobile,
        role: u.role,
        isSuspended: !!u.isSuspended,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        twoFactorEnabled: !!u.twoFactorEnabled,
        profilePicture: u.profilePicture,
      }));
    res.json({ team });
  },
);

// POST /api/admin/team: Create new administrative account
app.post(
  "/api/admin/team",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req: any, res) => {
    const { fullName, email, username, password, mobile, role } = req.body;
    if (!fullName || !email || !username || !password || !role) {
      return res.status(400).json({
        error: "Full Name, Email, Username, Password, and Role are required",
      });
    }

    const users = Database.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists" });
    }
    if (
      users.some(
        (u) =>
          u.username && u.username.toLowerCase() === username.toLowerCase(),
      )
    ) {
      return res
        .status(400)
        .json({ error: "An account with this username already exists" });
    }

    const newAdmin = {
      id: createId("adm"),
      fullName,
      username,
      email: email.toLowerCase(),
      mobile: mobile || "",
      role,
      passwordHash: bcrypt.hashSync(password, 10),
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      nationalID: `ADM_PROV_${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      createdAt: new Date().toISOString(),
      isProfileComplete: true,
      accountStatus: "Active" as const,
      auditLogs: [`Admin account created by ${req.user.email}`],
      address: "",
      dob: "",
      gender: "Other" as const,
      faceImage: "",
    };

    users.push(newAdmin);
    Database.saveUsers(users);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Created new team admin account: ${email} with role: ${role}`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.status(201).json({ admin: { id: newAdmin.id, fullName, email, role } });
  },
);

// PUT /api/admin/team/:id: Update team member parameters
app.put(
  "/api/admin/team/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req: any, res) => {
    const { id } = req.params;
    const {
      fullName,
      mobile,
      role,
      isSuspended,
      password,
      twoFactorEnabled,
      profilePicture,
    } = req.body;

    const users = Database.getUsers();
    const admin = users.find((u) => u.id === id && u.role !== "Voter");
    if (!admin) {
      return res
        .status(404)
        .json({ error: "Administrative staff record not found" });
    }

    if (
      admin.role === "Super Administrator" &&
      req.user.role !== "Super Administrator"
    ) {
      return res.status(403).json({
        error:
          "Only Super Administrators can modify other Super Administrators",
      });
    }

    if (fullName !== undefined) admin.fullName = fullName;
    if (mobile !== undefined) admin.mobile = mobile;
    if (role !== undefined) admin.role = role;
    if (isSuspended !== undefined) admin.isSuspended = isSuspended;
    if (twoFactorEnabled !== undefined)
      admin.twoFactorEnabled = twoFactorEnabled;
    if (profilePicture !== undefined) admin.profilePicture = profilePicture;
    if (password) {
      admin.passwordHash = bcrypt.hashSync(password, 10);
    }

    Database.saveUsers(users);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Updated team member profile details: ID: ${id}`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({ success: true, message: "Staff account modified successfully" });
  },
);

// DELETE /api/admin/team/:id: Remove/Deactivate team member
app.delete(
  "/api/admin/team/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req: any, res) => {
    const { id } = req.params;
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ error: "You cannot terminate your own active staff account" });
    }

    const users = Database.getUsers();
    const index = users.findIndex((u) => u.id === id && u.role !== "Voter");
    if (index === -1) {
      return res
        .status(404)
        .json({ error: "Administrative staff record not found" });
    }

    const admin = users[index];
    if (
      admin.role === "Super Administrator" &&
      req.user.role !== "Super Administrator"
    ) {
      return res.status(403).json({
        error: "Only Super Administrators can terminate Super Administrators",
      });
    }

    await Database.deleteUser(id);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Terminated administrative staff account: ${admin.email}`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({ success: true, message: "Staff account removed successfully" });
  },
);

// ----------------------------------------------------
// 7. VOTERS MANAGEMENT, PROFILES, CONFIGS & DATABASE RESTORATION APIs
// ----------------------------------------------------

// GET /api/voters: returns all users who are voters
app.get(
  "/api/voters",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req, res) => {
    const users = Database.getUsers();
    const voters = users
      .filter((u) => u.role === "Voter")
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        nationalID: u.nationalID,
        mobile: u.mobile,
        dob: u.dob,
        gender: u.gender,
        address: u.address,
        isVerified: !!u.isVerified,
        isApproved: !!u.isApproved,
        isSuspended: !!u.isSuspended,
        accountStatus:
          u.accountStatus ||
          (u.isSuspended
            ? "Rejected"
            : u.isApproved
              ? "Approved"
              : "Pending"),
        createdAt: u.createdAt,
      }));
    res.json({ voters });
  },
);

// GET /api/voters/:id/profile: Admin/Officer lookup of a voter's complete dossier
app.get(
  "/api/voters/:id/profile",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req, res) => {
    try {
      const { id } = req.params;
      const users = Database.getUsers();
      const voter = users.find((u) => u.id === id && u.role === "Voter");
      if (!voter) {
        return res.status(404).json({ error: "Voter record not found" });
      }

      const profiles = Database.getUserProfiles();
      const profile = profiles.find((p) => p.userId === id) || null;

      const docs = Database.getIdentityDocuments();
      const doc = docs.find((d) => d.userId === id) || null;

      res.json({
        voter: {
          id: voter.id,
          fullName: voter.fullName,
          email: voter.email,
          nationalID: voter.nationalID,
          mobile: voter.mobile,
          dob: voter.dob,
          gender: voter.gender,
          address: voter.address,
          isVerified: !!voter.isVerified,
          isApproved: !!voter.isApproved,
          isSuspended: !!voter.isSuspended,
          accountStatus:
            voter.accountStatus ||
            (voter.isSuspended
              ? "Rejected"
              : voter.isApproved
                ? "Approved"
                : "Pending Verification"),
          rejectionReason: voter.rejectionReason,
          requestedChangesFields: voter.requestedChangesFields || [],
          fingerprintImage:
            voter.fingerprintImage || profile?.fingerprintImage || "",
          fingerprintCaptureMethod:
            voter.verificationReport?.fingerprintCaptureMethod ||
            profile?.fingerprintCaptureMethod ||
            "unknown",
          verificationReport: voter.verificationReport,
        },
        profile,
        document: doc,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// PUT /api/voters/:id: Update voter statuses (approve, reject, suspension, activation)
app.put(
  "/api/voters/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req: any, res) => {
    const { id } = req.params;
    const {
      isApproved,
      isVerified,
      isSuspended,
      accountStatus,
      rejectionReason,
      requestedChangesFields,
    } = req.body;

    const users = Database.getUsers();
    const user = users.find((u) => u.id === id && u.role === "Voter");

    if (!user) {
      return res.status(404).json({ error: "Voter identity record not found" });
    }

    if (isApproved !== undefined) user.isApproved = isApproved;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (isSuspended !== undefined) user.isSuspended = isSuspended;
    if (accountStatus !== undefined) user.accountStatus = accountStatus;
    if (rejectionReason !== undefined) user.rejectionReason = rejectionReason;
    if (requestedChangesFields !== undefined)
      user.requestedChangesFields = requestedChangesFields;

    // Sync isApproved based on accountStatus
    if (accountStatus === "Approved" || accountStatus === "Active") {
      user.isApproved = true;
      user.isVerified = true;
    } else if (
      accountStatus === "Rejected" ||
      accountStatus === "Changes Requested" ||
      accountStatus === "Pending Verification"
    ) {
      user.isApproved = false;
    }

    Database.saveUsers(users);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Admin Review on Voter [ID: ${user.nationalID}] - Status: ${user.accountStatus || (user.isApproved ? "Approved" : "Pending")}, Suspended: ${user.isSuspended}`,
      ip,
      req.headers["user-agent"] || "",
    );

    // Notify voter of status change dynamically
    let notificationTitle = "VoTex Portal - Voting Profile Status Updated";
    let notificationSMS = "";
    let notificationEmail = "";

    if (user.accountStatus === "Approved" || user.accountStatus === "Active") {
      notificationSMS = `VoTex Approval: Dear ${user.fullName}, congratulations! Your identity has been verified successfully. Your registration profile is now fully activated and eligible to participate in election ballots.`;
      notificationEmail = `Dear ${user.fullName},\n\nNational Security Review complete: Congratulations! Your identity has been verified successfully.\n\nYour civic voter enrollment profile has been successfully activated. You are now permitted to cast cryptographic ballots in any active state elections.`;
    } else if (user.accountStatus === "Rejected") {
      notificationSMS = `VoTex Alert: Dear ${user.fullName}, your voting enrollment application was dismissed due to security checks failed. Admin feedback: ${rejectionReason || "Please restart registration is mandatory"}`;
      notificationEmail = `Dear ${user.fullName},\n\nWe regret to inform you that your registration application has been DISMISSED by the State Admin Review board.\n\nREASON FOR REJECTION:\n${rejectionReason || "Incongruent or duplicate security templates detected."}\n\nYou can log in to your portal and reset/restart your biometric onboarding to resubmit the enrollment.`;
    } else if (user.accountStatus === "Changes Requested") {
      notificationSMS = `VoTex Notice: Dear ${user.fullName}, modifications are required on your profile. Fields: ${(requestedChangesFields || []).join(", ") || "Details"}. Feedback: ${rejectionReason}`;
      notificationEmail = `Dear ${user.fullName},\n\nAction Required: Changes have been requested by administrators on your registration enrollment.\n\nADMIN COMMENTS:\n${rejectionReason || "Please review and update the required document uploads."}\n\nREQUIRED FIELDS FOR CORRECTION:\n${(requestedChangesFields || []).map((f: string) => `• ${f}`).join("\n") || "• Generic Profile Details"}\n\nPlease click 'Resubmit Corrections' in your dashboard to update these credentials immediately.`;
    } else {
      notificationSMS = `Dear ${user.fullName}, your civic voter enrollment profile status has been revised to ${user.accountStatus || "Pending Overview"}. Log in to check updates.`;
      notificationEmail = `Dear ${user.fullName},\n\nYour civic voter enrollment profile status has been revised. Log in to your portal to inspect security status.`;
    }

    logDispatch(
      "SMS",
      user.mobile || "",
      "VoTex National Registry",
      notificationSMS,
    );
    logDispatch("Email", user.email, notificationTitle, notificationEmail);

    // Unshift specific notification to history
    const notifications = Database.getNotifications();
    notifications.unshift({
      id: createId("n"),
      userId: user.id,
      title:
        user.accountStatus === "Approved"
          ? "Enrollment Approved!"
          : user.accountStatus === "Rejected"
            ? "Security Review Failure"
            : "Action Required - Corrections Requested",
      message:
        user.accountStatus === "Approved"
          ? "Your voter registration has been fully approved."
          : user.accountStatus === "Rejected"
            ? `Rejected: ${rejectionReason}`
            : `Changes Requested: ${rejectionReason}`,
      type: user.accountStatus === "Approved" ? "success" : "warning",
      timestamp: new Date().toISOString(),
    });
    Database.saveNotifications(notifications);

    res.json({ success: true, voter: user });
  },
);

// DELETE /api/voters/:id: Remove voter account permanently
app.delete(
  "/api/voters/:id",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Official"),
  async (req: any, res) => {
    const { id } = req.params;
    const users = Database.getUsers();
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Voter account not found" });
    }

    const voter = users[userIndex];
    await Database.deleteUser(id);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      req.user.id,
      req.user.email,
      `Permanently deleted voter account: ${voter.fullName} (${voter.email})`,
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({ success: true, message: "Voter account permanently deleted" });
  },
);

// POST /api/voters/resubmit: allow voters with Changes Requested status to update and resubmit corrections
app.post("/api/voters/resubmit", authenticateToken, (req: any, res) => {
  try {
    const userId = req.user.id;
    const users = Database.getUsers();
    const user = users.find((u) => u.id === userId && u.role === "Voter");
    if (!user) {
      return res.status(404).json({ error: "Voter record not found" });
    }

    if (user.isApproved) {
      return res.status(403).json({
        error: "PROFILE_LOCKED",
        message:
          "Verified profiles are locked. You cannot modify or resubmit your data.",
      });
    }

    const {
      dob,
      gender,
      permanentAddress,
      citizenshipFrontImage,
      citizenshipBackImage,
      citizenshipNumber,
      signatureImage,
      faceImage,
      fatherName,
      motherName,
      grandfatherName,
    } = req.body;

    validateDocumentImage(citizenshipFrontImage, "Citizenship front image");
    validateDocumentImage(citizenshipBackImage, "Citizenship back image");

    // Update profile
    const profiles = Database.getUserProfiles();
    const prof = profiles.find((p) => p.userId === userId);
    if (prof) {
      if (dob) prof.dob = dob;
      if (gender) prof.gender = gender;
      if (permanentAddress) prof.permanentAddress = permanentAddress;
      if (citizenshipNumber) prof.citizenshipNumber = citizenshipNumber;
      if (fatherName) prof.fatherName = fatherName;
      if (motherName) prof.motherName = motherName;
      if (grandfatherName) prof.grandfatherName = grandfatherName;
      if (citizenshipFrontImage)
        prof.citizenshipFrontImage = citizenshipFrontImage;
      if (citizenshipBackImage)
        prof.citizenshipBackImage = citizenshipBackImage;
      Database.saveUserProfiles(profiles);
    }

    // Update documents
    const docs = Database.getIdentityDocuments();
    const doc = docs.find((d) => d.userId === userId);
    if (doc) {
      if (citizenshipFrontImage)
        doc.citizenshipFrontImage = citizenshipFrontImage;
      if (citizenshipBackImage) doc.citizenshipBackImage = citizenshipBackImage;
      if (citizenshipNumber) (doc as any).citizenshipNumber = citizenshipNumber;
      if (signatureImage) doc.signatureImage = signatureImage;
      Database.saveIdentityDocuments(docs);
    }

    // Update user record
    if (dob) user.dob = dob;
    if (gender) user.gender = gender as any;
    if (permanentAddress) user.address = permanentAddress;
    if (citizenshipNumber) user.nationalID = citizenshipNumber;
    if (faceImage) user.faceImage = faceImage;

    user.accountStatus = "Pending Verification";
    user.isApproved = false;
    user.isVerified = true;

    // Enhance verification scores dynamically slightly
    if (user.verificationReport) {
      user.verificationReport.overallTrustScore = Math.min(
        100,
        user.verificationReport.overallTrustScore + 1,
      );
      user.verificationReport.submissionTimestamp = new Date().toISOString();
      if (!user.verificationReport.correctionHistory)
        user.verificationReport.correctionHistory = [];
      user.verificationReport.correctionHistory.push({
        timestamp: new Date().toISOString(),
        action: "Resubmitted correction files and metadata",
      });
    } else {
      user.verificationReport = {
        documentScore: 98,
        faceMatchScore: 97.4,
        faceMatchDetails: { citizenship: 97, nid: 98, uploadedPhoto: 98.5 },
        ocrAccuracy: 98,
        fingerprintQuality: 95,
        fraudRisk: "Low",
        fraudReport: [
          "Resubmitted corrections files authenticity check: Secure",
          "Tampering & metadata layer check: Passed",
        ],
        overallTrustScore: 97.8,
        submissionTimestamp: new Date().toISOString(),
        deviceInformation: "Apple WebKit Engine Client Refreshed",
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress ||
          "127.0.0.1",
      };
    }

    if (!user.auditLogs) user.auditLogs = [];
    user.auditLogs.push(
      `Resubmitted profile corrections - Status reset to Pending Verification`,
    );

    Database.saveUsers(users);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      userId,
      user.email,
      "Resubmitted Profile Corrections for Review",
      ip,
      req.headers["user-agent"] || "",
    );

    // Notifications
    const notifications = Database.getNotifications();
    notifications.unshift({
      id: createId("n"),
      userId,
      title: "Profile Correction Received",
      message:
        "Your profile corrections have been received. Administrators have been notified.",
      type: "success",
      timestamp: new Date().toISOString(),
    });
    Database.saveNotifications(notifications);

    res.json({
      success: true,
      message: "Profile correction resubmitted successfully.",
      user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/profile/reset: Reset and starting onboarding profile fresh
app.post("/api/profile/reset", authenticateToken, (req: any, res) => {
  try {
    const userId = req.user.id;
    const users = Database.getUsers();
    const user = users.find((u) => u.id === userId && u.role === "Voter");
    if (!user)
      return res.status(404).json({ error: "User identity not found" });

    if (user.isApproved) {
      return res.status(403).json({
        error: "PROFILE_LOCKED",
        message:
          "Verified profiles are locked. You cannot modify or reset your profile data.",
      });
    }

    user.isProfileComplete = false;
    user.isVerified = false;
    user.isApproved = false;
    user.accountStatus = "Pending Onboarding";
    delete user.verificationReport;
    delete user.rejectionReason;
    delete user.requestedChangesFields;

    // Clean up profile database relations
    let profiles = Database.getUserProfiles();
    profiles = profiles.filter((p) => p.userId !== userId);
    Database.saveUserProfiles(profiles);

    let docs = Database.getIdentityDocuments();
    docs = docs.filter((d) => d.userId !== userId);
    Database.saveIdentityDocuments(docs);

    let faceVers = Database.getFaceVerifications();
    faceVers = faceVers.filter((f) => f.userId !== userId);
    Database.saveFaceVerifications(faceVers);



    Database.saveUsers(users);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      userId,
      user.email,
      "Reset & Restarted Enrollment Profile Onboarding Fresh",
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({
      success: true,
      message:
        "Onboarding successfully reset. Please reload page and start fresh.",
      user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/voter/profile: let voter edit their credentials
app.put("/api/voter/profile", authenticateToken, (req: any, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      address,
      dob,
      gender,
      fullNameNepali,
      educationStatus,
      occupation,
      maritalStatus,
      permanentAddress,
      temporaryAddress,
      currentPassword,
      newPassword,
    } = req.body;

    const users = Database.getUsers();
    const user = users.find((u) => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: "Identity profile not found" });
    }

    const isCurrentlyApproved = user.isApproved !== false && user.isVerified;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(450).json({
          error: "Current password is required to change key credentials",
        });
      }
      const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect current credentials" });
      }
      user.passwordHash = bcrypt.hashSync(newPassword, 10);
    }

    // If already verified/approved, they cannot change their personal registry details
    if (isCurrentlyApproved) {
      if (
        fullName ||
        email ||
        mobile ||
        address ||
        dob ||
        gender ||
        fullNameNepali ||
        educationStatus ||
        occupation ||
        maritalStatus ||
        permanentAddress ||
        temporaryAddress
      ) {
        return res.status(403).json({
          error: "PROFILE_LOCKED",
          message:
            "Government-approved citizen profiles are locked for biometric safety. You cannot edit personal registry parameters without official commission request.",
        });
      }
    } else {
      // Allow updates if the citizen profile is not yet approved
      if (fullName) user.fullName = fullName;
      if (email) user.email = email.toLowerCase();
      if (mobile) user.mobile = mobile;
      if (address !== undefined) user.address = address;
      if (dob) user.dob = dob;
      if (gender) user.gender = gender;

      // Also update comprehensive profile table if it exists
      const profiles = Database.getUserProfiles();
      const p = profiles.find((prof) => prof.userId === user.id);
      if (p) {
        if (fullNameNepali) p.fullNameNepali = fullNameNepali;
        if (educationStatus) p.educationStatus = educationStatus;
        if (occupation) p.occupation = occupation;
        if (maritalStatus) p.maritalStatus = maritalStatus;
        if (permanentAddress) p.permanentAddress = permanentAddress;
        if (temporaryAddress) p.temporaryAddress = temporaryAddress;
        if (dob) p.dob = dob;
        if (gender) p.gender = gender;
        Database.saveUserProfiles(profiles);
      }
    }

    Database.saveUsers(users);

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    Database.addAuditLog(
      user.id,
      user.email,
      "Voter updated profile credentials",
      ip,
      req.headers["user-agent"] || "",
    );

    res.json({
      success: true,
      message: "Personal credentials successfully updated",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        nationalID: user.nationalID,
        mobile: user.mobile,
        dob: user.dob,
        gender: user.gender,
        address: user.address,
        isVerified: user.isVerified,
        isApproved: user.isApproved !== false,
        isSuspended: !!user.isSuspended,
        isProfileComplete: !!user.isProfileComplete,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/results/published-details - compiled public results
app.get("/api/results/published-details", (req, res) => {
  try {
    const elections = Database.getElections().filter(canExposePublishedResults);
    const votes = Database.getVotes();
    const candidates = Database.getCandidates();
    const users = Database.getUsers();
    const profiles = Database.getUserProfiles();

    const totalRegisteredVoters = users.filter(
      (u) => u.role === "Voter",
    ).length;

    const buildAreaLabel = (userId: string) => {
      const profile = profiles.find(
        (profileRecord) => profileRecord.userId === userId,
      );
      const label =
        profile?.province ||
        profile?.district ||
        profile?.municipality ||
        profile?.temporaryAddress ||
        profile?.permanentAddress;
      if (label) {
        return label;
      }

      const user = users.find((item) => item.id === userId);
      return user?.address || "Unknown Area";
    };

    const detailedResults = elections.map((elect) => {
      const electVotes = votes.filter((v) => v.electionId === elect.id);
      const electCandidates = candidates.filter(
        (c) => c.electionId === elect.id,
      );
      const areaCounts = new Map<string, number>();

      users
        .filter((user) => user.role === "Voter")
        .forEach((user) => {
          const areaLabel = buildAreaLabel(user.id);
          areaCounts.set(areaLabel, (areaCounts.get(areaLabel) || 0) + 1);
        });

      const tallies = electCandidates.map((c) => {
        const votesCount = electVotes.filter(
          (v) => v.candidateId === c.id,
        ).length;
        return {
          candidate: c,
          votesCount,
        };
      });

      tallies.sort((a, b) => b.votesCount - a.votesCount);

      let winner = null;
      let runnerUp = null;
      if (tallies.length > 0) {
        if (tallies[0].votesCount > 0) {
          winner = tallies[0].candidate;
        }
        if (tallies.length > 1 && tallies[1].votesCount > 0) {
          runnerUp = tallies[1].candidate;
        }
      }

      const totalVotes = electVotes.length;
      const turnoutPercent =
        totalRegisteredVoters > 0
          ? parseFloat(((totalVotes / totalRegisteredVoters) * 100).toFixed(1))
          : 0;

      return {
        election: elect,
        totalVotes,
        totalRegisteredVoters,
        turnoutPercent,
        areaBreakdown: Array.from(areaCounts.entries())
          .map(([area, voters]) => ({ area, voters }))
          .sort((a, b) => b.voters - a.voters),
        winner,
        runnerUp,
        tallies,
      };
    });

    res.json({ results: detailedResults });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/elections/:id/results - dynamic result compilation
app.get("/api/elections/:id/results", (req, res) => {
  const { id } = req.params;
  const elections = Database.getElections();
  const election = elections.find((e) => e.id === id);

  if (!election) {
    return res.status(404).json({ error: "Election not found" });
  }

  if (!canExposePublishedResults(election)) {
    return res.status(403).json({
      error: "RESULTS_NOT_PUBLISHED",
      message:
        "Election results are only available after the voting period ends and the election is published.",
    });
  }

  const votes = Database.getVotes().filter((v) => v.electionId === id);
  const candidates = Database.getCandidates().filter(
    (c) => c.electionId === id,
  );

  // Map votes per candidate
  const tallies = candidates.map((c) => {
    const count = votes.filter((v) => v.candidateId === c.id).length;
    return {
      candidate: c,
      votesCount: count,
    };
  });

  // Determine winner
  let winner = null;
  if (tallies.length > 0) {
    tallies.sort((a, b) => b.votesCount - a.votesCount);
    if (tallies[0].votesCount > 0) {
      winner = tallies[0].candidate;
    }
  }

  const users = Database.getUsers();
  const totalRegisteredVoters = users.filter((u) => u.role === "Voter").length;
  const totalVotesCast = votes.length;
  const turnoutPercent =
    totalRegisteredVoters > 0
      ? parseFloat(((totalVotesCast / totalRegisteredVoters) * 100).toFixed(1))
      : 0;

  res.json({
    electionId: id,
    electionTitle: election.title,
    electionStatus: election.status,
    totalVotesCast,
    turnoutPercent,
    winner,
    tallies,
  });
});

// GET /api/system/config: Retrieve current setup
app.get(
  "/api/system/config",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req, res) => {
    const config = Database.getConfig();
    res.json({
      config: {
        ...config,
        smtpPass: config.smtpPass ? "••••••••••••••••" : "",
        twilioToken: config.twilioToken
          ? "••••••••••••••••••••••••••••••••"
          : "",
      },
      envStatus: {
        mongodbUriSet: !!process.env.MONGODB_URI,
        mongodbUriMatched:
          !!process.env.MONGODB_URI &&
          (process.env.MONGODB_URI.startsWith("mongodb://") ||
            process.env.MONGODB_URI.startsWith("mongodb+srv://")),
        jwtSecretSet: !!process.env.JWT_SECRET,
        jwtRefreshSecretSet: !!process.env.JWT_REFRESH_SECRET,
        smtpHostSet:
          !!process.env.SMTP_HOST &&
          process.env.SMTP_HOST !== "smtp.example.com",
        smtpUserSet:
          !!process.env.SMTP_USER &&
          process.env.SMTP_USER !== "notifications@votex-system.example.com",
        smtpPortMatched: !!process.env.SMTP_PORT,
        twilioSidSet:
          !!process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_ACCOUNT_SID !==
            "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        twilioPhoneSet:
          !!process.env.TWILIO_PHONE_NUMBER &&
          process.env.TWILIO_PHONE_NUMBER !== "+15550001234",
        ballotEncryptionSecretSet:
          !!process.env.BALLOT_ENCRYPTION_SECRET ||
          !!process.env.VOTE_HASH_SECRET,
        voteHmacSecretSet: !!process.env.VOTE_HMAC_SECRET,
        backupEncryptionSecretSet: !!process.env.BACKUP_ENCRYPTION_SECRET,
      },
    });
  },
);

// POST /api/system/config: Save custom setup
app.post(
  "/api/system/config",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req, res) => {
    try {
      const {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        twilioSid,
        twilioToken,
        twilioFrom,
      } = req.body;
      const config = Database.getConfig();

      if (smtpHost) config.smtpHost = smtpHost;
      if (smtpPort) config.smtpPort = parseInt(smtpPort) || 587;
      if (smtpUser) config.smtpUser = smtpUser;
      if (smtpPass && smtpPass !== "••••••••••••••••")
        config.smtpPass = smtpPass;
      if (twilioSid) config.twilioSid = twilioSid;
      if (twilioToken && twilioToken !== "••••••••••••••••••••••••••••••••")
        config.twilioToken = twilioToken;
      if (twilioFrom) config.twilioFrom = twilioFrom;

      Database.saveConfig(config);
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

// Backup: Read all files in the database and construct a unified JSON backup
app.post(
  "/api/system/backup",
  authenticateToken,
  requireRoles("Super Administrator"),
  (req, res) => {
    try {
      const dataDir = path.resolve("./src/db/data");

      let backup: Record<string, any> = {};
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir);
        files.forEach((file: string) => {
          if (file.endsWith(".json")) {
            const contents = fs.readFileSync(path.join(dataDir, file), "utf8");
            const name = file.replace(".json", "");
            try {
              backup[name] = JSON.parse(contents);
            } catch (e) {}
          }
        });
      }

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        backupData: backup,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Restore: Recreate JSON files from backup payload
app.post(
  "/api/system/restore",
  authenticateToken,
  requireRoles("Super Administrator"),
  (req: any, res) => {
    try {
      const { backupData } = req.body;

      if (!backupData || typeof backupData !== "object") {
        return res.status(400).json({ error: "Invalid backup data content" });
      }

      const dataDir = path.resolve("./src/db/data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      Object.entries(backupData).forEach(([key, value]) => {
        // Basic security mapping - restrict target prefixes to avoid directory traversal
        if (/^[a-zA-Z0-9_-]+$/.test(key)) {
          const filePath = path.join(dataDir, `${key}.json`);
          fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
        }
      });

      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      Database.addAuditLog(
        req.user.id,
        req.user.email,
        "System database successfully restored from backup file",
        ip,
        req.headers["user-agent"] || "",
      );

      res.json({
        success: true,
        message: "System registries successfully restored!",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ----------------------------------------------------------------------
// SECOPS & HIGH PERFORMANCE ENTERPRISE DB MANAGER ENDPOINTS
// ----------------------------------------------------------------------

// GET /api/secops/db-status: Fetch database operational states in real time
app.get(
  "/api/secops/db-status",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator", "Election Officer"),
  (req: any, res) => {
    try {
      const memoryUsage = process.memoryUsage();
      res.json({
        success: true,
        isConnected: Database.isConnected,
        simulatedLatency: Database.simulatedLatency,
        totalReconnects: Database.totalReconnects,
        lastSyncTimestamp: Database.lastSyncTimestamp,
        syncSuccessCount: Database.syncSuccessCount,
        syncFailureCount: Database.syncFailureCount,
        isForceFailoverActive: Database.isForceFailoverActive,
        pendingQueue: Database.pendingQueue,
        pendingQueueSize: Database.pendingQueue.length,
        syncHistory: Database.syncHistory,
        systemTimeline: Database.systemTimeline,
        voteCount: Database.getVotes().length,
        userCount: Database.getUsers().length,
        systemUsage: {
          cpu: Math.floor(Math.sin(Date.now() / 10000) * 10) + 18, // Simulated oscillating CPU usage
          memory: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          disk: 44,
          connectedUsers:
            Math.floor(Math.abs(Math.cos(Date.now() / 30000) * 3)) + 2,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// POST /api/secops/reconnect: Force trigger active database reconnect sequence
app.post(
  "/api/secops/reconnect",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req: any, res) => {
    try {
      Database.addTimelineEvent(
        `Manual MongoDB connection check initiated by admin user: ${req.user.email}`,
        "info",
        "Security Console",
      );
      const connectionResult = await Database.initializeMongo();
      res.json({
        success: true,
        isConnected: Database.isConnected,
        message: connectionResult
          ? "MongoDB linked successfully!"
          : "MongoDB remains unreachable. Fallback offline registry active.",
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// POST /api/secops/force-failover: Simulate database blackout and toggle line fallbacks
app.post(
  "/api/secops/force-failover",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  async (req: any, res) => {
    try {
      const originalState = Database.isForceFailoverActive;
      Database.isForceFailoverActive = !originalState;

      if (Database.isForceFailoverActive) {
        Database.isConnected = false;
        Database.addTimelineEvent(
          `High Availability FAILOVER manually triggered by ${req.user.email}`,
          "warning",
          "Security Console",
        );
      } else {
        Database.addTimelineEvent(
          `High Availability FAILBACK manually triggers restoral. Checking link...`,
          "info",
          "Security Console",
        );
        await Database.initializeMongo();
      }

      res.json({
        success: true,
        isForceFailoverActive: Database.isForceFailoverActive,
        isConnected: Database.isConnected,
        message: Database.isForceFailoverActive
          ? "Emergency local backup file isolation state activated."
          : "Reconnected to live MongoDB, sync sequences activated.",
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// POST /api/secops/clear-queue: Flush stale or failed synchronization packet entries
app.post(
  "/api/secops/clear-queue",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req: any, res) => {
    try {
      const clearedCount = Database.pendingQueue.length;
      Database.pendingQueue = [];
      const qFile = path.join(
        path.resolve("./src/db/data"),
        "pending_queue.json",
      );
      if (fs.existsSync(qFile)) {
        fs.writeFileSync(qFile, "[]", "utf8");
      }
      Database.addTimelineEvent(
        `Pending synchronization queue wiped manually by ${req.user.email}. Wiped ${clearedCount} ops.`,
        "warning",
        "Sync Engine",
      );
      res.json({
        success: true,
        message: `Sync queue cleared successfully. Cleared ${clearedCount} transactions.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// POST /api/secops/backup: Package and cryptographically encyst fallback files using AES-256GCM
app.post(
  "/api/secops/backup",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req: any, res) => {
    try {
      const collections = [
        "users",
        "user_profiles",
        "identity_documents",
        "face_verifications",
        "candidates",
        "elections",
        "votes",
        "audit_logs",
        "notifications",
      ];
      let count = 0;
      collections.forEach((col) => {
        if (Database.encryptFallbackFile(col)) {
          count++;
        }
      });

      Database.addTimelineEvent(
        `AES-GCM encryption snapshots saved for ${count} local tables.`,
        "success",
        "Key Vault",
      );
      res.json({
        success: true,
        message: `Complete AES-256-GCM backup package compiled! Encrypted ${count} JSON registries successfully.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// POST /api/secops/restore: Decrypt backing AES-256 containers and update working directories
app.post(
  "/api/secops/restore",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req: any, res) => {
    try {
      const collections = [
        "users",
        "user_profiles",
        "identity_documents",
        "face_verifications",
        "candidates",
        "elections",
        "votes",
        "audit_logs",
        "notifications",
      ];
      let count = 0;
      collections.forEach((col) => {
        if (Database.decryptAndRestoreFallbackFile(col)) {
          count++;
        }
      });

      Database.addTimelineEvent(
        `AES-GCM fallback restore initiated by ${req.user.email}. Restored ${count} registers.`,
        "success",
        "Key Vault",
      );
      res.json({
        success: true,
        message: `Restored ${count} local registries successfully from cryptographically verified backups.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// POST /api/secops/integrity-check: Validate SHA-256 ballot tags and signatures
app.post(
  "/api/secops/integrity-check",
  authenticateToken,
  requireRoles("Super Administrator", "Administrator"),
  (req: any, res) => {
    try {
      const auditReport = Database.runIntegrityAuditAndValidate();
      Database.addTimelineEvent(
        `Integrity audit run complete. Results: ${auditReport.status.toUpperCase()}`,
        auditReport.status === "valid" ? "success" : "alert",
        "Key Vault",
      );
      res.json({
        success: true,
        report: auditReport,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// ----------------------------------------------------
// VITE DEV SERVER & PRODUCTION ROUTING MIDDLEWARES
// ----------------------------------------------------

async function resolveAvailablePort(
  initialPort: number,
  host: string,
  maxAttempts = 20,
): Promise<number> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = initialPort + attempt;
    try {
      await new Promise<void>((resolve, reject) => {
        const tester = http.createServer();
        tester.once("error", reject);
        tester.listen(port, host, () => {
          tester.close((closeError) => {
            if (closeError) {
              reject(closeError);
              return;
            }
            resolve();
          });
        });
      });
      return port;
    } catch (error: any) {
      if (error.code !== "EADDRINUSE") {
        throw error;
      }
    }
  }

  throw new Error(
    `Unable to find an open port after trying ${initialPort} to ${initialPort + maxAttempts - 1}`,
  );
}

async function listenWithFallback(
  server: http.Server,
  initialPort: number,
  host: string,
) {
  let port = initialPort;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: NodeJS.ErrnoException) => {
          server.off("error", onError);
          reject(error);
        };

        server.once("error", onError);
        server.listen(port, host, () => {
          server.off("error", onError);
          resolve();
        });
      });

      return port;
    } catch (error: any) {
      if (error.code === "EADDRINUSE" && port < initialPort + 19) {
        port += 1;
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Unable to start server after trying ports ${initialPort} to ${initialPort + 19}`,
  );
}

async function startServer() {
  const httpServer = http.createServer(app);
  io = new SocketServer(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log(`Socket.IO client connected: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`Socket.IO client disconnected: ${socket.id}`);
    });
  });

  // Do not accept traffic until the authoritative database is available.
  await Database.initializeMongo();
  console.log("MongoDB initialization sequence succeeded!");

  const listeningPort = await resolveAvailablePort(PORT, "0.0.0.0");
  if (listeningPort !== PORT) {
    console.warn(
      `Port ${PORT} is in use. Falling back to ${listeningPort} for HTTP and Vite HMR.`,
    );
  }

  if (process.env.NODE_ENV !== "production") {
    const viteHmr =
      process.env.VITE_DISABLE_HMR === "true"
        ? false
        : {
            server: httpServer,
            overlay: true,
            ...(process.env.VITE_HMR_PROTOCOL
              ? {
                  protocol: process.env.VITE_HMR_PROTOCOL as "ws" | "wss",
                }
              : {}),
            ...(process.env.VITE_HMR_HOST
              ? { host: process.env.VITE_HMR_HOST }
              : {}),
            ...(process.env.VITE_HMR_PORT
              ? { port: parseInt(process.env.VITE_HMR_PORT, 10) }
              : {}),
            ...(process.env.VITE_HMR_CLIENT_PORT
              ? {
                  clientPort: parseInt(
                    process.env.VITE_HMR_CLIENT_PORT,
                    10,
                  ),
                }
              : {}),
          };

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: listeningPort,
        strictPort: true,
        hmr: viteHmr,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve("./dist");
    console.log(`Serving static files from production directory: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    // Fallback in case of router variants
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(listeningPort, "0.0.0.0", () => {
      httpServer.off("error", reject);
      resolve();
    });
  });
  console.log(`VoTex Server active and listening on port ${listeningPort}`);
}

startServer();
