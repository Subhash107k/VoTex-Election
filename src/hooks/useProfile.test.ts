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
    expect(normalized.family).toMatchObject([
      { name: "Rita", relation: "Mother", relationship: "Mother" },
    ]);
    expect(normalized.user.isEmailVerified).toBe(true);
    expect(normalized.user.isMobileVerified).toBe(true);
    expect(normalized.audit).toEqual([]);
    expect(normalized.timeline).toEqual([]);
  });

  it("keeps document metadata such as document number and validation status available to the dashboard", () => {
    const normalized = normalizeProfilePayload({
      user: {
        id: "u-2",
        fullName: "Asha Kandel",
        email: "asha@example.com",
        createdAt: "2024-01-10T00:00:00.000Z",
      },
      profile: {
        citizenshipNumber: "ABC-123",
        citizenshipFrontImage: "https://example.com/front.jpg",
      },
      document: {
        citizenshipFrontImage: "https://example.com/front.jpg",
        documentNumber: "ABC-123",
        validationNumber: "VAL-2024-001",
        issueDate: "2024-02-10",
        verificationStatus: "verified",
      },
    });

    const frontDoc = normalized.documents.find(
      (doc: any) => doc.label === "Citizenship (Front)",
    );

    expect(frontDoc).toMatchObject({
      number: "ABC-123",
      documentNumber: "ABC-123",
      validationNumber: "VAL-2024-001",
      issueDate: "2024-02-10",
      verificationStatus: "verified",
    });
  });

  it("normalizes family members from the schema shape and supports document arrays from saved profile payloads", () => {
    const normalized = normalizeProfilePayload({
      user: {
        id: "u-2",
        fullName: "Asha Kandel",
        email: "asha@example.com",
        createdAt: "2024-01-10T00:00:00.000Z",
      },
      profile: {
        familyMembers: [
          {
            fullName: "Bikash Kandel",
            relationship: "Father",
            phone: "9800000001",
            address: { province: "Bagmati", district: "Kathmandu" },
            isEmergencyContact: true,
          },
        ],
        documents: [
          {
            label: "Citizenship",
            documentNumber: "CIT-991",
            validationNumber: "VAL-991",
            url: "https://example.com/docs/cit.jpg",
            verificationStatus: "verified",
          },
        ],
      },
    });

    expect(normalized.family).toMatchObject([
      { name: "Bikash Kandel", relationship: "Father", phone: "9800000001" },
    ]);
    expect(normalized.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Citizenship",
          documentNumber: "CIT-991",
          validationNumber: "VAL-991",
        }),
      ]),
    );
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

    expect(fromUser.user.profilePhoto).toBe(
      "https://example.com/user-photo.jpg",
    );
    expect(fromProfile.user.profilePhoto).toBe(
      "https://example.com/profile-photo.jpg",
    );
  });
});
