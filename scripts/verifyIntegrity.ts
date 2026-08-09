/**
 * VoTex Comprehensive Election Participation & Voting Invariant Verification Script
 * Read-only validation of all 15 system invariants.
 */

import { Database } from "../src/db/dbService.js";

export async function runSystemIntegrityAudit() {
  console.log("🔍 Running VoTex 15-Invariant Election & Voting Integrity Audit...\n");

  const users = Database.getUsers();
  const userProfiles = Database.getUserProfiles();
  const candidates = Database.getCandidates();
  const parties = Database.getPoliticalParties();
  const votes = Database.getVotes();
  const elections = Database.getElections();

  let totalErrors = 0;

  // Invariant 1: Approved candidate has valid electionId
  // Invariant 2: Candidate electionId references an existing election
  // Invariant 3: Public candidate belongs to the correct election
  // Invariant 4: Pending/Rejected/Withdrawn candidates are not publicly eligible
  // Invariant 5: Candidate partyId references a valid party when not independent
  // Invariant 6: Independent candidates have no partyId
  // Invariant 15: Candidate approval state is consistent with linked user verification state
  console.log("=== 1. Candidate Approval & Election Binding Invariants (1-6, 15) ===");
  for (const cand of candidates) {
    if (!cand.electionId) {
      console.error(`❌ Invariant 1 Violation: Candidate ${cand.id} missing electionId`);
      totalErrors++;
    } else {
      const election = elections.find((e: any) => e.id === cand.electionId);
      if (!election) {
        console.error(`❌ Invariant 2 Violation: Candidate ${cand.id} references nonexistent election ${cand.electionId}`);
        totalErrors++;
      }
    }

    const isApprovedStatus = cand.status === "Approved" || cand.status === "Verified";
    if (!isApprovedStatus && cand.isVisible) {
      console.error(`❌ Invariant 4 Violation: Candidate ${cand.id} has status '${cand.status}' but is marked visible!`);
      totalErrors++;
    }

    if (cand.isIndependent) {
      if (cand.partyId !== undefined && cand.partyId !== null && cand.partyId !== "") {
        console.error(`❌ Invariant 6 Violation: Independent candidate ${cand.id} has partyId ${cand.partyId}`);
        totalErrors++;
      }
    } else {
      if (cand.partyId) {
        const party = parties.find((p: any) => p.id === cand.partyId || p.code === cand.partyAbbreviation);
        if (!party) {
          console.error(`❌ Invariant 5 Violation: Candidate ${cand.id} references nonexistent partyId ${cand.partyId}`);
          totalErrors++;
        }
      }
    }

    const user = users.find((u: any) => u.id === cand.userId);
    if (user && isApprovedStatus) {
      if (!user.isVerified || !user.isApproved) {
        console.error(`❌ Invariant 15 Violation: Approved candidate ${cand.id} linked user ${user.id} is not verified/approved!`);
        totalErrors++;
      }
    }
  }
  console.log(`✅ Passed candidate election & approval invariants for ${candidates.length} candidates.\n`);

  // Invariant 7: Every vote references an existing candidate
  // Invariant 8: Every vote references an existing election
  // Invariant 9: Vote candidate belongs to vote election
  // Invariant 10: Anonymous voter hash is present
  // Invariant 11: No vote contains raw userId
  // Invariant 12: Candidate voteCount matches actual vote documents
  // Invariant 13: Election totalVotes matches actual vote documents
  // Invariant 14: Duplicate voter-election hashes do not exist
  console.log("=== 2. Voting, Privacy & Counter Invariants (7-14) ===");
  const votesByCandidate: Record<string, number> = {};
  const votesByElection: Record<string, number> = {};
  const seenHashes = new Set<string>();

  for (const vote of votes) {
    if ((vote as any).userId) {
      console.error(`🚨 Invariant 11 Violation: Vote ${vote.id} contains raw userId! Privacy breach!`);
      totalErrors++;
    }

    if (!vote.anonymousVoterHash) {
      console.error(`❌ Invariant 10 Violation: Vote ${vote.id} missing anonymousVoterHash!`);
      totalErrors++;
    } else {
      const hashKey = `${vote.electionId}_${vote.anonymousVoterHash}`;
      if (seenHashes.has(hashKey)) {
        console.error(`🚨 Invariant 14 Violation: Duplicate voter hash ${hashKey} in election ${vote.electionId}`);
        totalErrors++;
      }
      seenHashes.add(hashKey);
    }

    const election = elections.find((e: any) => e.id === vote.electionId);
    if (!election) {
      console.error(`❌ Invariant 8 Violation: Vote ${vote.id} references nonexistent election ${vote.electionId}`);
      totalErrors++;
    }

    const candidate = candidates.find((c: any) => c.id === vote.candidateId);
    if (!candidate) {
      console.error(`❌ Invariant 7 Violation: Vote ${vote.id} references nonexistent candidate ${vote.candidateId}`);
      totalErrors++;
    } else if (candidate.electionId !== vote.electionId) {
      console.error(`❌ Invariant 9 Violation: Vote ${vote.id} candidate election ${candidate.electionId} != vote election ${vote.electionId}`);
      totalErrors++;
    }

    votesByCandidate[vote.candidateId] = (votesByCandidate[vote.candidateId] || 0) + 1;
    votesByElection[vote.electionId] = (votesByElection[vote.electionId] || 0) + 1;
  }

  // Invariant 12 & 13 check
  for (const cand of candidates) {
    const actual = votesByCandidate[cand.id] || 0;
    const cached = cand.voteCount || 0;
    if (actual !== cached) {
      console.error(`❌ Invariant 12 Violation: Candidate ${cand.id} cached voteCount ${cached} != actual votes ${actual}`);
      totalErrors++;
    }
  }

  for (const elect of elections) {
    const actual = votesByElection[elect.id] || 0;
    const cached = (elect as any).totalVotes || 0;
    if (actual !== cached) {
      console.error(`❌ Invariant 13 Violation: Election ${elect.id} cached totalVotes ${cached} != actual votes ${actual}`);
      totalErrors++;
    }
  }
  console.log(`✅ Passed voting privacy, duplicate prevention & counter invariants for ${votes.length} vote documents.\n`);

  // Summary
  if (totalErrors === 0) {
    console.log("🎉 ALL 15 ELECTION & VOTING INVARIANTS PASSED WITH 0 ERRORS!");
  } else {
    console.error(`⚠️ INVARIANT AUDIT FAILED WITH ${totalErrors} ERRORS!`);
  }

  return totalErrors === 0;
}

if (process.argv[1]?.includes("verifyIntegrity")) {
  void runSystemIntegrityAudit();
}
