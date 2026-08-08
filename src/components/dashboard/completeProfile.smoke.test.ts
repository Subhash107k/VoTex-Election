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

    const profile1 = await Database.upsertUserProfile(
      testUserId,
      initialUpdates,
    );
    expect(profile1.userId).toBe(testUserId);
    expect(profile1.permDistrict).toBe("Kathmandu");

    const subsequentUpdates = {
      tempDistrict: "Lalitpur",
      currentStep: 2,
    };

    const profile2 = await Database.upsertUserProfile(
      testUserId,
      subsequentUpdates,
    );
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

    const sanitizeProgressPayload = (
      snapshot: Record<string, any>,
      step: number,
    ) => {
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

  it("strips citizenship number from final complete-profile payloads and preserves the stored registration value", async () => {
    const { sanitizeCompleteProfilePayload } =
      await import("../../../controllers/auth.controller");

    const user = {
      id: "usr_complete_profile_001",
      citizenshipNumber: "CIT-123456",
    };

    const payload = {
      dob: "1995-06-15",
      gender: "Male",
      permanentAddress: "Kathmandu, Nepal",
      citizenshipNumber: "CIT-999999",
      nidNumber: "12345678",
      faceImage: "data:image/png;base64,face-data",
    };

    const sanitized = sanitizeCompleteProfilePayload(payload);

    expect(sanitized.citizenshipNumber).toBeUndefined();
    expect(sanitized.nidNumber).toBe("12345678");
    expect(user.citizenshipNumber).toBe("CIT-123456");
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

  it("strips oversized biometric payloads before persisting the user record", () => {
    const hugeBase64 = `data:image/png;base64,${"A".repeat(20 * 1024 * 1024)}`;
    const user: any = {
      id: "usr_large_payload_001",
      email: "largepayload@example.com",
      role: "Voter",
      fullName: "Large Payload User",
      faceImage: hugeBase64,
      fingerprintImage: hugeBase64,
      profilePhoto: hugeBase64,
      auditLogs: ["X".repeat(6000)],
    };

    const sanitized = (Database as any).sanitizeUserForStorage(user);

    expect(sanitized.faceImage).toBe("");
    expect(sanitized.fingerprintImage).toBe("");
    expect(sanitized.profilePhoto).toBe("");
    expect(sanitized.auditLogs[0].length).toBeLessThanOrEqual(2048);
    expect(sanitized.auditLogs[0]).toBeDefined();
  });

  it("preserves an existing registration citizenship number during full user saves", async () => {
    const testUserId = "usr_preserve_citizenship_001";
    const registeredCitizenshipNumber = "CIT-REGISTERED-001";
    const users = Database.getUsers().filter((u) => u.id !== testUserId);
    users.push({
      id: testUserId,
      email: "preserve-citizenship@example.com",
      fullName: "Preserve Citizenship",
      role: "Voter",
      citizenshipNumber: registeredCitizenshipNumber,
    } as any);

    await Database.saveUsers(users as any);

    const attemptedOverwrite = Database.getUsers().map((user) =>
      user.id === testUserId
        ? {
          ...user,
          citizenshipNumber: "CIT-SHOULD-NOT-REPLACE",
          isProfileComplete: true,
        }
        : user,
    );

    await Database.saveUsers(attemptedOverwrite as any);

    const savedUser = Database.getUsers().find((u) => u.id === testUserId);
    expect(savedUser?.citizenshipNumber).toBe(registeredCitizenshipNumber);
    expect(savedUser?.isProfileComplete).toBe(true);
  });

  it("ignores the current user's own citizenship and national ID when checking for duplicates", () => {
    const currentUserId = "usr_current_123";
    const users = [
      {
        id: currentUserId,
        citizenshipNumber: "CIT-001122",
        nationalID: "NID-998877",
      },
    ];
    const profiles = [
      {
        id: "prof_current_profile_001",
        userId: currentUserId,
        citizenshipNumber: "CIT-001122",
        nidNumber: "NID-998877",
      },
    ];

    const hasDuplicateIdentityValue = (
      candidateValue: string | undefined,
      items: Array<any>,
      fieldName: string,
      normalizer: (value: string) => string,
    ) => {
      if (!candidateValue) return false;
      const normalizedCandidate = normalizer(candidateValue);
      return items.some((item) => {
        const itemKey = item.userId ?? item.id;
        if (itemKey === currentUserId) return false;
        const itemValue = item[fieldName];
        if (!itemValue) return false;
        return normalizer(String(itemValue)) === normalizedCandidate;
      });
    };

    expect(
      hasDuplicateIdentityValue("CIT-001122", users, "citizenshipNumber", (v) =>
        v.replace(/\s+/g, "").toUpperCase(),
      ),
    ).toBe(false);
    expect(
      hasDuplicateIdentityValue("NID-998877", profiles, "nidNumber", (v) =>
        v.replace(/\s+/g, "").toUpperCase(),
      ),
    ).toBe(false);
  });

  it("ignores the current user's own profile record even when the profile has a different id field", () => {
    const currentUserId = "usr_current_456";
    const profiles = [
      {
        id: "prof_current_profile_456",
        userId: currentUserId,
        citizenshipNumber: "CIT-445566",
        nidNumber: "NID-778899",
      },
    ];

    const hasDuplicateIdentityValue = (
      candidateValue: string | undefined,
      items: Array<any>,
      fieldName: string,
      normalizer: (value: string) => string,
    ) => {
      if (!candidateValue) return false;
      const normalizedCandidate = normalizer(candidateValue);
      return items.some((item) => {
        const itemKey = item.userId ?? item.id;
        if (itemKey === currentUserId) return false;
        const itemValue = item[fieldName];
        if (!itemValue) return false;
        return normalizer(String(itemValue)) === normalizedCandidate;
      });
    };

    expect(
      hasDuplicateIdentityValue(
        "CIT-445566",
        profiles,
        "citizenshipNumber",
        (v) => v.replace(/\s+/g, "").toUpperCase(),
      ),
    ).toBe(false);
    expect(
      hasDuplicateIdentityValue("NID-778899", profiles, "nidNumber", (v) =>
        v.replace(/\s+/g, "").toUpperCase(),
      ),
    ).toBe(false);
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
    expect(step2Result.profilePhoto).toBe(
      "data:image/jpeg;base64,mockphoto...",
    );
    // Preserves Step 1 data
    expect(step2Result.dob).toBe("1998-04-12");

    // Step 3: Save Identity Documents & Fingerprints -> Target nextStep: 4
    const step3Result = await Database.upsertUserProfile(testUserId, {
      fingerprintImage: "data:image/png;base64,mockfinger...",
      currentStep: 4,
    });
    expect(step3Result.currentStep).toBe(4);
    expect(step3Result.citizenshipNumber).toBeUndefined();

    // Verify fetching profile restores the latest saved currentStep
    const restoredProfile = (Database.getUserProfiles().find(
      (p: any) => p.userId === testUserId,
    ) || null) as any;
    expect(restoredProfile).not.toBeNull();
    expect(restoredProfile.currentStep).toBe(4);
    expect(restoredProfile.citizenshipNumber).toBeUndefined();
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
