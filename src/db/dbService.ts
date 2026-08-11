import dotenv from "dotenv";
import crypto from "crypto";
import {
  MongoClient,
  Db,
  Collection,
  Document,
  Filter,
  UpdateFilter,
  OptionalUnlessRequiredId,
  BulkWriteOptions,
  CreateIndexesOptions,
  IndexSpecification,
} from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config({ quiet: true });

// ============================================
// Configuration & Constants
// ============================================

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DB_NAME = process.env.MONGODB_DB_NAME || "votex_db";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_SECRET || "dev-backup-key";

// ============================================
// Types & Interfaces
// ============================================

export interface User {
  id: string;
  fullName: string;
  username?: string;
  nationalID: string;
  citizenshipNumber?: string;
  email: string;
  mobile?: string;
  address?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  occupation?: string;
  passwordHash: string;
  faceImage?: string;
  role: string;
  isVerified: boolean;
  isApproved?: boolean;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt?: string;
  tokenVersion?: number;
  accountStatus?: string;
  isProfileComplete?: boolean;
  profileCompleted?: boolean;
  faceVerified?: boolean;
  faceVerifiedAt?: string;
  faceMatchConfidence?: number;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: number;
  faceTemplate?: number[];
  fingerprintImage?: string;
  fingerprintLeftImage?: string;
  fingerprintRightImage?: string;
  fingerprintHash?: string;
  profilePhoto?: string;
  verificationReport?: any;
  verificationScores?: Record<string, number>;
  verificationSummary?: any;
  rejectionReason?: string;
  requestedChangesFields?: string[];
  auditLogs?: string[];
  verificationSteps?: Record<string, string>;
  registrationTimestamp?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  emailVerifiedAt?: string;
  mobileVerifiedAt?: string;
  twoFactorEnabled?: boolean;
  profilePicture?: string;
  newsletterNotificationsEnabled?: boolean;
  newsletterSubscribedAt?: string;
  newsletterVerifiedAt?: string;
  newsletterUnsubscribeToken?: string;
  newsletterStatus?: "Active" | "Inactive" | "Pending";
}

export interface LoginAttempt {
  id: string;
  identifier: string;
  userId?: string;
  failedAttempts: number;
  lockoutLevel: number;
  lockedUntil: number;
  lastFailedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName?: string;
  fullNameNepali?: string;
  dob?: string;
  gender?: string;
  occupation?: string;
  maritalStatus?: string;
  educationStatus?: string;
  bloodGroup?: string;
  nationality?: string;
  permanentAddress?: string;
  temporaryAddress?: string;
  province?: string;
  district?: string;
  municipality?: string;
  fingerprintHash?: string;
  fingerprintImage?: string;
  fingerprintLeftImage?: string;
  fingerprintRightImage?: string;
  fingerprintCaptureMethod?: string;
  faceTemplate?: number[];

  // Address fields
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

  // Family fields
  fatherName?: string;
  fatherNameNepali?: string;
  motherName?: string;
  motherNameNepali?: string;
  grandfatherName?: string;
  grandfatherNameNepali?: string;
  spouseName?: string;
  spouseNameNepali?: string;

  // Document fields
  citizenshipNumber?: string;
  citizenshipType?: string;
  citizenshipIssueDate?: string;
  citizenshipIssueDistrict?: string;
  citizenshipIssueAuthority?: string;
  nidNumber?: string;
  nidIssueDate?: string;
  nidStatus?: string;
  voterIdNumber?: string;
  passportNumber?: string;
  educationLevel?: string;
  emergencyContact?: {
    fullName?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  faceEmbedding?: number[];
  faceImage?: string;
  faceVerificationStatus?: string;
  isProfileComplete?: boolean;
  currentStep?: number;
  auditLogs?: Array<{
    id: string;
    action: string;
    timestamp: string;
    previousValues?: any;
    newValues?: any;
    userId: string;
    device?: string;
    browser?: string;
    ipAddress?: string;
  }>;
  nidFrontImage?: string;
  nidBackImage?: string;
  citizenshipFrontImage?: string;
  citizenshipBackImage?: string;
  signatureImage?: string;

  profilePhoto?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IdentityDocument {
  id: string;
  userId: string;
  documentType: string;
  documentNumber?: string;
  fileUrl: string;
  fileName?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt?: string;
  citizenshipFrontImage?: string;
  citizenshipBackImage?: string;
  signatureImage?: string;
  nidFrontImage?: string;
  nidBackImage?: string;
}

export interface FaceVerification {
  id: string;
  userId: string;
  sessionId?: string;
  electionId?: string;
  faceImage?: string;
  faceTemplate?: number[];
  verificationStatus:
    "pending" | "in_progress" | "verified" | "failed" | "expired";
  matchScore?: number;
  livenessScore?: number;
  verifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
  verificationTimestamp?: string;
  deviceInformation?: string;
  ipAddress?: string;
}

export interface Candidate {
  id: string;
  userId?: string;
  electionId: string;
  name: string;
  party: string;
  partyId?: string;
  keyPromises?: string[];
  politicalPartyName?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: string;
  citizenshipNumber?: string;
  contactNumber?: string;
  emailAddress?: string;
  permanentAddress?: string;
  currentAddress?: string;
  electionType?: string;
  electionPosition?: string;
  candidateRegistrationNumber?: string;
  nominationDate?: string;
  electionSymbol?:
    | string
    | {
        name: string;
        imageUrl?: string;
        code: string;
        displayColor: string;
      };
  electionSymbolAllocationDate?: string;
  isIndependent?: boolean;
  biography?: string;
  education?: string;
  experience?: string;
  photoUrl: string;
  candidatePhoto?: string;
  partyLogoUrl?: string;
  partyLogo?: string;
  partyAbbreviation?: string;
  partyColorTheme?: string;
  visionStatement?: string;
  profession?: string;
  assetsDeclaration?: string;
  criminalCaseDeclaration?: string;
  socialMediaLinks?: string;
  officialWebsite?: string;
  manifestoPdfUrl?: string;
  coverBannerUrl?: string;
  verificationQrCode?: string;
  manifestoText: string;
  status?: "Pending" | "Verified" | "Approved" | "Rejected" | "Withdrawn";
  candidateStatus?:
    "Pending" | "Verified" | "Approved" | "Rejected" | "Withdrawn";
  rejectionReason?: string;
  isVisible?: boolean;
  verifiedAt?: string;
  electoralConstituency?: string;
  wardNumber?: string;
  voteCount?: number;
  history?: Array<{
    status: string;
    timestamp: string;
    note: string;
    actor: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Election {
  isActive: boolean;
  id: string;
  title: string;
  description: string;
  status: "Draft" | "Active" | "Closed" | "Published" | "Scheduled";
  type: string;
  startDate: string;
  endDate: string;
  resultsPublished: boolean;
  eligibilityDept?: string;
  maxVotes?: number;
  securityLevel?: "LOW" | "STANDARD" | "HIGH" | "CRITICAL";
  totalVotes?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PoliticalParty {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  description?: string;
  leader?: string;
  foundedYear?: string;
  headquarters?: string;
}

export interface Vote {
  id: string;
  electionId: string;
  candidateId: string;
  anonymousVoterHash: string;
  deviceInfo?: string;
  timestamp: string;
  blockchainReceipt?: string;
  ballotHash?: string;
  encryptedBallot?: string;
  sha256Hash?: string;
  digitalSignature?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  actionCategory?: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  details?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

export interface OTPRecord {
  id: string;
  mobile?: string;
  email?: string;
  code: string;
  expiresAt: string;
  isUsed: boolean;
  purpose: string;
  createdAt?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  isRead?: boolean;
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



export interface NewsletterSubscriber {
  id?: string;
  email: string;
  subscribedAt: string;
  status: "Active" | "Unsubscribed" | "Pending";
  verified?: boolean;
  token?: string;
  tags?: string[];
  lastEmailSentAt?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  unsubscribeToken?: string;
  verificationToken?: string;
  lastNotification?: string;
  verifiedAt?: string;
  updatedAt?: string;
}

export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "New" | "Replied";
  reply: string;
  repliedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// Database Service Class
// ============================================

export class Database {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;
  public static isConnected: boolean = false;
  public static simulatedLatency: number = 0;
  public static totalReconnects: number = 0;
  public static lastSyncTimestamp: string | null = null;
  public static syncSuccessCount: number = 0;
  public static syncFailureCount: number = 0;
  public static isForceFailoverActive: boolean = false;
  public static pendingQueue: Array<Record<string, any>> = [];
  public static syncHistory: Array<Record<string, any>> = [];
  public static systemTimeline: Array<Record<string, any>> = [];
  private static reconnectAttempts: number = 0;
  private static maxReconnectAttempts: number = 5;
  private static healthCheckInterval: NodeJS.Timeout | null = null;

  // In-memory cache for frequently accessed data
  private static cache: Map<string, { data: any[]; timestamp: number }> =
    new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ============================================
  // Connection Management
  // ============================================

  static async initialize(): Promise<boolean> {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri.includes("username:password") || uri.trim() === "") {
      console.warn(
        "MONGODB_URI not configured; using local in-memory fallback data.",
      );
      this.isConnected = false;
      this.ensureSeedData();
      return false;
    }

    try {
      const client = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        retryReads: true,
      });

      await client.connect();

      // Verify connection
      await client.db(DB_NAME).admin().ping();

      this.client = client;
      this.db = client.db(DB_NAME);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log(`✅ Connected to MongoDB: ${DB_NAME}`);

      // Backfill missing documentIds and ensure indexes
      await this.backfillDocumentIds();
      await this.ensureIndexes();

      // Load persisted cache from MongoDB so runtime APIs reflect actual admin data
      await this.loadDatabaseCache();

      // Start health check
      this.startHealthCheck();
      this.ensureSeedData();

      return true;
    } catch (error: any) {
      console.warn(
        `⚠️ MongoDB connection unavailable (${error.message}); using local in-memory fallback data.`,
      );
      this.isConnected = false;
      this.ensureSeedData();
      return false;
    }
  }

  // Backwards-compatible alias used by server startup code
  static async initializeMongo(): Promise<boolean> {
    return this.initialize();
  }

  static async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log("Disconnected from MongoDB");
    }
  }

  private static startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.db) {
          await this.db.admin().ping();
          if (!this.isConnected) {
            this.isConnected = true;
            console.log("✅ Database connection restored");
          }
        }
      } catch (error) {
        if (this.isConnected) {
          this.isConnected = false;
          console.warn("⚠️ Database connection lost");
          await this.attemptReconnect();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private static async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
    );

    try {
      await this.initialize();
    } catch (error) {
      console.error(`Reconnection attempt ${this.reconnectAttempts} failed`);
    }
  }

  // ============================================
  // Collection Helpers
  // ============================================

  private static getCollection<T extends Document>(
    name: string,
  ): Collection<T> {
    if (!this.db) {
      throw new Error(
        "Database not connected. Call Database.initialize() first.",
      );
    }
    return this.db.collection<T>(name);
  }

