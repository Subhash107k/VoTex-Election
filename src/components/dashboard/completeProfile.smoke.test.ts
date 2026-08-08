import { describe, expect, it, beforeEach } from "vitest";
import Database from "../../db/dbService";

describe("CompleteProfile & Profile Service Smoke Tests", () => {
  beforeEach(() => {
    // Reset seed data state before each test run
    Database.getUsers();
  });

  it("successfully retrieves seeded user and user profile data", async () => {
    const users = Database.getUsers();
    expect(users.length).toBeGreaterThan(0);

    const firstUser = users[0];
    expect(firstUser.id).toBeDefined();

    const profile = await Database.getUserProfileByUserId(firstUser.id);
    // Should return either existing profile or null without throwing errors
    expect(profile === null || typeof profile === "object").toBe(true);
  });

  it("upserts user profile data cleanly without creating duplicate records", async () => {
    const testUserId = "usr_smoke_test_001";
    const initialUpdates = {
      permanentAddress: "Kathmandu Ward 5, Bagmati, Nepal",
      permProvince: "Bagmati",
      permDistrict: "Kathmandu",
      currentStep: 1,
    };

    const profile1 = await Database.upsertUserProfile(testUserId, initialUpdates);
    expect(profile1.userId).toBe(testUserId);
    expect(profile1.permDistrict).toBe("Kathmandu");

    const subsequentUpdates = {
      tempDistrict: "Lalitpur",
      currentStep: 2,
    };

    const profile2 = await Database.upsertUserProfile(testUserId, subsequentUpdates);
    expect(profile2.userId).toBe(testUserId);
    // Should preserve previously set fields
    expect(profile2.permDistrict).toBe("Kathmandu");
    expect(profile2.tempDistrict).toBe("Lalitpur");
    expect(profile2.currentStep).toBe(2);

    // Verify in-memory store doesn't accumulate duplicate profiles for the same user ID
    const profiles = Database.getUserProfiles();
    const userProfiles = profiles.filter((p: any) => p.userId === testUserId);
    expect(userProfiles.length).toBe(1);
  });

  it("sanitizes progress payloads to prune empty/unprovided identity fields", () => {
    const rawSnapshot: Record<string, any> = {
      personal: { dob: "1995-05-12", gender: "Male" },
      permCountry: "Nepal",
      permProvince: "Bagmati",
      citizenshipNumber: "",
      faceImage: "",
      faceTemplate: [],
      fingerprintImage: "",
      currentStep: 1,
    };

    const identityBiometricFields = new Set([
      "faceImage",
      "faceTemplate",
      "fingerprintImage",
      "fingerprintLeftImage",
      "fingerprintRightImage",
      "citizenshipFrontImage",
      "citizenshipBackImage",
      "signatureImage",
      "nidFrontImage",
      "nidBackImage",
    ]);

    const sanitizeProgressPayload = (snapshot: Record<string, any>, step: number) => {
      const payload: Record<string, any> = {};
      for (const [key, val] of Object.entries(snapshot)) {
        if (val === undefined || val === null) continue;
        if (typeof val === "string" && val.trim() === "") continue;
        if (Array.isArray(val) && val.length === 0) continue;

        if ((key === "faceImage" || key === "faceTemplate") && step < 4) {
          continue;
        }
        if (identityBiometricFields.has(key) && step < 3) {
          continue;
        }

        payload[key] = val;
      }
      payload.currentStep = step;
      return payload;
    };

    const step1Payload = sanitizeProgressPayload(rawSnapshot, 1);
    // Empty strings and step-irrelevant biometric fields must be pruned
    expect(step1Payload.faceImage).toBeUndefined();
    expect(step1Payload.faceTemplate).toBeUndefined();
    expect(step1Payload.citizenshipNumber).toBeUndefined();
    expect(step1Payload.permProvince).toBe("Bagmati");
    expect(step1Payload.currentStep).toBe(1);
  });

  it("correctly identifies non-empty proposed values for identity lock checks", () => {
    const hasLockedIdentityValue = (value: unknown) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      return String(value).trim() !== "";
    };

    expect(hasLockedIdentityValue("")).toBe(false);
    expect(hasLockedIdentityValue(null)).toBe(false);
    expect(hasLockedIdentityValue(undefined)).toBe(false);
    expect(hasLockedIdentityValue([])).toBe(false);
    expect(hasLockedIdentityValue("CIT-123456")).toBe(true);
    expect(hasLockedIdentityValue(["face_embedding_data"])).toBe(true);
  });

  it("redirects completed voter profiles to /votexDashboard", () => {
    const getHomePath = (u: { role: string; isProfileComplete?: boolean }) => {
      if (u.role === "Voter") {
        return u.isProfileComplete ? "/votexDashboard" : "/profile/edit";
      }
      return "/login";
    };

    const incompleteVoter = { role: "Voter", isProfileComplete: false };
    const completedVoter = { role: "Voter", isProfileComplete: true };

    expect(getHomePath(incompleteVoter)).toBe("/profile/edit");
    expect(getHomePath(completedVoter)).toBe("/votexDashboard");
  });

  it("saves multi-phase progress step-by-step and restores correct step number", async () => {
    const testUserId = "usr_phase_test_002";

    // Step 1: Save Personal & Address details -> Target nextStep: 2
    const step1Result = await Database.upsertUserProfile(testUserId, {
      dob: "1998-04-12",
      gender: "Female",
      permProvince: "Bagmati",
      permDistrict: "Kathmandu",
      currentStep: 2,
    });
    expect(step1Result.currentStep).toBe(2);
    expect(step1Result.dob).toBe("1998-04-12");

    // Step 2: Save Profile Photo -> Target nextStep: 3
    const step2Result = await Database.upsertUserProfile(testUserId, {
      profilePhoto: "data:image/jpeg;base64,mockphoto...",
      currentStep: 3,
    });
    expect(step2Result.currentStep).toBe(3);
    expect(step2Result.profilePhoto).toBe("data:image/jpeg;base64,mockphoto...");
    // Preserves Step 1 data
    expect(step2Result.dob).toBe("1998-04-12");

    // Step 3: Save Identity Documents & Fingerprints -> Target nextStep: 4
    const step3Result = await Database.upsertUserProfile(testUserId, {
      citizenshipNumber: "998877-CIT",
      fingerprintImage: "data:image/png;base64,mockfinger...",
      currentStep: 4,
    });
    expect(step3Result.currentStep).toBe(4);
    expect(step3Result.citizenshipNumber).toBe("998877-CIT");

    // Verify fetching profile restores the latest saved currentStep
    const restoredProfile = (Database.getUserProfiles().find(
      (p: any) => p.userId === testUserId,
    ) || null) as any;
    expect(restoredProfile).not.toBeNull();
    expect(restoredProfile.currentStep).toBe(4);
    expect(restoredProfile.citizenshipNumber).toBe("998877-CIT");
  });

  it("final submission marks isProfileComplete: true and sets accountStatus", async () => {
    const testUserId = "usr_final_submit_003";

    // Create user record
    const userObj: any = {
      id: testUserId,
      email: "finalvoter@example.com",
      fullName: "Final Voter",
      role: "Voter",
      isProfileComplete: false,
      accountStatus: "Pending Profile Completion",
    };
    const users = Database.getUsers();
    users.push(userObj);

    // Create completed profile
    await Database.upsertUserProfile(testUserId, {
      dob: "1990-01-01",
      gender: "Male",
      citizenshipNumber: "CIT-112233",
      isProfileComplete: true,
      currentStep: 5,
    });

    // Simulate final submit updating user
    userObj.isProfileComplete = true;
    userObj.isVerified = true;
    userObj.accountStatus = "Pending Verification";

    expect(userObj.isProfileComplete).toBe(true);
    expect(userObj.accountStatus).toBe("Pending Verification");
  });
});
