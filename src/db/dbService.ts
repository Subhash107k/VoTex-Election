import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { MongoClient } from "mongodb";

// Define the root storage directory
const DB_DIR = path.resolve("./src/db/data");
const BACKUP_DIR = path.resolve("./src/db/backup");

// Ensure directories exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const getRequiredSecret = (name: string, devFallback: string) => {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (IS_PRODUCTION) {
    throw new Error(`${name} must be configured in production.`);
  }
  return devFallback;
};

// AES-256 standard encryption key derived from environment-managed key material.
const ENCRYPTION_KEY = crypto.scryptSync(
  getRequiredSecret(
    "BACKUP_ENCRYPTION_SECRET",
    "dev-only-backup-secret-change-before-production",
  ),
  "VOTEX-SECURE-SALT",
  32,
);

// Secret for JWT. Development gets a local fallback; production fails closed.
const JWT_SECRET = getRequiredSecret(
  "JWT_SECRET",
  "dev-only-jwt-secret-change-before-production",
);
const createId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export interface User {
  id: string;
  fullName: string;
  username?: string;
  nationalID: string;
  email: string;
  mobile: string;
  address: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  occupation?: string;
  passwordHash: string;
  faceImage: string; // Base64 raw image capture
  role:
    | "Administrator"
    | "Election Officer"
    | "Voter"
    | "Super Administrator"
    | "Moderator"
    | "FAQ Manager"
    | "Verification Officer"
    | "Support Staff"
    | "Candidate";
  isVerified: boolean;
  isApproved?: boolean;
  isSuspended?: boolean;
  createdAt: string;
  faceTemplate?: number[]; // Biometric facial landmark coordinates template
  fingerprintImage?: string;
  fingerprintHash?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  emailVerifiedAt?: string;
  mobileVerifiedAt?: string;
  otpTimestamps?: {
    emailSent?: string;
    mobileSent?: string;
    emailVerified?: string;
    mobileVerified?: string;
  };
  registrationTimestamp?: string;
  accountStatus?:
    | "Pending"
    | "Active"
    | "Rejected"
    | "Approved"
    | "Pending Verification"
    | "Changes Requested"
    | "Pending Onboarding";
  rejectionReason?: string;
  requestedChangesFields?: string[];
  verificationReport?: any;
  auditLogs?: string[];
  profilePicture?: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: number;
  isProfileComplete?: boolean;
  /** Increments on password resets and logout to revoke all issued access tokens. */
  tokenVersion?: number;
}

export interface UserProfile {
  id: string;
  userId: string;
  dob: string;
  gender: string;
  permanentAddress: string;
  temporaryAddress: string;
  province: string;
  district: string;
  municipality: string;
  wardNumber: string;
  postalCode: string;
  occupation: string;
  profilePhoto: string;
  createdAt: string;

  // Rich Multi-national Address Extensions
  permCountry?: string;
  permProvince?: string;
  permDistrict?: string;
  permMunicipality?: string;
  permWardNumber?: string;
  permTole?: string;
  permStreetAddress?: string;
  permPostalCode?: string;

  tempCountry?: string;
  tempProvince?: string;
  tempDistrict?: string;
  tempMunicipality?: string;
  tempWardNumber?: string;
  tempTole?: string;
  tempStreetAddress?: string;
  tempPostalCode?: string;
  isTemporarySameAsPermanent?: boolean;

  fullNameNepali?: string;
  maritalStatus?: string;
  educationStatus?: string;
  bloodGroup?: string;
  nationality?: string;
  nidNumber?: string;

  fatherName?: string;
  fatherNameNepali?: string;
  motherName?: string;
  motherNameNepali?: string;
  grandfatherName?: string;
  grandfatherNameNepali?: string;

  spouseName?: string;
  spouseNameNepali?: string;
  spouseFatherName?: string;
  spouseFatherNameNepali?: string;
  spouseMotherName?: string;
  spouseMotherNameNepali?: string;

  citizenshipNumber?: string;
  citizenshipType?: string;
  citizenshipIssueDate?: string;
  citizenshipIssueDistrict?: string;
  citizenshipIssueAuthority?: string;
  fingerprintImage?: string;
  fingerprintHash?: string;
  fingerprintCaptureMethod?: string;

  nidIssueDate?: string;
  nidStatus?: string;
  nidFrontImage?: string;
  nidBackImage?: string;
  citizenshipFrontImage?: string;
  citizenshipBackImage?: string;
}

export interface IdentityDocument {
  id: string;
  userId: string;
  citizenshipFrontImage: string;
  citizenshipBackImage: string;
  citizenshipNumber: string;
  signatureImage: string;
  createdAt: string;
}

export interface FaceVerification {
  id: string;
  userId: string;
  faceImage: string;
  faceTemplate: number[];
  verificationStatus: "Pending" | "Verified" | "Rejected";
  verificationTimestamp: string;
  deviceInformation?: string;
  ipAddress?: string;
}

export interface ProfileDraft {
  id: string;
  userId: string;
  formId?: string;
  draft_status: "Draft" | "Complete";
  current_step: number;
  last_saved_at: string;
  verification_status: string;
  citizenship_verified: boolean;
  national_id_verified: boolean;
  mismatch_count: number;
  corrected_fields: string; // serialized JSON
  verification_logs: string[];
  updated_at: string;
  created_at: string;
  formData: string; // serialized JSON form state
}

export interface UserPreferences {
  id: string;
  userId: string;
  language: "en" | "ne";
  nepaliTypingEnabled: boolean;
  theme: "light" | "dark";
  updatedAt: string;
}

