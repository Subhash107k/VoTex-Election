export interface User {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  role: "Administrator" | "Election Officer" | "Voter" | "Super Administrator" | "Moderator" | "FAQ Manager" | "Verification Officer" | "Support Staff" | "Candidate";
  nationalID: string;
  mobile: string;
  dob?: string;
  gender?: string;
  occupation?: string;
  address?: string;
  isVerified: boolean;
  isApproved?: boolean;
  isSuspended?: boolean;
  isProfileComplete?: boolean;
  accountStatus?: "Pending" | "Active" | "Rejected" | "Approved" | "Pending Verification" | "Changes Requested" | "Pending Onboarding";
  rejectionReason?: string;
  requestedChangesFields?: string[];
  verificationReport?: any;
  faceImage?: string;
  faceTemplate?: number[];
  auditLogs?: string[];
  profilePicture?: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: number;
}

export interface UserPreferences {
  language: "en" | "ne";
  nepaliTypingEnabled: boolean;
  theme: "light" | "dark";
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  status: "Published" | "Draft";
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
  electionId: string;
  status?: "Pending" | "Verified" | "Approved" | "Rejected" | "Withdrawn";
  rejectionReason?: string;
  userId?: string;
  updatedAt?: string;
  verifiedAt?: string;
  history?: { status: string; timestamp: string; note: string; actor: string }[];
}

export interface Election {
  id: string;
  title: string;
  description: string;
  status: "Draft" | "Active" | "Closed" | "Published";
  type: "General Election" | "Provincial Election" | "Local Election" | "By-Election";
  startDate: string;
  endDate: string;
  resultsPublished: boolean;
  maxVotes: number;
  eligibilityDept?: string;
  createdAt?: string;
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

export interface VoteStatus {
  electionId: string;
  voted: boolean;
  eligible: boolean;
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

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  timestamp: string;
}

export interface DispatchLog {
  id: string;
  type: "Email" | "SMS";
  to: string;
  title: string;
  body: string;
  timestamp: string;
}

export interface DashboardStats {
  metrics: {
    registeredVoters: number;
    verifiedVoters: number;
    totalCandidates: number;
    totalVotes: number;
    turnoutPercent: number;
  };
  candidateVotes: Array<{
    id: string;
    name: string;
    party: string;
    electionTitle: string;
    votesCount: number;
  }>;
  genderBreakdown: {
    Male: number;
    Female: number;
    Other: number;
  };
  ageIntervals: {
    "18-24": number;
    "25-34": number;
    "35-50": number;
    "50+": number;
  };
  recentLogs: AuditLog[];
}
