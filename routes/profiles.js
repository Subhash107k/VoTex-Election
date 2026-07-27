const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Personal Information
  fullName: String,
  fullNameNepali: String,
  dob: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  occupation: String,
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed']
  },
  educationStatus: String,
  bloodGroup: String,
  nationality: {
    type: String,
    default: 'Nepali'
  },

  // Family Information
  fatherName: String,
  fatherNameNepali: String,
  motherName: String,
  motherNameNepali: String,
  grandfatherName: String,
  grandfatherNameNepali: String,
  spouseName: String,
  spouseNameNepali: String,
  spouseFatherName: String,
  spouseFatherNameNepali: String,
  spouseMotherName: String,
  spouseMotherNameNepali: String,

  // Permanent Address
  permCountry: {
    type: String,
    required: true,
    default: 'Nepal'
  },
  permProvince: String,
  permDistrict: String,
  permMunicipality: String,
  permWardNumber: String,
  permTole: String,
  permStreetAddress: String,
  permPostalCode: String,

  // Temporary Address
  tempCountry: {
    type: String,
    default: 'Nepal'
  },
  tempProvince: String,
  tempDistrict: String,
  tempMunicipality: String,
  tempWardNumber: String,
  tempTole: String,
  tempStreetAddress: String,
  tempPostalCode: String,
  isTemporarySameAsPermanent: {
    type: Boolean,
    default: false
  },

  // Citizenship Information
  citizenshipNumber: {
    type: String,
    required: true,
    unique: true
  },
  citizenshipType: {
    type: String,
    enum: ['By Descent', 'By Birth', 'Naturalized', 'Honorary']
  },
  citizenshipIssueDate: Date,
  citizenshipIssueDistrict: String,
  citizenshipIssueAuthority: String,

  // National ID (NID)
  nidNumber: String,
  nidIssueDate: Date,
  nidStatus: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected'],
    default: 'Approved'
  },

  // Document Images (stored as base64 in production, use cloud storage like AWS S3)
  profilePhoto: String,
  citizenshipFrontImage: String,
  citizenshipBackImage: String,
  nidFrontImage: String,
  nidBackImage: String,
  signatureImage: String,
  fingerprintImage: String,
  faceImage: String,

  // Biometric Data
  faceTemplate: [Number],
  
  // Metadata
  deviceInformation: String,
  status: {
    type: String,
    enum: ['draft', 'pending', 'completed', 'rejected'],
    default: 'draft'
  },
  completedSteps: [Number],
  currentStep: {
    type: Number,
    default: 1
  },
  submittedAt: Date,
  verifiedAt: Date,
  
  // Audit Trail
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
profileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Profile', profileSchema);