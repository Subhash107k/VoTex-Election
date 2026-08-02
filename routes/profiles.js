import mongoose from 'mongoose';

// Address Sub-Schema for reusability
const addressSchema = new mongoose.Schema({
  country: {
    type: String,
    default: 'Nepal',
    trim: true
  },
  province: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  municipality: {
    type: String,
    trim: true
  },
  wardNumber: {
    type: String,
    trim: true
  },
  tole: {
    type: String,
    trim: true
  },
  streetAddress: {
    type: String,
    trim: true
  },
  houseNumber: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  landmark: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  }
}, { _id: false });

// Family Member Sub-Schema
const familyMemberSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  fullNameNepali: {
    type: String,
    trim: true
  },
  relationship: {
    type: String,
    enum: ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Grandfather', 
           'Grandmother', 'Brother', 'Sister', 'Guardian', 'Other'],
    required: true
  },
  citizenshipNumber: {
    type: String,
    trim: true
  },
  dateOfBirth: Date,
  occupation: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  isEmergencyContact: {
    type: Boolean,
    default: false
  },
  isAlive: {
    type: Boolean,
    default: true
  },
  address: addressSchema,
  photo: String,
  notes: String
}, { _id: true });

// Document Sub-Schema
const documentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    enum: ['citizenship_front', 'citizenship_back', 'nid_front', 'nid_back', 
           'passport', 'birth_certificate', 'signature', 'photo', 'other'],
    required: true
  },
  documentNumber: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number, // in bytes
    min: 0
  },
  mimeType: {
    type: String,
    trim: true
  },
  issueDate: Date,
  expiryDate: Date,
  issuingAuthority: {
    type: String,
    trim: true
  },
  issuingDistrict: {
    type: String,
    trim: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Biometric Sub-Schema
const biometricSchema = new mongoose.Schema({
  face: {
    template: [Number],
    image: String,
    matchScore: Number,
    verifiedAt: Date,
    livenessScore: Number,
    verificationMethod: {
      type: String,
      enum: ['auto', 'manual', 'ai_assisted']
    }
  },
  fingerprint: {
    leftThumb: {
      template: [Number],
      image: String,
      qualityScore: Number
    },
    rightThumb: {
      template: [Number],
      image: String,
      qualityScore: Number
    },
    matchScore: Number,
    verifiedAt: Date,
    duplicateCheck: {
      isDuplicate: Boolean,
      matchedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      similarityScore: Number
    }
  },
  signature: {
    image: String,
    template: [Number],
    verifiedAt: Date
  },
  iris: {
    leftTemplate: [Number],
    rightTemplate: [Number],
    verifiedAt: Date
  }
}, { _id: false });

// Verification History Sub-Schema
const verificationHistorySchema = new mongoose.Schema({
  step: {
    type: String,
    enum: ['email', 'phone', 'face', 'fingerprint', 'document', 'address', 
           'family', 'education', 'occupation', 'admin_approval'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  method: {
    type: String,
    enum: ['auto', 'manual', 'ai_assisted', 'otp', 'biometric', 'document_scan']
  },
  notes: String,
  evidence: [String], // URLs to evidence files
  ipAddress: String,
  userAgent: String,
  geoLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  }
}, { _id: true, timestamps: true });

// Election Registration Sub-Schema
const electionRegistrationSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  electionName: String,
  electionDate: Date,
  constituency: {
    type: String,
    trim: true
  },
  pollingStation: {
    type: String,
    trim: true
  },
  voterId: {
    type: String,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'voted', 'abstained', 'rejected'],
    default: 'registered'
  },
  votedAt: Date,
  votingMethod: {
    type: String,
    enum: ['in_person', 'online', 'postal', 'proxy']
  },
  voteReceiptHash: String // Blockchain receipt hash
}, { _id: true });

