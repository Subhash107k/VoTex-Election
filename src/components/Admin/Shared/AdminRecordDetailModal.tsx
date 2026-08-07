import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Loader2,
  Phone,
  User as UserIcon,
} from "lucide-react";
import Modal from "../../ui/Modal.tsx";
import DocumentGallery from "../../dashboard/DocumentGallery.tsx";
import { StatusBadge } from "./StatusBadge.tsx";
import { normalizeProfilePayload } from "../../../hooks/useProfile.ts";
import type { Candidate } from "../../../types.js";
import {
  getCandidateStatus,
  getVoterStatus,
} from "./adminStatusUtils.ts";

type RecordType = "voter" | "candidate";

interface AdminRecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: RecordType;
  recordId: string | null;
  token: string;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
      {children}
    </h4>
  );
}

export default function AdminRecordDetailModal({
  isOpen,
  onClose,
  type,
  recordId,
  token,
}: AdminRecordDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "documents">(
    "overview",
  );
  const [voterData, setVoterData] = useState<any>(null);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!recordId || !token) return;

    setLoading(true);
    setError("");
    setVoterData(null);
    setCandidateData(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const url =
        type === "voter"
          ? `/api/voters/${recordId}/profile`
          : `/api/candidates/${recordId}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Unable to load record details");
      }

      const data = await res.json();
      if (type === "voter") {
        setVoterData(data);
      } else {
        setCandidateData(data);
      }
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load record details",
      );
    } finally {
      setLoading(false);
    }
  }, [recordId, token, type]);

  useEffect(() => {
    if (isOpen && recordId) {
      setActiveTab("overview");
      void fetchDetails();
    }
  }, [isOpen, recordId, fetchDetails]);

  const profileBundle = useMemo(() => {
    if (type === "voter" && voterData?.voter) {
      return normalizeProfilePayload({
        user: voterData.voter,
        profile: voterData.profile,
        document: voterData.document,
      });
    }

    if (type === "candidate" && candidateData?.candidate) {
      if (candidateData.user) {
        return normalizeProfilePayload({
          user: candidateData.user,
          profile: candidateData.profile,
          document: candidateData.document,
        });
      }
    }

    return null;
  }, [type, voterData, candidateData]);

  const documents = profileBundle?.documents || [];

  const title =
    type === "voter"
      ? voterData?.voter?.fullName || "Voter details"
      : candidateData?.candidate?.fullName ||
        candidateData?.candidate?.name ||
        "Candidate details";

  const status =
    type === "voter" && voterData?.voter
      ? getVoterStatus(voterData.voter)
      : type === "candidate" && candidateData?.candidate
        ? getCandidateStatus(candidateData.candidate as Candidate)
        : "Pending";

  const handleDownload = (url?: string, name?: string) => {
    if (!url) return;
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = name || "document";
    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);
  };

  const candidate = candidateData?.candidate;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        maxWidth="4xl"
      >
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading record details…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={status} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    activeTab === "overview"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-700 text-slate-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("documents")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    activeTab === "documents"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-700 text-slate-300"
                  }`}
                >
                  Documents ({documents.length})
                </button>
              </div>
            </div>

            {activeTab === "overview" ? (
              <div className="space-y-5">
                {type === "voter" && voterData?.voter ? (
                  <>
                    <div className="flex items-start gap-4">
                      {profileBundle?.user?.profilePhoto ? (
                        <img
                          src={profileBundle.user.profilePhoto}
                          alt={voterData.voter.fullName}
                          className="h-20 w-20 rounded-2xl border border-slate-700 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
                          <UserIcon className="h-8 w-8 text-slate-500" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-white">
                          {voterData.voter.fullName}
                        </p>
                        <p className="text-sm text-slate-400">
                          {voterData.voter.email}
                        </p>
                        <p className="flex items-center gap-1 text-sm text-slate-400">
                          <Phone className="h-3.5 w-3.5" />
                          {voterData.voter.mobile}
                        </p>
                      </div>
                    </div>

                    <SectionTitle>Identity</SectionTitle>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <DetailRow
                        label="National ID"
                        value={voterData.voter.nationalID}
                      />
                      <DetailRow
                        label="Date of birth"
                        value={voterData.voter.dob}
                      />
                      <DetailRow label="Gender" value={voterData.voter.gender} />
                      <DetailRow
                        label="Address"
                        value={voterData.voter.address}
                      />
                    </div>

                    {voterData.profile ? (
                      <>
                        <SectionTitle>Extended profile</SectionTitle>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <DetailRow
                            label="Citizenship number"
                            value={voterData.profile.citizenshipNumber}
                          />
                          <DetailRow
                            label="Occupation"
                            value={voterData.profile.occupation}
                          />
                          <DetailRow
                            label="Father's name"
                            value={voterData.profile.fatherName}
                          />
                          <DetailRow
                            label="Mother's name"
                            value={voterData.profile.motherName}
                          />
                          <DetailRow
                            label="Permanent address"
                            value={
                              voterData.profile.permanentDistrict
                                ? [
                                    voterData.profile.permanentDistrict,
                                    voterData.profile.permanentMunicipality,
                                    voterData.profile.permanentWardNumber
                                      ? `Ward ${voterData.profile.permanentWardNumber}`
                                      : "",
                                  ]
                                    .filter(Boolean)
                                    .join(", ")
                                : undefined
                            }
                          />
                        </div>
                      </>
                    ) : null}

                    {voterData.voter.rejectionReason ? (
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        <span className="font-semibold">Rejection reason: </span>
                        {voterData.voter.rejectionReason}
                      </div>
                    ) : null}
                  </>
                ) : null}

                {type === "candidate" && candidate ? (
                  <>
                    <div className="flex items-start gap-4">
                      {candidate.photoUrl || candidate.candidatePhoto ? (
                        <img
                          src={candidate.photoUrl || candidate.candidatePhoto}
                          alt={candidate.fullName || candidate.name}
                          className="h-20 w-20 rounded-2xl border border-slate-700 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
                          <UserIcon className="h-8 w-8 text-slate-500" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-white">
                          {candidate.fullName || candidate.name}
                        </p>
                        <p className="text-sm text-slate-400">{candidate.party}</p>
                        {candidate.contactNumber ? (
                          <p className="flex items-center gap-1 text-sm text-slate-400">
                            <Phone className="h-3.5 w-3.5" />
                            {candidate.contactNumber}
                          </p>
                        ) : null}
                        {candidate.emailAddress ? (
                          <p className="text-sm text-slate-400">
                            {candidate.emailAddress}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <SectionTitle>Registration</SectionTitle>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <DetailRow
                        label="Election position"
                        value={candidate.electionPosition}
                      />
                      <DetailRow
                        label="Constituency"
                        value={candidate.electoralConstituency}
                      />
                      <DetailRow
                        label="Citizenship number"
                        value={candidate.citizenshipNumber}
                      />
                      <DetailRow
                        label="Registration number"
                        value={candidate.candidateRegistrationNumber}
                      />
                      <DetailRow label="Education" value={candidate.education} />
                      <DetailRow
                        label="Experience"
                        value={candidate.experience}
                      />
                    </div>

                    {candidate.permanentAddress || candidate.currentAddress ? (
                      <>
                        <SectionTitle>Address</SectionTitle>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <DetailRow
                            label="Permanent"
                            value={candidate.permanentAddress}
                          />
                          <DetailRow
                            label="Current"
                            value={candidate.currentAddress}
                          />
                        </div>
                      </>
                    ) : null}

                    {candidate.biography ? (
                      <>
                        <SectionTitle>Biography</SectionTitle>
                        <p className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-sm leading-relaxed text-slate-300">
                          {candidate.biography}
                        </p>
                      </>
                    ) : null}

                    {candidate.manifestoText ? (
                      <>
                        <SectionTitle>Manifesto</SectionTitle>
                        <p className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-sm leading-relaxed text-slate-300">
                          {candidate.manifestoText}
                        </p>
                      </>
                    ) : null}

                    {candidate.rejectionReason ? (
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        <span className="font-semibold">Rejection reason: </span>
                        {candidate.rejectionReason}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  Uploaded identity documents and supporting files
                </div>
                <DocumentGallery
                  documents={documents}
                  onView={(url) => setViewerUrl(url || null)}
                  onDownload={handleDownload}
                />
                {documents.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">
                    No documents have been uploaded for this record yet.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Modal>

      {viewerUrl ? (
        <Modal
          isOpen={Boolean(viewerUrl)}
          onClose={() => setViewerUrl(null)}
          title="Document preview"
          maxWidth="4xl"
        >
          <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-2xl bg-slate-950">
            <img
              src={viewerUrl}
              alt="Document preview"
              className="max-h-[65vh] max-w-full object-contain"
            />
          </div>
        </Modal>
      ) : null}
    </>
  );
}