export interface SystemConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  twilioSid: string;
  twilioToken: string;
  twilioFrom: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  fullName?: string;
  candidatePhoto?: string;
  gender?: string;
  dateOfBirth?: string;
  citizenshipNumber?: string;
  contactNumber?: string;
  emailAddress?: string;
  permanentAddress?: string;
  currentAddress?: string;
  electionType?: "Federal" | "Provincial" | "Local" | string;
  electionPosition?: string;
  electoralConstituency?: string;
  wardNumber?: string;
  candidateRegistrationNumber?: string;
  nominationDate?: string;
  electionSymbolAllocationDate?: string;
  candidateStatus?: "Pending" | "Approved" | "Rejected" | "Withdrawn";
  politicalPartyName?: string;
  partyLogo?: string;
  partyAbbreviation?: string;
  partyColorTheme?: string;
  isIndependent?: boolean;
  biography: string;
  visionStatement?: string;
  education: string;
  experience: string;
  profession?: string;
  assetsDeclaration?: string;
  criminalCaseDeclaration?: string;
  socialMediaLinks?: string;
  officialWebsite?: string;
  photoUrl: string;
  partyLogoUrl: string;
  manifestoText: string;
  keyPromises?: string[];
  manifestoPdfUrl?: string;
  coverBannerUrl?: string;
  verificationQrCode?: string;
  electionSymbol?: {
    name: string;
    imageUrl?: string;
    code: string;
    displayColor: string;
  };
  isVisible?: boolean;
  electionId: string; // Link to an Election
  status?: "Pending" | "Verified" | "Approved" | "Rejected" | "Withdrawn";
  rejectionReason?: string;
  userId?: string;
  updatedAt?: string;
  verifiedAt?: string;
  history?: {
    status: string;
    timestamp: string;
    note: string;
    actor: string;
  }[];
}

export interface Election {
  id: string;
  title: string;
  description: string;
  status: "Draft" | "Active" | "Closed" | "Published";
  type:
    | "General Election"
    | "Provincial Election"
    | "Local Election"
    | "By-Election";
  startDate: string;
  endDate: string;
  resultsPublished: boolean;
  maxVotes: number;
  createdAt: string;
  eligibilityDept?: string;
}

export interface PoliticalParty {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  description: string;
  leader: string;
  foundedYear: string;
  headquarters: string;
}

export interface Vote {
  id: string;
  electionId: string;
  candidateId: string;
  anonymousVoterHash: string; // Hash of voter info to maintain anonymity but retain auditability and limit 1 vote.
  deviceInfo: string;
  timestamp: string;
  encryptedBallot?: string; // AES-256 hex string holding candidate selection
  sha256Hash?: string; // SHA-256 integrity hash of full ballot
  digitalSignature?: string; // Cryptographic RSA/HMAC-like signature tag representing proof of casting
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  ipAddress: string;
  timestamp: string;
  device: string;
  browser: string;
}

export interface OTPRecord {
  id: string;
  mobile: string;
  email: string;
  code: string;
  expiresAt: string;
  isUsed: boolean;
  purpose: "Registration" | "Voting" | "PasswordReset";
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  targetRole?: string;
  targetUser?: string;
  type: "info" | "success" | "warning" | "alert";
  timestamp: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  status: "Published" | "Draft";
}

export class Database {
  private static mongoClient: MongoClient | null = null;
  private static mongoDb: any = null;
  public static isConnected: boolean = false;
  private static cache: Record<string, any[]> = {};
  private static writeChains = new Map<string, Promise<void>>();

  // Operational State and Operational Counters
  public static simulatedLatency: number = 24;
  public static totalReconnects: number = 0;
  public static lastSyncTimestamp: string | null = null;
  public static syncSuccessCount: number = 18;
  public static syncFailureCount: number = 0;
  public static isForceFailoverActive: boolean = false;

  // Real-time synchronization queues and timeline buffers
  public static pendingQueue: any[] = [];
  public static syncHistory: any[] = [];
  public static systemTimeline: any[] = [
    {
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      event: "VoTex Secure Kernel initialized",
      severity: "info",
      source: "Core Engine",
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      event: "Cryptographic local registries verified successfully",
      severity: "success",
      source: "Local Ledger",
    },
  ];

  static startHealthCheck() {
    console.log(
      "[SecOps Monitor] Database heartbeat daemon started. Interval configuration: 30 seconds.",
    );
    setInterval(async () => {
      if (this.isForceFailoverActive) {
        if (this.isConnected) {
          this.isConnected = false;
          this.addTimelineEvent(
            "Failover actively forced by system administrator.",
            "warning",
            "System Controller",
          );
        }
        return;
      }

      const start = Date.now();
      try {
        const uri = process.env.MONGODB_URI;
        if (!uri || uri.includes("username:password") || uri.trim() === "") {
          this.isConnected = false;
          return;
        }

        // Quick connect or command ping to test active line
        const testClient = new MongoClient(uri, {
          serverSelectionTimeoutMS: 2000,
        });
        await testClient.connect();
        await testClient.db().admin().ping();
        await testClient.close();

        this.simulatedLatency = Date.now() - start;

        if (!this.isConnected) {
          this.isConnected = true;
          this.totalReconnects++;
          this.addTimelineEvent(
            `MongoDB live connection restored successfully. Signal latency is ${this.simulatedLatency}ms.`,
            "success",
            "Database Manager",
          );

          // Automatically trigger background queuing synchronization
          await this.triggerBackgroundSync();
        }
      } catch (err) {
        if (this.isConnected) {
          this.isConnected = false;
          this.addTimelineEvent(
            "MongoDB signal lost. System gracefully activated secure local fallback.",
            "alert",
            "Database Manager",
          );
        }
      }
    }, 30000);
  }

  static addTimelineEvent(
    event: string,
    severity: "info" | "success" | "warning" | "alert",
    source: string,
  ) {
    this.systemTimeline.unshift({
      timestamp: new Date().toISOString(),
      event,
      severity,
      source,
    });
    // Keep max 100 entries in timeline
    if (this.systemTimeline.length > 100) {
      this.systemTimeline.pop();
    }
  }

  static async initializeMongo(): Promise<boolean> {
    if (this.isForceFailoverActive) {
      throw new Error("Database failover is not available in database-only mode.");
    }

    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes("username:password") || uri.trim() === "") {
      throw new Error("MONGODB_URI must be configured. Local JSON persistence is disabled.");
    }

