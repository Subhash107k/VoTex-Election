// ============================================
// Enhanced Database Schema Types & Definitions
// ============================================

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "date"
  | "buffer"
  | "objectId"
  | "enum"
  | "json"
  | "geopoint"
  | "unknown";

export type FieldValidation = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  custom?: string; // Custom validation function name
};

export type FieldRelation = {
  collection: string;
  field: string;
  type: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  cascade?: boolean;
};

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: FieldValidation;
  sensitive?: boolean;
  encrypted?: boolean;
  index?: boolean;
  unique?: boolean;
  sparse?: boolean;
  relation?: FieldRelation;
  example?: any;
  deprecated?: boolean;
  deprecatedMessage?: string;
}

export interface IndexDefinition {
  fields: string[];
  type?: "unique" | "text" | "geospatial" | "hashed";
  name?: string;
  sparse?: boolean;
  background?: boolean;
}

export interface CollectionSchema {
  name: string;
  description: string;
  version: string;
  fields: FieldDefinition[];
  indexes: IndexDefinition[];
  timestamps: boolean;
  softDelete: boolean;
  auditLog: boolean;
  encryption?: {
    enabled: boolean;
    fields: string[];
  };
  validation?: {
    enabled: boolean;
    level: "strict" | "moderate" | "lenient";
  };
  hooks?: {
    preSave?: string[];
    postSave?: string[];
    preDelete?: string[];
    postDelete?: string[];
  };
}

// ============================================
// Enhanced Database Schema
// ============================================

