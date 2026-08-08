import { describe, expect, it, beforeEach } from "vitest";
import Database from "../src/db/dbService.js";

describe("Citizenship Duplicate Submission & Replacement Tests", () => {
  beforeEach(() => {
    Database.getUsers();
    Database.getUserProfiles();
    Database.getIdentityDocuments();
  });

  it("1. New Citizenship Number -> Creates a new Citizenship record normally", async () => {
    const newCit = `CIT-TEST-NEW-${Date.now()}`;
    const result = await Database.upsertCitizenshipRecord({
      userId: "usr_seed_voter_1",
      citizenshipNumber: newCit,
      citizenshipType: "Regular",
      citizenshipIssueDate: "2023-08-10",
      citizenshipFrontImage: "data:image/png;base64,cit-front-123",
      citizenshipBackImage: "data:image/png;base64,cit-back-123",
    });

    expect(result.success).toBe(true);
    expect(result.isNew).toBe(true);
    expect(result.replaced).toBe(false);
    expect(result.message).toBe("Citizenship record registered successfully");
    expect(result.record.citizenshipNumber).toBe(newCit);
    expect(result.record.id).toBeDefined();
  });

  it("2. Same user's existing Citizenship Number -> Replaces/updates the old record", async () => {
    const testCit = `CIT-REPLACE-USER-${Date.now()}`;

    const firstResult = await Database.upsertCitizenshipRecord({
      userId: "usr_seed_voter_2",
      citizenshipNumber: testCit,
      citizenshipIssueDistrict: "Kathmandu",
      citizenshipFrontImage: "data:image/png;base64,cit-v1",
    });
    const originalRecordId = firstResult.record.id;

    const secondResult = await Database.upsertCitizenshipRecord({
      userId: "usr_seed_voter_2",
      citizenshipNumber: testCit,
      citizenshipIssueDistrict: "Lalitpur",
      citizenshipFrontImage: "data:image/png;base64,cit-v2-replaced",
    });

    expect(secondResult.success).toBe(true);
    expect(secondResult.replaced).toBe(true);
    expect(secondResult.isNew).toBe(false);
    expect(secondResult.message).toBe(
      "Citizenship Number already exists. The previous Citizenship information has been updated with your latest submission."
    );
    expect(secondResult.record.id).toBe(originalRecordId);
    expect(secondResult.record.citizenshipIssueDistrict).toBe("Lalitpur");
    expect(secondResult.record.citizenshipFrontImage).toBe("data:image/png;base64,cit-v2-replaced");
  });

  it("3. Same Citizenship Number submitted again -> No duplicate record is created", async () => {
    const testCit = `CIT-NO-DUP-${Date.now()}`;

    await Database.upsertCitizenshipRecord({
      userId: "usr_seed_voter_3",
      citizenshipNumber: testCit,
    });

    const initialDocsCount = Database.getIdentityDocuments().length;

    await Database.upsertCitizenshipRecord({
      userId: "usr_seed_voter_3",
      citizenshipNumber: testCit,
      citizenshipIssueAuthority: "CDO Office",
    });

    const finalDocsCount = Database.getIdentityDocuments().length;
    expect(finalDocsCount).toBe(initialDocsCount);

    const matchingDocs = Database.getIdentityDocuments().filter(
      (d: any) =>
        d.citizenshipNumber &&
        d.citizenshipNumber.replace(/[\s-]/g, "").toUpperCase() ===
          testCit.replace(/[\s-]/g, "").toUpperCase()
    );
    expect(matchingDocs.length).toBe(1);
  });

  it("4. Different Citizenship Number -> Creates a separate record", async () => {
    const citA = `CIT-DIFF-AAA-${Date.now()}`;
    const citB = `CIT-DIFF-BBB-${Date.now()}`;

    const resA = await Database.upsertCitizenshipRecord({
      userId: "usr_seed_voter_4",
      citizenshipNumber: citA,
    });

    const resB = await Database.upsertCitizenshipRecord({
      userId: "usr_seed_voter_5",
      citizenshipNumber: citB,
    });

    expect(resA.record.id).not.toBe(resB.record.id);
    expect(resA.record.citizenshipNumber).toBe(citA);
    expect(resB.record.citizenshipNumber).toBe(citB);
    expect(resA.isNew).toBe(true);
    expect(resB.isNew).toBe(true);
  });

  it("5. Concurrent duplicate submissions -> Database constraint prevents duplicate records", async () => {
    const testCit = `CIT-CONCURRENT-${Date.now()}`;

    const p1 = Database.upsertCitizenshipRecord({
      userId: "usr_concurrent_cit_1",
      citizenshipNumber: testCit,
      citizenshipIssueDistrict: "Bhaktapur",
    });

    const p2 = Database.upsertCitizenshipRecord({
      userId: "usr_concurrent_cit_2",
      citizenshipNumber: testCit,
      citizenshipIssueDistrict: "Kaski",
    });

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    const matches = Database.getIdentityDocuments().filter(
      (d: any) =>
        d.citizenshipNumber &&
        d.citizenshipNumber.replace(/[\s-]/g, "").toUpperCase() ===
          testCit.replace(/[\s-]/g, "").toUpperCase()
    );
    expect(matches.length).toBe(1);
  });
});
