import { describe, expect, it, beforeEach } from "vitest";
import Database from "../src/db/dbService.js";
import {
  normalizeEmail,
  normalizeUsername,
  normalizePhone,
  normalizePhoneComparison,
  normalizeNid,
  normalizeCitizenship,
  areSamePhone,
} from "../src/utils/normalization.js";

describe("Registration Duplicate Validation & Normalization Tests", () => {
  beforeEach(() => {
    // Reset seed users map
    Database.getUsers();
  });

  it("Test Normalization - Normalizes email, username, phone, NID, and citizenship consistently", () => {
    expect(normalizeEmail("   User.Test@Domain.COM  ")).toBe("user.test@domain.com");
    expect(normalizeUsername("  Voter_User123  ")).toBe("voter_user123");
    expect(normalizeNid(" nid-9988-7766 ")).toBe("NID99887766");
    expect(normalizeCitizenship(" 27-01-79-12345 ")).toBe("27017912345");
  });

  it("Test Normalization - Normalizes phone numbers with whitespace and formats", () => {
    expect(normalizePhone(" 9841234567 ")).toBe("+9779841234567");
    expect(normalizePhone("+977 9841234567")).toBe("+9779841234567");
    expect(normalizePhoneComparison("+977 984-123-4567")).toBe("9841234567");
    expect(areSamePhone("9841234567", "+9779841234567")).toBe(true);
  });

  it("Test E11000 Parsing - Correctly extracts field name from MongoDB E11000 error patterns", () => {
    const emailErr = { message: "E11000 duplicate key error collection: votex_db.users index: users_email_unique dup key" };
    expect(Database.parseDuplicateFieldError(emailErr)).toEqual({
      field: "email",
      message: "Email is already registered.",
    });

    const usernameErr = { keyPattern: { username: 1 } };
    expect(Database.parseDuplicateFieldError(usernameErr)).toEqual({
      field: "username",
      message: "Username is not available.",
    });

    const phoneErr = { message: "E11000 duplicate key error collection: votex_db.users index: users_mobile_unique" };
    expect(Database.parseDuplicateFieldError(phoneErr)).toEqual({
      field: "phone",
      message: "Phone number is already registered.",
    });

    const nidErr = { keyPattern: { nationalID: 1 } };
    expect(Database.parseDuplicateFieldError(nidErr)).toEqual({
      field: "nid",
      message: "NID is already registered.",
    });

    // Citizenship number uniqueness removed — parseDuplicateFieldError now returns null for citizenship E11000 errors
    const citizenshipErr = { message: "E11000 duplicate key error index: users_citizenship_number_unique" };
    expect(Database.parseDuplicateFieldError(citizenshipErr)).toBeNull();
  });

  it("Test Database Inspection - Reports duplicate stats safely without deleting data", async () => {
    const report = await Database.inspectDuplicateUserData();
    expect(report).toBeDefined();
    expect(typeof report.duplicateEmails).toBe("number");
    expect(typeof report.duplicatePhones).toBe("number");
    expect(typeof report.duplicateUsernames).toBe("number");
    expect(typeof report.duplicateNids).toBe("number");
    expect(typeof report.duplicateCitizenships).toBe("number");
  });
});