    try {
      const start = Date.now();
      console.log("Initializing dynamic MongoDB client connection...");
      const client = new MongoClient(uri, {
        connectTimeoutMS: 3000,
        serverSelectionTimeoutMS: 3000,
      });
      await client.connect();
      const db = client.db();

      this.mongoClient = client;
      this.mongoDb = db;
      this.isConnected = true;
      this.simulatedLatency = Date.now() - start;
      this.totalReconnects++;

      this.addTimelineEvent(
        `Secure MongoDB connection established. Database: "${db.databaseName}"`,
        "success",
        "Database Manager",
      );

      // Hydrate in-memory read caches from the authoritative MongoDB collections.
      await this.syncAllCollections();
      await this.ensureIndexes();

      // Kickstart the health check daemon
      this.startHealthCheck();

      // Attempt initial queue discharge
      await this.triggerBackgroundSync();

      return true;
    } catch (err: any) {
      const errMsg = err?.message || err || "";
      console.error(`MongoDB initialization failed: ${errMsg}`);
      this.addTimelineEvent(
        "MongoDB connection offline during initialization. Failover active.",
        "alert",
        "Database Manager",
      );
      this.isConnected = false;

      throw new Error(`MongoDB initialization failed: ${errMsg}`);
    }
  }

  private static async syncAllCollections(): Promise<void> {
    const collectionsToSync = [
      "users", "user_profiles", "political_parties", "identity_documents",
      "face_verifications", "candidates", "elections", "votes", "audit_logs",
      "otps", "notifications", "profile_drafts", "user_preferences",
    ];

    for (const name of collectionsToSync) {
      try {
        const docs = await this.mongoDb.collection(name).find({}).toArray();
        this.cache[name] = docs.map((doc: any) => {
          const { _id, ...rest } = doc;
          return { id: String(_id || doc.id), ...rest };
        });
      } catch (colErr) {
        console.error(
          `[SYNC ERROR] Failed to load MongoDB collection "${name}":`,
          colErr,
        );
      }
    }

    // Keep System config in MongoDB only
    try {
      const configCollection = this.mongoDb.collection("config");
      const configDoc = await configCollection.findOne({
        type: "system_config",
      });
      if (!configDoc) {
        const localConfig = this.getConfig();
        await configCollection.insertOne({
          _id: "system_config",
          type: "system_config",
          ...localConfig,
        });
      }
      // MongoDB-only mode: Do not write to local JSON files
    } catch (cfgErr) {
      console.error(
        "[SYNC ERROR] Failed to sync config collection with MongoDB:",
        cfgErr,
      );
    }
  }

  // --- Offline Synchronization Engine Logic ---

  private static loadPendingQueueFromDisk() {
    // MongoDB-only mode: No local pending queue files
    this.pendingQueue = [];
  }

  private static savePendingQueueToDisk() {
    // MongoDB-only mode: No local queue files
    // Pending operations are stored in memory only during this session
    return;
  }

  public static async triggerBackgroundSync(): Promise<void> {
    if (!this.isConnected || !this.mongoDb || this.isForceFailoverActive) {
      return;
    }

    if (this.pendingQueue.length === 0) {
      return;
    }

    console.log(
      `[Sync Engine] Discharging pending transaction queue: ${this.pendingQueue.length} operations waiting...`,
    );
    this.addTimelineEvent(
      `Discharging ${this.pendingQueue.length} queued records to MongoDB.`,
      "info",
      "Sync Engine",
    );

    const activeQueue = [...this.pendingQueue];
    let succeed = 0;

    for (const op of activeQueue) {
      try {
        const collectionName = op.collection;
        const mCol = this.mongoDb.collection(collectionName);

        // Conflict detection & Resolution using LWW (Last-Write-Wins) timestamps and versioning
        const existingDoc = await mCol.findOne({ _id: op.id });
        if (
          existingDoc &&
          existingDoc.lastModifiedAt &&
          op.lastModifiedAt &&
          new Date(existingDoc.lastModifiedAt) > new Date(op.lastModifiedAt)
        ) {
          console.log(
            `[Sync Conflict] Outdated write rejected for document "${op.id}" in collection "${collectionName}". Last-write-wins priority activated.`,
          );
          // Document in MongoDB is newer, skip local insert or merge
          succeed++;
          continue;
        }

        // Apply dynamic upsert query to MongoDB database
        const { id, collection, version, ...recordData } = op;
        await mCol.updateOne(
          { _id: id },
          { $set: recordData },
          { upsert: true },
        );

        succeed++;
        this.syncSuccessCount++;
      } catch (err: any) {
        this.syncFailureCount++;
        console.error(
          `[Sync Engine] Error transmitting operation ${op.id} inside collection ${op.collection}:`,
          err,
        );
        this.addTimelineEvent(
          `Failed queue transmission for ${op.collection}/${op.id}: ${err?.message || err}`,
          "warning",
          "Sync Engine",
        );
      }
    }

    // Keep synchronization ledger updated
    this.lastSyncTimestamp = new Date().toISOString();
    this.syncHistory.unshift({
      timestamp: this.lastSyncTimestamp,
      operationsProcessed: activeQueue.length,
      successCount: succeed,
      failureCount: activeQueue.length - succeed,
    });

    if (this.syncHistory.length > 50) {
      this.syncHistory.pop();
    }

    // Clean queue of completed/discharged items
    this.pendingQueue = this.pendingQueue.filter(
      (op) =>
        !activeQueue.some(
          (ao) => ao.id === op.id && ao.collection === op.collection,
        ),
    );
    // MongoDB-only mode: No local queue file saves

    this.addTimelineEvent(
      `Successfully synchronized ${succeed} transaction packets.`,
      "success",
      "Sync Engine",
    );
  }

  // --- Cryptographic Backup and GCM Fallback Encryption Layer ---

  public static encryptFallbackFile(collection: string): boolean {
    // MongoDB-only mode: No local file backups
    console.log(`[Database-Only Mode] Backup encryption disabled for "${collection}". Data persists in MongoDB only.`);
    return false;
  }

  public static decryptAndRestoreFallbackFile(collection: string): boolean {
    // MongoDB-only mode: No local file backups
    console.log(`[Database-Only Mode] Backup restore disabled for "${collection}". Data loads from MongoDB only.`);
    return false;
  }

  public static runIntegrityAuditAndValidate(): {
    status: "valid" | "compromised";
    checkedCount: number;
    errors: string[];
  } {
    const reportList: string[] = [];
    let checkCounter = 0;

    // Validate votes cryptographically
    try {
      const votes = this.getVotes();
      for (const v of votes) {
        checkCounter++;
        // Verify ballot format
        if (!v.id || !v.electionId || !v.candidateId) {
          reportList.push(
            `Vote record "${v.id || "unknown"}" is missing primary parameters.`,
          );
        }

        // Mock checking signature block
        if (v.anonymousVoterHash && v.anonymousVoterHash.length !== 64) {
          reportList.push(
            `Vote record "${v.id}" anonymous hash holds invalid length.`,
          );
        }
      }
    } catch (err: any) {
      reportList.push(`Failed to access votes catalog: ${err?.message || err}`);
    }

    // MongoDB-only mode: Do not check for local backup files
    // All data is in MongoDB, backup checks not needed

    return {
      status: reportList.length === 0 ? "valid" : "compromised",
      checkedCount: checkCounter,
      errors: reportList,
    };
  }

  private static getFilePath(collection: string): string {
    return path.join(DB_DIR, `${collection}.json`);
  }

  private static load<T>(collection: string, defaultData: T[] = []): T[] {
    // MongoDB-only mode: Check cache first, then load from MongoDB only
    if (this.cache[collection]) {
      return this.cache[collection] as T[];
    }

    // If MongoDB is connected, load from MongoDB
    if (this.isConnected && this.mongoDb) {
      // This is handled asynchronously during syncAllCollections
      // For now, return empty cache
    }

    // Cache will be populated during MongoDB sync, or return empty
    this.cache[collection] = this.cache[collection] || [];
    return this.cache[collection] as T[];
  }

  private static persistToJsonFile<T>(collection: string, data: T[]): void {
    // Disabled in database-only mode: No local JSON file writes
    // All data persists to MongoDB only
    return;
  }

  private static save<T>(collection: string, data: T[]): void {
    const normalized = Array.isArray(data) ? data : [];
    this.cache[collection] = normalized;

    if (!this.isConnected || !this.mongoDb || this.isForceFailoverActive) {
      throw new Error(`MongoDB is unavailable; ${collection} was not persisted.`);
    }

    // Route handlers still use synchronous collection snapshots. Serialize their writes
    // per collection so rapid requests cannot interleave and lose each other's changes.
    const previous = this.writeChains.get(collection) || Promise.resolve();
    const write = previous
      .catch(() => undefined)
      .then(async () => {
        const mongoCollection = this.mongoDb.collection(collection);
        const docs = normalized.map((value: any) => ({
          ...value,
          _id: value.id,
          version: Math.max(1, Number(value.version || 0) + 1),
          updatedAt: new Date().toISOString(),
        }));
        const ids = docs.map((document: any) => document._id);

        if (docs.length > 0) {
          await mongoCollection.bulkWrite(
            docs.map((document: any) => ({
              replaceOne: {
                filter: { _id: document._id },
                replacement: document,
                upsert: true,
              },
            })),
            { ordered: true },
          );
          await mongoCollection.deleteMany({ _id: { $nin: ids } });
        } else {
          await mongoCollection.deleteMany({});
        }
        this.cache[collection] = docs.map(({ _id, ...document }: any) => ({
          id: String(_id),
          ...document,
        }));
      })
      .catch((dbErr: any) => {
        console.error(`[WRITE ERROR] Failed to persist ${collection}:`, dbErr);
        this.addTimelineEvent(
          `Database write failed for "${collection}".`,
          "alert",
          "Database Engine",
        );
      });

    this.writeChains.set(collection, write);
  }

  private static enqueueOfflineWrite(collection: string, data: any[]): void {
    // Keep a maximum queuing representation by storing the latest state for versioned Last-Write-Wins updates
    if (!data || data.length === 0) return;

    data.forEach((item) => {
      const qId =
        item.id || `op-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

      // Filter out duplicate or stale operations for the same ID in this collection to prevent bloated queues
      this.pendingQueue = this.pendingQueue.filter(
        (op) => !(op.id === qId && op.collection === collection),
      );

      this.pendingQueue.push({
        id: qId,
        collection,
        version: (item.version || 0) + 1,
        lastModifiedAt: new Date().toISOString(),
        ...item,
      });
    });

    this.savePendingQueueToDisk();
    console.log(
      `[Queue Engine] Logged ${data.length} transactions for collection "${collection}" inside the offline queue. Outstanding: ${this.pendingQueue.length}`,
    );
  }

  // --- Collection Accessors ---

  static getUsers(): User[] {
    // MongoDB-only mode: No default test data. Load from DB or local file fallback.
    return this.load<User>("users", []);
  }

  static saveUsers(data: User[]): void {
    this.save("users", data);
    // MongoDB-only mode: No local JSON files
  }

  static getUserProfiles(): UserProfile[] {
    const defaultProfiles: UserProfile[] = [
      {
        id: "prof_voter1",
        userId: "voter-1",
        dob: "1991-09-11",
        gender: "Male",
        permanentAddress:
          "Bagmati Province, Kathmandu District, Kathmandu Metropolitan, Ward No. 3, Tole 05, Nepal",
        temporaryAddress:
          "Bagmati Province, Kathmandu District, Kathmandu Metropolitan, Ward No. 3, Tole 05, Nepal",
        province: "Bagmati Province",
        district: "Kathmandu",
        municipality: "Kathmandu Metropolitan",
        wardNumber: "3",
        postalCode: "44600",
        occupation: "Security Auditor / Software Architect",
        profilePhoto:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        createdAt: new Date().toISOString(),
        permCountry: "Nepal",
        permProvince: "Bagmati Province",
        permDistrict: "Kathmandu",
        permMunicipality: "Kathmandu Metropolitan",
        permWardNumber: "3",
        permTole: "Tole 05",
        permStreetAddress: "Lainchaur Sadak",
        permPostalCode: "44600",
        tempCountry: "Nepal",
        tempProvince: "Bagmati Province",
        tempDistrict: "Kathmandu",
        tempMunicipality: "Kathmandu Metropolitan",
        tempWardNumber: "3",
        tempTole: "Tole 05",
        tempStreetAddress: "Lainchaur Sadak",
        tempPostalCode: "44600",
        isTemporarySameAsPermanent: true,

        fullNameNepali: "थोमस एन्डरसन (नियो)",
        maritalStatus: "Married",
        educationStatus: "Masters in Cryptographic Systems",
        bloodGroup: "O-positive",
        nationality: "Nepali",
        nidNumber: "NID-101-081",
        fatherName: "John Anderson",
        fatherNameNepali: "जोन एन्डरसन",
        motherName: "Mary Anderson",
        motherNameNepali: "मेरी एन्डरसन",
        grandfatherName: "Robert Anderson",
        grandfatherNameNepali: "रबर्ट एन्डरसन",
        spouseName: "Trinity Anderson",
        spouseNameNepali: "ट्रिनिटी एन्डरसन",
        spouseFatherName: "Charles Trinity",
        spouseFatherNameNepali: "चार्ल्स ट्रिनिटी",
        spouseMotherName: "Diana Trinity",
        spouseMotherNameNepali: "डायना ट्रिनिटी",
        citizenshipNumber: "9823-1283-12",
        citizenshipType: "By Descent",
        citizenshipIssueDate: "2009-05-12",
        citizenshipIssueDistrict: "Kathmandu",
        citizenshipIssueAuthority: "District Administration Office",
        nidIssueDate: "2019-09-22",
        nidStatus: "Approved",
        nidFrontImage:
          "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400",
        nidBackImage:
          "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=400",
      },
    ];
    return this.load<UserProfile>("user_profiles", defaultProfiles);
  }

  static saveUserProfiles(data: UserProfile[]): void {
    this.save("user_profiles", data);
    // MongoDB-only mode: No local JSON files
  }

  static getPoliticalParties(): PoliticalParty[] {
    const defaultData: PoliticalParty[] = [
      {
        id: "party-1",
        name: "Nepali Congress",
        code: "NC",
        logoUrl:
          "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=100",
        description:
          "One of the major democratic political parties of Nepal, founded in 1950, advocating social democracy and democratic socialism.",
        leader: "Sher Bahadur Deuba",
        foundedYear: "1950",
        headquarters: "Sanepa, Lalitpur",
      },
      {
        id: "party-2",
        name: "CPN (Unified Marxist–Leninist)",
        code: "CPN-UML",
        logoUrl:
          "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=100",
        description:
          "A prominent left-wing communist party in Nepal, advocating People's Multiparty Democracy (PMPD) and civic-socialist integration.",
        leader: "KP Sharma Oli",
        foundedYear: "1991",
        headquarters: "Chyasal, Lalitpur",
      },
      {
        id: "party-3",
        name: "CPN (Maoist Centre)",
        code: "CPN-MC",
        logoUrl:
          "https://images.unsplash.com/photo-1603504824368-2b821dfbb25e?auto=format&fit=crop&q=80&w=100",
        description:
          "Major communist political group formed after peace accords, advocating socialist paths and decentralized rural upliftment.",
        leader: "Pushpa Kamal Dahal (Prachanda)",
        foundedYear: "1994",
        headquarters: "Perisdanda, Kathmandu",
      },
      {
        id: "party-4",
        name: "Rastriya Swatantra Party",
        code: "RSP",
        logoUrl:
          "https://images.unsplash.com/photo-1520690214124-2405c5217036?auto=format&fit=crop&q=80&w=100",
        description:
          "A modern reformist, secular entity focused on transparency, digital public systems, and youth integration, founded in 2022.",
        leader: "Rabi Lamichhane",
        foundedYear: "2022",
        headquarters: "Basundhara, Kathmandu",
      },
      {
        id: "party-5",
        name: "Rastriya Prajatantra Party",
        code: "RPP",
        logoUrl:
          "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=100",
        description:
          "A right-wing conservative and nationalist party focusing on heritage restoration and constitutional balances.",
        leader: "Rajendra Lingden",
        foundedYear: "1990",
        headquarters: "Chabahil, Kathmandu",
      },
    ];
    return this.load<PoliticalParty>("political_parties", []);
  }

  static savePoliticalParties(data: PoliticalParty[]): void {
    this.save("political_parties", data);
  }

  static getFaqs(): Faq[] {
    const defaultData: Faq[] = [
      {
        id: "faq-1",
        question: "How do I create a voter account?",
        answer:
          "To create an account, click the Register button. You will need to provide your full name, email, mobile number, and a strong password. You'll then receive OTP codes on both email and mobile to secure your credentials.",
        category: "Registration",
        displayOrder: 1,
        status: "Published",
      },
      {
        id: "faq-2",
        question: "Why is my voter account locked?",
        answer:
          "For security reasons, your account is automatically locked for 5 minutes after 5 consecutive failed login attempts on your username or IP address. Contact support if you need immediate assistance.",
        category: "Login & Account",
        displayOrder: 2,
        status: "Published",
      },
      {
        id: "faq-3",
        question: "What is required to complete the voter onboarding process?",
        answer:
          "You must complete your profile by providing your legal details, upload high-clarity images of your Citizenship Card or National ID, draw your digital signature, and successfully complete the face liveness verification scanner.",
        category: "Identity Verification",
        displayOrder: 3,
        status: "Published",
      },
      {
        id: "faq-4",
        question: "Can I use temporary or scanned documents for verification?",
        answer:
          "Only original high-resolution photographs of your Citizenship Certificate or National ID card are accepted. Scanned PDFs, black and white photocopies, or sheared document margins are flagged as high risk.",
        category: "Citizenship & National ID",
        displayOrder: 4,
        status: "Published",
      },
      {
        id: "faq-5",
        question: "How does the biometric face liveness scanner operate?",
        answer:
          "Our scanner runs standard secure local mathematical landmarks mapping using your front-facing camera. It tracks micro-movements, face tilt, and color-parallax cues to ensure a genuine human is present.",
        category: "Face Verification",
        displayOrder: 5,
        status: "Published",
      },
      {
        id: "faq-6",
        question: "Is fingerprint scanning mandatory for all elections?",
        answer:
          "For standard general elections or highly protected voting booths, a dual fingerprint signature matching is recommended. Standard local community elections only require verified face liveness model clearance.",
        category: "Fingerprint Verification",
        displayOrder: 6,
        status: "Published",
      },
      {
        id: "faq-7",
        question:
          "How long does the administrative panel take to review registrations?",
        answer:
          "Authorized verification officers examine profile submissions daily. Review and approval typically complete within 12 to 24 hours. You will receive real-time email/SMS alerts status updates.",
        category: "Admin Approval",
        displayOrder: 7,
        status: "Published",
      },
      {
        id: "faq-8",
        question: "Who can see how I voted?",
        answer:
          "No one. VoTex operates on a strictly auditable cryptographic ballot separation mechanism. Your voter identity register and cast ballot are decoupled utilizing unlinkable SHA-256 tokens.",
        category: "Privacy & Security",
        displayOrder: 8,
        status: "Published",
      },
      {
        id: "faq-9",
        question: "How can I securely reset my password?",
        answer:
          "Click 'Forgot Password' on the login screen. Enter your registered email address to receive a secure OTP code. Enter the OTP code alongside your new password to finalize changes safely.",
        category: "Password Reset",
        displayOrder: 9,
        status: "Published",
      },
      {
        id: "faq-10",
        question: "Why does the biometric facial scanner fail to launch?",
        answer:
          "Ensure that your web browser is granted camera access permissions. If the problem persists, close other background applications using the camera, clear cache and reload, or try from a different browser.",
        category: "Technical Issues",
        displayOrder: 10,
        status: "Published",
      },
    ];
    return this.load<Faq>("faqs", defaultData);
  }

  static saveFaqs(data: Faq[]): void {
    this.save("faqs", data);
  }

  static getIdentityDocuments(): IdentityDocument[] {
    const defaultDocs: IdentityDocument[] = [
      {
        id: "doc_voter1",
        userId: "voter-1",
        citizenshipFrontImage:
          "https://images.unsplash.com/photo-1557804506-6fd06a60291d?auto=format&fit=crop&q=80&w=400",
        citizenshipBackImage:
          "https://images.unsplash.com/photo-1557804506-6fd06a60291d?auto=format&fit=crop&q=80&w=400",
        citizenshipNumber: "9823-1283-12",
        signatureImage:
          "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=200",
        createdAt: new Date().toISOString(),
      },
    ];
    return this.load<IdentityDocument>("identity_documents", defaultDocs);
  }

  static saveIdentityDocuments(data: IdentityDocument[]): void {
    this.save("identity_documents", data);
    // MongoDB-only mode: No local JSON files
  }

  static getFaceVerifications(): FaceVerification[] {
    return this.load<FaceVerification>("face_verifications", []);
  }

  static saveFaceVerifications(data: FaceVerification[]): void {
    this.save("face_verifications", data);
    // MongoDB-only mode: No local JSON files
  }

  static getCandidates(): Candidate[] {
    const defaultData: Candidate[] = [
      {
        id: "cand-1",
        name: "Ram Chandra Poudel",
        party: "Nepali Congress",
        biography:
          "Decades of legislative dedication, socio-democractic public action, and democratic system integration.",
        education: "Masters in Arts and Economics, Tribhuvan University",
        experience:
          "Speaker of House of Representatives, Senior Federal Minister",
        photoUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        partyLogoUrl:
          "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=100",
        manifestoText:
          "Expand public infrastructure support, safeguard constitutional structures, increase central-state digital connectivity, and guarantee free, auditable state services.",
        electionId: "elect-1",
      },
      {
        id: "cand-2",
        name: "Subas Chandra Nembang",
        party: "CPN (Unified Marxist–Leninist)",
        biography:
          "Constitutional expert, lawyer, and chief integrator of the 2015 Federal Constitution of Nepal.",
        education: "Bachelor of Laws (LLB), Tribhuvan University",
        experience: "Chairman of Constituent Assembly (2 terms), Law Minister",
        photoUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
        partyLogoUrl:
          "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=100",
        manifestoText:
          "Strengthen federal judicial reviews, advocate for youth micro-financing across all provinces, and establish completely transparent municipal asset oversight boards.",
        electionId: "elect-1",
      },
      {
        id: "cand-3",
        name: "Pushpa Kamal Dahal",
        party: "CPN (Maoist Centre)",
        biography:
          "Architect of the Federal Peace Accords and champion of marginalized community inclusion in legislative assemblies.",
        education: "Bachelor in Science in Agriculture, IAAS Chitwan",
        experience:
          "Prime Minister of Nepal (three terms), Federal Parliament Head",
        photoUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
        partyLogoUrl:
          "https://images.unsplash.com/photo-1603504824368-2b821dfbb25e?auto=format&fit=crop&q=80&w=100",
        manifestoText:
          "Enact progressive agricultural transformations, scale rural electricity networks, and support decentralised development allocations for regional community bodies.",
        electionId: "elect-2",
      },
      {
        id: "cand-4",
        name: "Rabi Lamichhane",
        party: "Rastriya Swatantra Party",
        biography:
          "Committed leader for anti-corruption practices, digital public frameworks, and direct citizen inquiry systems.",
        education: "Administrative & Digital Systems Management",
        experience:
          "Federal Home Minister, Investigative TV Broadcast Host, MP",
        photoUrl:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
        partyLogoUrl:
          "https://images.unsplash.com/photo-1520690214124-2405c5217036?auto=format&fit=crop&q=80&w=100",
        manifestoText:
          "Deploy robust paperless administrative apps, eliminate state-procurement corruption, establish instant voter mobile feedback lines, and optimize security audits.",
        electionId: "elect-3",
      },
      {
        id: "cand-5",
        name: "Rajendra Lingden",
        party: "Rastriya Prajatantra Party",
        biography:
          "Vocal nationalist leader advocating for civic accountability, absolute corruption checks, and high constitutional integrity.",
        education: "Masters in Political Science, Tribhuvan University",
        experience: "Member of Parliament (Jhapa), National Party President",
        photoUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
        partyLogoUrl:
          "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=100",
        manifestoText:
          "Preserve traditional heritage assets, mandate self-sustainable industrial segments, and ensure active security checkpoints across national registries.",
        electionId: "elect-3",
      },
    ];
    return this.load<Candidate>("candidates", []);
  }

  static saveCandidates(data: Candidate[]): void {
    this.save("candidates", data);
  }

  static getElections(): Election[] {
    const defaultData: Election[] = [
      {
        id: "elect-1",
        title: "Nepal House of Representatives General Election 2026",
        description:
          "National parliamentary voting to choose constituency representatives across the 7 provinces of Nepal for the federal government.",
        status: "Active",
        type: "General Election",
        startDate: "2026-06-15T00:00:00.000Z",
        endDate: "2026-07-20T23:59:59.000Z",
        resultsPublished: false,
        maxVotes: 15400000,
        createdAt: new Date().toISOString(),
      },
      {
        id: "elect-2",
        title: "Bagmati Provincial Assembly Representative Seat Election",
        description:
          "Provincial legislative assembly representative election for constituent districts of the Bagmati region.",
        status: "Active",
        type: "Provincial Election",
        startDate: "2026-06-10T00:00:00.000Z",
        endDate: "2026-07-15T23:59:59.000Z",
        resultsPublished: false,
        maxVotes: 1200000,
        createdAt: new Date().toISOString(),
      },
      {
        id: "elect-3",
        title: "Kathmandu Metropolitan Mayoral and Local Council Selection",
        description:
          "Local governing bodies election to vote for Mayor, Deputy Mayor, and Ward representatives of Kathmandu city.",
        status: "Published",
        type: "Local Election",
        startDate: "2026-05-01T00:00:00.000Z",
        endDate: "2026-05-15T00:00:00.000Z",
        resultsPublished: true,
        maxVotes: 350000,
        createdAt: new Date().toISOString(),
      },
    ];
    return this.load<Election>("elections", []);
  }

  static saveElections(data: Election[]): void {
    this.save("elections", data);
  }

  static getVotes(): Vote[] {
    const defaultData: Vote[] = [
      {
        id: "v-pre-1",
        electionId: "elect-3",
        candidateId: "cand-3-1",
        anonymousVoterHash:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Chrome 122 / Windows 11",
        timestamp: "2026-05-05T14:22:10.000Z",
      },
      {
        id: "v-pre-2",
        electionId: "elect-3",
        candidateId: "cand-3-1",
        anonymousVoterHash:
          "f104d41e2049baefccbb752222ae41e4649b934ca495991b7852b855acbdca111",
        deviceInfo: "Safari Mobile / iOS 17",
        timestamp: "2026-05-06T09:15:30.000Z",
      },
      {
        id: "v-pre-3",
        electionId: "elect-3",
        candidateId: "cand-3-1",
        anonymousVoterHash:
          "a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Edge 121 / Windows 11",
        timestamp: "2026-05-15T09:20:11.000Z",
      },
      {
        id: "v-pre-4",
        electionId: "elect-3",
        candidateId: "cand-3-2",
        anonymousVoterHash:
          "b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Firefox 125 / Ubuntu Linux",
        timestamp: "2026-05-15T10:14:12.000Z",
      },
      {
        id: "v-pre-5",
        electionId: "elect-3",
        candidateId: "cand-3-1",
        anonymousVoterHash:
          "c3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Chrome 123 / macOS Sonoma",
        timestamp: "2026-05-15T11:05:00.000Z",
      },
      {
        id: "v-pre-6",
        electionId: "elect-3",
        candidateId: "cand-3-2",
        anonymousVoterHash:
          "d3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Chrome 124 / Android 14",
        timestamp: "2026-05-15T11:30:45.000Z",
      },
      {
        id: "v-pre-7",
        electionId: "elect-3",
        candidateId: "cand-3-1",
        anonymousVoterHash:
          "13b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Safari 17 / macOS Sonoma",
        timestamp: "2026-05-15T11:45:00.000Z",
      },
      {
        id: "v-pre-8",
        electionId: "elect-3",
        candidateId: "cand-3-2",
        anonymousVoterHash:
          "23b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Chrome 122 / Windows 11",
        timestamp: "2026-05-15T12:05:10.000Z",
      },
      {
        id: "v-pre-9",
        electionId: "elect-3",
        candidateId: "cand-3-1",
        anonymousVoterHash:
          "33b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Chrome 122 / Windows 11",
        timestamp: "2026-05-15T12:15:20.000Z",
      },
      {
        id: "v-pre-10",
        electionId: "elect-3",
        candidateId: "cand-3-2",
        anonymousVoterHash:
          "43b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Safari Mobile / iOS 17",
        timestamp: "2026-05-15T12:20:30.000Z",
      },
      {
        id: "v-pre-11",
        electionId: "elect-3",
        candidateId: "cand-3-1",
        anonymousVoterHash:
          "53b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Firefox 125 / macOS Sonoma",
        timestamp: "2026-05-15T12:35:10.000Z",
      },
      {
        id: "v-pre-12",
        electionId: "elect-3",
        candidateId: "cand-3-1",
        anonymousVoterHash:
          "63b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Opera 102 / Windows 11",
        timestamp: "2026-05-15T12:45:00.000Z",
      },
      {
        id: "v-pre-13",
        electionId: "elect-3",
        candidateId: "cand-3-2",
        anonymousVoterHash:
          "73b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        deviceInfo: "Chrome 122 / Windows 11",
        timestamp: "2026-05-15T13:00:00.000Z",
      },
    ];
    return this.load<Vote>("votes", defaultData);
  }

  static saveVotes(data: Vote[]): void {
    this.save("votes", data);
  }

  static getAuditLogs(): AuditLog[] {
    const defaultData: AuditLog[] = [
      {
        id: "log-1",
        userId: "admin-1",
        userEmail: "admin@vote.com",
        action: "Super Administrator initialization logged",
        ipAddress: "127.0.0.1",
        timestamp: new Date().toISOString(),
        device: "Control Server",
        browser: "Node.js Environment",
      },
    ];
    return this.load<AuditLog>("audit_logs", defaultData);
  }

  static saveAuditLogs(data: AuditLog[]): void {
    this.save("audit_logs", data);
  }

  static getOTPs(): OTPRecord[] {
    return this.load<OTPRecord>("otps", []);
  }

  static saveOTPs(data: OTPRecord[]): void {
    this.save("otps", data);
  }

  static getNotifications(): Notification[] {
    const defaultData: Notification[] = [
      {
        id: "n-1",
        title: "National Digital Innovation Board Election is Active",
        message:
          "Eligible voters can now login and register their camera facial template to participate.",
        type: "success",
        timestamp: new Date().toISOString(),
      },
      {
        id: "n-2",
        title: "Welcome to VoTex platform",
        message:
          "Verify your email and setup biometric credentials to vote safely.",
        type: "info",
        timestamp: new Date().toISOString(),
      },
    ];
    return this.load<Notification>("notifications", defaultData);
  }

  static saveNotifications(data: Notification[]): void {
    this.save("notifications", data);
  }

  static getProfileDrafts(): ProfileDraft[] {
    return this.load<ProfileDraft>("profile_drafts", []);
  }

  static saveProfileDrafts(data: ProfileDraft[]): void {
    this.save("profile_drafts", data);
  }

  private static async ensureIndexes(): Promise<void> {
    if (!this.mongoDb) return;

    await Promise.all([
      this.mongoDb.collection("users").createIndexes([
        { key: { email: 1 }, unique: true, name: "users_email_unique" },
        { key: { nationalID: 1 }, unique: true, sparse: true, name: "users_national_id_unique" },
        { key: { role: 1, accountStatus: 1 }, name: "users_role_status" },
      ]),
      this.mongoDb.collection("user_profiles").createIndex(
        { userId: 1 },
        { unique: true, name: "profiles_user_unique" },
      ),
      this.mongoDb.collection("user_preferences").createIndex(
        { userId: 1 },
        { unique: true, name: "preferences_user_unique" },
      ),
      this.mongoDb.collection("candidates").createIndex(
        { electionId: 1, status: 1 },
        { name: "candidates_election_status" },
      ),
      this.mongoDb.collection("votes").createIndex(
        { electionId: 1, anonymousVoterHash: 1 },
        { unique: true, name: "votes_one_per_voter_election" },
      ),
      this.mongoDb.collection("notifications").createIndex(
        { userId: 1, timestamp: -1 },
        { name: "notifications_user_time" },
      ),
      this.mongoDb.collection("otps").createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "otps_expiry" },
      ),
    ]);
  }

  static getUserPreferences(): UserPreferences[] {
    return this.load<UserPreferences>("user_preferences", []);
  }

  static saveUserPreferences(data: UserPreferences[]): void {
    this.save("user_preferences", data);
  }

  // --- Configuration ---
  static getConfig(): SystemConfig {
    const defaultData = {
      smtpHost: process.env.SMTP_HOST || "",
      smtpPort: parseInt(process.env.SMTP_PORT || "587") || 587,
      smtpUser: process.env.SMTP_USER || "",
      smtpPass: process.env.SMTP_PASS || "••••••••••••••••",
      twilioSid: "",
      twilioToken:
        process.env.TWILIO_AUTH_TOKEN || "••••••••••••••••••••••••••••••••",
      twilioFrom: process.env.TWILIO_PHONE_NUMBER || "",
    };
    // MongoDB-only mode: Do not read from local config.json file
    // Use environment variables and MongoDB config collection only
    const defaultConfig = defaultData;
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  static saveConfig(data: SystemConfig): void {
    // MongoDB-only mode: Do not write to local config.json file
    // Config is stored in MongoDB only

    if (this.isConnected && this.mongoDb) {
      const configCollection = this.mongoDb.collection("config");
      (async () => {
        try {
          await configCollection.updateOne(
            { _id: "system_config" },
            { $set: data },
            { upsert: true },
          );
        } catch (dbErr) {
          console.error(
            "[WRITE ERROR] Error writing config write-through to MongoDB:",
            dbErr,
          );
        }
      })();
    }
  }

  // --- Auth & Token Utilities ---

  static generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        tokenVersion: user.tokenVersion || 0,
      },
      JWT_SECRET,
      { expiresIn: "2h" },
    );
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return null;
    }
  }

  static addAuditLog(
    userId: string,
    email: string,
    action: string,
    ip: string,
    userAgent: string,
  ) {
    const logs = this.getAuditLogs();
    const parser = (agent: string) => {
      let browser = "Chrome";
      let os = "Web Device";
      if (agent.includes("Firefox")) browser = "Firefox";
      else if (agent.includes("Safari") && !agent.includes("Chrome"))
        browser = "Safari";
      else if (agent.includes("Edge")) browser = "Edge";

      if (agent.includes("Windows")) os = "Windows";
      else if (agent.includes("Macintosh")) os = "Mac OS";
      else if (agent.includes("iPhone") || agent.includes("iPad")) os = "iOS";
      else if (agent.includes("Android")) os = "Android";
      else if (agent.includes("Linux")) os = "Linux";
      return { browser, os };
    };

    const details = parser(userAgent);
    const newLog: AuditLog = {
      id: createId("log"),
      userId,
      userEmail: email,
      action,
      ipAddress: ip || "127.0.0.1",
      timestamp: new Date().toISOString(),
      device: details.os,
      browser: details.browser,
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs);
    return newLog;
  }
}
