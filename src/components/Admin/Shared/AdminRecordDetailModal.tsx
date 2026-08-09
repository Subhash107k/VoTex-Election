import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Phone,
  Trash2,
  User as UserIcon,
  XCircle,
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
  onVerify?: (
    id: string,
    status: any,
    reason?: string,
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
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
  onVerify,
  onDelete,
}: AdminRecordDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "documents">(
    "overview",
  );
  const [voterData, setVoterData] = useState<any>(null);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Reject / Delete modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("Incomplete documentation or unreadable identity files.");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

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
      setShowRejectModal(false);
      setShowDeleteModal(false);
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
      const cand = candidateData.candidate;
      return normalizeProfilePayload({
        user: candidateData.user || {
          id: cand.id || cand.userId || "cand_user",
          fullName: cand.fullName || cand.name,
          email: cand.emailAddress || "",
          mobile: cand.contactNumber || "",
          profilePhoto: cand.photoUrl || cand.candidatePhoto || "",
          isVerified: true,
          isApproved: true,
          accountStatus: cand.status || "Verified",
        },
        profile: candidateData.profile,
        document: candidateData.document,
        candidate: cand,
      });
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

  const handleApproveAction = async () => {
    if (!recordId || !onVerify) return;
    setProcessingAction(true);
    try {
      if (type === "candidate") {
        await onVerify(recordId, "Verified");
      } else {
        await onVerify(recordId, {
          isApproved: true,
          isVerified: true,
          isSuspended: false,
          accountStatus: "Approved",
        });
      }
      await fetchDetails();
    } finally {
      setProcessingAction(false);
    }
  };

  const confirmRejectAction = async () => {
    if (!recordId || !onVerify) return;
    setProcessingAction(true);
    try {
      if (type === "candidate") {
        await onVerify(recordId, "Rejected", rejectReason);
      } else {
        await onVerify(recordId, {
          isApproved: false,
          isVerified: false,
          isSuspended: true,
          accountStatus: "Rejected",
          rejectionReason: rejectReason,
        });
      }
      setShowRejectModal(false);
      await fetchDetails();
    } finally {
      setProcessingAction(false);
    }
  };

  const confirmDeleteAction = async () => {
    if (!recordId || !onDelete) return;
    setProcessingAction(true);
    try {
      await onDelete(recordId);
      setShowDeleteModal(false);
      onClose();
    } finally {
      setProcessingAction(false);
    }
  };

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
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                {onVerify && status !== "Verified" && status !== "Approved" && (
                  <button
                    type="button"
                    disabled={processingAction}
                    onClick={handleApproveAction}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                    Approve
                  </button>
                )}
                {onVerify && status !== "Rejected" && (
                  <button
                    type="button"
                    disabled={processingAction}
                    onClick={() => setShowRejectModal(true)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <XCircle className="mr-1 inline h-3.5 w-3.5" />
                    Reject / Disapprove
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    disabled={processingAction}
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
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

      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject / Disapprove Record"
          maxWidth="lg"
        >
          <div className="space-y-4 font-sans">
            <p className="text-xs text-slate-300">
              Please enter the official rejection or disapproval reason message for{" "}
              <span className="font-bold text-white">{title}</span>. This message will be recorded in the system audit history.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Rejection Reason / Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                placeholder="e.g., Incomplete citizenship documentation, unreadable identity images, or invalid campaign details."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction || !rejectReason.trim()}
                onClick={confirmRejectAction}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {processingAction ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Record Confirmation"
          maxWidth="md"
        >
          <div className="space-y-4 font-sans">
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete record{" "}
              <span className="font-bold text-white">{title}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={confirmDeleteAction}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {processingAction ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
