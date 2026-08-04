import { describe, expect, it } from "vitest";
import {
  buildMailFromAddress,
  normalizeVerificationCode,
  validateProfileSubmissionInput,
} from "./auth.controller.js";

describe("auth helpers", () => {
  it("normalizes verification codes by trimming whitespace", () => {
    expect(normalizeVerificationCode(" 123456 ")).toBe("123456");
    expect(normalizeVerificationCode("\n654321\t")).toBe("654321");
  });

  it("builds a display name for the sender when SMTP_FROM_NAME is configured", () => {
    expect(buildMailFromAddress("noreply@votex.com", "Votex")).toBe(
      "Votex <noreply@votex.com>",
    );
  });

  it("validates and normalizes a complete profile submission payload", () => {
    const profile = validateProfileSubmissionInput({
      fullName: "Test User",
      email: "test@example.com",
      mobile: "9876543210",
      address: "Kathmandu, Nepal",
      dob: "1995-06-15",
      gender: "Male",
      profilePhoto: "data:image/png;base64,abc",
    });

    expect(profile.fullName).toBe("Test User");
    expect(profile.email).toBe("test@example.com");
    expect(profile.mobile).toBe("+9779876543210");
    expect(profile.address).toBe("Kathmandu, Nepal");
    expect(profile.profilePhoto).toBe("data:image/png;base64,abc");
  });

  it("rejects incomplete profile payloads", () => {
    expect(() =>
      validateProfileSubmissionInput({
        fullName: "Test User",
      }),
    ).toThrow();
  });
});
