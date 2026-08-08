import { useEffect, useState, useCallback } from "react";

export function normalizeProfilePayload(data: any) {
  if (!data || !data.user) return data || null;

  const completionValue = Number.isFinite(data.user?.profileCompletionPercent)
    ? data.user.profileCompletionPercent
    : Number.isFinite(data.user?.profileCompletion)
      ? data.user.profileCompletion
      : Number.isFinite(data.profile?.profileCompletionPercent)
        ? data.profile.profileCompletionPercent
        : Number.isFinite(data.profile?.profileCompletion)
          ? data.profile.profileCompletion
          : 100;

  const profile = {
    ...(data.profile || {}),
    nationality:
      data.profile?.nationality || data.user?.nationality || "Nepali",
    occupation: data.profile?.occupation || data.user?.occupation || "",
  };
  const userWithPhoto = {
    ...(data.user || {}),
    profilePhoto:
      data.user?.profilePhoto ||
      data.user?.profilePicture ||
      data.profile?.profilePhoto ||
      data.profile?.profilePicture ||
      data.user?.faceImage ||
      "",
    profilePicture:
      data.user?.profilePicture ||
      data.user?.profilePhoto ||
      data.profile?.profilePicture ||
      data.profile?.profilePhoto ||
      data.user?.faceImage ||
      "",
  };
  const doc = data.document || {};
  const rawFamily = Array.isArray(data.profile?.familyMembers)
    ? data.profile.familyMembers
    : Array.isArray(data.user?.familyMembers)
      ? data.user.familyMembers
      : Array.isArray(data.family)
        ? data.family
        : Array.isArray(data.profile?.family)
          ? data.profile.family
          : [];
  const family = rawFamily.map((member: any, index: number) => {
    const relationship =
      member?.relationship ||
      member?.relation ||
      member?.relationshipType ||
      "Other";

    const addressValue = member?.address
      ? member.address
      : Object.values({
            country: member?.country,
            province: member?.province,
            district: member?.district,
            municipality: member?.municipality,
            ward: member?.ward || member?.wardNumber,
            tole: member?.tole || member?.streetAddress,
            street: member?.street || member?.streetAddress,
            postalCode: member?.postalCode,
          }).some((value) => Boolean(value))
        ? {
            country: member?.country,
            province: member?.province,
            district: member?.district,
            municipality: member?.municipality,
            ward: member?.ward || member?.wardNumber,
            tole: member?.tole || member?.streetAddress,
            street: member?.street || member?.streetAddress,
            postalCode: member?.postalCode,
          }
        : undefined;

    const normalizedMember: any = {
      id:
        member?.id ||
        member?._id ||
        `${data.user?.id || "user"}-family-${index}`,
      name:
        member?.name ||
        member?.fullName ||
        [member?.firstName, member?.lastName].filter(Boolean).join(" ") ||
        "Family Member",
      relation: relationship,
      relationship,
    };

    if (member?.age != null) normalizedMember.age = member.age;
    if (member?.occupation || member?.profession)
      normalizedMember.occupation = member.occupation || member.profession;
    if (member?.phone || member?.mobile)
      normalizedMember.phone = member.phone || member.mobile;
    if (member?.email) normalizedMember.email = member.email;
    if (addressValue) normalizedMember.address = addressValue;
    if (member?.citizenshipNumber || member?.citizenship || member?.nationalID)
      normalizedMember.citizenshipNumber =
        member.citizenshipNumber || member.citizenship || member.nationalID;
    if (member?.isEmergencyContact) normalizedMember.isEmergencyContact = true;

    return normalizedMember;
  });
  const audit = Array.isArray(data.user?.auditLogs)
    ? data.user.auditLogs.map((message: string, index: number) => ({
        id: `${data.user.id}-audit-${index}`,
        action: message,
        by: "System",
        at:
          data.user?.updatedAt ||
          data.user?.createdAt ||
          new Date().toISOString(),
      }))
    : Array.isArray(data.audit)
      ? data.audit
      : [];
  const timeline = Array.isArray(data.timeline)
    ? data.timeline
    : Array.isArray(data.profile?.timeline)
      ? data.profile.timeline
      : [];

  const normalized: any = {
    user: userWithPhoto,
    profile: profile,
    faceVerification: data.faceVerification || null,
    documents: [],
    family,
    audit,
    timeline,
    createdAt: profile.createdAt || data.user.createdAt,
    updatedAt: profile.updatedAt || data.user.updatedAt || data.user.createdAt,
    status:
      data.user?.accountStatus ||
      data.user?.verificationStatus ||
      data.profile?.accountStatus ||
      "Pending",
    verificationStatus:
      data.user?.accountStatus ||
      data.user?.verificationStatus ||
      data.profile?.accountStatus ||
      "Pending",
    completion: completionValue,
  };

  const appendDocument = (
    url: string | undefined,
    label: string,
    extra: any = {},
  ) => {
    if (!url) return;

    const documentNumber =
      extra.documentNumber ||
      extra.number ||
      profile.citizenshipNumber ||
      doc.citizenshipNumber ||
      profile.nidNumber ||
      doc.nidNumber ||
      data.user?.nationalID ||
      "";

    const validationNumber =
      extra.validationNumber ||
      extra.validationCode ||
      extra.validatedNumber ||
      doc.validationNumber ||
      doc.validationCode ||
      doc.validatedNumber ||
      profile.validationNumber ||
      profile.validationCode ||
      profile.validatedNumber ||
      "";

    const issueDate =
      extra.issueDate ||
      profile.citizenshipIssueDate ||
      profile.nidIssueDate ||
      doc.issueDate ||
      "";

    const verificationStatus =
      extra.verificationStatus ||
      doc.verificationStatus ||
      profile.verificationStatus ||
      data.user?.accountStatus ||
      data.profile?.accountStatus ||
      "Pending";

    normalized.documents.push({
      id: `${data.user.id}-${label.toLowerCase().replace(/\s+/g, "-")}`,
      url,
      label,
      number: documentNumber,
      documentNumber,
      validationNumber,
      validationCode: validationNumber,
      issueDate,
      uploadedAt:
        extra.uploadedAt ||
        doc.createdAt ||
        profile.createdAt ||
        data.user.createdAt,
      status: extra.status || verificationStatus,
      documentStatus: extra.documentStatus || verificationStatus,
      verificationStatus,
      ...extra,
    });
  };

  appendDocument(
    profile.citizenshipFrontImage || doc.citizenshipFrontImage,
    "Citizenship (Front)",
    {
      documentNumber:
        profile.citizenshipNumber ||
        doc.citizenshipNumber ||
        doc.documentNumber ||
        data.user.nationalID,
      validationNumber:
        profile.validationNumber ||
        doc.validationNumber ||
        doc.validationCode ||
        doc.validatedNumber ||
        profile.validationCode ||
        profile.validatedNumber,
      issueDate: profile.citizenshipIssueDate || doc.issueDate,
      uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
      status:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      documentStatus:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      verificationStatus:
        doc.verificationStatus ||
        profile.verificationStatus ||
        data.user?.accountStatus ||
        data.profile?.accountStatus ||
        "Pending",
    },
  );
  appendDocument(
    profile.citizenshipBackImage || doc.citizenshipBackImage,
    "Citizenship (Back)",
    {
      documentNumber:
        profile.citizenshipNumber ||
        doc.citizenshipNumber ||
        doc.documentNumber ||
        data.user.nationalID,
      validationNumber:
        profile.validationNumber ||
        doc.validationNumber ||
        doc.validationCode ||
        doc.validatedNumber ||
        profile.validationCode ||
        profile.validatedNumber,
      issueDate: profile.citizenshipIssueDate || doc.issueDate,
      uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
      status:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      documentStatus:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      verificationStatus:
        doc.verificationStatus ||
        profile.verificationStatus ||
        data.user?.accountStatus ||
        data.profile?.accountStatus ||
        "Pending",
    },
  );
  appendDocument(
    profile.nidFrontImage || doc.nidFrontImage,
    "National ID (Front)",
    {
      documentNumber:
        profile.nidNumber || doc.documentNumber || data.user.nationalID,
      validationNumber:
        profile.validationNumber ||
        doc.validationNumber ||
        doc.validationCode ||
        doc.validatedNumber ||
        profile.validationCode ||
        profile.validatedNumber,
      issueDate: profile.nidIssueDate || doc.issueDate,
      uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
      status:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      documentStatus:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      verificationStatus:
        doc.verificationStatus ||
        profile.verificationStatus ||
        data.user?.accountStatus ||
        data.profile?.accountStatus ||
        "Pending",
    },
  );
  appendDocument(
    profile.nidBackImage || doc.nidBackImage,
    "National ID (Back)",
    {
      documentNumber:
        profile.nidNumber || doc.documentNumber || data.user.nationalID,
      validationNumber:
        profile.validationNumber ||
        doc.validationNumber ||
        doc.validationCode ||
        doc.validatedNumber ||
        profile.validationCode ||
        profile.validatedNumber,
      issueDate: profile.nidIssueDate || doc.issueDate,
      uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
      status:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      documentStatus:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      verificationStatus:
        doc.verificationStatus ||
        profile.verificationStatus ||
        data.user?.accountStatus ||
        data.profile?.accountStatus ||
        "Pending",
    },
  );
  appendDocument(doc.signatureImage || profile.signatureImage, "Signature", {
    uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
    status:
      data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    documentStatus:
      data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    verificationStatus:
      doc.verificationStatus ||
      profile.verificationStatus ||
      data.user?.accountStatus ||
      data.profile?.accountStatus ||
      "Pending",
  });

  const documentList = Array.isArray(data.documents)
    ? data.documents
    : Array.isArray(data.profile?.documents)
      ? data.profile.documents
      : Array.isArray(data.user?.documents)
        ? data.user.documents
        : [];

  if (!normalized.documents.length && documentList.length) {
    normalized.documents = documentList.map((docItem: any, index: number) => ({
      id:
        docItem?.id ||
        docItem?._id ||
        `${data.user?.id || "user"}-document-${index}`,
      url: docItem?.url || docItem?.fileUrl || docItem?.imageUrl || "",
      label: docItem?.label || docItem?.documentType || "Document",
      number:
        docItem?.number ||
        docItem?.documentNumber ||
        docItem?.citizenshipNumber ||
        docItem?.nidNumber ||
        "",
      documentNumber:
        docItem?.documentNumber ||
        docItem?.number ||
        docItem?.citizenshipNumber ||
        docItem?.nidNumber ||
        "",
      validationNumber:
        docItem?.validationNumber ||
        docItem?.validationCode ||
        docItem?.validatedNumber ||
        "",
      issueDate: docItem?.issueDate || docItem?.issuedAt || "",
      uploadedAt: docItem?.uploadedAt || docItem?.createdAt || "",
      status: docItem?.status || docItem?.verificationStatus || "Pending",
      documentStatus:
        docItem?.documentStatus || docItem?.verificationStatus || "Pending",
      verificationStatus:
        docItem?.verificationStatus || docItem?.status || "Pending",
      ...docItem,
    }));
  }

  return normalized;
}

export function useProfile(token?: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/my-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile(normalizeProfilePayload(data) || data || null);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, loading, error, reload: load } as const;
}

export default useProfile;