export const databaseSchema: Record<string, CollectionSchema> = {
  // ============================================
  // Users Collection
  // ============================================
  users: {
    name: "users",
    description:
      "Core user accounts with authentication and authorization data",
    version: "2.0.0",
    timestamps: true,
    softDelete: true,
    auditLog: true,
    encryption: {
      enabled: true,
      fields: ["passwordHash", "twoFactorSecret", "securityAnswers"],
    },
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
        unique: true,
      },
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Unique user identifier (UUID v4)",
        unique: true,
        index: true,
        example: "usr_a1b2c3d4e5f6",
      },
      {
        name: "email",
        type: "string",
        required: true,
        description: "Primary email address for login and communications",
        unique: true,
        index: true,
        validation: {
          pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
          maxLength: 254,
        },
        example: "citizen@email.com",
      },
      {
        name: "username",
        type: "string",
        required: false,
        description: "Optional unique username for login",
        unique: true,
        sparse: true,
        index: true,
        validation: {
          minLength: 3,
          maxLength: 30,
          pattern: "^[a-zA-Z0-9_.-]+$",
        },
        example: "john_doe",
      },
      {
        name: "fullName",
        type: "string",
        required: true,
        description: "Legal full name as per citizenship document",
        validation: {
          minLength: 2,
          maxLength: 100,
        },
        example: "John Doe",
      },
      {
        name: "fullNameNepali",
        type: "string",
        required: false,
        description: "Full name in Nepali script (देवनागरी)",
        validation: {
          maxLength: 150,
        },
      },
      {
        name: "passwordHash",
        type: "string",
        required: true,
        description: "Bcrypt hashed password (never stored in plain text)",
        sensitive: true,
        encrypted: true,
      },
      {
        name: "nationalID",
        type: "string",
        required: true,
        description: "National Identity Card number",
        unique: true,
        index: true,
        validation: {
          pattern: "^[0-9]{5,20}$",
        },
        example: "123456789012",
      },
      {
        name: "citizenshipNumber",
        type: "string",
        required: false,
        description: "Citizenship certificate number",
        unique: true,
        sparse: true,
        index: true,
      },
      {
        name: "voterId",
        type: "string",
        required: false,
        description: "Official voter identification number",
        unique: true,
        sparse: true,
        index: true,
      },
      {
        name: "mobile",
        type: "string",
        required: true,
        description: "Primary mobile number for OTP and alerts",
        validation: {
          pattern: "^(\\+977[- ]?)?\\d{10}$",
        },
        example: "+977-9841234567",
      },
      {
        name: "secondaryPhone",
        type: "string",
        required: false,
        description: "Alternative contact number",
      },
      {
        name: "dateOfBirth",
        type: "date",
        required: true,
        description: "Date of birth (must be 18+ years)",
        validation: {
          custom: "validateAge",
        },
      },
      {
        name: "gender",
        type: "enum",
        required: true,
        description: "Gender identity",
        validation: {
          enum: ["Male", "Female", "Other", "Prefer not to say"],
        },
      },
      {
        name: "role",
        type: "enum",
        required: true,
        description: "User role determining permissions",
        validation: {
          enum: [
            "voter",
            "candidate",
            "admin",
            "super_admin",
            "election_officer",
            "observer",
          ],
        },
        defaultValue: "voter",
        index: true,
      },
      {
        name: "accountStatus",
        type: "enum",
        required: true,
        description: "Current account status",
        validation: {
          enum: [
            "active",
            "inactive",
            "suspended",
            "pending_verification",
            "locked",
            "deleted",
          ],
        },
        defaultValue: "pending_verification",
      },
      {
        name: "isEmailVerified",
        type: "boolean",
        required: true,
        description: "Whether email has been verified via OTP",
        defaultValue: false,
      },
      {
        name: "isMobileVerified",
        type: "boolean",
        required: true,
        description: "Whether mobile has been verified via SMS OTP",
        defaultValue: false,
      },
      {
        name: "isIdentityVerified",
        type: "boolean",
        required: false,
        description: "Whether identity documents have been verified",
        defaultValue: false,
      },
      {
        name: "isBiometricVerified",
        type: "boolean",
        required: false,
        description: "Whether biometric verification is complete",
        defaultValue: false,
      },
      {
        name: "isApproved",
        type: "boolean",
        required: false,
        description: "Whether admin has approved the account",
        defaultValue: false,
      },
      {
        name: "isProfileComplete",
        type: "boolean",
        required: false,
        description: "Whether all required profile fields are completed",
        defaultValue: false,
      },
      {
        name: "profileCompletionPercent",
        type: "number",
        required: false,
        description: "Percentage of profile completion",
        validation: {
          min: 0,
          max: 100,
        },
        defaultValue: 0,
      },
      {
        name: "faceImage",
        type: "string",
        required: false,
        description:
          "URL or base64 encoded face image for biometric verification",
      },
      {
        name: "profilePhoto",
        type: "string",
        required: false,
        description: "Profile photo URL",
      },
      {
        name: "twoFactorEnabled",
        type: "boolean",
        required: false,
        description: "Whether 2FA is enabled",
        defaultValue: false,
      },
      {
        name: "twoFactorMethod",
        type: "enum",
        required: false,
        description: "2FA method if enabled",
        validation: {
          enum: ["sms", "email", "authenticator_app", "biometric"],
        },
      },
      {
        name: "twoFactorSecret",
        type: "string",
        required: false,
        description: "2FA secret key (encrypted)",
        sensitive: true,
        encrypted: true,
      },
      {
        name: "lastLoginAt",
        type: "date",
        required: false,
        description: "Timestamp of last successful login",
      },
      {
        name: "lastLoginIp",
        type: "string",
        required: false,
        description: "IP address of last login",
      },
      {
        name: "loginAttempts",
        type: "number",
        required: false,
        description: "Number of failed login attempts",
        defaultValue: 0,
      },
      {
        name: "lockedUntil",
        type: "date",
        required: false,
        description: "Account locked until this timestamp",
      },
      {
        name: "passwordResetToken",
        type: "string",
        required: false,
        description: "Password reset token (hashed)",
        sensitive: true,
      },
      {
        name: "passwordResetExpires",
        type: "date",
        required: false,
        description: "Password reset token expiry",
      },
      {
        name: "refreshToken",
        type: "string",
        required: false,
        description: "JWT refresh token (hashed)",
        sensitive: true,
        encrypted: true,
      },
      {
        name: "deviceTokens",
        type: "array",
        required: false,
        description: "Push notification device tokens",
      },
      {
        name: "preferences",
        type: "json",
        required: false,
        description: "User preferences (theme, language, notifications)",
        defaultValue: {
          theme: "system",
          language: "en",
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
      },
      {
        name: "securityQuestions",
        type: "array",
        required: false,
        description: "Security questions and hashed answers",
        sensitive: true,
        encrypted: true,
      },
      {
        name: "acceptedTerms",
        type: "boolean",
        required: false,
        description: "Whether user accepted terms of service",
        defaultValue: false,
      },
      {
        name: "acceptedTermsAt",
        type: "date",
        required: false,
        description: "When terms were accepted",
      },
      {
        name: "acceptedPrivacyPolicy",
        type: "boolean",
        required: false,
        description: "Whether user accepted privacy policy",
        defaultValue: false,
      },
      {
        name: "registrationSource",
        type: "enum",
        required: false,
        description: "How the user registered",
        validation: {
          enum: ["web", "mobile_app", "kiosk", "admin_panel", "bulk_import"],
        },
        defaultValue: "web",
      },
      {
        name: "registrationIp",
        type: "string",
        required: false,
        description: "IP address during registration",
      },
      {
        name: "createdAt",
        type: "date",
        required: true,
        description: "Account creation timestamp",
      },
      {
        name: "updatedAt",
        type: "date",
        required: true,
        description: "Last update timestamp",
      },
      {
        name: "deletedAt",
        type: "date",
        required: false,
        description: "Soft delete timestamp",
      },
    ],
    indexes: [
      { fields: ["userId"], type: "unique" },
      { fields: ["email"], type: "unique" },
      { fields: ["username"], type: "unique", sparse: true },
      { fields: ["nationalID"], type: "unique" },
      { fields: ["citizenshipNumber"], type: "unique", sparse: true },
      { fields: ["voterId"], type: "unique", sparse: true },
      { fields: ["mobile"] },
      { fields: ["role"] },
      { fields: ["accountStatus"] },
      { fields: ["createdAt"] },
      { fields: ["fullName", "email", "nationalID"], type: "text" },
    ],
  },

  // ============================================
  // User Profiles Collection
  // ============================================
  user_profiles: {
    name: "user_profiles",
    description:
      "Extended voter profile with personal, family, and address information",
    version: "2.0.0",
    timestamps: true,
    softDelete: false,
    auditLog: true,
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
      },
      {
        name: "profileId",
        type: "string",
        required: true,
        description: "Unique profile identifier",
        unique: true,
        index: true,
      },
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Reference to users collection",
        relation: {
          collection: "users",
          field: "userId",
          type: "oneToOne",
        },
        index: true,
      },
      {
        name: "fullName",
        type: "string",
        required: true,
        description: "Legal full name",
      },
      {
        name: "fullNameNepali",
        type: "string",
        required: false,
        description: "Name in Nepali script",
      },
      {
        name: "dateOfBirth",
        type: "date",
        required: true,
        description: "Date of birth",
      },
      {
        name: "age",
        type: "number",
        required: false,
        description: "Calculated age",
        validation: {
          min: 18,
          max: 150,
        },
      },
      {
        name: "gender",
        type: "enum",
        required: true,
        description: "Gender identity",
        validation: {
          enum: ["Male", "Female", "Other"],
        },
      },
      {
        name: "maritalStatus",
        type: "enum",
        required: false,
        description: "Marital status",
        validation: {
          enum: ["Single", "Married", "Divorced", "Widowed", "Separated"],
        },
      },
      {
        name: "occupation",
        type: "string",
        required: false,
        description: "Current occupation",
      },
      {
        name: "occupationCategory",
        type: "enum",
        required: false,
        description: "Occupation category",
        validation: {
          enum: [
            "Government",
            "Private",
            "Self-Employed",
            "Agriculture",
            "Student",
            "Unemployed",
            "Retired",
            "Other",
          ],
        },
      },
      {
        name: "educationLevel",
        type: "enum",
        required: false,
        description: "Highest education level",
        validation: {
          enum: [
            "None",
            "Primary",
            "Secondary",
            "Higher Secondary",
            "Bachelor",
            "Master",
            "PhD",
            "Other",
          ],
        },
      },
      {
        name: "educationDetails",
        type: "json",
        required: false,
        description: "Education details (institution, degree, year)",
      },
      {
        name: "bloodGroup",
        type: "enum",
        required: false,
        description: "Blood group",
        validation: {
          enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
        },
      },
      {
        name: "nationality",
        type: "string",
        required: false,
        description: "Nationality",
        defaultValue: "Nepali",
      },
      {
        name: "religion",
        type: "string",
        required: false,
        description: "Religion (optional)",
      },
      {
        name: "ethnicity",
        type: "string",
        required: false,
        description: "Ethnicity (optional)",
      },
      {
        name: "motherTongue",
        type: "string",
        required: false,
        description: "Mother tongue language",
      },
      {
        name: "disabilityStatus",
        type: "json",
        required: false,
        description: "Disability information",
        defaultValue: {
          hasDisability: false,
          disabilityType: null,
          requiresAssistance: false,
        },
      },
      {
        name: "permanentAddress",
        type: "json",
        required: true,
        description: "Permanent residential address",
        example: {
          country: "Nepal",
          province: "Bagmati",
          district: "Kathmandu",
          municipality: "Kathmandu Metropolitan",
          wardNumber: "10",
          tole: "Thamel",
          streetAddress: "123 Main Street",
          postalCode: "44600",
        },
      },
      {
        name: "temporaryAddress",
        type: "json",
        required: false,
        description: "Current/temporary address",
      },
      {
        name: "isTemporarySameAsPermanent",
        type: "boolean",
        required: false,
        description: "Whether temporary address matches permanent",
        defaultValue: false,
      },
      {
        name: "contactInfo",
        type: "json",
        required: false,
        description: "Additional contact information",
        defaultValue: {
          primaryPhone: null,
          secondaryPhone: null,
          email: null,
          website: null,
        },
      },
      {
        name: "emergencyContact",
        type: "json",
        required: false,
        description: "Emergency contact person details",
      },
      {
        name: "familyMembers",
        type: "array",
        required: false,
        description: "Family members information",
      },
      {
        name: "citizenship",
        type: "json",
        required: true,
        description: "Citizenship document information",
        defaultValue: {
          number: null,
          type: null,
          issueDate: null,
          issueDistrict: null,
          issuingAuthority: null,
        },
      },
      {
        name: "nationalId",
        type: "json",
        required: false,
        description: "National ID card information",
      },
      {
        name: "voterId",
        type: "json",
        required: false,
        description: "Voter ID information",
      },
      {
        name: "documents",
        type: "array",
        required: false,
        description: "Uploaded document records",
      },
      {
        name: "profilePhoto",
        type: "string",
        required: false,
        description: "Profile photo URL",
      },
      {
        name: "signatureImage",
        type: "string",
        required: false,
        description: "Digital signature image URL",
      },
      {
        name: "verificationStatus",
        type: "enum",
        required: true,
        description: "Overall verification status",
        validation: {
          enum: ["draft", "pending", "under_review", "verified", "rejected"],
        },
        defaultValue: "draft",
        index: true,
      },
      {
        name: "verificationHistory",
        type: "array",
        required: false,
        description: "Verification step history",
      },
      {
        name: "verificationScore",
        type: "number",
        required: false,
        description: "Overall verification score",
        validation: {
          min: 0,
          max: 100,
        },
        defaultValue: 0,
      },
      {
        name: "completedSteps",
        type: "array",
        required: false,
        description: "Completed registration steps",
      },
      {
        name: "currentStep",
        type: "number",
        required: false,
        description: "Current registration step",
        defaultValue: 1,
      },
      {
        name: "completionPercentage",
        type: "number",
        required: false,
        description: "Profile completion percentage",
        defaultValue: 0,
      },
      {
        name: "electionRegistrations",
        type: "array",
        required: false,
        description: "Registered elections",
      },
      {
        name: "createdAt",
        type: "date",
        required: true,
        description: "Profile creation timestamp",
      },
      {
        name: "updatedAt",
        type: "date",
        required: true,
        description: "Last update timestamp",
      },
    ],
    indexes: [
      { fields: ["profileId"], type: "unique" },
      { fields: ["userId"], type: "unique" },
      { fields: ["citizenship.number"], type: "unique", sparse: true },
      { fields: ["nationalId.number"], type: "unique", sparse: true },
      { fields: ["nidNumber"], type: "unique", sparse: true },
      { fields: ["verificationStatus"] },
      { fields: ["permanentAddress.province", "permanentAddress.district"] },
      { fields: ["fullName", "citizenship.number"], type: "text" },
    ],
  },

  // ============================================
  // Identity Documents Collection
  // ============================================
  identity_documents: {
    name: "identity_documents",
    description: "Identity and citizenship verification documents",
    version: "2.0.0",
    timestamps: true,
    softDelete: false,
    auditLog: true,
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
      },
      {
        name: "documentId",
        type: "string",
        required: true,
        description: "Unique document identifier",
        unique: true,
        index: true,
      },
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Reference to users collection",
        relation: {
          collection: "users",
          field: "userId",
          type: "manyToOne",
        },
        index: true,
      },
      {
        name: "documentType",
        type: "enum",
        required: true,
        description: "Type of identity document",
        validation: {
          enum: [
            "citizenship_front",
            "citizenship_back",
            "nid_front",
            "nid_back",
            "passport",
            "birth_certificate",
            "driver_license",
            "voter_id",
            "signature",
            "photo",
            "other",
          ],
        },
      },
      {
        name: "documentNumber",
        type: "string",
        required: false,
        description: "Document number/serial",
        index: true,
      },
      {
        name: "fileUrl",
        type: "string",
        required: true,
        description: "URL to document image",
      },
      {
        name: "fileName",
        type: "string",
        required: false,
        description: "Original file name",
      },
      {
        name: "fileSize",
        type: "number",
        required: false,
        description: "File size in bytes",
        validation: {
          max: 10485760, // 10MB
        },
      },
      {
        name: "mimeType",
        type: "string",
        required: false,
        description: "File MIME type",
        validation: {
          enum: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        },
      },
      {
        name: "imageHash",
        type: "string",
        required: false,
        description: "SHA-256 hash of image for integrity",
      },
      {
        name: "issueDate",
        type: "date",
        required: false,
        description: "Document issue date",
      },
      {
        name: "expiryDate",
        type: "date",
        required: false,
        description: "Document expiry date",
      },
      {
        name: "issuingAuthority",
        type: "string",
        required: false,
        description: "Issuing authority name",
      },
      {
        name: "issuingDistrict",
        type: "string",
        required: false,
        description: "District where document was issued",
      },
      {
        name: "verificationStatus",
        type: "enum",
        required: true,
        description: "Document verification status",
        validation: {
          enum: ["pending", "verified", "rejected", "expired", "needs_review"],
        },
        defaultValue: "pending",
        index: true,
      },
      {
        name: "verifiedAt",
        type: "date",
        required: false,
        description: "Verification timestamp",
      },
      {
        name: "verifiedBy",
        type: "string",
        required: false,
        description: "Admin/System that verified",
        relation: {
          collection: "users",
          field: "userId",
          type: "manyToOne",
        },
      },
      {
        name: "rejectionReason",
        type: "string",
        required: false,
        description: "Reason for rejection if status is rejected",
      },
      {
        name: "ocrData",
        type: "json",
        required: false,
        description: "Extracted OCR data from document",
      },
      {
        name: "metadata",
        type: "json",
        required: false,
        description: "Additional metadata",
      },
      {
        name: "isActive",
        type: "boolean",
        required: false,
        description: "Whether this document is currently active",
        defaultValue: true,
      },
      {
        name: "createdAt",
        type: "date",
        required: true,
        description: "Upload timestamp",
      },
      {
        name: "updatedAt",
        type: "date",
        required: true,
        description: "Last update timestamp",
      },
    ],
    indexes: [
      { fields: ["documentId"], type: "unique" },
      { fields: ["userId", "documentType"] },
      { fields: ["documentNumber"], type: "unique", sparse: true },
      { fields: ["nidNumber"], type: "unique", sparse: true },
      { fields: ["citizenshipNumber"], type: "unique", sparse: true },
      { fields: ["verificationStatus"] },
      { fields: ["createdAt"] },
    ],
  },

  // ============================================
  // Face Verifications Collection
  // ============================================
  face_verifications: {
    name: "face_verifications",
    description: "Biometric face verification sessions and results",
    version: "2.0.0",
    timestamps: true,
    softDelete: false,
    auditLog: true,
    encryption: {
      enabled: true,
      fields: ["faceTemplate", "faceImage"],
    },
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
      },
      {
        name: "verificationId",
        type: "string",
        required: true,
        description: "Unique verification identifier",
        unique: true,
        index: true,
      },
      {
        name: "sessionId",
        type: "string",
        required: true,
        description: "Verification session identifier",
        index: true,
      },
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Reference to users collection",
        relation: {
          collection: "users",
          field: "userId",
          type: "manyToOne",
        },
        index: true,
      },
      {
        name: "electionId",
        type: "string",
        required: false,
        description: "Associated election if verification was for voting",
        relation: {
          collection: "elections",
          field: "electionId",
          type: "manyToOne",
        },
      },
      {
        name: "faceImage",
        type: "string",
        required: true,
        description: "Captured face image (base64 or URL)",
        sensitive: true,
        encrypted: true,
      },
      {
        name: "faceTemplate",
        type: "array",
        required: true,
        description: "Facial feature vector (128-dimensional)",
        sensitive: true,
        encrypted: true,
      },
      {
        name: "verificationStatus",
        type: "enum",
        required: true,
        description: "Verification result status",
        validation: {
          enum: [
            "pending",
            "in_progress",
            "verified",
            "failed",
            "expired",
            "revoked",
          ],
        },
        defaultValue: "pending",
        index: true,
      },
      {
        name: "verificationResult",
        type: "enum",
        required: false,
        description: "Final verification result",
        validation: {
          enum: ["Passed", "Failed", "Pending", "Inconclusive"],
        },
      },
      {
        name: "matchScore",
        type: "number",
        required: false,
        description: "Face match confidence score",
        validation: {
          min: 0,
          max: 1,
        },
      },
      {
        name: "livenessScore",
        type: "number",
        required: false,
        description: "Liveness detection score",
        validation: {
          min: 0,
          max: 1,
        },
      },
      {
        name: "qualityScore",
        type: "number",
        required: false,
        description: "Image quality score",
        validation: {
          min: 0,
          max: 1,
        },
      },
      {
        name: "failureReason",
        type: "string",
        required: false,
        description: "Reason for verification failure",
      },
      {
        name: "challengeResponse",
        type: "json",
        required: false,
        description: "Anti-spoofing challenge response data",
      },
      {
        name: "deviceInfo",
        type: "json",
        required: false,
        description: "Device information during verification",
      },
      {
        name: "ipAddress",
        type: "string",
        required: true,
        description: "IP address during verification",
      },
      {
        name: "geoLocation",
        type: "geopoint",
        required: false,
        description: "Geolocation during verification",
      },
      {
        name: "verificationDuration",
        type: "number",
        required: false,
        description: "Verification process duration in milliseconds",
      },
      {
        name: "attempts",
        type: "number",
        required: false,
        description: "Number of attempts",
        defaultValue: 1,
      },
      {
        name: "expiresAt",
        type: "date",
        required: true,
        description: "Verification expiry timestamp",
      },
      {
        name: "verifiedAt",
        type: "date",
        required: false,
        description: "Successful verification timestamp",
      },
      {
        name: "createdAt",
        type: "date",
        required: true,
        description: "Record creation timestamp",
      },
    ],
    indexes: [
      { fields: ["verificationId"], type: "unique" },
      { fields: ["sessionId"], type: "unique" },
      { fields: ["userId", "electionId"] },
      { fields: ["verificationStatus"] },
      { fields: ["verifiedAt"] },
      { fields: ["expiresAt"] },
    ],
  },

  // ============================================
  // Elections Collection
  // ============================================
  elections: {
    name: "elections",
    description: "Election definitions with complete lifecycle management",
    version: "2.0.0",
    timestamps: true,
    softDelete: true,
    auditLog: true,
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
      },
      {
        name: "electionId",
        type: "string",
        required: true,
        description: "Unique election identifier",
        unique: true,
        index: true,
      },
      {
        name: "title",
        type: "string",
        required: true,
        description: "Election title/name",
        example: "General Election 2026",
      },
      {
        name: "description",
        type: "string",
        required: true,
        description: "Detailed election description",
      },
      {
        name: "type",
        type: "enum",
        required: true,
        description: "Election type",
        validation: {
          enum: [
            "general",
            "local",
            "provincial",
            "federal",
            "by_election",
            "referendum",
            "student_union",
            "other",
          ],
        },
      },
      {
        name: "status",
        type: "enum",
        required: true,
        description: "Election lifecycle status",
        validation: {
          enum: [
            "draft",
            "scheduled",
            "active",
            "paused",
            "completed",
            "cancelled",
            "archived",
          ],
        },
        defaultValue: "draft",
        index: true,
      },
      {
        name: "securityLevel",
        type: "enum",
        required: false,
        description: "Required security level for voting",
        validation: {
          enum: ["LOW", "STANDARD", "HIGH", "CRITICAL"],
        },
        defaultValue: "STANDARD",
      },
      {
        name: "startDate",
        type: "date",
        required: true,
        description: "Voting start date and time",
      },
      {
        name: "endDate",
        type: "date",
        required: true,
        description: "Voting end date and time",
      },
      {
        name: "registrationDeadline",
        type: "date",
        required: false,
        description: "Candidate registration deadline",
      },
      {
        name: "resultsPublished",
        type: "boolean",
        required: true,
        description: "Whether results have been published",
        defaultValue: false,
      },
      {
        name: "resultsPublishedAt",
        type: "date",
        required: false,
        description: "Results publication timestamp",
      },
      {
        name: "maxVotes",
        type: "number",
        required: false,
        description: "Maximum number of votes expected",
      },
      {
        name: "minVoterAge",
        type: "number",
        required: false,
        description: "Minimum voter age requirement",
        defaultValue: 18,
      },
      {
        name: "eligibilityCriteria",
        type: "json",
        required: false,
        description: "Voter eligibility criteria",
      },
      {
        name: "constituencies",
        type: "array",
        required: false,
        description: "List of constituencies",
      },
      {
        name: "positions",
        type: "array",
        required: false,
        description: "Positions being elected",
      },
      {
        name: "totalVotes",
        type: "number",
        required: false,
        description: "Total votes cast",
        defaultValue: 0,
      },
      {
        name: "createdBy",
        type: "string",
        required: true,
        description: "Admin who created the election",
        relation: {
          collection: "users",
          field: "userId",
          type: "manyToOne",
        },
      },
      {
        name: "createdAt",
        type: "date",
        required: true,
        description: "Creation timestamp",
      },
      {
        name: "updatedAt",
        type: "date",
        required: true,
        description: "Last update timestamp",
      },
    ],
    indexes: [
      { fields: ["electionId"], type: "unique" },
      { fields: ["status"] },
      { fields: ["startDate", "endDate"] },
      { fields: ["type"] },
      { fields: ["title"], type: "text" },
    ],
  },

  // ============================================
  // Candidates Collection
  // ============================================
  candidates: {
    name: "candidates",
    description: "Election candidates with campaign details",
    version: "2.0.0",
    timestamps: true,
    softDelete: true,
    auditLog: true,
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
      },
      {
        name: "candidateId",
        type: "string",
        required: true,
        description: "Unique candidate identifier",
        unique: true,
        index: true,
      },
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Reference to user account",
        relation: {
          collection: "users",
          field: "userId",
          type: "oneToOne",
        },
        index: true,
      },
      {
        name: "electionId",
        type: "string",
        required: true,
        description: "Associated election",
        relation: {
          collection: "elections",
          field: "electionId",
          type: "manyToOne",
        },
        index: true,
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Candidate display name",
      },
      {
        name: "party",
        type: "string",
        required: true,
        description: "Political party name or Independent",
      },
      {
        name: "partyId",
        type: "string",
        required: false,
        description: "Reference to political party",
        relation: {
          collection: "political_parties",
          field: "partyId",
          type: "manyToOne",
        },
      },
      {
        name: "biography",
        type: "string",
        required: false,
        description: "Candidate biography",
      },
      {
        name: "education",
        type: "string",
        required: false,
        description: "Educational background",
      },
      {
        name: "experience",
        type: "string",
        required: false,
        description: "Professional experience",
      },
      {
        name: "photoUrl",
        type: "string",
        required: true,
        description: "Candidate photo URL",
      },
      {
        name: "partyLogoUrl",
        type: "string",
        required: false,
        description: "Party logo URL",
      },
      {
        name: "manifestoText",
        type: "string",
        required: true,
        description: "Campaign manifesto",
      },
      {
        name: "manifestoUrl",
        type: "string",
        required: false,
        description: "Link to full manifesto document",
      },
      {
        name: "contactInfo",
        type: "json",
        required: false,
        description: "Contact information",
      },
      {
        name: "socialLinks",
        type: "json",
        required: false,
        description: "Social media links",
      },
      {
        name: "status",
        type: "enum",
        required: true,
        description: "Candidate status",
        validation: {
          enum: [
            "draft",
            "pending",
            "approved",
            "rejected",
            "withdrawn",
            "disqualified",
          ],
        },
        defaultValue: "draft",
        index: true,
      },
      {
        name: "verificationStatus",
        type: "enum",
        required: false,
        description: "Verification status",
        validation: {
          enum: ["pending", "verified", "rejected"],
        },
        defaultValue: "pending",
      },
      {
        name: "rejectionReason",
        type: "string",
        required: false,
        description: "Reason for rejection",
      },
      {
        name: "voteCount",
        type: "number",
        required: false,
        description: "Number of votes received",
        defaultValue: 0,
      },
      {
        name: "history",
        type: "array",
        required: false,
        description: "Status change history",
      },
      {
        name: "createdAt",
        type: "date",
        required: true,
        description: "Creation timestamp",
      },
      {
        name: "updatedAt",
        type: "date",
        required: true,
        description: "Last update timestamp",
      },
    ],
    indexes: [
      { fields: ["candidateId"], type: "unique" },
      { fields: ["electionId", "userId"], type: "unique" },
      { fields: ["electionId"] },
      { fields: ["party"] },
      { fields: ["status"] },
      { fields: ["name", "party", "manifestoText"], type: "text" },
    ],
  },

  // ============================================
  // Political Parties Collection
  // ============================================
  political_parties: {
    name: "political_parties",
    description: "Registered political parties",
    version: "2.0.0",
    timestamps: true,
    softDelete: false,
    auditLog: true,
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
      },
      {
        name: "partyId",
        type: "string",
        required: true,
        description: "Unique party identifier",
        unique: true,
        index: true,
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Full party name",
      },
      {
        name: "code",
        type: "string",
        required: true,
        description: "Short party code/abbreviation",
        unique: true,
      },
      {
        name: "logoUrl",
        type: "string",
        required: true,
        description: "Party logo image URL",
      },
      {
        name: "symbolUrl",
        type: "string",
        required: false,
        description: "Election symbol image URL",
      },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Party description and ideology",
      },
      {
        name: "leader",
        type: "string",
        required: true,
        description: "Current party leader",
      },
      {
        name: "foundedYear",
        type: "number",
        required: true,
        description: "Year party was founded",
      },
      {
        name: "headquarters",
        type: "string",
        required: true,
        description: "Party headquarters location",
      },
      {
        name: "website",
        type: "string",
        required: false,
        description: "Official website URL",
      },
      {
        name: "contactEmail",
        type: "string",
        required: false,
        description: "Official contact email",
      },
      {
        name: "status",
        type: "enum",
        required: true,
        description: "Party registration status",
        validation: {
          enum: ["active", "inactive", "suspended", "dissolved"],
        },
        defaultValue: "active",
      },
      {
        name: "createdAt",
        type: "date",
        required: true,
        description: "Creation timestamp",
      },
      {
        name: "updatedAt",
        type: "date",
        required: true,
        description: "Last update timestamp",
      },
    ],
    indexes: [
      { fields: ["partyId"], type: "unique" },
      { fields: ["code"], type: "unique" },
      { fields: ["name"] },
      { fields: ["name", "description"], type: "text" },
    ],
  },

  // ============================================
  // Votes Collection
  // ============================================
  votes: {
    name: "votes",
    description: "Anonymous vote records with cryptographic verification",
    version: "2.0.0",
    timestamps: false,
    softDelete: false,
    auditLog: true,
    encryption: {
      enabled: true,
      fields: ["anonymousVoterHash"],
    },
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
      },
      {
        name: "voteId",
        type: "string",
        required: true,
        description: "Unique vote identifier",
        unique: true,
        index: true,
      },
      {
        name: "electionId",
        type: "string",
        required: true,
        description: "Associated election",
        relation: {
          collection: "elections",
          field: "electionId",
          type: "manyToOne",
        },
        index: true,
      },
      {
        name: "candidateId",
        type: "string",
        required: true,
        description: "Selected candidate",
        relation: {
          collection: "candidates",
          field: "candidateId",
          type: "manyToOne",
        },
        index: true,
      },
      {
        name: "anonymousVoterHash",
        type: "string",
        required: true,
        description:
          "One-way hash to prevent double voting while preserving anonymity",
        unique: true,
        sensitive: true,
        encrypted: true,
      },
      {
        name: "ballotHash",
        type: "string",
        required: false,
        description: "Cryptographic hash of the complete ballot",
      },
      {
        name: "blockchainReceipt",
        type: "string",
        required: false,
        description: "Blockchain transaction receipt for audit",
      },
      {
        name: "voteWeight",
        type: "number",
        required: false,
        description: "Weight of vote (default 1)",
        defaultValue: 1,
      },
      {
        name: "deviceInfo",
        type: "json",
        required: false,
        description: "Device information during voting",
      },
      {
        name: "ipAddress",
        type: "string",
        required: false,
        description: "Anonymized IP address",
      },
      {
        name: "geoLocation",
        type: "json",
        required: false,
        description: "Approximate voting location",
      },
      {
        name: "timestamp",
        type: "date",
        required: true,
        description: "Vote cast timestamp",
        index: true,
      },
    ],
    indexes: [
      { fields: ["voteId"], type: "unique" },
      { fields: ["electionId", "anonymousVoterHash"], type: "unique" },
      { fields: ["electionId", "candidateId"] },
      { fields: ["timestamp"] },
    ],
  },

  // ============================================
  // Audit Logs Collection
  // ============================================
  audit_logs: {
    name: "audit_logs",
    description: "Comprehensive security and activity audit trail",
    version: "2.0.0",
    timestamps: true,
    softDelete: false,
    auditLog: false, // No recursive audit logging
    fields: [
      {
        name: "_id",
        type: "objectId",
        required: true,
        description: "MongoDB document identifier",
      },
      {
        name: "logId",
        type: "string",
        required: true,
        description: "Unique log entry identifier",
        unique: true,
        index: true,
      },
      {
        name: "userId",
        type: "string",
        required: false,
        description: "User who performed the action",
        index: true,
      },
      {
        name: "userEmail",
        type: "string",
        required: false,
        description: "User email for quick reference",
      },
      {
        name: "action",
        type: "string",
        required: true,
        description: "Action performed",
        index: true,
      },
      {
        name: "actionCategory",
        type: "enum",
        required: true,
        description: "Category of action",
        validation: {
          enum: [
            "authentication",
            "authorization",
            "profile",
            "verification",
            "voting",
            "election",
            "admin",
            "security",
            "system",
          ],
        },
      },
      {
        name: "severity",
        type: "enum",
        required: true,
        description: "Event severity level",
        validation: {
          enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
        },
        defaultValue: "INFO",
      },
      {
        name: "details",
        type: "string",
        required: false,
        description: "Detailed description of the action",
      },
      {
        name: "metadata",
        type: "json",
        required: false,
        description: "Additional contextual data",
      },
      {
        name: "ipAddress",
        type: "string",
        required: true,
        description: "Client IP address",
      },
      {
        name: "userAgent",
        type: "string",
        required: false,
        description: "Client user agent string",
      },
      {
        name: "deviceFingerprint",
        type: "string",
        required: false,
        description: "Device fingerprint hash",
      },
      {
        name: "geoLocation",
        type: "json",
        required: false,
        description: "Geolocation data",
      },
      {
        name: "sessionId",
        type: "string",
        required: false,
        description: "Session identifier",
      },
      {
        name: "requestId",
        type: "string",
        required: false,
        description: "Request identifier for tracing",
      },
      {
        name: "duration",
        type: "number",
        required: false,
        description: "Action duration in milliseconds",
      },
      {
        name: "beforeState",
        type: "json",
        required: false,
        description: "State before action (for updates)",
      },
      {
        name: "afterState",
        type: "json",
        required: false,
        description: "State after action (for updates)",
      },
      {
        name: "timestamp",
        type: "date",
        required: true,
        description: "Event timestamp",
        index: true,
      },
    ],
    indexes: [
      { fields: ["logId"], type: "unique" },
      { fields: ["userId", "timestamp"] },
      { fields: ["action"] },
      { fields: ["actionCategory"] },
      { fields: ["severity"] },
      { fields: ["timestamp"] },
      { fields: ["ipAddress"] },
      { fields: ["sessionId"] },
    ],
  },

  // Additional collections (abbreviated for brevity)
  // ... OTPS, Notifications, FAQs, Config, etc.
};

