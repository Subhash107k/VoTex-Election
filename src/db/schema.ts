export type FieldType = "string" | "number" | "boolean" | "array" | "object" | "date" | "unknown";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  description: string;
  defaultValue?: string | number | boolean | null;
}

export interface CollectionSchema {
  name: string;
  description: string;
  fields: FieldDefinition[];
  indexes: string[];
}

export const databaseSchema: Record<string, CollectionSchema> = {
  users: {
    name: "users",
    description: "Registered platform users and authentication state",
    fields: [
      { name: "id", type: "string", required: true, description: "Unique user identifier" },
      { name: "fullName", type: "string", required: true, description: "Display name of the user" },
      { name: "username", type: "string", required: false, description: "Optional login username" },
      { name: "nationalID", type: "string", required: true, description: "National identity number" },
      { name: "email", type: "string", required: true, description: "Primary email address" },
      { name: "mobile", type: "string", required: true, description: "Phone number" },
      { name: "address", type: "string", required: false, description: "Residential address" },
      { name: "dob", type: "string", required: false, description: "Date of birth" },
      { name: "gender", type: "string", required: false, description: "User gender" },
      { name: "passwordHash", type: "string", required: true, description: "Hashed password" },
      { name: "faceImage", type: "string", required: false, description: "Base64 face capture or placeholder" },
      { name: "role", type: "string", required: true, description: "User role in the election system" },
      { name: "isVerified", type: "boolean", required: true, description: "Whether the account is verified" },
      { name: "isApproved", type: "boolean", required: false, description: "Whether admin approved the account" },
      { name: "isSuspended", type: "boolean", required: false, description: "Whether the account is suspended" },
      { name: "createdAt", type: "date", required: true, description: "Account creation timestamp" },
      { name: "isProfileComplete", type: "boolean", required: false, description: "Whether onboarding is complete" }
    ],
    indexes: ["id", "email", "nationalID", "role"]
  },

  user_profiles: {
    name: "user_profiles",
    description: "Extended voter profile information",
    fields: [
      { name: "id", type: "string", required: true, description: "Profile identifier" },
      { name: "userId", type: "string", required: true, description: "Associated user identifier" },
      { name: "dob", type: "string", required: false, description: "Date of birth" },
      { name: "gender", type: "string", required: false, description: "Gender" },
      { name: "permanentAddress", type: "string", required: true, description: "Permanent address" },
      { name: "temporaryAddress", type: "string", required: true, description: "Temporary address" },
      { name: "province", type: "string", required: true, description: "Province" },
      { name: "district", type: "string", required: true, description: "District" },
      { name: "municipality", type: "string", required: true, description: "Municipality" },
      { name: "wardNumber", type: "string", required: true, description: "Ward number" },
      { name: "postalCode", type: "string", required: true, description: "Postal code" },
      { name: "occupation", type: "string", required: false, description: "Occupation" },
      { name: "profilePhoto", type: "string", required: false, description: "Profile image URL" },
      { name: "createdAt", type: "date", required: true, description: "Profile creation timestamp" }
    ],
    indexes: ["id", "userId"]
  },

  identity_documents: {
    name: "identity_documents",
    description: "Identity and citizenship document references",
    fields: [
      { name: "id", type: "string", required: true, description: "Document record identifier" },
      { name: "userId", type: "string", required: true, description: "Associated user identifier" },
      { name: "citizenshipFrontImage", type: "string", required: true, description: "Front image of citizenship document" },
      { name: "citizenshipBackImage", type: "string", required: true, description: "Back image of citizenship document" },
      { name: "citizenshipNumber", type: "string", required: true, description: "Citizenship number" },
      { name: "signatureImage", type: "string", required: true, description: "Signature image" },
      { name: "createdAt", type: "date", required: true, description: "Upload timestamp" }
    ],
    indexes: ["id", "userId", "citizenshipNumber"]
  },

  face_verifications: {
    name: "face_verifications",
    description: "Biometric face verification attempts",
    fields: [
      { name: "id", type: "string", required: true, description: "Verification record identifier" },
      { name: "userId", type: "string", required: true, description: "Associated user identifier" },
      { name: "faceImage", type: "string", required: true, description: "Captured face image" },
      { name: "faceTemplate", type: "array", required: true, description: "Facial landmark vector" },
      { name: "verificationStatus", type: "string", required: true, description: "Pending, verified, or rejected" },
      { name: "verificationTimestamp", type: "date", required: true, description: "Verification timestamp" }
    ],
    indexes: ["id", "userId", "verificationStatus"]
  },

  elections: {
    name: "elections",
    description: "Election definitions and lifecycle metadata",
    fields: [
      { name: "id", type: "string", required: true, description: "Election identifier" },
      { name: "title", type: "string", required: true, description: "Election name" },
      { name: "description", type: "string", required: true, description: "Election description" },
      { name: "status", type: "string", required: true, description: "Draft, active, or closed" },
      { name: "type", type: "string", required: true, description: "Election type" },
      { name: "startDate", type: "date", required: true, description: "Start date" },
      { name: "endDate", type: "date", required: true, description: "End date" },
      { name: "resultsPublished", type: "boolean", required: true, description: "Whether results are published" },
      { name: "maxVotes", type: "number", required: true, description: "Maximum expected votes" },
      { name: "createdAt", type: "date", required: true, description: "Creation timestamp" }
    ],
    indexes: ["id", "status", "startDate", "endDate"]
  },

  candidates: {
    name: "candidates",
    description: "Election candidates and their metadata",
    fields: [
      { name: "id", type: "string", required: true, description: "Candidate identifier" },
      { name: "name", type: "string", required: true, description: "Candidate display name" },
      { name: "party", type: "string", required: true, description: "Political party name" },
      { name: "biography", type: "string", required: true, description: "Candidate biography" },
      { name: "education", type: "string", required: true, description: "Educational background" },
      { name: "experience", type: "string", required: true, description: "Experience summary" },
      { name: "photoUrl", type: "string", required: true, description: "Candidate photo URL" },
      { name: "partyLogoUrl", type: "string", required: true, description: "Party logo URL" },
      { name: "manifestoText", type: "string", required: true, description: "Manifesto text" },
      { name: "electionId", type: "string", required: true, description: "Related election identifier" }
    ],
    indexes: ["id", "electionId", "party"]
  },

  political_parties: {
    name: "political_parties",
    description: "Registered political parties",
    fields: [
      { name: "id", type: "string", required: true, description: "Party identifier" },
      { name: "name", type: "string", required: true, description: "Party name" },
      { name: "code", type: "string", required: true, description: "Short party code" },
      { name: "logoUrl", type: "string", required: true, description: "Party logo URL" },
      { name: "description", type: "string", required: true, description: "Party description" },
      { name: "leader", type: "string", required: true, description: "Party leader" },
      { name: "foundedYear", type: "string", required: true, description: "Founding year" },
      { name: "headquarters", type: "string", required: true, description: "Headquarters location" }
    ],
    indexes: ["id", "code", "name"]
  },

  votes: {
    name: "votes",
    description: "Anonymous vote cast records",
    fields: [
      { name: "id", type: "string", required: true, description: "Vote record identifier" },
      { name: "electionId", type: "string", required: true, description: "Associated election identifier" },
      { name: "candidateId", type: "string", required: true, description: "Selected candidate identifier" },
      { name: "anonymousVoterHash", type: "string", required: true, description: "Hash used to preserve voter anonymity" },
      { name: "deviceInfo", type: "string", required: true, description: "Browser or device used" },
      { name: "timestamp", type: "date", required: true, description: "Vote timestamp" }
    ],
    indexes: ["id", "electionId", "candidateId"]
  },

  audit_logs: {
    name: "audit_logs",
    description: "Security and administration activity log",
    fields: [
      { name: "id", type: "string", required: true, description: "Audit entry identifier" },
      { name: "userId", type: "string", required: true, description: "User responsible for the action" },
      { name: "userEmail", type: "string", required: true, description: "User email for traceability" },
      { name: "action", type: "string", required: true, description: "Action performed" },
      { name: "ipAddress", type: "string", required: true, description: "Client IP Address" },
      { name: "timestamp", type: "date", required: true, description: "Log timestamp" },
      { name: "device", type: "string", required: true, description: "Client device" },
      { name: "browser", type: "string", required: true, description: "Client browser" }
    ],
    indexes: ["id", "userId", "timestamp"]
  },

  otps: {
    name: "otps",
    description: "One-time password records for registration and verification",
    fields: [
      { name: "id", type: "string", required: true, description: "OTP record identifier" },
      { name: "mobile", type: "string", required: true, description: "Mobile number" },
      { name: "email", type: "string", required: true, description: "Email address" },
      { name: "code", type: "string", required: true, description: "OTP code" },
      { name: "expiresAt", type: "date", required: true, description: "Expiry timestamp" },
      { name: "isUsed", type: "boolean", required: true, description: "Whether the OTP has been used" },
      { name: "purpose", type: "string", required: true, description: "OTP purpose" }
    ],
    indexes: ["id", "email", "mobile", "expiresAt"]
  },

  notifications: {
    name: "notifications",
    description: "System alerts and user-facing notifications",
    fields: [
      { name: "id", type: "string", required: true, description: "Notification identifier" },
      { name: "userId", type: "string", required: false, description: "Target user identifier" },
      { name: "title", type: "string", required: true, description: "Notification title" },
      { name: "message", type: "string", required: true, description: "Notification body" },
      { name: "type", type: "string", required: true, description: "Notification type" },
      { name: "timestamp", type: "date", required: true, description: "Notification timestamp" }
    ],
    indexes: ["id", "userId", "timestamp"]
  },

  faqs: {
    name: "faqs",
    description: "Frequently asked questions content",
    fields: [
      { name: "id", type: "string", required: true, description: "FAQ identifier" },
      { name: "question", type: "string", required: true, description: "FAQ question" },
      { name: "answer", type: "string", required: true, description: "FAQ answer" },
      { name: "category", type: "string", required: true, description: "FAQ category" },
      { name: "displayOrder", type: "number", required: true, description: "Ordering in the UI" },
      { name: "status", type: "string", required: true, description: "Published or draft" }
    ],
    indexes: ["id", "category", "displayOrder"]
  },

  profile_drafts: {
    name: "profile_drafts",
    description: "Incomplete user profile drafts",
    fields: [
      { name: "id", type: "string", required: true, description: "Draft identifier" },
      { name: "userId", type: "string", required: true, description: "Associated user identifier" },
      { name: "draft_status", type: "string", required: true, description: "Draft or complete" },
      { name: "current_step", type: "number", required: true, description: "Current onboarding step" },
      { name: "last_saved_at", type: "date", required: true, description: "Last save timestamp" },
      { name: "verification_status", type: "string", required: true, description: "Verification status" },
      { name: "citizenship_verified", type: "boolean", required: true, description: "Citizenship verification flag" },
      { name: "national_id_verified", type: "boolean", required: true, description: "National ID verification flag" },
      { name: "mismatch_count", type: "number", required: true, description: "Number of verification mismatches" },
      { name: "corrected_fields", type: "string", required: true, description: "Serialized corrected field list" },
      { name: "verification_logs", type: "array", required: true, description: "Verification log list" },
      { name: "updated_at", type: "date", required: true, description: "Last update timestamp" },
      { name: "created_at", type: "date", required: true, description: "Creation timestamp" },
      { name: "formData", type: "string", required: true, description: "Serialized form state" }
    ],
    indexes: ["id", "userId", "draft_status"]
  },

  config: {
    name: "config",
    description: "System configuration values",
    fields: [
      { name: "smtpHost", type: "string", required: true, description: "SMTP host" },
      { name: "smtpPort", type: "number", required: true, description: "SMTP port" },
      { name: "smtpUser", type: "string", required: true, description: "SMTP username" },
      { name: "smtpPass", type: "string", required: true, description: "SMTP password" },
      { name: "twilioSid", type: "string", required: true, description: "Twilio account SID" },
      { name: "twilioToken", type: "string", required: true, description: "Twilio auth token" },
      { name: "twilioFrom", type: "string", required: true, description: "Twilio sender number" }
    ],
    indexes: ["smtpHost", "twilioSid"]
  }
};

export const collectionNames = Object.keys(databaseSchema);

export function getCollectionSchema(collectionName: string): CollectionSchema | undefined {
  return databaseSchema[collectionName];
}