// Main Profile Schema
const profileSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Basic Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  fullNameNepali: {
    type: String,
    trim: true,
    maxlength: 100
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/undefined
        const age = Math.floor((Date.now() - v.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 18;
      },
      message: 'Must be at least 18 years old to register'
    }
  },
  age: {
    type: Number,
    min: 18,
    max: 150
  },
  gender: {
    type: String,
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: '{VALUE} is not a valid gender'
    }
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated']
  },
  educationLevel: {
    type: String,
    enum: ['None', 'Primary', 'Secondary', 'Higher Secondary', 
           'Bachelor', 'Master', 'PhD', 'Other']
  },
  educationDetails: {
    institution: String,
    degree: String,
    graduationYear: Number,
    major: String
  },
  occupation: {
    type: String,
    trim: true,
    maxlength: 100
  },
  occupationCategory: {
    type: String,
    enum: ['Government', 'Private', 'Self-Employed', 'Agriculture', 
           'Student', 'Unemployed', 'Retired', 'Other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
  },
  nationality: {
    type: String,
    default: 'Nepali',
    trim: true
  },
  religion: {
    type: String,
    trim: true
  },
  ethnicity: {
    type: String,
    trim: true
  },
  motherTongue: {
    type: String,
    trim: true
  },
  disabilityStatus: {
    hasDisability: {
      type: Boolean,
      default: false
    },
    disabilityType: {
      type: String,
      enum: ['Physical', 'Visual', 'Hearing', 'Speech', 'Mental', 'Multiple', 'Other']
    },
    disabilityCertificateNumber: String,
    requiresAssistance: {
      type: Boolean,
      default: false
    }
  },

  // Contact Information
  contactInfo: {
    primaryPhone: {
      type: String,
      trim: true,
      match: [/^(\+977[- ]?)?\d{10}$/, 'Please enter a valid Nepali phone number']
    },
    secondaryPhone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    website: {
      type: String,
      trim: true
    },
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String
    }
  },

  // Addresses
  permanentAddress: {
    type: addressSchema,
    required: true
  },
  temporaryAddress: {
    type: addressSchema
  },
  isTemporarySameAsPermanent: {
    type: Boolean,
    default: false
  },

  // Family Information
  familyMembers: [familyMemberSchema],
  
  // Emergency Contact
  emergencyContact: {
    fullName: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: addressSchema
  },

  // Citizenship Information
  citizenship: {
    number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[\d-]+$/.test(v);
        },
        message: 'Citizenship number can only contain numbers and hyphens'
      }
    },
    type: {
      type: String,
      enum: ['By Descent', 'By Birth', 'Naturalized', 'Honorary', 'Non-Resident']
    },
    issueDate: Date,
    issueDistrict: {
      type: String,
      trim: true
    },
    issuingAuthority: {
      type: String,
      trim: true
    },
    calendarType: {
      type: String,
      enum: ['AD', 'BS'],
      default: 'AD'
    },
    bsIssueDate: String // For Nepali calendar dates
  },

  // National ID (NID)
  nationalId: {
    number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    issueDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Expired', 'Rejected', 'Suspended'],
      default: 'Active'
    }
  },

  // Voter ID
  voterId: {
    number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    issueDate: Date,
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Revoked'],
      default: 'Active'
    }
  },

  // Documents
  documents: [documentSchema],

  // Biometric Data
  biometric: biometricSchema,

  // Profile Photo
  profilePhoto: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v) || /^data:image\/.+/.test(v);
      },
      message: 'Invalid image URL or data URI'
    }
  },

  // Election Registrations
  electionRegistrations: [electionRegistrationSchema],

  // Verification & Audit
  verificationStatus: {
    type: String,
    enum: ['draft', 'pending', 'under_review', 'verified', 'rejected', 'suspended'],
    default: 'draft',
    index: true
  },
  verificationHistory: [verificationHistorySchema],
  verificationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  rejectionReason: String,
  rejectionDetails: {
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    reason: String,
    appealStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    }
  },

  // Profile Completion
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completedSteps: [{
    step: {
      type: String,
      enum: ['personal_info', 'contact', 'address', 'family', 'documents', 
             'biometric', 'citizenship', 'review', 'submission']
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },

  // Account Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'suspended', 'deleted', 'blocked'],
    default: 'draft',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Device & Security
  registeredDevice: {
    deviceId: String,
    deviceName: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'other']
    },
    operatingSystem: String,
    browser: String,
    ipAddress: String,
    lastLoginAt: Date
  },
  securityQuestions: [{
    question: String,
    answerHash: String // Store hashed answers
  }],
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorMethod: {
    type: String,
    enum: ['sms', 'email', 'authenticator_app', 'biometric']
  },

  // Terms & Agreements
  agreements: {
    termsAccepted: {
      type: Boolean,
      default: false
    },
    termsAcceptedAt: Date,
    privacyPolicyAccepted: {
      type: Boolean,
      default: false
    },
    privacyPolicyAcceptedAt: Date,
    biometricConsent: {
      type: Boolean,
      default: false
    },
    biometricConsentAt: Date
  },

  // Metadata
  registrationSource: {
    type: String,
    enum: ['web', 'mobile_app', 'kiosk', 'admin_panel', 'api', 'bulk_import'],
    default: 'web'
  },
  registrationIp: String,
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['admin_note', 'verification_note', 'general']
    }
  }],

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: Date,
  verifiedAt: Date,
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
profileSchema.index({ 'citizenship.number': 1 }, { unique: true, sparse: true });
profileSchema.index({ 'nationalId.number': 1 }, { unique: true, sparse: true });
profileSchema.index({ 'voterId.number': 1 }, { unique: true, sparse: true });
profileSchema.index({ 'username': 1 }, { unique: true, sparse: true });
profileSchema.index({ verificationStatus: 1, status: 1 });
profileSchema.index({ 'permanentAddress.province': 1, 'permanentAddress.district': 1 });
profileSchema.index({ 'contactInfo.email': 1 });
profileSchema.index({ 'contactInfo.primaryPhone': 1 });
profileSchema.index({ createdAt: -1 });
profileSchema.index({ updatedAt: -1 });