// ============================================
// Utility Functions
// ============================================

export const collectionNames = Object.keys(databaseSchema);

export function getCollectionSchema(
  collectionName: string,
): CollectionSchema | undefined {
  return databaseSchema[collectionName];
}

export function getRequiredFields(collectionName: string): FieldDefinition[] {
  const schema = databaseSchema[collectionName];
  return schema ? schema.fields.filter((f) => f.required) : [];
}

export function getIndexes(collectionName: string): IndexDefinition[] {
  const schema = databaseSchema[collectionName];
  return schema ? schema.indexes : [];
}

export function getRelations(collectionName: string): FieldDefinition[] {
  const schema = databaseSchema[collectionName];
  return schema ? schema.fields.filter((f) => f.relation) : [];
}

export function getSensitiveFields(collectionName: string): FieldDefinition[] {
  const schema = databaseSchema[collectionName];
  return schema ? schema.fields.filter((f) => f.sensitive || f.encrypted) : [];
}

export function validateFieldValue(
  collectionName: string,
  fieldName: string,
  value: any,
): { valid: boolean; message?: string } {
  const schema = databaseSchema[collectionName];
  if (!schema) return { valid: false, message: "Collection not found" };

  const field = schema.fields.find((f) => f.name === fieldName);
  if (!field) return { valid: false, message: "Field not found" };

  if (field.required && (value === undefined || value === null)) {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (field.validation) {
    const v = field.validation;
    if (v.min !== undefined && typeof value === "number" && value < v.min) {
      return {
        valid: false,
        message: `${fieldName} must be at least ${v.min}`,
      };
    }
    if (v.max !== undefined && typeof value === "number" && value > v.max) {
      return { valid: false, message: `${fieldName} must be at most ${v.max}` };
    }
    if (
      v.minLength !== undefined &&
      typeof value === "string" &&
      value.length < v.minLength
    ) {
      return {
        valid: false,
        message: `${fieldName} must be at least ${v.minLength} characters`,
      };
    }
    if (
      v.maxLength !== undefined &&
      typeof value === "string" &&
      value.length > v.maxLength
    ) {
      return {
        valid: false,
        message: `${fieldName} must be at most ${v.maxLength} characters`,
      };
    }
    if (
      v.pattern &&
      typeof value === "string" &&
      !new RegExp(v.pattern).test(value)
    ) {
      return { valid: false, message: `${fieldName} format is invalid` };
    }
    if (v.enum && !v.enum.includes(value)) {
      return {
        valid: false,
        message: `${fieldName} must be one of: ${v.enum.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

export function generateMigrationScript(
  fromVersion: string,
  toVersion: string,
): string {
  // Generate migration scripts based on version differences
  return `-- Migration ${fromVersion} -> ${toVersion}\n-- Auto-generated migration script\n`;
}

export default databaseSchema;