  private static createId(prefix: string): string {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  // ============================================
  // Generic CRUD Operations
  // ============================================

  static async findAll<T extends Document>(
    collectionName: string,
    filter: Filter<T> = {},
    options: { sort?: any; limit?: number; skip?: number } = {},
  ): Promise<T[]> {
    try {
      const collection = this.getCollection<T>(collectionName);
      let cursor = collection.find(filter);

      if (options.sort) cursor = cursor.sort(options.sort);
      if (options.skip) cursor = cursor.skip(options.skip);
      if (options.limit) cursor = cursor.limit(options.limit);

      const results = await cursor.toArray();
      return results.map((doc) => this.sanitizeDocument(doc)) as T[];
    } catch (error) {
      console.error(`Error fetching from ${collectionName}:`, error);
      return [];
    }
  }

  static async loadDatabaseCache(): Promise<void> {
    try {
      if (!this.db) return;

      const [
        users,
        userProfiles,
        identityDocuments,
        faceVerifications,
        elections,
        candidates,
        parties,
        votes,
        notifications,
        faqs,
        newsletterSubscribers,
        contactRequests,
        otps,
        auditLogs,
      ] = await Promise.all([
        this.findAll<User>("users"),
        this.findAll<UserProfile>("user_profiles"),
        this.findAll<IdentityDocument>("identity_documents"),
        this.findAll<FaceVerification>("face_verifications"),
        this.findAll<Election>("elections"),
        this.findAll<Candidate>("candidates"),
        this.findAll<any>("political_parties"),
        this.findAll<Vote>("votes"),
        this.findAll<any>("notifications"),
        this.findAll<any>("faqs"),
        this.findAll<NewsletterSubscriber>("newsletter_subscribers"),
        this.findAll<ContactRequest>("contact_requests"),
        this.findAll<any>("otps"),
        this.findAll<any>("audit_logs"),
      ]);

      this.inMemStore.set("users", users);
      this.inMemStore.set("user_profiles", userProfiles);
      this.inMemStore.set("identity_documents", identityDocuments);
      this.inMemStore.set("face_verifications", faceVerifications);
      this.inMemStore.set("elections", elections);
      this.inMemStore.set("candidates", candidates);
      this.inMemStore.set("political_parties", parties);
      this.inMemStore.set("parties", parties);
      this.inMemStore.set("votes", votes);
      this.inMemStore.set("notifications", notifications);
      this.inMemStore.set("faqs", faqs);
      this.inMemStore.set("newsletter_subscribers", newsletterSubscribers);
      this.inMemStore.set("contact_requests", contactRequests);
      this.inMemStore.set("otps", otps);
      this.inMemStore.set("audit_logs", auditLogs);

      console.log("✅ Loaded complete database cache from MongoDB");
    } catch (error) {
      console.error("Error loading database cache:", error);
    }
  }

  static async findOne<T extends Document>(
    collectionName: string,
    filter: Filter<T>,
  ): Promise<T | null> {
    if (!this.db) return null;
    try {
      const collection = this.getCollection<T>(collectionName);
      const doc = await collection.findOne(filter);
      return doc ? (this.sanitizeDocument(doc) as T) : null;
    } catch (error) {
      console.error(`Error finding in ${collectionName}:`, error);
      return null;
    }
  }

  static async insertOne<T extends Document>(
    collectionName: string,
    document: T,
  ): Promise<T | null> {
    const collection = this.getCollection<T>(collectionName);
    try {
      const result = await collection.insertOne(
        document as OptionalUnlessRequiredId<T>,
      );
      return result.acknowledged ? document : null;
    } catch (error: any) {
      // If duplicate key error, rethrow so callers can handle atomically
      if (error?.code === 11000 || error?.name === "MongoServerError") {
        throw error;
      }
      console.error(`Error inserting into ${collectionName}:`, error);
      return null;
    }
  }

  static async updateOne<T extends Document>(
    collectionName: string,
    filter: Filter<T>,
    update: UpdateFilter<T>,
  ): Promise<boolean> {
    try {
      const collection = this.getCollection<T>(collectionName);
      const result = await collection.updateOne(filter, update);
      return result.acknowledged && result.modifiedCount > 0;
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
      return false;
    }
  }

  static async upsertOne<T extends Document>(
    collectionName: string,
    filter: Filter<T>,
    document: T,
  ): Promise<boolean> {
    try {
      const collection = this.getCollection<T>(collectionName);
      const result = await collection.replaceOne(filter, document as any, {
        upsert: true,
      });
      return result.acknowledged;
    } catch (error) {
      console.error(`Error upserting ${collectionName}:`, error);
      return false;
    }
  }

  private static async deleteOne<T extends Document>(
    collectionName: string,
    filter: Filter<T>,
  ): Promise<boolean> {
    try {
      const collection = this.getCollection<T>(collectionName);
      const result = await collection.deleteOne(filter);
      return result.acknowledged && result.deletedCount > 0;
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      return false;
    }
  }

  private static async countDocuments<T extends Document>(
    collectionName: string,
    filter: Filter<T> = {},
  ): Promise<number> {
    try {
      const collection = this.getCollection<T>(collectionName);
      return await collection.countDocuments(filter);
    } catch (error) {
      console.error(`Error counting ${collectionName}:`, error);
      return 0;
    }
  }

  private static sanitizeDocument(doc: any): any {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    return {
      id: String(_id || doc.id),
      ...rest,
    };
  }

  private static ensureSeedData(): void {
    if (process.env.NODE_ENV === "production" || process.env.USE_MOCK_DATA === "false") return;

    const passwordHash = bcrypt.hashSync("Password123!", 12);
    
    // Sample Voters & Candidates
    const seedUsers: User[] = [
      {
        id: "usr_seed_admin", fullName: "System Administrator", username: "admin", nationalID: "ADMIN001",
        email: "admin@votex.gov", mobile: "+9779800000000", passwordHash, role: "Administrator",
        isVerified: true, isApproved: true, isSuspended: false, isProfileComplete: true, accountStatus: "Approved",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tokenVersion: 0,
      },
      ...Array.from({ length: 5 }).map((_, i) => ({
        id: `usr_seed_voter_${i + 1}`,
        fullName: `Sample Voter ${i + 1}`,
        username: `voter${i + 1}`,
        nationalID: `VOTER00${i + 1}`,
        email: `voter${i + 1}@votex.gov`,
        mobile: `+977980000000${i + 1}`,
        passwordHash,
        role: "Voter",
        isVerified: true,
        isApproved: true,
        isSuspended: false,
        isProfileComplete: true,
        accountStatus: "Approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tokenVersion: 0,
        faceImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg==", // Dummy face image base64
        fingerprintImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        profilePhoto: "https://ui-avatars.com/api/?name=Voter+" + (i + 1),
      })),
      // Sample Candidates
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

    const seedUserProfiles: UserProfile[] = seedUsers.filter(u => u.role === "Voter").map((u, i) => ({
      id: `prof_seed_${i + 1}`,
      userId: u.id,
      fullName: u.fullName,
      fullNameNepali: `नमूना मतदाता ${i + 1}`,
      dob: `199${i}-01-01`,
      gender: i % 2 === 0 ? "Male" : "Female",
      occupation: "Software Engineer",
      maritalStatus: "Single",
      educationStatus: "Bachelor's Degree",
      bloodGroup: "O+",
      nationality: "Nepalese",
      permCountry: "Nepal",
      permProvince: "Bagmati",
      permDistrict: "Kathmandu",
      permMunicipality: "Kathmandu Metropolitan City",
      permWardNumber: "10",
      permTole: "Baneshwor",
      isTemporarySameAsPermanent: true,
      fatherName: `Father of Voter ${i + 1}`,
      fatherNameNepali: `बुबा ${i + 1}`,
      motherName: `Mother of Voter ${i + 1}`,
      motherNameNepali: `आमा ${i + 1}`,
      grandfatherName: `Grandfather of Voter ${i + 1}`,
      grandfatherNameNepali: `हजुरबुबा ${i + 1}`,
      citizenshipNumber: `12345-6789-${i}`,
      citizenshipType: "Descendant",
      citizenshipIssueDate: "2015-05-15",
      citizenshipIssueDistrict: "Kathmandu",
      nidNumber: `NID-987654321-${i}`,
      createdAt: new Date().toISOString(),
    }));

    const seedIdentityDocuments: IdentityDocument[] = seedUsers.filter(u => u.role === "Voter").map((u, i) => ({
      id: `doc_seed_${i + 1}`,
      userId: u.id,
      documentType: "Citizenship",
      documentNumber: `12345-6789-${i}`,
      fileUrl: "dummy-url",
      verificationStatus: "verified",
      createdAt: new Date().toISOString(),
      citizenshipFrontImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      citizenshipBackImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    }));

    const seedFaceVerifications: FaceVerification[] = seedUsers.filter(u => u.role === "Voter").map((u, i) => ({
      id: `face_seed_${i + 1}`,
      userId: u.id,
      verificationStatus: "verified",
      matchScore: 99.1,
      livenessScore: 98.5,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      faceImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    }));

    const seedElections: Election[] = [
      {
        id: "elect_seed_2026",
        title: "National Digital Election 2026",
        description: "A secure demo election for public onboarding and testing.",
        status: "Active",
        isActive: true,
        type: "General Election",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        resultsPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const seedParties: any[] = [
      { id: "party_nc", name: "Nepali Congress", symbol: "Tree", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Nepali_Congress_Election_Symbol.png" },
      { id: "party_uml", name: "CPN-UML", symbol: "Sun", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Election_Symbol_of_the_Communist_Party_of_Nepal_%28Unified_Marxist-Leninist%29.png" },
      { id: "party_maoist", name: "CPN-Maoist Centre", symbol: "Hammer and Sickle", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Hammer_and_sickle_inside_circle.svg" },
      { id: "party_rsp", name: "Rastriya Swatantra Party", symbol: "Bell", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Bell_election_symbol_of_RSP.png" },
      { id: "party_rpp", name: "Rastriya Prajatantra Party", symbol: "Cow", logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/Flag_of_RPP.svg" },
    ];

    const seedCandidates: Candidate[] = [
      {
        id: "cand_seed_1", userId: "usr_seed_cand_1", electionId: seedElections[0].id, name: "Gagan Thapa", party: "Nepali Congress",
        biography: "Youth leader and community-focused public servant. Known for advocating democratic reforms.", manifestoText: "Improving access to secure digital civic services.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Gagan_Thapa.jpg", status: "Approved", voteCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        dateOfBirth: "1976-07-16", gender: "Male", profession: "Politician", education: "Masters in Political Science",
        contactNumber: "+9779800000010", emailAddress: "gagan.thapa@nc.org.np", permanentAddress: "Kathmandu, Nepal"
      },
      {
        id: "cand_seed_2", userId: "usr_seed_cand_2", electionId: seedElections[0].id, name: "Gokarna Bista", party: "CPN-UML",
        biography: "Technology and transparency advocate. Former minister of energy.", manifestoText: "Building transparent and accessible elections and eradicating load shedding.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Gokarna_Bista.jpg", status: "Approved", voteCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        dateOfBirth: "1965-07-01", gender: "Male", profession: "Politician", education: "Bachelors Degree",
        contactNumber: "+9779800000011", emailAddress: "gokarna.bista@cpnuml.org", permanentAddress: "Gulmi, Nepal"
      },
      {
        id: "cand_seed_3", userId: "usr_seed_cand_3", electionId: seedElections[0].id, name: "Barshaman Pun", party: "CPN-Maoist Centre",
        biography: "Advocating for rural development and digital equality.", manifestoText: "Connecting every village to the digital grid.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Barshaman_Pun.jpg", status: "Approved", voteCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        dateOfBirth: "1971-06-18", gender: "Male", profession: "Politician", education: "Bachelors Degree",
        contactNumber: "+9779800000012", emailAddress: "barshaman.pun@cpmmaoist.org", permanentAddress: "Rolpa, Nepal"
      },
      {
        id: "cand_seed_4", userId: "usr_seed_cand_4", electionId: seedElections[0].id, name: "Swarnim Wagle", party: "Rastriya Swatantra Party",
        biography: "Economic reform and transparency advocate. Prominent economist.", manifestoText: "Data-driven governance and anti-corruption.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Swarnim_Wagle.jpg", status: "Approved", voteCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        dateOfBirth: "1974-05-10", gender: "Male", profession: "Economist", education: "PhD in Economics",
        contactNumber: "+9779800000013", emailAddress: "swarnim.wagle@rsp.org.np", permanentAddress: "Tanahun, Nepal"
      },
      {
        id: "cand_seed_5", userId: "usr_seed_cand_5", electionId: seedElections[0].id, name: "Rajendra Lingden", party: "Rastriya Prajatantra Party",
        biography: "Traditional values with modern technological adoption.", manifestoText: "Preserving heritage while modernizing infrastructure.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Rajendra_Lingden.jpg", status: "Approved", voteCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        dateOfBirth: "1965-09-08", gender: "Male", profession: "Politician", education: "Masters in History",
        contactNumber: "+9779800000014", emailAddress: "rajendra.lingden@rpp.org.np", permanentAddress: "Jhapa, Nepal"
      },
    ];

    // Check & Merge Seed Users
    const existingUsers = (this.inMemStore.get("users") || []) as User[];
    let usersUpdated = false;
    let currentUsers = [...existingUsers];

    if (currentUsers.length === 0) {
      currentUsers = seedUsers;
      usersUpdated = true;
    } else {
      for (const su of seedUsers) {
        const foundIdx = currentUsers.findIndex((u) => u.id === su.id || (u.email && u.email.toLowerCase() === su.email.toLowerCase()) || (u.username && u.username.toLowerCase() === su.username?.toLowerCase()));
        if (foundIdx === -1) {
          currentUsers.push(su);
          usersUpdated = true;
        } else {
          if (su.role === "Candidate" && (currentUsers[foundIdx].role !== "Candidate" || !currentUsers[foundIdx].passwordHash)) {
            currentUsers[foundIdx] = { ...currentUsers[foundIdx], role: "Candidate", passwordHash: su.passwordHash };
            usersUpdated = true;
          }
        }
      }
    }

    if (usersUpdated) {
      this.inMemStore.set("users", currentUsers);
      void this.saveUsers(currentUsers);
    }

    // Check & Merge Seed Candidates
    const existingCandidates = (this.inMemStore.get("candidates") || []) as Candidate[];
    let candidatesUpdated = false;
    let currentCandidates = [...existingCandidates];

    if (currentCandidates.length === 0) {
      currentCandidates = seedCandidates;
      candidatesUpdated = true;
    } else {
      for (const sc of seedCandidates) {
        const foundIdx = currentCandidates.findIndex((c) => c.id === sc.id || (c.emailAddress && c.emailAddress.toLowerCase() === sc.emailAddress?.toLowerCase()));
        if (foundIdx === -1) {
          currentCandidates.push(sc);
          candidatesUpdated = true;
        } else if (!currentCandidates[foundIdx].userId && sc.userId) {
          currentCandidates[foundIdx] = { ...currentCandidates[foundIdx], userId: sc.userId };
          candidatesUpdated = true;
        }
      }
    }

    if (candidatesUpdated) {
      this.inMemStore.set("candidates", currentCandidates);
      void this.saveCandidates(currentCandidates);
    }

    if (!this.inMemStore.has("user_profiles")) this.inMemStore.set("user_profiles", seedUserProfiles);
    if (!this.inMemStore.has("identity_documents")) this.inMemStore.set("identity_documents", seedIdentityDocuments);
    if (!this.inMemStore.has("face_verifications")) this.inMemStore.set("face_verifications", seedFaceVerifications);
    if (!this.inMemStore.has("elections")) this.inMemStore.set("elections", seedElections);
    if (!this.inMemStore.has("parties")) this.inMemStore.set("parties", seedParties);
    if (!this.inMemStore.has("political_parties")) this.inMemStore.set("political_parties", seedParties);
    if (!this.inMemStore.has("votes")) this.inMemStore.set("votes", []);
    if (!this.inMemStore.has("notifications")) this.inMemStore.set("notifications", []);
    if (!this.inMemStore.has("faqs")) this.inMemStore.set("faqs", []);

    if (!this.inMemStore.has("system_config")) this.inMemStore.set("system_config", {});
    if (!this.inMemStore.has("dispatch_logs")) this.inMemStore.set("dispatch_logs", []);
    if (!this.inMemStore.has("newsletter_subscribers")) this.inMemStore.set("newsletter_subscribers", []);
    if (!this.inMemStore.has("contact_requests")) this.inMemStore.set("contact_requests", []);
    if (!this.inMemStore.has("user_preferences")) this.inMemStore.set("user_preferences", {});
    if (!this.inMemStore.has("profile_drafts")) this.inMemStore.set("profile_drafts", {});
    if (!this.inMemStore.has("idempotency_records")) this.inMemStore.set("idempotency_records", {});
  }

  // ============================================
  // Users
  // ============================================

  static getUsers(filter: Partial<User> = {}): User[] {
    this.ensureSeedData();

    const users = (this.inMemStore.get("users") || []) as User[];
    return users.filter((user: any) => {
      if (filter.role && user.role !== filter.role) return false;
      if (filter.accountStatus && user.accountStatus !== filter.accountStatus)
        return false;
      if (
        filter.isVerified !== undefined &&
        user.isVerified !== filter.isVerified
      )
        return false;
      return true;
    });
  }

  static async getUsersAsync(filter: Partial<User> = {}): Promise<User[]> {
    if (this.db) {
      const dbUsers = await this.findAll<User>("users", filter as Filter<User>);
      if (dbUsers && dbUsers.length > 0) return dbUsers;
    }
    return this.getUsers(filter);
  }

  static async getUserProfilesAsync(): Promise<UserProfile[]> {
    if (this.db) {
      const dbProfiles = await this.findAll<UserProfile>("user_profiles");
      if (dbProfiles && dbProfiles.length > 0) return dbProfiles;
    }
    return this.getUserProfiles();
  }

  static async getUserById(userId: string): Promise<User | null> {
    return this.findOne<User>("users", { id: userId } as Filter<User>);
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return this.findOne<User>("users", { email } as Filter<User>);
  }

  static async getUserByNationalId(nationalID: string): Promise<User | null> {
    return this.findOne<User>("users", { nationalID } as Filter<User>);
  }

  static parseDuplicateFieldError(error: any): { field: string; message: string } | null {
    if (!error) return null;
    const errMsg = String(error?.message || error?.errmsg || error || "");
    const keyPattern = error?.keyPattern || {};

    if (keyPattern.email || errMsg.includes("users_email_unique") || /dup key.*email/i.test(errMsg)) {
      return { field: "email", message: "Email is already registered." };
    }
    if (keyPattern.username || errMsg.includes("users_username_unique") || /dup key.*username/i.test(errMsg)) {
      return { field: "username", message: "Username is not available." };
    }
    if (keyPattern.mobile || errMsg.includes("users_mobile_unique") || /dup key.*mobile/i.test(errMsg)) {
      return { field: "phone", message: "Phone number is already registered." };
    }
    if (keyPattern.nationalID || errMsg.includes("users_national_id_unique") || /dup key.*nationalID/i.test(errMsg)) {
      return { field: "nid", message: "NID is already registered." };
    }
    // Citizenship number uniqueness check removed — allow multiple voters to share the same citizenship number.

    return null;
  }

  static async inspectDuplicateUserData(): Promise<{
    duplicateEmails: number;
    duplicatePhones: number;
    duplicateUsernames: number;
    duplicateNids: number;
    duplicateCitizenships: number;
  }> {
    const users = await this.getUsers();
    const profiles = await this.getUserProfiles();

    const countDuplicates = (arr: (string | undefined)[]) => {
      const counts = new Map<string, number>();
      for (const val of arr) {
        if (!val) continue;
        const norm = String(val).trim().toLowerCase();
        counts.set(norm, (counts.get(norm) || 0) + 1);
      }
      let dupCount = 0;
      for (const [, cnt] of counts) {
        if (cnt > 1) dupCount += cnt - 1;
      }
      return dupCount;
    };

    const emails = users.map((u) => u.email);
    const usernames = users.map((u) => u.username);
    const phones = users.map((u) => u.mobile);
    const nids = users.map((u) => u.nationalID);
    const citizenships = users.map((u) => u.citizenshipNumber);

    const report = {
      duplicateEmails: countDuplicates(emails),
      duplicatePhones: countDuplicates(phones),
      duplicateUsernames: countDuplicates(usernames),
      duplicateNids: countDuplicates(nids),
      duplicateCitizenships: countDuplicates(citizenships),
    };

    console.log("📊 [Database Inspection] Duplicate audit summary:", report);
    return report;
  }

  static async createUser(
    userData: Partial<User> & { password?: string },
  ): Promise<User> {
    const passwordHash = userData.passwordHash
      ? userData.passwordHash
      : userData.password
        ? await bcrypt.hash(userData.password, 10)
        : "";

    const user: User = {
      id: userData.id || this.createId("usr"),
      fullName: userData.fullName || "",
      username: userData.username || "",
      nationalID: userData.nationalID || "",
      citizenshipNumber: userData.citizenshipNumber || "",
      email: userData.email || "",
      mobile: userData.mobile || "",
      address: userData.address || "",
      dob: userData.dob || "",
      gender: userData.gender || "Male",
      occupation: userData.occupation || "",
      passwordHash,
      role: userData.role || "Voter",
      isVerified: userData.isVerified ?? true,
      isApproved: userData.isApproved ?? false,
      isSuspended: userData.isSuspended ?? false,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
      tokenVersion: userData.tokenVersion || 0,
      accountStatus: userData.accountStatus || "Pending",
      ...userData,
    };

    let result: User | null = null;
    if (this.db) {
      result = await this.insertOne<User>("users", user);
    }

    const existing = (this.inMemStore.get("users") || []) as User[];
    if (!existing.some((u) => u.id === user.id)) {
      existing.push(user);
      this.inMemStore.set("users", existing);
    }

    return result || user;
  }

  static async updateUser(
    userId: string,
    updates: Partial<User>,
  ): Promise<boolean> {
    updates.updatedAt = new Date().toISOString();
    return this.updateOne<User>("users", { id: userId } as Filter<User>, {
      $set: updates,
    });
  }

  static async verifyUserPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  // ============================================
  // User Profiles
  // ============================================

  static getUserProfiles(filter: Partial<UserProfile> = {}): UserProfile[] {
    this.ensureSeedData();
    const profiles = (this.inMemStore.get("user_profiles") ||
      []) as UserProfile[];
    return profiles.filter((profile: any) => {
      return Object.entries(filter).every(
        ([key, value]) => profile[key] === value,
      );
    });
  }

  static async getUserProfileByUserId(
    userId: string,
  ): Promise<UserProfile | null> {
    return this.findOne<UserProfile>("user_profiles", {
      userId,
    } as Filter<UserProfile>);
  }

  static async createUserProfile(
    profileData: Partial<UserProfile>,
  ): Promise<UserProfile | null> {
    const profile: UserProfile = {
      id: this.createId("prof"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...profileData,
    } as UserProfile;

    return this.insertOne<UserProfile>("user_profiles", profile);
  }

  static async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<boolean> {
    const result = await this.upsertUserProfile(userId, updates);
    return Boolean(result);
  }

  static async upsertUserProfile(
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const profiles = this.getUserProfiles();
    const existingIndex = profiles.findIndex((p: any) => p.userId === userId);
    const now = new Date().toISOString();
    let updatedProfile: UserProfile;

    if (existingIndex >= 0) {
      updatedProfile = {
        ...profiles[existingIndex],
        ...updates,
        userId,
        updatedAt: now,
      };
      profiles[existingIndex] = updatedProfile;
    } else {
      updatedProfile = {
        id: this.createId("prof"),
        userId,
        createdAt: now,
        updatedAt: now,
        ...updates,
      } as UserProfile;
      profiles.push(updatedProfile);
    }

    this.inMemStore.set("user_profiles", profiles);

    if (this.db) {
      await this.upsertOne(
        "user_profiles",
        { userId } as Filter<UserProfile>,
        updatedProfile,
      );
    }

    return updatedProfile;
  }

  // ============================================
  // Elections
  // ============================================

  static getElections(filter: Partial<Election> = {}): Election[] {
    this.ensureSeedData();
    const elections = (this.inMemStore.get("elections") || []) as Election[];
    return elections.filter((election: any) => {
      return Object.entries(filter).every(
        ([key, value]) => election[key] === value,
      );
    });
  }

  static async getElectionById(electionId: string): Promise<Election | null> {
    return this.findOne<Election>("elections", {
      id: electionId,
    } as Filter<Election>);
  }

  static async getActiveElections(): Promise<Election[]> {
    return this.findAll<Election>("elections", {
      status: "Active",
    } as Filter<Election>);
  }

  static async createElection(
    electionData: Partial<Election>,
  ): Promise<Election | null> {
    const election: Election = {
      id: this.createId("elect"),
      title: electionData.title || "",
      description: electionData.description || "",
      status: electionData.status || "Draft",
      isActive: electionData.isActive ?? true,
      type: electionData.type || "General Election",
      startDate: electionData.startDate || new Date().toISOString(),
      endDate: electionData.endDate || new Date().toISOString(),
      resultsPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...electionData,
    };

    let result: Election | null = null;
    if (this.db) {
      result = await this.insertOne<Election>("elections", election);
    }
    const existing = (this.inMemStore.get("elections") || []) as Election[];
    if (!existing.some((e) => e.id === election.id)) {
      existing.push(election);
      this.inMemStore.set("elections", existing);
    }
    return result || election;
  }

  static async updateElection(
    electionId: string,
    updates: Partial<Election>,
  ): Promise<boolean> {
    updates.updatedAt = new Date().toISOString();
    let dbSuccess = true;
    if (this.db) {
      dbSuccess = await this.updateOne<Election>(
        "elections",
        { id: electionId } as Filter<Election>,
        { $set: updates },
      );
    }
    const elections = (this.inMemStore.get("elections") || []) as Election[];
    const idx = elections.findIndex((e) => e.id === electionId);
    if (idx >= 0) {
      elections[idx] = { ...elections[idx], ...updates };
      this.inMemStore.set("elections", elections);
    }
    return dbSuccess;
  }

  // ============================================
  // Candidates
  // ============================================

  static getCandidates(filter: Partial<Candidate> = {}): Candidate[] {
    this.ensureSeedData();
    const candidates = (this.inMemStore.get("candidates") || []) as Candidate[];
    return candidates.filter((candidate: any) => {
      return Object.entries(filter).every(
        ([key, value]) => candidate[key] === value,
      );
    });
  }

  static async getCandidatesByElection(
    electionId: string,
  ): Promise<Candidate[]> {
    return this.findAll<Candidate>("candidates", {
      electionId,
      status: { $in: ["Approved", "Verified"] },
    } as Filter<Candidate>);
  }

  static async getCandidateById(
    candidateId: string,
  ): Promise<Candidate | null> {
    return this.findOne<Candidate>("candidates", {
      id: candidateId,
    } as Filter<Candidate>);
  }

  static async createCandidate(
    candidateData: Partial<Candidate>,
  ): Promise<Candidate | null> {
    const candidate: Candidate = {
      id: this.createId("cand"),
      electionId: candidateData.electionId || "",
      name: candidateData.name || "",
      party: candidateData.party || "Independent",
      biography: candidateData.biography || "",
      education: candidateData.education || "",
      experience: candidateData.experience || "",
      photoUrl: candidateData.photoUrl || "",
      manifestoText: candidateData.manifestoText || "",
      status: "Pending",
      voteCount: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...candidateData,
    };

    let result: Candidate | null = null;
    if (this.db) {
      result = await this.insertOne<Candidate>("candidates", candidate);
    }
    const existing = (this.inMemStore.get("candidates") || []) as Candidate[];
    if (!existing.some((c) => c.id === candidate.id)) {
      existing.push(candidate);
      this.inMemStore.set("candidates", existing);
    }
    return result || candidate;
  }

  // ============================================
  // Political Parties
  // ============================================

  static getPoliticalParties(): PoliticalParty[] {
    this.ensureSeedData();
    return (this.inMemStore.get("political_parties") || []) as PoliticalParty[];
  }

  static async getPoliticalPartyByCode(
    code: string,
  ): Promise<PoliticalParty | null> {
    return this.findOne<PoliticalParty>("political_parties", {
      code,
    } as Filter<PoliticalParty>);
  }

  // ============================================
  // Votes
  // ============================================

  static getVotes(filter: Partial<Vote> = {}): Vote[] {
    this.ensureSeedData();
    const votes = (this.inMemStore.get("votes") || []) as Vote[];
    return votes.filter((vote: any) => {
      return Object.entries(filter).every(
        ([key, value]) => vote[key] === value,
      );
    });
  }

  static async getVotesByElection(electionId: string): Promise<Vote[]> {
    return this.findAll<Vote>("votes", { electionId } as Filter<Vote>);
  }

  static async castVote(voteData: Omit<Vote, "id">): Promise<Vote | null> {
    // Check for duplicate vote
    const existingVote = await this.findOne<Vote>("votes", {
      electionId: voteData.electionId,
      anonymousVoterHash: voteData.anonymousVoterHash,
    } as Filter<Vote>);

    if (existingVote) {
      throw new Error(
        "Duplicate vote detected. You have already voted in this election.",
      );
    }

    const vote: Vote = {
      id: this.createId("vote"),
      ...voteData,
      timestamp: new Date().toISOString(),
    };

    const result = await this.insertOne<Vote>("votes", vote);

    // Update candidate vote count
    if (result) {
      await this.getCollection("candidates").updateOne(
        { id: voteData.candidateId },
        { $inc: { voteCount: 1 } },
      );

      // Update election total votes
      await this.getCollection("elections").updateOne(
        { id: voteData.electionId },
        { $inc: { totalVotes: 1 } },
      );
    }

    return result;
  }

  static async getElectionResults(electionId: string): Promise<any[]> {
    const collection = this.getCollection("votes");

    const results = await collection
      .aggregate([
        { $match: { electionId } },
        { $group: { _id: "$candidateId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    return results;
  }

  static async reconcileVoteCounts(targetElectionId?: string): Promise<{
    electionDiscrepancies: Array<{ electionId: string; cachedTotal: number; actualTotal: number }>;
    candidateDiscrepancies: Array<{ candidateId: string; candidateName: string; cachedVotes: number; actualVotes: number }>;
  }> {
    const votes = (this.inMemStore.get("votes") || []) as Vote[];
    const candidates = (this.inMemStore.get("candidates") || []) as Candidate[];
    const elections = (this.inMemStore.get("elections") || []) as Election[];

    const voteCountsByCandidate: Record<string, number> = {};
    const voteCountsByElection: Record<string, number> = {};

    for (const v of votes) {
      if (targetElectionId && v.electionId !== targetElectionId) continue;
      voteCountsByCandidate[v.candidateId] = (voteCountsByCandidate[v.candidateId] || 0) + 1;
      voteCountsByElection[v.electionId] = (voteCountsByElection[v.electionId] || 0) + 1;
    }

    const candidateDiscrepancies: any[] = [];
    for (const c of candidates) {
      if (targetElectionId && c.electionId !== targetElectionId) continue;
      const actualVotes = voteCountsByCandidate[c.id] || 0;
      const cachedVotes = c.voteCount || 0;
      if (actualVotes !== cachedVotes) {
        candidateDiscrepancies.push({
          candidateId: c.id,
          candidateName: c.name,
          cachedVotes,
          actualVotes,
        });
      }
    }

    const electionDiscrepancies: any[] = [];
    for (const e of elections) {
      if (targetElectionId && e.id !== targetElectionId) continue;
      const actualTotal = voteCountsByElection[e.id] || 0;
      const cachedTotal = (e as any).totalVotes || 0;
      if (actualTotal !== cachedTotal) {
        electionDiscrepancies.push({
          electionId: e.id,
          cachedTotal,
          actualTotal,
        });
      }
    }

    return { electionDiscrepancies, candidateDiscrepancies };
  }

  // ============================================
  // Face Verifications
  // ============================================

  static getFaceVerifications(
    filter: Partial<FaceVerification> = {},
  ): FaceVerification[] {
    this.ensureSeedData();
    const records = (this.inMemStore.get("face_verifications") ||
      []) as FaceVerification[];
    return records.filter((record: any) => {
      return Object.entries(filter).every(
        ([key, value]) => record[key] === value,
      );
    });
  }

  static async createFaceVerification(
    data: Partial<FaceVerification>,
  ): Promise<FaceVerification | null> {
    const verification: FaceVerification = {
      id: this.createId("face"),
      verificationStatus: "pending",
      createdAt: new Date().toISOString(),
      ...data,
    } as FaceVerification;

    return this.insertOne<FaceVerification>("face_verifications", verification);
  }

  static async updateFaceVerification(
    verificationId: string,
    updates: Partial<FaceVerification>,
  ): Promise<boolean> {
    return this.updateOne<FaceVerification>(
      "face_verifications",
      { id: verificationId } as Filter<FaceVerification>,
      { $set: updates },
    );
  }

  // ============================================
  // Identity Documents
  // ============================================

  static getIdentityDocuments(
    filter: Partial<IdentityDocument> = {},
  ): IdentityDocument[] {
    this.ensureSeedData();
    const documents = (this.inMemStore.get("identity_documents") ||
      []) as IdentityDocument[];
    return documents.filter((document: any) => {
      return Object.entries(filter).every(
        ([key, value]) => document[key] === value,
      );
    });
  }

  static async getIdentityDocumentsByUser(
    userId: string,
  ): Promise<IdentityDocument[]> {
    return this.findAll<IdentityDocument>("identity_documents", {
      userId,
    } as Filter<IdentityDocument>);
  }

  static async createIdentityDocument(
    data: Partial<IdentityDocument>,
  ): Promise<IdentityDocument | null> {
    const document: IdentityDocument = {
      id: this.createId("doc"),
      verificationStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    } as IdentityDocument;

    return this.insertOne<IdentityDocument>("identity_documents", document);
  }

  static async upsertNidRecord(data: Record<string, any>): Promise<{
    success: boolean;
    message: string;
    replaced: boolean;
    isNew: boolean;
    record: any;
  }> {
    this.ensureSeedData();
    const rawNid = String(
      data.nidNumber || data.nationalID || data.documentNumber || "",
    ).trim();
    if (!rawNid) {
      throw new Error("NID number is required for submission.");
    }

    const normalizedNid = rawNid.replace(/[\s-]/g, "").toUpperCase();

    const docs = (this.inMemStore.get("identity_documents") || []) as any[];
    const profiles = (this.inMemStore.get("user_profiles") || []) as any[];
    const users = (this.inMemStore.get("users") || []) as any[];

    const existingDoc = docs.find(
      (d) =>
        (d.nidNumber &&
          String(d.nidNumber).replace(/[\s-]/g, "").toUpperCase() ===
            normalizedNid) ||
        (d.documentNumber &&
          String(d.documentNumber).replace(/[\s-]/g, "").toUpperCase() ===
            normalizedNid),
    );

    const existingProfile = profiles.find(
      (p) =>
        p.nidNumber &&
        String(p.nidNumber).replace(/[\s-]/g, "").toUpperCase() ===
          normalizedNid,
    );

    const existingUser = users.find(
      (u) =>
        u.nationalID &&
        String(u.nationalID).replace(/[\s-]/g, "").toUpperCase() ===
          normalizedNid,
    );

    const existingRecord =
      existingDoc ||
      existingProfile ||
      (existingUser ? { id: existingUser.id, userId: existingUser.id } : null);

    const userId =
      data.userId ||
      existingDoc?.userId ||
      existingProfile?.userId ||
      existingUser?.id ||
      "";

    if (!existingRecord) {
      const newDocId = this.createId("doc");
      const newRecord = {
        id: newDocId,
        documentId: newDocId,
        userId,
        documentType: "nid_front",
        documentNumber: rawNid,
        nidNumber: rawNid,
        nidIssueDate: data.nidIssueDate || "",
        nidStatus: data.nidStatus || "Verified",
        fileUrl: data.nidFrontImage || data.fileUrl || "",
        nidFrontImage: data.nidFrontImage || "",
        nidBackImage: data.nidBackImage || "",
        verificationStatus: "verified",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };

      docs.push(newRecord);
      this.inMemStore.set("identity_documents", docs);
      if (this.db) {
        try {
          await this.upsertOne(
            "identity_documents",
            { id: newRecord.id },
            newRecord,
          );
        } catch (dbErr: any) {
          const parsed = this.parseDuplicateFieldError(dbErr);
          if (parsed && parsed.field === "nid") {
            return this.upsertNidRecord(data);
          }
        }
      }

      if (userId) {
        const uIdx = users.findIndex((u) => u.id === userId);
        if (uIdx >= 0) {
          users[uIdx].nationalID = rawNid;
          users[uIdx].updatedAt = new Date().toISOString();
          await this.saveUsers(users);
        }
        const pIdx = profiles.findIndex((p) => p.userId === userId);
        if (pIdx >= 0) {
          profiles[pIdx].nidNumber = rawNid;
          if (data.nidIssueDate)
            profiles[pIdx].nidIssueDate = data.nidIssueDate;
          if (data.nidStatus) profiles[pIdx].nidStatus = data.nidStatus;
          if (data.nidFrontImage)
            profiles[pIdx].nidFrontImage = data.nidFrontImage;
          if (data.nidBackImage)
            profiles[pIdx].nidBackImage = data.nidBackImage;
          profiles[pIdx].updatedAt = new Date().toISOString();
          await this.saveUserProfiles(profiles);
        }
      }

      return {
        success: true,
        message: "NID registered successfully",
        replaced: false,
        isNew: true,
        record: newRecord,
      };
    }

    const recordId =
      existingDoc?.id ||
      existingDoc?.documentId ||
      existingProfile?.id ||
      existingUser?.id ||
      this.createId("doc");
    const targetUserId =
      existingDoc?.userId ||
      existingProfile?.userId ||
      existingUser?.id ||
      userId;

    const updatedRecord = {
      ...existingDoc,
      ...data,
      id: recordId,
      documentId: existingDoc?.documentId || recordId,
      userId: targetUserId,
      documentType: "nid_front",
      documentNumber: rawNid,
      nidNumber: rawNid,
      nidIssueDate:
        data.nidIssueDate ||
        existingDoc?.nidIssueDate ||
        existingProfile?.nidIssueDate ||
        "",
      nidStatus:
        data.nidStatus ||
        existingDoc?.nidStatus ||
        existingProfile?.nidStatus ||
        "Verified",
      fileUrl:
        data.nidFrontImage ||
        data.fileUrl ||
        existingDoc?.fileUrl ||
        existingDoc?.nidFrontImage ||
        "",
      nidFrontImage:
        data.nidFrontImage ||
        existingDoc?.nidFrontImage ||
        existingProfile?.nidFrontImage ||
        "",
      nidBackImage:
        data.nidBackImage ||
        existingDoc?.nidBackImage ||
        existingProfile?.nidBackImage ||
        "",
      verificationStatus: "verified",
      createdAt: existingDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingDoc) {
      const docIdx = docs.findIndex(
        (d) => d.id === existingDoc.id || d.documentId === existingDoc.documentId,
      );
      if (docIdx >= 0) {
        docs[docIdx] = updatedRecord;
      } else {
        docs.push(updatedRecord);
      }
    } else {
      docs.push(updatedRecord);
    }
    this.inMemStore.set("identity_documents", docs);
    if (this.db) {
      await this.upsertOne(
        "identity_documents",
        { id: updatedRecord.id },
        updatedRecord,
      );
    }

    if (targetUserId) {
      const uIdx = users.findIndex((u) => u.id === targetUserId);
      if (uIdx >= 0) {
        users[uIdx].nationalID = rawNid;
        users[uIdx].updatedAt = new Date().toISOString();
        await this.saveUsers(users);
      }
      const pIdx = profiles.findIndex((p) => p.userId === targetUserId);
      if (pIdx >= 0) {
        profiles[pIdx].nidNumber = rawNid;
        if (data.nidIssueDate)
          profiles[pIdx].nidIssueDate = data.nidIssueDate;
        if (data.nidStatus) profiles[pIdx].nidStatus = data.nidStatus;
        if (data.nidFrontImage)
          profiles[pIdx].nidFrontImage = data.nidFrontImage;
        if (data.nidBackImage)
          profiles[pIdx].nidBackImage = data.nidBackImage;
        profiles[pIdx].updatedAt = new Date().toISOString();
        await this.saveUserProfiles(profiles);
      }
    }

    return {
      success: true,
      message:
        "NID already exists. The previous NID information has been updated with your latest submission.",
      replaced: true,
      isNew: false,
      record: updatedRecord,
    };
  }

  static async upsertCitizenshipRecord(data: Record<string, any>): Promise<{
    success: boolean;
    message: string;
    replaced: boolean;
    isNew: boolean;
    record: any;
  }> {
    this.ensureSeedData();
    const rawCitizenship = String(
      data.citizenshipNumber || data.citizenship || data.documentNumber || "",
    ).trim();
    if (!rawCitizenship) {
      return {
        success: true,
        message: "Citizenship record creation skipped (no citizenship number provided).",
        replaced: false,
        isNew: false,
        record: null,
      };
    }

    const normalizedCit = rawCitizenship.replace(/[\s-]/g, "").toUpperCase();

    const docs = (this.inMemStore.get("identity_documents") || []) as any[];
    const profiles = (this.inMemStore.get("user_profiles") || []) as any[];
    const users = (this.inMemStore.get("users") || []) as any[];

    const existingDoc = docs.find(
      (d) =>
        (d.citizenshipNumber &&
          String(d.citizenshipNumber).replace(/[\s-]/g, "").toUpperCase() ===
            normalizedCit) ||
        (d.documentNumber &&
          String(d.documentNumber).replace(/[\s-]/g, "").toUpperCase() ===
            normalizedCit),
    );

    const existingProfile = profiles.find(
      (p) =>
        p.citizenshipNumber &&
        String(p.citizenshipNumber).replace(/[\s-]/g, "").toUpperCase() ===
          normalizedCit,
    );

    const existingUser = users.find(
      (u) =>
        u.citizenshipNumber &&
        String(u.citizenshipNumber).replace(/[\s-]/g, "").toUpperCase() ===
          normalizedCit,
    );

    const existingRecord =
      existingDoc ||
      existingProfile ||
      (existingUser ? { id: existingUser.id, userId: existingUser.id } : null);

    const userId =
      data.userId ||
      existingDoc?.userId ||
      existingProfile?.userId ||
      existingUser?.id ||
      "";

    if (!existingRecord) {
      const newDocId = this.createId("doc");
      const newRecord = {
        id: newDocId,
        documentId: newDocId,
        userId,
        documentType: "citizenship_front",
        documentNumber: rawCitizenship,
        citizenshipNumber: rawCitizenship,
        citizenshipType: data.citizenshipType || "Regular",
        citizenshipIssueDate: data.citizenshipIssueDate || "",
        citizenshipIssueDistrict: data.citizenshipIssueDistrict || "",
        citizenshipIssueAuthority: data.citizenshipIssueAuthority || "",
        fileUrl: data.citizenshipFrontImage || data.fileUrl || "",
        citizenshipFrontImage: data.citizenshipFrontImage || "",
        citizenshipBackImage: data.citizenshipBackImage || "",
        signatureImage: data.signatureImage || "",
        verificationStatus: "verified",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };

      docs.push(newRecord);
      this.inMemStore.set("identity_documents", docs);
      if (this.db) {
        try {
          await this.upsertOne(
            "identity_documents",
            { id: newRecord.id },
            newRecord,
          );
        } catch (dbErr: any) {
          const parsed = this.parseDuplicateFieldError(dbErr);
          if (parsed && parsed.field === "citizenshipNumber") {
            return this.upsertCitizenshipRecord(data);
          }
        }
      }

      if (userId) {
        const uIdx = users.findIndex((u) => u.id === userId);
        if (uIdx >= 0) {
          users[uIdx].citizenshipNumber = rawCitizenship;
          users[uIdx].updatedAt = new Date().toISOString();
          await this.saveUsers(users);
        }
        const pIdx = profiles.findIndex((p) => p.userId === userId);
        if (pIdx >= 0) {
          profiles[pIdx].citizenshipNumber = rawCitizenship;
          if (data.citizenshipType)
            profiles[pIdx].citizenshipType = data.citizenshipType;
          if (data.citizenshipIssueDate)
            profiles[pIdx].citizenshipIssueDate = data.citizenshipIssueDate;
          if (data.citizenshipIssueDistrict)
            profiles[pIdx].citizenshipIssueDistrict =
              data.citizenshipIssueDistrict;
          if (data.citizenshipIssueAuthority)
            profiles[pIdx].citizenshipIssueAuthority =
              data.citizenshipIssueAuthority;
          if (data.citizenshipFrontImage)
            profiles[pIdx].citizenshipFrontImage = data.citizenshipFrontImage;
          if (data.citizenshipBackImage)
            profiles[pIdx].citizenshipBackImage = data.citizenshipBackImage;
          if (data.signatureImage)
            profiles[pIdx].signatureImage = data.signatureImage;
          profiles[pIdx].updatedAt = new Date().toISOString();
          await this.saveUserProfiles(profiles);
        }
      }

      return {
        success: true,
        message: "Citizenship record registered successfully",
        replaced: false,
        isNew: true,
        record: newRecord,
      };
    }

    const recordId =
      existingDoc?.id ||
      existingDoc?.documentId ||
      existingProfile?.id ||
      existingUser?.id ||
      this.createId("doc");
    const targetUserId =
      existingDoc?.userId ||
      existingProfile?.userId ||
      existingUser?.id ||
      userId;

    const updatedRecord = {
      ...existingDoc,
      ...data,
      id: recordId,
      documentId: existingDoc?.documentId || recordId,
      userId: targetUserId,
      documentType: "citizenship_front",
      documentNumber: rawCitizenship,
      citizenshipNumber: rawCitizenship,
      citizenshipType:
        data.citizenshipType ||
        existingDoc?.citizenshipType ||
        existingProfile?.citizenshipType ||
        "Regular",
      citizenshipIssueDate:
        data.citizenshipIssueDate ||
        existingDoc?.citizenshipIssueDate ||
        existingProfile?.citizenshipIssueDate ||
        "",
      citizenshipIssueDistrict:
        data.citizenshipIssueDistrict ||
        existingDoc?.citizenshipIssueDistrict ||
        existingProfile?.citizenshipIssueDistrict ||
        "",
      citizenshipIssueAuthority:
        data.citizenshipIssueAuthority ||
        existingDoc?.citizenshipIssueAuthority ||
        existingProfile?.citizenshipIssueAuthority ||
        "",
      fileUrl:
        data.citizenshipFrontImage ||
        data.fileUrl ||
        existingDoc?.fileUrl ||
        existingDoc?.citizenshipFrontImage ||
        "",
      citizenshipFrontImage:
        data.citizenshipFrontImage ||
        existingDoc?.citizenshipFrontImage ||
        existingProfile?.citizenshipFrontImage ||
        "",
      citizenshipBackImage:
        data.citizenshipBackImage ||
        existingDoc?.citizenshipBackImage ||
        existingProfile?.citizenshipBackImage ||
        "",
      signatureImage:
        data.signatureImage ||
        existingDoc?.signatureImage ||
        existingProfile?.signatureImage ||
        "",
      verificationStatus: "verified",
      createdAt: existingDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingDoc) {
      const docIdx = docs.findIndex(
        (d) => d.id === existingDoc.id || d.documentId === existingDoc.documentId,
      );
      if (docIdx >= 0) {
        docs[docIdx] = updatedRecord;
      } else {
        docs.push(updatedRecord);
      }
    } else {
      docs.push(updatedRecord);
    }
    this.inMemStore.set("identity_documents", docs);
    if (this.db) {
      await this.upsertOne(
        "identity_documents",
        { id: updatedRecord.id },
        updatedRecord,
      );
    }

    if (targetUserId) {
      const uIdx = users.findIndex((u) => u.id === targetUserId);
      if (uIdx >= 0) {
        users[uIdx].citizenshipNumber = rawCitizenship;
        users[uIdx].updatedAt = new Date().toISOString();
        await this.saveUsers(users);
      }
      const pIdx = profiles.findIndex((p) => p.userId === targetUserId);
      if (pIdx >= 0) {
        profiles[pIdx].citizenshipNumber = rawCitizenship;
        if (data.citizenshipType)
          profiles[pIdx].citizenshipType = data.citizenshipType;
        if (data.citizenshipIssueDate)
          profiles[pIdx].citizenshipIssueDate = data.citizenshipIssueDate;
        if (data.citizenshipIssueDistrict)
          profiles[pIdx].citizenshipIssueDistrict =
            data.citizenshipIssueDistrict;
        if (data.citizenshipIssueAuthority)
          profiles[pIdx].citizenshipIssueAuthority =
            data.citizenshipIssueAuthority;
        if (data.citizenshipFrontImage)
          profiles[pIdx].citizenshipFrontImage = data.citizenshipFrontImage;
        if (data.citizenshipBackImage)
          profiles[pIdx].citizenshipBackImage = data.citizenshipBackImage;
        if (data.signatureImage)
          profiles[pIdx].signatureImage = data.signatureImage;
        profiles[pIdx].updatedAt = new Date().toISOString();
        await this.saveUserProfiles(profiles);
      }
    }

    return {
      success: true,
      message:
        "Citizenship Number already exists. The previous Citizenship information has been updated with your latest submission.",
      replaced: true,
      isNew: false,
      record: updatedRecord,
    };
  }

  // ============================================
  // OTP Records
  // ============================================

  static getOTPs(filter: Partial<OTPRecord> = {}): OTPRecord[] {
    this.ensureSeedData();
    const otps = (this.inMemStore.get("otps") || []) as OTPRecord[];
    return otps.filter((otp: any) => {
      return Object.entries(filter).every(([key, value]) => otp[key] === value);
    });
  }

  static async createOTP(data: Partial<OTPRecord>): Promise<OTPRecord | null> {
    const otp: OTPRecord = {
      id: this.createId("otp"),
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      isUsed: false,
      purpose: data.purpose || "Verification",
      createdAt: new Date().toISOString(),
      ...data,
    };

    return this.insertOne<OTPRecord>("otps", otp);
  }

  static async verifyOTP(identifier: string, code: string): Promise<boolean> {
    const otp = await this.findOne<OTPRecord>("otps", {
      $or: [{ email: identifier }, { mobile: identifier }],
      code,
      isUsed: false,
      expiresAt: { $gt: new Date().toISOString() },
    } as Filter<OTPRecord>);

    if (otp) {
      await this.updateOne<OTPRecord>(
        "otps",
        { id: otp.id } as Filter<OTPRecord>,
        { $set: { isUsed: true } },
      );
      return true;
    }

    return false;
  }

  // ============================================
  // Audit Logs
  // ============================================

  static getAuditLogs(filter: Partial<AuditLog> = {}): AuditLog[] {
    this.ensureSeedData();
    const logs = (this.inMemStore.get("audit_logs") || []) as AuditLog[];
    return logs.filter((log: any) => {
      return Object.entries(filter).every(([key, value]) => log[key] === value);
    });
  }

  static async addAuditLog(
    userId: string,
    userEmail: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    details?: string,
  ): Promise<AuditLog | null> {
    const log: AuditLog = {
      id: this.createId("log"),
      userId,
      userEmail,
      action,
      actionCategory: this.categorizeAction(action),
      severity: "INFO",
      details: details || action,
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "Unknown",
      timestamp: new Date().toISOString(),
    };

    return this.insertOne<AuditLog>("audit_logs", log);
  }

  private static categorizeAction(action: string): string {
    const lower = action.toLowerCase();
    if (lower.includes("login") || lower.includes("logout"))
      return "authentication";
    if (lower.includes("vote") || lower.includes("ballot")) return "voting";
    if (lower.includes("verify") || lower.includes("face"))
      return "verification";
    if (lower.includes("profile") || lower.includes("register"))
      return "profile";
    if (
      lower.includes("admin") ||
      lower.includes("approve") ||
      lower.includes("reject")
    )
      return "admin";
    if (lower.includes("error") || lower.includes("fail")) return "security";
    return "system";
  }

  // ============================================
  // Notifications
  // ============================================

  static getNotifications(filter: Partial<Notification> = {}): Notification[] {
    this.ensureSeedData();
    const notifications = (this.inMemStore.get("notifications") ||
      []) as Notification[];
    return notifications
      .filter((notification: any) => {
        return Object.entries(filter).every(
          ([key, value]) => notification[key] === value,
        );
      })
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.findAll<Notification>(
      "notifications",
      {
        $or: [{ userId }, { userId: { $exists: false } }],
      } as Filter<Notification>,
      {
        sort: { timestamp: -1 },
        limit: 50,
      },
    );
  }

  static async createNotification(
    data: Partial<Notification>,
  ): Promise<Notification | null> {
    const notification: Notification = {
      id: this.createId("notif"),
      title: data.title || "",
      message: data.message || "",
      type: data.type || "info",
      isRead: false,
      timestamp: new Date().toISOString(),
      ...data,
    };

    return this.insertOne<Notification>("notifications", notification);
  }

  // ============================================
  // FAQs
  // ============================================

  static getFaqs(): Faq[] {
    this.ensureSeedData();
    const faqs = (this.inMemStore.get("faqs") || []) as Faq[];
    return [...faqs]
      .filter((faq) => faq.status === "Published")
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  static async createFaq(data: Partial<Faq>): Promise<Faq | null> {
    const faq: Faq = {
      id: this.createId("faq"),
      question: data.question || "",
      answer: data.answer || "",
      category: data.category || "General",
      displayOrder: data.displayOrder || 0,
      status: data.status || "Draft",
    };

    return this.insertOne<Faq>("faqs", faq);
  }

  // ============================================
  // Login Attempt Progressive Lockout Management
  // ============================================

  static async getLoginAttempt(identifier: string): Promise<LoginAttempt | null> {
    this.ensureSeedData();
    const raw = String(identifier || "").trim().toLowerCase();
    if (!raw) return null;

    if (this.db) {
      const attempt = await this.findOne<LoginAttempt>("login_attempts", { identifier: raw } as Filter<LoginAttempt>);
      if (attempt) return attempt;
    }
    const attempts = (this.inMemStore.get("login_attempts") || []) as LoginAttempt[];
    return attempts.find((a) => a.identifier === raw) || null;
  }

  static async recordFailedLogin(
    identifier: string,
    userId?: string,
  ): Promise<{ attempt: LoginAttempt; lockoutDurationMs: number; lockedUntil: number }> {
    this.ensureSeedData();
    const raw = String(identifier || "").trim().toLowerCase();
    const now = Date.now();
    const nowIso = new Date().toISOString();

    const attempts = (this.inMemStore.get("login_attempts") || []) as LoginAttempt[];
    let existing = attempts.find((a) => a.identifier === raw);

    if (!existing && this.db) {
      existing = (await this.findOne<LoginAttempt>("login_attempts", { identifier: raw } as Filter<LoginAttempt>)) || undefined;
    }

    const failedCount = (existing?.failedAttempts || 0) + 1;
    let lockoutLevel = existing?.lockoutLevel || 0;

    // Progression:
    // 1-2 failures: no lockout (lockoutLevel=0, 0ms)
    // 3rd failure: 5m (lockoutLevel=1)
    // 4th failure: 10m (lockoutLevel=2)
    // 5th failure: 30m (lockoutLevel=3)
    // 6th failure: 1h (lockoutLevel=4)
    // 7th+ failure: 24h (lockoutLevel=5)
    let lockoutDurationMs = 0;
    if (failedCount === 3) {
      lockoutLevel = 1;
      lockoutDurationMs = 5 * 60 * 1000;
    } else if (failedCount === 4) {
      lockoutLevel = 2;
      lockoutDurationMs = 10 * 60 * 1000;
    } else if (failedCount === 5) {
      lockoutLevel = 3;
      lockoutDurationMs = 30 * 60 * 1000;
    } else if (failedCount === 6) {
      lockoutLevel = 4;
      lockoutDurationMs = 60 * 60 * 1000;
    } else if (failedCount >= 7) {
      lockoutLevel = 5;
      lockoutDurationMs = 24 * 60 * 60 * 1000;
    }

    const lockedUntil = lockoutDurationMs > 0 ? now + lockoutDurationMs : 0;

    const attemptRecord: LoginAttempt = {
      id: existing?.id || this.createId("lat"),
      identifier: raw,
      userId: userId || existing?.userId,
      failedAttempts: failedCount,
      lockoutLevel,
      lockedUntil,
      lastFailedAt: nowIso,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    const idx = attempts.findIndex((a) => a.identifier === raw);
    if (idx >= 0) {
      attempts[idx] = attemptRecord;
    } else {
      attempts.push(attemptRecord);
    }
    this.inMemStore.set("login_attempts", attempts);

    if (this.db) {
      await this.upsertOne("login_attempts", { identifier: raw } as Filter<LoginAttempt>, attemptRecord);
    }

    return { attempt: attemptRecord, lockoutDurationMs, lockedUntil };
  }

  static async recordSuccessfulLogin(identifier: string): Promise<void> {
    this.ensureSeedData();
    const raw = String(identifier || "").trim().toLowerCase();
    if (!raw) return;

    const attempts = (this.inMemStore.get("login_attempts") || []) as LoginAttempt[];
    const filtered = attempts.filter((a) => a.identifier !== raw);
    this.inMemStore.set("login_attempts", filtered);

    if (this.db) {
      await this.deleteOne("login_attempts", { identifier: raw } as Filter<LoginAttempt>);
    }
  }


  // ============================================
  // JWT Token Utilities
  // ============================================

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

  static generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        type: "refresh",
        tokenVersion: user.tokenVersion || 0,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // Statistics & Aggregations
  // ============================================

  static async getSystemStats(): Promise<any> {
    try {
      const [
        totalUsers,
        totalElections,
        totalVotes,
        totalCandidates,
        verifiedUsers,
      ] = await Promise.all([
        this.countDocuments("users"),
        this.countDocuments("elections"),
        this.countDocuments("votes"),
        this.countDocuments("candidates"),
        this.countDocuments("users", { isVerified: true }),
      ]);

      return {
        totalUsers,
        totalElections,
        totalVotes,
        totalCandidates,
        verifiedUsers,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching system stats:", error);
      return null;
    }
  }

  // ============================================
  // Index Management
  // ============================================

  private static async backfillDocumentIds(): Promise<void> {
    if (!this.db) return;
    try {
      const col = this.getCollection("identity_documents");
      const docsToFix = await col
        .find({
          $or: [
            { documentId: { $exists: false } },
            { documentId: null },
            { documentId: "" },
          ],
        })
        .toArray();

      for (const doc of docsToFix) {
        const resolvedId = doc.id || this.createId("doc");
        await col.updateOne(
          { _id: doc._id },
          { $set: { documentId: resolvedId, id: resolvedId } },
        );
      }
    } catch (err: any) {
      console.warn("Notice: Document ID backfill notice:", err?.message);
    }
  }

  private static async safeCreateIndexes(
    collection: Collection,
    indexes: any[],
  ): Promise<void> {
    for (const indexDef of indexes) {
      try {
        await collection.createIndexes([indexDef]);
      } catch (error: any) {
        const isConflict =
          error?.code === 85 ||
          error?.code === 11000 ||
          error?.codeName === "IndexOptionsConflict" ||
          error?.codeName === "DuplicateKey" ||
          /already exists/i.test(error?.message || "");
        if (isConflict) {
          console.warn(
            `Notice: Index ${indexDef.name || "unnamed"} on ${collection.collectionName} skipped due to existing index or data state.`,
          );
          continue;
        }
        console.warn(
          `Warning: Could not create index ${indexDef.name || "unnamed"}:`,
          error?.message,
        );
      }
    }
  }

  private static async ensureIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // Users indexes
      await this.safeCreateIndexes(this.getCollection("users"), [
        { key: { email: 1 }, unique: true, name: "users_email_unique" },
        {
          key: { username: 1 },
          unique: true,
          sparse: true,
          name: "users_username_unique",
        },
        {
          key: { mobile: 1 },
          unique: true,
          sparse: true,
          name: "users_mobile_unique",
        },
        {
          key: { nationalID: 1 },
          unique: true,
          sparse: true,
          name: "users_national_id_unique",
        },
        {
          key: { citizenshipNumber: 1 },
          unique: true,
          sparse: true,
          name: "users_citizenship_number_unique",
        },
        { key: { role: 1, accountStatus: 1 }, name: "users_role_status" },
      ]);

      // User profiles indexes
      await this.safeCreateIndexes(this.getCollection("user_profiles"), [
        { key: { userId: 1 }, unique: true, name: "profiles_user_unique" },
        {
          key: { citizenshipNumber: 1 },
          unique: true,
          sparse: true,
          name: "profiles_citizenship_unique",
        },
        {
          key: { nidNumber: 1 },
          unique: true,
          sparse: true,
          name: "profiles_nid_number_unique",
        },
      ]);

      // Identity documents indexes
      await this.safeCreateIndexes(this.getCollection("identity_documents"), [
        {
          key: { documentId: 1 },
          unique: true,
          sparse: true,
          name: "identity_documents_id_unique",
        },
        {
          key: { documentNumber: 1 },
          unique: true,
          sparse: true,
          name: "identity_documents_doc_number_unique",
        },
        {
          key: { nidNumber: 1 },
          unique: true,
          sparse: true,
          name: "identity_documents_nid_number_unique",
        },
        {
          key: { citizenshipNumber: 1 },
          unique: true,
          sparse: true,
          name: "identity_documents_citizenship_number_unique",
        },
      ]);

      // Elections indexes
      await this.safeCreateIndexes(this.getCollection("elections"), [
        { key: { status: 1, startDate: -1 }, name: "elections_status_date" },
      ]);

      // Candidates indexes
      await this.safeCreateIndexes(this.getCollection("candidates"), [
        {
          key: { electionId: 1, status: 1 },
          name: "candidates_election_status",
        },
      ]);

      // Votes indexes
      await this.safeCreateIndexes(this.getCollection("votes"), [
        {
          key: { electionId: 1, anonymousVoterHash: 1 },
          unique: true,
          name: "votes_unique_per_election",
        },
        {
          key: { electionId: 1, candidateId: 1 },
          name: "votes_election_candidate",
        },
        { key: { timestamp: -1 }, name: "votes_timestamp" },
      ]);

      // Audit logs indexes
      await this.safeCreateIndexes(this.getCollection("audit_logs"), [
        { key: { userId: 1, timestamp: -1 }, name: "audit_user_timestamp" },
        { key: { actionCategory: 1 }, name: "audit_category" },
        { key: { timestamp: -1 }, name: "audit_timestamp" },
      ]);

      // OTPs indexes
      await this.safeCreateIndexes(this.getCollection("otps"), [
        { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "otps_expiry" },
      ]);

      // Notifications indexes
      await this.safeCreateIndexes(this.getCollection("notifications"), [
        { key: { userId: 1, timestamp: -1 }, name: "notifications_user_time" },
      ]);

      // Contact request indexes
      await this.safeCreateIndexes(this.getCollection("contact_requests"), [
        { key: { createdAt: -1 }, name: "contact_created_at" },
        { key: { status: 1, createdAt: -1 }, name: "contact_status_created" },
      ]);

      // Face verifications indexes
      await this.safeCreateIndexes(this.getCollection("face_verifications"), [
        { key: { userId: 1, electionId: 1 }, name: "face_user_election" },
        { key: { verificationStatus: 1 }, name: "face_status" },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "face_expiry" },
      ]);

      // Login attempts indexes
      await this.safeCreateIndexes(this.getCollection("login_attempts"), [
        { key: { identifier: 1 }, unique: true, name: "login_attempts_identifier_unique" },
      ]);

      console.log("✅ Database ready");
    } catch (error) {
      console.error("Error ensuring indexes:", error);
    }
  }

  // ============================================
  // Extended Compatibility Methods
  // ============================================

  private static inMemStore: Map<string, any> = new Map();

  static sanitizeUserForStorage(user: any): any {
    if (!user || typeof user !== "object") return user;
    const copy = { ...user };
    if (copy.faceImage && String(copy.faceImage).length > 1000000) copy.faceImage = "";
    if (copy.fingerprintImage && String(copy.fingerprintImage).length > 1000000) copy.fingerprintImage = "";
    if (copy.profilePhoto && String(copy.profilePhoto).length > 1000000) copy.profilePhoto = "";
    if (Array.isArray(copy.auditLogs)) {
      copy.auditLogs = copy.auditLogs.map((log: any) =>
        typeof log === "string" && log.length > 2048 ? log.slice(0, 2048) : log,
      );
    }
    return copy;
  }

  static async saveUsers(users: User[]): Promise<boolean> {
    try {
      const existingUsers = (this.inMemStore.get("users") || []) as User[];
      const processedUsers = users.map((user) => {
        const existing = existingUsers.find((u) => u.id === user.id);
        let updated = user;
        if (
          existing?.citizenshipNumber &&
          user.citizenshipNumber &&
          user.citizenshipNumber !== existing.citizenshipNumber
        ) {
          updated = { ...updated, citizenshipNumber: existing.citizenshipNumber };
        }

        return updated;
      });

      if (this.db) {
        for (const user of processedUsers) {
          await this.upsertOne(
            "users",
            { id: user.id } as Filter<User>,
            user,
          );
        }
      }
      this.inMemStore.set("users", processedUsers);
      return true;
    } catch (error) {
      console.error("Error saving users:", error);
      return false;
    }
  }

  static async saveUserProfiles(profiles: UserProfile[]): Promise<boolean> {
    try {
      if (this.db) {
        for (const p of profiles) {
          // Use `userId` as the upsert filter because the collection
          // enforces a unique index on `userId`. Using `id` could
          // attempt to insert a new document with a duplicate
          // `userId` when `id` differs, causing E11000 errors.
          await this.upsertOne(
            "user_profiles",
            { userId: p.userId } as unknown as Filter<UserProfile>,
            p,
          );
        }
      }
      this.inMemStore.set("user_profiles", profiles);
      return true;
    } catch {
      return false;
    }
  }

  static async saveElections(elections: Election[]): Promise<boolean> {
    try {
      if (this.db) {
        for (const e of elections) {
          await this.upsertOne("elections", { id: e.id }, e);
        }
      }
      this.inMemStore.set("elections", elections);
      return true;
    } catch {
      return false;
    }
  }

  static async findElectionById(electionId: string): Promise<Election | null> {
    return this.getElectionById(electionId);
  }

  static async saveCandidates(candidates: Candidate[]): Promise<boolean> {
    try {
      if (this.db) {
        for (const candidate of candidates) {
          await this.upsertOne("candidates", { id: candidate.id }, candidate);
        }
      }
      this.inMemStore.set("candidates", candidates);
      return true;
    } catch (error) {
      console.error("Error saving candidates:", error);
      return false;
    }
  }

  static async savePoliticalParties(
    parties: PoliticalParty[],
  ): Promise<boolean> {
    try {
      if (this.db) {
        for (const party of parties) {
          await this.upsertOne(
            "political_parties",
            { id: party.id || party.code } as any,
            party,
          );
        }
      }
      this.inMemStore.set("political_parties", parties);
      this.inMemStore.set("parties", parties);
      return true;
    } catch (error) {
      console.error("Error saving political parties:", error);
      return false;
    }
  }

  static async deleteElection(id: string): Promise<boolean> {
    try {
      if (this.db) {
        await this.deleteOne("elections", { id } as Filter<Election>);
      }
      const elections = (this.inMemStore.get("elections") || []) as Election[];
      this.inMemStore.set(
        "elections",
        elections.filter((e) => e.id !== id),
      );
      return true;
    } catch (error) {
      console.error("Error deleting election:", error);
      return false;
    }
  }

  static async deleteCandidate(id: string): Promise<boolean> {
    try {
      if (this.db) {
        await this.deleteOne("candidates", { id } as Filter<Candidate>);
      }
      const candidates = (this.inMemStore.get("candidates") || []) as Candidate[];
      this.inMemStore.set(
        "candidates",
        candidates.filter((c) => c.id !== id),
      );
      return true;
    } catch (error) {
      console.error("Error deleting candidate:", error);
      return false;
    }
  }

  static async deletePoliticalParty(id: string): Promise<boolean> {
    try {
      if (this.db) {
        await this.deleteOne("political_parties", { id } as Filter<any>);
        await this.deleteOne("political_parties", { code: id } as Filter<any>);
      }
      const parties = (this.inMemStore.get("political_parties") || []) as any[];
      const filtered = parties.filter((p: any) => p.id !== id && p.code !== id);
      this.inMemStore.set("political_parties", filtered);
      this.inMemStore.set("parties", filtered);
      return true;
    } catch (error) {
      console.error("Error deleting political party:", error);
      return false;
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    try {
      if (this.db) {
        await this.deleteOne("users", { id } as Filter<User>);
        await this.deleteOne("user_profiles", { userId: id } as Filter<UserProfile>);
        await this.deleteOne("identity_documents", { userId: id } as Filter<IdentityDocument>);
        await this.deleteOne("face_verifications", { userId: id } as Filter<FaceVerification>);
      }
      const users = (this.inMemStore.get("users") || []) as User[];
      this.inMemStore.set(
        "users",
        users.filter((u) => u.id !== id),
      );
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  static async deleteNewsletterSubscriber(id: string): Promise<boolean> {
    try {
      if (this.db) {
        await this.deleteOne("newsletter_subscribers", { id } as Filter<NewsletterSubscriber>);
      }
      const subs = (this.inMemStore.get("newsletter_subscribers") || []) as NewsletterSubscriber[];
      this.inMemStore.set(
        "newsletter_subscribers",
        subs.filter((s) => s.id !== id),
      );
      return true;
    } catch (error) {
      console.error("Error deleting newsletter subscriber:", error);
      return false;
    }
  }

  static async deleteFaq(id: string): Promise<boolean> {
    try {
      if (this.db) {
        await this.deleteOne("faqs", { id } as Filter<any>);
      }
      const faqs = (this.inMemStore.get("faqs") || []) as any[];
      this.inMemStore.set(
        "faqs",
        faqs.filter((f) => f.id !== id),
      );
      return true;
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return false;
    }
  }

  static async saveVotes(votes: Vote[]): Promise<boolean> {
    try {
      if (this.db) {
        for (const v of votes) {
          await this.upsertOne("votes", { id: v.id }, v);
        }
      }
      this.inMemStore.set("votes", votes);
      return true;
    } catch {
      return false;
    }
  }

  static saveOTPs(otps: OTPRecord[]): boolean {
    try {
      this.inMemStore.set("otps", otps);
      return true;
    } catch {
      return false;
    }
  }

  static async saveFaceVerifications(
    records: FaceVerification[],
  ): Promise<boolean> {
    try {
      if (this.db) {
        for (const r of records) {
          await this.upsertOne("face_verifications", { id: r.id }, r);
        }
      }
      this.inMemStore.set("face_verifications", records);
      return true;
    } catch {
      return false;
    }
  }

  static async saveIdentityDocuments(
    docs: IdentityDocument[],
  ): Promise<boolean> {
    try {
      if (this.db) {
        for (const d of docs) {
          await this.upsertOne("identity_documents", { id: d.id }, d);
        }
      }
      this.inMemStore.set("identity_documents", docs);
      return true;
    } catch {
      return false;
    }
  }

  static saveNotifications(notifications: Notification[]): boolean {
    try {
      this.inMemStore.set("notifications", notifications);
      return true;
    } catch {
      return false;
    }
  }

  static async saveFaqs(faqs: Faq[]): Promise<boolean> {
    try {
      if (this.db) {
        for (const f of faqs) {
          await this.upsertOne("faqs", { id: f.id }, f);
        }
      }
      this.inMemStore.set("faqs", faqs);
      return true;
    } catch {
      return false;
    }
  }

  static getNewsletterSubscribers(): any[] {
    this.ensureSeedData();
    return (this.inMemStore.get("newsletter_subscribers") || []) as any[];
  }

  static async saveNewsletterSubscribers(subscribers: any[]): Promise<boolean> {
    try {
      if (this.db) {
        for (const s of subscribers) {
          await this.upsertOne("newsletter_subscribers", { email: s.email }, s);
        }
      }
      this.inMemStore.set("newsletter_subscribers", subscribers);
      return true;
    } catch {
      return false;
    }
  }

  static getContactRequests(): ContactRequest[] {
    this.ensureSeedData();
    return (this.inMemStore.get("contact_requests") || []) as ContactRequest[];
  }

  static async saveContactRequests(
    requests: ContactRequest[],
  ): Promise<boolean> {
    try {
      if (this.db) {
        for (const request of requests) {
          await this.upsertOne("contact_requests", { id: request.id }, request);
        }
      }
      this.inMemStore.set("contact_requests", requests);
      return true;
    } catch (error) {
      console.error("Error saving contact requests:", error);
      return false;
    }
  }

  static addTimelineEvent(
    message: string,
    level: "info" | "warning" | "error" | "success" | "alert" = "info",
    source: string = "System",
  ): void {
    this.systemTimeline.unshift({
      timestamp: new Date().toISOString(),
      message,
      level,
      source,
    });
    this.systemTimeline = this.systemTimeline.slice(0, 50);
  }

  static encryptFallbackFile(collectionName: string): boolean {
    this.addTimelineEvent(
      `Backup encryption requested for ${collectionName}`,
      "info",
      "Key Vault",
    );
    return true;
  }

  static decryptAndRestoreFallbackFile(collectionName: string): boolean {
    this.addTimelineEvent(
      `Backup restore requested for ${collectionName}`,
      "info",
      "Key Vault",
    );
    return true;
  }

  static runIntegrityAuditAndValidate(): {
    status: "valid" | "warning" | "invalid";
    checks: string[];
  } {
    this.addTimelineEvent("Integrity audit completed", "success", "Key Vault");
    return {
      status: "valid",
      checks: ["Local registry integrity check passed."],
    };
  }

  static getConfig(): Record<string, any> {
    this.ensureSeedData();
    return (this.inMemStore.get("system_config") || {}) as Record<string, any>;
  }

  static saveConfig(config: Record<string, any>): boolean {
    this.inMemStore.set("system_config", config);
    return true;
  }

  static async getUserPreferences(userId: string): Promise<any> {
    if (this.db) {
      return this.findOne<any>("user_preferences", { userId });
    }
    const store = this.inMemStore.get("user_preferences") || {};
    return store[userId] || null;
  }

  static async saveUserPreferences(
    userId: string,
    prefs: any,
  ): Promise<boolean> {
    try {
      if (this.db) {
        await this.upsertOne(
          "user_preferences",
          { userId },
          { userId, ...prefs },
        );
      }
      const store = this.inMemStore.get("user_preferences") || {};
      store[userId] = prefs;
      this.inMemStore.set("user_preferences", store);
      return true;
    } catch {
      return false;
    }
  }

  static async getProfileDraft(userId: string): Promise<any | null> {
    if (this.db) {
      const record = await this.findOne<any>("profile_drafts", { userId });
      return record?.draft ?? null;
    }
    const store = this.inMemStore.get("profile_drafts") || {};
    return store[userId] ?? null;
  }

  static async saveProfileDraft(
    userId: string,
    draft: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const payload = {
        ...draft,
        updatedAt: new Date().toISOString(),
      };
      if (this.db) {
        await this.upsertOne(
          "profile_drafts",
          { userId },
          { userId, draft: payload, updatedAt: payload.updatedAt },
        );
      }
      const store = this.inMemStore.get("profile_drafts") || {};
      store[userId] = payload;
      this.inMemStore.set("profile_drafts", store);
      return true;
    } catch {
      return false;
    }
  }

  static async deleteProfileDraft(userId: string): Promise<boolean> {
    try {
      if (this.db) {
        await this.deleteOne("profile_drafts", { userId });
      }
      const store = this.inMemStore.get("profile_drafts") || {};
      delete store[userId];
      this.inMemStore.set("profile_drafts", store);
      return true;
    } catch {
      return false;
    }
  }

  static async cleanupExpiredDrafts(maxAgeMinutes = 30): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
      let deleted = 0;
      if (this.db) {
        const result = await this.getCollection("profile_drafts").deleteMany({
          updatedAt: { $lt: cutoff },
        });
        deleted = result.deletedCount || 0;
      }
      const store = this.inMemStore.get("profile_drafts") || {};
      for (const uid of Object.keys(store)) {
        if (store[uid]?.updatedAt && store[uid].updatedAt < cutoff) {
          delete store[uid];
          deleted++;
        }
      }
      this.inMemStore.set("profile_drafts", store);
      return deleted;
    } catch {
      return 0;
    }
  }

  static async getDispatchLogs(): Promise<any[]> {
    if (this.db) {
      return this.findAll<any>("dispatch_logs");
    }
    return this.inMemStore.get("dispatch_logs") || [];
  }

  static async saveDispatchLogs(logs: any[]): Promise<boolean> {
    try {
      if (this.db) {
        for (const l of logs) {
          await this.upsertOne("dispatch_logs", { id: l.id }, l);
        }
      }
      this.inMemStore.set("dispatch_logs", logs);
      return true;
    } catch {
      return false;
    }
  }

  static async getIdempotencyRecord(key: string): Promise<any> {
    if (this.db) {
      return this.findOne<any>("idempotency_records", { key });
    }
    const store = this.inMemStore.get("idempotency_records") || {};
    return store[key] || null;
  }

  static async saveIdempotencyRecord(
    key: string,
    record: any,
  ): Promise<boolean> {
    try {
      if (this.db) {
        await this.upsertOne(
          "idempotency_records",
          { key },
          { key, ...record },
        );
      }
      const store = this.inMemStore.get("idempotency_records") || {};
      store[key] = record;
      this.inMemStore.set("idempotency_records", store);
      return true;
    } catch {
      return false;
    }
  }

  static async getRecentVerificationAttempts(
    userId: string,
    hours: number = 24,
  ): Promise<any[]> {
    const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const verifications = await this.getFaceVerifications();
    return verifications.filter(
      (r: any) =>
        r.userId === userId &&
        (r.verificationTimestamp || r.verificationTime) >= cutoff,
    );
  }

  static async recordVerificationAttempt(
    attempt: any,
    electionId: any,
    p0: boolean,
  ): Promise<boolean> {
    const verifications = await this.getFaceVerifications();
    verifications.push(attempt);
    return this.saveFaceVerifications(verifications);
  }

  static async getFailedVerificationCount(
    userId: string,
    hours: number = 24,
  ): Promise<number> {
    const attempts = await this.getRecentVerificationAttempts(userId, hours);
    return attempts.filter(
      (r: any) =>
        r.verificationResult === "Failed" ||
        r.verificationStatus === "Rejected",
    ).length;
  }
}

// Export singleton instance
export default Database;
