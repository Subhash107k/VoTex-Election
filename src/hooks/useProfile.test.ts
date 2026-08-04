import { describe, expect, it } from "vitest";
import { normalizeProfilePayload } from "./useProfile";

describe("normalizeProfilePayload", () => {
  it("preserves uploaded profile and document fields for the voter dashboard", () => {
    const payload = {
      user: {
        id: "u-1",
        fullName: "Nabin Shrestha",
        email: "nabin@example.com",
        mobile: "9800000000",
        nationalID: "12345678",
        dob: "1998-09-20",
        gender: "Male",
        isEmailVerified: true,
        isMobileVerified: true,
        createdAt: "2024-01-10T00:00:00.000Z",
      },
      profile: {
        userId: "u-1",
        nationality: "Nepali",
        occupation: "Teacher",
        citizenshipNumber: "ABC-123",
        permanentAddress: "Balaju, Kathmandu",
        citizenshipFrontImage: "https://example.com/front.jpg",
        citizenshipBackImage: "https://example.com/back.jpg",
        nidFrontImage: "https://example.com/nid-front.jpg",
        nidBackImage: "https://example.com/nid-back.jpg",
        familyMembers: [{ name: "Rita", relation: "Mother" }],
      },
      document: {
        id: "doc-1",
        userId: "u-1",
        citizenshipFrontImage: "https://example.com/front.jpg",
        citizenshipBackImage: "https://example.com/back.jpg",
        signatureImage: "https://example.com/signature.jpg",
        nidFrontImage: "https://example.com/nid-front.jpg",
        nidBackImage: "https://example.com/nid-back.jpg",
      },
    };

    const normalized = normalizeProfilePayload(payload);

    expect(normalized.user.fullName).toBe("Nabin Shrestha");
    expect(normalized.profile.nationality).toBe("Nepali");
    expect(normalized.profile.occupation).toBe("Teacher");
    expect(normalized.documents).toHaveLength(5);
    expect(normalized.documents.map((doc: any) => doc.label)).toContain(
      "Citizenship (Front)",
    );
    expect(normalized.documents.map((doc: any) => doc.label)).toContain(
      "Signature",
    );
    expect(normalized.family).toEqual([{ name: "Rita", relation: "Mother" }]);
    expect(normalized.user.isEmailVerified).toBe(true);
    expect(normalized.user.isMobileVerified).toBe(true);
    expect(normalized.audit).toEqual([]);
    expect(normalized.timeline).toEqual([]);
  });

  it("uses the schema-backed completion percentage when present", () => {
    const normalized = normalizeProfilePayload({
      user: {
        id: "u-2",
        fullName: "Asha Kandel",
        email: "asha@example.com",
        profileCompletionPercent: 72,
        createdAt: "2024-01-10T00:00:00.000Z",
      },
    });

    expect(normalized.completion).toBe(72);
  });

  it("keeps the uploaded profile photo on either the user or profile object", () => {
    const fromUser = normalizeProfilePayload({
      user: {
        id: "u-3",
        fullName: "Riya Poudel",
        email: "riya@example.com",
        profilePhoto: "https://example.com/user-photo.jpg",
        createdAt: "2024-01-10T00:00:00.000Z",
      },
    });

    const fromProfile = normalizeProfilePayload({
      user: {
        id: "u-4",
        fullName: "Suman Giri",
        email: "suman@example.com",
        createdAt: "2024-01-10T00:00:00.000Z",
      },
      profile: {
        profilePhoto: "https://example.com/profile-photo.jpg",
      },
    });

    expect(fromUser.user.profilePhoto).toBe("https://example.com/user-photo.jpg");
    expect(fromProfile.user.profilePhoto).toBe("https://example.com/profile-photo.jpg");
  });
});