// Text index for search
profileSchema.index({
  fullName: 'text',
  fullNameNepali: 'text',
  'citizenship.number': 'text',
  'nationalId.number': 'text'
});

// Virtual for full address
profileSchema.virtual('permanentAddress.full').get(function() {
  if (!this.permanentAddress) return '';
  const addr = this.permanentAddress;
  return [
    addr.houseNumber,
    addr.streetAddress,
    addr.tole,
    addr.wardNumber && `Ward ${addr.wardNumber}`,
    addr.municipality,
    addr.district,
    addr.province,
    addr.country,
    addr.postalCode && `Postal: ${addr.postalCode}`
  ].filter(Boolean).join(', ');
});

// Virtual for age
profileSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - this.dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
    age--;
  }
  return age;
});

// Virtual for verification progress
profileSchema.virtual('verificationProgress').get(function() {
  if (!this.verificationHistory || this.verificationHistory.length === 0) return 0;
  const verified = this.verificationHistory.filter(h => h.status === 'verified').length;
  return Math.round((verified / this.verificationHistory.length) * 100);
});

// Pre-save middleware
profileSchema.pre('save', function(next) {
  // Update timestamps
  this.updatedAt = new Date();
  
  // Calculate age from dateOfBirth
  if (this.dateOfBirth && this.isModified('dateOfBirth')) {
    const today = new Date();
    let age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
      age--;
    }
    this.age = age;
  }

  // Calculate completion percentage
  const fields = [
    this.fullName,
    this.gender,
    this.dateOfBirth,
    this.occupation,
    this.permanentAddress?.province,
    this.permanentAddress?.district,
    this.contactInfo?.primaryPhone,
    this.contactInfo?.email,
    this.citizenship?.number,
    this.nationalId?.number,
    this.profilePhoto,
    this.biometric?.face?.image,
  ];
  const completed = fields.filter(Boolean).length;
  this.completionPercentage = Math.round((completed / fields.length) * 100);

  // Set verification score
  if (this.verificationHistory && this.verificationHistory.length > 0) {
    const verified = this.verificationHistory.filter(h => h.status === 'verified').length;
    this.verificationScore = Math.round((verified / this.verificationHistory.length) * 100);
  }

  next();
});

// Pre-find middleware for soft delete
profileSchema.pre(/^find/, function(next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// Instance methods
profileSchema.methods.isComplete = function() {
  return this.completionPercentage >= 80;
};

profileSchema.methods.isVerified = function() {
  return this.verificationStatus === 'verified';
};

profileSchema.methods.softDelete = async function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

profileSchema.methods.addVerificationStep = async function(stepData) {
  this.verificationHistory.push(stepData);
  return this.save();
};

profileSchema.methods.updateActivity = async function() {
  this.lastActivityAt = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static methods
profileSchema.statics.findByCitizenshipNumber = function(number) {
  return this.findOne({ 'citizenship.number': number, isDeleted: false });
};

profileSchema.statics.findByNationalId = function(number) {
  return this.findOne({ 'nationalId.number': number, isDeleted: false });
};

profileSchema.statics.findByVoterId = function(number) {
  return this.findOne({ 'voterId.number': number, isDeleted: false });
};

profileSchema.statics.findPendingVerifications = function() {
  return this.find({ 
    verificationStatus: { $in: ['pending', 'under_review'] },
    isDeleted: false 
  }).sort({ submittedAt: 1 });
};

profileSchema.statics.getStats = async function() {
  return this.aggregate([
    { $match: { isDeleted: false } },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      verified: { 
        $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
      },
      pending: { 
        $sum: { $cond: [{ $in: ['$verificationStatus', ['pending', 'under_review']] }, 1, 0] }
      },
      rejected: { 
        $sum: { $cond: [{ $eq: ['$verificationStatus', 'rejected'] }, 1, 0] }
      },
      avgCompletion: { $avg: '$completionPercentage' }
    }}
  ]);
};

export default mongoose.model('Profile', profileSchema);