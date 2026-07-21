import crypto from "crypto";
import { Database, User } from "../src/db/dbService.js";
import type {
  MatchFaceInput,
  VerifyFaceLivenessInput,
} from "../validators/faceVerification.validator.js";

const DEFAULT_FACE_MATCH_THRESHOLD = 0.82;
const VERIFICATION_TTL_MS = 10 * 60 * 1000;

export type FaceVerificationDecision = {
  verificationId: string;
  verificationResult: "Passed" | "Failed";
  verificationStatus: "Verified" | "Rejected";
  similarityScore: number;
  threshold: number;
  message: string;
  expiresAt?: string;
};

type RequestContext = {
  ipAddress: string;
  userAgent: string;
};

const nowIso = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

function getThreshold() {
  const configured = Number(process.env.FACE_MATCH_THRESHOLD);
  if (Number.isFinite(configured) && configured >= 0.5 && configured <= 0.98) {
    return configured;
  }
  return DEFAULT_FACE_MATCH_THRESHOLD;
}

function normalizeImageForHash(image: string) {
  return image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function inverseDistanceSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    sum += Math.pow(a[i] - b[i], 2);
  }

  const rmse = Math.sqrt(sum / length);
  return Math.max(0, 1 - rmse);
}

function compareTemplates(liveTemplate: number[], registeredTemplate: number[]) {
  const cosine = cosineSimilarity(liveTemplate, registeredTemplate);
  const distance = inverseDistanceSimilarity(liveTemplate, registeredTemplate);
  return Math.max(0, Math.min(1, cosine * 0.65 + distance * 0.35));
}

function getLatestRegisteredFaceTemplate(user: User) {
  if (Array.isArray(user.faceTemplate) && user.faceTemplate.length >= 8) {
    return user.faceTemplate;
  }

  const verifications = Database.getFaceVerifications() as any[];
  const latestVerified = verifications
    .filter(
      (record) =>
        record.userId === user.id &&
        (record.verificationStatus === "Verified" ||
          record.verificationResult === "Passed") &&
        Array.isArray(record.faceTemplate) &&
        record.faceTemplate.length >= 8,
    )
    .sort(
      (a, b) =>
        new Date(
          b.verificationTimestamp || b.verificationTime || 0,
        ).getTime() -
        new Date(a.verificationTimestamp || a.verificationTime || 0).getTime(),
    )[0];

  return latestVerified?.faceTemplate || null;
}

function createAuditLog(
  user: User,
  action: string,
  context: RequestContext,
) {
  return Database.addAuditLog(
    user.id,
    user.email,
    action,
    context.ipAddress,
    context.userAgent,
  );
}

function getRecord(verificationId: string, userId: string) {
  const verifications = Database.getFaceVerifications() as any[];
  const record = verifications.find(
    (entry) => entry.id === verificationId && entry.userId === userId,
  );
  return { record, verifications };
}

function livenessPassed(input: VerifyFaceLivenessInput) {
  const checks = input.livenessChecks;
  return (
    checks.faceDetected &&
    checks.leftEye &&
    checks.rightEye &&
    checks.nose &&
    checks.mouth &&
    checks.faceCentered &&
    checks.blinkDetected &&
    checks.headTurnLeft &&
    checks.headTurnRight &&
    checks.returnedToCenter &&
    checks.imageQualityGood &&
    checks.lightingGood &&
    checks.distanceGood &&
    checks.stable &&
    input.quality.qualityScore >= 72 &&
    input.quality.livenessScore >= 80 &&
    input.quality.brightness >= 35 &&
    input.quality.brightness <= 82 &&
    input.quality.sharpness >= 28
  );
}

export class FaceVerificationService {
  static start(user: User, electionId: string, context: RequestContext) {
    const verifications = Database.getFaceVerifications() as any[];
    const auditLog = createAuditLog(
      user,
      `Camera opened for live face verification in election "${electionId}"`,
      context,
    );

    const record = {
      id: createId("face_live"),
      userId: user.id,
      electionId,
      faceImage: "",
      faceTemplate: [],
      verificationStatus: "Pending",
      verificationResult: "Pending",
      verificationMethod: "webcam-liveness-facemesh",
      verificationTimestamp: nowIso(),
      verificationTime: nowIso(),
      auditLogId: auditLog.id,
      capturedImagePath: null,
      deviceInformation: context.userAgent.substring(0, 180),
      ipAddress: context.ipAddress,
      livenessChecks: {},
      quality: {},
      consumedAt: null,
    };

    verifications.unshift(record);
    Database.saveFaceVerifications(verifications as any);

    return {
      verificationId: record.id,
      status: record.verificationStatus,
      threshold: getThreshold(),
    };
  }

  static verifyLiveness(
    user: User,
    input: VerifyFaceLivenessInput,
    context: RequestContext,
  ) {
    const { record, verifications } = getRecord(input.verificationId, user.id);
    if (!record) {
      throw Object.assign(new Error("Verification session was not found."), {
        status: 404,
      });
    }

    const passed = livenessPassed(input);
    record.electionId = input.electionId;
    record.livenessChecks = input.livenessChecks;
    record.quality = input.quality;
    record.verificationTimestamp = nowIso();
    record.verificationTime = nowIso();
    record.verificationStatus = passed ? "Pending" : "Rejected";
    record.verificationResult = passed ? "Liveness Passed" : "Failed";

    const auditLog = createAuditLog(
      user,
      passed
        ? `Liveness completed for election "${input.electionId}"`
        : `Liveness failed for election "${input.electionId}"`,
      context,
    );
    record.auditLogId = auditLog.id;

    Database.saveFaceVerifications(verifications as any);

    return {
      passed,
      message: passed
        ? "Liveness checks completed. Matching face with registered template."
        : "The live check was not strong enough. Please retry in better lighting and follow the prompts.",
    };
  }

