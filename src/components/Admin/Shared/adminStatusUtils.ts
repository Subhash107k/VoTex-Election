import type { Candidate, User } from "../../../types.js";

export function getVoterStatus(voter: User): string {
  if (voter.isSuspended || voter.accountStatus === "Rejected") {
    return "Rejected";
  }
  return (
    voter.accountStatus ?? (voter.isApproved ? "Approved" : "Pending")
  );
}

export function isVoterApproved(voter: User): boolean {
  const status = getVoterStatus(voter);
  return status === "Approved" || status === "Active";
}

export function getCandidateStatus(candidate: Candidate): string {
  return candidate.status ?? candidate.candidateStatus ?? "Pending";
}

export function isCandidateApproved(candidate: Candidate): boolean {
  const status = getCandidateStatus(candidate);
  return status === "Verified" || status === "Approved";
}
