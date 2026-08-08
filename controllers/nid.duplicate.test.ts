import { describe, expect, it, beforeEach } from "vitest";
import Database from "../src/db/dbService.js";

describe("NID Duplicate Submission & Replacement Tests", () => {
  beforeEach(() => {
    // Re-initialize seed data state
    Database.getUsers();
    Database.getUserProfiles();
    Database.getIdentityDocuments();
  });

  it("1. New NID -> Creates a new NID record normally", async () => {
    const newNid = `NID-TEST-NEW-${Date.now()}`;
    const result = await Database.upsertNidRecord({
      userId: "usr_seed_voter_1",
      nidNumber: newNid,
      nidIssueDate: "2024-01-15",
      nidStatus: "Verified",
      nidFrontImage: "data:image/png;base64,front-new-123",
      nidBackImage: "data:image/png;base64,back-new-123",
    });

    expect(result.success).toBe(true);
    expect(result.isNew).toBe(true);
    expect(result.replaced).toBe(false);
    expect(result.message).toBe("NID registered successfully");
    expect(result.record.nidNumber).toBe(newNid);
    expect(result.record.id).toBeDefined();
  });

  it("2. Same user's existing NID -> Replaces/updates the old record", async () => {
    const testNid = `NID-REPLACE-USER-${Date.now()}`;
    
    // First submission
    const firstResult = await Database.upsertNidRecord({
      userId: "usr_seed_voter_2",
      nidNumber: testNid,
      nidIssueDate: "2023-05-10",
      nidStatus: "Pending",
      nidFrontImage: "data:image/png;base64,front-v1",
      nidBackImage: "data:image/png;base64,back-v1",
    });
    const originalRecordId = firstResult.record.id;

    // Second submission with updated fields & image files
    const secondResult = await Database.upsertNidRecord({
      userId: "usr_seed_voter_2",
      nidNumber: testNid,
      nidIssueDate: "2025-02-01",
      nidStatus: "Verified",
      nidFrontImage: "data:image/png;base64,front-v2-replaced",
      nidBackImage: "data:image/png;base64,back-v2-replaced",
    });

    expect(secondResult.success).toBe(true);
    expect(secondResult.replaced).toBe(true);
    expect(secondResult.isNew).toBe(false);
    expect(secondResult.message).toBe(
      "NID already exists. The previous NID information has been updated with your latest submission."
    );
    expect(secondResult.record.id).toBe(originalRecordId);
    expect(secondResult.record.nidIssueDate).toBe("2025-02-01");
    expect(secondResult.record.nidFrontImage).toBe("data:image/png;base64,front-v2-replaced");
  });

  it("3. Same NID submitted again -> No duplicate record is created", async () => {
    const testNid = `NID-NO-DUP-${Date.now()}`;

    await Database.upsertNidRecord({
      userId: "usr_seed_voter_3",
      nidNumber: testNid,
      nidIssueDate: "2022-11-11",
    });

    const initialDocsCount = Database.getIdentityDocuments().length;

    // Resubmit the exact same NID
    await Database.upsertNidRecord({
      userId: "usr_seed_voter_3",
      nidNumber: testNid,
      nidIssueDate: "2025-08-08",
    });

    const finalDocsCount = Database.getIdentityDocuments().length;
    expect(finalDocsCount).toBe(initialDocsCount);

    const matchingDocs = Database.getIdentityDocuments().filter(
      (d: any) =>
        d.nidNumber &&
        d.nidNumber.replace(/[\s-]/g, "").toUpperCase() ===
          testNid.replace(/[\s-]/g, "").toUpperCase()
    );
    expect(matchingDocs.length).toBe(1);
  });

  it("4. Different NID -> Creates a separate record", async () => {
    const nidA = `NID-DIFF-AAA-${Date.now()}`;
    const nidB = `NID-DIFF-BBB-${Date.now()}`;

    const resA = await Database.upsertNidRecord({
      userId: "usr_seed_voter_4",
      nidNumber: nidA,
    });

    const resB = await Database.upsertNidRecord({
      userId: "usr_seed_voter_5",
      nidNumber: nidB,
    });

    expect(resA.record.id).not.toBe(resB.record.id);
    expect(resA.record.nidNumber).toBe(nidA);
    expect(resB.record.nidNumber).toBe(nidB);
    expect(resA.isNew).toBe(true);
    expect(resB.isNew).toBe(true);
  });

  it("5. Concurrent duplicate submissions -> Database constraint prevents duplicate records", async () => {
    const testNid = `NID-CONCURRENT-${Date.now()}`;

    const p1 = Database.upsertNidRecord({
      userId: "usr_concurrent_1",
      nidNumber: testNid,
      nidIssueDate: "2025-01-01",
    });

    const p2 = Database.upsertNidRecord({
      userId: "usr_concurrent_2",
      nidNumber: testNid,
      nidIssueDate: "2025-01-02",
    });

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    const matches = Database.getIdentityDocuments().filter(
      (d: any) =>
        d.nidNumber &&
        d.nidNumber.replace(/[\s-]/g, "").toUpperCase() ===
          testNid.replace(/[\s-]/g, "").toUpperCase()
    );
    expect(matches.length).toBe(1);
  });
});