  static match(
    user: User,
    input: MatchFaceInput,
    context: RequestContext,
  ): FaceVerificationDecision {
    const { record, verifications } = getRecord(input.verificationId, user.id);
    if (!record) {
      throw Object.assign(new Error("Verification session was not found."), {
        status: 404,
      });
    }

    if (!livenessPassed(input)) {
      record.verificationStatus = "Rejected";
      record.verificationResult = "Failed";
      record.similarityScore = 0;
      record.failureReason = "Liveness checks did not pass.";
      createAuditLog(
        user,
        `Verification failed for election "${input.electionId}": liveness rejected`,
        context,
      );
      Database.saveFaceVerifications(verifications as any);
      return {
        verificationId: record.id,
        verificationResult: "Failed",
        verificationStatus: "Rejected",
        similarityScore: 0,
        threshold: getThreshold(),
        message: "Liveness verification failed. Voting remains locked.",
      };
    }

    const registeredTemplate = getLatestRegisteredFaceTemplate(user);
    if (!registeredTemplate) {
      record.verificationStatus = "Rejected";
      record.verificationResult = "Failed";
      record.similarityScore = 0;
      record.failureReason = "No registered face template was available.";
      createAuditLog(
        user,
        `Verification failed for election "${input.electionId}": no registered face template`,
        context,
      );
      Database.saveFaceVerifications(verifications as any);
      return {
        verificationId: record.id,
        verificationResult: "Failed",
        verificationStatus: "Rejected",
        similarityScore: 0,
        threshold: getThreshold(),
        message:
          "No registered face template is available for this voter profile. Please contact support.",
      };
    }

    const threshold = getThreshold();
    const similarityScore = Number(
      compareTemplates(input.faceTemplate, registeredTemplate).toFixed(4),
    );
    const passed = similarityScore >= threshold;
    const auditLog = createAuditLog(
      user,
      passed
        ? `Verification passed for election "${input.electionId}" with score ${similarityScore}`
        : `Verification failed for election "${input.electionId}" with score ${similarityScore}`,
      context,
    );

    record.electionId = input.electionId;
    record.faceImage = "";
    record.faceTemplate = input.faceTemplate;
    record.capturedImageHash = sha256(normalizeImageForHash(input.capturedImage));
    record.capturedImagePath = null;
    record.verificationStatus = passed ? "Verified" : "Rejected";
    record.verificationResult = passed ? "Passed" : "Failed";
    record.similarityScore = similarityScore;
    record.threshold = threshold;
    record.verificationMethod = "webcam-liveness-facemesh";
    record.verificationTimestamp = nowIso();
    record.verificationTime = nowIso();
    record.auditLogId = auditLog.id;
    record.expiresAt = passed
      ? new Date(Date.now() + VERIFICATION_TTL_MS).toISOString()
      : null;

    Database.saveFaceVerifications(verifications as any);

    return {
      verificationId: record.id,
      verificationResult: passed ? "Passed" : "Failed",
      verificationStatus: passed ? "Verified" : "Rejected",
      similarityScore,
      threshold,
      expiresAt: record.expiresAt || undefined,
      message: passed
        ? "Verification successful. You may continue to cast your vote."
        : "Face verification failed. The live face did not match the registered voter template.",
    };
  }

  static getStatus(user: User, electionId?: string) {
    const verifications = Database.getFaceVerifications() as any[];
    const latest = verifications
      .filter(
        (record) =>
          record.userId === user.id &&
          (!electionId || record.electionId === electionId),
      )
      .sort(
        (a, b) =>
          new Date(
            b.verificationTimestamp || b.verificationTime || 0,
          ).getTime() -
          new Date(a.verificationTimestamp || a.verificationTime || 0).getTime(),
      )[0];

    if (!latest) {
      return { verified: false, status: "Not Started" };
    }

    const verified =
      latest.verificationResult === "Passed" &&
      latest.verificationStatus === "Verified" &&
      !latest.consumedAt &&
      latest.expiresAt &&
      new Date(latest.expiresAt).getTime() > Date.now();

    return {
      verified,
      verificationId: latest.id,
      status: latest.verificationStatus,
      result: latest.verificationResult,
      similarityScore: latest.similarityScore || 0,
      threshold: latest.threshold || getThreshold(),
      expiresAt: latest.expiresAt || null,
    };
  }

  static findUsableVerification(
    userId: string,
    electionId: string,
    verificationId?: string,
  ) {
    const verifications = Database.getFaceVerifications() as any[];
    return verifications.find(
      (record) =>
        record.userId === userId &&
        record.electionId === electionId &&
        (!verificationId || record.id === verificationId) &&
        record.verificationStatus === "Verified" &&
        record.verificationResult === "Passed" &&
        !record.consumedAt &&
        record.expiresAt &&
        new Date(record.expiresAt).getTime() > Date.now(),
    );
  }

  static consume(verificationId: string) {
    const verifications = Database.getFaceVerifications() as any[];
    const record = verifications.find((entry) => entry.id === verificationId);
    if (record) {
      record.consumedAt = nowIso();
      Database.saveFaceVerifications(verifications as any);
    }
  }
}
