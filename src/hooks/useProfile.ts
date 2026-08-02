import { useEffect, useState, useCallback } from "react";

export default function euseProfile(token?: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // server exposes /api/profile/my-profile (returns JSON with { user, profile, document, faceVerification })
      const res = await fetch("/api/profile/my-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();

      // Normalize response to the shape dashboard expects
      if (data && data.user) {
        const normalized: any = {
          user: data.user,
          profile: data.profile || null,
          faceVerification: data.faceVerification || null,
          documents: [],
          createdAt:
            (data.profile && data.profile.createdAt) || data.user.createdAt,
        };

        const doc = data.document;
        if (doc) {
          if (doc.citizenshipFrontImage)
            normalized.documents.push({
              id: `${doc.id}-front`,
              url: doc.citizenshipFrontImage,
              label: "Citizenship (Front)",
              number: doc.citizenshipNumber,
            });
          if (doc.citizenshipBackImage)
            normalized.documents.push({
              id: `${doc.id}-back`,
              url: doc.citizenshipBackImage,
              label: "Citizenship (Back)",
              number: doc.citizenshipNumber,
            });
          if (doc.signatureImage)
            normalized.documents.push({
              id: `${doc.id}-sig`,
              url: doc.signatureImage,
              label: "Signature",
            });
        }

        setProfile(normalized);
      } else {
        // fallback: server returned a plain profile object
        setProfile(data || null);
      }
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
