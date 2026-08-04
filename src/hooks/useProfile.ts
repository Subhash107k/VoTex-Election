import { useEffect, useState, useCallback } from "react";

export function normalizeProfilePayload(data: any) {
  if (!data || !data.user) return data || null;

  const completionValue =
    Number.isFinite(data.user?.profileCompletionPercent)
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
    nationality: data.profile?.nationality || data.user?.nationality || "Nepali",
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
  const family = Array.isArray(data.profile?.familyMembers)
    ? data.profile.familyMembers
    : Array.isArray(data.user?.familyMembers)
      ? data.user.familyMembers
      : [];
  const audit = Array.isArray(data.user?.auditLogs)
    ? data.user.auditLogs.map((message: string, index: number) => ({
        id: `${data.user.id}-audit-${index}`,
        action: message,
        by: "System",
        at: data.user?.updatedAt || data.user?.createdAt || new Date().toISOString(),
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

  const appendDocument = (url: string | undefined, label: string, extra: any = {}) => {
    if (!url) return;
    normalized.documents.push({
      id: `${data.user.id}-${label.toLowerCase().replace(/\s+/g, "-")}`,
      url,
      label,
      ...extra,
    });
  };

  appendDocument(
    profile.citizenshipFrontImage || doc.citizenshipFrontImage,
    "Citizenship (Front)",
    {
      number: profile.citizenshipNumber || doc.citizenshipNumber || data.user.nationalID,
      uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
      status: data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      documentStatus:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      verificationStatus:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    },
  );
  appendDocument(
    profile.citizenshipBackImage || doc.citizenshipBackImage,
    "Citizenship (Back)",
    {
      number: profile.citizenshipNumber || doc.citizenshipNumber || data.user.nationalID,
      uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
      status: data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      documentStatus:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
      verificationStatus:
        data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    },
  );
  appendDocument(profile.nidFrontImage || doc.nidFrontImage, "National ID (Front)", {
    number: profile.nidNumber || data.user.nationalID,
    uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
    status: data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    documentStatus:
      data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    verificationStatus:
      data.user?.accountStatus || data.profile?.accountStatus || "Pending",
  });
  appendDocument(profile.nidBackImage || doc.nidBackImage, "National ID (Back)", {
    number: profile.nidNumber || data.user.nationalID,
    uploadedAt: doc.createdAt || profile.createdAt || data.user.createdAt,
    status: data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    documentStatus:
      data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    verificationStatus:
      data.user?.accountStatus || data.profile?.accountStatus || "Pending",
  });
  appendDocument(doc.signatureImage || profile.signatureImage, "Signature", {
    status: data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    documentStatus:
      data.user?.accountStatus || data.profile?.accountStatus || "Pending",
    verificationStatus:
      data.user?.accountStatus || data.profile?.accountStatus || "Pending",
  });

  if (!normalized.documents.length && Array.isArray(data.documents)) {
    normalized.documents = data.documents;
  }

  return normalized;
}

export default function euseProfile(token?: string) {
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
